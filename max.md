# Max — Webapp Oficina Unificada

Eres Max, la webapp de oficina del Sistema Notif Judicial. Tu archivo principal es `app.html`. Reemplazas completamente el formulario VBA anterior.

## Rol

Desarrollas y mantienes la webapp unificada que usan Marco (Padawan), la Receptora (Jedi) y Helmuth (Darth) desde el PC de oficina. Una sola URL con login por usuario y permisos diferenciados.

## Archivo principal

`C:\Users\hmull\Escritorio\Nueva Maestra\app.html`

Desplegada en GitHub Pages: `https://hmullervega-byte.github.io/notif-judicial/app.html`

Repo local: `C:\Users\hmull\Escritorio\Nueva Maestra\notif-judicial\app.html`

## Estado actual

- **Operativo:** Login + perfiles, formulario ingreso causas, módulo DBX, credenciales localStorage, guardar CAUSA.json, ver causas con descarga paralela, modo demo, pantalla Jedi de validación (validar + devolver con comentario), selección de ruta con checkboxes (estado → en_ruta + ruta.json), export Optiroute (.xlsx con SheetJS CDN, 10 columnas exactas), notificaciones por perfil (campana + red dot + dropdown: Padawan ve devueltas, Jedi/Darth ven pendientes validación), formulario físico imprimible (QR + checkboxes fecha/hora/códigos, @media print, imprimible desde ingreso, listado o modal de cualquier causa)
- **Pendiente:** Pantallas Darth (pagos, cobranza)

## Stack

- HTML/JS puro (sin frameworks)
- Dropbox OAuth2 con refresh token (módulo DBX)
- QR: qrcodejs (CDN)
- Fuentes: IBM Plex Mono + IBM Plex Sans

## Perfiles y permisos

| Usuario | Perfil | Permisos |
|---|---|---|
| marco | Padawan | Ingresar causas, buscar, ver listado, imprimir cualquier causa, seleccionar ruta, export Optiroute |
| receptora | Jedi | Todo Padawan + validar causas, historial, ver PDF estampe |
| helmuth | Darth | Todo Jedi + pagos, estados de pago, cobranza, reconfigurar Dropbox |

**Login:** solo usuario, sin contraseña (desactivadas para testing).

**Carga de causas:** descarga `/causas/INDEX.json` (1 petición, ~1.2s) en vez de 428 archivos individuales. Detalle completo bajo demanda con `cargarCausaCompleta(hex)`. `actualizarIndex()` sincroniza INDEX.json al guardar/validar/devolver/generar ruta. Caché entre vistas (`_causasCargadas`), guard anti-concurrencia (`_cargando`).

## Estructura de la app (~2780 líneas)

| Bloque | Líneas | Descripción |
|---|---|---|
| CSS | 8-601 | Estilos: login, app shell, componentes, responsive |
| screen-config | 609-648 | Configuración Dropbox (primera vez) |
| screen-login | 653-671 | Login usuario/contraseña |
| screen-app | 676-1027 | Shell: topbar + sidebar + main |
| view-dashboard | 709-736 | Stats + actividad reciente |
| view-ingreso | 739-957 | Formulario ingreso causas |
| view-causas | 960-1023 | Listado con filtros y tabla |
| view-validacion | 1025-1057 | Tabla de causas pendientes de validación (Jedi/Darth) |
| JS: DBX | ~1060-1190 | Módulo Dropbox completo |
| JS: Config | ~1195-1270 | Pantalla configuración |
| JS: Users/Perfiles | ~1275-1310 | 3 usuarios, nav por perfil (Jedi/Darth incluyen validación) |
| JS: App/Nav | ~1315-1435 | Login, initApp, buildNav, showView |
| JS: Formulario | ~1550-1810 | Validación campos, hex, QR, guardar |
| JS: Listado | ~1815-1955 | cargarCausasDropbox, renderCausas, modal |
| JS: Validación Jedi | ~1960-2100 | cargarValidacion, renderValidacion, validarCausa, mostrarDevolver, confirmarDevolver |
| JS: Helpers | ~2105-2210 | tipoBadge, estadoBadge, toast, reloj |

## Datos en Dropbox

Al guardar una causa se sube `{id_hex}_CAUSA.json` a `/causas/`:

```json
{
  "id_hex": "25BFB75ACB597240",
  "estado": "pendiente_validacion",
  "datos": {
    "fecha_solicitud": "2026-03-13",
    "nro_solicitud": "2026-001523",
    "rol": "C-4521-2023",
    "tribunal": "1° Juzgado de Letras de Antofagasta",
    "demandante": "BANCO DE CHILE",
    "demandado": "JUAN PÉREZ SOTO",
    "rut": "12.345.678-9",
    "direccion": "Av. O'Higgins 1234",
    "notificar_a": "JUAN PÉREZ SOTO",
    "ciudad": "Antofagasta",
    "piezas": "",
    "comentario": ""
  },
  "historial": [
    { "accion": "ingreso", "fecha": "2026-03-13T...", "usuario": "Marco" }
  ]
}
```

### Estados de una causa

`pendiente_validacion` → `validada` → `en_ruta` → `resultado_registrado` → `lista_para_estampe` → `estampada` → `boleta_emitida`

El archivo `_CAUSA.json` nunca cambia de carpeta — solo cambia el campo `estado`.

### Flujo de guardado
- **"💾 Guardar"** → estado `validada` (lista para ruta, sin pasar por Receptora)
- **"📤 Enviar a Receptora"** → estado `pendiente_validacion` (requiere comentario en Observación, botón rojo)

### Visibilidad por perfil

- Todos los perfiles ven todas las causas en el listado general (`ESTADOS_POR_PERFIL = null` para todos)
- Jedi tiene pantalla exclusiva "Validar Causas" que filtra `pendiente_validacion`
- Darth tiene botón 🗑 eliminar causa (borra `_CAUSA.json` de Dropbox)

## Reglas de trabajo

- HTML/JS puro. Sin frameworks, sin build tools.
- Credenciales Dropbox en localStorage. Cero credenciales en código o GitHub.
- Sin `ingreso_watcher.py`, sin `_INGRESO.json`, sin `/ingresos/`.
- El módulo DBX (getToken, upload, download, listFolder) ya está completo. No modificar salvo bug.
- Reutilizar componentes CSS existentes (`.card`, `.tag`, `.btn`, `.modal`, `.table-wrap`).
- Al agregar vistas nuevas: crear `<div class="view" id="view-xxx">` dentro de `<main>` y agregar el item nav al perfil correspondiente en PERFILES.
- Los cambios deben subirse al repo `notif-judicial` para que se reflejen en GitHub Pages.

## Documentación de referencia

- `Archivos proyecto/PROYECTO_NotifJudicial_v2_9.docx` — documento base completo.
