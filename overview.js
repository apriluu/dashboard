// ── MOCK UNDERPASSES (replace with real data later) ────
const underpasses = [
  {
    id: 1,
    name: 'Underpass Via Emilia',
    waterLevel: 1.29,
    rainRate: 3.2,
    floodingThreshold: 1.2,
    floodedThreshold: 1.6,
  },
  {
    id: 2,
    name: 'Underpass Via Canaletto',
    waterLevel: 0.45,
    rainRate: 1.1,
    floodingThreshold: 1.0,
    floodedThreshold: 1.4,
  },
  {
    id: 3,
    name: 'Underpass Via Nonantolana',
    waterLevel: 1.65,
    rainRate: 8.7,
    floodingThreshold: 1.2,
    floodedThreshold: 1.6,
  },
  {
    id: 4,
    name: 'Underpass Via Giardini',
    waterLevel: 0.80,
    rainRate: 2.4,
    floodingThreshold: 1.1,
    floodedThreshold: 1.5,
  },
];

function getFloodStatus(waterLevel, thresholds) {
  if (waterLevel >= thresholds.floodedThreshold) {
    return { text: 'FLOODED — access closed', cls: 'alert' };
  } else if (waterLevel >= thresholds.floodingThreshold) {
    return { text: 'FLOODING — use with caution', cls: 'warn' };
  } else {
    return { text: 'No flood — access open', cls: 'ok' };
  }
}

function updateTimestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('timestamp').textContent = h + ':' + m + ':' + s;
}

function renderOverview() {
  const grid = document.getElementById('overview-grid');
  grid.innerHTML = underpasses.map(u => {
    const status = getFloodStatus(u.waterLevel, u);
    return `
      <a class="underpass-card" href="underpass.html?id=${u.id}">
        <h2>${u.name}</h2>
        <span class="flood-status status ${status.cls}">${status.text}</span>
        <div class="meta">
          <span>Water level: ${u.waterLevel.toFixed(2)} m</span>
          <span>Rain rate: ${u.rainRate} mm/h</span>
        </div>
      </a>
    `;
  }).join('');
}

// simulate small water level changes every 5s
function simulateUpdates() {
  underpasses.forEach(u => {
    u.waterLevel += (Math.random() - 0.48) * 0.04;
    u.waterLevel = Math.max(0.2, Math.min(1.9, u.waterLevel));
  });
  renderOverview();
  updateTimestamp();
}

renderOverview();
updateTimestamp();
setInterval(simulateUpdates, 5000);