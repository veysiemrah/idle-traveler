const { chromium } = require('./lib/pw');
require(require('path').resolve(__dirname, '../public/js/data.js')); const IT = globalThis.IT;
const KEY_RE = /\b(?:ui|veh|buff|gift|region|ms|badge|html|tab|garage|toast|float|off|home|homecard|intro|j|sky|units|unit|meta)\.[A-Za-z0-9]+(?:\.[A-Za-z]+)?\b/g;
const BAD_RE = /NaN|undefined|Infinity|∞|null|\[object/;
(async () => {
  const b = await chromium.launch(); const errs = [];
  const owned = {}, levels = {}; IT.VEHICLES.forEach(v => { owned[v.id] = true; levels[v.id] = 250; });
  const buffs = Object.fromEntries(IT.BUFFS.map(x => [x.id, x.max || 80]));
  const states = {
    late: { intro: true, lastSeen: Date.now() - 30 * 3600e3, distance: 3e16, credits: 1e26, totalCredits: 1e27, clicks: 2e6, owned, levels, active: 'sail', buffs, memories: 500, trips: 10, lifeDist: 5e17, playTime: 9e5, best: 1e12, gifts: 300, crits: 5000, rainbows: 40,
      effects: [{ id: 'gust', until: Date.now() + 20000 }, { id: 'rainbow', until: Date.now() + 9000 }], badges: Object.fromEntries(IT.BADGES.map(x => [x.id, 1])), settings: { bulk: 'max' } },
    broken: { intro: true, lastSeen: 'x', distance: -5, credits: 'abc', owned: { walk: true, nope: true }, levels: { walk: -3 }, active: 'nope', buffs: { stride: 1e9 }, regionIdx: 999, msIdx: 999, effects: [{ id: 'zzz' }], settings: { lang: 'xx', units: 'parsec', sky: 'pink', bulk: 7 } },
  };
  for (const [sname, save] of Object.entries(states)) for (const locale of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'fr-FR']) {
    const vp = sname === 'late' && locale === 'de-DE' ? { width: 390, height: 800 } : { width: 1280, height: 860 };
    const p = await b.newPage({ locale, viewport: vp });
    p.on('pageerror', e => errs.push(`${sname}/${locale}: ${e.message}`));
    await p.addInitScript(s => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, save);
    await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href); await p.waitForTimeout(900);
    let txt = await p.textContent('body');
    if (await p.isVisible('#modal')) { await p.screenshot({ path: `${process.env.SP}/st_${sname}_${locale}_modal.png` }); await p.click('#modalBtn'); await p.waitForTimeout(200); }
    for (const tab of ['garage', 'buffs', 'journal']) { await p.click(`.tab[data-id="${tab}"]`); await p.waitForTimeout(200); txt += await p.textContent('body'); }
    for (let i = 0; i < 20; i++) await p.mouse.click(vp.width * 0.25, vp.height * 0.3);
    await p.waitForTimeout(1500); txt += await p.textContent('body');
    await p.screenshot({ path: `${process.env.SP}/st_${sname}_${locale}.png` });
    const bad = [...new Set((txt.match(new RegExp(BAD_RE.source + '.{0,30}', 'g')) || []))].slice(0, 5);
    const keys = [...new Set(txt.match(KEY_RE) || [])];
    console.log(`${sname}/${locale}: yol ${await p.textContent('#hudDist')} | hız ${await p.textContent('#hudSpeed')} | kredi ${await p.textContent('#credits')} | bölge ${await p.textContent('#hudRegion')} | durak ${await p.textContent('#msName')}`);
    if (bad.length) console.log('   ŞÜPHELİ:', bad.join(' || '));
    if (keys.length) console.log('   ANAHTAR:', keys.join(', '));
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
