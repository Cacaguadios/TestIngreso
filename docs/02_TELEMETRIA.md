# Telemetría y almacenamiento local

## 1. Evento

Todo lo que hace el candidato se registra como evento. El componente visual
solo llama a `registrar(tipo, objetivo, datos)`; no sabe nada de puntuación.

```json
{
  "uuid": "0b8c…",
  "intentoTareaUuid": "7f21…",
  "seq": 14,
  "tRelMs": 18450,
  "tsDispositivo": "2026-10-21T10:34:28.450-06:00",
  "tipo": "toggle",
  "objetivo": "wifi",
  "datos": { "valor": true, "pantalla": "ajustes.wifi" },
  "clase": "necesaria"
}
```

- `uuid`: generado en el teléfono → el envío a POI es idempotente (reintentar no duplica).
- `seq`: orden exacto dentro de la tarea.
- `tRelMs`: milisegundos desde que empezó la tarea, con reloj monotónico.
  **Es el dato que se usa para medir tiempos**, porque la hora del teléfono puede estar mal.
- `tsDispositivo`: hora del teléfono, solo para mostrar en la línea de tiempo.

### Tipos de evento

| Tipo | Ejemplo de objetivo | Datos |
|---|---|---|
| `tarea.inicio` / `tarea.fin` | código de tarea | estado final, puntuación |
| `abrir` | `navegador`, `ajustes.wifi` | origen |
| `atras` / `inicio` / `recientes` | — | botón o gesto |
| `toque` | id del elemento | x, y (opcional) |
| `toggle` | `wifi`, `modoAvion` | valor |
| `deslizar` | `centro_control` | dirección |
| `texto` | `navegador.busqueda` | texto final, nº de borrados |
| `enviar` | `navegador.busqueda` | consulta |
| `seleccionar` | `red:Roly-Sucursal` | — |
| `ayuda.mostrada` | — | índice |
| `app.segundo_plano` / `app.primer_plano` | — | — |
| `toque.vacio` | — | toque fuera de cualquier elemento (indica desorientación) |

**Texto:** no se guarda cada tecla. Se guarda un evento `texto` cuando el campo
pierde el foco o se envía, con el texto final y cuántas veces borró.

## 2. SQLite local (expo-sqlite)

```sql
CREATE TABLE paquete (            -- evaluaciones descargadas de POI
  version TEXT PRIMARY KEY, json TEXT NOT NULL, descargado_en TEXT NOT NULL
);
CREATE TABLE participante (
  uuid TEXT PRIMARY KEY, nombre TEXT, apellidos TEXT, puesto_id INTEGER,
  sucursal_id INTEGER, acepto_privacidad_en TEXT, creado_en TEXT
);
CREATE TABLE intento (
  uuid TEXT PRIMARY KEY, participante_uuid TEXT, evaluacion_version_id INTEGER,
  inicio TEXT, fin TEXT, estado TEXT, puntuacion REAL, nivel TEXT,
  sincronizado INTEGER DEFAULT 0
);
CREATE TABLE intento_tarea (
  uuid TEXT PRIMARY KEY, intento_uuid TEXT, tarea_codigo TEXT, tarea_version INTEGER,
  orden INTEGER, estado TEXT, duracion_ms INTEGER, acciones INTEGER, errores INTEGER,
  ayudas INTEGER, puntuacion REAL, detalle_json TEXT
);
CREATE TABLE evento (
  uuid TEXT PRIMARY KEY, intento_tarea_uuid TEXT, seq INTEGER, t_rel_ms INTEGER,
  ts_dispositivo TEXT, tipo TEXT, objetivo TEXT, datos_json TEXT, clase TEXT,
  enviado INTEGER DEFAULT 0
);
CREATE INDEX idx_evento_pend ON evento(enviado, intento_tarea_uuid);
```

## 3. Sincronización

1. Al terminar la evaluación (o cada vez que hay red), se arma un lote:
   participante + intento + tareas + hasta 500 eventos.
2. `POST /sync/lote`. POI responde con los UUID aceptados.
3. Se marcan como enviados. Si faltan eventos, se manda otro lote.
4. Cuando POI confirma que el intento está **completo**, se borran del teléfono
   los datos personales del candidato (el teléfono es compartido).
5. Reintentos con espera creciente (5 s, 30 s, 2 min, 10 min…).

Mientras haya intentos sin sincronizar, la pantalla de inicio muestra un aviso
discreto para el encargado ("2 evaluaciones pendientes de enviar").
