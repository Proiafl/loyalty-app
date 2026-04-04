import { supabase, getUser } from '../../lib/supabase.js'
import { navigate } from '../../lib/router.js'
import { showToast } from '../../main.js'

export async function renderJoin({ slug }, app) {
  const { data: biz } = await supabase.from('businesses').select('id, name, type, plan').eq('slug', slug).single()
  if (!biz) { app.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--on-surface-muted)">Negocio no encontrado.</p>'; return }

  // Check if user is logged in
  const user = await getUser()

  // If logged in, check if already a customer of this business
  if (user) {
    const { data: existing } = await supabase
      .from('customers').select('id')
      .eq('business_id', biz.id).eq('user_id', user.id).single()
    if (existing) {
      showToast(`Ya estás registrado en ${biz.name}`)
      navigate('/mi-cuenta')
      return
    }
  }

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo">
          <div class="auth-logo-icon">🏪</div>
          <div class="auth-title">Unirte a ${biz.name}</div>
          <div class="auth-subtitle">Registrate para acumular puntos y canjear recompensas</div>
        </div>

        ${!user ? `
        <div style="background:var(--primary-light);border:1px solid rgba(236,253,24,.2);border-radius:var(--radius-md);padding:.75rem 1rem;margin-bottom:1rem">
          <p class="text-sm" style="color:var(--primary)">💡 ¿Ya tenés cuenta? <button id="join-go-login" style="font-weight:700;text-decoration:underline;background:none;border:none;color:var(--primary);cursor:pointer">Ingresar primero</button></p>
        </div>` : `
        <div style="background:var(--success-bg);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius-md);padding:.75rem 1rem;margin-bottom:1rem">
          <p class="text-sm" style="color:var(--success)">✓ Logueado como ${user.email}</p>
        </div>`}

        <form class="auth-form" id="join-form">
          <div class="form-group">
            <label class="form-label">Tu nombre *</label>
            <input class="form-input" id="join-name" placeholder="María López" required value="${user?.user_metadata?.full_name || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-input" id="join-email" type="email" placeholder="maria@email.com" required value="${user?.email || ''}" ${user ? 'readonly' : ''} />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono (opcional)</label>
            <input class="form-input" id="join-phone" type="tel" placeholder="+54 11 1234-5678" />
          </div>
          <button class="btn btn-primary btn-full" type="submit" id="join-btn">Registrarme</button>
        </form>
        <p class="text-muted text-sm mt-2" style="text-align:center">Al registrarte aceptás recibir comunicaciones de ${biz.name}.</p>

        <div class="hidden" id="join-success" style="text-align:center;padding:1.5rem 0">
          <div style="font-size:3rem;margin-bottom:.5rem">🎉</div>
          <h3 style="font-family:var(--font-display);margin-bottom:.5rem">¡Bienvenido!</h3>
          <p class="text-muted text-sm mb-3">Tu cuenta fue creada. Ya podés ver tu tarjeta de puntos.</p>
          <button class="btn btn-primary btn-full" id="btn-goto-portal">Ir a Mi Cuenta</button>
        </div>
      </div>
    </div>
  `

  // If not logged in, offer login redirect
  if (!user) {
    document.getElementById('join-go-login')?.addEventListener('click', () => {
      sessionStorage.setItem('loyaltyapp_join_slug', slug)
      navigate('/login')
    })
  }

  let newCustomerId = null

  document.getElementById('join-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = document.getElementById('join-btn')
    const name = document.getElementById('join-name').value.trim()
    const email = document.getElementById('join-email').value.trim()
    const phone = document.getElementById('join-phone').value.trim()

    btn.disabled = true; btn.textContent = 'Registrando...'

    // Check if freemium limit reached
    if (biz.plan === 'freemium') {
      const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', biz.id)
      if (count >= 20) {
        showToast('El negocio alcanzó el límite máximo de clientes.', 'error')
        btn.disabled = false; btn.textContent = 'Registrarme'
        return
      }
    }

    // Check if already exists by email
    const { data: existing } = await supabase.from('customers').select('id').eq('business_id', biz.id).eq('email', email).single()
    if (existing) {
      // Link user_id if logged in and not yet linked
      if (user) {
        await supabase.from('customers').update({ user_id: user.id }).eq('id', existing.id)
      }
      newCustomerId = existing.id
      showSuccess()
      return
    }

    const insertData = {
      business_id: biz.id, name, email, phone: phone || null,
      user_id: user?.id || null
    }

    const { data, error } = await supabase.from('customers').insert(insertData).select().single()

    if (error) {
      showToast('Error al registrarte: ' + error.message, 'error')
      btn.disabled = false; btn.textContent = 'Registrarme'
      return
    }
    newCustomerId = data.id
    showSuccess()
  })

  function showSuccess() {
    document.getElementById('join-form').classList.add('hidden')
    document.getElementById('join-success').classList.remove('hidden')
    document.getElementById('btn-goto-portal').onclick = () => {
      if (user) {
        navigate('/mi-cuenta')
      } else {
        // Not logged in: go to public card view
        navigate(`c/${slug}/${newCustomerId}`)
      }
    }
  }
}
