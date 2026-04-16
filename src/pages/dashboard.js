import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { renderNav } from '../components/nav.js'
import { showToast } from '../lib/ui.js'
import { showPlanModal } from '../components/planModal.js'

export async function renderDashboard(_, app, { biz, user }) {
  // Fetch stats
  const [clientsRes, txRes, rewardsRes] = await Promise.all([
    supabase.from('customers').select('id, status, last_visit_at, points, total_visits').eq('business_id', biz.id),
    supabase.from('point_transactions').select('id, type, created_at').eq('business_id', biz.id),
    supabase.from('rewards').select('id, total_redeemed').eq('business_id', biz.id),
  ])

  const clients = clientsRes.data || []
  const txs = txRes.data || []
  const totalRedeemed = (rewardsRes.data || []).reduce((s, r) => s + r.total_redeemed, 0)
  const thisMonth = new Date(); thisMonth.setDate(1)
  const newThisMonth = clients.filter(c => new Date(c.last_visit_at) > thisMonth).length
  const visitsMonth = txs.filter(t => t.type === 'earn' && new Date(t.created_at) > thisMonth).length

  // Fetch recent activity
  const { data: recent } = await supabase
    .from('point_transactions')
    .select('*, customer:customers(name)')
    .eq('business_id', biz.id)
    .order('created_at', { ascending: false })
    .limit(5)

  app.innerHTML = `
    <div class="app-shell">
      ${renderNav(biz, 'dashboard')}
      <main class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <div class="page-subtitle">Hola, ${biz.name} 👋 — aquí está tu resumen</div>
          </div>
          <button class="btn btn-primary" id="btn-scan-quick">📷 Escanear cliente</button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Clientes totales</div>
            <div class="stat-value">${clients.length}</div>
            <div class="stat-change up">+${newThisMonth} este mes</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Visitas este mes</div>
            <div class="stat-value">${visitsMonth}</div>
            <div class="stat-change neutral">validaciones confirmadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Recompensas canjeadas</div>
            <div class="stat-value">${totalRedeemed}</div>
            <div class="stat-change neutral">total histórico</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Clientes activos</div>
            <div class="stat-value">${clients.filter(c => c.status === 'active').length}</div>
            <div class="stat-change neutral">de ${clients.length} totales</div>
          </div>
        </div>

        <div class="card mt-3 mb-3">
          <div class="card-title flex just-between items-center">
            <span>Analytics Avanzado</span>
            ${biz.plan === 'freemium' ? '<span class="badge badge-inactive">🔒 Pro</span>' : '<span class="badge badge-active" style="background:var(--grad-primary);color:var(--bg)">⭐ Pro</span>'}
          </div>
          ${biz.plan === 'freemium' ? `
            <p class="text-muted text-sm my-2">Actualizá a Pro para desbloquear reportes de retención de clientes, métricas de retornos y puntos promedios en circulación.</p>
            <button class="btn btn-secondary btn-sm mt-2" id="btn-show-plan-modal">Ver planes</button>
          ` : `
            <div class="stats-grid mt-3">
              <div class="stat-card" style="border-color:var(--primary);background:rgba(236,253,24,.05)">
                   <div class="stat-label">Tasa de retención</div>
                   <div class="stat-value">${clients.length ? Math.round((clients.filter(c => c.total_visits > 1).length / clients.length) * 100) : 0}%</div>
                   <div class="stat-change up">clientes que volvieron</div>
              </div>
              <div class="stat-card" style="border-color:var(--sky);background:rgba(56,189,248,.05)">
                   <div class="stat-label">Puntos en circulación</div>
                   <div class="stat-value">${clients.length ? Math.round(clients.reduce((s, c) => s + c.points, 0) / clients.length) : 0} pts/pte</div>
                   <div class="stat-change neutral">promedio por cliente activo</div>
              </div>
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-title">Actividad reciente</div>
          ${recent && recent.length > 0 ? recent.map(tx => `
            <div class="log-item">
              <div class="log-icon ${tx.type === 'earn' ? 'ok' : 'err'}">${tx.type === 'earn' ? '⭐' : '🎁'}</div>
              <div>
                <div class="log-name">${tx.customer?.name || 'Cliente'}</div>
                <div class="log-detail">${tx.type === 'earn' ? `+${tx.points} puntos` : `Canjeó ${tx.points} puntos`}</div>
              </div>
              <div class="log-time">${timeAgo(tx.created_at)}</div>
            </div>
          `).join('') : '<p class="text-muted text-sm">Sin actividad aún. ¡Empezá a sumar puntos!</p>'}
        </div>

        <div class="card mt-3">
          <div class="card-title">Tu link de cliente</div>
          <p class="text-muted text-sm mb-2">Compartí este link o imprimí el código QR para que tus clientes se registren rápidamente y vean su tarjeta de puntos.</p>
          <div class="flex gap-2 items-center" style="flex-wrap: wrap;">
            <input class="form-input" readonly id="biz-link" value="${window.location.origin}/#/join/${biz.slug}" style="font-size:.8rem; flex: 1; min-width: 200px;" />
            <button class="btn btn-secondary btn-sm" id="btn-copy-link">Copiar</button>
            <button class="btn btn-primary btn-sm" id="btn-show-qr" style="display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              Mostrar / Imprimir QR
            </button>
          </div>
        </div>
      </main>
    </div>
  `

  document.getElementById('btn-scan-quick').onclick = () => navigate('/scanner')
  const btnShowPlan = document.getElementById('btn-show-plan-modal')
  if (btnShowPlan) {
    btnShowPlan.addEventListener('click', () => {
      console.log('[DEBUG] Ver planes button clicked')
      showPlanModal(biz, user)
    })
  }
  document.getElementById('btn-copy-link').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('biz-link').value)
    showToast('¡Link copiado!')
  }
  document.getElementById('btn-show-qr').onclick = () => {
    const url = document.getElementById('biz-link').value;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(url)}`;
    
    // Crear ventana para impresión
    const printWin = window.open('', '_blank', 'width=800,height=800');
    if(printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>QR Cliente - ${biz.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; text-align: center; padding: 40px; margin: 0; background: #fff; color: #000; }
              .container { border: 3px dashed #ddd; border-radius: 20px; padding: 50px 40px; display: inline-block; max-width: 400px; }
              h1 { font-size: 28px; margin-top: 0; margin-bottom: 10px; color: #111; }
              p { color: #555; margin-bottom: 30px; font-size: 16px; line-height: 1.5; }
              img.qr { width: 300px; height: 300px; margin-bottom: 20px; }
              .footer { font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 10px; }
              .no-print { margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 12px; }
              .print-btn { background: #000; color: #fff; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'Outfit', sans-serif; }
              .print-btn:hover { background: #222; }
              @media print {
                body { padding: 0; }
                .container { display: block; border: none; width: 100%; max-width: none; padding: 0; }
                img.qr { width: 500px; height: 500px; }
                .no-print { display: none !important; }
                h1 { font-size: 40px; }
                p { font-size: 24px; }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="print-btn" onclick="window.print()">🖨️ Haz clic aquí para Imprimir este QR</button>
              <p style="font-size: 13px; margin: 10px 0 0 0;">(El botón y este cuadro no se verán en el papel)</p>
            </div>
            <div class="container">
              <h1>¡Suma Puntos en<br/>${biz.name}!</h1>
              <p>Escaneá este código con la cámara de tu celular para registrarte y seguir tus recompensas fácilmente.</p>
              <img src="${qrUrl}" alt="Código QR de ${biz.name}" class="qr" onload="window.focus()"/>
              <div class="footer">Generado por LoyaltyApp - futuwebs.com</div>
            </div>
          </body>
        </html>
      `);
      printWin.document.close();
    } else {
      showToast('Habilita las ventanas emergentes (pop-ups) para ver el QR.');
    }
  }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h/24)}d`
}
