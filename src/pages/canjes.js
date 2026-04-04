import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

export async function renderCanjes(_, app, { biz }) {

  // Initial skeleton render so the shell is ready
  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'canjes')}
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">🎟️ Canjes</h1>
            <p class="page-subtitle">Recompensas reclamadas por tus clientes</p>
          </div>
        </div>
        <div id="canjes-container">
          <p class="text-muted text-sm">Cargando...</p>
        </div>
      </main>
    </div>
  `

  // Fetch redemptions — left join on reward (may be null if token-based)
  const { data, error } = await supabase
    .from('point_transactions')
    .select(`
      id,
      points,
      type,
      created_at,
      note,
      customer:customers ( id, name ),
      reward:rewards ( id, name, icon )
    `)
    .eq('business_id', biz.id)
    .eq('type', 'redeem')
    .order('created_at', { ascending: false })

  const container = document.getElementById('canjes-container')
  if (!container) return

  if (error) {
    console.error('[Canjes] Error fetching:', error)
    container.innerHTML = `<p class="text-muted">Error al cargar los canjes: ${error.message}</p>`
    return
  }

  const redemptions = data || []

  if (redemptions.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:4rem 2rem">
        <div style="font-size:3rem;margin-bottom:1rem">🎟️</div>
        <h3 style="margin-bottom:.5rem">Sin canjes todavía</h3>
        <p class="text-muted text-sm">Cuando tus clientes canjeen premios, aparecerán aquí.</p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.75rem">
      ${redemptions.map(r => `
        <div class="card canje-card" style="padding:1rem 1.25rem">
          <div class="canje-row">
            <div class="flex items-center gap-2">
              <div class="avatar avatar-sm" style="flex-shrink:0">${r.customer?.name?.[0]?.toUpperCase() || '?'}</div>
              <div>
                <div style="font-weight:700;font-size:.9rem">${r.customer?.name || 'Cliente'}</div>
                <div class="text-xs text-muted">${new Date(r.created_at).toLocaleDateString('es-AR')} · ${new Date(r.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:1.1rem">${r.reward?.icon || '🎁'} <strong>${r.reward?.name || 'Premio'}</strong></div>
              <div style="font-size:.8rem;color:var(--error);font-weight:600">${r.points} pts</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="margin-top:1rem;text-align:center">
      <p class="text-xs text-muted">${redemptions.length} canje${redemptions.length !== 1 ? 's' : ''} registrado${redemptions.length !== 1 ? 's' : ''}</p>
    </div>
  `
}
