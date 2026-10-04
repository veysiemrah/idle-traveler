/* Idle Traveler — prosedürel sesler (dosya yok, tamamen Web Audio).
   Efektler: adım, satın alma, kelebek, yeni bölge. Ortam: hafif rüzgâr, yağmur + seyrek rüzgâr çanı notaları. */
(function () {
  'use strict';
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

  const Sound = {
    ctx: null, master: null, sfx: null, music: null, delay: null,
    sfxOn: true, musicOn: true, chimeTimer: 0, wind: null, rain: null,

    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
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
      this.delay.connect(lp); lp.connect(fb); fb.connect(this.delay); lp.connect(this.music);
      this.noiseBuf = this.makeNoise(2);
      this.startWind();
    },
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
      const c = this.ctx, t = c.currentTime + (when || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfx);
      if (echo) g.connect(this.delay);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(vol, dur, freq, q, dest) {
      const c = this.ctx, t = c.currentTime;
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
      else if (vehicle === 'skates' || vehicle === 'bike') { this.noise(0.25, 0.12, 1500 * r, 2); this.tone(1800 * r, 0.015, 0.05, 'triangle'); }
      else if (vehicle === 'moto' || vehicle === 'car' || vehicle === 'train') { this.tone(95 * r, 0.12, 0.18, 'triangle'); this.noise(0.2, 0.15, 300, 0.8); }
      else this.noise(0.3, 0.25, 900 * r, 0.6);
      if (crit) [0, 0.07, 0.14].forEach((w, i) => this.tone(PENTA[i + 3] * 2, 0.06, 0.6, 'sine', this.sfx, true, w));
    },
    buy() { if (!this.ctx) return; this.tone(659.25, 0.08, 0.5, 'triangle', this.sfx, true); this.tone(987.77, 0.07, 0.7, 'sine', this.sfx, true, 0.08); },
    deny() { if (!this.ctx) return; this.tone(220, 0.05, 0.18, 'triangle'); },
    gift() { if (!this.ctx) return; [0, 2, 4, 5, 6].forEach((n, i) => this.tone(PENTA[n] * 1.5, 0.06, 0.9, 'sine', this.sfx, true, i * 0.06)); },
    region() {
      if (!this.ctx) return;
      [261.63, 329.63, 392.0, 493.88, 587.33].forEach((f, i) => this.tone(f, 0.05, 3.5, 'sine', this.sfx, true, i * 0.12));
    },
    milestone() { if (!this.ctx) return; [0, 2, 4].forEach((n, i) => this.tone(PENTA[n], 0.06, 1.4, 'triangle', this.sfx, true, i * 0.1)); },
  };

  window.IT = window.IT || {};
  window.IT.Sound = Sound;
})();
