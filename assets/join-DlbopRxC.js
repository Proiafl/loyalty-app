import{a as e,i as t,o as n,t as r}from"./index-Bk9TpTD8.js";async function i({slug:i},a){let{data:o}=await e.from(`businesses`).select(`id, name, type, plan`).eq(`slug`,i).single();if(!o){a.innerHTML=`<p style="text-align:center;padding:2rem;color:var(--on-surface-muted)">Negocio no encontrado.</p>`;return}let s=await t();if(s){let{data:t}=await e.from(`customers`).select(`id`).eq(`business_id`,o.id).eq(`user_id`,s.id).single();if(t){r(`Ya estás registrado en ${o.name}`),n(`/mi-cuenta`);return}}a.innerHTML=`
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo">
          <div class="auth-logo-icon">🏪</div>
          <div class="auth-title">Unirte a ${o.name}</div>
          <div class="auth-subtitle">Registrate para acumular puntos y canjear recompensas</div>
        </div>

        ${s?`
        <div style="background:var(--success-bg);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius-md);padding:.75rem 1rem;margin-bottom:1rem">
          <p class="text-sm" style="color:var(--success)">✓ Logueado como ${s.email}</p>
        </div>`:`
        <div style="background:var(--primary-light);border:1px solid rgba(236,253,24,.2);border-radius:var(--radius-md);padding:.75rem 1rem;margin-bottom:1rem">
          <p class="text-sm" style="color:var(--primary)">💡 ¿Ya tenés cuenta? <button id="join-go-login" style="font-weight:700;text-decoration:underline;background:none;border:none;color:var(--primary);cursor:pointer">Ingresar primero</button></p>
        </div>`}

        <form class="auth-form" id="join-form">
          <div class="form-group">
            <label class="form-label">Tu nombre *</label>
            <input class="form-input" id="join-name" placeholder="María López" required value="${s?.user_metadata?.full_name||``}" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-input" id="join-email" type="email" placeholder="maria@email.com" required value="${s?.email||``}" ${s?`readonly`:``} />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono (opcional)</label>
            <input class="form-input" id="join-phone" type="tel" placeholder="+54 11 1234-5678" />
          </div>
          <button class="btn btn-primary btn-full" type="submit" id="join-btn">Registrarme</button>
        </form>
        <p class="text-muted text-sm mt-2" style="text-align:center">Al registrarte aceptás recibir comunicaciones de ${o.name}.</p>

        <div class="hidden" id="join-success" style="text-align:center;padding:1.5rem 0">
          <div style="font-size:3rem;margin-bottom:.5rem">🎉</div>
          <h3 style="font-family:var(--font-display);margin-bottom:.5rem">¡Bienvenido!</h3>
          <p class="text-muted text-sm mb-3">Tu cuenta fue creada. Ya podés ver tu tarjeta de puntos.</p>
          <button class="btn btn-primary btn-full" id="btn-goto-portal">Ir a Mi Cuenta</button>
        </div>
      </div>
    </div>
  `,s||document.getElementById(`join-go-login`)?.addEventListener(`click`,()=>{sessionStorage.setItem(`loyaltyapp_join_slug`,i),n(`/login`)});let c=null;document.getElementById(`join-form`).addEventListener(`submit`,async t=>{t.preventDefault();let n=document.getElementById(`join-btn`),i=document.getElementById(`join-name`).value.trim(),a=document.getElementById(`join-email`).value.trim(),u=document.getElementById(`join-phone`).value.trim();if(n.disabled=!0,n.textContent=`Registrando...`,o.plan===`freemium`){let{count:t}=await e.from(`customers`).select(`*`,{count:`exact`,head:!0}).eq(`business_id`,o.id);if(t>=20){r(`El negocio alcanzó el límite máximo de clientes.`,`error`),n.disabled=!1,n.textContent=`Registrarme`;return}}let{data:d}=await e.from(`customers`).select(`id`).eq(`business_id`,o.id).eq(`email`,a).single();if(d){s&&await e.from(`customers`).update({user_id:s.id}).eq(`id`,d.id),c=d.id,l();return}let f={business_id:o.id,name:i,email:a,phone:u||null,user_id:s?.id||null},{data:p,error:m}=await e.from(`customers`).insert(f).select().single();if(m){r(`Error al registrarte: `+m.message,`error`),n.disabled=!1,n.textContent=`Registrarme`;return}c=p.id,l()});function l(){document.getElementById(`join-form`).classList.add(`hidden`),document.getElementById(`join-success`).classList.remove(`hidden`),document.getElementById(`btn-goto-portal`).onclick=()=>{n(s?`/mi-cuenta`:`c/${i}/${c}`)}}}export{i as renderJoin};