const assert=require('node:assert/strict');require('../public/js/data.js');for(const m of ['content','expeditions','migration','progression'])require('../public/js/v2/'+m+'.js');
const V=IT.V2;
function choice(world,vehicle='walk',safe=false){let s=V.createState();s.unlockedWorlds.push(world);const t=V.TEMPLATES.find(t=>t.worldId===world);s=V.startExpedition(s,t.id,{vehicleId:vehicle,role:'researcher'},1).state;s=V.advance(s,10000,{capSeconds:10000}).state;const options=t.nodes[0].choices;return V.choose(s,options.find(c=>c.safe===safe).id).state.expedition;}
assert.equal(choice('upper','walk',true).resources.energy,5);
assert.equal(choice('nebula','chrono').resources.scan,1);
assert.equal(choice('planets','van',true).resources.cargo,3);
assert.equal(choice('deep','chrono').resources.energy,1);
assert.ok(choice('fracture','horse').resources.stability>=1);
assert.ok(choice('rim','chrono').resources.signals>=1);
console.log('PASS mechanics: energy, scanning, supply, deep reserves, stability and signals');
