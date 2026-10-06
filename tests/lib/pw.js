// Playwright yükleyici: önce tests/node_modules (npm install), yoksa global kurulum.
// Ekran görüntüleri ve çıktılar SP ortam değişkenindeki klasöre (varsayılan tests/out) yazılır.
const path = require('path'), fs = require('fs');
let pw;
try { pw = require('playwright'); } catch (e) {
  const g = require('child_process').execSync('npm root -g', { env: Object.assign({}, process.env, { NODE_OPTIONS: '' }) }).toString().trim();
  pw = require(path.join(g, 'playwright'));
}
process.env.SP = process.env.SP || path.join(__dirname, '..', 'out');
fs.mkdirSync(process.env.SP, { recursive: true });
module.exports = pw;
