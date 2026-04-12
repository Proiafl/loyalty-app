import { supabase, trueAnonKey } from '../lib/supabase.js'
import { showToast } from '../lib/ui.js'

export function showPlanModal(biz, user) {
  console.log('[DEBUG] showPlanModal called', { bizId: biz?.id, plan: biz?.plan })
  // Remove existing if any
  const existing = document.getElementById('plan-modal')
  if (existing) existing.remove()

  const modalHtml = `
    <div id="plan-modal" class="modal-bg" style="display:flex;z-index:9000;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--bg-elevated);border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:2rem;max-width:800px;width:95%;box-shadow:0 24px 60px rgba(0,0,0,.8);position:relative;animation:slideUp .25s ease;">
        <button id="plan-modal-close" style="position:absolute;top:1rem;right:1rem;background:var(--surface);border:1px solid var(--surface-border);color:var(--on-surface);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;z-index:10">✕</button>
        
        <div class="text-center mb-4">
          <h2 class="section-title" style="margin-bottom:0.5rem">Llevá tu negocio al próximo nivel</h2>
          <p class="text-muted text-sm">Elegí el plan perfecto para vos.</p>
        </div>

        <div class="plans-grid">
          <!-- Freemium -->
          <div class="plan-card">
            <div class="plan-name">Freemium</div>
            <div class="plan-price">$0 <span>/mes</span></div>
            <p class="plan-desc">Ideal para probar y arrancar</p>
            <ul class="plan-features">
              <li>Hasta 20 clientes</li>
              <li>Hasta 2 recompensas</li>
              <li>QR dinámico anti-fraude</li>
              <li>Dashboard básico</li>
            </ul>
            <button class="btn btn-secondary btn-full" ${biz.plan === 'freemium' ? 'disabled' : ''}>
              ${biz.plan === 'freemium' ? 'Tu plan actual' : 'Incluido'}
            </button>
          </div>
          <!-- Pro -->
          <div class="plan-card highlighted">
            <span class="plan-popular-tag">⭐ Más elegido</span>
            <div class="plan-name">Pro</div>
            <div class="plan-price">$25 <span>/mes</span></div>
            <p class="plan-desc">Para negocios que quieren crecer</p>
            <ul class="plan-features">
              <li>Clientes ilimitados</li>
              <li>Recompensas ilimitadas</li>
              <li>QR dinámico anti-fraude</li>
              <li>Dashboard con analytics</li>
              <li>Notificaciones WhatsApp/Email</li>
              <li>Exportar datos (CSV)</li>
            </ul>
            <button class="btn btn-primary btn-full" id="btn-modal-upgrade">
              ${biz.plan === 'pro' ? 'Tu plan actual' : 'Suscribirme — Pro'}
            </button>
          </div>
        </div>

      </div>
    </div>
  `

  document.body.insertAdjacentHTML('beforeend', modalHtml)

  document.getElementById('plan-modal-close').onclick = () => {
    document.getElementById('plan-modal').remove()
  }

  const upgradeBtn = document.getElementById('btn-modal-upgrade')
  if (biz.plan === 'pro') {
    upgradeBtn.disabled = true;
    return;
  }

  upgradeBtn.onclick = async () => {
    upgradeBtn.disabled = true
    upgradeBtn.textContent = 'Procesando...'
    try {
      const payerEmail = user?.email || ''
      const { data, error } = await supabase.functions.invoke('mp-checkout', {
        body: { businessId: biz.id, payerEmail },
        headers: { Authorization: 'Bearer ' + trueAnonKey }
      })

      if (error) {
        console.error('[MP] Invoke Error details:', error);
        showToast('Error de pasarela al conectar con MercadoPago', 'error')
        return
      }
      
      if (data?.init_point) {
        window.location.href = data.init_point
      } else if (data?.error) {
        showToast(`MP Error: ${data.error}`, 'error')
      } else {
        showToast('No se recibió link de pago', 'error')
      }
    } catch (err) {
      console.error('[MP] Exception:', err)
      showToast(`Error crítico: ${err.message}`, 'error')
    } finally {
      upgradeBtn.disabled = false
      upgradeBtn.textContent = 'Suscribirme — Pro'
    }
  }
}
