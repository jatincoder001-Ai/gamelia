(function (global) {
  'use strict';

  const EchoShift = (global.EchoShift = global.EchoShift || {});

  EchoShift.LEVELS = [
    // ==================== LEVEL 1: AWAKENING ====================
    {
      id: 1,
      name: '01 // AWAKENING',
      shortName: 'Awakening',
      desc: 'Awaken in Sector 01. Master suit movement, thruster jumps, and hover-catwalks.',
      theme: 'atrium',
      width: 1650,
      height: 720,
      spawn: { x: 80, y: 510 },
      portal: { x: 1510, y: 344, w: 56, h: 76 },
      platforms: [
        // Starting floor
        { x: 0, y: 560, w: 460, h: 160, style: 'solid' },
        // First step up
        { x: 520, y: 500, w: 220, h: 28, style: 'catwalk' },
        // Second elevated catwalk
        { x: 800, y: 440, w: 230, h: 28, style: 'catwalk' },
        // Landing & portal deck
        { x: 1360, y: 420, w: 290, h: 300, style: 'solid' }
      ],
      movingPlatforms: [
        { startX: 1060, startY: 440, endX: 1230, endY: 420, w: 110, h: 24, speed: 0.9 }
      ],
      switches: [],
      doors: [],
      lasers: [],
      props: [
        { type: 'cryopod', x: 65, y: 560 },
        { type: 'terminal', x: 170, y: 560 },
        { type: 'lamp', x: 240, y: 120 },
        { type: 'lamp', x: 910, y: 120 },
        { type: 'holosign', x: 240, y: 470, text: '[A / D] MOVE', sub: 'TRAVERSE FACILITY FLOOR' },
        { type: 'holosign', x: 490, y: 420, text: '[SPACE] JUMP', sub: 'HOLD FOR HIGHER THRUST' },
        { type: 'holosign', x: 1180, y: 350, text: 'HOVER CARRIAGE', sub: 'RIDE ACROSS THE CHASM' },
        { type: 'holosign', x: 1470, y: 300, text: 'EXTRACTION PORTAL', sub: 'ENTER TO ADVANCE' }
      ]
    },

    // ==================== LEVEL 2: THE LOCKED CHAMBER ====================
    {
      id: 2,
      name: '02 // THE LOCKED CHAMBER',
      shortName: 'The Locked Chamber',
      desc: 'Security bulkheads block the vault. Locate override switches and avoid laser grids.',
      theme: 'vault',
      width: 1780,
      height: 720,
      spawn: { x: 75, y: 510 },
      portal: { x: 1630, y: 484, w: 56, h: 76 },
      platforms: [
        // Main vault floor left
        { x: 0, y: 560, w: 860, h: 160, style: 'solid' },
        // Upper balcony for first override switch
        { x: 230, y: 475, w: 140, h: 24, style: 'catwalk' },
        // Switch 1 platform
        { x: 420, y: 400, w: 180, h: 26, style: 'catwalk' },
        // Ceiling wall above door 1
        { x: 790, y: 0, w: 46, h: 420, style: 'solid' },
        // Central chamber floor
        { x: 920, y: 560, w: 420, h: 160, style: 'solid' },
        // High catwalk for switch 2
        { x: 1020, y: 475, w: 150, h: 24, style: 'catwalk' },
        { x: 1210, y: 405, w: 160, h: 26, style: 'catwalk' },
        // Ceiling wall above door 2
        { x: 1300, y: 0, w: 46, h: 420, style: 'solid' },
        // Exit chamber
        { x: 1340, y: 560, w: 440, h: 160, style: 'solid' }
      ],
      movingPlatforms: [],
      switches: [
        { id: 's1', x: 480, y: 386, w: 46, h: 14, latch: true },
        { id: 's2', x: 1265, y: 391, w: 46, h: 14, latch: true }
      ],
      doors: [
        { id: 'd1', x: 798, y: 420, w: 30, h: 140, switchIds: ['s1'], isEnergyGate: false },
        { id: 'd2', x: 1308, y: 420, w: 30, h: 140, switchIds: ['s2'], isEnergyGate: true }
      ],
      lasers: [
        // Low laser on main floor to jump over
        { x: 640, y: 515, w: 12, h: 45, active: true },
        // Gap hazard between 860 and 920 is a pit, plus laser guard
        { x: 1120, y: 515, w: 12, h: 45, active: true }
      ],
      props: [
        { type: 'terminal', x: 140, y: 560 },
        { type: 'lamp', x: 500, y: 120 },
        { type: 'lamp', x: 1150, y: 120 },
        { type: 'holosign', x: 505, y: 335, text: 'OVERRIDE NODE', sub: 'STEP TO UNLOCK BULKHEAD' },
        { type: 'holosign', x: 646, y: 455, text: 'LASER GRID', sub: 'JUMP TO CLEAR' }
      ]
    },

    // ==================== LEVEL 3: ECHO PROTOCOL ====================
    {
      id: 3,
      name: '03 // ECHO PROTOCOL',
      shortName: 'Echo Protocol',
      desc: 'Pressure locks require constant weight. Project your holographic Echo to hold them.',
      theme: 'lab',
      width: 1920,
      height: 740,
      spawn: { x: 75, y: 530 },
      portal: { x: 1765, y: 504, w: 56, h: 76 },
      platforms: [
        // Starting lab floor
        { x: 0, y: 580, w: 960, h: 160, style: 'solid' },
        // Ceiling barrier above door 1
        { x: 690, y: 0, w: 48, h: 440, style: 'solid' },
        // Second lab section
        { x: 960, y: 580, w: 960, h: 160, style: 'solid' },
        // Step up to elevated switch 2
        { x: 1040, y: 495, w: 130, h: 24, style: 'catwalk' },
        { x: 1200, y: 415, w: 170, h: 26, style: 'catwalk' },
        // Ceiling barrier above door 2
        { x: 1480, y: 0, w: 48, h: 440, style: 'solid' }
      ],
      movingPlatforms: [],
      switches: [
        // Pressure switch 1: must be held down!
        { id: 's1', x: 410, y: 566, w: 52, h: 14, latch: false },
        // Pressure switch 2: elevated!
        { id: 's2', x: 1260, y: 401, w: 52, h: 14, latch: false }
      ],
      doors: [
        { id: 'd1', x: 699, y: 440, w: 30, h: 140, switchIds: ['s1'], isEnergyGate: true },
        { id: 'd2', x: 1489, y: 440, w: 30, h: 140, switchIds: ['s2'], isEnergyGate: true }
      ],
      lasers: [
        { x: 910, y: 535, w: 12, h: 45, active: true }
      ],
      props: [
        { type: 'terminal', x: 160, y: 580 },
        { type: 'cryopod', x: 840, y: 580 },
        { type: 'lamp', x: 435, y: 140 },
        { type: 'lamp', x: 1285, y: 140 },
        { type: 'holosign', x: 436, y: 495, text: '1. STAND HERE ~3s', sub: '2. WALK TO GATE, PRESS [E]' },
        { type: 'holosign', x: 1285, y: 345, text: 'VERTICAL ECHO', sub: 'WAIT 3s, DROP TO GATE, PRESS [E]' }
      ]
    },

    // ==================== LEVEL 4: BROKEN SYSTEMS ====================
    {
      id: 4,
      name: '04 // BROKEN SYSTEMS',
      shortName: 'Broken Systems',
      desc: 'Dual-lock reactor wing. Synchronize your Echo with moving platforms and laser grids.',
      theme: 'reactor',
      width: 2200,
      height: 780,
      spawn: { x: 75, y: 550 },
      portal: { x: 2040, y: 524, w: 56, h: 76 },
      platforms: [
        // Entry deck
        { x: 0, y: 600, w: 420, h: 180, style: 'solid' },
        // Mid-island with laser override
        { x: 740, y: 540, w: 240, h: 240, style: 'solid' },
        // Dual-switch chamber floor
        { x: 1050, y: 600, w: 1150, h: 180, style: 'solid' },
        // Left upper switch platform
        { x: 1130, y: 515, w: 110, h: 24, style: 'catwalk' },
        { x: 1260, y: 435, w: 160, h: 26, style: 'catwalk' },
        // Center bridge between switches
        { x: 1460, y: 435, w: 130, h: 24, style: 'catwalk' },
        // Right upper switch platform
        { x: 1630, y: 435, w: 160, h: 26, style: 'catwalk' },
        // Ceiling wall above dual-lock gate
        { x: 1860, y: 0, w: 48, h: 460, style: 'solid' }
      ],
      movingPlatforms: [
        { startX: 450, startY: 580, endX: 610, endY: 540, w: 110, h: 24, speed: 1.0 }
      ],
      switches: [
        // Disables laser1
        { id: 's1', x: 835, y: 526, w: 48, h: 14, latch: true },
        // Dual simultaneous switches for d1
        { id: 's2', x: 1315, y: 421, w: 48, h: 14, latch: false },
        { id: 's3', x: 1685, y: 421, w: 48, h: 14, latch: false }
      ],
      doors: [
        { id: 'd1', x: 1869, y: 460, w: 30, h: 140, switchIds: ['s2', 's3'], isEnergyGate: true, stayOpen: true }
      ],
      lasers: [
        // Guarded laser disabled by s1
        { x: 960, y: 460, w: 12, h: 80, active: true, disableSwitchId: 's1' },
        // Low floor laser under center bridge
        { x: 1515, y: 555, w: 12, h: 45, active: true }
      ],
      props: [
        { type: 'terminal', x: 150, y: 600 },
        { type: 'lamp', x: 850, y: 120 },
        { type: 'lamp', x: 1520, y: 120 },
        { type: 'holosign', x: 860, y: 465, text: 'LASER OVERRIDE', sub: 'DISABLES BARRIER' },
        { type: 'holosign', x: 1525, y: 365, text: 'DUAL SYNAPSE LOCK', sub: 'HOLD LEFT 3s -> MOVE RIGHT -> [E]' }
      ]
    },

    // ==================== LEVEL 5: CORE SHUTDOWN ====================
    {
      id: 5,
      name: '05 // CORE SHUTDOWN',
      shortName: 'Core Shutdown',
      desc: 'Final extraction. Bypass the unstable core, synchronize dual locks, and escape.',
      theme: 'core',
      width: 2500,
      height: 820,
      spawn: { x: 75, y: 590 },
      portal: { x: 2350, y: 404, w: 58, h: 78 },
      platforms: [
        // Entry platform
        { x: 0, y: 640, w: 360, h: 180, style: 'solid' },
        // Ascent step 1
        { x: 420, y: 570, w: 150, h: 26, style: 'catwalk' },
        // Upper core deck
        { x: 890, y: 480, w: 720, h: 340, style: 'solid' },
        // Raised switch platform 1 (left of core)
        { x: 960, y: 395, w: 160, h: 26, style: 'catwalk' },
        // Raised switch platform 2 (right of core)
        { x: 1320, y: 395, w: 160, h: 26, style: 'catwalk' },
        // Ceiling barrier above final core gate
        { x: 1545, y: 0, w: 48, h: 340, style: 'solid' },
        // Escape bridge steps
        { x: 1680, y: 480, w: 150, h: 26, style: 'catwalk' },
        { x: 1900, y: 450, w: 140, h: 26, style: 'catwalk' },
        // Final extraction deck
        { x: 2220, y: 480, w: 280, h: 340, style: 'solid' }
      ],
      movingPlatforms: [
        { startX: 600, startY: 560, endX: 760, endY: 490, w: 110, h: 24, speed: 1.05 },
        { startX: 2060, startY: 460, endX: 2150, endY: 480, w: 95, h: 24, speed: 1.15 }
      ],
      switches: [
        { id: 's1', x: 1015, y: 381, w: 48, h: 14, latch: false },
        { id: 's2', x: 1375, y: 381, w: 48, h: 14, latch: false }
      ],
      doors: [
        { id: 'd1', x: 1554, y: 340, w: 30, h: 140, switchIds: ['s1', 's2'], isEnergyGate: true, stayOpen: true }
      ],
      lasers: [
        // Core floor laser between switch platforms
        { x: 1210, y: 435, w: 12, h: 45, active: true },
        // Escape bridge laser
        { x: 1750, y: 435, w: 12, h: 45, active: true }
      ],
      props: [
        { type: 'terminal', x: 150, y: 640 },
        { type: 'cryopod', x: 260, y: 640 },
        { type: 'lamp', x: 1215, y: 120 },
        { type: 'lamp', x: 2290, y: 120 },
        { type: 'holosign', x: 1215, y: 325, text: 'CORE LOCKDOWN', sub: 'HOLD S1 ~3s -> CROSS TO S2 -> [E]' },
        { type: 'holosign', x: 2350, y: 350, text: 'SURFACE EXTRACTION', sub: 'ESCAPE FACILITY-09' }
      ]
    }
  ];
})(window);
