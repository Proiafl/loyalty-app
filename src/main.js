import './style.css'
import { route, startRouter, navigate } from './lib/router.js'
import { supabase, getUser, getBusiness, getCustomerProfiles } from './lib/supabase.js'
import { renderLanding } from './pages/landing.js'
import { renderAuth } from './pages/auth.js'
import { renderOnboarding } from './pages/onboarding.js'
import { renderDashboard } from './pages/dashboard.js'
import { renderClientes } from './pages/clientes.js'
import { renderRecompensas } from './pages/recompensas.js'
import { renderScanner } from './pages/scanner.js'
import { renderCanjes } from './pages/canjes.js'
import { renderNotificaciones } from './pages/notificaciones.js'
import { renderConfig } from './pages/config.js'
import { renderClientCard } from './pages/cliente/card.js'
import { renderPaymentSuccess } from './pages/payment-result.js'

import { showToast } from './lib/ui.js'

export { showToast }


// ── Auth guard for business owners
function guardedRoute(renderFn) {
  return async (params, app) => {
    const user = await getUser()
    if (!user) { navigate('/login'); return }
    const biz = await getBusiness()
    if (!biz) { navigate('/onboarding'); return }
    await renderFn(params, app, { user, biz })
  }
}

// ── Auth guard for clients
function clientGuardedRoute(renderFn) {
  return async (params, app) => {
    const user = await getUser()
    if (!user) { navigate('/login'); return }
    const profiles = await getCustomerProfiles()
    await renderFn(params, app, { user, profiles })
  }
}

// ── Public routes
route('', (_, app) => renderLanding(app))
route('/', (_, app) => renderLanding(app))
route('login', (_, app) => renderAuth(app))
route('onboarding', async (_, app) => {
  const user = await getUser()
  if (!user) { navigate('/login'); return }
  const biz = await getBusiness()
  if (biz) { navigate('/dashboard'); return }
  renderOnboarding(app, user)
})

// ── Business owner routes
route('dashboard', guardedRoute(renderDashboard))
route('clientes', guardedRoute(renderClientes))
route('recompensas', guardedRoute(renderRecompensas))
route('canjes', guardedRoute(renderCanjes))
route('scanner', guardedRoute(renderScanner))
route('notificaciones', guardedRoute(renderNotificaciones))
route('config', guardedRoute(renderConfig))

// ── Client portal route
route('mi-cuenta', clientGuardedRoute(async (params, app, ctx) => {
  const { renderClientDashboard } = await import('./pages/cliente/client-dashboard.js')
  renderClientDashboard(params, app, ctx)
}))

// ── Public client routes
route('c/:slug/:customerId', (params, app) => renderClientCard(params, app))
route('join/:slug', async (params, app) => {
  const { renderJoin } = await import('./pages/cliente/join.js')
  renderJoin(params, app)
})

// ── Payment result routes (MercadoPago callbacks)
route('pago-exitoso', (params, app) => renderPaymentSuccess(params, app))
route('pago-pendiente', (params, app) => renderPaymentSuccess(params, app))
route('pago-error', (params, app) => renderPaymentSuccess(params, app))

// Auth listener
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.hash = '/'
})

startRouter()
