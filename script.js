// ── MOCK DATA ──────────────────────────────────────────
let waterLevel = 1.24;
let rainHistory = [0.20, 0.35, 0.55, 0.40, 0.60, 0.48, 0.38];

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

  // status badge
  const statusEl = document.getElementById('water-status');
  if (waterLevel > 1.7) {
    statusEl.textContent = 'Alert';
    statusEl.className = 'status alert';
  } else if (waterLevel > 1.4) {
    statusEl.textContent = 'Warning';
    statusEl.className = 'status warn';
  } else {
    statusEl.textContent = 'Normal';
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

  // bars
  const barsHTML = rainHistory.map((v, i) => {
    const isActive = i === rainHistory.length - 1;
    return `<div class="rain-bar ${isActive ? 'active' : ''}" style="height: ${v * 90 + 5}%"></div>`;
  }).join('');

  document.getElementById('rain-chart').innerHTML = `
    <div class="rain-bars-container">${barsHTML}</div>
    <div class="rain-time-labels">
      <span>-6s</span><span>-5s</span><span>-4s</span>
      <span>-3s</span><span>-2s</span><span>-1s</span><span>now</span>
    </div>
  `;
}

// ── BAR STATUS ─────────────────────────────────────────
function updateBarStatus() {
  document.getElementById('bar-status').textContent = 'Closed';
}

// ── METEO (mock, later replaced by API) ───────────────
function updateMeteo() {
  document.getElementById('meteo-data').innerHTML = `
    <div class="meteo-grid">
      <div class="meteo-item"><div class="key">Temperature</div><div class="val">14 °C</div></div>
      <div class="meteo-item"><div class="key">Humidity</div><div class="val">78 %</div></div>
      <div class="meteo-item"><div class="key">Wind speed</div><div class="val">12 km/h</div></div>
      <div class="meteo-item"><div class="key">Pressure</div><div class="val">1012 hPa</div></div>
    </div>
  `;
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