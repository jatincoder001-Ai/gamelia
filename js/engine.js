(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  const FIXED_DT = 1 / 60;
  const GRAVITY = 1450;
  const MOVE_SPEED = 275;
  const JUMP_VEL = -565;
  const MAX_FALL = 880;
  const MAX_RECORD_FRAMES = 300; // 5.0 seconds at 60Hz

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  class GameEngine {
    constructor(canvas, audio, particles, art) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.audio = audio;
      this.particles = particles;
      this.art = art;

      this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'complete' | 'victory'
      this.time = 0;
      this.accumulator = 0;
      this.lastFrameTime = 0;

      this.currentLevelIdx = 0;
      this.level = null;

      this.player = null;
      this.recordedFrames = [];
      this.echo = null;
      this.echoTrail = [];

      this.levelTime = 0;
      this.levelEchoes = 0;
      this.totalTime = 0;
      this.totalEchoes = 0;

      this.cam = { x: 0, y: 0 };
      this.keys = { left: false, right: false, jump: false, jumpJustPressed: false };
      this.respawnTimer = 0;
      this.completeTransitionTimer = 0;

      this.onHudUpdate = null;
      this.onLevelComplete = null;
      this.onGameVictory = null;

      this.loadLevel(0, true);
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.viewScale = w < 780 ? Math.max(0.66, w / 780) : 1;
      this.vw = w / this.viewScale;
      this.vh = h / this.viewScale;
      this.dpr = dpr;
    }

    loadLevel(idx, isAttract = false) {
      this.currentLevelIdx = idx;
      const src = EchoShift.LEVELS[idx];
      // Deep clone mutable level state
      this.level = {
        ...src,
        platforms: src.platforms.map((p) => ({ ...p })),
        movingPlatforms: src.movingPlatforms.map((mp) => ({
          ...mp,
          x: mp.startX,
          y: mp.startY,
          dx: 0,
          dy: 0,
          phase: 0
        })),
        switches: src.switches.map((s) => ({ ...s, active: false, wasActive: false })),
        doors: src.doors.map((d) => ({ ...d, openAmount: 0, wasOpen: false, latchedOpen: false })),
        lasers: src.lasers.map((l) => ({ ...l })),
        props: src.props.map((p) => ({ ...p }))
      };

      this.player = {
        x: this.level.spawn.x,
        y: this.level.spawn.y,
        w: 24,
        h: 44,
        vx: 0,
        vy: 0,
        facing: 1,
        onGround: false,
        coyoteTime: 0,
        jumpBuffer: 0,
        animState: 'idle',
        animTime: 0,
        footstepTimer: 0,
        squashX: 1,
        squashY: 1,
        dead: false
      };

      this.recordedFrames = [];
      this.echo = null;
      this.echoTrail = [];
      this.respawnTimer = 0;
      this.completeTransitionTimer = 0;

      if (!isAttract) {
        this.levelTime = 0;
        this.levelEchoes = 0;
      }

      this.particles.reset(this.level.width, this.level.height);
      this.cam.x = Math.max(0, this.player.x - this.vw * 0.35);
      this.cam.y = Math.max(0, this.player.y - this.vh * 0.55);
    }

    startLevel(idx) {
      if (idx === 0) {
        this.totalTime = 0;
        this.totalEchoes = 0;
      }
      this.loadLevel(idx, false);
      this.state = 'playing';
      this.particles.triggerFlash('#2dd4bf', 0.16);
    }

    restartLevel() {
      this.loadLevel(this.currentLevelIdx, false);
      this.state = 'playing';
      this.particles.triggerGlitch(0.15);
    }

    triggerEcho() {
      if (this.state !== 'playing' || this.player.dead) return;
      if (this.recordedFrames.length < 6) return;

      const framesCopy = this.recordedFrames.map((f) => ({ ...f }));
      this.echo = {
        frames: framesCopy,
        index: 0,
        x: framesCopy[0].x,
        y: framesCopy[0].y,
        w: this.player.w,
        h: this.player.h,
        facing: framesCopy[0].facing,
        animState: framesCopy[0].animState,
        animTime: framesCopy[0].animTime,
        dead: false
      };
      this.echoTrail = [];
      this.levelEchoes += 1;
      this.totalEchoes += 1;

      this.audio.playEchoCreate();
      this.particles.emitEchoBurst(this.echo.x + this.echo.w / 2, this.echo.y + this.echo.h / 2);
    }

    setKey(action, pressed) {
      if (action === 'jump' && pressed && !this.keys.jump) {
        this.keys.jumpJustPressed = true;
      }
      this.keys[action] = pressed;
    }

    startLoop() {
      this.lastFrameTime = performance.now();
      const tick = (now) => {
        const rawDt = Math.min(0.05, Math.max(0, (now - this.lastFrameTime) / 1000));
        this.lastFrameTime = now;
        this.update(rawDt);
        this.render();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    update(dt) {
      this.time += dt;

      if (this.state === 'menu') {
        // Gentle cinematic camera pan on title screen
        this.particles.update(dt, this.level.width, this.level.height, this.time);
        const maxCamX = Math.max(0, this.level.width - this.vw);
        this.cam.x = (0.5 + 0.5 * Math.sin(this.time * 0.14)) * maxCamX;
        this.cam.y = Math.max(0, (this.level.height - this.vh) * 0.5);
        return;
      }

      if (this.state !== 'playing') {
        return;
      }

      this.accumulator += dt;
      while (this.accumulator >= FIXED_DT) {
        this.fixedUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }

      this.particles.update(dt, this.level.width, this.level.height, this.time);

      if (this.onHudUpdate) {
        this.onHudUpdate({
          levelName: this.level.name,
          bufferSeconds: this.recordedFrames.length / 60,
          maxBufferSeconds: MAX_RECORD_FRAMES / 60,
          echoActive: !!this.echo,
          echoRemaining: this.echo ? (this.echo.frames.length - this.echo.index) / 60 : 0,
          echoTotal: this.echo ? this.echo.frames.length / 60 : 0
        });
      }
    }

    fixedUpdate(dt) {
      if (this.completeTransitionTimer > 0) {
        this.completeTransitionTimer -= dt;
        if (this.completeTransitionTimer <= 0) {
          this.totalTime += this.levelTime;
          if (this.currentLevelIdx >= EchoShift.LEVELS.length - 1) {
            this.state = 'victory';
            if (this.onGameVictory) {
              this.onGameVictory({ time: this.totalTime, echoes: this.totalEchoes });
            }
          } else {
            this.state = 'complete';
            if (this.onLevelComplete) {
              this.onLevelComplete({
                levelIdx: this.currentLevelIdx,
                time: this.levelTime,
                echoes: this.levelEchoes
              });
            }
          }
        }
        return;
      }

      this.levelTime += dt;

      // Update moving platforms
      for (const mp of this.level.movingPlatforms) {
        const prevX = mp.x;
        const prevY = mp.y;
        mp.phase += dt * mp.speed;
        const t = 0.5 - 0.5 * Math.cos(mp.phase);
        mp.x = mp.startX + (mp.endX - mp.startX) * t;
        mp.y = mp.startY + (mp.endY - mp.startY) * t;
        mp.dx = mp.x - prevX;
        mp.dy = mp.y - prevY;
      }

      // Handle respawn timer if dead
      if (this.player.dead) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.restartLevel();
        }
        return;
      }

      this._updatePlayer(dt);
      this._updateEcho(dt);
      this._updateMechanics(dt);
      this._updateCamera(dt);

      this.keys.jumpJustPressed = false;
    }

    _getSolidRects() {
      const solids = [...this.level.platforms, ...this.level.movingPlatforms];
      for (const d of this.level.doors) {
        if (d.openAmount < 0.72) {
          solids.push({ x: d.x, y: d.y, w: d.w, h: d.h * (1 - d.openAmount) });
        }
      }
      return solids;
    }

    _updatePlayer(dt) {
      const p = this.player;

      // Carry player if standing on a moving platform
      if (p.onGround) {
        for (const mp of this.level.movingPlatforms) {
          if (
            p.x + p.w > mp.x &&
            p.x < mp.x + mp.w &&
            Math.abs(p.y + p.h - mp.y) < 4
          ) {
            p.x += mp.dx;
            p.y += mp.dy;
            break;
          }
        }
      }

      // Horizontal input
      let moveDir = 0;
      if (this.keys.left) moveDir -= 1;
      if (this.keys.right) moveDir += 1;

      if (moveDir !== 0) {
        p.facing = moveDir;
      }
      p.vx = moveDir * MOVE_SPEED;

      // Coyote & jump buffer
      if (p.onGround) {
        p.coyoteTime = 0.1;
      } else {
        p.coyoteTime = Math.max(0, p.coyoteTime - dt);
      }

      if (this.keys.jumpJustPressed) {
        p.jumpBuffer = 0.12;
      } else {
        p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
      }

      if (p.jumpBuffer > 0 && p.coyoteTime > 0) {
        p.vy = JUMP_VEL;
        p.onGround = false;
        p.coyoteTime = 0;
        p.jumpBuffer = 0;
        p.squashX = 0.82;
        p.squashY = 1.2;
        this.audio.playJump();
        this.particles.emitJumpThruster(p.x + p.w / 2, p.y + p.h);
      }

      // Variable jump height
      if (!this.keys.jump && p.vy < -180) {
        p.vy += GRAVITY * 1.4 * dt;
      }

      // Gravity
      p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

      const solids = this._getSolidRects();

      // Move X & resolve
      p.x += p.vx * dt;
      if (p.x < 0) p.x = 0;
      if (p.x + p.w > this.level.width) p.x = this.level.width - p.w;

      for (const s of solids) {
        if (rectsOverlap(p, s)) {
          if (p.vx > 0) p.x = s.x - p.w;
          else if (p.vx < 0) p.x = s.x + s.w;
        }
      }

      // Move Y & resolve
      const wasOnGround = p.onGround;
      p.onGround = false;
      p.y += p.vy * dt;

      for (const s of solids) {
        if (rectsOverlap(p, s)) {
          if (p.vy > 0) {
            p.y = s.y - p.h;
            if (!wasOnGround && p.vy > 220) {
              p.squashX = 1.22;
              p.squashY = 0.8;
              this.audio.playLand();
              this.particles.emitDust(p.x + p.w / 2, p.y + p.h, 6);
            }
            p.vy = 0;
            p.onGround = true;
          } else if (p.vy < 0) {
            p.y = s.y + s.h;
            p.vy = 0;
          }
        }
      }

      // Animation state
      p.squashX += (1 - p.squashX) * 12 * dt;
      p.squashY += (1 - p.squashY) * 12 * dt;

      if (!p.onGround) {
        p.animState = p.vy < 0 ? 'jump' : 'fall';
      } else if (Math.abs(p.vx) > 10) {
        p.animState = 'run';
        p.animTime += dt;
        p.footstepTimer += dt;
        if (p.footstepTimer >= 0.27) {
          p.footstepTimer = 0;
          this.audio.playFootstep();
          this.particles.emitDust(p.x + p.w / 2, p.y + p.h, 2);
        }
      } else {
        p.animState = 'idle';
        p.animTime = 0;
      }

      // Record frame to 5-second rolling buffer
      this.recordedFrames.push({
        x: p.x,
        y: p.y,
        facing: p.facing,
        animState: p.animState,
        animTime: p.animTime
      });
      if (this.recordedFrames.length > MAX_RECORD_FRAMES) {
        this.recordedFrames.shift();
      }

      // Pit death check
      if (p.y > this.level.height + 60) {
        this._killPlayer();
      }
    }

    _updateEcho() {
      if (!this.echo) return;

      this.echoTrail.push({
        x: this.echo.x,
        y: this.echo.y,
        w: this.echo.w,
        h: this.echo.h,
        facing: this.echo.facing,
        animState: this.echo.animState,
        animTime: this.echo.animTime
      });
      if (this.echoTrail.length > 5) this.echoTrail.shift();

      this.echo.index += 1;
      if (this.echo.index >= this.echo.frames.length) {
        this.particles.emitEchoBurst(this.echo.x + this.echo.w / 2, this.echo.y + this.echo.h / 2);
        this.echo = null;
        this.echoTrail = [];
        return;
      }

      const f = this.echo.frames[this.echo.index];
      this.echo.x = f.x;
      this.echo.y = f.y;
      this.echo.facing = f.facing;
      this.echo.animState = f.animState;
      this.echo.animTime = f.animTime;
      this.particles.emitEchoTrail(this.echo.x + this.echo.w / 2, this.echo.y + this.echo.h / 2);
    }

    _updateMechanics(dt) {
      const p = this.player;
      const e = this.echo;

      // Update switches
      const switchMap = {};
      for (const sw of this.level.switches) {
        const triggerBox = { x: sw.x - 2, y: sw.y - 6, w: sw.w + 4, h: sw.h + 8 };
        const pressedNow = rectsOverlap(p, triggerBox) || (e && rectsOverlap(e, triggerBox));

        sw.wasActive = sw.active;
        if (sw.latch) {
          if (pressedNow) sw.active = true;
        } else {
          sw.active = pressedNow;
        }
        if (sw.active !== sw.wasActive) {
          this.audio.playSwitch(sw.active);
        }
        switchMap[sw.id] = sw.active;
      }

      // Update doors
      for (const door of this.level.doors) {
        const allPressed = door.switchIds.every((id) => !!switchMap[id]);
        if (door.stayOpen && allPressed) {
          door.latchedOpen = true;
        }
        const shouldOpen = allPressed || door.latchedOpen;
        if (shouldOpen && !door.wasOpen) {
          this.audio.playDoorOpen();
        }
        door.wasOpen = shouldOpen;

        const target = shouldOpen ? 1 : 0;
        door.openAmount += (target - door.openAmount) * Math.min(1, dt * 8);
      }

      // Update lasers & check hazard collision
      for (const laser of this.level.lasers) {
        if (laser.disableSwitchId && switchMap[laser.disableSwitchId]) {
          laser.active = false;
        }
        if (laser.active) {
          this.particles.emitLaserSpark(laser.x + laser.w / 2, laser.y + laser.h);
          if (rectsOverlap(p, laser)) {
            this._killPlayer();
            return;
          }
        }
      }

      // Check exit portal
      if (rectsOverlap(p, this.level.portal)) {
        this.audio.playVictory();
        this.particles.emitPortalBurst(
          this.level.portal.x + this.level.portal.w / 2,
          this.level.portal.y + this.level.portal.h / 2
        );
        this.completeTransitionTimer = 0.75;
      }
    }

    _killPlayer() {
      if (this.player.dead) return;
      this.player.dead = true;
      this.respawnTimer = 0.65;
      this.audio.playDeath();
      this.particles.emitDeath(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
    }

    _updateCamera(dt) {
      const targetX = this.player.x + this.player.facing * 75 - this.vw * 0.45;
      const targetY = this.player.y - this.vh * 0.54;
      const maxCamX = Math.max(0, this.level.width - this.vw);
      const maxCamY = Math.max(0, this.level.height - this.vh);

      const clampedX = Math.max(0, Math.min(maxCamX, targetX));
      const clampedY = Math.max(0, Math.min(maxCamY, targetY));

      this.cam.x += (clampedX - this.cam.x) * Math.min(1, dt * 6.5);
      this.cam.y += (clampedY - this.cam.y) * Math.min(1, dt * 5.5);
    }

    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.scale(this.dpr * (this.viewScale || 1), this.dpr * (this.viewScale || 1));

      const shake = this.particles.getShakeOffset();
      const camX = this.cam.x + shake.x;
      const camY = this.cam.y + shake.y;

      // Layers 1-3: Sky, silhouettes, midground
      this.art.drawBackground(ctx, this.vw, this.vh, camX, camY, this.level.theme, this.time);

      // Layer 4: World Space
      ctx.save();
      ctx.translate(-camX, -camY);

      // Background decor props
      for (const prop of this.level.props) {
        this.art.drawDecorProp(ctx, prop, this.level.theme, this.time);
      }

      // Switches & conduit wires
      for (const sw of this.level.switches) {
        this.art.drawSwitchAndWire(ctx, sw, this.level.doors, this.time);
      }

      // Exit portal
      this.art.drawPortal(ctx, this.level.portal, this.time);

      // Platforms & moving platforms
      for (const plat of this.level.platforms) {
        this.art.drawPlatform(ctx, plat, this.level.theme, this.time);
      }
      for (const mp of this.level.movingPlatforms) {
        this.art.drawMovingPlatform(ctx, mp, this.level.theme, this.time);
      }

      // Doors & Lasers
      for (const door of this.level.doors) {
        this.art.drawDoor(ctx, door, this.time);
      }
      for (const laser of this.level.lasers) {
        this.art.drawLaser(ctx, laser, this.time);
      }

      // Echo trail + Echo character
      if (this.echo) {
        for (let i = 0; i < this.echoTrail.length; i++) {
          ctx.save();
          ctx.globalAlpha = ((i + 1) / (this.echoTrail.length + 1)) * 0.25;
          this.art.drawCharacter(ctx, this.echoTrail[i], true, this.time);
          ctx.restore();
        }
        this.art.drawCharacter(ctx, this.echo, true, this.time);
      }

      // Player character
      if (this.state !== 'menu') {
        this.art.drawCharacter(ctx, this.player, false, this.time);
      }

      // World particles & shockwaves
      this.particles.renderWorld(ctx);

      ctx.restore();

      // Layers 5-6: Foreground parallax girders & vignette
      this.art.drawForegroundOverlay(ctx, this.vw, this.vh, camX, this.level.theme);

      // Screen flash & glitch slices
      this.particles.renderScreenFX(ctx, this.vw, this.vh);

      ctx.restore();
    }
  }

  EchoShift.GameEngine = GameEngine;
})(window);
