/* Bounded equipment and camp progression. */
(function(root){
'use strict';
const V=root.IT.V2;
const EQUIPMENT={hull:[{id:'light',ability:'range'},{id:'reinforced',ability:'endurance'},{id:'freight',ability:'cargo'}],utility:[{id:'scanner',ability:'explore'},{id:'reserve',ability:'range'},{id:'rigging',ability:'cargo'}]};
const COSTS=[3,5,7,9,11];
function loadoutStats(vehicleId,equipment={},role='guide',camp={}){
 const stats={...(V.VEHICLE_ROLES[vehicleId]||V.VEHICLE_ROLES.walk)};
 for(const slot of ['hull','utility']){const item=EQUIPMENT[slot].find(x=>x.id===equipment?.[slot]);if(item)stats[item.ability]++;}
 const ability={guide:'range',engineer:'endurance',researcher:'explore'}[role];if(ability)stats[ability]++;
 stats.explore+=Math.min(5,V.n(camp.observatory))*.2;stats.endurance+=Math.min(5,V.n(camp.workshop))*.2;stats.cargo+=Math.min(5,V.n(camp.dock))*.2;
 return Object.fromEntries(Object.entries(stats).map(([k,x])=>[k,Math.round(Math.min(5,x)*10)/10]));
}
function upgradeCamp(state,id){
 if(!Object.hasOwn(state.camp,id))throw Error('Invalid building');
 const l=state.camp[id];if(l>=5||state.research<COSTS[l])return {state,effects:[],consumedSeconds:0};
 const s=V.clone(state);s.research-=COSTS[l];s.camp[id]++;return {state:s,effects:[],consumedSeconds:0};
}
function equip(state,slot,id){
 if(!EQUIPMENT[slot]?.some(x=>x.id===id))throw Error('Invalid equipment');
 if(state.expedition)throw Error('Return to camp first');
 const s=V.clone(state);s.equipment[slot]=id;return {state:s,effects:[],consumedSeconds:0};
}
Object.assign(V,{EQUIPMENT,COSTS,loadoutStats,upgradeCamp,equip});
})(typeof window!=='undefined'?window:globalThis);
