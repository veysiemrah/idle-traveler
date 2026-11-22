'use strict';
// Exercise the actual shell runner: silent nonzero exits and logged runtime errors
// must fail the run, while an ordinary successful child must pass.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const bash=process.env.BASH_EXE||(process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash');
const prefix='runner-probe-'+process.pid;
const probes={pass:"console.log('no errors');",exit:'process.exitCode=7;',logged:"console.log('ReferenceError: regression probe');"};
const names=Object.keys(probes).map(key=>prefix+'-'+key);
try {
 for(const [key,code] of Object.entries(probes))fs.writeFileSync(path.join(__dirname,prefix+'-'+key+'.js'),code);
 const run=keys=>spawnSync(bash,['tests/run-all.sh','only',keys.map(key=>prefix+'-'+key).join(',')],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:60000,env:{...process.env,NODE_OPTIONS:''}});
 const failed=run(['pass','exit','logged']);
 assert.equal(failed.error,undefined);
 assert.notEqual(failed.status,0,'silent nonzero exits and logged runtime errors must fail the regression runner');
 assert.match(failed.stdout,/FAIL.*exit/);
 assert.match(failed.stdout,/FAIL.*logged/);
 const passed=run(['pass']);
 assert.equal(passed.error,undefined);
 assert.equal(passed.status,0,passed.stdout+'\n'+passed.stderr);
 console.log('PASS regression runner: nonzero exits, runtime errors and successful children');
} finally {
 for(const name of names)fs.rmSync(path.join(__dirname,name+'.js'),{force:true});
}
