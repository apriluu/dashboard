// ── UNDERPASS PARAMETERS (placeholder) ─────────────────
const UNDERPASS = {
  maxDepth: 2.0,
  floodingThreshold: 1.2,
  floodedThreshold: 1.6,
};

// ── RAIN HISTORY — last 60 minutes (one point every 5s) ─
const MAX_POINTS = 720; // 60min * 60s / 5s = 720 points
let rainHistory = [];

// pre-fill with mock historical data
function prefillRainHistory() {
  const now = Date.now();
  for (let i = MAX_POINTS; i >= 0; i--) {
    rainHistory.push({
      time: new Date(now - i * 5000),
      value: Math.max(0.05, Math.min(1.0, 0.3 + Math.random() * 0.4)),
    });
  }
}

// ── WATER LEVEL ────────────────────────────────────────
let waterLevel = 1.24;

function updateTimestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('timestamp').textContent = h + ':' + m + ':' + s;
}

function updateWaterLevel() {
  waterLevel += (Math.random() - 0.48) * 0.04;
  waterLevel = Math.max(0.5, Math.min(1.9, waterLevel));
  const rounded = waterLevel.toFixed(2);

  document.getElementById('water-level').textContent = rounded;

  const gauge = document.getElementById('water-gauge');
  gauge.innerHTML = `
    <div class="water-fill" style="height: ${(waterLevel / 2.0) * 100}%"></div>
    <div class="danger-line" style="bottom: ${(1.7 / 2.0) * 100}%"></div>
    <div class="danger-label" style="bottom: ${(1.7 / 2.0) * 100 + 2}%">danger</div>
    <div class="water-level-label">${rounded} m</div>
  `;

  const statusEl = document.getElementById('water-status');
  if (waterLevel >= UNDERPASS.floodedThreshold) {
    statusEl.textContent = 'FLOODED — access closed';
    statusEl.className = 'status alert';
  } else if (waterLevel >= UNDERPASS.floodingThreshold) {
    statusEl.textContent = 'FLOODING — use with caution';
    statusEl.className = 'status warn';
  } else {
    statusEl.textContent = 'No flood — access open';
    statusEl.className = 'status ok';
  }
}

// ── RAIN CHART — past hour with timestamps ─────────────
function updateRain() {
  // add new point
  const newVal = Math.max(0.05, Math.min(1.0,
    rainHistory[rainHistory.length - 1].value + (Math.random() - 0.5) * 0.1
  ));
  rainHistory.push({ time: new Date(), value: newVal });
  if (rainHistory.length > MAX_POINTS) rainHistory.shift();

  const mmh = (newVal * 20).toFixed(1);
  document.getElementById('rain-rate').textContent = mmh;

  const statusEl = document.getElementById('rain-status');
  if (parseFloat(mmh) > 12) {
    statusEl.textContent = 'Heavy';
    statusEl.className = 'status alert';
  } else if (parseFloat(mmh) > 6) {
    statusEl.textContent = 'Moderate';
    statusEl.className = 'status warn';
  } else {
    statusEl.textContent = 'Light';
    statusEl.className = 'status ok';
  }

  renderRainChart();
}

function renderRainChart() {
  const w = 500, h = 100, padL = 30, padR = 10, padT = 10, padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const data = rainHistory;
  const minTime = data[0].time.getTime();
  const maxTime = data[data.length - 1].time.getTime();
  const timeRange = maxTime - minTime || 1;

  // build polyline points
  const points = data.map(d => {
    const x = padL + ((d.time.getTime() - minTime) / timeRange) * chartW;
    const y = padT + chartH - (d.value * chartH);
    return `${x},${y}`;
  }).join(' ');

  const firstX = padL;
  const lastX = padL + chartW;
  const baseY = padT + chartH;

  // build timestamp labels (every 15 minutes)
  const labels = [];
  data.forEach(d => {
    if (d.time.getSeconds() === 0 && d.time.getMinutes() % 15 === 0) {
      const x = padL + ((d.time.getTime() - minTime) / timeRange) * chartW;
      const hh = String(d.time.getHours()).padStart(2, '0');
      const mm = String(d.time.getMinutes()).padStart(2, '0');
      labels.push({ x, label: `${hh}:${mm}` });
    }
  });

  // always show first and last timestamp
  const fmt = d => {
    const hh = String(d.time.getHours()).padStart(2, '0');
    const mm = String(d.time.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  document.getElementById('rain-chart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:110px;">

      <!-- grid lines -->
      <line x1="${padL}" y1="${padT}" x2="${padL + chartW}" y2="${padT}"
        stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${padL}" y1="${padT + chartH / 2}" x2="${padL + chartW}" y2="${padT + chartH / 2}"
        stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${padL + chartW}" y2="${padT + chartH}"
        stroke="#e2e8f0" stroke-width="1"/>

      <!-- y axis labels -->
      <text x="${padL - 4}" y="${padT + 3}" font-size="8" fill="#94a3b8" text-anchor="end">20</text>
      <text x="${padL - 4}" y="${padT + chartH / 2 + 3}" font-size="8" fill="#94a3b8" text-anchor="end">10</text>
      <text x="${padL - 4}" y="${padT + chartH + 3}" font-size="8" fill="#94a3b8" text-anchor="end">0</text>

      <!-- area fill -->
      <polygon
        points="${padL},${baseY} ${points} ${lastX},${baseY}"
        fill="#93c5fd" opacity="0.3"/>

      <!-- line -->
      <polyline
        points="${points}"
        fill="none" stroke="#2563eb" stroke-width="1.5"
        stroke-linejoin="round" stroke-linecap="round"/>

      <!-- current dot -->
      <circle cx="${lastX}" cy="${padT + chartH - (data[data.length-1].value * chartH)}"
        r="3" fill="#2563eb"/>

      <!-- x axis timestamp labels -->
      ${labels.map(l => `
        <line x1="${l.x}" y1="${padT}" x2="${l.x}" y2="${padT + chartH}"
          stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="${l.x}" y="${h - 2}" font-size="8" fill="#94a3b8" text-anchor="middle">${l.label}</text>
      `).join('')}

      <!-- first and last time -->
      <text x="${padL}" y="${h - 2}" font-size="8" fill="#64748b">${fmt(data[0])}</text>
      <text x="${lastX}" y="${h - 2}" font-size="8" fill="#64748b" text-anchor="end">${fmt(data[data.length-1])}</text>

    </svg>
    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">mm/h — past 60 minutes</div>
  `;
}

// ── BAR STATUS ─────────────────────────────────────────
function updateBarStatus() {
  document.getElementById('bar-status').textContent = 'Closed';
}

// ── METEO — Open-Meteo API (Modena, Italy) ─────────────
async function updateMeteo() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=44.6458&longitude=10.9256&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation&timezone=Europe/Rome';
    const response = await fetch(url);
    const data = await response.json();
    const c = data.current;

    document.getElementById('temperature').textContent = c.temperature_2m;

    document.getElementById('meteo-data').innerHTML = `
      <div class="meteo-grid">
        <div class="meteo-item">
          <div class="key">Temperature</div>
          <div class="val">${c.temperature_2m} °C</div>
        </div>
        <div class="meteo-item">
          <div class="key">Humidity</div>
          <div class="val">${c.relative_humidity_2m} %</div>
        </div>
        <div class="meteo-item">
          <div class="key">Wind speed</div>
          <div class="val">${c.wind_speed_10m} km/h</div>
        </div>
        <div class="meteo-item">
          <div class="key">Pressure</div>
          <div class="val">${c.surface_pressure} hPa</div>
        </div>
        <div class="meteo-item">
          <div class="key">Precipitation</div>
          <div class="val">${c.precipitation} mm</div>
        </div>
      </div>
    `;
  } catch (error) {
    document.getElementById('meteo-data').innerHTML = `
      <p style="color:#ef4444;font-size:13px;">Could not load meteorological data</p>
    `;
  }
}

// ── MESSAGES ───────────────────────────────────────────
function loadMessages() {
  document.getElementById('messages').innerHTML = `
    <div class="message">
      <div class="msg-dot alert"></div>
      <div>
        <div>Overflow gate opened — threshold reached</div>
        <div class="msg-time">15:52:11</div>
      </div>
    </div>
    <div class="message">
      <div class="msg-dot warn"></div>
      <div>
        <div>Secondary gate at 55% — check recommended</div>
        <div class="msg-time">15:48:30</div>
      </div>
    </div>
    <div class="message">
      <div class="msg-dot info"></div>
      <div>
        <div>System connected — polling every 5s</div>
        <div class="msg-time">15:40:00</div>
      </div>
    </div>
  `;
}

// ── INIT & LOOP ────────────────────────────────────────
function update() {
  updateTimestamp();
  updateWaterLevel();
  updateRain();
  updateBarStatus();
}

prefillRainHistory();
loadMessages();
updateMeteo();
update();
setInterval(update, 5000);