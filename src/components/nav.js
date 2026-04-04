import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { id: 'clientes', label: 'Clientes', icon: '👥', path: '/clientes' },
  { id: 'recompensas', label: 'Recompensas', icon: '🎁', path: '/recompensas' },
  { id: 'scanner', label: 'Escanear', icon: '📷', path: '/scanner' },
  { id: 'notificaciones', label: 'Notificaciones', icon: '📣', path: '/notificaciones' },
  { id: 'config', label: 'Configuración', icon: '⚙️', path: '/config' },
]

export function renderNav(biz, activeId) {
  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">L</div>
        <div>
          <div class="sidebar-brand-name">LoyaltyApp</div>
          <div class="sidebar-brand-tag">Panel del negocio</div>
        </div>
      </div>

      <div class="nav-section">Principal</div>
      ${NAV_ITEMS.slice(0, 3).map(item => navItem(item, activeId)).join('')}

      <div class="nav-divider"></div>
      <div class="nav-section">Herramientas</div>
      ${NAV_ITEMS.slice(3).map(item => navItem(item, activeId)).join('')}

      <div class="sidebar-footer">
        <div class="biz-badge">
          <div class="biz-badge-name">${biz.name}</div>
          <div class="biz-badge-type">${biz.type || ''}</div>
          <span class="plan-badge ${biz.plan}">${biz.plan === 'pro' ? '⭐ Pro' : 'Freemium'}</span>
        </div>
      </div>
    </aside>
  `
}

function navItem({ id, label, icon, path }, activeId) {
  return `
    <div class="nav-item ${id === activeId ? 'active' : ''}" data-nav-path="${path}" onclick="window.location.hash='${path}'">
      ${icon} ${label}
    </div>
  `
}
