const assert=require('node:assert/strict');
require('../public/js/data.js');
for(const mod of ['content','expeditions','migration','progression']) require('../public/js/v2/'+mod+'.js');
const V=IT.V2;
const far={v:3,distance:100000*IT.LY,lifeDist:100000*IT.LY,credits:1e23,owned:{walk:true,chrono:true},active:'chrono',levels:{chrono:200},player:{id:'abc',key:'test',name:'Test'},settings:{lang:'tr'},memories:200};
const migrated=V.migrateV3(far);
assert.equal(migrated.v,4); assert.deepEqual(V.migrateV3(migrated),migrated);
for(const key of Object.keys(far).filter(k=>k!=='v')) assert.deepEqual(migrated[key],far[key]);
assert.ok(migrated.v2.unlockedWorlds.includes('rim')); assert.equal(migrated.v2.research,0);
assert.deepEqual(migrated.v2.completedNodes,[]);
assert.throws(()=>V.migrateV3({v:5}));
assert.ok(!V.eligibility({...far,distance:100000*IT.LY*(1-1e-10),lifeDist:0}).includes('rim'));
assert.ok(V.eligibility({...far,distance:0,lifeDist:100000*IT.LY}).includes('rim'));
for(const vehicle of IT.VEHICLES) for(const score of Object.values(V.VEHICLE_ROLES[vehicle.id])) assert.ok(score>=1&&score<=5);
for(const w of V.WORLDS) { const list=V.TEMPLATES.filter(t=>t.worldId===w.id); assert.ok(list.length>=3); for(const t of list) assert.ok(t.nodes.filter(n=>n.choices?.length>=2).length>=2); }
let state=V.createState();
let tr=V.startExpedition(state,'earth-survey', {vehicleId:'walk',equipment:{},role:'guide',camp:state.camp},42);
assert.equal(state.expedition,null); assert.equal(tr.state.expedition.status,'traveling');
state=tr.state;
assert.deepEqual(V.advance(state,600,{capSeconds:1000}).state,Array.from({length:60}).reduce(s=>V.advance(s,10,{capSeconds:1000}).state,state));
state=V.advance(state,10000,{capSeconds:10000}).state;
assert.equal(state.expedition.status,'awaitingChoice');
assert.deepEqual(V.advance(state,10000,{capSeconds:10000}).state,state);
assert.deepEqual(V.advance(state,NaN).state,state);
assert.throws(()=>V.choose(state,'invalid'));
while(state.expedition.status!=='readyToClaim') {
 if(state.expedition.status==='awaitingChoice') { const t=V.TEMPLATES.find(t=>t.id===state.expedition.templateId); const n=t.nodes[state.expedition.nodeIndex]; state=V.choose(state,n.choices[0].id).state; }
 else state=V.advance(state,10000,{capSeconds:10000}).state;
}
state=V.claimExpedition(state).state;
assert.equal(state.expedition,null); assert.ok(state.research>0); assert.ok(state.clues.length);
assert.deepEqual(V.claimExpedition(state).state,state);
const firstResearch=state.research;
state=V.startExpedition(state,'earth-survey',{vehicleId:'walk',equipment:{},role:'guide',camp:state.camp},43).state;
while(state.expedition.status!=='readyToClaim') {
 if(state.expedition.status==='awaitingChoice') { const t=V.TEMPLATES.find(t=>t.id===state.expedition.templateId); state=V.choose(state,t.nodes[state.expedition.nodeIndex].choices[0].id).state; }
 else state=V.advance(state,10000,{capSeconds:10000}).state;
}
state=V.claimExpedition(state).state; assert.equal(state.research,firstResearch);
state.research=1000;
for(let i=0;i<10;i++) state=V.upgradeCamp(state,'workshop').state;
assert.equal(state.camp.workshop,5);
assert.equal(V.equip(state,'hull','reinforced').state.equipment.hull,'reinforced');
assert.throws(()=>V.equip(state,'hull','scanner'));
const dirty=V.sanitizeState({research:Infinity,camp:{workshop:999},worldId:'bogus',expedition:{templateId:'bogus'},claimedRewards:['fake']});
assert.equal(dirty.research,0);assert.equal(dirty.worldId,'earth');assert.equal(dirty.camp.workshop,5);assert.equal(dirty.expedition,null);
const invalidIds=V.sanitizeState({worldId:'constructor',unlockedWorlds:['cloud','constructor','toString'],claimedRewards:['earth-survey','constructor'],research:9});
assert.equal(invalidIds.worldId,'earth','invalid saved world must fall back to Earth');
assert.deepEqual(invalidIds.unlockedWorlds,['earth','cloud']);
assert.deepEqual(invalidIds.claimedRewards,['earth-survey']);
assert.equal(invalidIds.research,9);
let frontier=V.createState();frontier.unlockedWorlds.push('frontier');
assert.equal(V.availableTemplates(frontier,'frontier').length,3);
assert.throws(()=>V.startExpedition(frontier,'frontier-ocean',{vehicleId:'walk'},1));
frontier.claimedRewards.push('frontier-dawn');assert.equal(V.availableTemplates(frontier,'frontier').length,6);
assert.ok(V.startExpedition(frontier,'frontier-ocean',{vehicleId:'walk'},1).state.expedition);
console.log('PASS v2 core: migration, world graph, state machine, offline, rewards and camp');
