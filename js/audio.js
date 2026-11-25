(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.ambientGain = null;
      this.muted = false;
      this.sfxVolume = 0.8;
      this.ambientVolume = 0.55;
      this.ambientRunning = false;
      this.ambientNodes = [];
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return;
      }
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
      this.startAmbient();
    }

    applyVolumes() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.03);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.03);
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.28, now, 0.08);
    }

    setMuted(muted) {
      this.muted = !!muted;
      this.applyVolumes();
    }

    setSfxVolume(val) {
      this.sfxVolume = Math.max(0, Math.min(1, val));
      this.applyVolumes();
    }

    setAmbientVolume(val) {
      this.ambientVolume = Math.max(0, Math.min(1, val));
      this.applyVolumes();
    }

    startAmbient() {
      if (!this.ctx || this.ambientRunning) return;
      this.ambientRunning = true;

      // Deep sci-fi facility drone (two detuned low oscillators + slow LFO filter)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;
      filter.Q.value = 3.5;
      filter.connect(this.ambientGain);

      const freqs = [55, 82.41, 110.2];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 1 ? 'triangle' : 'sawtooth';
        osc.frequency.value = f;
        g.gain.value = idx === 0 ? 0.28 : 0.14;
        osc.connect(g);
        g.connect(filter);
        osc.start();
        this.ambientNodes.push(osc);
      });

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.09;
      lfoGain.gain.value = 110;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.ambientNodes.push(lfo);
    }

    _noiseBuffer(duration) {
      const len = Math.floor(this.ctx.sampleRate * duration);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buf;
    }

    playFootstep() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer(0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420 + Math.random() * 140;
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
    }

    playJump() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);

      // Subtle thruster air hiss
      const noise = this.ctx.createBufferSource();
      noise.buffer = this._noiseBuffer(0.12);
      const nf = this.ctx.createBiquadFilter();
      nf.type = 'highpass';
      nf.frequency.value = 900;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.08, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(this.sfxGain);
      noise.start(now);
    }

    playLand() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.1);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    playEchoRecordTick() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    playEchoCreate() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      // Holographic harmonic chord + glitch sweep
      const notes = [329.63, 493.88, 659.25, 987.77];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * 0.85, now + i * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.18 + i * 0.02);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.11, now + 0.04 + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.48);
      });
    }

    playSwitch(active) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      if (active) {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.045);
      } else {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(320, now + 0.045);
      }
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    playDoorOpen() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.38);
    }

    playDeath() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.42);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this._noiseBuffer(0.25);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.14, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      noise.connect(ng);
      ng.connect(this.sfxGain);
      noise.start(now);
    }

    playVictory() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const arp = [440, 554.37, 659.25, 880, 1108.73];
      arp.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.075;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.58);
      });
    }
  }

  EchoShift.AudioEngine = AudioEngine;
})(window);
