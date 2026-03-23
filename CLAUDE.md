# Sistema Notif Judicial — Receptoría Antofagasta

## Contexto

Receptoría judicial en Antofagasta, Chile. Automatiza el proceso completo de notificaciones judiciales: desde ingreso de causas hasta generación de estampes Word, pasando por registro en terreno con webapp móvil QR. Volumen: +60 diligencias diarias, ~600 estampes/mes.

**Equipo:** Helmuth (propietario/Darth), Receptora abogada (Jedi), Marco administrativo (Padawan), Administrativos 2 y 3 (estampes + subida PJUD).

## REGLA CRÍTICA DE DESARROLLO

- **TODOS los cambios van SOLO en dev.html y webapp_dev.html**
- **NUNCA modificar app.html ni webapp.html directamente**
- app.html y webapp.html son PRODUCCIÓN — Marco y la Receptora trabajan en ellos
- Solo cuando Helmuth diga explícitamente "pasa dev a app" o "pasa webapp_dev a webapp", recién actualizar producción
- Después de CADA cambio hacer commit y push a GitHub Pages
- Si hay duda sobre si un cambio va en dev o producción, siempre elegir dev
- Siempre hacer `git push origin main` después de commits, sin preguntar
- **panel_darth.html NO va en GitHub Pages** — está en .gitignore, es herramienta local de Helmuth

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

MÓDULO 5 (Panel Darth)
panel_darth.html         ← archivo LOCAL, no GitHub Pages
Cobranza y facturación   ← solo Helmuth
→ EP-*.json en /estados_pago/
```

La columna vertebral es **Dropbox** (`/Apps/notif-judicial/`). Excel es registro histórico.

| Componente | Tecnología |
|---|---|
| Base de datos activa | Dropbox JSON (1 archivo por causa) |
| Base de datos histórica | Excel (`BaseDatos.xlsx`, hoja `BaseDatos`) |
| Webapp oficina (Max) | HTML/JS puro, GitHub Pages |
| Webapp terreno (Eleven) | HTML/JS puro, PWA instalable, GitHub Pages |
| Panel cobranza (Darth) | HTML/JS puro, archivo LOCAL |
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
| `panel_darth.html` | Darth (M5) | Panel cobranza **LOCAL**. NO va en GitHub. En .gitignore. |
| `manifest.json` | PWA | Manifest producción (webapp.html) |
| `manifest_dev.json` | PWA | Manifest desarrollo (webapp_dev.html) |
| `sw.js` | PWA | Service Worker producción — cachea webapp.html |
| `sw_dev.js` | PWA | Service Worker desarrollo — cachea webapp_dev.html |
| `jsqr.min.js` | Eleven | jsQR 1.4.0 descargado localmente (sin CDN) |
| `Logo_pjud.png` | PWA/Mike | Logo Poder Judicial (icono PWA + encabezado estampes) |
| `.gitignore` | Repo | Excluye panel_darth.html |

### Raíz: `C:\Users\hmull\Escritorio\Nueva Maestra\`

| Archivo | Módulo | Descripción |
|---|---|---|
| `generar_estampes.py` | Mike (M3) | Generador de estampes. Lee JSONs Dropbox, cruza con Excel, genera .docx. |
| `watcher.py` | Lucas (M4) | Polling Dropbox + escaneo PDFs firmados. Escribe cols N,X,Y,AA,AB,AD,AE en Excel. |
| `generar_index.py` | Soporte | Regenera 4 índices desde todos los `_CAUSA.json` en Dropbox. |
| `importar_excel.py` | Soporte | Importación Excel → Dropbox. Cols A-Y. Genera _CAUSA.json + ejecuta generar_index.py. |
| `importar_excel.bat` | Soporte | Lanza importar_excel.py con doble-click. |
| `migrar_facturacion_v2.py` | Soporte | Migra bloque facturacion en causas existentes. |
| `recalcular_id.py` | Soporte | Recalcula id_hex de causas con fórmula antigua (5 campos → 6 campos). |
| `borrar_causas.py` | Soporte | Borra todos los _CAUSA.json de /causas/ (con confirmación). |
| `autorizar_dropbox.py` | Soporte | Genera tokens OAuth2 para Dropbox Scoped App. |
| `BaseDatos.xlsx` | Central | Base de datos Excel, hoja `BaseDatos`. Col W = ID hex 16 chars. |
| `derechos.json` | Mike | Tarifas de derechos por estudio/demandante. |
| `dropbox_token.json` | Soporte | Credenciales Dropbox. NO subir a GitHub. |

## Dropbox — Estructura

```
causas/                          ← PRODUCCIÓN
  {id_hex}_CAUSA.json            ← 1 archivo por causa (~1167 causas)
  INDEX.json                     ← TODAS las causas, campos básicos (~1167, ~716KB)
  INDEX_RUTA.json                ← Solo causas en_ruta/gestion_directa para Eleven (~86, ~45KB)
  INDEX_COMPLETO.json            ← TODAS las causas, todos los campos + facturacion + historial (~1167, ~1.3MB)
  INDEX_RESPALDO.json            ← Copia de INDEX_COMPLETO.json (compatibilidad)

causas-dev/                      ← DESARROLLO
  (misma estructura de índices)

resultados/                      ← PRODUCCIÓN
  {id_hex}_BN.json               ← Eleven sube desde terreno
  {id_hex}_BP.json
  {id_hex}_NOT44.json
  {id_hex}_RPP.json / _RPF.json
  procesados/                    ← Lucas mueve aquí tras procesar

resultados-dev/                  ← DESARROLLO
  (misma estructura)

estados_pago/                    ← PRODUCCIÓN — Estados de pago (Panel Darth)
  EP-2026-001.json               ← Un archivo por estado de pago
  EP-2026-002.json

estados_pago-dev/                ← DESARROLLO

estados/
  ruta.json                      ← Última ruta generada
```

## Sistema de 4 índices

| Índice | Contenido | Usado por | Actualizado por |
|---|---|---|---|
| `INDEX.json` | TODAS las causas (~1167), campos básicos sin historial ni facturacion | Max (app.html/dev.html) | Max al guardar/validar/devolver + generar_index.py |
| `INDEX_RUTA.json` | Solo causas en_ruta y gestion_directa_receptora | Eleven (webapp.html) | Max al generar ruta / cambiar estado + generar_index.py |
| `INDEX_COMPLETO.json` | TODAS las causas con todos los campos + facturacion + historial | Panel Darth | generar_index.py |
| `INDEX_RESPALDO.json` | Copia de INDEX_COMPLETO.json | Compatibilidad temporal | generar_index.py |

### Escritura segura de INDEX.json (race condition)

Helmuth y Marco trabajan simultáneamente. Para evitar pérdida de datos al escribir INDEX.json:
- Descargar INDEX.json con `rev` de Dropbox
- Modificar SOLO la entrada de la causa afectada
- Subir con `mode: update(rev)` — si hay conflicto, Dropbox rechaza
- Reintentar hasta 3 veces con espera incremental
- Si 3 conflictos seguidos → fallback a overwrite
- Red de seguridad: ejecutar `generar_index.py` al final del día

INDEX_RUTA.json NO necesita escritura segura — se regenera completo cuando Marco genera ruta o Darth cambia estado a en_ruta/gestion_directa.

## Dos fechas distintas

| Campo | Significado | Quién la llena | Cuándo |
|---|---|---|---|
| `datos.fecha_diligencia` | Día que la Receptora hizo la diligencia en terreno | Eleven (Receptora) | Al registrar resultado |
| `datos.fecha_ruta` | Día que Marco puso la causa en ruta | Max (Marco/Darth) | Al generar ruta o al cambiar estado a en_ruta |

En causas importadas históricamente, `fecha_diligencia` viene de la columna M del Excel. Al cambiar estado a `en_ruta` o `gestion_directa_receptora` desde el modal de edición, aparece un campo de fecha inline (default hoy) para capturar `fecha_ruta`.

## Estructura completa de un _CAUSA.json

```json
{
  "id_hex": "B0CD29F7CD9A2164",
  "estado": "cerrada",
  "datos": {
    "rol": "C-191-2026",
    "tribunal": "4° Juzgado de Letras de Antofagasta",
    "demandante": "PROMOTORA CMR FALABELLA S.A",
    "demandado": "MAGDALENA DEL CARMEN SALAS CANET",
    "rut": "18.929.667-3",
    "direccion": "SALVADOR REYES 839 DEPT 29",
    "ciudad": "Antofagasta",
    "monto_mandamiento": "602595",
    "tipo_diligencia": "NOT-DEMANDA-EJE-GENERAL",
    "piezas": "de la demanda ejecutiva y la resolución...",
    "notificar_a": "MAGDALENA DEL CARMEN SALAS CANET",
    "fecha_solicitud": "2026-01-20",
    "fecha_diligencia": "2026-01-24",
    "fecha_ruta": "",
    "estudio_juridico": "Agecob",
    "nro_solicitud": "3590",
    "derechos": "5500",
    "boleta": "2985; 2986; 2987; 2988; 2989; 2990",
    "observacion": "",
    "resultado": "BN",
    "abogado_procurador": "",
    "banco_representado": "",
    "nro_pagare": ""
  },
  "facturacion": {
    "estado": "pendiente",
    "id_estado_pago": null
  },
  "historial": [
    {
      "accion": "importacion_historica",
      "fecha": "2026-03-22T01:39:41",
      "usuario": "sistema",
      "resultado": "BN",
      "estado_origen": "Listo"
    }
  ]
}
```

### Campos obligatorios en datos (todos string)

Al guardar causa nueva desde Max, TODOS estos campos deben existir con valor vacío por defecto:
`rol`, `tribunal`, `demandante`, `demandado`, `rut`, `direccion`, `ciudad`, `monto_mandamiento` (siempre string), `tipo_diligencia`, `piezas`, `notificar_a`, `fecha_solicitud`, `fecha_diligencia`, `fecha_ruta`, `estudio_juridico`, `nro_solicitud`, `derechos`, `boleta`, `observacion`, `resultado`, `abogado_procurador`, `banco_representado`, `nro_pagare`

NO usar campo `comentario` — usar `observacion`.

### Bloque facturacion

Solo se crea cuando Darth cierra una causa. Dos campos:
- `estado`: "pendiente" (por cobrar), "cobrada" (asignada a un EP), "sin_cobro" (suspendida)
- `id_estado_pago`: null o "EP-2026-NNN"

Causas activas (validada, en_ruta, etc.) NO tienen bloque facturacion.

## Sistema de facturación — Estados de Pago (EP)

### Modelo de negocio
- La unidad de cobro es el **Estado de Pago (EP)**, no la causa individual
- Un EP agrupa muchas causas del mismo cliente (ej: 100 diligencias de Agecob = 1 EP por $2.000.000)
- Un EP puede tener múltiples boletas (el cliente decide cuántas y de qué montos)
- A veces un EP tiene 1 sola causa con 1 sola boleta (clientes particulares)
- El monto total del EP = suma de datos.derechos de cada causa incluida
- Si pasan >45 días desde la última boleta sin pago → entrar en cobranza

### Estructura EP-YYYY-NNN.json

```json
{
  "id": "EP-2026-001",
  "fecha_emision": "2026-03-22",
  "cliente": "Agecob",
  "dirigido_a": "Juan Pérez, procurador",
  "causas": ["B0CD29F7CD9A2164", "72A7CDFCB28A4D2B"],
  "monto_total": 2000000,
  "boletas": [
    {"numero": "2985", "monto": 350000, "fecha": "2026-03-16"},
    {"numero": "2986", "monto": 300000, "fecha": "2026-03-16"}
  ],
  "estado": "boletas_completas",
  "pago": {
    "pagado": false,
    "fecha_pago": null,
    "forma_pago": null,
    "observacion": ""
  }
}
```

### Estados del EP
- `borrador` → creado, se pueden agregar/quitar causas
- `emitido` → enviado al cliente
- `pendiente_boletas` → suma boletas < monto_total
- `boletas_completas` → suma boletas = monto_total
- `pagado` → cliente pagó
- `incobrable` → se decidió no cobrar

### Panel Darth (panel_darth.html)
- Archivo LOCAL, se abre con doble-click
- Credenciales Dropbox en localStorage (separadas de GitHub Pages)
- 4 pestañas: Causas por cobrar, Estados de Pago, Resumen, Morosos
- Genera documento estado de pago imprimible (HTML → Ctrl+P → PDF)

## Usuarios y perfiles

| Usuario | Perfil | Rol |
|---|---|---|
| `macosta` | Padawan (Marco) | Ingreso causas, generar ruta, exportar |
| `mcarreño` | Jedi (Receptora) | Validar causas, gestión directa, terreno |
| `hmuller` | Darth (Helmuth) | Todo + cambiar estados, reabrir, suspender, eliminar, cobranza |

## Estados de causas (flujo)

```
pendiente_validacion → validada → en_ruta →
resultado_registrado → cerrada (+ facturacion.estado = "pendiente")
```

Estados especiales: `gestion_directa_receptora`, `devuelta`, `suspendida`, `id_repetida`, `revision_darth`, `pendiente_estado`

| Estado | Significado | Quién lo cambia |
|---|---|---|
| `pendiente_validacion` | Marco envió a Receptora | Max (Enviar a Receptora) |
| `validada` | Lista para ruta | Max (Guardar / Jedi valida) |
| `en_ruta` | Marco seleccionó para ruta del día | Max (generar ruta) |
| `resultado_registrado` | Receptora registró resultado en terreno | Lucas (watcher.py) |
| `cerrada` | Causa cerrada — se crea bloque facturacion automáticamente | Max (Darth) |
| `devuelta` | Jedi devolvió a Marco para corrección | Max (Jedi) |
| `suspendida` | Causa suspendida con motivo | Max (botón Suspender) |
| `id_repetida` | Causa con ID hex duplicado | Max (auto) / importar_excel.py |
| `revision_darth` | Marco intentó guardar causa con ID duplicada | Max → Darth |
| `gestion_directa_receptora` | Diligencia sin ruta (embargo CBR, etc.) | Max |
| `pendiente_estado` | Importada sin estado claro — Darth asigna | importar_excel.py |

**Estados eliminados (2026-03-22):** `lista_para_estampe`, `estampada`, `boleta_emitida` — causas con esos estados se migran automáticamente a `pendiente_estado` al cargar.

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
| `revision_darth` | Si | No | No |
| `id_repetida` | Si | No | No |
| `pendiente_estado` | Si | No | No |
| `validada` | Si | Si | Si |
| `en_ruta` | Si | Si | Si |
| `gestion_directa_receptora` | Si | Si | Si |
| `resultado_registrado` | Si | Si | Si |

### Características PWA
- PWA instalable en Android (manifest.json, service worker)
- Service Worker: Stale While Revalidate para archivos estáticos
- jsqr.min.js guardado localmente (sin CDN externo)
- Google Fonts cargadas async (no bloquean render)
- INDEX_RUTA.json cacheado en localStorage (TTL 2h) — solo causas en ruta, muy liviano
- Carga QR instantánea desde caché local (<200ms)
- Modo offline: pendientes en localStorage, sync al recuperar señal
- Indicador conexión: punto verde/naranja en header
- Fallback QR: si id_hex no está en INDEX_RUTA, descarga _CAUSA.json individual de Dropbox

### Edición desde terreno
- Receptora puede editar ROL, Tribunal, Demandado, RUT, Notificar a, Dirección
- Escribe en /causas-dev/ (dev) o /causas/ (prod)
- Historial: `{accion: 'edicion_terreno', campos_modificados, usuario: 'receptora'}`

## Tipos de gestión directa (no van en ruta)

ALZAMIENTO-CBR, ALZAMIENTO-RVM, ALZAMIENTO-TESORERIA, ALZAMIENTO-OTROS, EMBARGO-CBR, EMBARGO-CUENTA-CORRIENTE, EMBARGO-FRUSTRADO, EMBARGO-OTROS, EMBARGO-RVM, EMBARGO-TESORERIA, PRUEBA-CONFESIONAL, PRUEBA-TESTIMONIAL, REQ-PAGO-TRIBUNAL, OPOS-RETIRO

## Sistema de códigos

- **D-codes** (dirección problemática): D01-D11. Sin informante. Conector "puesto que".
- **Q-codes** (quién informa): Q01, Q02, Q03, Q05, Q08, Q09. Compartidos BN/BP/NOT44.
- **R-codes** (qué informó, solo BN): R01-R09. Conector "por no ser habido/a".
- **BP01/BP02** (inferidos): Q03/Q05 → BP01, resto → BP02. No se seleccionan en webapp.
- **N44-P/A/C** (entrega copias NOT44): Puerta, Adulto, Conserje.
- **RPP/RPF** (requerimiento): RPP = concurrió, RPF = en rebeldía. Solo fecha y hora.

## Fórmula ID hex (clave universal)

`SHA256(ROL + Tribunal + Dirección + NotificarA + N°Solicitud + TipoDiligencia)[:16].upper()` — **6 campos**.

Historia: Originalmente 5 campos (sin TipoDiligencia). Cambió a 6 campos el 22/03/2026 para permitir múltiples diligencias de distinto tipo con IDs diferentes.

## Base de datos Excel — columnas clave

| Col | Campo | Notas |
|---|---|---|
| A | ROL | Parte del ID hex |
| B | Tribunal | Parte del ID hex |
| D | Demandado | Encabezado estampes |
| F | Dirección | Parte del ID hex |
| I | Tipo Notificación | Parte del ID hex |
| K | Notificar a (notif_a) | Parte del ID hex. Cuerpo estampes. Fallback a col D. |
| M | Fecha diligencia | Fecha real de la diligencia en terreno |
| N | Resultado | Escrita por Lucas |
| P | N° Solicitud | Parte del ID hex |
| W | **ID hex 16 chars** | **Clave primaria.** Hash de 6 campos. Mayúsculas. |

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
- **monto_mandamiento siempre STRING** — nunca número.
- **Usar "observacion", nunca "comentario"** como nombre de campo.

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
- Escribe columnas N,X,Y,AA,AB,AD,AE en Excel (NUNCA Z,AC,AF que son de Mike).

### app.html / dev.html (Max)
- Login: solo usuario (3 perfiles). Credenciales Dropbox en localStorage.
- Guardar causa → `{id_hex}_CAUSA.json` directo a Dropbox.
- INDEX.json ahora tiene TODAS las causas (1167) — escritura segura con rev + retry x3 + fallback overwrite.
- Filtro estado default "Solo activas" (oculta cerrada, suspendida, id_repetida). Dropdown permite ver todos o por estado.
- Al generar ruta → regenera INDEX_RUTA.json completo y lo sube a Dropbox.
- Al cerrar causa → crea bloque facturacion automáticamente.
- Al cambiar estado a en_ruta/gestion_directa → campo fecha_ruta inline en modal, regenera INDEX_RUTA.json.
- Darth puede editar Resultado, Derechos ($) y N° Boleta desde el modal de edición.
- Verificación de integridad en dashboard: compara causas.length vs archivos _CAUSA.json en Dropbox.
- dev.html usa `/causas-dev/`, app.html usa `/causas/`.
- Formulario físico imprimible (3 hojas) con QR, checkboxes, timbre base64.
- Vistas: dashboard, ingreso, causas, validación, ruta.
- Tabla Mis Causas columnas: ☑ | ROL | T | Demandante | Demandado | Dirección | Tipo | F.Diligencia | Resultado | Estado | ID | Acc.
- Columnas redimensionables (resize:horizontal en headers). Tribunal abreviado (1°, 2°, Familia, C. Apelaciones).
- Modal detalle (solo lectura): max-width 700px, incluye F. DILIGENCIA y F. RUTA (DD/MM/YYYY), Resultado, N° Boleta.
- Modal edición: tribunal matching robusto por abreviatura (normalizarTribunal), campos Darth-only.
- Auto-migración al cargar: causas con estados obsoletos → `pendiente_estado`.
- `normalizarTribunal()`: parsea "1°", "1 Juzgado...", "Primer", "Familia", "C. Apelaciones", "Apel.(Prot.)".

### webapp.html / webapp_dev.html (Eleven)
- PWA HTML/JS puro. jsQR local.
- Carga INDEX_RUTA.json (solo causas en ruta) — mucho más liviano que INDEX_COMPLETO.
- Cachea en localStorage con TTL 2h.
- Si INDEX_RUTA vacío → "No hay causas en ruta".
- Fallback QR: si id_hex no está en INDEX_RUTA, descarga _CAUSA.json individual.
- webapp_dev.html usa `/causas-dev/` y `/resultados-dev/`.
- webapp.html usa `/causas/` y `/resultados/`.

### panel_darth.html (Panel Darth)
- Archivo LOCAL — NO va en GitHub Pages, está en .gitignore.
- Se abre con doble-click desde la carpeta notif-judicial.
- Credenciales Dropbox propias en localStorage (separadas de GitHub Pages).
- Carga INDEX_COMPLETO.json + EP-*.json de /estados_pago/.
- 4 pestañas: Causas por cobrar, Estados de Pago (con detalle), Resumen, Morosos.
- Genera documento estado de pago imprimible (HTML → Ctrl+P → PDF).

## Conversaciones del proyecto (nombres de agentes)

| Nombre | Módulo | Propósito |
|---|---|---|
| Mike | generar_estampes.py | Motor de reglas y generación de .docx |
| Eleven | webapp.html | Webapp terreno con QR |
| Lucas | watcher.py | Procesamiento JSONs y PDFs |
| Max | app.html | Webapp oficina unificada |
| Will | Redacción jurídica | Revisión de textos legales de estampes |

## Importación histórica (importar_excel.py)

- Script: `importar_excel.py` + `importar_excel.bat` en `C:\Users\hmull\Escritorio\Nueva Maestra\`
- Lee Excel sin fila de encabezado, columnas A-Y
- Columnas: A=ROL, B=Tribunal, C=Demandante, D=Demandado, E=RUT, F=Dirección, G=Ciudad, H=Monto, I=Tipo Diligencia, J=Piezas, K=Notificar a, L=Fecha Solicitud, M=Fecha Diligencia, N=Resultado, O=Estudio, P=N°Solicitud, Q=Derechos, R=Boleta, S=ignorar, T=Observación, U=Estado, V=Abogado/Procurador, W=Banco Representado, X=N°Pagaré/Operación, Y=Motivo Suspensión
- Lógica de estados: Col U="Listo"→cerrada, Col U="N/A"→suspendida, Col I en gestión directa→gestion_directa_receptora, otro→pendiente_estado
- Agrega bloque facturacion automáticamente según estado
- No sobrescribe causas existentes por defecto (flag --forzar para sobrescribir)
- Al final ejecuta generar_index.py para regenerar los 4 índices
- Última importación: 22/03/2026, 1150 causas + 17 ingresadas por Marco = 1167 total

## Detección de duplicados (app.html / dev.html)

- **ID exacta duplicada:** Al guardar causa nueva, si el id_hex ya existe → modal bloqueante con comparación lado a lado + motivo obligatorio (min 10 chars) → guarda con estado `revision_darth` usando ID único con timestamp. Darth aprueba (→ validada) o rechaza (→ elimina) desde vista Validar Causas.
- **Diligencia similar:** Si mismos 5 campos (ROL+Tribunal+Dirección+NotificarA+Tipo) pero distinto N°Solicitud → modal de advertencia no bloqueante con datos de la causa existente → botón "Guardar de todas formas" continúa guardado normal.

## Estudios jurídicos

Agecob, BanPro, CG Cobranzas Generales, Conseil, Dell'Oro Abogados, Exhortos Frias, Exhortos Chile, Mellado y Cia, Recsa, Servicobranza, Socofin, Zapico, TURNO, PARTICULAR

## Bancos representados

Banco Internacional, Scotiabank, Banco Itaú

## Tribunales

1° Juzgado de Letras de Antofagasta, 2° Juzgado de Letras de Antofagasta, 3° Juzgado de Letras de Antofagasta, 4° Juzgado de Letras de Antofagasta, Juzgado de Familia de Antofagasta, Corte de Apelaciones de Antofagasta, Apelación (Protección) de Antofagasta

## Pendientes importantes

### Alta prioridad
- `derechos.json`: poblar con tarifas reales + agregar clave `embargo_rpf`
- Lucas (watcher.py): activar cuando flujo completo esté estable
- ~208 causas en `pendiente_estado`: Helmuth debe clasificar manualmente (caso a caso)
- Darth: registrar resultado/derechos/boleta en causas cerradas importadas (puede hacerlo desde modal edición)

### Media prioridad
- Marcha blanca Fase 2: NOT44 y NP
- Will: revisar textos D02, D05, D07, D08, D09
- Will: revisar NOT44 real con textos de la Receptora
- FreeFileSync: configurar modo Mirror con papelera local + RealTimeSync automático
- Mike: agregar punto seguido al final de las piezas en el estampe

### Fase siguiente
- NP, Cédula, Embargo: implementar en Mike al revisar estampes con Will
- Automatización PJUD: Script Python con Selenium (pendiente análisis legal)

### Completados (sesión 23/03/2026)
- ✅ Panel Darth (panel_darth.html) — 4 pestañas: Causas por cobrar, Estados de Pago, Resumen, Morosos
- ✅ Importación histórica — 1150 causas importadas + 17 ingresadas = 1167 total
- ✅ INDEX.json ahora incluye TODAS las causas (antes excluía cerrada/suspendida)
- ✅ Bloque facturacion se crea automáticamente al cerrar causa
- ✅ Filtro "Solo activas" por defecto en tabla Mis Causas
- ✅ Darth puede editar resultado, derechos, boleta desde modal
- ✅ Campo fecha_ruta inline al cambiar estado a en_ruta
- ✅ Verificación integridad Dropbox en dashboard
- ✅ Tribunal abreviado, columna F.Ruta eliminada, columnas redimensionables
- ✅ RUT visible en modal detalle y edición (fix sync cargarCausaCompleta)

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

# Regenerar los 4 índices desde Dropbox
python generar_index.py

# Importar causas históricas desde Excel
python importar_excel.py

# Borrar todas las causas de Dropbox (con confirmación)
python borrar_causas.py

# Recalcular IDs de causas en carpeta local
python recalcular_id.py

# Claude Code sin preguntas de permisos
claude --dangerously-skip-permissions
```
