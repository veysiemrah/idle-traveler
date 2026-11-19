'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require('./lib/pw');
require('../public/js/data.js');
const root=path.resolve(__dirname,'../public');
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(err?'':data);});
});
const base={v:3,intro:true,lastSeen:Date.now(),seenVer:'99',player:{id:'12345678-1234-4123-a123-123456789abc',key:'a'.repeat(64),name:'Gezgin'},credits:1e23,owned:{walk:true,balloon:true,chrono:true},levels:{chrono:10},active:'chrono',distance:100000*IT.LY,lifeDist:100000*IT.LY,regionIdx:27,msIdx:99,unitTip:2,settings:{sfx:false,music:false}};

async function finishLeg(page,nextAction){
 await page.clock.fastForward(3600000);
 await nextAction.waitFor({state:'visible'});
 const resume=page.locator('#modal:not([hidden]) #modalBtn').filter({hasText:/^(Keep going|Yola devam et)$/});
 if(await resume.isVisible())await resume.click();
 await nextAction.click();
}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await pw.chromium.launch();
 try{
  const errors=[];
  async function open(save,options={}, blockBackup=false, hotSave=null, fallback=null, corruptMain=false, noStorage=false, blockMirror=false){
   const page=await browser.newPage({locale:'tr-TR',viewport:{width:1100,height:760},...options});
   page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.addInitScript(d=>{if(!sessionStorage.seed){localStorage.setItem('idle-traveler-save-v1',JSON.stringify(d));sessionStorage.seed='1';}},save);
   if(blockMirror)await page.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='idle-traveler-save-v1-v4')throw new DOMException('Quota','QuotaExceededError');return set.call(this,k,v);};});
   if(corruptMain)await page.addInitScript(()=>localStorage.setItem('idle-traveler-save-v1','{broken'));
   if(noStorage)await page.addInitScript(()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='idle-traveler-save-v1')throw new DOMException('Blocked','SecurityError');return get.call(this,k);};});
   if(hotSave||fallback) await page.addInitScript(({hotSave,fallback})=>{
    if(hotSave)window.claude={hot:{data:{save:hotSave}}};
    if(fallback&&!sessionStorage.fallback){localStorage.setItem('idle-traveler-save-v1','{broken');localStorage.setItem('idle-traveler-save-v1-bak',JSON.stringify(fallback));sessionStorage.fallback='1';}
   },{hotSave,fallback});
   if(blockBackup) await page.addInitScript(()=>{ const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(k.endsWith('-pre-v2'))throw new DOMException('Quota exceeded','QuotaExceededError');return original.call(this,k,v);}; });
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(250);return page;
  }
  const newcomer=await open({v:3,intro:false,lastSeen:Date.now()},{viewport:{width:320,height:640}});
  assert.match(await newcomer.locator('#modalBody h2').innerText(),/Idle Traveler 2/);
  assert.match(await newcomer.locator('#modalBody').innerText(),/39 sefer/);
  await newcomer.selectOption('#introLang','en');
  assert.match(await newcomer.locator('#modalBody').innerText(),/39 expeditions/);
  await newcomer.locator('#modalBtn').click();
  await newcomer.locator('#nameInput').fill('Traveler');
  await newcomer.locator('#modalBtn').click();
  await newcomer.reload();
  assert.equal(await newcomer.locator('#modal').isHidden(),true);
  await newcomer.clock.install();
  await newcomer.locator('.tab[data-id="voyage"]').click();
  await newcomer.getByRole('button',{name:'Open the Atlas'}).click();
  const firstWorkshop=newcomer.locator('[data-v2="upgradeCamp"][data-key="workshop"]');
  const firstAtlas=newcomer.locator('#pane-atlas');
  assert.match(await firstAtlas.innerText(),/0\/3 first discoveries/);
  await newcomer.locator('.tab[data-id="camp"]').click();
  assert.ok(await firstWorkshop.isDisabled());
  await newcomer.getByRole('button',{name:'Open the Atlas'}).click();
  const cloudEntry=firstAtlas.locator('.v2-world-list li').filter({has:newcomer.getByRole('heading',{name:'Cloud Islands',exact:true})});
  assert.match(await cloudEntry.innerText(),/hot air balloon/i);
  for(const [index,id] of ['earth-survey','earth-delivery','earth-pass'].entries()){
   await firstAtlas.locator('[data-v2="start"][data-key="'+id+'"]').click();
   for(let fork=0;fork<2;fork++){
    await finishLeg(newcomer,newcomer.locator('[data-v2="choose"]').last());
   }
   await finishLeg(newcomer,newcomer.locator('[data-v2="claim"]'));
   await newcomer.getByRole('button',{name:'Open the Atlas'}).click();
   assert.match(await firstAtlas.innerText(),new RegExp((index+1)+'/3 first discoveries'));
  }
  await cloudEntry.locator('[data-v2="selectWorld"]').click();
  assert.match(await firstAtlas.locator('h2').innerText(),/Cloud Islands/);
  assert.equal(await newcomer.locator('.panes').evaluate(el=>el.scrollTop),0,'visiting a region should reveal its atlas heading');
  await newcomer.locator('.tab[data-id="camp"]').click();
  await firstWorkshop.click();
  await newcomer.locator('[data-v2="equip"][data-key="scanner"]').click();
  await newcomer.reload();
  assert.match(await newcomer.locator('.v2-building').first().innerText(),/1\/5/);
  assert.equal(await newcomer.locator('[data-v2="equip"][data-key="scanner"]').getAttribute('aria-pressed'),'true');
  await newcomer.close();
  const returning=await open({...base,seenVer:'1.66'});
  assert.match(await returning.locator('#modalBody h2').innerText(),/Idle Traveler 2/);
  await returning.locator('#modalBtn').click();
  await returning.reload();
  assert.equal(await returning.locator('#modal').isHidden(),true);
  await returning.close();
  const p=await open(base);
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1-pre-v2')).v),3);
  await p.locator('.tab[data-id="atlas"]').click();
  assert.match(await p.locator('#pane-atlas h2').innerText(),/Galaksinin/);
  assert.match(await p.locator('#pane-atlas').innerText(),/0\/3 ilk keşif/);
  assert.match(await p.locator('#pane-atlas').innerText(),/Sinyali çözmek/);
  await p.locator('[data-v2="start"][data-key="rim-signal"]').click();
  assert.equal(await p.locator('#pane-voyage').isVisible(),true);
  await p.locator('.tab[data-id="atlas"]').click();
  assert.equal(await p.locator('[data-v2="start"][data-key="rim-signal"]').isDisabled(),true);
  await p.getByRole('button',{name:'Seferi Yolculuk’ta aç'}).click();
  assert.equal(await p.locator('#pane-voyage').isVisible(),true);
  await p.locator('.tab[data-id="camp"]').click();
  assert.match(await p.locator('#pane-camp').innerText(),/İlk kez bitirdiğin seferlerin ödülünü/);
  assert.match(await p.locator('#pane-camp').innerText(),/Seferin bitince ekipman değiştirebilirsin/);
  await p.getByRole('button',{name:'Seferi Yolculuk’ta aç'}).click();
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  let saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(saved.v,4);assert.equal(saved.v2.expedition.templateId,'rim-signal');assert.equal(saved.player.name,'Gezgin');
  await p.reload();await p.waitForTimeout(200);
  saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(saved.v2.expedition.templateId,'rim-signal');
  assert.equal(await p.locator('#pane-voyage').isVisible(),true);
  // Seed a real engine-produced pending choice, then exercise the DOM action.
  const choiceSave=await p.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('idle-traveler-save-v1'));
   s.v2=IT.V2.advance(s.v2,10000,{capSeconds:10000}).state;s.lastSeen=Date.now();return s;
  });
  const q=await open(choiceSave);
  await q.locator('.tab[data-id="voyage"]').click();
  assert.equal(await q.locator('#pane-voyage [data-v2="choose"]').count(),2);
  assert.match(await q.locator('#pane-voyage [data-v2="choose"]').filter({hasText:'Gerekli'}).innerText(),/3\+.*enerji/su);
  await q.locator('#pane-voyage [data-v2="choose"]').first().click();
  assert.equal(await q.locator('#pane-voyage [data-v2="choose"]').count(),0);
  const next=await q.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(next.v2.expedition.nodeIndex,1);
  await q.locator('#btnPhoto').click();
  const album=await q.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-album')));
  assert.match(album[0].region,/Galaksinin/,'postcard must name current world');
  await q.close();
  const readySave=await p.evaluate(seed=>{
   while(seed.v2.expedition.status!=='readyToClaim'){
    if(seed.v2.expedition.status==='awaitingChoice'){const t=IT.V2.TEMPLATE[seed.v2.expedition.templateId];seed.v2=IT.V2.choose(seed.v2,t.nodes[seed.v2.expedition.nodeIndex].choices[0].id).state;}
    else seed.v2=IT.V2.advance(seed.v2,10000,{capSeconds:10000}).state;
   }
   seed.lastSeen=Date.now();seed.v2.lastAdvancedAt=Date.now();return seed;
  },next);
  const claimPage=await open(readySave);
  await claimPage.locator('.tab[data-id="voyage"]').click();await claimPage.locator('[data-v2="claim"]').click();
  await claimPage.locator('.tab[data-id="camp"]').click();await claimPage.locator('[data-v2="upgradeCamp"][data-key="workshop"]').click();
  await claimPage.locator('[data-v2="equip"][data-key="scanner"]').click();
  const completed=await claimPage.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(completed.v2.expedition,null);assert.equal(completed.v2.camp.workshop,1);assert.equal(completed.v2.research,0);assert.equal(completed.v2.equipment.utility,'scanner');assert.ok(completed.v2.clues.includes('rim-0'));
  await claimPage.locator('.tab[data-id="atlas"]').click();
  assert.match(await claimPage.locator('#pane-atlas').innerText(),/1\/3 ilk keşif/);
  assert.match(await claimPage.locator('[data-v2="start"][data-key="rim-signal"]').innerText(),/Yeniden/);
  await claimPage.close();
  const fleetSeed=await p.evaluate(seed=>{
   seed.v2.unlockedWorlds.push('galaxies');
   seed.v2=IT.V2.startFleet(seed.v2,0,'rim-signal','guide',1).state;
   seed.lastSeen=Date.now();return seed;
  }, readySave);
  const fleetPage=await open(fleetSeed);
  await fleetPage.locator('.tab[data-id="atlas"]').click();
  assert.match(await fleetPage.locator('#pane-atlas').innerText(),/1\/3 gemi görevde/);
  const fleetButton=fleetPage.locator('[data-v2="startFleet"][data-key="rim-signal"]');
  assert.equal(await fleetButton.isDisabled(),true);
  assert.match(await fleetPage.locator('#pane-atlas').innerText(),/Bu rol başka bir/);
  await fleetPage.selectOption('#v2Role','researcher');
  assert.equal(await fleetButton.isEnabled(),true);
  await fleetButton.click();
  assert.match(await fleetPage.locator('#pane-atlas').innerText(),/2\/3 gemi görevde/);
  await fleetPage.getByRole('button',{name:'Filoyu Yolculuk’ta aç'}).click();
  assert.match(await fleetPage.evaluate(()=>document.activeElement.textContent),/Keşif filosu/);
  await fleetPage.locator('.tab[data-id="atlas"]').click();
  await fleetPage.getByRole('button',{name:'Seferi Yolculuk’ta aç'}).click();
  await fleetPage.locator('[data-v2="claim"]').click();
  await fleetPage.locator('.tab[data-id="atlas"]').click();
  await fleetPage.getByRole('button',{name:'Filoyu Yolculuk’ta aç'}).click();
  assert.match(await fleetPage.evaluate(()=>document.activeElement.textContent),/Keşif filosu/);
  await fleetPage.clock.install();
  for(let fork=0;fork<2;fork++){
   await finishLeg(fleetPage,fleetPage.locator('[data-v2="fleetChoose"][data-slot="1"]').last());
  }
  await finishLeg(fleetPage,fleetPage.locator('[data-v2="fleetClaim"][data-slot="1"]'));
  await fleetPage.reload();
  assert.equal(await fleetPage.locator('[data-fleet-progress]').count(),1);
  await fleetPage.locator('.tab[data-id="atlas"]').click();
  assert.match(await fleetPage.locator('#pane-atlas').innerText(),/1\/3 gemi görevde/);
  await fleetPage.close();
  const legacy=await open(next);
  await legacy.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await legacy.evaluate(()=>{const key='idle-traveler-save-v1';const s=JSON.parse(localStorage.getItem(key));s.v=3;delete s.v2;localStorage.setItem(key,JSON.stringify(s));});
  await legacy.reload();await legacy.waitForTimeout(250);await legacy.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const recovered=await legacy.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(recovered.v,4);assert.equal(recovered.v2.expedition.nodeIndex,1,'legacy writer cannot erase V2 expedition');await legacy.close();
  // Settle the waiting interval BEFORE a user choice, including a suspended RAF.
  const clock=await open(choiceSave);
  await clock.locator('.tab[data-id="voyage"]').click();
  await clock.evaluate(()=>{window.requestAnimationFrame=cb=>{window.pendingFrame=cb;return 1;};});
  await clock.waitForTimeout(80);
  await clock.evaluate(()=>{const nativeNow=Date.now;Date.now=()=>nativeNow()+600000;});
  await clock.locator('#pane-voyage [data-v2="choose"]').first().click();
  const afterAction=await clock.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.equal(afterAction.v2.expedition.nodeIndex,1);
  assert.equal(afterAction.v2.expedition.workDone,0,'waiting time must not leak into next leg');
  await clock.evaluate(()=>{if(window.pendingFrame)window.pendingFrame(performance.now());window.dispatchEvent(new Event('pagehide'));});
  const afterFrame=await clock.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  assert.ok(afterFrame.v2.expedition.workDone<1,'first resumed frame must not reuse waiting interval');await clock.close();
  // All compositions, including mobile and reduced motion.
  for(const world of ['earth','cloud','storm','upper','planets','nebula','deep','rim','void','galaxies','fracture','frontier']){
   const seed=await p.evaluate(id=>{const s=JSON.parse(localStorage.getItem('idle-traveler-save-v1'));s.v2.expedition=null;s.v2.worldId=id;s.v2.unlockedWorlds=IT.V2.WORLDS.map(w=>w.id);s.lastSeen=Date.now();return s;},world);
   const page=await open(seed,{viewport:{width:390,height:844},reducedMotion:'reduce'});
   await page.locator('.tab[data-id="atlas"]').click();
   await page.waitForTimeout(400);
   assert.ok(await page.locator('#pane-atlas [data-v2="start"]').count()>=3);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,world+' overflow');
   await page.screenshot({path:path.join(process.env.SP,'v2-'+world+'.png')});
   await page.locator('[data-act="sheetClose"]').click();await page.waitForTimeout(350);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('sheet-open')),false,'close button must dismiss mobile panel');
   await page.screenshot({path:path.join(process.env.SP,'v2-scene-'+world+'.png')});await page.close();
  }
  // Future schema must remain byte-identical and must not create a v3 backup.
  const future={...base,v:5};const f=await open(future);
  await f.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await f.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v),5);await f.close();
  const hotFuture=await open({...base,v:5},{},false,base);
  await hotFuture.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await hotFuture.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v),5,'hot reload must not replace future disk save');await hotFuture.close();
  const fallbackPage=await open(base,{},false,null,base);
  await fallbackPage.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await fallbackPage.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1-pre-v2')).v),3,'fallback source needs its own pre-v2 backup');await fallbackPage.close();
  const mirrorQuota=await open(base,{},false,null,null,false,false,true);
  await mirrorQuota.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await mirrorQuota.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v),3,'mirror quota must leave source intact');
  await mirrorQuota.locator('.tab[data-id="atlas"]').click();
  assert.equal(await mirrorQuota.locator('[data-v2="start"]').first().isDisabled(),true);await mirrorQuota.close();
  const quota=await open(base,{},true);
  await quota.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await quota.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v),3);
  assert.equal(await quota.evaluate(()=>localStorage.getItem('idle-traveler-save-v1-pre-v2')),null);
  await quota.close();
  for(const locale of ['tr-TR','en-US','de-DE','es-ES','fr-FR']){
   const mobile=await open(base,{locale,viewport:{width:320,height:640},colorScheme:'dark'});
   await mobile.locator('.tab[data-id="camp"]').click();await mobile.waitForTimeout(350);
   assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   const colors=await mobile.locator('#pane-camp .v2-button').first().evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
   assert.notEqual(colors.text,colors.bg);await mobile.close();
  }
  const corrupt=await open(base,{},false,null,null,true);
  assert.equal(await corrupt.locator('#modal').isVisible(),true);
  await corrupt.locator('#modalBtn').click();
  if(await corrupt.locator('#nameInput').isVisible()){await corrupt.locator('#nameInput').fill('Gezgin');await corrupt.locator('#modalBtn').click();}
  await corrupt.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await corrupt.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v),4);await corrupt.close();
  const memory=await open(base,{},false,null,null,false,true);
  await memory.locator('#modalBtn').click();
  if(await memory.locator('#nameInput').isVisible()){await memory.locator('#nameInput').fill('Gezgin');await memory.locator('#modalBtn').click();}
  await memory.locator('.tab[data-id="atlas"]').click();
  assert.equal(await memory.locator('[data-v2="start"]').first().isEnabled(),true);await memory.locator('[data-v2="start"]').first().click();assert.equal(await memory.locator('#pane-voyage .v2-expedition').count(),1);await memory.close();
  const activeSeed=await p.evaluate(()=>{
   const save=JSON.parse(localStorage.getItem('idle-traveler-save-v1'));save.v2=IT.V2.createState();save.v2=IT.V2.startExpedition(save.v2,'earth-survey',{vehicleId:'walk',role:'guide',creditRate:10},1).state;save.lastSeen=Date.now();return save;
  });
  const slow=await open(activeSeed);
  await slow.evaluate(()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),500);});
  await slow.waitForTimeout(2400);await slow.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const beforeBack=await slow.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v2.expedition.workDone);
  assert.ok(beforeBack>=1.8,'2fps must use elapsed time');
  await slow.evaluate(()=>{const nativeNow=Date.now;Date.now=()=>nativeNow()-3600000;});
  await slow.waitForTimeout(1300);await slow.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const afterBack=await slow.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')).v2.expedition.workDone);
  assert.ok(afterBack-beforeBack>=.8,'active progress survives clock rollback');await slow.close();
  const newer=await p.evaluate(()=>{
   const key='idle-traveler-save-v1';const value=JSON.parse(localStorage.getItem(key));value.v=5;localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem(key)).v;
  });assert.equal(newer,5,'queued storage event must not permit stale writes');
  assert.deepEqual(errors,[]);
  await p.close();console.log('PASS browser: v3 backup, v4 persistence, far entry, choices, 12 mobile worlds, future-save guard');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
