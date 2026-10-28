# Contrato API con POI (Laravel)

Prefijo: `/api/evaluacion/v1` (en POI vive en `routes/api.php`: sin sesión ni CSRF).
JSON en **camelCase**; POI lo mapea a columnas snake_case. Autenticación con token
de dispositivo (`Authorization: Bearer <token>`), salvo el enrolamiento.

> Acordado con el equipo de POI (2026-10-28). La app no cambia su formato; POI se adapta.

## 1. Endpoints

### `POST /dispositivos/enrolar`
Lo usa un administrador una sola vez por teléfono.
```json
// petición
{ "codigoEnrolamiento": "K7P-29X", "modelo": "Redmi 15C", "androidId": "…", "appVersion": "1.0.0" }
// respuesta
{ "dispositivoId": 12, "token": "…", "sucursalId": 4, "sucursal": "Puebla Centro" }
```
- El código se genera en POI (pantalla **Dispositivos**), dura 15 minutos y es de un solo uso.
- Tiene límite de intentos (RateLimiter) para evitar fuerza bruta.
- El token son 64 caracteres hex. POI guarda solo su SHA-256. Se puede revocar (`activo`, `revocado_at`). No expira por tiempo, porque el teléfono es compartido y no tiene login.

### `GET /paquete`
Descarga todo lo necesario para trabajar sin conexión. Usa `If-None-Match`
(ETag = versión) para no descargar de nuevo si no cambió (responde `304`).
```json
{
  "version": "2026-10-21.3",
  "puestos":    [{ "id": 1, "nombre": "Vendedor", "evaluacionVersionId": 7 }],
  "sucursales": [{ "id": 4, "nombre": "Puebla Centro" }],
  "evaluaciones": [{
    "versionId": 7, "codigo": "vendedor-basico", "nombre": "Vendedor — Básico",
    "requierePin": false,
    "pesos": { "resultado": 50, "eficiencia": 20, "tiempo": 15, "independencia": 15, "error": 3, "errorMax": 15, "ayuda": 5 },
    "niveles": [{ "nombre": "Básico", "min": 0 }, { "nombre": "Intermedio", "min": 60 }, { "nombre": "Avanzado", "min": 85 }],
    "tareas": [{ "orden": 0, "practica": true, "peso": 1, "definicion": { } },
               { "orden": 1, "practica": false, "peso": 1, "definicion": { } }]
  }]
}
```
- `puestos[].id` = `personal_puestos.id`; `sucursales[].id` = `sucursales.id` (tablas existentes de POI).
- En POI se asigna una **evaluación** a cada puesto, no una versión. El paquete manda la **última versión publicada** de esa evaluación.
- `definicion` es el JSON de la tarea tal como lo define [01_MODELO_TAREAS.md](01_MODELO_TAREAS.md).
- La app valida el paquete con zod (`src/engine/schema.ts`). Si la forma no coincide, lo rechaza y sigue con el que tenía guardado.
- La evaluación inicial (práctica + 15 tareas) está exportada en [poi/evaluacion-vendedor-basico.json](poi/evaluacion-vendedor-basico.json). POI la carga con un seeder.

### `POST /sync/lote`
Idempotente por UUID: si algo ya existe, se ignora y se reporta como aceptado.
La app manda un intento a la vez, con hasta 500 eventos por lote.
```json
// petición
{
  "participantes": [ { "uuid": "…", "nombre": "…", "apellidos": "…", "puestoId": 1, "sucursalId": 4, "aceptoPrivacidadEn": "…" } ],
  "intentos":      [ { "uuid": "…", "participanteUuid": "…", "evaluacionVersionId": 7, "inicio": "…", "fin": "…", "estado": "terminado", "puntuacion": 78.5, "nivel": "Intermedio", "totalEventos": 312 } ],
  "intentoTareas": [ { "uuid": "…", "intentoUuid": "…", "tareaCodigo": "conect.wifi_conectar", "tareaVersion": 1, "orden": 15, "estado": "completada", "duracionMs": 41200, "acciones": 6, "errores": 0, "ayudas": 1, "puntuacion": 82,
                       "detalle": { "conteo": { "necesaria": 5, "exploracion": 1, "desviacion": 0, "error": 0 }, "hitos": ["…"], "guiada": false, "desglose": { "resultado": 50, "eficiencia": 20, "tiempo": 15, "independencia": 10, "errores": 0 }, "toquesVacios": 0 } } ],
  "eventos":       [ { "uuid": "…", "intentoTareaUuid": "…", "seq": 1, "tRelMs": 0, "tsDispositivo": "…", "tipo": "tarea.inicio", "objetivo": "conect.wifi_conectar", "datos": {}, "clase": null } ]
}
// respuesta
{ "aceptados": { "participantes": ["…"], "intentos": ["…"], "intentoTareas": ["…"], "eventos": ["…"] },
  "intentosCompletos": ["…"] }
```
- `participantes[].sucursalId` puede ser `null`.
- `intentosCompletos` = intentos cuyo `totalEventos` ya coincide con lo recibido. Solo entonces el teléfono borra esos datos.
- **Recálculo:** POI recalcula la puntuación de cada tarea con su `definicion` y el `detalle`, sin repetir los eventos. Usa la misma fórmula que `src/engine/scoring.ts` (`scoreTask`, `scoreEvaluation`, `levelFor`, redondeo a 1 decimal). Guarda la puntuación de la app y la suya. Si difieren más de 0.5, marca el intento para revisión.

## 2. Tablas MySQL (prefijo `evaluacion_`)

Columnas JSON con `cast` a array (sin sufijo `_json`).

| Tabla | Contenido |
|---|---|
| `evaluacion_dispositivos` | id, sucursal_id, modelo, android_id, app_version, token_hash, activo, revocado_at, ultimo_contacto |
| `evaluacion_codigos_enrolamiento` | codigo, sucursal_id, expira_en, usado_en |
| `evaluacion_tareas` | codigo, version, definicion, activa — único (codigo, version) |
| `evaluacion_evaluaciones` | codigo, nombre, descripcion |
| `evaluacion_versiones` | evaluacion_id, version, pesos, niveles, requiere_pin, publicada_en |
| `evaluacion_version_tareas` | evaluacion_version_id, tarea_id, orden, peso, practica |
| `evaluacion_puesto_evaluacion` | puesto_id → `personal_puestos`, evaluacion_id |
| `evaluacion_participantes` | uuid, nombre, apellidos, puesto_id, sucursal_id, acepto_privacidad_en |
| `evaluacion_intentos` | uuid, participante_id, dispositivo_id, evaluacion_version_id, inicio, fin, estado, puntuacion_app, puntuacion_poi, nivel, requiere_revision, total_eventos |
| `evaluacion_intento_tareas` | uuid, intento_id, tarea_id, orden, estado, duracion_ms, acciones, errores, ayudas, puntuacion_app, puntuacion_poi, detalle |
| `evaluacion_eventos` | uuid (único), intento_tarea_id, seq, t_rel_ms, ts_dispositivo, tipo, objetivo, datos, clase — único (intento_tarea_id, seq) |

(Los nombres finales pueden variar ligeramente; manda el código de POI.)

Una versión de evaluación publicada **no se edita**: los cambios crean una versión
nueva. Así los resultados antiguos siempre se pueden explicar con las reglas que se usaron.

## 3. Pantallas en POI (módulo `evaluacion`)

Permisos: `evaluacion.view`, `evaluacion.manage`, `evaluacion.dispositivos`.

1. **Resultados:** lista de intentos con filtros (fecha, sucursal, puesto, nivel).
2. **Detalle de intento:** puntuación de la app y de POI, nivel y tabla de tareas con su desglose.
3. **Línea de tiempo de tarea:** eventos en orden (hora, acción, clase coloreada, ayudas y "mostrarme") y comparación contra la ruta óptima.
4. **Dispositivos:** generar código de enrolamiento, desactivar y ver el último contacto.
5. **Catálogo** (pendiente): editar evaluaciones, versiones, tareas y asignación por puesto. Por ahora se carga con seeder.

## 4. Pendientes

- **Privacidad (LFPDPPP):** POI guarda nombre y apellidos de los candidatos. Falta definir el aviso, el plazo de retención y quién puede consultarlos.
