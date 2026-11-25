(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  const THEMES = {
    atrium: {
      skyTop: '#040b16',
      skyBottom: '#0c2236',
      fogColor: 'rgba(14, 42, 62, 0.38)',
      accent: '#2dd4bf',
      secondary: '#38bdf8',
      warm: '#f59e0b',
      silhouetteFar: '#071526',
      silhouetteMid: '#0b1e33',
      platformTop: '#334155',
      platformBody: '#162235',
      platformTrim: '#2dd4bf',
      lightShaft: 'rgba(45, 212, 191, 0.06)'
    },
    vault: {
      skyTop: '#0b0914',
      skyBottom: '#231622',
      fogColor: 'rgba(42, 22, 28, 0.36)',
      accent: '#f59e0b',
      secondary: '#38bdf8',
      warm: '#fb923c',
      silhouetteFar: '#120e1c',
      silhouetteMid: '#1a1528',
      platformTop: '#3f3b4a',
      platformBody: '#1b1826',
      platformTrim: '#f59e0b',
      lightShaft: 'rgba(245, 158, 11, 0.065)'
    },
    lab: {
      skyTop: '#030a18',
      skyBottom: '#0a2540',
      fogColor: 'rgba(10, 45, 78, 0.36)',
      accent: '#22d3ee',
      secondary: '#a855f7',
      warm: '#38bdf8',
      silhouetteFar: '#07182e',
      silhouetteMid: '#0c2340',
      platformTop: '#324861',
      platformBody: '#132033',
      platformTrim: '#22d3ee',
      lightShaft: 'rgba(34, 211, 238, 0.07)'
    },
    reactor: {
      skyTop: '#0d0717',
      skyBottom: '#271336',
      fogColor: 'rgba(46, 18, 62, 0.38)',
      accent: '#a855f7',
      secondary: '#f59e0b',
      warm: '#fb7185',
      silhouetteFar: '#140b24',
      silhouetteMid: '#1d1033',
      platformTop: '#3b3352',
      platformBody: '#191329',
      platformTrim: '#c084fc',
      lightShaft: 'rgba(168, 85, 247, 0.065)'
    },
    core: {
      skyTop: '#12050d',
      skyBottom: '#2d0c1e',
      fogColor: 'rgba(58, 14, 32, 0.4)',
      accent: '#fb7185',
      secondary: '#22d3ee',
      warm: '#fbbf24',
      silhouetteFar: '#1a0914',
      silhouetteMid: '#260d1d',
      platformTop: '#472d3d',
      platformBody: '#1f101a',
      platformTrim: '#fb7185',
      lightShaft: 'rgba(251, 113, 133, 0.07)'
    }
  };

  class ArtRenderer {
    getTheme(name) {
      return THEMES[name] || THEMES.atrium;
    }

    // ==================== BACKGROUND & PARALLAX ====================
    drawBackground(ctx, vw, vh, camX, camY, themeName, time) {
      const theme = this.getTheme(themeName);

      // Layer 1: Deep atmospheric gradient
      const grad = ctx.createLinearGradient(0, 0, 0, vh);
      grad.addColorStop(0, theme.skyTop);
      grad.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, vw, vh);

      // Distant stars / facility sensor nodes (0.05x)
      ctx.save();
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 197 + 43 - camX * 0.04) % (vw + 100) + (vw + 100)) % (vw + 100) - 50;
        const sy = ((i * 113 + 29 - camY * 0.03) % (vh * 0.72) + vh * 0.72) % (vh * 0.72);
        const twinkle = 0.25 + 0.45 * Math.sin(time * 1.4 + i * 2.1);
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = i % 5 === 0 ? theme.accent : '#cbd5e1';
        ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
      }
      ctx.restore();

      // Distant glowing planet / reactor moon (0.08x)
      ctx.save();
      const px = vw * 0.78 - camX * 0.06;
      const py = vh * 0.22 - camY * 0.04;
      const pGrad = ctx.createRadialGradient(px - 24, py - 24, 10, px, py, 95);
      pGrad.addColorStop(0, theme.accent + '44');
      pGrad.addColorStop(0.6, theme.secondary + '18');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Layer 2: Distant city / megastructure silhouettes (0.2x)
      this._drawFarSilhouettes(ctx, vw, vh, camX * 0.2, theme, time);

      // Layer 3: Midground industrial arches, turbines & windows (0.45x)
      this._drawMidground(ctx, vw, vh, camX * 0.45, camY * 0.25, theme, time);

      // Atmospheric depth fog band
      const fogGrad = ctx.createLinearGradient(0, vh * 0.45, 0, vh);
      fogGrad.addColorStop(0, 'transparent');
      fogGrad.addColorStop(1, theme.fogColor);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, vh * 0.45, vw, vh * 0.55);
    }

    _drawFarSilhouettes(ctx, vw, vh, offsetX, theme, time) {
      ctx.save();
      const span = 260;
      const startIdx = Math.floor(offsetX / span) - 1;
      const count = Math.ceil(vw / span) + 3;

      for (let i = startIdx; i < startIdx + count; i++) {
        const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        const x = i * span - offsetX;
        const bw = 110 + seed * 120;
        const bh = 180 + ((seed * 7) % 1) * 240;
        const y = vh - bh;

        ctx.fillStyle = theme.silhouetteFar;
        ctx.fillRect(x, y, bw, bh);

        // Stepped spire or antenna
        if (seed > 0.45) {
          ctx.fillRect(x + bw * 0.25, y - 34, bw * 0.5, 34);
          ctx.fillRect(x + bw * 0.48, y - 72, 3, 38);
          const blink = 0.4 + 0.6 * Math.sin(time * 2.5 + i);
          ctx.fillStyle = theme.warm;
          ctx.globalAlpha = blink;
          ctx.fillRect(x + bw * 0.48 - 1, y - 75, 5, 5);
          ctx.globalAlpha = 1;
        }

        // Tiny distant lit windows
        ctx.fillStyle = theme.accent;
        for (let wy = y + 24; wy < vh - 40; wy += 26) {
          if (((wy + i * 17) % 3) === 0) {
            ctx.globalAlpha = 0.16;
            ctx.fillRect(x + 14, wy, bw - 28, 3);
          }
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    _drawMidground(ctx, vw, vh, offsetX, offsetY, theme, time) {
      ctx.save();
      const span = 420;
      const startIdx = Math.floor(offsetX / span) - 1;
      const count = Math.ceil(vw / span) + 3;

      for (let i = startIdx; i < startIdx + count; i++) {
        const x = i * span - offsetX;

        // Vertical structural pillar
        ctx.fillStyle = theme.silhouetteMid;
        ctx.fillRect(x + 20, 0, 44, vh);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x + 20, 0, 4, vh);

        // Overhead arch beam
        ctx.fillStyle = theme.silhouetteMid;
        ctx.fillRect(x, 42 - offsetY * 0.2, span, 28);

        // Large observation window frame with glowing interior edge
        const winX = x + 110;
        const winY = 120 - offsetY * 0.3;
        const winW = 210;
        const winH = 140;
        ctx.strokeStyle = theme.silhouetteMid;
        ctx.lineWidth = 10;
        ctx.strokeRect(winX, winY, winW, winH);
        ctx.strokeStyle = theme.accent + '22';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(winX + 6, winY + 6, winW - 12, winH - 12);

        // Slowly rotating giant ventilation fan inside alternate bays
        if (i % 2 === 0) {
          const cx = x + 215;
          const cy = vh * 0.62 - offsetY * 0.2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.strokeStyle = theme.silhouetteMid;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 62, 0, Math.PI * 2);
          ctx.stroke();

          ctx.rotate(time * 0.35 + i);
          ctx.fillStyle = theme.silhouetteMid;
          for (let b = 0; b < 5; b++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(54, -14);
            ctx.lineTo(54, 10);
            ctx.lineTo(0, 6);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Hanging catenary cable
        ctx.strokeStyle = '#09111e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 64, 70 - offsetY * 0.2);
        ctx.quadraticCurveTo(
          x + span * 0.5,
          135 + Math.sin(time * 1.1 + i) * 6 - offsetY * 0.2,
          x + span + 20,
          70 - offsetY * 0.2
        );
        ctx.stroke();
      }

      // Volumetric light shafts
      for (let i = startIdx; i < startIdx + count; i++) {
        if (i % 2 !== 0) continue;
        const lx = i * span - offsetX + 120;
        const shaftGrad = ctx.createLinearGradient(lx, 0, lx + 140, vh);
        shaftGrad.addColorStop(0, theme.lightShaft);
        shaftGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + 110, 0);
        ctx.lineTo(lx + 260, vh);
        ctx.lineTo(lx + 90, vh);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // ==================== LEVEL GEOMETRY & PROPS ====================
    drawPlatform(ctx, p, themeName, time) {
      const theme = this.getTheme(themeName);
      const { x, y, w, h, style } = p;

      ctx.save();

      // Structural support struts underneath floating catwalks
      if (style === 'catwalk' && h <= 36) {
        ctx.fillStyle = '#0c1524';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1.5;
        // Diagonal truss ribs
        const step = 40;
        ctx.beginPath();
        for (let tx = x + 12; tx < x + w - 16; tx += step) {
          ctx.moveTo(tx, y + h);
          ctx.lineTo(tx + step * 0.5, y + h + 14);
          ctx.lineTo(tx + step, y + h);
        }
        ctx.stroke();
      }

      // Main beveled metallic body
      const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
      bodyGrad.addColorStop(0, theme.platformTop);
      bodyGrad.addColorStop(0.28, theme.platformBody);
      bodyGrad.addColorStop(1, '#09101c');
      ctx.fillStyle = bodyGrad;

      // Chamfered corners
      const c = Math.min(8, w * 0.15, h * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + c, y);
      ctx.lineTo(x + w - c, y);
      ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h - c);
      ctx.lineTo(x + w - c, y + h);
      ctx.lineTo(x + c, y + h);
      ctx.lineTo(x, y + h - c);
      ctx.lineTo(x, y + c);
      ctx.closePath();
      ctx.fill();

      // Subtle panel seams & rivets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      for (let sx = x + 64; sx < x + w - 16; sx += 64) {
        ctx.beginPath();
        ctx.moveTo(sx, y + 6);
        ctx.lineTo(sx, y + h - 6);
        ctx.stroke();
      }

      // Top tread plate highlight + glowing trim strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x + c, y + 1, w - c * 2, 3);

      // Glowing energy conduit along upper edge
      const pulse = 0.55 + 0.25 * Math.sin(time * 2 + x * 0.02);
      ctx.fillStyle = theme.platformTrim;
      ctx.globalAlpha = pulse;
      ctx.fillRect(x + 10, y + 6, w - 20, 2);
      ctx.globalAlpha = 1;

      // Rivets
      ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
      for (let rx = x + 14; rx < x + w - 10; rx += 32) {
        ctx.beginPath();
        ctx.arc(rx, y + 13, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer crisp metallic border
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    drawMovingPlatform(ctx, mp, themeName, time) {
      const theme = this.getTheme(themeName);
      const { x, y, w, h, startX, startY, endX, endY } = mp;

      ctx.save();

      // Guide rail in background
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX + w / 2, startY + h / 2);
      ctx.lineTo(endX + w / 2, endY + h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Downward hover thruster plumes
      const flicker = 0.8 + Math.random() * 0.35;
      [x + 18, x + w - 18].forEach((tx) => {
        const tGrad = ctx.createLinearGradient(tx, y + h, tx, y + h + 22 * flicker);
        tGrad.addColorStop(0, theme.accent + 'cc');
        tGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.moveTo(tx - 7, y + h);
        ctx.lineTo(tx + 7, y + h);
        ctx.lineTo(tx, y + h + 22 * flicker);
        ctx.closePath();
        ctx.fill();
      });

      // Hover-carriage body
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + w - 8, y);
      ctx.lineTo(x + w, y + 6);
      ctx.lineTo(x + w - 6, y + h);
      ctx.lineTo(x + 6, y + h);
      ctx.lineTo(x, y + 6);
      ctx.closePath();
      ctx.fill();

      // Glowing core strip
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 10;
      ctx.fillStyle = theme.accent;
      ctx.fillRect(x + 14, y + 5, w - 28, 3);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    drawDecorProp(ctx, prop, themeName, time) {
      const theme = this.getTheme(themeName);
      ctx.save();
      if (prop.type === 'terminal') {
        const { x, y } = prop;
        // Pedestal
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 10, y - 34, 20, 34);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 14, y - 6, 28, 6);
        // Angled holographic screen
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 12;
        ctx.fillStyle = theme.accent + '33';
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x - 16, y - 54, 32, 20);
        ctx.strokeRect(x - 16, y - 54, 32, 20);
        // Screen data lines
        ctx.fillStyle = theme.accent;
        ctx.fillRect(x - 12, y - 49, 18, 2);
        ctx.fillRect(x - 12, y - 44, 24 * (0.6 + 0.4 * Math.sin(time * 3)), 2);
        ctx.fillRect(x - 12, y - 39, 14, 2);
      } else if (prop.type === 'cryopod') {
        const { x, y } = prop;
        ctx.fillStyle = '#162032';
        ctx.fillRect(x - 20, y - 78, 40, 78);
        const podGrad = ctx.createLinearGradient(x - 14, y - 70, x + 14, y - 10);
        podGrad.addColorStop(0, theme.secondary + '44');
        podGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        ctx.fillStyle = podGrad;
        ctx.fillRect(x - 13, y - 68, 26, 56);
        ctx.strokeStyle = theme.secondary + '88';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 13, y - 68, 26, 56);
        // Floating bubbles inside pod
        ctx.fillStyle = theme.secondary;
        for (let b = 0; b < 4; b++) {
          const by = y - 16 - ((time * 18 + b * 14) % 48);
          ctx.beginPath();
          ctx.arc(x - 5 + b * 3.5, by, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (prop.type === 'lamp') {
        const { x, y } = prop;
        const flicker = Math.sin(time * 19 + x) > 0.94 ? 0.25 : 1;
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 14, y, 28, 6);
        ctx.globalAlpha = flicker;
        ctx.fillStyle = theme.warm;
        ctx.shadowColor = theme.warm;
        ctx.shadowBlur = 14;
        ctx.fillRect(x - 10, y + 6, 20, 3);
        const cone = ctx.createLinearGradient(x, y + 8, x, y + 120);
        cone.addColorStop(0, theme.warm + '28');
        cone.addColorStop(1, 'transparent');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 8);
        ctx.lineTo(x + 10, y + 8);
        ctx.lineTo(x + 48, y + 120);
        ctx.lineTo(x - 48, y + 120);
        ctx.closePath();
        ctx.fill();
      } else if (prop.type === 'holosign') {
        const { x, y, text, sub } = prop;
        ctx.textAlign = 'center';
        ctx.font = '700 12px Consolas, monospace';
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 10;
        ctx.fillStyle = theme.accent;
        ctx.fillText(text, x, y - 14);
        if (sub) {
          ctx.font = '500 10px Consolas, monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.shadowBlur = 0;
          ctx.fillText(sub, x, y + 2);
        }
      }
      ctx.restore();
    }

    drawSwitchAndWire(ctx, sw, doors, time) {
      const color = sw.active ? '#2dd4bf' : '#f59e0b';

      // Draw energy conduit wire to linked doors
      ctx.save();
      for (const door of doors) {
        if (door.switchIds && door.switchIds.includes(sw.id)) {
          ctx.strokeStyle = sw.active ? 'rgba(45, 212, 191, 0.7)' : 'rgba(245, 158, 11, 0.28)';
          ctx.lineWidth = sw.active ? 2.5 : 1.5;
          ctx.setLineDash(sw.active ? [] : [5, 5]);
          ctx.beginPath();
          const sx = sw.x + sw.w / 2;
          const sy = sw.y + sw.h;
          const dx = door.x + door.w / 2;
          const dy = door.y + door.h;
          const midY = Math.max(sy, dy) + 18;
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, midY);
          ctx.lineTo(dx, midY);
          ctx.lineTo(dx, dy);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Draw pressure switch housing
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sw.x - 4, sw.y + 4, sw.w + 8, sw.h - 2);

      const pressOffset = sw.active ? 4 : 0;
      ctx.shadowColor = color;
      ctx.shadowBlur = sw.active ? 16 : 8;
      ctx.fillStyle = color;
      ctx.fillRect(sw.x + 2, sw.y + pressOffset, sw.w - 4, 6);

      // Subtle holographic ring above switch
      ctx.globalAlpha = sw.active ? 0.5 : 0.22 + 0.1 * Math.sin(time * 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sw.x + sw.w / 2, sw.y - 4, sw.w * 0.42, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawDoor(ctx, door, time) {
      const { x, y, w, h, openAmount, isEnergyGate } = door;
      ctx.save();

      // Armored bulkhead frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 4, y - 8, w + 8, 10);
      ctx.fillRect(x - 4, y + h - 2, w + 8, 6);

      // Status indicator light at top
      const unlocked = openAmount > 0.5;
      ctx.fillStyle = unlocked ? '#2dd4bf' : '#f43f5e';
      ctx.shadowColor = unlocked ? '#2dd4bf' : '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x + w / 2, y - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const closedH = h * (1 - openAmount);
      if (closedH > 1) {
        if (isEnergyGate) {
          // Shimmering plasma barrier
          ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
          ctx.fillRect(x + 4, y, w - 8, closedH);
          ctx.strokeStyle = '#fb7185';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;
          for (let py = y + 8; py < y + closedH; py += 14) {
            const jitter = Math.sin(time * 18 + py) * 2;
            ctx.beginPath();
            ctx.moveTo(x + 4, py);
            ctx.lineTo(x + w - 4, py + jitter);
            ctx.stroke();
          }
        } else {
          // Heavy hydraulic blast door
          const dGrad = ctx.createLinearGradient(x, y, x + w, y);
          dGrad.addColorStop(0, '#334155');
          dGrad.addColorStop(0.5, '#475569');
          dGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = dGrad;
          ctx.fillRect(x + 2, y, w - 4, closedH);

          // Hazard stripes
          ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
          for (let sy = y + 10; sy < y + closedH - 10; sy += 24) {
            ctx.fillRect(x + 6, sy, w - 12, 6);
          }
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y, w - 4, closedH);
        }
      }

      ctx.restore();
    }

    drawLaser(ctx, laser, time) {
      const { x, y, w, h, active } = laser;
      ctx.save();

      // Emitter housings
      ctx.fillStyle = '#334155';
      if (w >= h) {
        ctx.fillRect(x - 4, y - 5, 10, h + 10);
        ctx.fillRect(x + w - 6, y - 5, 10, h + 10);
      } else {
        ctx.fillRect(x - 5, y - 4, w + 10, 10);
        ctx.fillRect(x - 5, y + h - 6, w + 10, 10);
      }

      if (active) {
        const pulse = 0.85 + 0.15 * Math.sin(time * 24);
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 18 * pulse;
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.fillRect(x, y, w, h);

        // Hot white-pink core
        ctx.fillStyle = '#ffe4e6';
        if (w >= h) {
          ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
        } else {
          ctx.fillRect(x + w * 0.3, y, w * 0.4, h);
        }
      } else {
        // Inactive faint guide line
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPortal(ctx, portal, time) {
      const cx = portal.x + portal.w / 2;
      const cy = portal.y + portal.h / 2;
      const r = Math.min(portal.w, portal.h) * 0.56;

      ctx.save();

      // Floor pedestal
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(portal.x - 10, portal.y + portal.h - 4, portal.w + 20, 10);
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(portal.x - 4, portal.y + portal.h - 4, portal.w + 8, 3);

      // Outer swirling glow
      const pGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r * 1.45);
      pGrad.addColorStop(0, 'rgba(224, 247, 250, 0.9)');
      pGrad.addColorStop(0.45, 'rgba(45, 212, 191, 0.45)');
      pGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Counter-rotating tech rings
      ctx.translate(cx, cy);
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 14;

      ctx.save();
      ctx.rotate(time * 1.4);
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.rotate(-time * 2.1);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // ==================== CHARACTER & ECHO DESIGN ====================
    drawCharacter(ctx, entity, isEcho, time) {
      const { x, y, w, h, facing, animState, animTime, squashX = 1, squashY = 1, dead } = entity;
      if (dead) return;

      const cx = x + w / 2;
      const bottomY = y + h;

      ctx.save();
      ctx.translate(cx, bottomY);
      ctx.scale(facing * squashX, squashY);

      if (isEcho) {
        // Holographic Echo glitch jitter
        const glitchOffset = Math.sin(time * 37) > 0.92 ? (Math.random() - 0.5) * 6 : 0;
        ctx.translate(glitchOffset, 0);
        ctx.globalAlpha = 0.74 + 0.12 * Math.sin(time * 12);
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 16;
      } else {
        // Subtle rim glow in dark environments
        ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
        ctx.shadowBlur = 10;
      }

      // Compute procedural pose angles
      let legSwing = 0;
      let armSwing = 0;
      let bobY = 0;
      let lean = 0;

      if (animState === 'run') {
        const cycle = animTime * 11.5;
        legSwing = Math.sin(cycle) * 0.62;
        armSwing = -Math.sin(cycle) * 0.52;
        bobY = Math.abs(Math.cos(cycle)) * -2.5;
        lean = 0.08;
      } else if (animState === 'jump') {
        legSwing = 0.38;
        armSwing = -0.65;
        lean = 0.05;
      } else if (animState === 'fall') {
        legSwing = -0.22;
        armSwing = -0.95;
        lean = -0.04;
      } else {
        // Idle breathing
        bobY = Math.sin(time * 3.0) * 1.3;
        armSwing = Math.sin(time * 3.0) * 0.06;
      }

      ctx.translate(0, bobY);
      ctx.rotate(lean);

      // Color palette: Astronaut vs Holographic Echo
      const suitMain = isEcho ? 'rgba(34, 211, 238, 0.32)' : '#e2e8f0';
      const suitDark = isEcho ? 'rgba(14, 116, 144, 0.5)' : '#475569';
      const suitAccent = isEcho ? '#22d3ee' : '#38bdf8';
      const visorFill = isEcho ? '#67e8f9' : '#0f172a';
      const strokeCol = isEcho ? '#67e8f9' : '#1e293b';

      // --- Back Arm ---
      this._drawLimb(ctx, -1, -26, -armSwing, 13, 4.5, suitDark, strokeCol);

      // --- Back Leg ---
      this._drawLeg(ctx, -2, -14, -legSwing, 14, suitDark, strokeCol, isEcho);

      // --- Life-Support Backpack ---
      ctx.fillStyle = suitDark;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-13, -31, 8, 17, 3);
      ctx.fill();
      ctx.stroke();

      // Backpack glowing core
      ctx.fillStyle = isEcho ? '#a855f7' : '#2dd4bf';
      ctx.fillRect(-11.5, -27, 4, 8);

      // --- Torso Armor ---
      ctx.fillStyle = suitMain;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-7, -30, 14, 17, 4);
      ctx.fill();
      ctx.stroke();

      // Chest telemetry plate
      ctx.fillStyle = suitDark;
      ctx.fillRect(-3, -27, 8, 7);
      ctx.fillStyle = suitAccent;
      ctx.fillRect(-1, -25, 4, 3);

      // --- Front Leg ---
      this._drawLeg(ctx, 2, -14, legSwing, 14, suitMain, strokeCol, isEcho);

      // --- Helmet ---
      ctx.save();
      ctx.translate(1, -37);
      ctx.fillStyle = suitMain;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curved Reflective Visor
      ctx.fillStyle = visorFill;
      ctx.beginPath();
      ctx.ellipse(3.2, -0.5, 6.2, 5.2, 0, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.closePath();
      ctx.fill();

      // Glowing visor highlight
      ctx.strokeStyle = isEcho ? '#ecfeff' : '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(3.5, -1.5, 4.2, -0.7, 0.5);
      ctx.stroke();

      // Helmet antenna nub
      ctx.fillStyle = suitAccent;
      ctx.fillRect(-7, -9, 2.5, 5);
      ctx.restore();

      // --- Front Arm ---
      this._drawLimb(ctx, 1, -26, armSwing, 13, 4.8, suitMain, strokeCol);

      // Echo horizontal scanline overlay
      if (isEcho) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        for (let sy = -44; sy < 0; sy += 5) {
          if (((Math.floor(time * 24) + sy) % 3) === 0) {
            ctx.fillRect(-12, sy, 24, 1.2);
          }
        }
      }

      ctx.restore();
    }

    _drawLimb(ctx, ox, oy, angle, len, width, fill, stroke) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-width / 2, 0, width, len, 2.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    _drawLeg(ctx, ox, oy, angle, len, fill, stroke, isEcho) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6, len - 3, 2);
      ctx.fill();
      ctx.stroke();

      // Heavy magnetic boot
      ctx.fillStyle = isEcho ? '#22d3ee' : '#334155';
      ctx.beginPath();
      ctx.roundRect(-3.5, len - 5, 8.5, 5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawForegroundOverlay(ctx, vw, vh, camX, themeName) {
      const theme = this.getTheme(themeName);
      ctx.save();

      // Layer 5: Foreground silhouetted girders (1.25x parallax)
      const span = 780;
      const offsetX = camX * 1.25;
      const startIdx = Math.floor(offsetX / span) - 1;
      const count = Math.ceil(vw / span) + 3;

      ctx.fillStyle = '#03070f';
      for (let i = startIdx; i < startIdx + count; i++) {
        const x = i * span - offsetX;
        ctx.fillRect(x, 0, 26, vh);
        // Top corner gusset
        ctx.beginPath();
        ctx.moveTo(x + 26, 0);
        ctx.lineTo(x + 86, 0);
        ctx.lineTo(x + 26, 60);
        ctx.closePath();
        ctx.fill();
      }

      // Layer 6: Subtle warm/cool edge vignette
      const vig = ctx.createRadialGradient(vw / 2, vh / 2, vh * 0.32, vw / 2, vh / 2, vw * 0.72);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(2, 5, 12, 0.52)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, vh);

      // Subtle top rim tint
      ctx.fillStyle = theme.lightShaft;
      ctx.fillRect(0, 0, vw, 4);

      ctx.restore();
    }
  }

  EchoShift.ArtRenderer = ArtRenderer;
})(window);
