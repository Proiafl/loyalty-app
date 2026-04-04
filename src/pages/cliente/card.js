import { supabase } from '../../lib/supabase.js'
import { createQRToken } from '../../lib/qr.js'
import QRCode from 'qrcode'

export async function renderClientCard({ slug, customerId }, app) {
  // Load business
  const { data: biz } = await supabase.from('businesses').select('*').eq('slug', slug).single()
  if (!biz) { app.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--on-surface-muted)">Negocio no encontrado.</p>'; return }

  // Load customer
  const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).eq('business_id', biz.id).single()
  if (!customer) { app.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--on-surface-muted)">Cliente no encontrado.</p>'; return }

  // Load rewards
  const { data: rewards } = await supabase.from('rewards').select('*').eq('business_id', biz.id).eq('active', true).order('points_required')
  const rewardsList = rewards || []

  // Load recent transactions
  const { data: history } = await supabase
    .from('point_transactions').select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false }).limit(5)

  const nextReward = rewardsList.find(r => r.points_required > customer.points)
  const pct = nextReward ? Math.min(100, Math.round((customer.points / nextReward.points_required) * 100)) : 100

  app.innerHTML = `
    <div class="client-card">
      <div class="client-card-hero">
        <div class="client-biz-name">${biz.name}</div>
        <div class="client-points-big" id="cc-points">${customer.points}</div>
        <div class="client-points-lbl">puntos acumulados</div>
      </div>
      <div class="client-prog-section">
        <div class="client-prog-lbl">${nextReward ? `${nextReward.points_required - customer.points} puntos para "${nextReward.name}"` : '¡Tenés puntos para canjear! 🎉'}</div>
        <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="qr-section">
        <p style="font-size:.8rem;color:var(--on-surface-muted);margin-bottom:.5rem">Mostrá este QR al negocio para sumar puntos</p>
        <div class="qr-box">
          <canvas class="qr-canvas" id="qr-canvas"></canvas>
          <div class="qr-expired-overlay hidden" id="qr-overlay">
            <div style="font-size:2rem">↺</div>
            <p style="font-weight:600;font-size:.9rem">QR expirado</p>
            <button class="btn btn-primary btn-sm" id="btn-renew">Renovar QR</button>
          </div>
        </div>
        <div class="qr-timer">Expira en <span id="qr-countdown">90</span>s</div>
        <div class="qr-token-txt" id="qr-token-txt">Generando...</div>
      </div>

      <div class="client-rewards">
        <div class="client-rewards-title">Tus recompensas</div>
        ${rewardsList.map(r => {
          const canRedeem = customer.points >= r.points_required
          return `
          <div class="client-reward-item">
            <div class="cr-icon">${r.icon || '🎁'}</div>
            <div>
              <div class="cr-name">${r.name}</div>
              <div class="cr-pts">${r.points_required} puntos</div>
            </div>
            <button class="btn btn-sm cr-btn ${canRedeem ? 'btn-primary' : 'btn-ghost'}"
              ${canRedeem ? `data-reward-id="${r.id}" data-reward-pts="${r.points_required}" data-reward-name="${r.name}"` : 'disabled'}>
              ${canRedeem ? '¡Canjear!' : `${r.points_required - customer.points} más`}
            </button>
          </div>`
        }).join('')}
        ${rewardsList.length === 0 ? '<p class="text-muted text-sm">Este negocio aún no tiene recompensas configuradas.</p>' : ''}
      </div>

      <div style="padding:0 1.5rem 2rem">
        <div class="client-rewards-title">Últimas visitas</div>
        ${(history || []).map(tx => `
          <div class="log-item">
            <div class="log-icon ok">⭐</div>
            <div class="log-detail">+${tx.points} puntos</div>
            <div class="log-time">${new Date(tx.created_at).toLocaleDateString('es-AR')}</div>
          </div>
        `).join('') || '<p class="text-muted text-sm">Sin visitas aún.</p>'}
      </div>
    </div>
  `

  // Generate QR
  let qrSeconds = biz.qr_ttl_seconds || 90
  let currentToken = null
  let interval = null

  async function generateQR() {
    const token = await createQRToken(biz.id, customer.id, qrSeconds)
    currentToken = token
    const canvas = document.getElementById('qr-canvas')
    const tokenTxt = document.getElementById('qr-token-txt')
    if (!canvas) return
    if (token) {
      await QRCode.toCanvas(canvas, token, { width: 180, color: { dark: '#0a0a0a', light: '#ffffff' } })
      if (tokenTxt) tokenTxt.textContent = token
    } else {
      if (tokenTxt) tokenTxt.textContent = 'Error generando QR'
    }
  }

  function startCountdown() {
    clearInterval(interval)
    document.getElementById('qr-overlay')?.classList.add('hidden')
    qrSeconds = biz.qr_ttl_seconds || 90
    document.getElementById('qr-countdown').textContent = qrSeconds

    interval = setInterval(() => {
      qrSeconds--
      const el = document.getElementById('qr-countdown')
      if (el) el.textContent = qrSeconds
      if (qrSeconds <= 0) {
        clearInterval(interval)
        document.getElementById('qr-overlay')?.classList.remove('hidden')
      }
    }, 1000)
  }

  async function init() {
    await generateQR()
    startCountdown()
  }

  document.getElementById('btn-renew')?.addEventListener('click', init)

  // Redeem reward
  document.querySelectorAll('.cr-btn[data-reward-id]').forEach(btn => {
    btn.onclick = async () => {
      const pts = parseInt(btn.dataset.rewardPts)
      const name = btn.dataset.rewardName
      if (!confirm(`¿Canjear "${name}" por ${pts} puntos?`)) return
      const { error } = await supabase.from('customers').update({ points: customer.points - pts }).eq('id', customer.id)
      if (!error) {
        await supabase.from('point_transactions').insert({
          business_id: biz.id, customer_id: customer.id,
          type: 'redeem', points: -pts, reward_id: btn.dataset.rewardId
        })
        await supabase.from('rewards').update({ total_redeemed: (rewards.find(r => r.id === btn.dataset.rewardId)?.total_redeemed || 0) + 1 }).eq('id', btn.dataset.rewardId)
        alert(`¡Canjeaste "${name}"! Mostrá este mensaje al negocio. 🎁`)
        renderClientCard({ slug, customerId }, app)
      }
    }
  })

  init()
}
