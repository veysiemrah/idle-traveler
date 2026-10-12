/* Idle Traveler — prosedürel sesler (dosya yok, tamamen Web Audio).
   Efektler: adım, satın alma, kelebek, yeni bölge. Ortam: hafif rüzgâr, yağmur + seyrek rüzgâr çanı notaları. */
(function () {
  'use strict';
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

  const Sound = {
    ctx: null, master: null, sfx: null, music: null, delay: null,
    sfxOn: true, musicOn: true, chimeTimer: 0, wind: null, rain: null,

    unlock() {
      // iOS kesintiden (arama, kilit ekranı) sonra 'interrupted' der; onu da yeniden başlat
      if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 1 : 0; this.sfx.connect(this.master);
      this.music = c.createGain(); this.music.gain.value = this.musicOn ? 1 : 0; this.music.connect(this.master);
      // yumuşak yankı için geri beslemeli gecikme
      this.delay = c.createDelay(1); this.delay.delayTime.value = 0.36;
      const fb = c.createGain(); fb.gain.value = 0.38;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      // yankı ana çıkışa gider: müzik kapalıyken efektlerin yankısı da susmasın
      this.delay.connect(lp); lp.connect(fb); fb.connect(this.delay); lp.connect(this.master);
      this.noiseBuf = this.makeNoise(2);
      this.startWind();
    },
    // Sekme gizlenince rüzgâr ve yağmur susar, geri gelince kaldığı yerden sürer
    pause() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
    resume() { if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume(); },
    setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.05); },
    setMusic(on) { this.musicOn = on; if (this.music) this.music.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.4); },

    makeNoise(sec) {
      const c = this.ctx, buf = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // kahverengi gürültü
      return buf;
    },
    startWind() {
      const c = this.ctx;
      const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      const g = c.createGain(); g.gain.value = 0.05;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
      const lg = c.createGain(); lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(this.music);
      src.start(); lfo.start();
      this.wind = { src, f };
      // yağmur: yüksek frekanslı hışırtı, kazancı hava durumuyla açılır
      const rs = c.createBufferSource(); rs.buffer = this.noiseBuf; rs.loop = true; rs.playbackRate.value = 3.2;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const rg = c.createGain(); rg.gain.value = 0;
      rs.connect(hp); hp.connect(rg); rg.connect(this.music);
      rs.start();
      this.rain = rg;
    },
    // Her karede çağrılır: seyrek, rastgele pentatonik çan sesleri
    tick(dt, speedFactor, rain) {
      if (!this.ctx || !this.musicOn) return;
      this.chimeTimer -= dt;
      if (this.wind) this.wind.f.frequency.setTargetAtTime(380 + speedFactor * 500, this.ctx.currentTime, 0.8);
      if (this.rain) this.rain.gain.setTargetAtTime(0.09 * (rain || 0), this.ctx.currentTime, 0.5);
      if (this.chimeTimer <= 0) {
        this.chimeTimer = 2.2 + Math.random() * 4.5;
        const n = PENTA[(Math.random() * PENTA.length) | 0] * (Math.random() < 0.3 ? 0.5 : 1);
        this.tone(n, 0.035, 3.2, 'sine', this.music, true);
        if (Math.random() < 0.35) setTimeout(() => this.tone(PENTA[(Math.random() * PENTA.length) | 0], 0.025, 2.6, 'sine', this.music, true), 260);
      }
    },
    tone(freq, vol, dur, type, dest, echo, when) {
      if (!this.ctx) return;
      // Efektler kapalıyken yankıları da (müzik kanalından geçtikleri için) çalınmasın
      if ((!dest || dest === this.sfx) && !this.sfxOn) return;
      const c = this.ctx, t = c.currentTime + (when || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfx);
      if (echo) g.connect(this.delay);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(vol, dur, freq, q, dest, when) {
      if (!this.ctx || ((!dest || dest === this.sfx) && !this.sfxOn)) return;
      const c = this.ctx, t = c.currentTime + (when || 0);
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest || this.sfx);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
    },
    step(vehicle, crit) {
      if (!this.ctx || !this.sfxOn) return;
      const r = 0.85 + Math.random() * 0.3;
      if (vehicle === 'walk') this.noise(0.5, 0.09, 700 * r, 1.4);
      else if (vehicle === 'horse') { this.tone(520 * r, 0.05, 0.07, 'triangle'); this.tone(430 * r, 0.05, 0.07, 'triangle', this.sfx, false, 0.09); }
      else if (vehicle === 'skates' || vehicle === 'board' || vehicle === 'bike') { this.noise(0.25, 0.12, 1500 * r, 2); this.tone(1800 * r, 0.015, 0.05, 'triangle'); }
      else if (vehicle === 'moto' || vehicle === 'car' || vehicle === 'van' || vehicle === 'train') { this.tone(95 * r, 0.12, 0.18, 'triangle'); this.noise(0.2, 0.15, 300, 0.8); }
      else this.noise(0.3, 0.25, 900 * r, 0.6);
      if (crit) [0, 0.07, 0.14].forEach((w, i) => this.tone(PENTA[i + 3] * 2, 0.06, 0.6, 'sine', this.sfx, true, w));
    },
    buy() { if (!this.ctx) return; this.tone(659.25, 0.08, 0.5, 'triangle', this.sfx, true); this.tone(987.77, 0.07, 0.7, 'sine', this.sfx, true, 0.08); },
    // Konuşma balonu: kısa, yumuşak bir "pıt"
    chat() { if (!this.ctx) return; this.tone(PENTA[4] * 2, 0.05, 0.22, 'sine', this.sfx, false); this.tone(PENTA[6] * 2, 0.04, 0.3, 'sine', this.sfx, true, 0.07); },
    // Bir gezgine el sallayınca: iki yumuşak nota
    wave() { if (!this.ctx) return; [4, 6].forEach((n, i) => this.tone(PENTA[n] * 2, 0.045, 0.6, 'sine', this.sfx, true, i * 0.12)); },
    zoom(dir) { if (!this.ctx) return; this.tone(dir > 0 ? 880 : 660, 0.035, 0.12, 'sine', this.sfx, false); this.tone(dir > 0 ? 1175 : 523, 0.03, 0.14, 'sine', this.sfx, false, 0.05); },
    deny() { if (!this.ctx) return; this.tone(220, 0.05, 0.18, 'triangle'); },
    gift() { if (!this.ctx) return; [0, 2, 4, 5, 6].forEach((n, i) => this.tone(PENTA[n] * 1.5, 0.06, 0.9, 'sine', this.sfx, true, i * 0.06)); },
    // kayan yıldız: yukarıdan aşağı inen ince, parıltılı bir dizi
    wish() { if (!this.ctx) return; [6, 5, 4, 2, 0].forEach((n, i) => this.tone(PENTA[n] * 2, 0.04, 1.6, 'sine', this.sfx, true, i * 0.09)); },
    // turna sesi: uzaktan gelen, aşağı kayan yumuşak "krruu" çağrıları (iki üç kuş birbirine seslenir)
    cranes() {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx;
      [[0, 1], [0.32, 0.92], [0.7, 1.06]].forEach(([w, r]) => {
        const t = c.currentTime + w, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(560 * r, t); o.frequency.linearRampToValueAtTime(470 * r, t + 0.26);
        f.type = 'bandpass'; f.frequency.value = 1100 * r; f.Q.value = 2.2;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(f); f.connect(g); g.connect(this.sfx); g.connect(this.delay);
        o.start(t); o.stop(t + 0.4);
      });
    },
    // takımyıldız: dokunulan her yıldız için yükselen tek bir çan notası; tamamlanınca yukarı doğru parıltılı bir dizi
    constStar(i) { if (!this.ctx) return; this.tone(PENTA[i % PENTA.length] * (i >= PENTA.length ? 4 : 2), 0.045, 1.4, 'sine', this.sfx, true); },
    constDone() { if (!this.ctx) return; [0, 2, 4, 6, 4, 6].forEach((n, i) => this.tone(PENTA[n] * 2, 0.04, 1.8, 'sine', this.sfx, true, i * 0.1)); },
    // uçurtma: rüzgârda kâğıt hışırtısı ve yukarı süzülen yumuşak bir ıslık
    kite() {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx, t = c.currentTime + 0.08, o = c.createOscillator(), g = c.createGain();
      this.noise(0.09, 0.8, 1300, 0.6);
      o.type = 'sine'; o.frequency.setValueAtTime(PENTA[2] * 2, t); o.frequency.exponentialRampToValueAtTime(PENTA[5] * 2, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(this.sfx); g.connect(this.delay);
      o.start(t); o.stop(t + 0.75);
    },
    // tilki: çalı hışırtısı ve uzaktan iki kısa, yukarı kalkıp inen yumuşak "yip"
    fox() {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx;
      this.noise(0.1, 0.35, 900, 0.9);
      [[0.18, 1], [0.42, 1.12]].forEach(([w, r]) => {
        const t = c.currentTime + w, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(880 * r, t); o.frequency.linearRampToValueAtTime(1240 * r, t + 0.05); o.frequency.exponentialRampToValueAtTime(700 * r, t + 0.16);
        f.type = 'lowpass'; f.frequency.value = 2400;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(f); f.connect(g); g.connect(this.sfx); g.connect(this.delay);
        o.start(t); o.stop(t + 0.25);
      });
    },
    // yunus: uzaktan bir dalga şıpırtısı ve inip kalkan ince bir ıslık; selam verilince iki neşeli, yükselen ıslık daha
    dolphin(happy) {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx;
      this.noise(happy ? 0.12 : 0.07, 0.45, 700, 0.7);
      const calls = happy ? [[0.12, 1], [0.34, 1.2], [0.52, 1.35]] : [[0.2, 1]];
      calls.forEach(([w, r]) => {
        const t = c.currentTime + w, o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(1500 * r, t); o.frequency.exponentialRampToValueAtTime(2300 * r, t + 0.07);
        o.frequency.exponentialRampToValueAtTime(1700 * r, t + 0.13); o.frequency.exponentialRampToValueAtTime(2600 * r, t + 0.2);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(happy ? 0.022 : 0.014, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(this.sfx); g.connect(this.delay);
        o.start(t); o.stop(t + 0.28);
      });
    },
    // Kuş Defteri: her kuşun kendi sesi (leylek gaga takırdatır, baykuş öter, kartal ıslık gibi çığlık atar, diğerleri cıvıldar);
    // deftere yazılınca ardından iki yumuşak, yükselen nota
    bird(id, noted) {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx;
      const chirp = (w, f0, f1, dur, vol, type) => {
        const t = c.currentTime + w, o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.sfx); g.connect(this.delay);
        o.start(t); o.stop(t + dur + 0.05);
      };
      if (id === 'stork') for (let i = 0; i < 7; i++) this.noise(0.05, 0.03, 1800 + (i % 2) * 400, 3, undefined, 0.1 + i * 0.07);
      else if (id === 'owl') { chirp(0.1, 420, 380, 0.32, 0.03); chirp(0.55, 400, 360, 0.5, 0.028); }
      else if (id === 'eagle') { chirp(0.1, 2600, 1900, 0.45, 0.014, 'triangle'); chirp(0.62, 2400, 1700, 0.35, 0.011, 'triangle'); }
      else if (id === 'flamingo') { chirp(0.1, 700, 560, 0.16, 0.02, 'sawtooth'); chirp(0.32, 760, 600, 0.16, 0.016, 'sawtooth'); }
      else if (id === 'kingfisher') { chirp(0.1, 3600, 4200, 0.12, 0.012); chirp(0.26, 3600, 4300, 0.12, 0.01); }
      else if (id === 'woodpecker') { for (let i = 0; i < 9; i++) this.noise(0.06, 0.02, 2600, 4, undefined, 0.1 + i * 0.045); chirp(0.6, 2200, 1800, 0.1, 0.012); }
      else { chirp(0.1, 2600, 3200, 0.09, 0.012); chirp(0.24, 2800, 3400, 0.09, 0.011); chirp(0.4, 2400, 3000, 0.12, 0.01); }
      if (noted) [2, 4].forEach((n, i) => this.tone(PENTA[n] * 2, 0.03, 0.9, 'sine', this.sfx, true, 0.5 + i * 0.13));
    },
    // balkabağı: içi boş, tok bir "tok" ve hoplarken iki küçük, sıcak nota
    pumpkin() {
      if (!this.ctx || !this.sfxOn) return;
      const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.25);
      this.noise(0.08, 0.05, 500, 1.2);
      [3, 5].forEach((n, i) => this.tone(PENTA[n], 0.03, 0.6, 'triangle', this.sfx, true, 0.12 + i * 0.11));
    },
    // kâğıt uçak: yanından süzülen yumuşak bir hışırtı ve iki ince nota
    plane() {
      if (!this.ctx || !this.sfxOn) return;
      this.noise(0.12, 0.7, 2400, 0.8);
      [4, 6].forEach((n, i) => this.tone(PENTA[n] * 2, 0.025, 0.8, 'sine', this.sfx, true, 0.15 + i * 0.14));
    },
    // mektup açılır: kâğıt hışırtısı, ardından sıcak, yukarı çıkan bir dizi
    letter() {
      if (!this.ctx || !this.sfxOn) return;
      this.noise(0.3, 0.12, 1800, 1.2); setTimeout(() => this.noise(0.22, 0.1, 2600, 1.2), 90);
      [0, 2, 4, 6].forEach((n, i) => this.tone(PENTA[n] * 1.5, 0.045, 1.2, 'sine', this.sfx, true, 0.15 + i * 0.08));
    },
    region() {
      if (!this.ctx) return;
      [261.63, 329.63, 392.0, 493.88, 587.33].forEach((f, i) => this.tone(f, 0.05, 3.5, 'sine', this.sfx, true, i * 0.12));
    },
    milestone() { if (!this.ctx) return; [0, 2, 4].forEach((n, i) => this.tone(PENTA[n], 0.06, 1.4, 'triangle', this.sfx, true, i * 0.1)); },
  };

  window.IT = window.IT || {};
  window.IT.Sound = Sound;
})();
