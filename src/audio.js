export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.enabled = true;
  }

  tone(frequency, duration = 0.08, type = "square", gain = 0.08, slideTo = null) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  shoot() {
    this.tone(96, 0.12, "sawtooth", 0.16, 38);
    this.tone(740, 0.035, "square", 0.05, 220);
  }

  hurt() {
    this.tone(150, 0.12, "sawtooth", 0.1, 70);
  }

  pickup() {
    this.tone(480, 0.08, "triangle", 0.08, 940);
  }

  door(opened) {
    this.tone(opened ? 260 : 90, 0.12, "square", 0.09, opened ? 120 : 60);
  }

  death() {
    this.tone(60, 0.45, "sawtooth", 0.13, 24);
  }
}
