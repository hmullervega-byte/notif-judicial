# Sistema Notif Judicial — Receptoría Antofagasta

## Contexto

Receptoría judicial en Antofagasta, Chile. Automatiza el proceso completo de notificaciones judiciales: desde ingreso de causas hasta generación de estampes Word, pasando por registro en terreno con webapp móvil QR. Volumen: +60 diligencias diarias.

**Equipo:** Helmuth (propietario/Darth), Receptora abogada (Jedi), Marco administrativo (Padawan), Administrativos 2 y 3 (estampes + subida PJUD).

## REGLA CRÍTICA DE DESARROLLO

- **TODOS los cambios van SOLO en dev.html y webapp_dev.html**
- **NUNCA modificar app.html ni webapp.html directamente**
- app.html y webapp.html son PRODUCCIÓN — Marco y la Receptora trabajan en ellos
- Solo cuando Helmuth diga explícitamente "pasa dev a app" o "pasa webapp_dev a webapp", recién actualizar producción
- Después de CADA cambio hacer commit y push a GitHub Pages
- Si hay duda sobre si un cambio va en dev o producción, siempre elegir dev
- Siempre hacer `git push origin main` después de commits, sin preguntar

## Stack y arquitectura

- HTML/JS puro, Python, Dropbox JSON, GitHub Pages
- Repositorio: `hmullervega-byte/notif-judicial`
- Carpeta local: `C:\Users\hmull\Escritorio\Nueva Maestra\`
- Repo local: `C:\Users\hmull\Escritorio\Nueva Maestra\notif-judicial\`

```
MÓDULO 1 (Max)          MÓDULO 2 (Eleven)       MÓDULO 3 (Mike)         MÓDULO 4 (Lucas)
app.html / dev.html     webapp.html / _dev.html  generar_estampes.py     watcher.py
Webapp oficina          Webapp terreno QR        Generador estampes      JSON→Excel + PDF→QR
Marco ingresa causas    Receptora escanea QR     Python genera .docx     Polling Dropbox 30s
→ CAUSA.json Dropbox    → {id}_{TIPO}.json       desde JSONs + Excel     → escribe Excel
```

La columna vertebral es **Dropbox** (`/Apps/notif-judicial/`). Excel es registro histórico.

| Componente | Tecnología |
|---|---|
| Base de datos | Excel (`BaseDatos.xlsx`, hoja `BaseDatos`) |
| Webapp oficina (Max) | HTML/JS puro, GitHub Pages |
| Webapp terreno (Eleven) | HTML/JS puro, PWA instalable, GitHub Pages |
| Sincronización | Dropbox Scoped App (`notif-judicial`) |
| Generador estampes (Mike) | Python 3 + `python-docx` + `openpyxl` |
| Watcher (Lucas) | Python 3 + `openpyxl` + `dropbox` + `pymupdf` + `pyzbar` |
| QR scanner | BarcodeDetector API (Android Chrome) + jsQR local fallback |
| NO reemplazar | Optiroute, Plataforma Poder Judicial, Firma digital Helmuth |

## Archivos principales

### Repositorio: `notif-judicial/`

| Archivo | Módulo | Descripción |
|---|---|---|
| `app.html` | Max (M1) | Webapp oficina **PRODUCCIÓN** (Marco/Jedi/Darth). Login, ingreso, causas, validación, ruta. |
| `dev.html` | Max (M1) | Webapp oficina **DESARROLLO**. Usa `/causas-dev/` en Dropbox. |
| `webapp.html` | Eleven (M2) | Webapp terreno **PRODUCCIÓN** (Receptora). PWA, escaneo QR, registro resultados. |
| `webapp_dev.html` | Eleven (M2) | Webapp terreno **DESARROLLO**. Usa `/causas-dev/` y `/resultados-dev/`. Banner amarillo "MODO DESARROLLO". |
| `manifest.json` | PWA | Manifest producción (webapp.html) |
| `manifest_dev.json` | PWA | Manifest desarrollo (webapp_dev.html) |
| `sw.js` | PWA | Service Worker producción — cachea webapp.html |
| `sw_dev.js` | PWA | Service Worker desarrollo — cachea webapp_dev.html |
| `jsqr.min.js` | Eleven | jsQR 1.4.0 descargado localmente (sin CDN) |
| `Logo_pjud.png` | PWA/Mike | Logo Poder Judicial (icono PWA + encabezado estampes) |

### Raíz: `C:\Users\hmull\Escritorio\Nueva Maestra\`

| Archivo | Módulo | Descripción |
|---|---|---|
| `generar_estampes.py` | Mike (M3) | Generador de estampes. Lee JSONs Dropbox, cruza con Excel, genera .docx. 6 tipos: CED, NP, EMB, EMBF, RPP-STANDALONE, CE. |
| `watcher.py` | Lucas (M4) | Polling Dropbox + escaneo PDFs firmados. Escribe cols N,X,Y,AA,AB,AD,AE en Excel. |
| `exportar.py` | Soporte | Lee Excel → sube `causas.json` a Dropbox. |
| `generar_index.py` | Soporte | Regenera INDEX.json e INDEX_RESPALDO.json desde todos los `_CAUSA.json` en Dropbox. |
| `autorizar_dropbox.py` | Soporte | Genera tokens OAuth2 para Dropbox Scoped App. |
| `BaseDatos.xlsx` | Central | Base de datos Excel, hoja `BaseDatos`. Col W = ID hex 16 chars. |
| `derechos.json` | Mike | Tarifas de derechos por estudio/demandante. |
| `dropbox_token.json` | Soporte | Credenciales Dropbox. NO subir a GitHub. |

## Dropbox — Estructura

```
causas/                          ← PRODUCCIÓN
  {id_hex}_CAUSA.json            ← 1 archivo por causa
  INDEX.json                     ← Índice liviano (campos básicos)
  INDEX_RESPALDO.json            ← Índice completo (todos los campos + historial)

causas-dev/                      ← DESARROLLO
  {id_hex}_CAUSA.json
  INDEX.json
  INDEX_RESPALDO.json

resultados/                      ← PRODUCCIÓN
  {id_hex}_BN.json               ← Eleven sube desde terreno
  {id_hex}_BP.json
  {id_hex}_NOT44.json
  {id_hex}_RPP.json / _RPF.json
  procesados/                    ← Lucas mueve aquí tras procesar

resultados-dev/                  ← DESARROLLO
  (misma estructura)

estados/
  ruta.json                      ← Última ruta generada
```

## Usuarios y perfiles

| Usuario | Perfil | Rol |
|---|---|---|
| `macosta` | Padawan (Marco) | Ingreso causas, generar ruta, exportar |
| `mcarreño` | Jedi (Receptora) | Validar causas, gestión directa, terreno |
| `hmuller` | Darth (Helmuth) | Todo + cambiar estados, reabrir, suspender, eliminar |

## Estados de causas (flujo)

```
pendiente_validacion → validada → en_ruta →
resultado_registrado → lista_para_estampe →
estampada → boleta_emitida → cerrada
```

Estados especiales: `gestion_directa_receptora`, `devuelta`, `suspendida`

| Estado | Significado | Quién lo cambia |
|---|---|---|
| `pendiente_validacion` | Marco envió a Receptora | Max (Enviar a Receptora) |
| `validada` | Lista para ruta | Max (Guardar / Jedi valida) |
| `en_ruta` | Marco seleccionó para ruta del día | Max (generar ruta) |
| `resultado_registrado` | Receptora registró resultado en terreno | Lucas (watcher.py) |
| `lista_para_estampe` | Lucas procesó, Mike puede generar | Lucas (watcher.py) |
| `estampada` | Mike generó el .docx | Mike (generar_estampes.py) |
| `boleta_emitida` | Helmuth asignó boleta | Max (Darth, futuro) |
| `cerrada` | Causa cerrada | Max (Darth) |
| `suspendida` | Causa suspendida con motivo | Max (botón Suspender) |
| `devuelta` | Jedi devolvió a Marco para corrección | Max (Jedi) |
| `gestion_directa_receptora` | Diligencia sin ruta (embargo CBR, etc.) | Max |

### Suspensión / Reactivación
- Botón SUSPENDER en Mis Causas (visible con 1 checkbox marcado, fondo rojo #ef4444)
- Modal con textarea obligatorio (mín 10 chars), historial `{accion: 'suspension', motivo}`
- Reactivación solo Darth: selector de estado destino, historial `{accion: 'reactivacion'}`

## Reglas webapp terreno (webapp.html / webapp_dev.html)

### Permisos por estado
| Estado | Ver datos | Editar | Registrar resultado |
|---|---|---|---|
| `pendiente_validacion` | Si | No | No |
| `devuelta` | Si | No | No |
| `suspendida` | Si | No | No |
| `cerrada` | Si | No | No |
| `validada` | Si | Si | Si |
| `en_ruta` | Si | Si | Si |
| `gestion_directa_receptora` | Si | Si | Si |
| `resultado_registrado` | Si | Si | Si |

### Características PWA
- PWA instalable en Android (manifest.json, service worker)
- Service Worker: Stale While Revalidate para archivos estáticos
- jsqr.min.js guardado localmente (sin CDN externo)
- Google Fonts cargadas async (no bloquean render)
- INDEX_RESPALDO.json cacheado en localStorage (TTL 2h)
- Carga QR instantánea desde caché local (<200ms)
- Modo offline: pendientes en localStorage, sync al recuperar señal
- Indicador conexión: punto verde/naranja en header

### Edición desde terreno
- Receptora puede editar ROL, Tribunal, Demandado, RUT, Notificar a, Dirección
- Escribe en /causas-dev/ (dev) o /causas/ (prod)
- Historial: `{accion: 'edicion_terreno', campos_modificados, usuario: 'receptora'}`

## Tipos de gestión directa (no van en ruta)

ALZAMIENTO-CBR, ALZAMIENTO-RVM, ALZAMIENTO-TESORERIA, ALZAMIENTO-OTROS, EMBARGO-CBR, EMBARGO-CUENTA-CORRIENTE, EMBARGO-FRUSTRADO, EMBARGO-OTROS, EMBARGO-RVM, EMBARGO-TESORERIA, PRUEBA-CONFESIONAL, PRUEBA-TESTIMONIAL, REQ-PAGO-TRIBUNAL

## Sistema de códigos

- **D-codes** (dirección problemática): D01-D11. Sin informante. Conector "puesto que".
- **Q-codes** (quién informa): Q01, Q02, Q03, Q05, Q08, Q09. Compartidos BN/BP/NOT44.
- **R-codes** (qué informó, solo BN): R01-R09. Conector "por no ser habido/a".
- **BP01/BP02** (inferidos): Q03/Q05 → BP01, resto → BP02. No se seleccionan en webapp.
- **N44-P/A/C** (entrega copias NOT44): Puerta, Adulto, Conserje.
- **RPP/RPF** (requerimiento): RPP = concurrió, RPF = en rebeldía. Solo fecha y hora.

## Base de datos Excel — columnas clave

| Col | Campo | Notas |
|---|---|---|
| A | ROL | Parte del ID hex |
| B | Tribunal | Parte del ID hex |
| D | Demandado | Encabezado estampes |
| F | Dirección | Parte del ID hex |
| I | Tipo Notificación | NOT-PERSONAL-EJE/ORD, NOT44-EJE/ORD, CEDULA, EMBARGO, BN |
| K | Notificar a (notif_a) | Parte del ID hex. Cuerpo estampes. Fallback a col D. |
| N | Resultado | Escrita por Lucas |
| P | N° Solicitud | Parte del ID hex |
| W | **ID hex 16 chars** | **Clave primaria.** Hash de cols A+B+F+K+P. Mayúsculas. |

## Tipos de diligencia

| Tipo | Estado |
|---|---|
| BN (Búsqueda Negativa) | ✅ Operativo |
| BP (Búsqueda Positiva) | ✅ Operativo |
| NOT44-EJE (Art. 44 Ejecutiva) | ✅ Operativo — genera 3 .docx separados |
| NOT44-ORD (Art. 44 Ordinaria) | ✅ Operativo |
| NP (Notif. Personal) | ✅ Operativo |
| CED (Cédula) | ✅ Operativo |
| EMB (Embargo Impuestos) | ✅ Operativo |
| EMBF (Embargo Frustrado) | ✅ Operativo |
| RPP-STANDALONE (Req. Pago) | ✅ Operativo |
| CE (Cédula Espera standalone) | ✅ Operativo |

## Reglas de trabajo

### Generales
- **No reemplazar Excel** como base de datos. Las webapps hablan con Dropbox, no con Excel.
- **No reemplazar** Optiroute, Plataforma Poder Judicial ni la firma digital de Helmuth.
- **Un JSON por causa** en Dropbox (no monolítico). Evita colisiones de escritura.
- **ID hex 16 chars mayúsculas** es la clave universal que conecta todo.

### generar_estampes.py (Mike)
- Modo producción: `python generar_estampes.py` (lee Dropbox).
- Modo prueba: `python generar_estampes.py --prueba` (lee `resultados/` local).
- Encabezado usa col D (demandado). Cuerpo usa `_notif_a()` (col K con fallback a D).
- NOT44-EJE genera 3 archivos SEPARADOS (no fusionados).
- Tests: `python -m pytest` desde la carpeta del proyecto.

### watcher.py (Lucas)
- Ejecutar con `WATCHER.bat` DESPUÉS de subir PDFs al Poder Judicial.
- Dos ciclos cada 30s: `ciclo_json()` + `ciclo_pdf()`.
- Lock por id_hex. Mueve JSONs a `/procesados/` solo tras éxito.

### app.html / dev.html (Max)
- Login: solo usuario (3 perfiles). Credenciales Dropbox en localStorage.
- Guardar causa → `{id_hex}_CAUSA.json` directo a Dropbox.
- INDEX.json + INDEX_RESPALDO.json se sincronizan al guardar/validar/devolver/generar ruta.
- dev.html usa `/causas-dev/`, app.html usa `/causas/`.
- Formulario físico imprimible (3 hojas) con QR, checkboxes, timbre base64.
- Vistas: dashboard, ingreso, causas, validación, ruta.

### webapp.html / webapp_dev.html (Eleven)
- PWA HTML/JS puro. jsQR local.
- loadCausa busca en INDEX_RESPALDO (localStorage) → instantáneo. Background refresca.
- webapp_dev.html usa `/causas-dev/` y `/resultados-dev/`.
- webapp.html usa `/causas/` y `/resultados/`.

## Conversaciones del proyecto (nombres de agentes)

| Nombre | Módulo | Propósito |
|---|---|---|
| Mike | generar_estampes.py | Motor de reglas y generación de .docx |
| Eleven | webapp.html | Webapp terreno con QR |
| Lucas | watcher.py | Procesamiento JSONs y PDFs |
| Max | app.html | Webapp oficina unificada |
| Will | Redacción jurídica | Revisión de textos legales de estampes |

## Pendientes importantes

### Alta prioridad
- Migración histórica: ~400 causas desde enero 2026 desde BaseDatos.xlsx a JSONs
- `derechos.json`: poblar con tarifas reales + agregar clave `embargo_rpf`
- Panel Darth: pagos, estados de pago, cobranza

### Media prioridad
- Lucas (watcher.py): activar cuando flujo completo esté listo
- Marcha blanca Fase 2: NOT44 y NP
- Mike: agregar punto seguido al final de las piezas en el estampe

## Comandos útiles

```bash
# Tests de Mike
cd "C:\Users\hmull\Escritorio\Nueva Maestra"
python -m pytest

# Mike modo prueba
python generar_estampes.py --prueba

# Mike modo producción
python generar_estampes.py

# Watcher (después de subir PDFs al PJUD)
python watcher.py

# Git push a GitHub Pages
cd "C:\Users\hmull\Escritorio\Nueva Maestra\notif-judicial"
git add -A && git commit -m "descripción" && git push origin main

# Regenerar INDEX.json desde Dropbox
python generar_index.py
```
