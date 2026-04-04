import { supabase, getUser } from '../../lib/supabase.js'
import { navigate } from '../../lib/router.js'
import { createQRToken } from '../../lib/qr.js'
import { showToast } from '../../main.js'
import QRCode from 'qrcode'

export async function renderClientDashboard(_, app, { user, profiles }) {
  if (!profiles || profiles.length === 0) {
    app.innerHTML = `
      <div class="client-portal">
        <div class="client-portal-header">
          <div class="client-portal-user">
            <div>
              <div class="client-portal-greeting">Hola, ${user.user_metadata?.full_name || 'bienvenido'}</div>
              <div class="client-portal-user-name">Mi Cuenta</div>
            </div>
            <button class="btn btn-sm" id="cp-logout" style="color:var(--bg);border:1px solid rgba(0,0,0,.2)">Salir</button>
          </div>
        </div>
        <div style="padding:3rem 1.5rem;text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">🏪</div>
          <h3 style="margin-bottom:.5rem">Aún no estás en ningún negocio</h3>
          <p class="text-muted text-sm">Pedile a tu negocio favorito su link de registro para empezar a acumular puntos.</p>
        </div>
      </div>
    `
    document.getElementById('cp-logout').onclick = async () => {
      await supabase.auth.signOut()
      navigate('/')
    }
    return
  }

  let activeIdx = 0

  async function render() {
    const profile = profiles[activeIdx]
    const biz = profile.business

    // Load rewards for this business
    const { data: rewards } = await supabase
      .from('rewards').select('*')
      .eq('business_id', biz.id).eq('active', true)
      .order('points_required')
    const rewardsList = rewards || []

    // Load recent transactions
    const { data: history } = await supabase
      .from('point_transactions').select('*')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false }).limit(5)

    const nextReward = rewardsList.find(r => r.points_required > profile.points)
    const pct = nextReward ? Math.min(100, Math.round((profile.points / nextReward.points_required) * 100)) : 100

    app.innerHTML = `
      <div class="client-portal" style="padding-bottom: 5.5rem">
        <!-- Header -->
        <div class="client-portal-header">
          <div class="client-portal-user">
            <div>
              <div class="client-portal-greeting">Hola, ${profile.name} 👋</div>
              <div class="client-portal-user-name">Mi Cuenta</div>
            </div>
            <button class="btn btn-sm" id="cp-logout" style="color:var(--bg);border:1px solid rgba(0,0,0,.2)">Salir</button>
          </div>
        </div>

        <!-- Business Tabs (if multi) -->
        ${profiles.length > 1 ? `
        <div class="biz-tabs" style="margin-top:.75rem">
          ${profiles.map((p, i) => `
            <button class="biz-tab ${i === activeIdx ? 'active' : ''}" data-idx="${i}">
              ${p.business.name}
            </button>
          `).join('')}
        </div>` : ''}

        <!-- Points Hero -->
        <div class="points-hero" style="${profiles.length <= 1 ? 'margin-top:1.5rem' : ''}">
          <div style="font-size:.8rem;color:var(--on-surface-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem">${biz.name}</div>
          <div class="points-hero-value" id="cp-points">${profile.points}</div>
          <div class="points-hero-label">puntos acumulados</div>
          <div style="margin-top:1rem">
            <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="points-hero-next">${nextReward ? `${nextReward.points_required - profile.points} puntos para "${nextReward.name}"` : '¡Tenés puntos para canjear! 🎉'}</div>
        </div>

        <!-- QR Section -->
        <div class="portal-section">
          <div class="portal-section-title">Tu QR</div>
          <div class="card" style="text-align:center">
            <p class="text-muted text-sm" style="margin-bottom:.75rem">Mostrá este QR al negocio para sumar puntos</p>
            <div class="qr-box" style="display:inline-flex;margin:0 auto">
              <canvas id="cp-qr-canvas"></canvas>
              <div class="qr-expired-overlay hidden" id="cp-qr-overlay">
                <div style="font-size:2rem">↺</div>
                <p style="font-weight:600;font-size:.9rem">QR expirado</p>
                <button class="btn btn-primary btn-sm" id="cp-btn-renew">Renovar QR</button>
              </div>
            </div>
            <div class="qr-timer" style="margin-top:.5rem">Expira en <span id="cp-qr-countdown">90</span>s</div>
          </div>
        </div>

        <!-- Rewards -->
        <div class="portal-section">
          <div class="portal-section-title">Recompensas</div>
          ${rewardsList.length > 0 ? rewardsList.map(r => {
            const canRedeem = profile.points >= r.points_required
            return `
            <div class="client-reward-item">
              <div class="cr-icon">${r.icon || '🎁'}</div>
              <div>
                <div class="cr-name">${r.name}</div>
                <div class="cr-pts">${r.points_required} puntos</div>
              </div>
              <button class="btn btn-sm cr-btn ${canRedeem ? 'btn-primary' : 'btn-ghost'}"
                ${canRedeem ? `data-reward-id="${r.id}" data-reward-pts="${r.points_required}" data-reward-name="${r.name}"` : 'disabled'}>
                ${canRedeem ? '¡Canjear!' : `${r.points_required - profile.points} más`}
              </button>
            </div>`
          }).join('') : '<p class="text-muted text-sm" style="padding:0 0 1rem">Este negocio aún no tiene recompensas.</p>'}
        </div>

        <!-- Recent Activity -->
        <div class="portal-section">
          <div class="portal-section-title">Últimas visitas</div>
          <div class="card">
            ${(history || []).length > 0 ? (history || []).map(tx => `
              <div class="log-item">
                <div class="log-icon ${tx.type === 'redeem' ? 'err' : 'ok'}">${tx.type === 'redeem' ? '🎁' : '⭐'}</div>
                <div class="log-detail">${tx.type === 'redeem' ? `Canjeó ${Math.abs(tx.points)} pts` : `+${tx.points} puntos`}</div>
                <div class="log-time">${new Date(tx.created_at).toLocaleDateString('es-AR')}</div>
              </div>
            `).join('') : '<p class="text-muted text-sm">Sin visitas aún.</p>'}
          </div>
        </div>

        <button class="fab-btn" id="fab-show-qr" title="Mostrar QR">
          <span style="font-size: 1.5rem">📱</span>
        </button>
      </div>
    `

    // ── Wire up tabs
    document.querySelectorAll('.biz-tab').forEach(tab => {
      tab.onclick = () => {
        activeIdx = parseInt(tab.dataset.idx)
        render()
      }
    })

    // ── Wire logout
    document.getElementById('cp-logout').onclick = async () => {
      await supabase.auth.signOut()
      navigate('/')
    }

    // ── Wire redeem buttons
    document.querySelectorAll('.cr-btn[data-reward-id]').forEach(btn => {
      btn.onclick = async () => {
        const pts = parseInt(btn.dataset.rewardPts)
        const name = btn.dataset.rewardName
        if (!confirm(`¿Canjear "${name}" por ${pts} puntos?`)) return

        // 1. Disable immediately to prevent double-tap
        btn.disabled = true
        btn.textContent = 'Canjeando...'

        // 2. Re-fetch FRESH points from DB to prevent race conditions
        const { data: freshCustomer, error: fetchErr } = await supabase
          .from('customers')
          .select('points')
          .eq('id', profile.id)
          .single()

        if (fetchErr || !freshCustomer) {
          showToast('Error al verificar puntos. Intentá de nuevo.', 'error')
          btn.disabled = false
          btn.textContent = '¡Canjear!'
          return
        }

        // 3. Validate fresh points are still sufficient
        if (freshCustomer.points < pts) {
          showToast('No tenés suficientes puntos para este canje.', 'error')
          btn.disabled = false
          btn.textContent = `${pts - freshCustomer.points} más`
          return
        }

        // 4. Deduct using the fresh value (not stale cache)
        const newPoints = freshCustomer.points - pts
        const { error: updateErr } = await supabase
          .from('customers')
          .update({ points: newPoints })
          .eq('id', profile.id)

        if (updateErr) {
          showToast('Error al canjear. Intentá de nuevo.', 'error')
          btn.disabled = false
          btn.textContent = '¡Canjear!'
          return
        }

        // 5. Log the transaction
        await supabase.from('point_transactions').insert({
          business_id: biz.id,
          customer_id: profile.id,
          type: 'redeem',
          points: -pts,
          reward_id: btn.dataset.rewardId
        })

        // 6. Refresh local profile from DB and re-render
        const { data: updated } = await supabase
          .from('customers')
          .select('*, business:businesses(id, name, slug, type, logo_url, points_per_visit, qr_ttl_seconds)')
          .eq('id', profile.id)
          .single()
        if (updated) profiles[activeIdx] = updated
        showToast(`¡Canjeaste "${name}"! 🎁`)
        render()
      }
    })

    // ── QR Generation
    const qrTtl = biz.qr_ttl_seconds || 90
    let seconds = qrTtl
    let interval = null

    async function generateQR() {
      const token = await createQRToken(biz.id, profile.id, qrTtl)
      const canvas = document.getElementById('cp-qr-canvas')
      if (!canvas) return
      if (token) {
        await QRCode.toCanvas(canvas, token, { width: 180, color: { dark: '#0a0a0a', light: '#ffffff' } })
      }
    }

    function startCountdown() {
      clearInterval(interval)
      document.getElementById('cp-qr-overlay')?.classList.add('hidden')
      seconds = qrTtl
      const el = document.getElementById('cp-qr-countdown')
      if (el) el.textContent = seconds

      interval = setInterval(() => {
        seconds--
        const el = document.getElementById('cp-qr-countdown')
        if (el) el.textContent = seconds
        if (seconds <= 0) {
          clearInterval(interval)
          document.getElementById('cp-qr-overlay')?.classList.remove('hidden')
        }
      }, 1000)
    }

    async function initQR() {
      await generateQR()
      startCountdown()
    }

    document.getElementById('cp-btn-renew')?.addEventListener('click', initQR)
    initQR()

    // ── FAB QR Link
    document.getElementById('fab-show-qr').onclick = () => {
      const el = document.querySelector('.qr-box')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.boxShadow = 'var(--primary-glow-lg)'
        setTimeout(() => el.style.boxShadow = 'var(--primary-glow)', 1500)
      }
    }
  }

  render()
}
