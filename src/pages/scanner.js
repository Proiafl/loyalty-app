import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { validateQRToken, confirmQRScan } from '../lib/qr.js'
import { showToast } from '../main.js'

import { Html5Qrcode } from 'html5-qrcode'

export async function renderScanner(_, app, { biz }) {
  let pendingData = null
  let scannerInstance = null

  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'scanner')}
      <main class="main-content">
        <div class="page-header">
          <h1 class="page-title">Escanear cliente</h1>
        </div>

        <!-- How it works -->
        <div class="card mb-3">
          <div class="card-title">¿Cómo funciona?</div>
          ${[
            ['1', 'El cliente abre LoyaltyApp en su teléfono y muestra su <strong>QR dinámico</strong> personal.'],
            ['2', 'Escaneás el QR con la cámara o ingresás el token manualmente. El QR es válido por <strong>90 segundos</strong>.'],
            ['3', 'El sistema valida el token, registra la visita y <strong>suma los puntos automáticamente</strong>. El token queda invalidado.'],
          ].map(([n, t]) => `
            <div class="flex items-center gap-2" style="margin-bottom:.75rem">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--grad-primary);color:var(--bg);font-weight:700;font-size:.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">${n}</div>
              <p class="text-sm">${t}</p>
            </div>
          `).join('')}
        </div>

        <div class="scan-panel">
          <div class="card-title" style="margin-bottom:.5rem">📷 Escanear QR</div>
          
          <div id="qr-reader" style="width: 100%; max-width: 400px; margin: 0 auto; border-radius: var(--radius-md); overflow: hidden;"></div>
          <div style="text-align: center; margin: 1rem 0;">
             <button class="btn btn-secondary btn-sm" id="btn-toggle-cam">Iniciar Cámara</button>
          </div>

          <div class="card-title" style="margin: 1.5rem 0 .5rem;">...o ingresar token manual</div>
          <div class="scan-input-row">
            <input class="form-input scan-input" id="scan-input" placeholder="Ej: PEL-M1X8J3-A7F2" maxlength="25" oninput="this.value=this.value.toUpperCase()" />
            <button class="btn btn-primary" id="btn-scan">Validar</button>
          </div>

          <!-- OK result -->
          <div class="scan-result ok hidden" id="scan-ok">
            <div class="scan-result-header">
              <div class="avatar avatar-lg" id="sr-avatar">?</div>
              <div>
                <div class="scan-result-name" id="sr-name">—</div>
                <div class="scan-result-meta" id="sr-meta">—</div>
              </div>
            </div>
            <div class="scan-result-pts" id="sr-pts">—</div>
            <div class="scan-actions">
              <button class="btn btn-primary" id="btn-confirm">✓ Confirmar puntos</button>
              <button class="btn btn-ghost" id="btn-cancel">Cancelar</button>
            </div>
          </div>

          <!-- Error result -->
          <div class="scan-result error hidden" id="scan-err">
            <div class="scan-err-msg" id="sr-err-msg">—</div>
            <div class="scan-err-hint">Pedile al cliente que genere un nuevo QR en su app.</div>
          </div>
        </div>

        <!-- Historial del día -->
        <div class="card mt-3">
          <div class="card-title">Validaciones de hoy</div>
          <div id="today-log"><p class="text-muted text-sm">Cargando...</p></div>
        </div>
      </main>
    </div>
  `

  const scanInput = document.getElementById('scan-input')
  const scanOk = document.getElementById('scan-ok')
  const scanErr = document.getElementById('scan-err')

  async function loadTodayLog() {
    const today = new Date(); today.setHours(0,0,0,0)
    const { data } = await supabase
      .from('point_transactions')
      .select('*, customer:customers(name)')
      .eq('business_id', biz.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    const el = document.getElementById('today-log')
    if (!data || data.length === 0) {
      el.innerHTML = '<p class="text-muted text-sm">Sin validaciones hoy aún.</p>'
      return
    }
    el.innerHTML = data.map(tx => `
      <div class="log-item">
        <div class="log-icon ok">✓</div>
        <div>
          <div class="log-name">${tx.customer?.name || 'Cliente'}</div>
          <div class="log-detail">+${tx.points} puntos</div>
        </div>
        <div class="log-time">${new Date(tx.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `).join('')
  }

  document.getElementById('btn-scan').onclick = async () => {
    const token = scanInput.value.trim()
    if (!token) { showToast('Ingresá un token'); return }

    scanOk.classList.add('hidden')
    scanErr.classList.add('hidden')
    pendingData = null

    const result = await validateQRToken(token, biz.id)

    if (!result.valid) {
      document.getElementById('sr-err-msg').textContent = result.error
      scanErr.classList.remove('hidden')
      return
    }

    const c = result.customer
    const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    document.getElementById('sr-avatar').textContent = initials
    document.getElementById('sr-name').textContent = c.name
    document.getElementById('sr-meta').textContent = `${c.points} puntos actuales`
    document.getElementById('sr-pts').textContent = `Se sumarán ${biz.points_per_visit} puntos → total: ${c.points + biz.points_per_visit} pts`
    scanOk.classList.remove('hidden')
    pendingData = { tokenId: result.tokenData.id, customerId: c.id }
  }

  // Allow Enter key
  scanInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-scan').click() })

  document.getElementById('btn-confirm').onclick = async () => {
    if (!pendingData) return
    const btn = document.getElementById('btn-confirm')
    btn.disabled = true; btn.textContent = 'Guardando...'

    const newPts = await confirmQRScan(pendingData.tokenId, pendingData.customerId, biz.id, biz.points_per_visit || 10)
    if (newPts !== null) {
      showToast(`✓ +${biz.points_per_visit} puntos sumados. Total: ${newPts}`)
    } else {
      showToast('Error al confirmar el escaneo', 'error')
    }
    scanOk.classList.add('hidden')
    scanInput.value = ''
    pendingData = null
    btn.disabled = false; btn.textContent = '✓ Confirmar puntos'
    loadTodayLog()
  }

  document.getElementById('btn-cancel').onclick = () => {
    scanOk.classList.add('hidden')
    scanInput.value = ''
    pendingData = null
  }

  loadTodayLog()

  // --- Html5Qrcode Logic ---
  const btnToggleCam = document.getElementById('btn-toggle-cam')
  let isScanning = false

  async function startScanner() {
    try {
      scannerInstance = new Html5Qrcode("qr-reader")
      await scannerInstance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // On success
          scanInput.value = decodedText
          document.getElementById('btn-scan').click()
          stopScanner() // Optional: stop after success so they can confirm
        },
        (errorMessage) => {
          // parse error, ignore
        }
      )
      isScanning = true
      btnToggleCam.textContent = 'Detener Cámara'
      btnToggleCam.classList.replace('btn-secondary', 'btn-danger')
    } catch (err) {
      showToast('Error al iniciar cámara. Asegurate de dar permisos.', 'error')
      console.error(err)
    }
  }

  async function stopScanner() {
    if (scannerInstance && isScanning) {
      try {
        await scannerInstance.stop()
        scannerInstance.clear()
      } catch (err) {
        console.error('Failed to stop scanner', err)
      }
      isScanning = false
      btnToggleCam.textContent = 'Iniciar Cámara'
      btnToggleCam.classList.replace('btn-danger', 'btn-secondary')
    }
  }

  btnToggleCam.addEventListener('click', () => {
    if (isScanning) {
      stopScanner()
    } else {
      startScanner()
    }
  })

  // Cleanup when navigating away
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(app)) {
      stopScanner()
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
