const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('./lib/pw');
require('../public/js/data.js');
const root = path.resolve(__dirname, '../public');
const server = http.createServer((req,res) => {
 const file = path.join(root, new URL(req.url,'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url,'http://localhost').pathname);
 fs.readFile(file, (err,data) => { res.statusCode = err ? 404 : 200; res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(err ? '' : data); });
});
(async () => {
 await new Promise(r => server.listen(0,'127.0.0.1',r));
 const browser = await chromium.launch();
 try {
  const page = await browser.newPage({locale:'tr-TR'}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const owned = Object.fromEntries(globalThis.IT.VEHICLES.filter(v=> !['portal','cosmos'].includes(v.id)).map(v=>[v.id,1]));
  await page.addInitScript(save => { if (!sessionStorage.seed) { localStorage.setItem('idle-traveler-save-v1',JSON.stringify(save)); sessionStorage.seed='1'; } }, {v:3,intro:true,lastSeen:Date.now(),seenVer:'99',player:{id:'12345678-1234-4123-a123-123456789abc',key:'a'.repeat(64),name:'Gezgin'},credits:1e25,owned,levels:{chrono:10},active:'chrono',distance:5e15,regionIdx:27,msIdx:99,unitTip:2});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.locator('.tab[data-id="garage"]').click();
  for (const id of ['portal','cosmos']) {
   const buy = page.locator(`[data-act="buyVeh"][data-id="${id}"]`);
   await buy.click();
   await page.waitForTimeout(200);
   await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
   const save = await page.evaluate(()=>JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
   assert.ok(save.owned[id]); assert.equal(save.active,id);
   await page.locator(`[data-act="upgrade"][data-id="${id}"]`).click();
  }
  await page.reload();
  await page.waitForTimeout(500);
  assert.match(await page.locator('#hudVehicle').innerText(), /Evren/);
  await page.evaluate(()=> {
   for (const id of ['portal','cosmos']) for (let tier=0;tier<=8;tier++) {
    const canvas=document.createElement('canvas'); IT.drawIcon(canvas,id,false,tier);
    if (!canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some(v=>v)) throw Error('Empty icon');
   }
  });
  await page.setViewportSize({width:320,height:640});
  await page.screenshot({path:path.join(process.env.SP,'cosmos-phone.png')});
  assert.deepEqual(errors,[]);
  console.log('Purchase, upgrade, persistence, mobile scene and all icon tiers passed');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
