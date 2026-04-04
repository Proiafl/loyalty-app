# Plan de Prueba End-to-End — LoyaltyApp

**Versión:** 1.0 | **Fecha:** 2026-04-02 | **Ambiente:** `http://localhost:5173`

> Para pruebas Pro, ejecutar en Supabase SQL Editor:
> `UPDATE businesses SET plan = 'pro' WHERE slug = 'tu-slug'`

---

## BLOQUE 1 — Landing Page

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| L-01 | Carga | Navegar a `/#/` | Renderiza Hero, Features, Precios, Footer |
| L-02 | Planes | Ver sección Precios | Freemium: $0/20 clientes/2 recompensas. Pro: $25/ilimitado |
| L-03 | Login | Clic "Ingresar" en navbar | Redirige a `/#/login` |
| L-04 | CTAs | Clic en cualquier CTA | Todos redirigen a `/#/login` |

---

## BLOQUE 2 — Onboarding de Negocio

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| R-01 | Registro | `/#/login` → "Registrate gratis" → datos → "Crear cuenta" | Toast "¡Cuenta creada!" → redirige a `/onboarding` |
| R-02 | Paso 1 | Nombre del negocio + teléfono → "Continuar" | Avanza al paso 2 |
| R-03 | Paso 2 | Seleccionar tipo → "Continuar" | Tipo resaltado, avanza al paso 3 |
| R-04 | Paso 3 | Nombre recompensa + puntos → "¡Crear mi negocio!" | Toast "¡Negocio creado! 🎉" → redirige al Dashboard |
| R-05 | [Guard] Duplicar negocio | Con sesión activa ir a `/#/onboarding` | Redirige al Dashboard sin mostrar formulario |

---

## BLOQUE 3 — Dashboard Freemium

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| D-01 | Carga | Navegar a `/#/dashboard` | 4 stat-cards con valores reales de BD |
| D-02 | Analytics bloqueado | Ver tarjeta "Analytics Avanzado" | Badge "🔒 Pro" + botón "Ver planes" que navega a `/config` |
| D-03 | Link cliente | Ver campo "Tu link de cliente" | Valor: `localhost:5173/#/join/{slug}`. Botón "Copiar" funciona |
| D-04 | Generar QR | Clic "Mostrar / Imprimir QR" | Nueva ventana con QR, nombre negocio y botón imprimir |
| D-05 | QR válido | Escanear QR generado | Apunta a `/#/join/{slug}` correctamente |

---

## BLOQUE 4 — Dashboard Pro

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| D2-01 | Analytics activo | Plan Pro, ver tarjeta Analytics | Badge "⭐ Pro" + Tasa de Retención (%) + Puntos promedio/cliente |
| D2-02 | Cálculo retención | 2/4 clientes con más de 1 visita | Muestra 50% |

---

## BLOQUE 5 — Auto-Registro de Cliente (QR / Link)

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| C-01 | Acceso Join | Navegar a `/#/join/{slug}` | Pantalla de registro del negocio |
| C-02 | Negocio inexistente | `/#/join/slug-falso` | "Negocio no encontrado." |
| C-03 | Registro exitoso | Completar formulario → enviar | "¡Bienvenido! 🎉" + botón "Ir a Mi Cuenta" |
| C-04 | Email duplicado | Registrar mismo email 2 veces | No duplica; vincula y muestra éxito |
| C-05 | [Límite Freemium] Cliente 21 | Registrar en negocio con 20 clientes | Toast "El negocio alcanzó el límite máximo de clientes." |
| C-06 | Aviso login | Join sin sesión activa | Aviso "¿Ya tenés cuenta?". Clic guarda slug y redirige a `/login` |
| C-07 | Ya registrado | Login como cliente ya registrado | Toast "Ya estás registrado" → redirige a `/mi-cuenta` |

---

## BLOQUE 6 — Módulo Clientes

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| CL-01 | Vista | Navegar a `/#/clientes` | Tabla: Cliente, Puntos, Progreso, Visitas, Estado, Acciones |
| CL-02 | Búsqueda | Escribir en el buscador | Filtra en tiempo real (nombre, email, teléfono) |
| CL-03 | Agregar manual | "+ Agregar cliente" → modal → "Agregar" | Toast "✓ {nombre} agregado", aparece en tabla |
| CL-04 | [Límite Freemium] Manual #21 | Con 20 clientes, agregar uno más | Toast "🔓 Límite de 20 clientes alcanzado". Modal se cierra |
| CL-05 | Exportar Freemium | Clic "Exportar (Pro)" — freemium | Botón disabled. Si se fuerza: toast "Esta función requiere Plan Pro" |
| CL-06 | Exportar Pro | Clic "Exportar (Pro)" — pro | Descarga archivo `.csv` con todos los clientes |
| CL-07 | Agregar puntos | Clic "+pts" → cantidad → "Confirmar" | Toast con puntos sumados. Tabla actualizada |

---

## BLOQUE 7 — Módulo Recompensas

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| RW-01 | Ver | Navegar a `/#/recompensas` | Grid con recompensas + tarjeta "Nueva recompensa" |
| RW-02 | Crear | Clic "+" → modal → guardar | Toast "Recompensa creada ✓" |
| RW-03 | Editar | "Editar" → modificar → guardar | Toast "Recompensa actualizada ✓" |
| RW-04 | Eliminar | Papelera → confirmar | Toast "Recompensa eliminada" |
| RW-05 | [Límite Freemium] 3ra | Con 2 recompensas freemium, agregar otra | Tarjeta muestra "🔒 Plan Pro". Toast al intentar agregar |
| RW-06 | Sin límite Pro | Plan Pro, crear 3+ recompensas | Se crean sin restricciones |

---

## BLOQUE 8 — Scanner QR

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| SC-01 | Cargar | Navegar a `/#/scanner` | Pasos explicativos + campo token + historial hoy |
| SC-02 | Token inválido | Texto inventado → "Validar" | Panel rojo con mensaje de error |
| SC-03 | Token válido | Token generado por cliente → "Validar" | Panel verde: nombre, puntos actuales, puntos a sumar |
| SC-04 | Confirmar puntos | "Confirmar puntos" con token válido | Toast con puntos sumados. Campo limpiado. Historial actualizado |
| SC-05 | Token expirado | Esperar más de 90 segundos → validar | Error: token expirado |
| SC-06 | Token reutilizado | Reusar token ya validado | Error: token ya utilizado |
| SC-07 | Tecla Enter | Token en input → presionar Enter | Equivale a clic en "Validar" |

---

## BLOQUE 9 — Notificaciones

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| N-01 | Freemium bloqueado | `/#/notificaciones` — freemium | Pantalla bloqueada: badge "🔒 Plan Pro" y botón "Activar Plan Pro" |
| N-02 | Pro desbloqueado | `/#/notificaciones` — pro | Formulario con segmentos, campo mensaje, toggles WhatsApp/Email |
| N-03 | Enviar Pro | Escribir mensaje → segmento → "Enviar notificación" | Toast "✓ Notificación enviada a {N} clientes" |
| N-04 | Sin mensaje | Intentar enviar sin texto | Toast "Escribí un mensaje" |

---

## BLOQUE 10 — Configuración y Plan

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| CF-01 | Plan Freemium | `/#/config` — freemium | Badge "Freemium", "Hasta 20 clientes y 2 recompensas.", botón "Activar Pro ⭐" |
| CF-02 | Plan Pro | `/#/config` — pro | Badge "⭐ Pro". Sin botón upgrade |
| CF-03 | Upgrade | Clic "Activar Pro ⭐" | Invoca `mp-checkout` con `planPrice: 25` → redirige a MercadoPago |
| CF-04 | Guardar datos | Modificar datos → "Guardar cambios" | Toast "Datos actualizados ✓" |
| CF-05 | Guardar puntos | Modificar puntos → "Guardar sistema de puntos" | Toast "Sistema de puntos actualizado ✓" |
| CF-06 | Sign out | "Cerrar sesión" | Sesión cerrada → redirige a `/#/` |

---

## BLOQUE 11 — Guards de Autenticación

| ID | Caso | Pasos | Resultado Esperado |
|----|------|-------|--------------------|
| AG-01 | Sin sesión → Dashboard | `/#/dashboard` sin login | Redirige a `/#/login` |
| AG-02 | Sin sesión → Scanner | `/#/scanner` sin login | Redirige a `/#/login` |
| AG-03 | Login incorrecto | Datos erróneos | Toast de error. Botón se re-habilita |
| AG-04 | Login dueño | Cuenta con negocio registrado | Redirige a `/dashboard` |
| AG-05 | Login cliente | Cuenta solo con customer profiles | Redirige a `/mi-cuenta` |
| AG-06 | Signup desde Landing | "Crear cuenta" desde Landing | Siempre va al onboarding de negocio |

---

## SQL para datos de prueba (Límite Freemium)

Ejecutar en el SQL Editor de Supabase para poblar 19 clientes y poder testear el bloqueo del cliente #21:

```sql
INSERT INTO customers (business_id, name, email, status, points)
SELECT 'TU_BUSINESS_ID', 'Cliente Test ' || n, 'test' || n || '@test.com', 'new', 0
FROM generate_series(1, 19) n;
```

Reemplazar `TU_BUSINESS_ID` con el UUID real visible en la tabla `businesses`.
