'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const pw=require('./lib/pw');
(async()=>{
 const browser=await pw.chromium.launch();
 try {
  const page=await browser.newPage({locale:'tr-TR',viewport:{width:320,height:740}});
  await page.setContent('<div id="views"><section class="v2-pane" id="pane-voyage"></section><section class="v2-pane" id="pane-atlas"></section><section class="v2-pane" id="pane-camp"></section></div>');
  for(const file of ['data','i18n','lang/tr','lang/en','lang/de','lang/es','lang/fr','v2/content','v2/expeditions','v2/migration','v2/progression','v2/views'])await page.addScriptTag({path:path.resolve(__dirname,'../public/js/'+file+'.js')});
  await page.clock.install();
  await page.evaluate(()=>{
   window.s=IT.V2.startExpedition(IT.V2.createState(),'earth-survey',{vehicleId:'walk',role:'guide'},1).state;
   window.m={active:'walk',owned:{walk:true},entries:['earth'],locked:false};
   window.actions=[];
   window.views=IT.V2.Views.mount(document.querySelector('#views'),(action)=>actions.push(action));
   views.render(s,m);
  });
  const abandon=page.locator('[data-v2="abandon"]');
  await abandon.click();
  await page.evaluate(()=>{s.research++;views.render(s,m);});
  assert.match(await abandon.innerText(),/tekrar dokun/,'rerender must keep the warning while abandonment is armed');
  await page.clock.fastForward(4001);
  await page.evaluate(()=>views.render(s,m));
  assert.equal(await abandon.innerText(),'Seferi bırak','expired confirmation must return to the normal label');
  await abandon.click();
  assert.deepEqual(await page.evaluate(()=>actions),[],'first tap after expiry must not abandon');
  await abandon.click();
  assert.deepEqual(await page.evaluate(()=>actions),['abandon']);
  await page.evaluate(()=>{
   s=IT.V2.startExpedition(IT.V2.abandonExpedition(s).state,'earth-delivery',{vehicleId:'walk'},2).state;
   views.render(s,m);
  });
  await abandon.click();
  await page.evaluate(()=>{
   s=IT.V2.startExpedition(IT.V2.abandonExpedition(s).state,'earth-pass',{vehicleId:'walk'},3).state;
   views.render(s,m);
  });
  await abandon.click();
  assert.deepEqual(await page.evaluate(()=>actions),['abandon'],'a new expedition needs its own confirmation');
  console.log('PASS v2 voyage abandonment');
  const eta=page.locator('[data-v2-eta="main"]');
  assert.match(await eta.innerText(),/5 dk/,'the first fork is five minutes away');
  await page.evaluate(()=>{s=IT.V2.advance(s,61).state;views.render(s,m);});
  assert.match(await eta.innerText(),/4 dk/,'remaining time must update without rebuilding the panel');
  await page.evaluate(()=>{s=IT.V2.advance(s,1000).state;views.render(s,m);});
  assert.match(await eta.innerText(),/Yol ayrımı/,'a pending choice must not imply travel is continuing');
  await page.evaluate(()=>{
   s=IT.V2.choose(s,IT.V2.TEMPLATE[s.expedition.templateId].nodes[0].choices.find(c=>c.safe).id).state;
   views.render(s,m);
  });
  assert.match(await eta.innerText(),/5 dk/,'240 work at 0.9 rate needs five rounded-up minutes');
  await page.evaluate(()=>{
   s=IT.V2.advance(s,1000).state;
   s=IT.V2.choose(s,IT.V2.TEMPLATE[s.expedition.templateId].nodes[1].choices.find(c=>c.safe).id).state;
   s.unlockedWorlds.push('galaxies');
   s=IT.V2.startFleet(s,0,'earth-survey','researcher',4).state;
   views.render(s,m);
  });
  assert.match(await eta.innerText(),/Keşfe/,'last leg must point to discovery rather than another fork');
  assert.match(await page.locator('[data-v2-eta="0"]').innerText(),/5 dk/);
  await page.evaluate(()=>{s=IT.V2.advanceAll(s,61).state;views.render(s,m);});
  assert.match(await page.locator('[data-v2-eta="0"]').innerText(),/4 dk/,'fleet time updates independently');
  await page.evaluate(()=>{s=IT.V2.advanceAll(s,1000).state;views.render(s,m);});
  assert.match(await eta.innerText(),/Keşif tamamlandı/);
  console.log('PASS v2 voyage timing');
  console.log('no errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
