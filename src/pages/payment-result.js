import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'

export async function renderPaymentSuccess(params, app) {
  // Show loading state immediately
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(236,253,24,.15) 0%,transparent 60%);pointer-events:none"></div>
      <div style="text-align:center;position:relative;z-index:1">
        <div style="width:64px;height:64px;border:3px solid var(--surface-border);border-top-color:var(--primary);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1.5rem"></div>
        <p style="color:var(--on-surface-muted)">Verificando tu pago...</p>
      </div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `

  // Get URL params for MP callback
  const urlParams = new URLSearchParams(window.location.search)
  const hash = window.location.hash
  const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '')
  
  const status = urlParams.get('status') || hashParams.get('status')
  const paymentId = urlParams.get('payment_id') || hashParams.get('payment_id')
  const externalRef = urlParams.get('external_reference') || hashParams.get('external_reference')

  // Wait a moment for the subscription to be processed by webhook
  await new Promise(r => setTimeout(r, 2000))

  if (status === 'approved' || status === 'authorized') {
    // Refresh business data to check if upgraded
    let biz = null
    let attempts = 0
    while (attempts < 5) {
      const { data } = await supabase
        .from('businesses')
        .select('id, name, plan')
        .eq('id', externalRef)
        .single()
      
      if (data && data.plan === 'pro') {
        biz = data
        break
      }
      attempts++
      if (attempts < 5) await new Promise(r => setTimeout(r, 2000))
    }

    renderSuccess(app, biz)
  } else if (status === 'pending') {
    renderPending(app)
  } else {
    renderError(app)
  }
}

function renderSuccess(app, biz) {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:2rem;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(236,253,24,.15) 0%,transparent 60%);pointer-events:none"></div>
      
      <!-- Confetti dots -->
      <div class="confetti-container" style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
        ${Array.from({length:20}).map((_,i) => `
          <div style="position:absolute;width:8px;height:8px;border-radius:50%;background:${['#ecfd18','#38bdf8','#22c55e','#f59e0b'][i%4]};left:${Math.random()*100}%;top:${Math.random()*100}%;animation:floatUp ${2+Math.random()*3}s ease-out ${Math.random()*2}s infinite;opacity:.7"></div>
        `).join('')}
      </div>

      <div style="background:var(--bg-elevated);border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:3rem 2.5rem;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.6);text-align:center;position:relative;z-index:1;animation:slideUp .4s ease">
        
        <!-- Success icon -->
        <div style="width:80px;height:80px;background:var(--grad-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;box-shadow:0 0 40px rgba(236,253,24,.4);animation:pulse 2s ease infinite">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>
        </div>
        
        <div style="display:inline-flex;align-items:center;gap:.4rem;background:var(--primary-light);border:1px solid rgba(236,253,24,.2);border-radius:var(--radius-full);padding:.35rem 1rem;font-size:.75rem;font-weight:700;color:var(--primary);margin-bottom:1.25rem;text-transform:uppercase;letter-spacing:.06em">
          ⭐ Plan Pro Activado
        </div>
        
        <h1 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin-bottom:.75rem">
          ¡Bienvenido al Pro,<br>${biz ? biz.name : ''}!
        </h1>
        
        <p style="color:var(--on-surface-muted);margin-bottom:2rem;line-height:1.6">
          Tu suscripción <strong style="color:var(--primary)">LoyaltyApp Pro</strong> está activa. Ahora tenés acceso ilimitado a clientes, recompensas, analytics avanzado y más.
        </p>

        <div style="background:var(--surface);border:1px solid var(--surface-border);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:2rem;text-align:left">
          <div style="font-size:.75rem;font-weight:600;color:var(--on-surface-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.75rem">Desbloqueado en tu plan Pro:</div>
          ${['✅ Clientes ilimitados','✅ Recompensas ilimitadas','✅ Analytics Avanzado','✅ Notificaciones WhatsApp/Email','✅ Exportar datos CSV'].map(f => `
            <div style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;padding:.35rem 0;color:var(--on-surface)">${f}</div>
          `).join('')}
        </div>

        <button class="btn btn-primary btn-full" id="btn-go-dashboard" style="margin-bottom:1rem">
          Ir a mi Dashboard ⭐
        </button>
        
        <div style="font-size:.75rem;color:var(--on-surface-muted)">
          Desarrollado por <a href="https://futuwebs.com" target="_blank" style="color:var(--primary);font-weight:600;text-decoration:none">futuwebs.com</a>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      @keyframes pulse { 0%,100% { box-shadow:0 0 40px rgba(236,253,24,.4) } 50% { box-shadow:0 0 60px rgba(236,253,24,.6) } }
      @keyframes floatUp { 0% { transform:translateY(0) rotate(0deg); opacity:.7 } 100% { transform:translateY(-100vh) rotate(360deg); opacity:0 } }
    </style>
  `

  document.getElementById('btn-go-dashboard')?.addEventListener('click', () => navigate('/dashboard'))
}

function renderPending(app) {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:2rem">
      <div style="background:var(--bg-elevated);border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:3rem 2.5rem;max-width:480px;width:100%;text-align:center;animation:slideUp .4s ease">
        <div style="width:72px;height:72px;background:var(--warning-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem">⏳</div>
        <h1 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:.75rem">Pago en proceso</h1>
        <p style="color:var(--on-surface-muted);margin-bottom:2rem">Tu pago está siendo procesado. En instantes recibirás confirmación y tu plan Pro se activará automáticamente.</p>
        <button class="btn btn-secondary btn-full" id="btn-pending-dash">Ir al Dashboard</button>
      </div>
    </div>
    <style>@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}</style>
  `
  document.getElementById('btn-pending-dash')?.addEventListener('click', () => navigate('/dashboard'))
}

function renderError(app) {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:2rem">
      <div style="background:var(--bg-elevated);border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:3rem 2.5rem;max-width:480px;width:100%;text-align:center;animation:slideUp .4s ease">
        <div style="width:72px;height:72px;background:var(--error-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem">❌</div>
        <h1 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;margin-bottom:.75rem">Pago no completado</h1>
        <p style="color:var(--on-surface-muted);margin-bottom:2rem">El pago no fue procesado. Podés intentarlo nuevamente desde la sección de configuración.</p>
        <button class="btn btn-primary btn-full" id="btn-retry">Reintentar desde Configuración</button>
      </div>
    </div>
    <style>@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}</style>
  `
  document.getElementById('btn-retry')?.addEventListener('click', () => navigate('/config'))
}
