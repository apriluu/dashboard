// ── MOCK DATA ──────────────────────────────────────────
let waterLevel = 1.24;
let rainHistory = [0.20, 0.35, 0.55, 0.40, 0.60, 0.48, 0.38];

// ── UNDERPASS PARAMETERS (placeholder — replace with real values from Alessio)
const UNDERPASS = {
  maxDepth: 2.0,        // total depth of the underpass in meters
  floodingThreshold: 1.2, // water level where flooding starts (depends on slope)
  floodedThreshold: 1.6,  // water level where it's fully flooded = access closed
};

// ── TIMESTAMP ──────────────────────────────────────────
function updateTimestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('timestamp').textContent = h + ':' + m + ':' + s;
}

// ── WATER LEVEL ────────────────────────────────────────
function updateWaterLevel() {
  waterLevel += (Math.random() - 0.48) * 0.04;
  waterLevel = Math.max(0.5, Math.min(1.9, waterLevel));
  const rounded = waterLevel.toFixed(2);

  document.getElementById('water-level').textContent = rounded;

  // gauge
  const gauge = document.getElementById('water-gauge');
  gauge.innerHTML = `
    <div class="water-fill" style="height: ${(waterLevel / 2.0) * 100}%"></div>
    <div class="danger-line" style="bottom: ${(1.7 / 2.0) * 100}%"></div>
    <div class="danger-label" style="bottom: ${(1.7 / 2.0) * 100 + 2}%">danger</div>
    <div class="water-level-label">${rounded} m</div>
  `;

  // flood status — 3 levels based on underpass parameters
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

// ── RAIN RATE ──────────────────────────────────────────
function updateRain() {
  const newVal = Math.max(0.05, Math.min(1.0, rainHistory[rainHistory.length - 1] + (Math.random() - 0.5) * 0.25));
  rainHistory.push(newVal);
  if (rainHistory.length > 7) rainHistory.shift();

  const mmh = (newVal * 20).toFixed(1);
  document.getElementById('rain-rate').textContent = mmh;

  // status
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

// line chart using SVG
  const w = 400, h = 80, pad = 10;
  const max = 1.0, min = 0.0;
  const stepX = (w - pad * 2) / (rainHistory.length - 1);

  const points = rainHistory.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const lastX = pad + (rainHistory.length - 1) * stepX;
  const lastY = h - pad - ((rainHistory[rainHistory.length - 1] - min) / (max - min)) * (h - pad * 2);

  document.getElementById('rain-chart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:90px;">
      <!-- grid lines -->
      <line x1="${pad}" y1="${pad}" x2="${w - pad}" y2="${pad}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${pad}" y1="${h / 2}" x2="${w - pad}" y2="${h / 2}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#e2e8f0" stroke-width="1"/>
      <!-- area fill -->
      <polygon
        points="${pad},${h - pad} ${points} ${lastX},${h - pad}"
        fill="#93c5fd" opacity="0.3"/>
      <!-- line -->
      <polyline
        points="${points}"
        fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <!-- current point dot -->
      <circle cx="${lastX}" cy="${lastY}" r="4" fill="#2563eb"/>
      <!-- labels -->
      <text x="${pad}" y="${h + 2}" font-size="9" fill="#94a3b8">-6s</text>
      <text x="${w / 2}" y="${h + 2}" font-size="9" fill="#94a3b8" text-anchor="middle">-3s</text>
      <text x="${w - pad}" y="${h + 2}" font-size="9" fill="#94a3b8" text-anchor="end">now</text>
    </svg>
  `;
}

// ── BAR STATUS ─────────────────────────────────────────
function updateBarStatus() {
  document.getElementById('bar-status').textContent = 'Closed';
}

// ── METEO — Open-Meteo API (Modena, Italy) ────────────
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

loadMessages();
updateMeteo();
update();
setInterval(update, 5000);