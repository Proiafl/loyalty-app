import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

export async function renderClientes(_, app, { biz }) {
  let customers = []
  let searchTerm = ''

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', biz.id)
      .order('points', { ascending: false })
    if (!error) customers = data || []
  }

  function filteredCustomers() {
    if (!searchTerm) return customers
    const q = searchTerm.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q))
  }

  async function renderTable() {
    const list = filteredCustomers()
    const tbody = document.getElementById('customers-tbody')
    if (!tbody) return
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--on-surface-muted)">No se encontraron clientes.</td></tr>`
      return
    }
    tbody.innerHTML = list.map(c => {
      const maxPts = biz.points_per_visit * 10 || 100
      const pct = Math.min(100, Math.round((c.points / (biz.min_reward_pts || 100)) * 100))
      const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      return `<tr>
        <td><div class="flex items-center gap-2"><div class="avatar">${initials}</div>${c.name}</div></td>
        <td><strong style="color:var(--primary)">${c.points}</strong></td>
        <td><div class="prog-wrap" style="width:80px"><div class="prog-fill" style="width:${pct}%"></div></div></td>
        <td>${c.total_visits}</td>
        <td><span class="badge badge-${c.status}">${c.status === 'active' ? 'Activo' : c.status === 'new' ? 'Nuevo' : 'Inactivo'}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm btn-add-pts" data-id="${c.id}" data-name="${c.name}">+pts</button>
        </td>
      </tr>`
    }).join('')

    document.querySelectorAll('.btn-add-pts').forEach(btn => {
      btn.onclick = () => showAddPointsModal(btn.dataset.id, btn.dataset.name)
    })
  }

  function showAddModal() {
    const modal = document.getElementById('add-customer-modal')
    modal.classList.remove('hidden')
    document.getElementById('modal-name').focus()
  }

  function hideAddModal() {
    document.getElementById('add-customer-modal').classList.add('hidden')
    document.getElementById('modal-name').value = ''
    document.getElementById('modal-email').value = ''
    document.getElementById('modal-phone').value = ''
  }

  function showAddPointsModal(customerId, name) {
    const modal = document.getElementById('add-pts-modal')
    modal.dataset.customerId = customerId
    document.getElementById('pts-modal-title').textContent = `Agregar puntos a ${name}`
    modal.classList.remove('hidden')
  }

  await loadCustomers()

  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'clientes')}
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Clientes</h1>
            <div class="page-subtitle">${customers.length} clientes registrados</div>
          </div>
          <div class="flex gap-2">
            <input class="form-input" id="search-customers" placeholder="Buscar por nombre, email..." style="width:220px" />
            <button class="btn btn-secondary" id="btn-export-csv" ${biz.plan === 'freemium' ? 'disabled title="Requiere Plan Pro"' : ''}>📥 Exportar (Pro)</button>
            <button class="btn btn-primary" id="btn-add-customer">+ Agregar cliente</button>
          </div>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th><th>Puntos</th><th>Progreso</th><th>Visitas</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody id="customers-tbody"></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Add Customer Modal -->
    <div class="modal-bg hidden" id="add-customer-modal">
      <div class="modal">
        <div class="modal-title">➕ Nuevo cliente</div>
        <div class="auth-form">
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input class="form-input" id="modal-name" placeholder="María López" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="modal-email" type="email" placeholder="maria@email.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input class="form-input" id="modal-phone" type="tel" placeholder="+54 11 1234-5678" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="btn-cancel-add">Cancelar</button>
          <button class="btn btn-primary" id="btn-confirm-add">Agregar</button>
        </div>
      </div>
    </div>

    <!-- Add Points Modal -->
    <div class="modal-bg hidden" id="add-pts-modal">
      <div class="modal">
        <div class="modal-title" id="pts-modal-title">Agregar puntos</div>
        <div class="form-group">
          <label class="form-label">Puntos a agregar</label>
          <input class="form-input" id="pts-amount" type="number" min="1" value="${biz.points_per_visit || 10}" />
        </div>
        <div class="form-group mt-2">
          <label class="form-label">Nota (opcional)</label>
          <input class="form-input" id="pts-note" placeholder="Ej: visita del día" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="btn-cancel-pts">Cancelar</button>
          <button class="btn btn-primary" id="btn-confirm-pts">Confirmar</button>
        </div>
      </div>
    </div>
  `

  renderTable()

  document.getElementById('search-customers').addEventListener('input', e => {
    searchTerm = e.target.value
    renderTable()
  })

  document.getElementById('btn-add-customer').onclick = showAddModal
  document.getElementById('btn-cancel-add').onclick = hideAddModal

  const btnExport = document.getElementById('btn-export-csv')
  if (btnExport) {
    btnExport.onclick = () => {
      if (biz.plan === 'freemium') {
        showToast('Esta función requiere Plan Pro', 'error')
        return
      }
      const headers = ['Nombre', 'Email', 'Teléfono', 'Puntos', 'Visitas', 'Estado', 'Última Visita']
      const rows = customers.map(c => [
        c.name, c.email || '', c.phone || '', c.points, c.total_visits,
        c.status, c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : ''
      ])
      const csvContent = [headers.join(','), ...rows.map(e => e.map(f => '"' + String(f).replace(/"/g, '""') + '"').join(','))].join('\\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `clientes_${biz.slug}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  document.getElementById('btn-confirm-add').onclick = async () => {
    const name = document.getElementById('modal-name').value.trim()
    const email = document.getElementById('modal-email').value.trim()
    const phone = document.getElementById('modal-phone').value.trim()
    if (!name) { showToast('Ingresá el nombre'); return }

    if (biz.plan === 'freemium') {
      const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', biz.id)
      if (count >= 20) {
        showToast('🔓 Límite de 20 clientes alcanzado en plan Freemium. Actualizá al plan Pro.', 'error')
        hideAddModal()
        return
      }
    }

    const btn = document.getElementById('btn-confirm-add')
    btn.disabled = true; btn.textContent = 'Guardando...'

    const { error } = await supabase.from('customers').insert({
      business_id: biz.id, name, email: email || null, phone: phone || null
    })
    if (error) {
      showToast(error.message.includes('unique') ? 'Ya existe un cliente con ese email' : 'Error al agregar')
    } else {
      showToast(`✓ ${name} agregado`)
      await loadCustomers()
      renderTable()
      hideAddModal()
    }
    btn.disabled = false; btn.textContent = 'Agregar'
  }

  document.getElementById('btn-cancel-pts').onclick = () => document.getElementById('add-pts-modal').classList.add('hidden')
  document.getElementById('btn-confirm-pts').onclick = async () => {
    const modal = document.getElementById('add-pts-modal')
    const customerId = modal.dataset.customerId
    const pts = parseInt(document.getElementById('pts-amount').value) || 0
    const note = document.getElementById('pts-note').value.trim()
    if (pts < 1) { showToast('Ingresá una cantidad válida'); return }

    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    const { error } = await supabase.from('customers').update({
      points: customer.points + pts,
      total_visits: customer.total_visits + 1,
      last_visit_at: new Date().toISOString(),
      status: 'active'
    }).eq('id', customerId)

    if (!error) {
      await supabase.from('point_transactions').insert({
        business_id: biz.id, customer_id: customerId,
        type: 'manual_add', points: pts, note: note || null
      })
      showToast(`✓ +${pts} puntos a ${customer.name}`)
      await loadCustomers()
      renderTable()
      modal.classList.add('hidden')
    } else {
      showToast('Error al agregar puntos')
    }
  }
}
