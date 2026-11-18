const assert=require('node:assert/strict');require('../public/js/data.js');for(const m of ['content','expeditions','migration','progression'])require('../public/js/v2/'+m+'.js');
const V=IT.V2;
let templates=0,decisions=0;
for(const world of V.WORLDS){
 const signatures=new Set();
 for(const t of V.TEMPLATES.filter(t=>t.worldId===world.id)){
  let s=V.createState();s.unlockedWorlds.push(world.id);s.claimedRewards=[...(t.requires||[])];s=V.startExpedition(s,t.id,{vehicleId:'walk',role:'researcher'},1).state;
  const seen=[];
  while(s.expedition.status!=='readyToClaim'){
   if(s.expedition.status==='awaitingChoice'){const node=t.nodes[s.expedition.nodeIndex];seen.push(node.choices.map(c=>c.text.en).join('/'));s=V.choose(s,node.choices[1].id).state;decisions++;}
   else s=V.advance(s,10000,{capSeconds:10000}).state;
  }
  s=V.claimExpedition(s).state;assert.equal(s.research,3);assert.ok(s.clues.includes(t.clueId));signatures.add(seen.join(' | '));templates++;
 }
 assert.equal(signatures.size,V.TEMPLATES.filter(t=>t.worldId===world.id).length,world.id+' must have three different missions');
}
assert.equal(templates,39);assert.equal(decisions,78);
console.log('PASS content: 39 distinct missions, 78 decisions, all conclusions reachable');

// Follow the normal unlock sequence without pre-opening worlds or granting rewards.
let journey = V.createState();
for (const [index, world] of V.WORLDS.entries()) {
  assert.ok(journey.unlockedWorlds.includes(world.id), `Could not reach ${world.id}`);
  const nextWorld = V.WORLDS[index + 1];
  if (nextWorld) assert.ok(!journey.unlockedWorlds.includes(nextWorld.id));
  const templates = V.TEMPLATES.filter(template => template.worldId === world.id);
  for (const template of templates) {
    journey = V.startExpedition(journey, template.id, { vehicleId: 'walk' }, 1).state;
    for (const node of template.nodes) {
      journey = V.advance(journey, 3600).state;
      if (node.choices) journey = V.choose(journey, node.choices[0].id).state;
    }
    assert.equal(journey.expedition.status, 'readyToClaim');
    journey = V.claimExpedition(journey).state;
  }
}
assert.equal(journey.unlockedWorlds.length, 12);
assert.equal(journey.claimedRewards.length, 39);
console.log('PASS campaign: Earth to the three post-story expeditions');
