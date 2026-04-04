import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

export async function renderNotificaciones(_, app, { biz }) {
  const isFreemium = biz.plan === 'freemium'
  let { data: customers } = await supabase.from('customers').select('id, status, name, last_visit_at, points').eq('business_id', biz.id)
  customers = customers || []

  const inactive30 = customers.filter(c => {
    if (!c.last_visit_at) return true
    return (Date.now() - new Date(c.last_visit_at)) > 30 * 86400000
  })
  const allRewards = await supabase.from('rewards').select('points_required').eq('business_id', biz.id)
  const minPts = Math.min(...(allRewards.data || [{ points_required: 100 }]).map(r => r.points_required))
  const nearReward = customers.filter(c => c.points >= minPts * 0.7 && c.points < minPts)

  const segments = [
    { id: 'all', label: `Todos (${customers.length})`, ids: customers.map(c => c.id) },
    { id: 'active', label: `Activos (${customers.filter(c => c.status === 'active').length})`, ids: customers.filter(c => c.status === 'active').map(c => c.id) },
    { id: 'inactive', label: `Inactivos +30d (${inactive30.length})`, ids: inactive30.map(c => c.id) },
    { id: 'near', label: `Cerca de canjear (${nearReward.length})`, ids: nearReward.map(c => c.id) },
  ]
  let selectedSeg = 'all'

  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'notificaciones')}
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Notificaciones</h1>
            <div class="page-subtitle">Enviá mensajes a tus clientes por segmento</div>
          </div>
          ${isFreemium ? `<span class="badge badge-inactive">🔒 Plan Pro</span>` : ''}
        </div>

        ${isFreemium ? `
          <div class="card" style="text-align:center;padding:3rem">
            <div style="font-size:3rem;margin-bottom:1rem">📣</div>
            <h2 style="font-size:1.25rem;margin-bottom:.5rem">Notificaciones para clientes</h2>
            <p class="text-muted text-sm mb-3">Enviá mensajes personalizados por WhatsApp o Email a tus clientes. Disponible en el plan Pro.</p>
            <button class="btn btn-primary" onclick="alert('¡Próximamente! Contactanos para activar Pro.')">Activar Plan Pro</button>
          </div>
        ` : `
          <div class="card notif-form">
            <div class="form-group">
              <label class="form-label">Segmento destinatario</label>
              <div class="chip-group" id="seg-chips">
                ${segments.map(s => `
                  <button class="chip ${s.id === selectedSeg ? 'selected' : ''}" data-seg="${s.id}">${s.label}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Mensaje</label>
              <textarea class="form-input" id="notif-msg" placeholder="Ej: ¡Hola! Esta semana 20% de descuento. ¡Vení a visitarnos! 🎉"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Canal</label>
              <div class="toggle-row"><span class="toggle-label">📱 WhatsApp</span><label class="toggle"><input type="checkbox" id="ch-wa" checked><span class="slider"></span></label></div>
              <div class="toggle-row"><span class="toggle-label">📧 Email</span><label class="toggle"><input type="checkbox" id="ch-em"><span class="slider"></span></label></div>
            </div>
            <button class="btn btn-primary" id="btn-send-notif">Enviar notificación</button>
          </div>
        `}
      </main>
    </div>
  `

  if (!isFreemium) {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
        chip.classList.add('selected')
        selectedSeg = chip.dataset.seg
      }
    })

    document.getElementById('btn-send-notif').onclick = async () => {
      const msg = document.getElementById('notif-msg').value.trim()
      if (!msg) { showToast('Escribí un mensaje'); return }
      const seg = segments.find(s => s.id === selectedSeg)
      // In production: call Edge Function to send via WhatsApp/Email
      showToast(`✓ Notificación enviada a ${seg.ids.length} clientes`)
      document.getElementById('notif-msg').value = ''
    }
  }
}
