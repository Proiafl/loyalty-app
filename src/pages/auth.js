import { supabase, getUser, getBusiness, getCustomerProfiles } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../main.js'

export function renderAuth(app) {
  // Si hay intent pro en sessionStorage, mostrar formulario de registro directamente
  const hasProIntent = sessionStorage.getItem('loyaltyapp_intent_pro') === 'true'
  let isLogin = !hasProIntent

  function render() {
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-box">
          <div class="auth-logo">
            <div class="auth-logo-icon">L</div>
            <div class="auth-title">${isLogin ? 'Bienvenido de vuelta' : 'Crear mi cuenta'}</div>
            <div class="auth-subtitle">${isLogin ? 'Ingresá a tu panel' : 'Empezá a usar LoyaltyApp hoy'}</div>
          </div>
          <form class="auth-form" id="auth-form">
            ${!isLogin ? `
            <div class="form-group">
              <label class="form-label">Tu nombre</label>
              <input class="form-input" id="auth-name" type="text" placeholder="Juan Pérez" required />
            </div>` : ''}
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="auth-email" type="email" placeholder="hola@minegocio.com" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input class="form-input" id="auth-pass" type="password" placeholder="Mínimo 8 caracteres" required minlength="8" />
            </div>
            <button class="btn btn-primary btn-full" type="submit" id="auth-submit">
              ${isLogin ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
          <p class="auth-toggle">
            ${isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            <button id="auth-toggle-btn">${isLogin ? 'Registrate gratis' : 'Ingresar'}</button>
          </p>
          <div style="text-align:center;margin-top:1rem">
            <a href="#/" style="font-size:.8rem;color:var(--on-surface-muted)">← Volver al inicio</a>
          </div>
        </div>
      </div>
    `

    document.getElementById('auth-toggle-btn').addEventListener('click', () => {
      isLogin = !isLogin
      render()
    })

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const btn = document.getElementById('auth-submit')
      btn.disabled = true
      btn.textContent = isLogin ? 'Ingresando...' : 'Creando cuenta...'

      const email = document.getElementById('auth-email').value.trim()
      const pass = document.getElementById('auth-pass').value

      try {
        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
          if (error) throw error
          await redirectByRole(false)
        } else {
          const name = document.getElementById('auth-name').value.trim()
          const { error } = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { full_name: name } }
          })
          if (error) throw error
          showToast('¡Cuenta creada! Revisá tu email.')
          // After signup, try to redirect as a new business sign-up sequence
          await redirectByRole(true)
        }
      } catch (err) {
        showToast(err.message || 'Error al autenticar', 'error')
        btn.disabled = false
        btn.textContent = isLogin ? 'Ingresar' : 'Crear cuenta'
      }
    })
  }

  render()
}

/**
 * Determines the user role and redirects accordingly:
 * - Has a business → owner dashboard
 * - If isNewSignup is true → onboarding
 * - Has customer profiles and not a new signup → client portal
 * - Neither → onboarding (new business owner)
 */
async function redirectByRole(isNewSignup = false) {
  // Check if there's a pending join redirect
  const pendingJoin = sessionStorage.getItem('loyaltyapp_join_slug')
  if (pendingJoin) {
    sessionStorage.removeItem('loyaltyapp_join_slug')
    navigate(`/join/${pendingJoin}`)
    return
  }

  // Check if business owner
  const biz = await getBusiness()
  if (biz) {
    navigate('/dashboard')
    return
  }

  // Check if client of any business (only if it's an existing login)
  if (!isNewSignup) {
    const profiles = await getCustomerProfiles()
    if (profiles && profiles.length > 0) {
      navigate('/mi-cuenta')
      return
    }
  }

  // New user with no role yet or intentionally registering as business → onboarding
  navigate('/onboarding')
}
