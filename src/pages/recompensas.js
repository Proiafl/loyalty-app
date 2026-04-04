import { supabase } from '../lib/supabase.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../main.js'

export async function renderRecompensas(_, app, { biz }) {
  let rewards = []

  async function load() {
    const { data } = await supabase.from('rewards').select('*').eq('business_id', biz.id).order('points_required')
    rewards = data || []
  }

  function renderCards() {
    const el = document.getElementById('rewards-grid')
    if (!el) return
    const maxFree = 2
    const isFreemium = biz.plan === 'freemium'
    el.innerHTML = rewards.map(r => `
      <div class="reward-card">
        <div class="reward-icon">${r.icon || '🎁'}</div>
        <div class="reward-name">${r.name}</div>
        <div class="reward-pts">${r.points_required} puntos</div>
        <div class="reward-stats">${r.total_redeemed} canjes totales</div>
        <div class="flex gap-1 mt-2">
          <button class="btn btn-secondary btn-sm btn-edit-reward" data-id="${r.id}">✏️ Editar</button>
          <button class="btn btn-danger btn-sm btn-del-reward" data-id="${r.id}">🗑️</button>
        </div>
      </div>
    `).join('') + `
      <div class="reward-card reward-card-add" id="btn-add-reward" ${isFreemium && rewards.length >= maxFree ? 'data-locked="true"' : ''}>
        <div class="add-plus">+</div>
        <div style="font-size:.8rem">${isFreemium && rewards.length >= maxFree ? '🔒 Plan Pro' : 'Nueva recompensa'}</div>
      </div>
    `

    document.getElementById('btn-add-reward').onclick = () => {
      if (isFreemium && rewards.length >= maxFree) {
        showToast('🔒 Necesitás el plan Pro para más recompensas')
        return
      }
      showRewardModal()
    }

    document.querySelectorAll('.btn-edit-reward').forEach(btn => {
      btn.onclick = () => showRewardModal(rewards.find(r => r.id === btn.dataset.id))
    })

    document.querySelectorAll('.btn-del-reward').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminár esta recompensa?')) return
        await supabase.from('rewards').delete().eq('id', btn.dataset.id)
        showToast('Recompensa eliminada')
        await load(); renderCards()
      }
    })
  }

  function showRewardModal(existing = null) {
    const modal = document.getElementById('reward-modal')
    document.getElementById('rm-title').textContent = existing ? 'Editar recompensa' : 'Nueva recompensa'
    document.getElementById('rm-name').value = existing?.name || ''
    document.getElementById('rm-pts').value = existing?.points_required || 100
    document.getElementById('rm-icon').value = existing?.icon || '🎁'
    document.getElementById('rm-desc').value = existing?.description || ''
    modal.dataset.editId = existing?.id || ''
    modal.classList.remove('hidden')
    document.getElementById('rm-name').focus()
  }

  function hideModal() {
    document.getElementById('reward-modal').classList.add('hidden')
  }

  await load()

  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'recompensas')}
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Recompensas</h1>
            <div class="page-subtitle">${rewards.length} recompensas configuradas</div>
          </div>
        </div>
        <div id="rewards-grid" class="reward-grid"></div>
      </main>
    </div>

    <!-- Reward Modal -->
    <div class="modal-bg hidden" id="reward-modal">
      <div class="modal">
        <div class="modal-title" id="rm-title">Nueva recompensa</div>
        <div class="auth-form">
          <div class="form-group">
            <label class="form-label">Emoji / Ícono</label>
            <input class="form-input" id="rm-icon" maxlength="4" style="font-size:1.5rem;text-align:center;width:80px" />
          </div>
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input class="form-input" id="rm-name" placeholder="Ej: Corte gratis" />
          </div>
          <div class="form-group">
            <label class="form-label">Puntos necesarios *</label>
            <input class="form-input" id="rm-pts" type="number" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción (opcional)</label>
            <input class="form-input" id="rm-desc" placeholder="Ej: Válido de lunes a viernes" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="btn-rm-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-rm-save">Guardar</button>
        </div>
      </div>
    </div>
  `

  renderCards()

  document.getElementById('btn-rm-cancel').onclick = hideModal
  document.getElementById('btn-rm-save').onclick = async () => {
    const modal = document.getElementById('reward-modal')
    const name = document.getElementById('rm-name').value.trim()
    const pts = parseInt(document.getElementById('rm-pts').value) || 0
    const icon = document.getElementById('rm-icon').value.trim() || '🎁'
    const desc = document.getElementById('rm-desc').value.trim()
    if (!name || pts < 1) { showToast('Completá los campos requeridos'); return }

    const btn = document.getElementById('btn-rm-save')
    btn.disabled = true; btn.textContent = 'Guardando...'

    const editId = modal.dataset.editId
    let error
    if (editId) {
      ({ error } = await supabase.from('rewards').update({ name, points_required: pts, icon, description: desc || null }).eq('id', editId))
    } else {
      ({ error } = await supabase.from('rewards').insert({ business_id: biz.id, name, points_required: pts, icon, description: desc || null }))
    }

    if (error) { showToast('Error al guardar'); } else {
      showToast(editId ? 'Recompensa actualizada ✓' : 'Recompensa creada ✓')
      await load(); renderCards(); hideModal()
    }
    btn.disabled = false; btn.textContent = 'Guardar'
  }
}
