import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../main.js'

const BIZ_TYPES = [
  { icon: '💈', label: 'Peluquería', value: 'peluqueria' },
  { icon: '☕', label: 'Bar / Café', value: 'bar' },
  { icon: '🚿', label: 'Lavadero', value: 'lavadero' },
  { icon: '💅', label: 'Estética', value: 'estetica' },
  { icon: '🍕', label: 'Comida', value: 'comida' },
  { icon: '💪', label: 'Gimnasio', value: 'gimnasio' },
  { icon: '🛒', label: 'Comercio', value: 'comercio' },
  { icon: '🔧', label: 'Servicio', value: 'servicio' },
  { icon: '🏪', label: 'Otro', value: 'otro' },
]

export function renderOnboarding(app, user) {
  let step = 0
  const data = { name: '', slug: '', type: 'otro', address: '', phone: '', rewardName: 'Premio del cliente', rewardPts: 100 }

  function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30)
  }

  function render() {
    app.innerHTML = `
      <div class="onboarding-page">
        <div class="onboarding-box">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:2rem">
            <div style="width:36px;height:36px;background:var(--grad-primary);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:var(--bg);font-family:var(--font-display);font-weight:800">L</div>
            <span style="font-family:var(--font-display);font-weight:800">LoyaltyApp</span>
          </div>
          <div class="step-indicator">
            ${[0,1,2].map(i => `<div class="step-dot ${i < step ? 'done' : i === step ? 'active' : ''}"></div>`).join('')}
          </div>
          <div id="onboarding-step"></div>
        </div>
      </div>
    `
    renderStep()
  }

  function renderStep() {
    const el = document.getElementById('onboarding-step')
    if (step === 0) {
      el.innerHTML = `
        <h2 style="font-size:1.5rem;margin-bottom:.5rem">Tu negocio 🏪</h2>
        <p class="text-muted text-sm mb-3">Empecemos con los datos básicos.</p>
        <div class="auth-form">
          <div class="form-group">
            <label class="form-label">Nombre del negocio *</label>
            <input class="form-input" id="ob-name" placeholder="Ej: Peluquería Estilo" value="${data.name}" />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono (opcional)</label>
            <input class="form-input" id="ob-phone" type="tel" placeholder="+54 11 1234-5678" value="${data.phone}" />
          </div>
          <button class="btn btn-primary" id="ob-next1">Continuar →</button>
        </div>
      `
      document.getElementById('ob-next1').onclick = () => {
        data.name = document.getElementById('ob-name').value.trim()
        data.phone = document.getElementById('ob-phone').value.trim()
        data.slug = slugify(data.name)
        if (!data.name) { showToast('Ingresá el nombre del negocio'); return }
        step = 1; renderStep()
      }
    } else if (step === 1) {
      el.innerHTML = `
        <h2 style="font-size:1.5rem;margin-bottom:.5rem">Tipo de negocio</h2>
        <p class="text-muted text-sm mb-3">¿Qué tipo de emprendimiento tenés?</p>
        <div class="biz-type-grid" id="biz-type-grid">
          ${BIZ_TYPES.map(t => `
            <div class="biz-type-btn ${data.type === t.value ? 'selected' : ''}" data-val="${t.value}">
              <div class="biz-type-icon">${t.icon}</div>
              <div class="biz-type-label">${t.label}</div>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-ghost" id="ob-back1">← Atrás</button>
          <button class="btn btn-primary" id="ob-next2">Continuar →</button>
        </div>
      `
      document.querySelectorAll('.biz-type-btn').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('.biz-type-btn').forEach(b => b.classList.remove('selected'))
          btn.classList.add('selected')
          data.type = btn.dataset.val
        }
      })
      document.getElementById('ob-back1').onclick = () => { step = 0; renderStep() }
      document.getElementById('ob-next2').onclick = () => { step = 2; renderStep() }
    } else if (step === 2) {
      el.innerHTML = `
        <h2 style="font-size:1.5rem;margin-bottom:.5rem">Tu primera recompensa 🎁</h2>
        <p class="text-muted text-sm mb-3">¿Qué le das a un cliente fiel? Podés cambiarlo después.</p>
        <div class="auth-form">
          <div class="form-group">
            <label class="form-label">Nombre de la recompensa</label>
            <input class="form-input" id="ob-reward" value="${data.rewardName}" />
          </div>
          <div class="form-group">
            <label class="form-label">Puntos necesarios para canjear</label>
            <input class="form-input" id="ob-pts" type="number" min="1" max="9999" value="${data.rewardPts}" />
          </div>
          <div class="flex gap-2 mt-1">
            <button class="btn btn-ghost" id="ob-back2">← Atrás</button>
            <button class="btn btn-primary" id="ob-finish">🚀 ¡Crear mi negocio!</button>
          </div>
        </div>
      `
      document.getElementById('ob-back2').onclick = () => { step = 1; renderStep() }
      document.getElementById('ob-finish').onclick = createBusiness
    }
  }

  async function createBusiness() {
    const btn = document.getElementById('ob-finish')
    data.rewardName = document.getElementById('ob-reward').value.trim()
    data.rewardPts = parseInt(document.getElementById('ob-pts').value) || 100
    if (!data.rewardName) { showToast('Ingresá el nombre de la recompensa'); return }

    btn.disabled = true
    btn.textContent = 'Creando...'

    try {
      // Create business
      const { data: biz, error: bizErr } = await supabase.from('businesses').insert({
        owner_id: user.id,
        name: data.name,
        slug: data.slug,
        type: data.type,
        phone: data.phone || null,
      }).select().single()
      if (bizErr) throw bizErr

      // Create first reward
      await supabase.from('rewards').insert({
        business_id: biz.id,
        name: data.rewardName,
        points_required: data.rewardPts,
        icon: '🎁',
      })

      showToast('¡Negocio creado! Bienvenido 🎉')
      
      if (sessionStorage.getItem('loyaltyapp_intent_pro') === 'true') {
        sessionStorage.removeItem('loyaltyapp_intent_pro')
        sessionStorage.setItem('loyaltyapp_launch_pay', 'true')
        navigate('/config')
      } else {
        navigate('/dashboard')
      }
      
    } catch (err) {
      console.error('[Onboarding]', err)
      showToast('Error creando el negocio: ' + (err.message || 'desconocido'))
      btn.disabled = false
      btn.textContent = '🚀 ¡Crear mi negocio!'
    }
  }

  render()
}
