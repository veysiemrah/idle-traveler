/* V2 expedition transitions. Time is local work, never total travel distance. */
(function(root){
'use strict';
const V=root.IT.V2;
const copy=s=>JSON.parse(JSON.stringify(s));
const result=(state,effects=[],consumedSeconds=0)=>({state,effects,consumedSeconds});
const seconds=x=>Number.isFinite(x)&&x>0?x:0;
function sanitizeExpedition(raw,state){
 if(!raw||typeof raw!=='object')return null;
 if(raw.rewardClaimed===true)return null;
 const t=V.TEMPLATE[raw.templateId];
 if(!t||!state.unlockedWorlds.includes(t.worldId))return null;
 const index=Math.min(t.nodes.length-1,Math.floor(seconds(raw.nodeIndex))), node=t.nodes[index];
 const status=['traveling','awaitingChoice','readyToClaim'].includes(raw.status)?raw.status:'traveling';
 // Keep only verified coordinates and bounded work; malformed data cannot become a reward.
 const workRequired=node.seconds, workDone=Math.min(workRequired,seconds(raw.workDone));
 const validChoices=Array.isArray(raw.choices)&&raw.choices.length===index&&raw.choices.every((id,i)=>t.nodes[i]?.choices?.some(c=>c.id===id));
 if(index>0&&!validChoices)return null;
 const validStatus=status==='awaitingChoice'&&node.choices&&workDone>=workRequired?'awaitingChoice':status==='readyToClaim'&&index===t.nodes.length-1&&workDone>=workRequired?'readyToClaim':'traveling';
 const vehicleId=V.VEHICLE_ROLES[raw.loadout?.vehicleId]?raw.loadout.vehicleId:'walk';
 const stats=Object.fromEntries(['explore','cargo','endurance','range'].map(k=>[k,Math.max(1,Math.min(5,seconds(raw.loadout?.stats?.[k])||1))]));
 return {id:typeof raw.id==='string'?raw.id.slice(0,80):'recovered',templateId:t.id,nodeId:node.id,nodeIndex:index,status:validStatus,workDone,workRequired,workRate:Math.max(0.5,Math.min(1.4,seconds(raw.workRate)||1)),creditRate:Math.min(1e290,seconds(raw.creditRate)),loadout:{vehicleId,role:['guide','engineer','researcher'].includes(raw.loadout?.role)?raw.loadout.role:'guide',stats},choices:Array.isArray(raw.choices)?raw.choices.filter(x=>typeof x==='string').slice(0,2):[],seed:seconds(raw.seed),resources:{energy:Math.min(5,seconds(raw.resources?.energy)),cargo:Math.min(10,seconds(raw.resources?.cargo)),scan:Math.min(2,seconds(raw.resources?.scan)),signals:Math.min(2,seconds(raw.resources?.signals)),stability:Math.min(2,seconds(raw.resources?.stability))},slot:Number.isInteger(raw.slot)&&raw.slot>=0&&raw.slot<3?raw.slot:undefined,rewardClaimed:false,bonus:Math.min(2,seconds(raw.bonus))};
}
function startExpedition(state,templateId,loadout={},seed=1){
 const t=V.TEMPLATE[templateId];
 if(!t||!state.unlockedWorlds.includes(t.worldId)||t.requires?.some(id=>!state.claimedRewards.includes(id)))throw Error('Locked expedition');
 if(state.expedition)throw Error('Expedition already active');

 const usedIds=new Set([state.expedition,...state.fleet].filter(Boolean).map(e=>e.id));
 const s=copy(state);while(usedIds.has('exp-'+s.nextId))s.nextId++;
 const stats=V.loadoutStats?V.loadoutStats(loadout.vehicleId,loadout.equipment,loadout.role,s.camp):V.VEHICLE_ROLES[loadout.vehicleId]||V.VEHICLE_ROLES.walk;
 s.worldId=t.worldId;
 s.expedition={id:'exp-'+s.nextId++,templateId,nodeId:t.nodes[0].id,nodeIndex:0,status:'traveling',workDone:0,workRequired:t.nodes[0].seconds,workRate:1,creditRate:Math.min(1e290,seconds(loadout.creditRate)),loadout:{vehicleId:loadout.vehicleId||'walk',role:loadout.role||'guide',stats},choices:[],seed:seconds(seed),resources:{energy:3,cargo:0,scan:0,signals:0,stability:0},rewardClaimed:false,bonus:0};
 return result(s);
}
function advance(state,elapsed,options={}){
 const budget=Math.min(seconds(elapsed),options.capSeconds===undefined?28800:seconds(options.capSeconds));
 const e=state.expedition;if(!e||e.status!=='traveling'||!budget)return result(state);
 const s=copy(state), x=s.expedition, t=V.TEMPLATE[x.templateId];
 const spent=Math.min(budget,Math.max(0,(x.workRequired-x.workDone)/x.workRate));
 x.workDone=Math.min(x.workRequired,x.workDone+spent*x.workRate);
 if(x.workDone>=x.workRequired-1e-8){x.workDone=x.workRequired;x.status=t.nodes[x.nodeIndex].choices?'awaitingChoice':'readyToClaim';}
 return result(s,[],spent);
}
function choose(state,choiceId){
 const e=state.expedition;if(!e||e.status!=='awaitingChoice')throw Error('No choice pending');
 const t=V.TEMPLATE[e.templateId],node=t.nodes[e.nodeIndex],choice=node.choices.find(c=>c.id===choiceId);
 if(!choice)throw Error('Invalid choice');
 const s=copy(state),x=s.expedition,ability=x.loadout.stats[choice.ability],prepared=ability>=3&&x.resources.energy>=choice.energy;
 x.choices.push(choice.id); x.resources.energy=Math.max(0,x.resources.energy-(prepared?choice.energy:0));
 if(choice.safe){x.resources.energy=Math.min(5,x.resources.energy+1);x.resources.cargo=Math.min(10,x.resources.cargo+1);}
 if(choice.reveal&&prepared)x.bonus=Math.min(2,x.bonus+1);
 x.workRate=choice.safe?0.9:prepared?1.25:0.75;
 // Each world changes the expedition's local rules; none changes permanent base income.
 if(t.worldId==='upper'&&choice.safe)x.resources.energy=Math.min(5,x.resources.energy+1);
 if(t.worldId==='planets'&&choice.safe)x.resources.cargo=Math.min(10,x.resources.cargo+2);
 if(t.worldId==='nebula'&&choice.reveal&&prepared)x.resources.scan=Math.min(2,x.resources.scan+1);
 if(t.worldId==='nebula'&&x.resources.scan)x.workRate=Math.min(1.4,x.workRate+.1*x.resources.scan);
 if(t.worldId==='deep'&&!choice.safe&&prepared)x.resources.energy=Math.max(0,x.resources.energy-1);
 if(t.worldId==='storm')x.workRate=choice.safe?0.85:prepared&&x.loadout.stats.endurance>=3?1.35:0.65;
 if(t.worldId==='rim'&&prepared)x.resources.signals=Math.min(2,x.resources.signals+1);
 if(t.worldId==='void'&&choice.safe)x.resources.energy=Math.min(5,x.resources.energy+1);
 if(t.worldId==='fracture'){
  const stable=x.loadout.stats.endurance>=3||x.loadout.stats.explore>=4;
  x.resources.stability=Math.min(2,x.resources.stability+(stable?1:0));
  x.workRate=choice.safe?0.9:stable?1.4:0.6;
 }
 if(t.worldId==='frontier'&&prepared)x.resources.signals=Math.min(2,x.resources.signals+1);
 x.nodeIndex++;const next=t.nodes[x.nodeIndex];x.nodeId=next.id;x.workDone=0;x.workRequired=next.seconds;x.status='traveling';
 s.completedNodes=[...new Set([...s.completedNodes,node.id])];
 return result(s,[{type:prepared?'prepared':'safeReturn',payload:{choiceId}}]);
}
function claimExpedition(state){
 if(!state.expedition||state.expedition.status!=='readyToClaim')return result(state);
 const s=copy(state),e=s.expedition,t=V.TEMPLATE[e.templateId];
 const fresh=!s.claimedRewards.includes(t.id);
 if(fresh){s.claimedRewards.push(t.id);s.research+=t.research;s.clues=[...new Set([...s.clues,t.clueId])];}
 s.completedNodes=[...new Set([...s.completedNodes,e.nodeId])];
 const world=V.WORLD[t.worldId];
 if(world.next&&V.TEMPLATES.filter(q=>q.worldId===world.id).every(q=>s.claimedRewards.includes(q.id)))s.unlockedWorlds=[...new Set([...s.unlockedWorlds,world.next])];
 s.expedition=null;
 // Repeat rewards are a bounded amount of base income, calculated by the adapter.
 return result(s,[{type:'credits',payload:{baseSeconds:Math.min(240,60+e.bonus*30+e.resources.cargo*10+e.resources.signals*10),amount:e.creditRate*Math.min(240,60+e.bonus*30+e.resources.cargo*10+e.resources.signals*10)}},{type:'discovery',payload:{fresh,clueId:t.clueId}}]);
}
function abandonExpedition(state){if(!state.expedition)return result(state);const s=copy(state);s.expedition=null;return result(s);}
function startFleet(state,slot,templateId,role,seed,creditRate=0){
 if(!state.unlockedWorlds.includes('galaxies')||!Number.isInteger(slot)||slot<0||slot>2)throw Error('Fleet locked');
 if(!['guide','engineer','researcher'].includes(role))throw Error('Invalid role');
 if(state.fleet.some(e=>e.slot===slot||e.loadout.role===role))throw Error('Crew or slot busy');
 const original=state.expedition, worldId=state.worldId;
 const temporary=copy(state);
 const reserved=new Set([state.expedition,...state.fleet].filter(Boolean).map(e=>e.id));
 while(reserved.has('exp-'+temporary.nextId))temporary.nextId++;
 temporary.expedition=null;
 const vehicleId={guide:'sail',engineer:'startrain',researcher:'chrono'}[role];
 const tr=startExpedition(temporary,templateId,{vehicleId,equipment:state.equipment,role,camp:state.camp,creditRate},seed);
 const ship=tr.state.expedition;ship.slot=slot;tr.state.fleet.push(ship);tr.state.expedition=original;tr.state.worldId=worldId;
 return tr;
}
function fleetAction(state,slot,action,id){
 const index=state.fleet.findIndex(e=>e.slot===slot);if(index<0)throw Error('Missing ship');
 const temporary=copy(state),original=temporary.expedition;temporary.expedition=temporary.fleet.splice(index,1)[0];
 const fn={choose,claim:claimExpedition,abandon:abandonExpedition}[action];if(!fn)throw Error('Invalid fleet action');
 const tr=fn(temporary,id);if(tr.state.expedition)tr.state.fleet.splice(index,0,tr.state.expedition);tr.state.expedition=original;return tr;
}
function advanceAll(state,elapsed,options){
 let tr=advance(state,elapsed,options),s=tr.state;
 for(let i=0;i<s.fleet.length;i++){
  const temporary=copy(s),original=temporary.expedition;temporary.expedition=temporary.fleet[i];
  const ship=advance(temporary,elapsed,options);ship.state.fleet[i]=ship.state.expedition;ship.state.expedition=original;s=ship.state;
 }
 return result(s,[],tr.consumedSeconds);
}
Object.assign(V,{startFleet,fleetAction,advanceAll,sanitizeExpedition,startExpedition,advance,choose,claimExpedition,abandonExpedition});
})(typeof window!=='undefined'?window:globalThis);
