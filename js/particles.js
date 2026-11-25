(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.ambientMotes = [];
      this.shockwaves = [];
      this.shakeTime = 0;
      this.shakeIntensity = 0;
      this.shakeEnabled = true;
      this.flashAlpha = 0;
      this.flashColor = '#38bdf8';
      this.glitchTime = 0;
    }

    reset(levelWidth, levelHeight) {
      this.particles = [];
      this.shockwaves = [];
      this.ambientMotes = [];
      const count = Math.min(90, Math.floor((levelWidth * levelHeight) / 18000));
      for (let i = 0; i < count; i++) {
        this.ambientMotes.push({
          x: Math.random() * levelWidth,
          y: Math.random() * levelHeight,
          r: 0.9 + Math.random() * 2.1,
          vx: (Math.random() - 0.5) * 10,
          vy: -4 - Math.random() * 12,
          alpha: 0.15 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.25 ? '#7dd3fc' : '#fbbf24'
        });
      }
    }

    triggerShake(intensity, duration) {
      if (!this.shakeEnabled) return;
      this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
      this.shakeTime = Math.max(this.shakeTime, duration);
    }

    triggerFlash(color, alpha) {
      this.flashColor = color;
      this.flashAlpha = alpha;
    }

    triggerGlitch(duration) {
      this.glitchTime = Math.max(this.glitchTime, duration);
    }

    emitDust(x, y, count, dirY = -1) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 45,
          vy: dirY * (10 + Math.random() * 32),
          life: 0.3 + Math.random() * 0.25,
          maxLife: 0.55,
          size: 1.5 + Math.random() * 2.5,
          color: '#94a3b8',
          glow: false
        });
      }
    }

    emitJumpThruster(x, y) {
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y,
          vx: (Math.random() - 0.5) * 40,
          vy: 30 + Math.random() * 70,
          life: 0.22 + Math.random() * 0.18,
          maxLife: 0.4,
          size: 2 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#38bdf8' : '#2dd4bf',
          glow: true
        });
      }
    }

    emitEchoBurst(x, y) {
      this.shockwaves.push({
        x,
        y,
        r: 6,
        maxR: 78,
        life: 0.45,
        maxLife: 0.45,
        color: '#22d3ee'
      });
      this.triggerGlitch(0.24);
      this.triggerShake(4.5, 0.18);
      this.triggerFlash('#22d3ee', 0.14);

      for (let i = 0; i < 32; i++) {
        const angle = (Math.PI * 2 * i) / 32 + Math.random() * 0.2;
        const speed = 55 + Math.random() * 145;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 24,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35 + Math.random() * 0.35,
          maxLife: 0.7,
          size: 2 + Math.random() * 3,
          color: Math.random() > 0.3 ? '#22d3ee' : '#a855f7',
          glow: true,
          square: Math.random() > 0.5
        });
      }
    }

    emitEchoTrail(x, y) {
      if (Math.random() > 0.55) return;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 28,
        vx: (Math.random() - 0.5) * 14,
        vy: -12 - Math.random() * 20,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.35 ? '#38bdf8' : '#2dd4bf',
        glow: true,
        square: true
      });
    }

    emitDeath(x, y) {
      this.shockwaves.push({
        x,
        y,
        r: 4,
        maxR: 90,
        life: 0.4,
        maxLife: 0.4,
        color: '#f43f5e'
      });
      this.triggerShake(8, 0.32);
      this.triggerFlash('#f43f5e', 0.22);
      this.triggerGlitch(0.3);

      for (let i = 0; i < 38; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 190;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          life: 0.4 + Math.random() * 0.45,
          maxLife: 0.85,
          size: 2 + Math.random() * 3.5,
          color: Math.random() > 0.4 ? '#fb7185' : '#fbbf24',
          glow: true
        });
      }
    }

    emitLaserSpark(x, y) {
      if (Math.random() > 0.45) return;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 80,
        vy: -20 - Math.random() * 60,
        life: 0.16 + Math.random() * 0.16,
        maxLife: 0.32,
        size: 1.4 + Math.random() * 1.8,
        color: Math.random() > 0.3 ? '#fb7185' : '#fde047',
        glow: true
      });
    }

    emitPortalBurst(x, y) {
      this.shockwaves.push({
        x,
        y,
        r: 10,
        maxR: 130,
        life: 0.65,
        maxLife: 0.65,
        color: '#2dd4bf'
      });
      this.triggerFlash('#2dd4bf', 0.22);
      for (let i = 0; i < 48; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 180;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5 + Math.random() * 0.5,
          maxLife: 1.0,
          size: 2 + Math.random() * 3.5,
          color: Math.random() > 0.3 ? '#2dd4bf' : '#fbbf24',
          glow: true
        });
      }
    }

    update(dt, levelWidth, levelHeight, time) {
      if (this.shakeTime > 0) {
        this.shakeTime = Math.max(0, this.shakeTime - dt);
        if (this.shakeTime === 0) this.shakeIntensity = 0;
      }
      if (this.flashAlpha > 0) {
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.9);
      }
      if (this.glitchTime > 0) {
        this.glitchTime = Math.max(0, this.glitchTime - dt);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const s = this.shockwaves[i];
        s.life -= dt;
        if (s.life <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }
        const t = 1 - s.life / s.maxLife;
        s.r = 6 + (s.maxR - 6) * (1 - Math.pow(1 - t, 3));
      }

      for (const m of this.ambientMotes) {
        m.x += (m.vx + Math.sin(time * 0.8 + m.phase) * 6) * dt;
        m.y += m.vy * dt;
        if (m.y < -10) {
          m.y = levelHeight + 10;
          m.x = Math.random() * levelWidth;
        }
        if (m.x < -10) m.x = levelWidth + 10;
        if (m.x > levelWidth + 10) m.x = -10;
      }
    }

    getShakeOffset() {
      if (!this.shakeEnabled || this.shakeTime <= 0) return { x: 0, y: 0 };
      const mag = this.shakeIntensity * (this.shakeTime / 0.25);
      return {
        x: (Math.random() - 0.5) * 2 * Math.min(mag, this.shakeIntensity),
        y: (Math.random() - 0.5) * 2 * Math.min(mag, this.shakeIntensity)
      };
    }

    renderWorld(ctx) {
      // Ambient motes
      for (const m of this.ambientMotes) {
        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Shockwaves
      for (const s of this.shockwaves) {
        const alpha = Math.max(0, s.life / s.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.5 * alpha + 0.5;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (const p of this.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        }
        if (p.square) {
          ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    renderScreenFX(ctx, w, h) {
      if (this.flashAlpha > 0.005) {
        ctx.save();
        ctx.globalAlpha = this.flashAlpha;
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      if (this.glitchTime > 0) {
        ctx.save();
        const slices = 5;
        for (let i = 0; i < slices; i++) {
          const sy = Math.random() * h;
          const sh = 6 + Math.random() * 24;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(34, 211, 238, 0.14)' : 'rgba(168, 85, 247, 0.12)';
          ctx.fillRect(0, sy, w, sh);
        }
        ctx.restore();
      }
    }
  }

  EchoShift.ParticleSystem = ParticleSystem;
})(window);
