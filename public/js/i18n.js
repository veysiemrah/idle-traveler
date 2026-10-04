/* Idle Traveler — yerelleştirme çekirdeği.
   Her dil public/js/lang/<kod>.js dosyasında IT.addLang(...) ile kaydolur.
   Metinler anahtarla istenir: IT.t('ui.buy'), değişkenler {ad} ile: IT.t('ui.lvl', { n: 3 }).
   Çoğul gereken metinler { one, other } nesnesi olarak yazılır ve { n } ile seçilir.
   Eksik anahtar önce İngilizceye, sonra Türkçeye düşer; hiçbirinde yoksa anahtarın kendisi görünür. */
(function (root) {
  'use strict';
  const IT = root.IT = root.IT || {};
  const LANGS = {};
  let lang = 'tr';
  let units = 'metric';
  const listeners = [];

  function addLang(code, def) { LANGS[code] = def; }

  function raw(key) {
    for (const c of [lang, 'en', 'tr']) {
      const d = LANGS[c];
      if (d && d.strings && Object.prototype.hasOwnProperty.call(d.strings, key)) return d.strings[key];
    }
    return undefined;
  }

  function t(key, vars) {
    let s = raw(key);
    if (s === undefined) return key;
    vars = vars || {};
    if (s && typeof s === 'object') {
      const n = typeof vars.n === 'number' ? vars.n : 0;
      const cat = new Intl.PluralRules(locale()).select(n);
      s = s[cat] !== undefined ? s[cat] : s.other;
    }
    if (typeof s === 'function') return s(vars);
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  }

  // Tarayıcı dilinden desteklenen ilk dili seç
  function detect() {
    const prefs = (root.navigator && (root.navigator.languages || [root.navigator.language])) || [];
    for (const p of prefs) {
      const code = String(p || '').toLowerCase().split('-')[0];
      if (LANGS[code]) return code;
    }
    return LANGS.en ? 'en' : 'tr';
  }
  // ABD, Birleşik Krallık, Liberya ve Myanmar'da yol mesafeleri mil ile ölçülür
  function detectUnits() {
    const prefs = (root.navigator && (root.navigator.languages || [root.navigator.language])) || [];
    const region = String(prefs[0] || '').split('-')[1] || '';
    return ['US', 'GB', 'LR', 'MM'].includes(region.toUpperCase()) ? 'imperial' : 'metric';
  }

  function setLang(code) {
    const next = code === 'auto' || !LANGS[code] ? detect() : code;
    const changed = next !== lang;
    lang = next;
    if (root.document) root.document.documentElement.lang = lang;
    if (changed) listeners.forEach(fn => fn(lang));
    return lang;
  }
  function setUnits(u) {
    const next = u === 'imperial' || u === 'metric' ? u : detectUnits();
    const changed = next !== units;
    units = next;
    if (changed) listeners.forEach(fn => fn(lang));
    return units;
  }
  function locale() { return (LANGS[lang] && LANGS[lang].locale) || 'en-US'; }
  function def() { return LANGS[lang] || LANGS.en || LANGS.tr; }

  Object.assign(IT, {
    LANGS, addLang, t, setLang, setUnits, detect, detectUnits,
    lang: () => lang, units: () => units, locale, langDef: def,
    onLang: fn => listeners.push(fn),
  });
})(typeof window !== 'undefined' ? window : globalThis);
