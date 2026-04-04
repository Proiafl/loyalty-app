/**
 * LoyaltyApp — SPA Router (hash-based)
 * Routes: #/ #/login #/onboarding #/dashboard #/clientes #/recompensas
 *         #/scanner #/notificaciones #/config #/join/:slug #/c/:slug/:id
 */

const routes = {}

export function route(path, handler) {
  routes[path] = handler
}

function matchRoute(hash) {
  const clean = (hash || '').replace(/^#\/?/, '') || ''

  // Exact match
  if (routes[clean] !== undefined) return { handler: routes[clean], params: {} }
  if (clean === '' && routes['/'] !== undefined) return { handler: routes['/'], params: {} }

  // Parametric match (e.g. "join/:slug" or "c/:slug/:id")
  for (const [pattern, handler] of Object.entries(routes)) {
    const parts = pattern.split('/')
    const segments = clean.split('/')
    if (parts.length !== segments.length) continue
    const params = {}
    let match = true
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        params[parts[i].slice(1)] = segments[i]
      } else if (parts[i] !== segments[i]) {
        match = false
        break
      }
    }
    if (match) return { handler, params }
  }
  return null
}

export function navigate(path) {
  window.location.hash = path
}

export function startRouter() {
  const dispatch = () => {
    const result = matchRoute(window.location.hash)
    const app = document.getElementById('app')
    if (result) {
      result.handler(result.params, app)
    } else {
      app.innerHTML = `<div class="not-found"><h1>404</h1><p>Página no encontrada.</p><a href="#/">Inicio</a></div>`
    }
  }
  window.addEventListener('hashchange', dispatch)
  dispatch()
}
