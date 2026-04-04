import { navigate } from '../lib/router.js'

export function renderLanding(app) {
  app.innerHTML = `
    <div class="landing">
      <!-- NAVBAR -->
      <nav class="landing-nav">
        <div class="container">
          <div class="landing-nav-brand">
            <div class="landing-nav-logo">L</div>
            <span class="landing-nav-name">LoyaltyApp</span>
          </div>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-sm" id="nav-login">Ingresar</button>
            <button class="btn btn-primary btn-sm" id="nav-start">Comenzar gratis</button>
          </div>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <div class="container" style="position:relative;z-index:1">
          <div class="hero-tag">🚀 Para negocios que quieren crecer</div>
          <h1>Fidelizá clientes,<br><span class="highlight">aumentá visitas</span></h1>
          <p>El sistema de puntos QR para tu negocio. Sin apps que instalar, sin complicaciones. Funciona para bares, peluquerías, lavaderos y más.</p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" id="hero-start">
              Empezar gratis — 0 costo
            </button>
            <button class="btn btn-lg" id="hero-demo" style="border:1px solid var(--surface-border);color:var(--on-surface)">Ver demo ▶</button>
          </div>
        </div>
      </section>

      <!-- SOCIAL PROOF -->
      <div class="social-proof">
        <div class="text-center" style="margin-bottom:1rem">
          <p class="text-muted text-sm">Pensado para:</p>
        </div>
        <div class="social-proof-grid">
          ${['💈 Peluquerías','☕ Bares y Cafés','🚿 Lavaderos','💅 Spa y Estética','🍕 Comida','💪 Gimnasios'].map(n =>
            `<span style="font-size:.875rem;font-weight:600;color:var(--on-surface-muted)">${n}</span>`
          ).join('')}
        </div>
      </div>

      <!-- HOW IT WORKS -->
      <section class="features">
        <div class="container">
          <div class="text-center">
            <div class="section-label">Cómo funciona</div>
            <h2 class="section-title">Tan simple como 1, 2, 3</h2>
          </div>
          <div class="features-grid mt-4">
            ${[
              { icon: '🏪', color: 'amber', title: 'Configurá tu negocio', desc: 'Registrate, elegí tus recompensas y listo. En menos de 5 minutos tenés tu programa activo.' },
              { icon: '📱', color: 'sky', title: 'El cliente muestra su QR', desc: 'Cada cliente tiene su tarjeta digital con un QR único y seguro. Nada que instalar.' },
              { icon: '⭐', color: 'green', title: 'Sumás puntos automático', desc: 'Escaneás el QR, se suman puntos y el cliente recibe su recompensa cuando alcanza el límite.' },
            ].map(f => `
              <div class="feature-card">
                <div class="feature-icon ${f.color}">${f.icon}</div>
                <div class="feature-title">${f.title}</div>
                <p class="feature-desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="features" style="border-top:1px solid var(--surface-border)">
        <div class="container">
          <div class="text-center">
            <div class="section-label">Funcionalidades</div>
            <h2 class="section-title">Todo lo que necesitás</h2>
            <p class="section-desc text-muted text-center" style="margin:0 auto">No te falta ni te sobra. El justo equilibrio para fidelizar sin complicar.</p>
          </div>
          <div class="features-grid mt-4">
            ${[
              { icon: '📊', color: 'amber', title: 'Dashboard en tiempo real', desc: 'Visitas, puntos en circulación, clientes activos y más. Todo en un vistazo.' },
              { icon: '🔐', color: 'sky', title: 'QR dinámico anti-fraude', desc: 'Cada QR expira en 90 segundos y solo puede usarse una vez. Completamente seguro.' },
              { icon: '🎁', color: 'green', title: 'Recompensas personalizables', desc: 'Definís vos los premios. Corte gratis, café, descuentos, lo que quieras.' },
              { icon: '📣', color: 'amber', title: 'Notificaciones por segmento', desc: 'Mandá mensajes a clientes inactivos, o a los que están cerca de canjear.' },
              { icon: '👥', color: 'sky', title: 'Gestión de clientes', desc: 'Agregás clientes manualmente o ellos mismos se registran con tu link.' },
              { icon: '📈', color: 'green', title: 'Analytics básicos', desc: 'Retention rate, top clientes, recompensas más canjeadas y más.' },
            ].map(f => `
              <div class="feature-card">
                <div class="feature-icon ${f.color}">${f.icon}</div>
                <div class="feature-title">${f.title}</div>
                <p class="feature-desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- PLANS -->
      <section class="plans" style="border-top:1px solid var(--surface-border)">
        <div class="container">
          <div class="text-center">
            <div class="section-label">Precios</div>
            <h2 class="section-title">Sin sorpresas</h2>
          </div>
          <div class="plans-grid">
            <!-- Freemium -->
            <div class="plan-card">
              <div class="plan-name">Freemium</div>
              <div class="plan-price">$0 <span>/mes</span></div>
              <p class="plan-desc">Ideal para probar y arrancar</p>
              <ul class="plan-features">
                <li>Hasta 20 clientes</li>
                <li>2 recompensas activas</li>
                <li>QR dinámico anti-fraude</li>
                <li>Dashboard básico</li>
                <li class="disabled">Analytics Avanzado</li>
                <li class="disabled">Notificaciones</li>
                <li class="disabled">Exportar datos</li>
              </ul>
              <button class="btn btn-secondary btn-full" id="plan-free">Empezar gratis</button>
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
                <li>Dashboard + Analytics Avanzado</li>
                <li>Notificaciones WhatsApp/Email</li>
                <li>Exportar datos (CSV)</li>
              </ul>
              <button class="btn btn-primary btn-full" id="plan-pro">Suscribirme — Pro</button>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="container" style="position:relative;z-index:1">
          <h2>¿Listo para retener más clientes?</h2>
          <p>Configura tu negocio en menos de 5 minutos. Sin tarjeta de crédito.</p>
          <button class="btn btn-lg" id="cta-start" style="background:var(--bg);color:var(--primary);font-weight:700">
            Crear mi cuenta gratis
          </button>
        </div>
      </section>

      <!-- FOOTER -->
      <footer style="background:var(--bg-elevated);border-top:1px solid var(--surface-border);color:var(--on-surface-muted);padding:2rem 1.5rem;text-align:center;font-size:.8rem">
        <p style="font-family:var(--font-display);font-weight:700;color:var(--primary);margin-bottom:.5rem">LoyaltyApp</p>
        <p>© ${new Date().getFullYear()} LoyaltyApp. Sistema de fidelización para negocios.</p>
      </footer>
    </div>
  `

  // Wire navigation
  const go = (id, path) => document.getElementById(id)?.addEventListener('click', () => navigate(path))
  go('nav-login', '/login')
  go('nav-start', '/login')
  go('hero-start', '/login')
  go('plan-free', '/login')
  go('plan-pro', '/login')
  go('cta-start', '/login')
}
