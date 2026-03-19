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

// ── RAIN CHART — with zoom control ────────────────────
let zoomMinutes = 30; // default 30 min, max 60

function renderRainChart() {
  const now = Date.now();
  const windowMs = zoomMinutes * 60 * 1000;
  const visibleData = rainHistory.filter(d => d.time.getTime() >= now - windowMs);
  if (visibleData.length < 2) return;

  const w = 500, h = 120, padL = 36, padR = 10, padT = 10, padB = 22;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const minTime = visibleData[0].time.getTime();
  const maxTime = visibleData[visibleData.length - 1].time.getTime();
  const timeRange = maxTime - minTime || 1;

  const toX = t => padL + ((t - minTime) / timeRange) * chartW;
  const toY = v => padT + chartH - (v * chartH);

  const points = visibleData.map(d => `${toX(d.time.getTime())},${toY(d.value)}`).join(' ');
  const lastX = toX(maxTime);
  const lastY = toY(visibleData[visibleData.length - 1].value);
  const baseY = padT + chartH;

  // y axis lines: 0, 4, 8, 12, 16, 20 mm/h
  const yLevels = [0, 4, 8, 12, 16, 20];
  const yLines = yLevels.map(mmh => {
    const v = mmh / 20;
    const y = toY(v);
    return `
      <line x1="${padL}" y1="${y}" x2="${padL + chartW}" y2="${y}"
        stroke="#e2e8f0" stroke-width="1"/>
      <text x="${padL - 4}" y="${y + 3}" font-size="8" fill="#94a3b8" text-anchor="end">${mmh}</text>
    `;
  }).join('');

  // x axis labels every 10 minutes
  const labelSet = new Set();
  const xLabels = visibleData.map(d => {
    const mins = d.time.getMinutes();
    const key = `${d.time.getHours()}:${mins}`;
    if (mins % 10 === 0 && !labelSet.has(key)) {
      labelSet.add(key);
      const x = toX(d.time.getTime());
      const hh = String(d.time.getHours()).padStart(2, '0');
      const mm = String(d.time.getMinutes()).padStart(2, '0');
      return `
        <line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + chartH}"
          stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="${x}" y="${h - 4}" font-size="8" fill="#94a3b8" text-anchor="middle">${hh}:${mm}</text>
      `;
    }
    return '';
  }).join('');

  const fmt = d => {
    const hh = String(d.time.getHours()).padStart(2, '0');
    const mm = String(d.time.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const currentMmh = (visibleData[visibleData.length - 1].value * 20).toFixed(1);

  document.getElementById('rain-chart').innerHTML = `

    <!-- live value -->
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:8px;">
      <span style="font-size:28px;font-weight:500;color:#1a1a2e;">${currentMmh}</span>
      <span style="font-size:13px;color:#64748b;">mm/h now</span>
    </div>

    <!-- zoom controls -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:11px;color:#64748b;">Zoom:</span>
      <button onclick="setZoom(10)" class="zoom-btn ${zoomMinutes===10?'zoom-active':''}">10m</button>
      <button onclick="setZoom(30)" class="zoom-btn ${zoomMinutes===30?'zoom-active':''}">30m</button>
      <button onclick="setZoom(60)" class="zoom-btn ${zoomMinutes===60?'zoom-active':''}">1h</button>
    </div>

    <!-- chart -->
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:130px;">
      ${yLines}
      ${xLabels}
      <polygon
        points="${padL},${baseY} ${points} ${lastX},${baseY}"
        fill="#93c5fd" opacity="0.25"/>
      <polyline
        points="${points}"
        fill="none" stroke="#2563eb" stroke-width="1.5"
        stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lastX}" cy="${lastY}" r="3" fill="#2563eb"/>
      <text x="${padL}" y="${h - 4}" font-size="8" fill="#64748b">${fmt(visibleData[0])}</text>
      <text x="${padL + chartW}" y="${h - 4}" font-size="8" fill="#64748b" text-anchor="end">${fmt(visibleData[visibleData.length-1])}</text>
    </svg>
  `;
}

function setZoom(minutes) {
  zoomMinutes = minutes;
  renderRainChart();
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