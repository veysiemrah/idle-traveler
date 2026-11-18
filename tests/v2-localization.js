const assert=require('node:assert/strict');require('../public/js/data.js');for(const m of ['content','expeditions','migration','progression'])require('../public/js/v2/'+m+'.js');
const V=IT.V2;
for(const lang of ['tr','en','de','es','fr'])for(const world of V.WORLDS){assert.ok(world.name[lang],world.id+' name '+lang);assert.ok(world.description[lang],world.id+' description '+lang);}
for(const lang of ['tr','en','de','es','fr']){for(const t of V.TEMPLATES){assert.ok(t.name[lang]);for(const node of t.nodes)for(const c of node.choices||[])assert.ok(c.text[lang],t.id+' '+lang);}for(const w of V.WORLDS)for(const clue of w.clues)assert.ok(clue[lang]);}
console.log('PASS content localization: every world has five languages');
