(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  const STORAGE_KEY = 'echoshift_unlocked_level';

  function loadUnlockedLevel() {
    try {
      const val = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return Number.isFinite(val) ? Math.max(0, Math.min(EchoShift.LEVELS.length - 1, val)) : 0;
    } catch (_) {
      return 0;
    }
  }

  function saveUnlockedLevel(idx) {
    try {
      const prev = loadUnlockedLevel();
      if (idx > prev) {
        localStorage.setItem(STORAGE_KEY, String(idx));
      }
    } catch (_) {
      // Ignore storage errors on restricted file:// origins
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const audio = new EchoShift.AudioEngine();
    const particles = new EchoShift.ParticleSystem();
    const art = new EchoShift.ArtRenderer();
    const engine = new EchoShift.GameEngine(canvas, audio, particles, art);

    engine.resize();
    window.addEventListener('resize', () => engine.resize());

    // Screen elements
    const hud = document.getElementById('hud');
    const screens = {
      title: document.getElementById('screen-title'),
      levels: document.getElementById('screen-levels'),
      controls: document.getElementById('screen-controls'),
      settings: document.getElementById('screen-settings'),
      pause: document.getElementById('screen-pause'),
      complete: document.getElementById('screen-complete'),
      victory: document.getElementById('screen-victory')
    };

    let settingsReturnTarget = 'title';

    function showScreen(name) {
      Object.entries(screens).forEach(([key, el]) => {
        el.classList.toggle('active', key === name);
      });
      hud.classList.toggle('hidden', name !== null);
    }

    function renderLevelGrid() {
      const grid = document.getElementById('level-grid');
      const unlocked = loadUnlockedLevel();
      grid.innerHTML = '';

      EchoShift.LEVELS.forEach((lvl, idx) => {
        const isLocked = idx > unlocked;
        const card = document.createElement('button');
        card.className = 'level-card' + (isLocked ? ' locked' : '');
        card.disabled = isLocked;
        card.innerHTML = `
          <div class="level-card-num">SECTOR 0${lvl.id}</div>
          <div class="level-card-name">${lvl.shortName}</div>
          <div class="level-card-desc">${lvl.desc}</div>
          <div class="level-card-status">${isLocked ? 'LOCKED' : 'ACCESS GRANTED'}</div>
        `;
        if (!isLocked) {
          card.addEventListener('click', () => {
            audio.init();
            startLevel(idx);
          });
        }
        grid.appendChild(card);
      });
    }

    function startLevel(idx) {
      showScreen(null);
      engine.startLevel(idx);
    }

    // HUD elements
    const hudLevelName = document.getElementById('hud-level-name');
    const hudEchoDot = document.getElementById('hud-echo-dot');
    const hudEchoLabel = document.getElementById('hud-echo-label');
    const hudEchoTimer = document.getElementById('hud-echo-timer');
    const hudBufferBar = document.getElementById('hud-buffer-bar');
    const hudPlaybackBar = document.getElementById('hud-playback-bar');
    const hudEchoHint = document.getElementById('hud-echo-hint');

    engine.onHudUpdate = (info) => {
      hudLevelName.textContent = info.levelName;
      const bufPct = Math.min(100, (info.bufferSeconds / info.maxBufferSeconds) * 100);
      hudBufferBar.style.width = bufPct + '%';

      if (info.echoActive) {
        hudEchoDot.classList.add('active-echo');
        hudEchoLabel.textContent = 'ECHO ACTIVE';
        hudEchoTimer.textContent = info.echoRemaining.toFixed(1) + 's';
        const playPct = info.echoTotal > 0 ? (info.echoRemaining / info.echoTotal) * 100 : 0;
        hudPlaybackBar.style.width = playPct + '%';
        hudPlaybackBar.classList.add('visible');
        hudEchoHint.textContent = 'HOLOGRAPHIC REPLAY IN PROGRESS';
      } else {
        hudEchoDot.classList.remove('active-echo');
        hudEchoLabel.textContent = 'TEMPORAL BUFFER';
        hudEchoTimer.textContent = info.bufferSeconds.toFixed(1) + 's';
        hudPlaybackBar.classList.remove('visible');
        hudEchoHint.textContent =
          info.bufferSeconds >= 0.4 ? 'PRESS [E] TO DEPLOY ECHO' : 'RECORDING MOVEMENT...';
      }
    };

    engine.onLevelComplete = ({ levelIdx, time, echoes }) => {
      saveUnlockedLevel(levelIdx + 1);
      document.getElementById('complete-title').textContent = `SECTOR 0${levelIdx + 1} CLEARED`;
      document.getElementById('complete-time').textContent = time.toFixed(1) + 's';
      document.getElementById('complete-echoes').textContent = String(echoes);
      showScreen('complete');
    };

    engine.onGameVictory = ({ time, echoes }) => {
      saveUnlockedLevel(EchoShift.LEVELS.length - 1);
      document.getElementById('victory-time').textContent = time.toFixed(1) + 's';
      document.getElementById('victory-echoes').textContent = String(echoes);
      showScreen('victory');
    };

    // Title buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      audio.init();
      startLevel(0);
    });

    document.getElementById('btn-level-select').addEventListener('click', () => {
      audio.init();
      renderLevelGrid();
      showScreen('levels');
    });

    document.getElementById('btn-controls').addEventListener('click', () => {
      audio.init();
      showScreen('controls');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      audio.init();
      settingsReturnTarget = 'title';
      showScreen('settings');
    });

    // Back buttons
    document.getElementById('btn-levels-back').addEventListener('click', () => showScreen('title'));
    document.getElementById('btn-controls-back').addEventListener('click', () => showScreen('title'));
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      showScreen(settingsReturnTarget);
    });

    // Settings controls
    const toggleMute = document.getElementById('toggle-mute');
    toggleMute.addEventListener('click', () => {
      audio.init();
      const nowMuted = !audio.muted;
      audio.setMuted(nowMuted);
      toggleMute.classList.toggle('active', !nowMuted);
      toggleMute.textContent = nowMuted ? 'MUTED' : 'ENABLED';
    });

    document.getElementById('slider-sfx').addEventListener('input', (e) => {
      audio.init();
      audio.setSfxVolume(Number(e.target.value) / 100);
    });

    document.getElementById('slider-ambient').addEventListener('input', (e) => {
      audio.init();
      audio.setAmbientVolume(Number(e.target.value) / 100);
    });

    const toggleShake = document.getElementById('toggle-shake');
    toggleShake.addEventListener('click', () => {
      particles.shakeEnabled = !particles.shakeEnabled;
      toggleShake.classList.toggle('active', particles.shakeEnabled);
      toggleShake.textContent = particles.shakeEnabled ? 'ON' : 'OFF';
    });

    // Touch controls visibility (AUTO | ON | OFF)
    const touchControlsEl = document.getElementById('touch-controls');
    const hudBottomKeys = document.getElementById('hud-bottom-keys');
    const toggleTouch = document.getElementById('toggle-touch');
    const isTouchDevice =
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      'ontouchstart' in window ||
      (navigator.maxTouchPoints || 0) > 0;
    let touchMode = 'AUTO';

    function updateTouchVisibility() {
      const showTouch = touchMode === 'ON' || (touchMode === 'AUTO' && isTouchDevice);
      touchControlsEl.classList.toggle('hidden', !showTouch);
      hudBottomKeys.classList.toggle('hidden', showTouch);
      toggleTouch.textContent = touchMode;
      toggleTouch.classList.toggle('active', touchMode !== 'OFF');
    }

    toggleTouch.addEventListener('click', () => {
      touchMode = touchMode === 'AUTO' ? 'ON' : touchMode === 'ON' ? 'OFF' : 'AUTO';
      updateTouchVisibility();
    });
    updateTouchVisibility();

    function bindHoldButton(el, action) {
      const activePointers = new Set();
      const release = (e) => {
        if (e && activePointers.has(e.pointerId)) {
          activePointers.delete(e.pointerId);
        }
        if (activePointers.size === 0) {
          el.classList.remove('pressed');
          engine.setKey(action, false);
        }
      };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.init();
        activePointers.add(e.pointerId);
        if (el.setPointerCapture) {
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }
        el.classList.add('pressed');
        engine.setKey(action, true);
      });
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
    }

    bindHoldButton(document.getElementById('touch-left'), 'left');
    bindHoldButton(document.getElementById('touch-right'), 'right');
    bindHoldButton(document.getElementById('touch-jump'), 'jump');

    const touchEchoBtn = document.getElementById('touch-echo');
    touchEchoBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.init();
      touchEchoBtn.classList.add('pressed');
      engine.triggerEcho();
    });
    const releaseEcho = () => touchEchoBtn.classList.remove('pressed');
    touchEchoBtn.addEventListener('pointerup', releaseEcho);
    touchEchoBtn.addEventListener('pointercancel', releaseEcho);

    // HUD buttons
    document.getElementById('btn-hud-restart').addEventListener('click', () => {
      engine.restartLevel();
    });

    document.getElementById('btn-hud-pause').addEventListener('click', () => {
      if (engine.state === 'playing') {
        engine.state = 'paused';
        showScreen('pause');
      }
    });

    // Pause menu
    document.getElementById('btn-resume').addEventListener('click', () => {
      engine.state = 'playing';
      showScreen(null);
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      showScreen(null);
      engine.restartLevel();
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      settingsReturnTarget = 'pause';
      showScreen('settings');
    });

    document.getElementById('btn-pause-quit').addEventListener('click', () => {
      engine.state = 'menu';
      engine.loadLevel(0, true);
      showScreen('title');
    });

    // Complete screen
    document.getElementById('btn-next-level').addEventListener('click', () => {
      const next = Math.min(EchoShift.LEVELS.length - 1, engine.currentLevelIdx + 1);
      startLevel(next);
    });

    document.getElementById('btn-replay-level').addEventListener('click', () => {
      startLevel(engine.currentLevelIdx);
    });

    document.getElementById('btn-complete-menu').addEventListener('click', () => {
      engine.state = 'menu';
      renderLevelGrid();
      showScreen('levels');
    });

    // Victory screen
    document.getElementById('btn-victory-replay').addEventListener('click', () => {
      startLevel(0);
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      engine.state = 'menu';
      engine.loadLevel(0, true);
      showScreen('title');
    });

    // Keyboard input
    window.addEventListener('keydown', (e) => {
      audio.init();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        if (engine.state === 'playing') e.preventDefault();
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.setKey('left', true);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.setKey('right', true);
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        engine.setKey('jump', true);
      }

      if (e.code === 'KeyE' && !e.repeat) {
        engine.triggerEcho();
      }

      if (e.code === 'KeyR' && !e.repeat && engine.state === 'playing') {
        engine.restartLevel();
      }

      if (e.code === 'Escape' && !e.repeat) {
        if (engine.state === 'playing') {
          engine.state = 'paused';
          showScreen('pause');
        } else if (engine.state === 'paused') {
          engine.state = 'playing';
          showScreen(null);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.setKey('left', false);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.setKey('right', false);
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        engine.setKey('jump', false);
      }
    });

    // Expose for automated verification if needed
    global.__ECHO_SHIFT__ = { engine, audio, particles };

    engine.startLoop();
  });
})(window);
