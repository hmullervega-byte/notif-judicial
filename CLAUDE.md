# Sistema Notif Judicial — Receptoría Antofagasta

## Contexto

Receptoría judicial en Antofagasta, Chile. Automatiza el proceso completo de notificaciones judiciales: desde ingreso de causas hasta generación de estampes Word, pasando por registro en terreno con webapp móvil QR. Volumen: +60 diligencias diarias.

**Equipo:** Helmuth (propietario/Darth), Receptora abogada (Jedi), Marco administrativo (Padawan), Administrativos 2 y 3 (estampes + subida PJUD).

## Arquitectura — 4 módulos conectados por Dropbox

```
MÓDULO 1 (Max)          MÓDULO 2 (Eleven)       MÓDULO 3 (Mike)         MÓDULO 4 (Lucas)
app.html                webapp.html             generar_estampes.py     watcher.py
Webapp oficina          Webapp terreno QR       Generador estampes      JSON→Excel + PDF→QR
Marco ingresa causas    Receptora escanea QR    Python genera .docx     Polling Dropbox 30s
→ CAUSA.json Dropbox    → {id}_{TIPO}.json      desde JSONs + Excel     → escribe Excel
```

La columna vertebral es **Dropbox** (`/Apps/notif-judicial/`). Excel es registro histórico.

## Stack tecnológico — FIJO, no reemplazar

| Componente | Tecnología |
|---|---|
| Base de datos | Excel (`BaseDatos.xlsx`, hoja `BaseDatos`) |
| Webapp oficina (Max) | HTML/JS puro, GitHub Pages |
| Webapp terreno (Eleven) | HTML/JS puro, GitHub Pages |
| Sincronización | Dropbox Scoped App (`notif-judicial`) |
| Generador estampes (Mike) | Python 3 + `python-docx` + `openpyxl` |
| Watcher (Lucas) | Python 3 + `openpyxl` + `dropbox` + `pymupdf` + `pyzbar` |
| Exportador | Python 3 + `openpyxl` + `dropbox` |
| QR scanner | BarcodeDetector API (Android Chrome) + jsQR fallback |
| NO reemplazar | Optiroute, Plataforma Poder Judicial, Firma digital Helmuth |

## Archivos del proyecto

### Raíz: `C:\Users\hmull\Escritorio\Nueva Maestra\`

| Archivo | Módulo | Descripción |
|---|---|---|
| `generar_estampes.py` | Mike (M3) | Generador de estampes. Lee JSONs Dropbox, cruza con Excel, genera .docx. v2.8, 61/61 tests. |
| `watcher.py` | Lucas (M4) | Polling Dropbox + escaneo PDFs firmados. Escribe cols N,X,Y,AA,AB,AD,AE en Excel. v1.0, 21/21 tests. |
| `exportar.py` | Soporte | Lee Excel → sube `causas.json` a Dropbox. Marco ejecuta cada tarde. |
| `generar_index.py` | Soporte | Regenera `/causas/INDEX.json` desde todos los `_CAUSA.json` en Dropbox. |
| `autorizar_dropbox.py` | Soporte | Genera tokens OAuth2 para Dropbox Scoped App. |
| `app.html` | Max (M1) | Webapp oficina unificada. Login Padawan/Jedi/Darth. Formulario ingreso + ver causas. |
| `webapp.html` | Eleven (M2) | Webapp terreno móvil. Escaneo QR, selección códigos, envío a Dropbox. v1.9.4. |
| `ingreso_causas.html` | Legacy | Versión anterior del formulario de ingreso. Reemplazado por `app.html`. |
| `BaseDatos.xlsx` | Central | Base de datos Excel, hoja `BaseDatos`. 23+ columnas. Col W = ID hex 16 chars. |
| `derechos.json` | Mike | Tarifas de derechos por estudio/demandante. Busca estudio → demandante → default. |
| `dropbox_token.json` | Soporte | Credenciales Dropbox (app_key, app_secret, refresh_token). NO subir a GitHub. |
| `MAESTRA FORMULARIOS.xlsm` | Legacy | Excel con VBA, formulario físico con QR. Sigue en uso para imprimir formularios. |
| `Logo_pjud.png` | Mike | Logo Poder Judicial para encabezado de estampes. |
| `timbre_receptora.png` | Mike | Timbre/firma escaneada de la receptora para estampes. |
| `GENERAR ESTAMPES.bat` | Mike | Lanzador de `generar_estampes.py` (doble clic). |
| `WATCHER.bat` | Lucas | Lanzador de `watcher.py` (doble clic, después de subir PDFs al PJUD). |
| `NC.docx` / `NC.docm` | Legacy | Plantillas de notificación por cédula (referencia). |

### Subcarpetas

| Carpeta | Contenido |
|---|---|
| `Estampes/BN/` | Estampes generados de búsqueda negativa (.docx) |
| `Estampes/BN/Firmados/` | PDFs firmados por Helmuth (entrada para Lucas ciclo_pdf) |
| `Estampes/BN/Firmados/Procesados/` | PDFs ya registrados por Lucas |
| `resultados/` | JSONs de prueba locales (modo `--prueba` de Mike) |
| `respaldo/` | Versiones anteriores de archivos del proyecto |
| `Archivos proyecto/` | Documentación del proyecto (ver abajo) |

### Documentación: `Archivos proyecto/`

| Archivo | Contenido |
|---|---|
| `PROYECTO_NotifJudicial_v2_9.docx` | Documento base del proyecto. Arquitectura, decisiones, mapas de códigos. **Fuente de verdad.** |
| `INVENTARIO_BN.md` | Inventario completo de escenarios BN con textos generados. |
| `INVENTARIO_BN_v2_8.docx` | Inventario BN versión docx (canon). |
| `INVENTARIO_NOT44.md` | Inventario de escenarios NOT44. |
| `REPORTE_MIKE_BN_v1.docx` | 17 cambios M01-M17 implementados en Mike para BN. |
| `REPORTE_ELEVEN_BN_v1.docx` | 9 campos nuevos + 3 etiquetas implementados en Eleven. |
| `RESUMEN_SESION_BN01_Mike.md` | Resumen de sesión de trabajo con Mike. |

### Estructura Dropbox (`/Apps/notif-judicial/`)

```
causas/
  {id_hex}_CAUSA.json          ← Max sube al guardar causa (1 archivo por causa)
resultados/
  {id_hex}_BN.json             ← Eleven sube desde terreno
  {id_hex}_BP.json
  {id_hex}_NOT44.json
  {id_hex}_RPP.json / _RPF.json
  procesados/                  ← Lucas mueve aquí tras procesar
```

## Base de datos Excel — columnas clave

| Col | Campo | Notas |
|---|---|---|
| A | ROL | Parte del ID hex |
| B | Tribunal | Parte del ID hex |
| D | Demandado | Encabezado estampes |
| F | Dirección | Parte del ID hex |
| I | Tipo Notificación | Lista: NOT-PERSONAL-EJE/ORD, NOT44-EJE/ORD, CEDULA, EMBARGO, BN |
| K | Notificar a (notif_a) | Parte del ID hex. Cuerpo estampes. Fallback a col D. |
| N | Resultado | Escrita por Lucas (watcher.py) |
| P | N° Solicitud | Parte del ID hex |
| W | **ID hex 16 chars** | **Clave primaria.** Hash de cols A+B+F+K+P. Mayúsculas. |
| X | Códigos detallados | Escrita por Lucas |
| Y-AF | Columnas NOT44-EJE | Fechas, códigos, DRS por etapa (Y-AF) |

**Modelo de filas:** 1 fila = 1 notificado = 1 id_hex = 1 juego de estampes.

## Estados del ciclo de vida de una causa

El archivo `_CAUSA.json` nunca cambia de carpeta — solo cambia el campo `estado` interno.

| Estado | Significado | Quién lo cambia |
|---|---|---|
| `pendiente_validacion` | Marco envió a Receptora con comentario | Max (Enviar a Receptora) |
| `validada` | Lista para ruta (guardado normal de Marco, o Jedi aprobó) | Max (Guardar / validar) |
| `en_ruta` | Marco seleccionó para ruta del día | Max (generar ruta) |
| `resultado_registrado` | Receptora registró resultado en terreno | Lucas (watcher.py) |
| `lista_para_estampe` | Lucas procesó, Mike puede generar | Lucas (watcher.py) |
| `estampada` | Mike generó el .docx | Mike (generar_estampes.py) |
| `boleta_emitida` | Helmuth asignó boleta (ciclo completo) | Max (Darth, futuro) |

### Flujo de guardado
- **"💾 Guardar"** → estado `validada` (lista para ruta, sin pasar por Receptora)
- **"📤 Enviar a Receptora"** → estado `pendiente_validacion` (requiere comentario en Observación)

### Visibilidad por perfil
- **Todos los perfiles** ven todas las causas en el listado general
- **Jedi** tiene pantalla exclusiva "Validar Causas" que filtra `pendiente_validacion`
- **Darth** tiene botón eliminar causa en la tabla

## Tipos de diligencia y estado

| Tipo | Archivos generados | Estado |
|---|---|---|
| BN (Búsqueda Negativa) | 1 .docx | ✅ Operativo |
| BP (Búsqueda Positiva) | 1 .docx | ✅ Operativo |
| NOT44-EJE (Art. 44 Ejecutiva) | 3 .docx separados: BP + NOT44 + RPP/RPF | ✅ Operativo |
| NOT44-ORD (Art. 44 Ordinaria) | 1 .docx (sin CE ni RPP) | ✅ Operativo |
| NP (Notif. Personal) | 1-2 .docx | ⏳ Pendiente (Fase 3) |
| Cédula | 1 .docx | ⏳ Pendiente (Fase 4) |
| Embargo | 1 .docx | ⏳ Pendiente (Fase 4) |

## Sistema de códigos

- **D-codes** (dirección problemática): D01-D11. Sin informante. Conector "puesto que".
- **Q-codes** (quién informa): Q01, Q02, Q03, Q05, Q08, Q09. Compartidos BN/BP/NOT44. Q04/Q06/Q07 eliminados.
- **R-codes** (qué informó, solo BN): R01-R09. Conector "por no ser habido/a".
- **BP01/BP02** (inferidos): Q03/Q05 → BP01, resto → BP02. No se seleccionan en webapp.
- **N44-P/A/C** (entrega copias NOT44): Puerta, Adulto, Conserje.
- **RPP/RPF** (requerimiento): RPP = demandado concurrió, RPF = en rebeldía.

## Conversaciones del proyecto (nombres de agentes)

| Nombre | Módulo | Propósito |
|---|---|---|
| Mike | generar_estampes.py | Motor de reglas y generación de .docx |
| Eleven | webapp.html | Webapp terreno con QR |
| Lucas | watcher.py | Procesamiento JSONs y PDFs |
| Max | app.html | Webapp oficina unificada |
| Will | Redacción jurídica | Revisión de textos legales de estampes |

## Reglas de trabajo

### Generales
- **No reemplazar Excel** como base de datos. Las webapps hablan con Dropbox, no con Excel.
- **No reemplazar** Optiroute, Plataforma Poder Judicial ni la firma digital de Helmuth.
- **Un JSON por causa** en Dropbox (no monolítico). Evita colisiones de escritura.
- **Cada etapa crea su propio archivo JSON** ({id_hex}_{TIPO}.json). Coexisten, no se sobreescriben.
- **ID hex 16 chars mayúsculas** es la clave universal que conecta todo.

### generar_estampes.py (Mike)
- Modo producción: `python generar_estampes.py` (lee Dropbox).
- Modo prueba: `python generar_estampes.py --prueba` (lee `resultados/` local).
- Encabezado usa col D (demandado). Cuerpo usa `_notif_a()` (col K con fallback a D).
- Género se detecta desde primer nombre de notif_a. Sin columna extra en Excel.
- NOT44-EJE genera 3 archivos SEPARADOS (no fusionados). Función `crear_not44_eje_docx()` es legacy.
- Cols Z, AC, AF son exclusivas de Mike (DRS calculados). Lucas no las toca.
- Tests: `python -m pytest` desde la carpeta del proyecto.

### watcher.py (Lucas)
- Ejecutar con `WATCHER.bat` DESPUÉS de subir PDFs al Poder Judicial.
- Dos ciclos cada 30s: `ciclo_json()` (JSONs terreno) + `ciclo_pdf()` (PDFs firmados).
- Lock por id_hex (threading.Lock). Sin SQLite ni estado externo.
- Mueve JSONs a `/procesados/` solo tras éxito del grupo completo.
- PDF workflow: Helmuth mueve PDF a `Firmados/` → Lucas registra → mueve a `Procesados/`.

### webapp.html (Eleven)
- HTML/JS puro. Desplegada en GitHub Pages.
- QR offline: contiene ID hex + datos mínimos codificados.
- `loadCausa()` busca causa en 3 fuentes: INDEX.json → causas.json (legacy) → _CAUSA.json individual. Sin filtro por estado.
- Cada etapa sube su propio JSON. loadCausa() detecta etapa previa en orden: RPP/RPF → NOT44 → BP → BN.
- BP01/BP02 se infieren automáticamente en `pushBPInferido()`.
- CIT-FECHA y CIT-HORA eliminados del sistema. No existen en ningún JSON.

### app.html (Max)
- Login: solo usuario (contraseñas desactivadas para testing). 3 perfiles: Padawan (Marco), Jedi (Receptora), Darth (Helmuth).
- Credenciales Dropbox en localStorage (nunca en código ni GitHub).
- Guardar causa → `{id_hex}_CAUSA.json` directo a `/causas/` en Dropbox.
- Sin `ingreso_watcher.py`. Sin `_INGRESO.json`. Sin `/ingresos/`.
- Carga de causas: descarga INDEX.json (1 petición, ~1.2s) en vez de 428 archivos individuales. Detalle completo se carga bajo demanda con `cargarCausaCompleta(hex)`. `actualizarIndex()` sincroniza INDEX.json al guardar/validar/devolver/generar ruta. `generar_index.py` regenera INDEX.json completo desde cero.
- Pantalla Jedi de validación implementada: Validar (estado → `validada`) y Devolver con comentario (agrega al historial).
- Selección de ruta: checkboxes para causas validadas, genera ruta (estado → `en_ruta`), sube `ruta.json` a `/estados/`.
- Export Optiroute: genera .xlsx con 10 columnas exactas (nombre=ROL, dirección, departamento, extra, comuna=Antofagasta, correo, teléfono, demanda, referencia_pedido, proveedor). Usa SheetJS CDN.
- Notificaciones por perfil: campana con red dot + dropdown. Padawan ve causas devueltas con comentario, Jedi/Darth ven pendientes de validación.
- Formulario físico imprimible: botón Imprimir genera formulario con datos de la causa, QR, checkboxes de fecha/hora/Q/R/D/BP/NOT44/RPP/RPF. @media print oculta la app y muestra solo el formulario. Se puede imprimir desde el formulario de ingreso, desde el listado de causas (cualquier estado) y desde el modal de detalle.
- Vistas actuales: `view-dashboard`, `view-ingreso`, `view-causas`, `view-validacion`, `view-ruta`.

## Pendientes actuales

### Alta prioridad
- `derechos.json`: poblar con tarifas reales + agregar clave `embargo_rpf`.
- Max: pantallas Darth (pagos, cobranza).
- Verificar en producción: causa real en app.html → confirmar CAUSA.json en Dropbox.

### Media prioridad
- Eleven: NOT44-ORD en selector tipo diligencia.
- Mike: 4 claves nuevas BN de Eleven v1.9.4 (R03-tiempo, Q05-calidad, R06 vía D10c, D11+Q).
- Mike: agregar punto seguido al final de las piezas en el estampe. Corregir si ya viene con punto (evitar doble punto).
- Will 2: revisar estampes BP, NOT44-EJE, NOT44-ORD, RPP, RPF, NP, Cédula, Embargo.

### Fase siguiente
- NP, Cédula, Embargo: se implementan al revisar estampes reales con Will.
- Panel Darth: pagos, estados de pago, cobranza.

## Comandos útiles

```bash
# Tests de Mike (generar_estampes.py) — 61/61 tests
cd "C:\Users\hmull\Escritorio\Nueva Maestra"
python -m pytest

# Mike en modo prueba (lee JSONs locales de resultados/, sin Dropbox)
python generar_estampes.py --prueba

# Mike en modo producción (lee JSONs de Dropbox)
python generar_estampes.py

# Abrir webapp terreno (Eleven) en navegador
start https://hmullervega-byte.github.io/notif-judicial/webapp.html

# Abrir webapp oficina (Max) en navegador
start https://hmullervega-byte.github.io/notif-judicial/app.html

# Exportar causas a Dropbox (Marco ejecuta cada tarde)
python exportar.py

# Iniciar watcher (Lucas) — ejecutar DESPUÉS de subir PDFs al PJUD
python watcher.py

# Git push a GitHub Pages (repo: hmullervega-byte/notif-judicial)
cd "C:\Users\hmull\Escritorio\Nueva Maestra\notif-judicial"
git add -A && git commit -m "descripción del cambio"
git push origin main
```
