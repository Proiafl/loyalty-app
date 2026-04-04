# Changelog LoyaltyApp

## [2026-04-04] - Registro Seguro de Clientes
- **Descripción del cambio**: 
  - Se añadió un campo de **Contraseña** en la página de registro de clientes del negocio (`src/pages/cliente/join.js`).
  - Se implementó la lógica de `supabase.auth.signUp` para crear una cuenta de usuario real en Supabase al momento del registro.
  - Los clientes ahora pueden iniciar sesión con su email y contraseña desde la página de `/login`.
  - Se vincula automáticamente el `user_id` de la autenticación con el registro en la tabla `customers`, permitiendo la persistencia de datos entre dispositivos y sesiones.
- **Motivo técnico/estético**: Resolver la limitación donde los clientes no podían re-ingresar a su portal si cerraban la sesión, mejorando significativamente la retención y seguridad del usuario final.
- **Pasos para revertir**: 
  1. En `join.js`, remover el campo de contraseña del HTML y eliminar el bloque de `supabase.auth.signUp` en el handler del form.
  2. Revertir la lógica de inserción simple en la tabla `customers` sin requerir un `user_id` verificado.

## [2026-04-04] - Despliegue de Aplicación y Git (Hostinger Fix)
- **Descripción del cambio**: 
  - Se inicializó el repositorio Git local vinculado a `https://github.com/Proiafl/loyalty-app.git`.
  - Se subió el código fuente a la rama `master`.
  - Se generó el build de producción mediante `npm run build`.
  - Se creó y publicó la rama `deploy` conteniendo exclusivamente los archivos estáticos de la carpeta `dist`.
- **Motivo técnico/estético**: Seguimiento del protocolo de despliegue para Hostinger y sincronización de cambios solicitada por el usuario. 
- **Pasos para revertir**: 
  1. Eliminar la rama `deploy` del repositorio remoto: `git push origin --delete deploy`.
  2. Borrar la carpeta `.git` local si se desea reiniciar el seguimiento de versiones.


## [2026-04-02] - Actualización de Planes (Freemium y Pro)
- **Descripción del cambio**: 
  - Se modificaron los límites del plan **Freemium** de 50 a 20 clientes. Este límite se estipuló en los textos de `src/pages/landing.js` y `src/pages/config.js` y se añadió una validación dura con Supabase en la adición manual (`src/pages/clientes.js`) y el auto-registro de cliente (`src/pages/cliente/join.js`).
  - Se ajustó el precio del plan **Pro** a **$25**, cambiándolo en el UI de Pricing de Landing, y fijándolo como base para la petición a Mercado Pago Checkout en `config.js`.
- **Motivo técnico/estético**: Solicitud de ajuste de pricing models para re-alinear el modelo de negocio SAAS con los recursos de servidor esperados. 
- **Pasos para revertir**: 
  1. En `landing.js`, deshacer el precio Pro ("$25" a "$X") y la cuantía Freemium ("20" a "50").
  2. En `config.js`, revertir `planPrice: 25` a `5000` y cambiar el texto de 20 a 50.
  3. Quitar los bloques de código que chequean `if(biz.plan === 'freemium') { ... count >= 20 ... }` en `clientes.js` y `cliente/join.js`.

## [2026-04-02] - Corrección de Flujo de Negocio y Auth
- **Descripción del cambio**: 
  - Se modificó `src/main.js` para añadir un guard on `/onboarding` que evita que dueños de negocio con cuenta activa re-ingresen a crear otro local, asegurando "una sola cuenta (negocio) por usuario".
  - Se actualizó `src/pages/auth.js` para pasar un flag booleano `isNewSignup` cuando la cuenta se crea desde el formulario de la "Landing page" (`/login`). Esto garantiza que los nuevos usuarios que se registran por esa vía vayan al onboarding de negocio y no se les reasigne como clientes aunque posean el mismo email en registros pasados de otros comercios.
- **Motivo técnico/estético**: Diferenciar claramente el flujo de alta de clientes (los cuales usan el enlace o QR generado) del alta de negocios (los cuales entran orgánicamente desde Landing). 
- **Pasos para revertir**: 
  1. En `src/main.js`, remover las siguientes líneas dentro de la ruta `onboarding`: `const biz = await getBusiness(); if (biz) { navigate('/dashboard'); return }`.
  2. En `src/pages/auth.js`, volver a dejar `redirectByRole()` sin parámetro y ejecutar la comprobación de `getCustomerProfiles()` sin depender de él.

## [2026-04-02] - Funcionalidad de Alta de Clientes / QR
- **Descripción del cambio**: Se añadió un botón "Mostrar / Imprimir QR" en el dashboard del negocio. Al hacer clic, se abre una pestaña limpia orientada a impresión con el código QR generado a través de `api.qrserver.com`. El QR codifica la URL de registro dinámica del negocio (`/#/join/slug`).
- **Motivo técnico/estético**: Proveer a los negocios locales un medio físico (imprimible) sin esfuerzo extra para que sus clientes puedan autogestionarse el alta escaneando el código fijado en el mostrador. Esto sigue la filosofía UX de "Premium First", entregando una página lista para impresión con branding (Outfit font).
- **Pasos para revertir**: 
  1. En `src/pages/dashboard.js`, remover el botón `#btn-show-qr` de la tarjeta "Tu link de cliente".
  2. Eliminar el bloque de evento `document.getElementById('btn-show-qr').onclick = ...` al final de la función `renderDashboard`.
