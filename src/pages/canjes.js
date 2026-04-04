import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

export async function renderCanjes(_, app, { biz }) {
  let redemptions = []

  async function loadRedemptions() {
    const { data, error } = await supabase
      .from('point_transactions')
      .select(`
        *,
        customer:customers(id, name, avatar_url),
        reward:rewards(id, name, icon)
      `)
      .eq('business_id', biz.id)
      .eq('type', 'redeem')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching redemptions:', error)
      showToast('Error al cargar canjes', 'error')
      return
    }
    redemptions = data || []
    render()
  }

  async function markAsDelivered(id) {
    // Optional: We could have a 'status' in point_transactions or just a note.
    // For now, let's keep it simple as a log.
    showToast('Canje verificado localmente')
  }

  function render() {
    app.innerHTML = `
      <div class="app-shell">
        ${renderNav(biz, 'canjes')}
        <main class="main-content">
          <div class="page-header">
            <h1 class="page-title">Canjes de Premios</h1>
            <p class="text-muted">Lista de recompensas solicitadas por tus clientes.</p>
          </div>

          <div class="card">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Premio</th>
                    <th>Puntos</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${redemptions.length > 0 ? redemptions.map(r => `
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="avatar avatar-sm">${r.customer?.name?.[0] || '?'}</div>
                          <div>
                            <div style="font-weight:600">${r.customer?.name || 'Cliente'}</div>
                            <div class="text-xs text-muted">ID: ${r.customer?.id.slice(0,8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <span>${r.reward?.icon || '🎁'}</span>
                          <span>${r.reward?.name || 'Recompensa eliminada'}</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge" style="background:rgba(239,68,68,0.1);color:rgb(239,68,68)">
                          ${r.points} pts
                        </span>
                      </td>
                      <td class="text-sm">
                        ${new Date(r.created_at).toLocaleDateString('es-AR')} 
                        <br/>
                        <span class="text-xs text-muted">${new Date(r.created_at).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}</span>
                      </td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-verify" data-id="${r.id}">Verificar</button>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="5" style="text-align:center;padding:3rem">
                        <div style="font-size:2.5rem;margin-bottom:1rem">🎟️</div>
                        <p class="text-muted">No hay canjes registrados aún.</p>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `

    document.querySelectorAll('.btn-verify').forEach(btn => {
      btn.onclick = () => markAsDelivered(btn.dataset.id)
    })
  }

  loadRedemptions()
}
