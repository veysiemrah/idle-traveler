// Sözlükleri karşılaştır: eksik/fazla anahtarlar ve yer tutucu uyumsuzlukları
const L = {};
global.IT = { addLang: (c, d) => { L[c] = d; } };
const fs = require('fs'), dir = require('path').resolve(__dirname, '../public/js/lang/')+ '/';
for (const f of fs.readdirSync(dir)) require(dir + f);
const ph = v => (typeof v === 'object' ? Object.values(v).join(' ') : String(v)).match(/\{\w+\}/g) || [];
const tags = v => ((typeof v === 'object' ? Object.values(v).join(' ') : String(v)).match(/<\/?[bi]>/g) || []).sort().join('');
const ref = L.en.strings; let bad = 0;
for (const [code, d] of Object.entries(L)) {
  const ks = Object.keys(d.strings);
  const miss = Object.keys(ref).filter(k => !(k in d.strings)), extra = ks.filter(k => !(k in ref));
  const phBad = [], tagBad = [];
  for (const k of Object.keys(ref)) if (k in d.strings) {
    const a = new Set(ph(ref[k])), b = new Set(ph(d.strings[k]));
    if ([...a].some(x => !b.has(x)) || [...b].some(x => !a.has(x))) phBad.push(`${k}: en ${[...a]} / ${code} ${[...b]}`);
    if (tags(ref[k]) !== tags(d.strings[k])) tagBad.push(k);
  }
  console.log(`${code}: ${ks.length} anahtar, eksik ${miss.length}, fazla ${extra.length}, yer tutucu farkı ${phBad.length}, etiket farkı ${tagBad.length}`);
  [...miss.map(k => '  eksik ' + k), ...extra.map(k => '  fazla ' + k), ...phBad.map(x => '  yer tutucu ' + x), ...tagBad.map(k => '  etiket ' + k)].forEach(x => console.log(x));
  bad += miss.length + extra.length + phBad.length;
}
process.exit(bad ? 1 : 0);
