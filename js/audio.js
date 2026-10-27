(function (O) {
  'use strict';
  class Sound {
    constructor() { this.context = null; this.enabled = true; this.playing = false; this.tick = 0; this.nextNote = 0; this.theme = 0; }
    unlock() {
      try {
        if (!this.context) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return;
          this.context = new Audio(); this.master = this.context.createGain(); this.master.gain.value = 0.24; this.master.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      } catch { this.context = null; }
    }
    tone(hz, duration = 0.15, type = 'sine', volume = 0.12, delay = 0, endHz = 0) {
      if (!this.enabled || !this.context || this.context.state !== 'running') return;
      const start = this.context.currentTime + delay, oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(hz, start);
      if (endHz) oscillator.frequency.exponentialRampToValueAtTime(endHz, start + duration);
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + 0.012); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain); gain.connect(this.master); oscillator.start(start); oscillator.stop(start + duration + 0.02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    effect(name) {
      if (name === 'jump') this.tone(260, 0.17, 'sine', 0.19, 0, 630);
      if (name === 'scoop') { this.tone(780, 0.14, 'sine', 0.2); this.tone(1170, 0.21, 'sine', 0.15, 0.07); }
      if (name === 'bounce') this.tone(180, 0.2, 'triangle', 0.25, 0, 600);
      if (name === 'hurt') this.tone(330, 0.24, 'triangle', 0.2, 0, 170);
      if (name === 'secret' || name === 'win') [523, 659, 784, 1047].forEach((hz, i) => this.tone(hz, 0.35, 'sine', 0.22, i * 0.12));
      if (name === 'checkpoint') [523, 784].forEach((hz, i) => this.tone(hz, 0.3, 'sine', 0.15, i * 0.1));
    }
    setEnabled(value) { this.enabled = value; if (this.master && this.context) this.master.gain.setTargetAtTime(value ? 0.24 : 0, this.context.currentTime, 0.04); }
    update() {
      if (!this.context || !this.enabled || !this.playing || this.context.state !== 'running') return;
      const now = this.context.currentTime;
      if (now < this.nextNote) return;
      this.nextNote = now + 0.25;
      // Original little pentatonic melody; no recordings or third-party music.
      const melody = [0, 4, 7, 9, 7, 4, 2, 4, 0, 2, 7, 4, 9, 7, 4, 2, 4, 7, 12, 9, 7, 4, 2, 0, 2, 4, 7, 2, 4, 0, -3, 0];
      const transpose = [0, -2, 5, -5, 2][this.theme];
      const n = melody[this.tick % melody.length];
      if (this.tick % 8 !== 7) this.tone(523.25 * 2 ** ((n + transpose) / 12), 0.22, 'sine', 0.075);
      if (this.tick % 4 === 0) this.tone(130.81 * 2 ** (([0, 5, 7, 0][Math.floor(this.tick / 8) % 4] + transpose) / 12), 0.48, 'triangle', 0.07);
      this.tick++;
    }
  }
  O.Sound = Sound;
})(window.Olivia);
