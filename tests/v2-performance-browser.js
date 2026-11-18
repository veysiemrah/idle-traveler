'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('./lib/pw');
require('../public/js/data.js');for(const m of ['content','expeditions','migration','progression'])require('../public/js/v2/'+m+'.js');
(async()=>{
 let state=IT.V2.createState();state.unlockedWorlds=IT.V2.WORLDS.map(w=>w.id);state=IT.V2.startExpedition(state,'galaxies-chart',{vehicleId:'chrono',role:'guide'},1).state;
 for(let slot=0;slot<3;slot++)state=IT.V2.startFleet(state,slot,'galaxies-fleet',['guide','engineer','researcher'][slot],slot+1).state;
 const seed={v:4,v2:state,intro:true,lastSeen:Date.now(),seenVer:'99',player:{id:'12345678-1234-4123-a123-123456789abc',key:'a'.repeat(64),name:'Gezgin'},credits:1e23,distance:100000*IT.LY,owned:{walk:true,chrono:true},levels:{chrono:10},active:'chrono',settings:{sfx:false,music:false}};
 const b=await chromium.launch();
 try{
  const p=await b.newPage({viewport:{width:390,height:844},locale:'tr-TR'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://**/*',r=>r.abort());
  await p.addInitScript(d=>localStorage.setItem('idle-traveler-save-v1',JSON.stringify(d)),seed);
  await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(500);
  const samples=await p.evaluate(()=>new Promise(resolve=>{
   const times=[];let start,last;
   function collect(now){if(start===undefined){start=last=now;}else{times.push(now-last);last=now;}if(now-start>=60000)resolve(times);else requestAnimationFrame(collect);}
   requestAnimationFrame(collect);
  }));
  samples.sort((a,b)=>a-b);const p95=samples[Math.floor(samples.length*.95)];
  assert.ok(p95<33,'p95 frame time '+p95+'ms');assert.deepEqual(errors,[]);
  const report={date:new Date().toISOString(),viewport:'390x844',world:'galaxies',main:1,fleet:3,seconds:60,frames:samples.length,p95ms:p95};
  fs.writeFileSync(path.join(process.env.SP,'v2-performance.json'),JSON.stringify(report,null,2));console.log('PASS performance',JSON.stringify(report));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
