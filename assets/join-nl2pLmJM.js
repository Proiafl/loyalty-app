import{a as e,i as t}from"./supabase-_EgudPJk.js";import{i as n,r}from"./index-DVVZ48RL.js";async function i({slug:i},a){let{data:o}=await e.from(`businesses`).select(`id, name, type, plan`).eq(`slug`,i).single();if(!o){a.innerHTML=`<p style="text-align:center;padding:2rem;color:var(--on-surface-muted)">Negocio no encontrado.</p>`;return}let s=await t();if(s){let{data:t}=await e.from(`customers`).select(`id`).eq(`business_id`,o.id).eq(`user_id`,s.id).single();if(t){r(`Ya estás registrado en ${o.name}`),n(`/mi-cuenta`);return}}a.innerHTML=`
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
          ${s?``:`
          <div class="form-group">
            <label class="form-label">Contraseña *</label>
            <input class="form-input" id="join-password" type="password" placeholder="Mínimo 8 caracteres" required minlength="8" />
          </div>`}
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
  `,s||document.getElementById(`join-go-login`)?.addEventListener(`click`,()=>{sessionStorage.setItem(`loyaltyapp_join_slug`,i),n(`/login`)});let c=s;document.getElementById(`join-form`).addEventListener(`submit`,async t=>{t.preventDefault();let a=document.getElementById(`join-btn`),s=document.getElementById(`join-name`).value.trim(),u=document.getElementById(`join-email`).value.trim(),d=c?null:document.getElementById(`join-password`).value,f=document.getElementById(`join-phone`).value.trim();if(a.disabled=!0,a.textContent=`Registrando...`,o.plan===`freemium`){let{count:t}=await e.from(`customers`).select(`*`,{count:`exact`,head:!0}).eq(`business_id`,o.id);if(t>=20){r(`El negocio alcanzó el límite máximo de clientes.`,`error`),a.disabled=!1,a.textContent=`Registrarme`;return}}if(!c)try{let{data:t,error:n}=await e.auth.signUp({email:u,password:d,options:{data:{full_name:s,phone:f}}});if(n)throw n;if(c=t.user,!c){r(`Si ya tenés cuenta, por favor ingresá primero.`,`error`),a.disabled=!1,a.textContent=`Registrarme`;return}}catch(e){e.message?.includes(`already registered`)?(r(`Email ya registrado. Por favor, ingresá a tu cuenta.`,`error`),sessionStorage.setItem(`loyaltyapp_join_slug`,i),setTimeout(()=>n(`/login`),2e3)):r(`Error de registro: `+e.message,`error`),a.disabled=!1,a.textContent=`Registrarme`;return}let{data:p}=await e.from(`customers`).select(`id`).eq(`business_id`,o.id).eq(`email`,u).single();if(p){await e.from(`customers`).update({user_id:c.id,name:s,phone:f||null}).eq(`id`,p.id),l();return}let{data:m,error:h}=await e.from(`customers`).insert({business_id:o.id,user_id:c.id,name:s,email:u,phone:f||null}).select().single();if(h){r(`Error al vincular con el negocio: `+h.message,`error`),a.disabled=!1,a.textContent=`Registrarme`;return}l()});function l(){document.getElementById(`join-form`).classList.add(`hidden`),document.getElementById(`join-success`).classList.remove(`hidden`),document.getElementById(`btn-goto-portal`).onclick=()=>{n(`/mi-cuenta`)}}}export{i as renderJoin};