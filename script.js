/* ═══════════════════════════════════════════════════════════
   LUNAR 30 — MISSION CONTROL  |  script.js
   Senior Frontend / Educational Game Design Implementation
   NASA Space Apps Challenge 2026
═══════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════════════
   GAME STATE
══════════════════════════════════════════════════════════ */
const INITIAL_STATE = {
  day: 1,
  maxDays: 7,
  score: 0,
  resources: {
    oxygen: 80,
    water:  75,
    food:   90,
    power:  70,
    rad:    100
  },
  crew: [
    { name: 'Dr. Yuki Tanaka',  role: 'Geologist',         emoji: '🧑‍🔬', health: 'ok' },
    { name: 'Lt. Marcus Webb',  role: 'Systems Engineer',   emoji: '👨‍💻', health: 'ok' },
    { name: 'Dr. Priya Nair',   role: 'Biologist / Medical', emoji: '👩‍⚕️', health: 'ok' },
    { name: 'Cdr. Alex Rivera', role: 'Commander',          emoji: '👨‍🚀', health: 'ok' }
  ],
  discoveries: [],
  missionLog: [],
  objectives: {
    survive:    { label: 'Survive 7 days',           done: false, fail: false },
    science:    { label: 'Complete 2 experiments',   done: false, fail: false, count: 0 },
    crewSafe:   { label: 'No crew casualties',       done: false, fail: false },
    powerMgmt:  { label: 'Maintain power > 20%',     done: false, fail: false }
  },
  eventIndex: 0,
  failReason: '',
  gameOver: false,
  pendingEvent: null,
  choiceMade: false
};

let STATE = {};

/* ══════════════════════════════════════════════════════════
   EVENTS DECK — 7 days, each with 2–3 choices
   effects: { oxygen, water, food, power, rad, score, crew }
   crew effect: { type:'health', target:'all'|index, value:'ok'|'tired'|'crit'|'down' }
══════════════════════════════════════════════════════════ */
const EVENTS = [

  /* ── DAY 1 ─────────────────────────────────────────── */
  {
    day: 1,
    category: 'OPERATIONS',
    artClass: 'art-science',
    artEmoji: '🌙',
    title: 'First Moonrise Report',
    desc: `All systems are green at Outpost Shackleton. Dr. Tanaka has flagged an anomalous spectral reading in a nearby crater. Meanwhile Lt. Webb warns that the water recycler is running 12% below optimal efficiency. How do you allocate the crew's first shift?`,
    scienceTag: '🔬 REAL SCIENCE: Lunar south pole craters contain water ice confirmed by NASA\'s LCROSS (2009) and Mini-RF radar on LRO.',
    choices: [
      {
        label: '🔭 Deploy Dr. Tanaka to investigate the spectral anomaly',
        hint: 'Could yield a scientific discovery but takes crew time away from maintenance.',
        costs: ['+15 score', '-5% power', '+discovery chance'],
        effects: { power: -5, score: 15 },
        discovery: { name: 'Subsurface Ice Vein', desc: 'Tanaka locates a shallow ice vein — a potential water source that could extend the mission.' }
      },
      {
        label: '🔧 Assign Lt. Webb to repair the water recycler first',
        hint: 'Safe and practical — recovers water efficiency.',
        costs: ['+8% water', '-5 score (missed science)'],
        effects: { water: 8, score: -5 }
      },
      {
        label: '⚡ Run both tasks — split crew and work double shifts',
        hint: 'Ambitious but crew fatigue increases. Webb fixes recycler; Tanaka investigates.',
        costs: ['+5% water', '+8 score', 'crew fatigue ×2'],
        effects: { water: 5, score: 8, crew: { type: 'health', target: [0,1], value: 'tired' } }
      }
    ]
  },

  /* ── DAY 2 ─────────────────────────────────────────── */
  {
    day: 2,
    category: 'SPACE WEATHER',
    artClass: 'art-storm',
    artEmoji: '☀️',
    title: 'Solar Energetic Particle Event',
    desc: `DONKI-class M-flare detected on the solar disk. Particle sensors show elevated proton flux. This could affect electronics and — depending on shielding — increase radiation exposure for EVA crew. The base's regolith shielding provides good protection; risk is highest for anyone outside. Webb is mid-EVA on solar panel maintenance.`,
    scienceTag: `📡 NASA DONKI DATA TYPE — SOLAR FLARE (FLR) & SEP:
Solar flares release X-rays and UV radiation almost instantaneously; at the lunar surface these are largely absorbed by the lack of atmosphere but do not directly cause dangerous tissue doses. The separate Solar Energetic Particle (SEP) event — high-energy protons that follow days later — is the real crew hazard, and only if the SEP is Earth/Moon-directed and particle energies exceed ~30 MeV. A flare classification alone (A/B/C/M/X) does NOT indicate a dangerous radiation dose for a shielded crew. See the DONKI panel for real recent events.`,
    choices: [
      {
        label: '🛡️ Recall Webb immediately — abort EVA',
        hint: 'Safest for crew. Solar panel maintenance postponed.',
        costs: ['-8% power (panels unmaintained)', '+15 score (safe choice)'],
        effects: { power: -8, score: 15 }
      },
      {
        label: '⚡ Let Webb finish — 20 more minutes of exposure',
        hint: 'Panels get cleaned but Webb risks elevated dose.',
        costs: ['+10% power', '-15% rad shield', 'Webb health risk'],
        effects: { power: 10, rad: -15, crew: { type: 'health', target: [1], value: 'tired' } }
      },
      {
        label: '📡 Boost regolith shield emitters and continue at reduced pace',
        hint: 'Compromise: moderate protection, partial work completed.',
        costs: ['-5% power (emitters)', '+5% power (partial cleaning)', '+5 score'],
        effects: { power: -3, rad: -5, score: 5 }
      }
    ]
  },

  /* ── DAY 3 ─────────────────────────────────────────── */
  {
    day: 3,
    category: 'EQUIPMENT FAILURE',
    artClass: 'art-power',
    artEmoji: '⚡',
    title: 'Solar Array Fault',
    desc: `A micrometeorite impact has damaged one of the three solar array strings. Power output has dropped 20%. The base can survive on reduced power, but non-essential systems must be rationed. Dr. Nair flags that the medical bay heaters are on the non-essential list — not ideal if any crew member becomes ill.`,
    scienceTag: '🔬 REAL SCIENCE: Micrometeorite dust and impacts are a genuine engineering challenge for lunar solar panels. NASA\'s LRO documented the micrometeorite flux at the Moon is higher than on Earth due to lack of atmosphere.',
    choices: [
      {
        label: '🔋 Ration power aggressively — shut down lab and heating',
        hint: 'Maximum power savings. Lab experiments pause.',
        costs: ['+15% power', '-5 score (science paused)', 'crew cold discomfort'],
        effects: { power: 15, score: -5, crew: { type: 'health', target: [2], value: 'tired' } }
      },
      {
        label: '🛠️ Emergency repair with spare parts',
        hint: 'Restore array power. Uses limited spare components.',
        costs: ['+12% power', '-10% food (crew working hard)', '+10 score'],
        effects: { power: 12, food: -10, score: 10 }
      },
      {
        label: '🌙 Deploy the backup RTG (Radioisotope Thermoelectric Generator)',
        hint: 'Provides stable baseline power regardless of solar conditions.',
        costs: ['+20% power', '+rad exposure +3%', '+15 score'],
        effects: { power: 20, rad: -3, score: 15 }
      }
    ]
  },

  /* ── DAY 4 ─────────────────────────────────────────── */
  {
    day: 4,
    category: 'SCIENTIFIC OPPORTUNITY',
    artClass: 'art-science',
    artEmoji: '🔬',
    title: 'Lunar Seismic Activity Detected',
    desc: `The outpost seismometer recorded a shallow moonquake (magnitude ~2.5) originating 12 km east. Dr. Tanaka believes it may indicate subsurface volcanic activity — extremely rare on the modern Moon. Deploying a remote sensor array could yield major scientific results. However it requires significant power and crew time.`,
    scienceTag: '🔬 REAL SCIENCE: Apollo seismometers recorded thousands of moonquakes. Shallow moonquakes can be quite strong (up to magnitude 5.5) and long-lasting — the Moon "rings like a bell" due to its dry, rigid interior.',
    choices: [
      {
        label: '🌋 Full sensor deployment — Tanaka leads seismic survey',
        hint: 'Maximum science value. Requires 25% power budget.',
        costs: ['-15% power', '-5% food', '+30 score', '+discovery'],
        effects: { power: -15, food: -5, score: 30 },
        discovery: { name: 'Shallow Moonquake Source', desc: 'Tanaka identifies a fault line 12 km east — the first active lunar fault mapped by a crewed mission.' },
        experiment: true
      },
      {
        label: '📡 Remote monitoring only — minimal resource use',
        hint: 'Lower science gain but preserves resources.',
        costs: ['-5% power', '+10 score'],
        effects: { power: -5, score: 10 }
      },
      {
        label: '🏃 Skip — prioritize base maintenance today',
        hint: 'Conserve crew energy and power. Missed opportunity.',
        costs: ['No cost', '-10 score (missed)'],
        effects: { score: -10 }
      }
    ]
  },

  /* ── DAY 5 ─────────────────────────────────────────── */
  {
    day: 5,
    category: 'MEDICAL EMERGENCY',
    artClass: 'art-medical',
    artEmoji: '🏥',
    title: 'Crew Member Ill',
    desc: `Dr. Priya Nair reports that Lt. Webb has developed symptoms consistent with dehydration and hypercapnia — high CO₂ buildup in his suit from a faulty scrubber cartridge. He needs rest and increased water rations. This puts pressure on water supplies. As Medical Officer, Nair recommends a 48-hour rest protocol.`,
    scienceTag: '🔬 REAL SCIENCE: CO₂ scrubber failure is a real life-support risk. Apollo 13\'s LM lithium hydroxide canisters were improvised to manage CO₂ — a famous NASA engineering emergency.',
    choices: [
      {
        label: '💧 Full medical protocol — extra water, 48h rest for Webb',
        hint: 'Best for Webb\'s health. Significant water cost.',
        costs: ['-15% water', '+20 score', 'Webb recovers → healthy'],
        effects: { water: -15, score: 20, crew: { type: 'health', target: [1], value: 'ok' } }
      },
      {
        label: '🔧 Patch the scrubber and push through — minimal downtime',
        hint: 'Risky. Webb continues working but health stays impaired.',
        costs: ['-5% water', 'Webb stays tired', '-5 score'],
        effects: { water: -5, score: -5 }
      },
      {
        label: '🛌 Rest protocol but ration water carefully',
        hint: 'Moderate water use. Webb gets partial rest — recovers slowly.',
        costs: ['-8% water', '+10 score', 'Webb → tired (improving)'],
        effects: { water: -8, score: 10, crew: { type: 'health', target: [1], value: 'tired' } }
      }
    ]
  },

  /* ── DAY 6 ─────────────────────────────────────────── */
  {
    day: 6,
    category: 'OPERATIONS',
    artClass: 'art-explore',
    artEmoji: '🏔️',
    title: 'ISRU Water Extraction Opportunity',
    desc: `The spectral anomaly from Day 1 (if investigated) shows the ice vein is accessible. Using the base's In-Situ Resource Utilization drill, the crew could extract and electrolyze water ice — producing both H₂O and O₂. This is precisely the technology NASA plans for Artemis long-duration stays.`,
    scienceTag: '🔬 REAL SCIENCE: ISRU (In-Situ Resource Utilization) is NASA\'s strategy to "live off the land" on the Moon. Electrolysis of water ice → H₂ + O₂ is a core ISRU capability being developed for Artemis.',
    choices: [
      {
        label: '⚗️ Full ISRU extraction — drill and electrolyze',
        hint: 'Major resource boost. Requires significant power investment.',
        costs: ['+20% oxygen', '+15% water', '-20% power (drilling)', '+25 score', '+discovery'],
        effects: { oxygen: 20, water: 15, power: -20, score: 25 },
        discovery: { name: 'ISRU Water Extraction', desc: 'First successful on-site water ice extraction and electrolysis. Proof-of-concept for long-duration lunar habitation.' },
        experiment: true
      },
      {
        label: '💧 Extract water only — skip electrolysis',
        hint: 'Simpler. Gets water but no oxygen boost.',
        costs: ['+12% water', '-10% power', '+10 score'],
        effects: { water: 12, power: -10, score: 10 }
      },
      {
        label: '📋 Document and defer — save drill power for Day 7',
        hint: 'Preserve resources for final push.',
        costs: ['No resource cost', '+5 score (documentation)'],
        effects: { score: 5 }
      }
    ]
  },

  /* ── DAY 7 ─────────────────────────────────────────── */
  {
    day: 7,
    category: 'MISSION FINALE',
    artClass: 'art-science',
    artEmoji: '🚀',
    title: 'Return Window Approaching',
    desc: `Lunar Ascent Vehicle pre-ignition checks in progress. Earth has confirmed a nominal return trajectory. Dr. Tanaka wants one final EVA to collect subsurface core samples. This is the last call — the LAV departs in 6 hours. What is your final command?`,
    scienceTag: '🔬 REAL SCIENCE: Lunar ascent timing is constrained by orbital mechanics. Apollo missions had specific launch windows to intercept the Command Module in orbit. Artemis uses a different architecture with a Gateway orbital station.',
    choices: [
      {
        label: '🌙 Authorise final EVA — Tanaka collects core samples',
        hint: 'Maximum mission science. Some risk if anything goes wrong on EVA.',
        costs: ['-10% oxygen', '-5% power', '+40 score', '+discovery'],
        effects: { oxygen: -10, power: -5, score: 40 },
        discovery: { name: 'Deep Core Sample CR-7', desc: 'A 2-metre lunar core sample spanning 3 billion years of volcanic history — the mission\'s crown jewel.' },
        experiment: true
      },
      {
        label: '✅ Safe egress — no EVA, begin pre-launch checklist',
        hint: 'Safest path. All crew accounted for. No extra science.',
        costs: ['+20 score (mission safety bonus)', 'No risks'],
        effects: { score: 20 }
      },
      {
        label: '🔭 Automated drone survey — no crewed EVA',
        hint: 'Compromise: some science data, no crew risk.',
        costs: ['-5% power', '+25 score'],
        effects: { power: -5, score: 25 }
      }
    ]
  }
];

/* ══════════════════════════════════════════════════════════
   DAILY RESOURCE CONSUMPTION  (per crew member per day, as %)
   ─────────────────────────────────────────────────────────
   Based on NASA/TP-2015-218570 Rev. 2 (February 2022)
   "Life Support Baseline Values and Assumptions Document"
   NTRS ID: 20210024855, Table 3-31

   ACTUAL NASA BVAD TABLE 3-31 VALUES (physical units):
     Oxygen consumed           : 0.895 kg / crewmember-day
     Potable water content     : 3.217 kg / crewmember-day
     Water in food (pre-rehyd) : 0.760 kg / crewmember-day
     Food solids (unpacked)    : 0.800 kg / crewmember-day
     Carbon dioxide load       : 1.085 kg / crewmember-day

   GAMEPLAY SIMPLIFICATION:
     All values are scaled to % of total outpost baseline reserves.
     The "Water" bar represents the operational potable water store.
     The "Food" bar represents nutrient food solids rations.
     Daily rates below are balanced for a 7-day tactical mission.
══════════════════════════════════════════════════════════ */
const DAILY_CONSUMPTION = {
  oxygen: 3,   // NASA BVAD Table 3-31: 0.895 kg/CM-day → scaled to gameplay %
  water:  4,   // NASA BVAD Table 3-31: 3.217 kg/CM-day potable water → scaled to gameplay %
  food:   3,   // NASA BVAD Table 3-31: 0.800 kg/CM-day food solids → scaled to gameplay %
  power:  5    // Outpost baseline ECLSS thermal and atmospheric draw
};

/* ══════════════════════════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════════════════════════ */
function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function activeCrew() {
  return STATE.crew.filter(c => c.health !== 'down').length;
}

/* ══════════════════════════════════════════════════════════
   STAR FIELD (intro screen)
══════════════════════════════════════════════════════════ */
function buildStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  container.innerHTML = '';
  const count = 180;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --dur: ${(Math.random() * 3 + 1.5).toFixed(1)}s;
      --delay: ${(Math.random() * 3).toFixed(1)}s;
      --op: ${(Math.random() * 0.5 + 0.3).toFixed(2)};
    `;
    container.appendChild(star);
  }
}

/* ══════════════════════════════════════════════════════════
   SCREEN NAVIGATION
══════════════════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ══════════════════════════════════════════════════════════
   GAME INIT
══════════════════════════════════════════════════════════ */
function initGame() {
  STATE = deepClone(INITIAL_STATE);

  // Reset intel panel to loading state before async fetch
  const loadingEl = document.getElementById('intel-loading');
  const contentEl = document.getElementById('intel-content');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (contentEl) { contentEl.style.display = 'none'; contentEl.innerHTML = ''; }

  renderAll();
  loadEvent(0);
  showScreen('screen-game');

  // Fetch DONKI data once; failures are caught and fall back silently
  loadAndRenderIntel();
}

/* ══════════════════════════════════════════════════════════
   RENDER HUD + ALL PANELS
══════════════════════════════════════════════════════════ */
function renderAll() {
  renderHUD();
  renderResources();
  renderCrew();
  renderObjectives();
  renderDiscoveries();
}

function renderHUD() {
  document.getElementById('hud-day').textContent   = STATE.day;
  document.getElementById('hud-crew').textContent  = activeCrew();
  document.getElementById('hud-score').textContent = STATE.score;
}

function renderResources() {
  const res = STATE.resources;
  const keys = ['oxygen','water','food','power','rad'];
  const notes = {
    oxygen: ['O₂ critical — DANGER',    'O₂ low — warning',    'O₂ nominal',          'O₂ supply nominal'],
    water:  ['Dehydration risk — DANGER','Water low',           'Water recycler running','Water recycler running'],
    food:   ['Food critical — DANGER',   'Rations running low', 'Rations adequate',     'Rations adequate'],
    power:  ['Power critical — SHUTDOWN','Low power — warning', 'Solar arrays nominal', 'Solar arrays nominal'],
    rad:    ['Shield COMPROMISED — HIGH RAD','Shield degraded','Regolith shielding intact','Regolith shielding intact']
  };

  keys.forEach(key => {
    const val = clamp(res[key]);
    const bar = document.getElementById('bar-' + key);
    const pct = document.getElementById('pct-' + key);
    const note = document.getElementById('note-' + key);

    bar.style.width = val + '%';
    pct.textContent = val + '%';

    // determine severity
    let noteIdx, noteClass;
    if (val <= 10) { noteIdx = 0; noteClass = 'danger'; }
    else if (val <= 25) { noteIdx = 1; noteClass = 'warn'; }
    else if (val <= 50) { noteIdx = 2; noteClass = ''; }
    else { noteIdx = 3; noteClass = ''; }

    note.textContent = notes[key][noteIdx];
    note.className = 'res-note ' + noteClass;

    // critical pulse on bar
    if (val <= 15) {
      bar.classList.add('fill-critical');
    } else {
      bar.classList.remove('fill-critical');
    }

    // change bar color based on severity
    if (val <= 25) {
      bar.style.background = val <= 10 ? 'var(--red)' : 'var(--orange)';
    } else {
      bar.style.background = '';
    }
  });

  // Outpost structure indicators
  updateStructure('hab-status',    res.oxygen, res.power);
  updateStructure('solar-status',  res.power, 100);
  updateStructure('lab-status',    res.power, res.food);
  updateStructure('ant-status',    res.power, 100);
}

function updateStructure(elId, r1, r2) {
  const el = document.getElementById(elId);
  if (!el) return;
  const min = Math.min(r1, r2);
  el.classList.remove('struct-ok','struct-warn','struct-crit');
  if (min > 40) el.classList.add('struct-ok');
  else if (min > 15) el.classList.add('struct-warn');
  else el.classList.add('struct-crit');
}

function renderCrew() {
  const panel = document.getElementById('crew-panel');
  panel.innerHTML = '';
  STATE.crew.forEach((member, i) => {
    const healthLabels = { ok:'HEALTHY', tired:'FATIGUED', crit:'CRITICAL', down:'INCAPACITATED' };
    const healthClass  = { ok:'health-ok', tired:'health-tired', crit:'health-crit', down:'health-down' };
    panel.innerHTML += `
      <div class="crew-member">
        <div class="crew-avatar">${member.emoji}</div>
        <div class="crew-info">
          <div class="crew-name">${member.name}</div>
          <div class="crew-role">${member.role}</div>
        </div>
        <span class="crew-health ${healthClass[member.health]}">${healthLabels[member.health]}</span>
      </div>`;
  });
}

function renderObjectives() {
  const list = document.getElementById('objectives-list');
  list.innerHTML = '';
  Object.values(STATE.objectives).forEach(obj => {
    const cls = obj.done ? 'done' : obj.fail ? 'fail' : '';
    const icon = obj.done ? '✓' : obj.fail ? '✕' : '';
    list.innerHTML += `
      <div class="obj-item">
        <div class="obj-check ${cls}">${icon}</div>
        <span>${obj.label}${obj.count !== undefined ? ` (${obj.count}/2)` : ''}</span>
      </div>`;
  });
}

function renderDiscoveries() {
  const list = document.getElementById('discoveries-list');
  if (STATE.discoveries.length === 0) {
    list.innerHTML = '<p class="no-disc">No discoveries yet — explore to unlock!</p>';
    return;
  }
  list.innerHTML = STATE.discoveries.map(d =>
    `<div class="discovery-item"><strong>🔬 ${d.name}</strong>${d.desc}</div>`
  ).join('');
}

/* ══════════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════════ */
function loadEvent(idx) {
  const ev = EVENTS[idx];
  if (!ev) {
    endMission(true);
    return;
  }

  STATE.pendingEvent = ev;
  STATE.choiceMade = false;

  // Update event UI
  document.getElementById('event-day-badge').textContent = `DAY ${ev.day}`;
  document.getElementById('event-category').textContent  = ev.category;
  document.getElementById('event-title').textContent     = ev.title;
  document.getElementById('event-desc').textContent      = ev.desc;

  // Science tag
  const sciEl = document.getElementById('science-tag');
  if (ev.scienceTag) {
    sciEl.textContent = ev.scienceTag;
    sciEl.style.display = 'inline-block';
  } else {
    sciEl.style.display = 'none';
  }

  // Event art
  const artEl = document.getElementById('event-art');
  artEl.className = 'event-art ' + (ev.artClass || 'art-default');
  artEl.innerHTML = `<span style="font-size:3.5rem;position:relative;z-index:1">${ev.artEmoji || '🌙'}</span>`;

  // Build choices
  buildChoices(ev.choices);
}

function buildChoices(choices) {
  const container = document.getElementById('choices-container');
  container.innerHTML = '';

  choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.setAttribute('aria-label', ch.label);

    const costsHTML = ch.costs.map(c => {
      const isPos = c.startsWith('+') || c.toLowerCase().includes('recover') || c.toLowerCase().includes('healthy');
      const isNeg = c.startsWith('-') || c.toLowerCase().includes('risk') || c.toLowerCase().includes('fatigue') || c.toLowerCase().includes('cold');
      const cls = isPos ? 'cost-pos' : isNeg ? 'cost-neg' : 'cost-neu';
      return `<span class="cost-tag ${cls}">${c}</span>`;
    }).join('');

    btn.innerHTML = `
      <span class="choice-label">${ch.label}</span>
      <span class="choice-hint">${ch.hint}</span>
      <div class="choice-cost">${costsHTML}</div>`;

    btn.addEventListener('click', () => applyChoice(ch, btn));
    container.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════════
   APPLY CHOICE
══════════════════════════════════════════════════════════ */
function applyChoice(choice, btnEl) {
  if (STATE.choiceMade || STATE.gameOver) return;
  STATE.choiceMade = true;

  // Visual feedback — mark selected
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  btnEl.classList.add('selected');

  // Apply resource effects
  const eff = choice.effects || {};
  ['oxygen','water','food','power','rad'].forEach(key => {
    if (eff[key] !== undefined) {
      STATE.resources[key] = clamp(STATE.resources[key] + eff[key]);
    }
  });

  // Score
  if (eff.score) STATE.score += eff.score;

  // Crew health effects
  if (eff.crew) {
    const c = eff.crew;
    const targets = c.target === 'all'
      ? STATE.crew.map((_, i) => i)
      : (Array.isArray(c.target) ? c.target : [c.target]);
    targets.forEach(idx => {
      if (idx < STATE.crew.length && STATE.crew[idx].health !== 'down') {
        STATE.crew[idx].health = c.value;
      }
    });
  }

  // Discovery
  if (choice.discovery) {
    STATE.discoveries.push(choice.discovery);
    addLog(`🔬 Discovery: ${choice.discovery.name}`, 'log-info');
  }

  // Experiment completed
  if (choice.experiment) {
    STATE.objectives.science.count++;
    if (STATE.objectives.science.count >= 2) {
      STATE.objectives.science.done = true;
      addLog('🎯 Objective complete: 2 experiments finished!', 'log-good');
    }
  }

  // Add log entry
  addLog(`Day ${STATE.day}: ${choice.label.replace(/^[^\s]+\s/,'')}`, '');

  // Apply daily consumption then advance day
  setTimeout(() => {
    applyDailyConsumption();
    renderAll();
    checkFailConditions();

    if (!STATE.gameOver) {
      STATE.day++;
      STATE.eventIndex++;

      if (STATE.day > STATE.maxDays) {
        setTimeout(() => endMission(true), 500);
      } else {
        setTimeout(() => loadEvent(STATE.eventIndex), 400);
      }
    }
  }, 600);
}

/* ══════════════════════════════════════════════════════════
   DAILY CONSUMPTION
   Scaled per active crew member
══════════════════════════════════════════════════════════ */
function applyDailyConsumption() {
  const crew = activeCrew();
  const scale = crew / 4;  // scale relative to full crew of 4

  STATE.resources.oxygen = clamp(STATE.resources.oxygen - DAILY_CONSUMPTION.oxygen * scale);
  STATE.resources.water  = clamp(STATE.resources.water  - DAILY_CONSUMPTION.water  * scale);
  STATE.resources.food   = clamp(STATE.resources.food   - DAILY_CONSUMPTION.food   * scale);
  STATE.resources.power  = clamp(STATE.resources.power  - DAILY_CONSUMPTION.power  * scale);

  addLog(`End of Day ${STATE.day}: O₂ -${(DAILY_CONSUMPTION.oxygen * scale).toFixed(0)}%, H₂O -${(DAILY_CONSUMPTION.water * scale).toFixed(0)}%, Food -${(DAILY_CONSUMPTION.food * scale).toFixed(0)}%, Power -${(DAILY_CONSUMPTION.power * scale).toFixed(0)}%`, '');
}

/* ══════════════════════════════════════════════════════════
   FAIL CONDITIONS
══════════════════════════════════════════════════════════ */
function checkFailConditions() {
  const res = STATE.resources;

  // Critical crew health → worse state
  STATE.crew.forEach((member, i) => {
    if (member.health === 'crit') {
      member.health = 'down';
      addLog(`🚨 ${member.name} incapacitated!`, 'log-bad');
    }
  });

  // Check incapacitated
  const down = STATE.crew.filter(c => c.health === 'down').length;
  if (down > 0) {
    STATE.objectives.crewSafe.fail = true;
  }
  if (down >= 4) {
    STATE.failReason = 'All crew members incapacitated.';
    endMission(false);
    return;
  }

  // Resource catastrophic failure
  if (res.oxygen <= 0) {
    STATE.failReason = 'Oxygen supply exhausted. Crew asphyxiated.';
    endMission(false); return;
  }
  if (res.water <= 0) {
    STATE.failReason = 'Water supply exhausted. Crew severely dehydrated.';
    endMission(false); return;
  }
  if (res.power <= 0) {
    STATE.failReason = 'Power failure — life support offline.';
    endMission(false); return;
  }

  // Warnings
  ['oxygen','water','food','power','rad'].forEach(key => {
    if (res[key] <= 15 && res[key] > 0) {
      showAlert('⚠️', `${key.toUpperCase()} CRITICAL`, `${key} level is at ${res[key]}%. Immediate action required!`);
    }
  });

  // Power check objective
  if (res.power <= 20) {
    STATE.objectives.powerMgmt.fail = true;
  }
}

/* ══════════════════════════════════════════════════════════
   MISSION LOG
══════════════════════════════════════════════════════════ */
function addLog(msg, cssClass = '') {
  STATE.missionLog.push({ msg, cssClass });

  const feed = document.getElementById('log-feed');
  if (!feed) return;

  const entry = document.createElement('div');
  entry.className = 'log-entry ' + cssClass;
  entry.textContent = msg;
  feed.insertBefore(entry, feed.firstChild);

  // Keep log manageable
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

/* ══════════════════════════════════════════════════════════
   ALERT MODAL
══════════════════════════════════════════════════════════ */
let alertQueue = [];
let alertShowing = false;

function showAlert(icon, title, body) {
  alertQueue.push({ icon, title, body });
  if (!alertShowing) processAlertQueue();
}

function processAlertQueue() {
  if (alertQueue.length === 0) { alertShowing = false; return; }
  alertShowing = true;
  const { icon, title, body } = alertQueue.shift();
  document.getElementById('alert-icon').textContent = icon;
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-body').textContent = body;
  document.getElementById('modal-alert').style.display = 'flex';
}

/* ══════════════════════════════════════════════════════════
   END MISSION
══════════════════════════════════════════════════════════ */
function endMission(success) {
  STATE.gameOver = true;

  // Finalise objectives
  if (success) {
    STATE.objectives.survive.done = true;
    if (activeCrew() === 4) STATE.objectives.crewSafe.done = true;
    if (STATE.resources.power > 20) STATE.objectives.powerMgmt.done = true;
  } else {
    STATE.objectives.survive.fail = true;
  }

  // Bonus scores
  if (STATE.objectives.crewSafe.done)   STATE.score += 50;
  if (STATE.objectives.science.done)    STATE.score += 40;
  if (STATE.objectives.powerMgmt.done)  STATE.score += 20;
  if (success) STATE.score += 100;

  STATE.score = Math.max(0, STATE.score);

  // Build end screen
  const headline = success ? 'MISSION COMPLETE' : 'MISSION FAILED';
  const badge    = success ? (activeCrew() === 4 ? '🏆' : '🌙') : '💀';

  document.getElementById('end-badge').textContent     = badge;
  document.getElementById('end-headline').textContent  = headline;
  document.getElementById('end-subline').textContent   =
    success ? 'Artemis Outpost Shackleton — After-Action Report' : STATE.failReason;

  document.getElementById('report-score').textContent = STATE.score;
  document.getElementById('report-crew').textContent  = `${activeCrew()} / 4`;
  document.getElementById('report-days').textContent  = `${Math.min(STATE.day, 7)} / 7`;
  document.getElementById('report-disc').textContent  = STATE.discoveries.length;

  // Rating
  const rating = calcRating();
  document.getElementById('rating-stars').textContent = rating.stars;
  document.getElementById('rating-desc').textContent  = rating.label;

  // End discoveries
  const endDisc = document.getElementById('end-discoveries');
  if (STATE.discoveries.length > 0) {
    endDisc.innerHTML = STATE.discoveries.map(d =>
      `<span class="disc-pill">🔬 ${d.name}</span>`
    ).join('');
  } else {
    endDisc.innerHTML = '<span class="disc-pill" style="border-color:var(--border);color:var(--text-dim)">No discoveries recorded</span>';
  }

  // End log
  const endLog = document.getElementById('end-log');
  endLog.innerHTML = STATE.missionLog.slice().reverse().map(e =>
    `<div class="log-entry ${e.cssClass || ''}">${e.msg}</div>`
  ).join('');

  setTimeout(() => showScreen('screen-end'), 400);
}

function calcRating() {
  const s = STATE.score;
  if (s >= 300) return { stars: '★★★★★', label: 'Outstanding Commander' };
  if (s >= 220) return { stars: '★★★★☆', label: 'Excellent Performance' };
  if (s >= 140) return { stars: '★★★☆☆', label: 'Solid Mission' };
  if (s >= 70)  return { stars: '★★☆☆☆', label: 'Marginal Success' };
  if (s >= 1)   return { stars: '★☆☆☆☆', label: 'Survival Only' };
  return          { stars: '☆☆☆☆☆', label: 'Mission Failure' };
}

/* ══════════════════════════════════════════════════════════
   NASA DONKI SPACE WEATHER INTEGRATION
   ─────────────────────────────────────────────────────────
   Fetches recent Solar Flare (FLR) and Solar Energetic
   Particle (SEP) records from the NASA Open API (DONKI).

   KEY SCIENTIFIC ACCURACY RULES (enforced in this code):
   1. A solar flare classification (A/B/C/M/X) is NEVER
      described as directly causing crew radiation dose.
   2. Only SEP events are flagged as a potential crew hazard.
   3. All live records are labelled "ACTUAL NASA DATA".
   4. All fallback records are labelled "SIMULATED SCENARIO".
   5. fetch() errors are caught silently — gameplay continues.
   6. API is called ONCE at game start, not on every day tick.
   7. file:// protocol note: browsers block fetch() from
      file:// origins by CORS policy on some configs.
      The fallback handles this transparently.
══════════════════════════════════════════════════════════ */

/* Simulated fallback events — clearly labelled SIMULATED */
const DONKI_FALLBACK = [
  {
    type: 'FLR',
    simulated: true,
    classType: 'M2.4',
    date: 'SIMULATED',
    location: 'N15W22',
    note: 'SIMULATED SCENARIO — not an actual observation. ' +
          'An M-class flare produces X-ray/UV bursts detectable by GOES satellites. ' +
          'Whether a crew EVA is affected depends on subsequent SEP events, not the flare class alone.'
  },
  {
    type: 'SEP',
    simulated: true,
    date: 'SIMULATED',
    instruments: 'GOES-16 EPS (simulated)',
    note: 'SIMULATED SCENARIO — not an actual observation. ' +
          'A real SEP event (>10 MeV proton threshold) could increase crew dose rates. ' +
          'Regolith shielding ≥ 1 m provides meaningful protection for the habitat interior.'
  }
];

/**
 * Fetch up to 5 recent FLR and SEP records from NASA DONKI.
 * Uses DEMO_KEY (public, no registration required, 30 req/IP/hr).
 * Returns { events, isLive } or throws on hard failure.
 */
async function fetchDonkiData() {
  const KEY   = 'DEMO_KEY';
  const BASE  = 'https://api.nasa.gov/DONKI/';
  // 60-day lookback window for enough events
  const end   = new Date();
  const start = new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fmt   = d => d.toISOString().slice(0, 10);
  const qs    = `startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=${KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // 8 s timeout

  try {
    const [flrRes, sepRes] = await Promise.all([
      fetch(`${BASE}FLR?${qs}`, { signal: controller.signal }),
      fetch(`${BASE}SEP?${qs}`, { signal: controller.signal })
    ]);
    clearTimeout(timer);

    const flrData = flrRes.ok ? await flrRes.json() : [];
    const sepData = sepRes.ok ? await sepRes.json() : [];

    const events = [];

    // Process FLR — take last 3
    const flrs = Array.isArray(flrData) ? flrData.slice(-3) : [];
    flrs.forEach(f => {
      events.push({
        type: 'FLR',
        simulated: false,
        classType: f.classType || '?',
        date: (f.peakTime || f.beginTime || '').slice(0, 16).replace('T', ' ') + ' UTC',
        location: f.sourceLocation || '—',
        linkedSEP: Array.isArray(f.linkedEvents) &&
          f.linkedEvents.some(e => e.activityID && e.activityID.includes('SEP')),
        link: f.link || null
      });
    });

    // Process SEP — take last 2
    const seps = Array.isArray(sepData) ? sepData.slice(-2) : [];
    seps.forEach(s => {
      const instr = Array.isArray(s.instruments) && s.instruments.length > 0
        ? s.instruments.map(i => i.displayName).join(', ')
        : 'GOES';
      events.push({
        type: 'SEP',
        simulated: false,
        date: (s.eventTime || '').slice(0, 16).replace('T', ' ') + ' UTC',
        instruments: instr,
        link: s.link || null
      });
    });

    return { events: events.length > 0 ? events : null, isLive: true };

  } catch (err) {
    clearTimeout(timer);
    // Network failure, CORS block, or timeout — return null to trigger fallback
    return { events: null, isLive: false, error: err.name };
  }
}

/**
 * Render the Mission Intelligence / DONKI panel.
 * Called once after initGame(); safe to call if element is missing.
 */
async function loadAndRenderIntel() {
  const loadingEl = document.getElementById('intel-loading');
  const contentEl = document.getElementById('intel-content');
  if (!loadingEl || !contentEl) return;

  let result;
  try {
    result = await fetchDonkiData();
  } catch (_) {
    result = { events: null, isLive: false, error: 'unknown' };
  }

  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  const { events, isLive, error } = result;
  const useFallback = !events || events.length === 0;
  const displayEvents = useFallback ? DONKI_FALLBACK : events;
  const isActuallyLive = isLive && !useFallback;

  let html = '';

  // Status bar
  if (isActuallyLive) {
    html += `<div class="intel-status-bar intel-live">
      <span class="blink-dot"></span> ACTUAL NASA DATA — DONKI API
    </div>`;
  } else if (isLive && useFallback) {
    html += `<div class="intel-status-bar intel-offline">
      ⚡ API CONNECTED — No recent events (60 days)
    </div>`;
  } else {
    const reason = error === 'AbortError' ? 'timeout' : 'network/CORS';
    html += `<div class="intel-status-bar intel-offline">
      ⚠️ SIMULATED SCENARIOS — API unavailable (${reason})
    </div>`;
  }

  // Render each event
  displayEvents.forEach(ev => {
    const isSim = ev.simulated;
    const eventClass = isSim ? 'simulated' : 'real-data';
    const dataLabel = isSim
      ? '<span class="sim-label">SIMULATED SCENARIO</span>'
      : '<span class="real-label">ACTUAL NASA DATA</span>';

    if (ev.type === 'FLR') {
      // Classify severity for display only
      const cls = ev.classType || '';
      const tier = cls.startsWith('X') ? 'X-CLASS' : cls.startsWith('M') ? 'M-CLASS' : cls.startsWith('C') ? 'C-CLASS' : 'FLARE';
      const hasLinkedSEP = ev.linkedSEP;

      html += `<div class="intel-event ${eventClass}">
        <div class="intel-event-type">☀️ SOLAR FLARE (FLR) ${dataLabel}</div>
        <div class="intel-event-class">${tier} — ${cls}</div>
        <div class="intel-event-date">📅 ${ev.date || 'Date unknown'} &nbsp;📍 ${ev.location || '—'}</div>
        ${hasLinkedSEP ? '<div class="intel-sep-warning">⚠️ Linked SEP event detected — elevated proton flux possible. This is the actual hazard for crew EVA, not the flare itself.</div>' : ''}
        <div class="intel-event-note">
          Flare class indicates EM intensity (X-ray flux), not crew radiation dose.
          Surface dose depends on subsequent SEP events, geometry, and shielding.
        </div>
        ${ev.link && !isSim ? `<div style="margin-top:0.3rem"><a href="${ev.link}" target="_blank" rel="noopener" style="font-size:0.6rem">View DONKI record →</a></div>` : ''}
      </div>`;

    } else if (ev.type === 'SEP') {
      html += `<div class="intel-event ${eventClass}">
        <div class="intel-event-type">⚡ SOLAR ENERGETIC PARTICLE (SEP) ${dataLabel}</div>
        <div class="intel-event-date">📅 ${ev.date || 'Date unknown'}</div>
        ${ev.instruments ? `<div class="intel-event-date">🛰️ Instrument: ${ev.instruments}</div>` : ''}
        <div class="intel-event-note">
          SEP events (>10 MeV proton threshold) are the primary acute radiation hazard
          for unshielded crew. Habitat regolith shielding significantly reduces interior dose rates.
        </div>
        ${ev.link && !isSim ? `<div style="margin-top:0.3rem"><a href="${ev.link}" target="_blank" rel="noopener" style="font-size:0.6rem">View DONKI record →</a></div>` : ''}
      </div>`;
    }
  });

  if (useFallback && !isLive) {
    html += `<div class="intel-disclaimer">
      Live NASA DONKI data unavailable (opening index.html directly may block network
      requests on some browsers). Showing simulated scenarios for educational purposes.<br/>
      <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener">
        Browse real DONKI records →
      </a>
    </div>`;
  } else {
    html += `<div class="intel-disclaimer">
      Data: <a href="https://api.nasa.gov/" target="_blank" rel="noopener">NASA Open APIs (DONKI)</a>.
      Covers past 60 days. DEMO_KEY rate limit: 30 req/IP/hr.
    </div>`;
  }

  contentEl.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
   DOM READY → WIRE UP EVENTS
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* Stars */
  buildStars();

  /* ── Intro Screen ── */
  document.getElementById('btn-start').addEventListener('click', () => {
    showScreen('screen-briefing');
  });

  document.getElementById('btn-science-title').addEventListener('click', () => {
    document.getElementById('modal-science').style.display = 'flex';
  });

  /* ── Briefing Screen ── */
  document.getElementById('btn-back-intro').addEventListener('click', () => {
    showScreen('screen-intro');
  });

  document.getElementById('btn-begin-mission').addEventListener('click', () => {
    initGame();
  });

  /* ── Science Modal ── */
  document.getElementById('btn-close-science').addEventListener('click', () => {
    document.getElementById('modal-science').style.display = 'none';
  });

  document.getElementById('modal-science').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-science')) {
      document.getElementById('modal-science').style.display = 'none';
    }
  });

  document.getElementById('btn-science-end').addEventListener('click', () => {
    document.getElementById('modal-science').style.display = 'flex';
  });

  /* ── Alert Modal ── */
  document.getElementById('btn-close-alert').addEventListener('click', () => {
    document.getElementById('modal-alert').style.display = 'none';
    processAlertQueue();
  });

  /* ── End Screen ── */
  document.getElementById('btn-restart').addEventListener('click', () => {
    // Reset alert queue
    alertQueue = [];
    alertShowing = false;
    document.getElementById('modal-alert').style.display = 'none';
    // Clear log on intro side
    const logFeed = document.getElementById('log-feed');
    if (logFeed) logFeed.innerHTML = '';
    showScreen('screen-intro');
  });

  /* ── Keyboard accessibility ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('modal-science').style.display = 'none';
      if (!alertShowing) document.getElementById('modal-alert').style.display = 'none';
    }
  });

  /* ── Initial render of objectives on intro ── */
  // (objectives panel built during initGame)
});
