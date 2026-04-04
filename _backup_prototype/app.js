/* ─────────────────────────────────────────
   LoyaltyApp — app.js
   ───────────────────────────────────────── */

// ── Navigation
function nav(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    el.classList.add('active');
}

// ── Toast notification
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Toggle pill selection
function togglePill(el) {
    el.classList.toggle('sel');
}

// ─────────────────────────────────────────
// SCANNER — Token validation
// ─────────────────────────────────────────

/**
 * Simulated token database.
 * In production: tokens are generated server-side (JWT),
 * stored in DB with { used: bool, createdAt: timestamp }.
 *
 * Token format: {INITIALS}-{YYYYMMDD}-{RANDOM4}
 */
const TOKENS = {
    'ML-20250325-A7F2': { name: 'María López', initials: 'ML', pts: 82, used: false, ts: Date.now() },
    'CG-20250325-B3D9': { name: 'Carlos García', initials: 'CG', pts: 55, used: false, ts: Date.now() },
    'LM-20250325-F9A3': { name: 'Laura Martín', initials: 'LM', pts: 97, used: false, ts: Date.now() },
    'AT-20250325-D4K1': { name: 'Ana Torres', initials: 'AT', pts: 10, used: false, ts: Date.now() },
    // Already-used token (fraud simulation)
    'ML-20250325-A6C1': { name: 'María López', initials: 'ML', pts: 82, used: true, ts: Date.now() - 900000 },
    // Expired token (older than 90s)
    'PD-20250324-C1E8': { name: 'Pedro Díaz', initials: 'PD', pts: 30, used: false, ts: Date.now() - 2000000 },
};

const TOKEN_TTL_MS = 90000; // 90 seconds
let pendingToken = null;

/**
 * Validates the scanned/entered token against 3 rules:
 * 1. Token exists and belongs to this business
 * 2. Token has not been used before (one-time use)
 * 3. Token was generated within the last 90 seconds
 */
function doScan() {
    const val = document.getElementById('scan-input').value.trim();
    const okEl = document.getElementById('scan-result-ok');
    const errEl = document.getElementById('scan-result-err');

    // Reset previous results
    okEl.style.display = 'none';
    errEl.style.display = 'none';

    if (!val) { showToast('Ingresá un token'); return; }

    const tk = TOKENS[val];

    // Rule 1 — Token not found
    if (!tk) {
        document.getElementById('sr-err').textContent =
            'Token no reconocido. Verificá que el cliente tenga LoyaltyApp configurada para este negocio.';
        errEl.style.display = 'block';
        return;
    }

    // Rule 2 — Token already used
    if (tk.used) {
        document.getElementById('sr-err').textContent =
            `Token ya utilizado. ${tk.name} ya sumó puntos con este QR.`;
        errEl.style.display = 'block';
        return;
    }

    // Rule 3 — Token expired (> 90 seconds old)
    if (Date.now() - tk.ts > TOKEN_TTL_MS) {
        document.getElementById('sr-err').textContent =
            `QR expirado (más de 90 segundos). Pedile a ${tk.name} que genere uno nuevo.`;
        errEl.style.display = 'block';
        return;
    }

    // All checks passed — show confirmation
    pendingToken = val;
    document.getElementById('sr-avatar').textContent = tk.initials;
    document.getElementById('sr-name').textContent = tk.name;
    document.getElementById('sr-meta').textContent = `${tk.pts} puntos actuales · Token: ${val}`;
    document.getElementById('sr-pts').textContent = `Se sumarán 10 puntos → total: ${tk.pts + 10} pts`;
    okEl.style.display = 'block';
}

/** Confirm the validated scan — marks token as used, adds points */
function confirmScan() {
    if (!pendingToken) return;
    const tk = TOKENS[pendingToken];
    tk.used = true;
    tk.pts += 10;
    document.getElementById('scan-result-ok').style.display = 'none';
    document.getElementById('scan-input').value = '';
    pendingToken = null;
    showToast(`+10 puntos sumados a ${tk.name}`);
}

/** Cancel without registering points */
function cancelScan() {
    document.getElementById('scan-result-ok').style.display = 'none';
    document.getElementById('scan-input').value = '';
    pendingToken = null;
}

// ─────────────────────────────────────────
// CLIENT VIEW — Dynamic QR countdown
// ─────────────────────────────────────────

/**
 * Simulated token pool for the client-side QR rotation.
 * In production: each token is requested from the server,
 * signed with the client's ID + timestamp (JWT or HMAC).
 */
const CLIENT_TOKENS = ['A7F2', 'B3K9', 'D2P1', 'F8M4', 'C5R7', 'E1N3', 'G6T0', 'H9L2'];
let qrSeconds = 90;
let qrInterval = null;
let tokenIdx = 0;

/** Returns the current simulated token string */
function genToken() {
    return 'ML-20250325-' + CLIENT_TOKENS[tokenIdx % CLIENT_TOKENS.length];
}

/**
 * Randomizes the variable QR bits to visually indicate
 * a new token has been generated (simulates a different QR pattern).
 */
function randomizeQRBits() {
    const ids = [
        'dqr-r1', 'dqr-r2', 'dqr-r3', 'dqr-r4', 'dqr-r5', 'dqr-r6', 'dqr-r7',
        'dqr-r8', 'dqr-r9', 'dqr-r10', 'dqr-r11', 'dqr-r12', 'dqr-r13', 'dqr-r14'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = Math.random() > 0.3 ? '1' : '0';
    });
}

/** Renews the QR — called when the client taps "Renovar QR" after expiry */
function renewQR() {
    tokenIdx++;
    qrSeconds = 90;

    const overlay = document.getElementById('dqr-overlay');
    const tokenEl = document.getElementById('dqr-token');
    const timerEl = document.getElementById('dqr-timer');

    if (overlay) overlay.style.display = 'none';
    if (tokenEl) tokenEl.textContent = genToken();
    if (timerEl) timerEl.textContent = qrSeconds;

    randomizeQRBits();
    startQRTimer();
}

/** Starts (or restarts) the 90-second countdown */
function startQRTimer() {
    clearInterval(qrInterval);
    qrInterval = setInterval(() => {
        qrSeconds--;
        const timerEl = document.getElementById('dqr-timer');
        if (timerEl) timerEl.textContent = qrSeconds;

        if (qrSeconds <= 0) {
            clearInterval(qrInterval);
            const overlay = document.getElementById('dqr-overlay');
            if (overlay) overlay.style.display = 'flex';
        }
    }, 1000);
}

// ── Init
startQRTimer();