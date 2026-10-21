# Contrato API con POI (Laravel)

Prefijo: `/api/evaluacion/v1`. JSON. Autenticación con token de dispositivo
(`Authorization: Bearer <token>`), salvo el enrolamiento.

## 1. Endpoints

### `POST /dispositivos/enrolar`
Lo usa un administrador una sola vez por teléfono.
```json
// petición
{ "codigoEnrolamiento": "K7P-29X", "modelo": "Redmi 15C", "androidId": "…", "appVersion": "1.0.0" }
// respuesta
{ "dispositivoId": 12, "token": "…", "sucursalId": 4, "sucursal": "Puebla Centro" }
```
El código de enrolamiento se genera en POI, dura 15 minutos y es de un solo uso.

### `GET /paquete`
Descarga todo lo necesario para trabajar sin conexión. Usa `If-None-Match`
(ETag = versión) para no descargar de nuevo si no cambió.
```json
{
  "version": "2026-10-21.3",
  "puestos":    [{ "id": 1, "nombre": "Vendedor", "evaluacionVersionId": 7 }],
  "sucursales": [{ "id": 4, "nombre": "Puebla Centro" }],
  "evaluaciones": [{
    "versionId": 7, "codigo": "vendedor-basico", "nombre": "Vendedor — Básico",
    "requierePin": false, "pesos": { "resultado": 50, "eficiencia": 20, "tiempo": 15, "independencia": 15, "error": 3 },
    "niveles": [{ "nombre": "Básico", "min": 0 }, { "nombre": "Intermedio", "min": 60 }, { "nombre": "Avanzado", "min": 85 }],
    "tareas": [{ "orden": 0, "practica": true, "definicion": { } },
               { "orden": 1, "peso": 1, "definicion": { } }]
  }]
}
```

### `POST /sync/lote`
Idempotente por UUID: si algo ya existe, se ignora y se reporta como aceptado.
```json
// petición
{
  "participantes": [ { "uuid": "…", "nombre": "…", "apellidos": "…", "puestoId": 1, "sucursalId": 4, "aceptoPrivacidadEn": "…" } ],
  "intentos":      [ { "uuid": "…", "participanteUuid": "…", "evaluacionVersionId": 7, "inicio": "…", "fin": "…", "estado": "terminado", "puntuacion": 78.5, "nivel": "Intermedio", "totalEventos": 312 } ],
  "intentoTareas": [ { "uuid": "…", "intentoUuid": "…", "tareaCodigo": "conect.wifi_activar", "tareaVersion": 1, "estado": "completada", "duracionMs": 41200, "acciones": 6, "errores": 0, "ayudas": 1, "puntuacion": 82 } ],
  "eventos":       [ { "uuid": "…", "intentoTareaUuid": "…", "seq": 1, "tRelMs": 0, "tsDispositivo": "…", "tipo": "tarea.inicio", "objetivo": "conect.wifi_activar", "datos": {}, "clase": null } ]
}
// respuesta
{ "aceptados": { "participantes": ["…"], "intentos": ["…"], "intentoTareas": ["…"], "eventos": ["…"] },
  "intentosCompletos": ["…"] }
```
`intentosCompletos` = intentos cuyo `totalEventos` ya coincide con lo recibido.
Solo entonces el teléfono borra esos datos.

POI **recalcula** la puntuación con los eventos y la guarda junto a la del
teléfono; si difieren, se marca para revisión.

## 2. Tablas MySQL (prefijo `ev_`)

| Tabla | Contenido |
|---|---|
| `ev_dispositivos` | id, sucursal_id, modelo, android_id, token_hash, activo, ultimo_contacto |
| `ev_codigos_enrolamiento` | codigo, sucursal_id, expira_en, usado_en |
| `ev_tareas` | codigo, version, definicion_json, activa |
| `ev_evaluaciones` | codigo, nombre, descripcion |
| `ev_evaluacion_versiones` | evaluacion_id, version, pesos_json, niveles_json, requiere_pin, publicada_en |
| `ev_evaluacion_tareas` | evaluacion_version_id, tarea_id, orden, peso, practica |
| `ev_puesto_evaluacion` | puesto_id, evaluacion_version_id |
| `ev_participantes` | uuid, nombre, apellidos, puesto_id, sucursal_id, acepto_privacidad_en |
| `ev_intentos` | uuid, participante_id, dispositivo_id, evaluacion_version_id, inicio, fin, estado, puntuacion_app, puntuacion_poi, nivel |
| `ev_intento_tareas` | uuid, intento_id, tarea_id, orden, estado, duracion_ms, acciones, errores, ayudas, puntuacion |
| `ev_eventos` | uuid, intento_tarea_id, seq, t_rel_ms, ts_dispositivo, tipo, objetivo, datos_json, clase — índice (intento_tarea_id, seq) |

Una versión de evaluación publicada **no se edita**: los cambios crean una versión
nueva. Así los resultados antiguos siempre se pueden explicar con las reglas que se usaron.

## 3. Pantallas en POI (módulo Evaluaciones)

1. **Resultados:** lista de intentos con filtros (fecha, sucursal, puesto, nivel).
2. **Detalle de intento:** puntuación, nivel y tabla de tareas.
3. **Detalle de tarea:** línea de tiempo de eventos (hora, acción, clase coloreada,
   ayudas) y comparación contra la ruta óptima.
4. **Catálogo:** evaluaciones, versiones, tareas y asignación por puesto.
5. **Dispositivos:** enrolar, desactivar y ver el último contacto.
