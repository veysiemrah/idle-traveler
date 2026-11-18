const assert=require('node:assert/strict');require('../public/js/data.js');for(const m of ['content','expeditions','migration','progression'])require('../public/js/v2/'+m+'.js');const V=IT.V2;
let min=Infinity,max=0;
for(const template of V.TEMPLATES){
 for(const vehicle of ['walk','van','chrono'])for(const safe of [false,true]){
  let s=V.createState();s.unlockedWorlds=V.WORLDS.map(w=>w.id);s.claimedRewards=[...(template.requires||[])];s=V.startExpedition(s,template.id,{vehicleId:vehicle,role:'researcher',creditRate:10},1).state;let elapsed=0;
  while(s.expedition.status!=='readyToClaim'){
   if(s.expedition.status==='awaitingChoice'){const n=template.nodes[s.expedition.nodeIndex];s=V.choose(s,n.choices.find(c=>c.safe===safe).id).state;}
   else {const tr=V.advance(s,1e6,{capSeconds:1e6});elapsed+=tr.consumedSeconds;s=tr.state;}
  }
  const long=V.WORLD[template.worldId].index>=7;
  assert.ok(elapsed>=(long?1800:600)&&elapsed<=(long?3600:1200),template.id+' '+vehicle+' '+elapsed);
  const e=V.claimExpedition(s).effects.find(e=>e.type==='credits');assert.ok(e.payload.amount<=2400);
  const paid=V.clone(s);paid.expedition.rewardClaimed=true;assert.equal(V.sanitizeState(paid).expedition,null);
  min=Math.min(min,elapsed);max=Math.max(max,elapsed);
 }
}
assert.ok(V.TEMPLATES.find(t=>t.id==='earth-survey').nodes[0].seconds>=300);
console.log('PASS balance: 234 routes, min '+Math.round(min)+'s max '+Math.round(max)+'s, bounded snapshot rewards');
