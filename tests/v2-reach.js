const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const result=spawnSync(process.execPath,[require('node:path').join(__dirname,'sim_game.js'),JSON.stringify({profile:'lucky',reach:1,cps:5,night:1,hours:48,runs:3,v2UpperBound:true,verifyCap:true})],{encoding:'utf8',timeout:90000});
assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/Verified Worker cap/);
require('node:fs').writeFileSync(require('node:path').join(__dirname,'out/v2-reach-simulation.log'),result.stdout);
console.log('PASS reach: '+result.stdout.split('\n')[0]);
