/* V2 save migration. Does not write storage or touch the DOM. */
(function(root){
'use strict';
const V=root.IT.V2;
const clone=x=>JSON.parse(JSON.stringify(x));
const list=(x,valid)=>Array.isArray(x)?[...new Set(x.filter(i=>typeof i==='string'&&valid(i)))]:[];
function createState(){return {schema:1,worldId:'earth',unlockedWorlds:['earth'],completedNodes:[],claimedRewards:[],research:0,camp:{workshop:0,observatory:0,dock:0},equipment:{hull:null,utility:null},roles:{},clues:[],expedition:null,fleet:[],onboardingSeen:false,nextId:1,lastAdvancedAt:0,saveRevision:0,rollbackWork:0};}
function sanitizeState(raw){
 const d=raw&&typeof raw==='object'?raw:{}, s=createState();
 s.unlockedWorlds=[...new Set(['earth',...list(d.unlockedWorlds,id=>!!V.WORLD[id])])];
 s.worldId=s.unlockedWorlds.includes(d.worldId)?d.worldId:'earth';
 s.completedNodes=list(d.completedNodes,id=>V.TEMPLATES.some(t=>t.nodes.some(n=>n.id===id)));
 s.claimedRewards=list(d.claimedRewards,id=>!!V.TEMPLATE[id]);
 s.clues=list(d.clues,id=>V.TEMPLATES.some(t=>t.clueId===id));
 s.research=Math.min(100000,Math.floor(V.n(d.research)));
 for(const id of Object.keys(s.camp)) s.camp[id]=Math.min(5,Math.floor(V.n(d.camp?.[id])));
 for(const slot of ['hull','utility']) if(V.EQUIPMENT?.[slot]?.some(e=>e.id===d.equipment?.[slot]))s.equipment[slot]=d.equipment[slot];
 s.nextId=Math.max(1,Math.min(1e12,Math.floor(V.n(d.nextId))));
 s.saveRevision=Math.min(1e12,Math.floor(V.n(d.saveRevision)));
 s.rollbackWork=Math.min(172800,V.n(d.rollbackWork));
 s.lastAdvancedAt=Math.min(V.n(d.lastAdvancedAt),Date.now()+172800000);
 s.onboardingSeen=d.onboardingSeen===true;
 const clean=e=>V.sanitizeExpedition?V.sanitizeExpedition(e,s):null;
 s.expedition=clean(d.expedition);
 const slots=new Set(), roles=new Set(), identities=new Set(s.expedition?[s.expedition.id]:[]);
 s.fleet=s.unlockedWorlds.includes('galaxies')&&Array.isArray(d.fleet)?d.fleet.map(clean).filter(e=>{
  if(!e||!Number.isInteger(e.slot)||slots.has(e.slot)||roles.has(e.loadout.role)||identities.has(e.id))return false;
  slots.add(e.slot);roles.add(e.loadout.role);identities.add(e.id);return true;
 }).slice(0,3):[];
 const activeIds=[s.expedition,...s.fleet].filter(Boolean).map(e=>Number(/^exp-(\d+)$/.exec(e.id)?.[1]||0));
 s.nextId=Math.max(s.nextId,...activeIds.map(id=>Math.min(1e12,id+1)));
 return s;
}
function migrateV3(save){
 if(!save||typeof save!=='object'||Array.isArray(save))throw Error('Invalid save');
 if(+save.v>4)throw Error('Unsupported future save');
 const s=clone(save); s.v=4; s.v2=sanitizeState(save.v2);
 if(!save.v2?.lastAdvancedAt)s.v2.lastAdvancedAt=V.n(save.lastSeen);
 s.v2.unlockedWorlds=[...new Set([...s.v2.unlockedWorlds,...V.eligibility(save)])];
 if(!save.v2){const entries=V.eligibility(save);s.v2.worldId=entries[entries.length-1];}
 return s;
}
Object.assign(V,{createState,sanitizeState,migrateV3,clone});
})(typeof window!=='undefined'?window:globalThis);
