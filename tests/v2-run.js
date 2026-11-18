'use strict';
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
if (args[0]?.startsWith('--probe=')) { const p = args[0].split('=')[1]; if (p !== 'pass') throw Error(p === 'pageerror' ? 'Simulated pageerror' : 'Simulated assertion'); process.exit(0); }
const files = args.length ? args : fs.readdirSync(__dirname).filter(f=>/^v2-.*\.js$/.test(f) && f!=='v2-run.js'&&!f.includes('browser'));
let pass=0, fail=0;
for (const file of files) {
 const result=spawnSync(process.execPath,[path.join(__dirname,file)],{encoding:'utf8',timeout:120000});
 if(result.stdout) process.stdout.write(result.stdout);
 if(result.stderr) process.stderr.write(result.stderr);
 if(result.status===0) pass++; else { fail++; console.error('FAIL',file,result.error?.message||''); }
}
console.log(JSON.stringify({pass,fail,skipped:0})); process.exitCode=fail?1:0;
