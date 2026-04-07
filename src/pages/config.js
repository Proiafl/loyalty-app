import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

const BIZ_TYPES = [
  { value: 'peluqueria', label: 'Peluquería' }, { value: 'bar', label: 'Bar / Café' },
  { value: 'lavadero', label: 'Lavadero' }, { value: 'estetica', label: 'Estética' },
  { value: 'comida', label: 'Comida' }, { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'comercio', label: 'Comercio' }, { value: 'servicio', label: 'Servicio' }, { value: 'otro', label: 'Otro' },
]

export async function renderConfig(_, app, { biz, user }) {
  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'config')}
      <main class="main-content">
        <div class="page-header">
          <h1 class="page-title">Configuración</h1>
        </div>

        <!-- Business Data -->
        <div class="card mb-3">
          <div class="card-title">Datos del negocio</div>
          <div class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre del negocio</label>
                <input class="form-input" id="cfg-name" value="${biz.name}" />
              </div>
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="form-input" id="cfg-type">
                  ${BIZ_TYPES.map(t => `<option value="${t.value}" ${biz.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input class="form-input" id="cfg-address" placeholder="Ej: Av. Corrientes 1234, CABA" value="${biz.address || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" id="cfg-phone" type="tel" placeholder="+54 11 1234-5678" value="${biz.phone || ''}" />
            </div>
            <button class="btn btn-primary" id="btn-save-biz">Guardar cambios</button>
          </div>
        </div>

        <!-- Points System -->
        <div class="card mb-3">
          <div class="card-title">Sistema de puntos</div>
          <div class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Método</label>
                <select class="form-input" id="cfg-method">
                  <option value="visit" ${biz.points_method === 'visit' ? 'selected' : ''}>Por visita validada</option>
                  <option value="amount" ${biz.points_method === 'amount' ? 'selected' : ''}>Por monto gastado</option>
                  <option value="mixed" ${biz.points_method === 'mixed' ? 'selected' : ''}>Mixto</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Puntos por visita</label>
                <input class="form-input" id="cfg-ppts" type="number" min="1" value="${biz.points_per_visit}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Validez del QR (segundos)</label>
                <input class="form-input" id="cfg-ttl" type="number" min="30" max="300" value="${biz.qr_ttl_seconds}" />
              </div>
              <div class="form-group">
                <label class="form-label">Máx. validaciones por día/cliente</label>
                <input class="form-input" id="cfg-maxval" type="number" min="1" value="${biz.max_validations_day}" />
              </div>
            </div>
            <button class="btn btn-primary" id="btn-save-pts">Guardar sistema de puntos</button>
          </div>
        </div>

        <!-- Plan -->
        <div class="card mb-3">
          <div class="card-title">Plan actual</div>
          <div class="flex items-center just-between">
            <div>
              <span class="plan-badge ${biz.plan}">${biz.plan === 'pro' ? '⭐ Pro' : 'Freemium'}</span>
              <p class="text-muted text-sm mt-1">${biz.plan === 'freemium' ? 'Hasta 20 clientes y 2 recompensas.' : 'Clientes y recompensas ilimitadas. ✓'}</p>
            </div>
            ${biz.plan === 'freemium' ? `<button class="btn btn-primary" id="btn-upgrade">Activar Pro ⭐</button>` : ''}
          </div>
        </div>

        <!-- Account -->
        <div class="card">
          <div class="card-title">Cuenta</div>
          <p class="text-muted text-sm mb-3">Email: <strong>${user?.email || '—'}</strong></p>
          <button class="btn btn-danger btn-sm" id="btn-logout">Cerrar sesión</button>
        </div>
      </main>
    </div>
  `

  document.getElementById('btn-save-biz').onclick = async () => {
    const btn = document.getElementById('btn-save-biz')
    btn.disabled = true; btn.textContent = 'Guardando...'
    const { error } = await supabase.from('businesses').update({
      name: document.getElementById('cfg-name').value.trim(),
      type: document.getElementById('cfg-type').value,
      address: document.getElementById('cfg-address').value.trim() || null,
      phone: document.getElementById('cfg-phone').value.trim() || null,
    }).eq('id', biz.id)
    showToast(error ? 'Error al guardar' : 'Datos actualizados ✓')
    btn.disabled = false; btn.textContent = 'Guardar cambios'
  }

  document.getElementById('btn-save-pts').onclick = async () => {
    const btn = document.getElementById('btn-save-pts')
    btn.disabled = true; btn.textContent = 'Guardando...'
    const { error } = await supabase.from('businesses').update({
      points_method: document.getElementById('cfg-method').value,
      points_per_visit: parseInt(document.getElementById('cfg-ppts').value) || 10,
      qr_ttl_seconds: parseInt(document.getElementById('cfg-ttl').value) || 90,
      max_validations_day: parseInt(document.getElementById('cfg-maxval').value) || 1,
    }).eq('id', biz.id)
    showToast(error ? 'Error al guardar' : 'Sistema de puntos actualizado ✓')
    btn.disabled = false; btn.textContent = 'Guardar sistema de puntos'
  }

  const upgradeBtn = document.getElementById('btn-upgrade')
  if (upgradeBtn) {
    const doUpgrade = async () => {
      upgradeBtn.disabled = true
      upgradeBtn.textContent = 'Procesando...'
      try {
        const userOrigin = await supabase.auth.getUser()
        const payerEmail = userOrigin?.data?.user?.email || ''
        
        const { data, error } = await supabase.functions.invoke('mp-checkout', {
          body: { businessId: biz.id, planPrice: 25, payerEmail }
        })
        if (error) throw error
        if (data && data.init_point) {
          window.location.href = data.init_point
        } else {
          showToast('Error de MercadoPago', 'error')
        }
      } catch(err) {
        showToast('Error contactando pasarela de pago', 'error')
      } finally {
        upgradeBtn.disabled = false
        upgradeBtn.textContent = 'Activar Pro ⭐'
      }
    }
    upgradeBtn.onclick = doUpgrade
    
    // Auto-launch checkout if intent is present (set by onboarding Pro flow)
    if (sessionStorage.getItem('loyaltyapp_launch_pay') === 'true') {
      sessionStorage.removeItem('loyaltyapp_launch_pay')
      doUpgrade()
    }
  }

  document.getElementById('btn-logout').onclick = async () => {
    await supabase.auth.signOut()
    window.location.hash = '/'
  }
}
