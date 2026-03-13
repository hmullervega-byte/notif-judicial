# Sistema Notif Judicial

Sistema digital para automatizar notificaciones judiciales — Receptoría Judicial, Antofagasta, Chile.

## Webapps

### app.html — Oficina (Max)

Webapp unificada para el equipo de oficina. Una sola URL con login por usuario y permisos diferenciados.

**Perfiles:**
- **Padawan** (Marco): ingreso de causas, selección de ruta, export Optiroute, formulario imprimible
- **Jedi** (Receptora): validación de causas, historial
- **Darth** (Helmuth): todo Jedi + configuración Dropbox

**Funcionalidades:**
- Formulario de ingreso con generación automática de ID hex y QR
- Listado de causas con filtros y búsqueda
- Validación Jedi: aprobar o devolver causas con comentario
- Selección de ruta: checkboxes + generación de ruta + export Optiroute (.xlsx)
- Notificaciones por perfil (campana con red dot)
- Formulario físico imprimible con QR y checkboxes para terreno
- Sincronización con Dropbox (credenciales en localStorage)

### webapp.html — Terreno (Eleven)

Webapp móvil para la Receptora en terreno. Escanea QR de formularios físicos y registra resultados de diligencias.

**Funcionalidades:**
- Escáner QR con cámara del celular (BarcodeDetector + jsQR fallback)
- Selección de códigos: D (dirección), Q (informante), R (qué informó)
- Soporte multi-etapa: BN, BP, NOT44, RPP, RPF
- Detección automática de etapa previa
- BP inferido automáticamente
- Envío de JSON a Dropbox por etapa

## Stack

- HTML/JS puro (sin frameworks)
- Dropbox API (OAuth2 con refresh token)
- QR: qrcodejs (generación) + jsQR/BarcodeDetector (lectura)
- SheetJS (export Optiroute .xlsx)
- Desplegado en GitHub Pages

## Módulos del sistema completo

Este repo contiene las webapps. El sistema completo incluye además:

| Módulo | Ubicación | Descripción |
|---|---|---|
| generar_estampes.py (Mike) | PC oficina | Genera estampes Word desde JSONs + Excel |
| watcher.py (Lucas) | PC oficina | Procesa JSONs de terreno y PDFs firmados |
| exportar.py | PC oficina | Exporta causas del Excel a Dropbox |
| BaseDatos.xlsx | PC oficina | Base de datos central |
