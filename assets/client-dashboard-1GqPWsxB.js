import{i as e}from"./supabase-CQ8KoLZj.js";import{a as t,i as n,n as r,r as i,t as a}from"./index-Bluhx178.js";var o=t(r(),1);async function s(t,r,{user:s,profiles:c}){if(!c||c.length===0){r.innerHTML=`
      <div class="client-portal">
        <div class="client-portal-header">
          <div class="client-portal-user">
            <div>
              <div class="client-portal-greeting">Hola, ${s.user_metadata?.full_name||`bienvenido`}</div>
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
    `,document.getElementById(`cp-logout`).onclick=async()=>{await e.auth.signOut(),n(`/`)};return}let l=0;async function u(){let t=c[l],s=t.business,{data:d}=await e.from(`rewards`).select(`*`).eq(`business_id`,s.id).eq(`active`,!0).order(`points_required`),f=d||[],{data:p}=await e.from(`point_transactions`).select(`*`).eq(`customer_id`,t.id).order(`created_at`,{ascending:!1}).limit(5),m=f.find(e=>e.points_required>t.points),h=m?Math.min(100,Math.round(t.points/m.points_required*100)):100;r.innerHTML=`
      <div class="client-portal" style="padding-bottom: 5.5rem">
        <!-- Header -->
        <div class="client-portal-header">
          <div class="client-portal-user">
            <div>
              <div class="client-portal-greeting">Hola, ${t.name} 👋</div>
              <div class="client-portal-user-name">Mi Cuenta</div>
            </div>
            <button class="btn btn-sm" id="cp-logout" style="color:var(--bg);border:1px solid rgba(0,0,0,.2)">Salir</button>
          </div>
        </div>

        <!-- Business Tabs (if multi) -->
        ${c.length>1?`
        <div class="biz-tabs" style="margin-top:.75rem">
          ${c.map((e,t)=>`
            <button class="biz-tab ${t===l?`active`:``}" data-idx="${t}">
              ${e.business.name}
            </button>
          `).join(``)}
        </div>`:``}

        <!-- Points Hero -->
        <div class="points-hero" style="${c.length<=1?`margin-top:1.5rem`:``}">
          <div style="font-size:.8rem;color:var(--on-surface-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem">${s.name}</div>
          <div class="points-hero-value" id="cp-points">${t.points}</div>
          <div class="points-hero-label">puntos acumulados</div>
          <div style="margin-top:1rem">
            <div class="prog-wrap"><div class="prog-fill" style="width:${h}%"></div></div>
          </div>
          <div class="points-hero-next">${m?`${m.points_required-t.points} puntos para "${m.name}"`:`¡Tenés puntos para canjear! 🎉`}</div>
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
          ${f.length>0?f.map(e=>{let n=t.points>=e.points_required;return`
            <div class="client-reward-item">
              <div class="cr-icon">${e.icon||`🎁`}</div>
              <div>
                <div class="cr-name">${e.name}</div>
                <div class="cr-pts">${e.points_required} puntos</div>
              </div>
              <button class="btn btn-sm cr-btn ${n?`btn-primary`:`btn-ghost`}"
                ${n?`data-reward-id="${e.id}" data-reward-pts="${e.points_required}" data-reward-name="${e.name}"`:`disabled`}>
                ${n?`¡Canjear!`:`${e.points_required-t.points} más`}
              </button>
            </div>`}).join(``):`<p class="text-muted text-sm" style="padding:0 0 1rem">Este negocio aún no tiene recompensas.</p>`}
        </div>

        <!-- Recent Activity -->
        <div class="portal-section">
          <div class="portal-section-title">Últimas visitas</div>
          <div class="card">
            ${(p||[]).length>0?(p||[]).map(e=>`
              <div class="log-item">
                <div class="log-icon ${e.type===`redeem`?`err`:`ok`}">${e.type===`redeem`?`🎁`:`⭐`}</div>
                <div class="log-detail">${e.type===`redeem`?`Canjeó ${Math.abs(e.points)} pts`:`+${e.points} puntos`}</div>
                <div class="log-time">${new Date(e.created_at).toLocaleDateString(`es-AR`)}</div>
              </div>
            `).join(``):`<p class="text-muted text-sm">Sin visitas aún.</p>`}
          </div>
        </div>

        <button class="fab-btn" id="fab-show-qr" title="Mostrar QR">
          <span style="font-size: 1.5rem">📱</span>
        </button>
      </div>
    `,document.querySelectorAll(`.biz-tab`).forEach(e=>{e.onclick=()=>{l=parseInt(e.dataset.idx),u()}}),document.getElementById(`cp-logout`).onclick=async()=>{await e.auth.signOut(),n(`/`)},document.querySelectorAll(`.cr-btn[data-reward-id]`).forEach(n=>{n.onclick=async()=>{let r=parseInt(n.dataset.rewardPts),i=n.dataset.rewardName,o=n.dataset.rewardId;if(!confirm(`¿Canjear "${i}" por ${r} puntos?`))return;n.disabled=!0,n.textContent=`Canjeando...`;let{data:d,error:f}=await e.from(`customers`).select(`id, points, user_id`).eq(`id`,t.id).single();if(f||!d){console.error(`[Redeem] Fetch error:`,f),a(`Error al verificar puntos.`,`error`),n.disabled=!1,n.textContent=`¡Canjear!`;return}if(d.points<r){a(`Puntos insuficientes.`,`error`),n.disabled=!1,n.textContent=`${r-d.points} más`;return}let p=d.points-r,{data:m,error:h}=await e.from(`customers`).update({points:p}).eq(`id`,d.id).eq(`user_id`,d.user_id).select(`id, points`);if(h){console.error(`[Redeem] Update RLS error:`,h),a(`Error al actualizar puntos: ${h.message}`,`error`),n.disabled=!1,n.textContent=`¡Canjear!`;return}if(!m||m.length===0){console.error(`[Redeem] RLS BLOCKED update — no rows affected. Apply docs/fix-rls-canjes.sql in Supabase dashboard.`),a(`❌ Error de permisos. Contactá al administrador.`,`error`),n.disabled=!1,n.textContent=`¡Canjear!`;return}let{error:g}=await e.from(`point_transactions`).insert({business_id:s.id,customer_id:t.id,type:`redeem`,points:-r,reward_id:o||null});g&&console.error(`[Redeem] TX insert error:`,g),c[l]={...c[l],points:p},a(`¡Canjeaste "${i}"! 🎁 (-${r} pts)`),u()}});let g=s.qr_ttl_seconds||90,_=g,v=null;async function y(){let e=await i(s.id,t.id,g),n=document.getElementById(`cp-qr-canvas`);n&&e&&await o.toCanvas(n,e,{width:180,color:{dark:`#0a0a0a`,light:`#ffffff`}})}function b(){clearInterval(v),document.getElementById(`cp-qr-overlay`)?.classList.add(`hidden`),_=g;let e=document.getElementById(`cp-qr-countdown`);e&&(e.textContent=_),v=setInterval(()=>{_--;let e=document.getElementById(`cp-qr-countdown`);e&&(e.textContent=_),_<=0&&(clearInterval(v),document.getElementById(`cp-qr-overlay`)?.classList.remove(`hidden`))},1e3)}async function x(){await y(),b()}document.getElementById(`cp-btn-renew`)?.addEventListener(`click`,x),x(),document.getElementById(`fab-show-qr`).onclick=()=>{let e=document.querySelector(`.qr-box`);e&&(e.scrollIntoView({behavior:`smooth`,block:`center`}),e.style.boxShadow=`var(--primary-glow-lg)`,setTimeout(()=>e.style.boxShadow=`var(--primary-glow)`,1500))}}u()}export{s as renderClientDashboard};