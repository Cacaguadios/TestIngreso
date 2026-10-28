# Modelo de tareas y puntuación

Las tareas son **datos** (JSON) que vienen de POI, no código. Así se pueden crear
o ajustar tareas sin publicar una nueva versión de la app, siempre que usen
pantallas y estados que el simulador ya soporta.

## 1. Estado del teléfono simulado

El estado vive en `src/engine/phone.ts` (`PhoneState`). Las tareas lo leen con rutas como
`conectividad.wifi`, `conectividad.redWifi`, `navegador.consulta`, `navegador.resultadoAbierto`,
`sonido.timbre`, `pantallaCfg.brillo`, `sistema.linterna`, `conectividad.dispositivoBt`, `mensajes.ultimo.a`,
`mensajes.ultimo.texto`, `telefono.enLlamada` (solo dígitos), `camara.fotos`, `archivos.abierto`, `mapas.buscado`, `mapas.ruta`.

**Pantallas (ids estables):** `inicio`, `ajustes_rapidos`, `ajustes`, `ajustes.red`, `ajustes.internet`,
`ajustes.bluetooth`, `ajustes.sonido`, `ajustes.pantalla`, `wifi.contrasena`, `navegador`,
`navegador.escribiendo`, `navegador.resultados`, `navegador.pagina`, `archivos`, `archivos.busqueda`,
`archivos.documentos`, `archivos.imagenes`, `archivos.videos`, `archivos.audio`, `archivos.visor`,
`mensajes`, `mensajes.nuevo`, `mensajes.redactar`, `galeria`, `camara`, `contactos`, `contactos.detalle`, `mapas`,
`telefono`, `telefono.llamada`.

**Claves de acción** (vocabulario de `rutasValidas` y `acciones`; `*` al final es comodín):
`abrir:<pantalla>`, `atras`, `inicio`, `recientes`,
`toggle:<wifi|modoAvion|bluetooth|datos|vibrar|modoOscuro|brilloAdaptable|linterna|noMolestar|ahorroBateria>`,
`deslizar:<brillo|volMultimedia|volLlamada|volTimbre>`,
`seleccionar:<red|resultado|sugerencia|archivo|contacto|conversacion|llamar|bt|lugar>:<valor>` (`llamar` lleva el número en dígitos),
`texto:<navegador.borrador|wifi.clave|archivos.consulta|mensajes.borrador|telefono.numero|mapas.consulta>`,
`enviar:<navegador.buscar|wifi.conectar|archivos.buscar|mensajes.enviar|telefono.llamar|telefono.colgar|camara.disparar|mapas.buscar|mapas.ruta>`,
`toque.vacio`.

## 2. Definición de una tarea

```json
{
  "codigo": "conect.wifi_activar",
  "version": 1,
  "titulo": "Activar el Wi-Fi",
  "instruccion": "Conéctate a la red Wi-Fi \"Roly-Sucursal\".",
  "categoria": "conectividad",
  "nivel": 1,
  "estadoInicial": { "conectividad": { "wifi": false, "datos": false } },
  "exito": {
    "todas": [
      { "estado": "conectividad.wifi", "igual": true },
      { "estado": "conectividad.redWifi", "igual": "Roly-Sucursal" }
    ]
  },
  "hitos": [
    { "id": "llego_a_wifi", "peso": 0.25, "cuando": { "alguna": [{ "visito": "ajustes.internet" }, { "visito": "ajustes_rapidos" }] } },
    { "id": "wifi_encendido", "peso": 0.35, "cuando": { "estado": "conectividad.wifi", "igual": true } }
  ],
  "pasosOptimos": 3,
  "rutasValidas": [
    ["abrir:ajustes", "abrir:ajustes.wifi", "toggle:wifi", "seleccionar:red:Roly-Sucursal"],
    ["abrir:centro_control", "toggle:wifi", "seleccionar:red:Roly-Sucursal"]
  ],
  "acciones": {
    "error": ["toggle:modoAvion", "seleccionar:red:*"],
    "neutras": ["abrir:ajustes.bluetooth", "abrir:ajustes.pantalla"]
  },
  "ayudas": [
    "El Wi-Fi se configura en Ajustes o desde el Centro de control.",
    "Desliza desde la esquina superior derecha o abre el ícono de engrane.",
    "Activa el interruptor de Wi-Fi y toca la red \"Roly-Sucursal\"."
  ],
  "tiempoReferenciaSeg": 30,
  "tiempoLimiteSeg": 180
}
```

### Condiciones (mini-lenguaje)

| Forma | Significado |
|---|---|
| `{ "estado": "ruta.al.valor", "igual": X }` | El estado tiene ese valor |
| `{ "estado": "...", "contiene": "texto" }` | Texto contiene (sin acentos ni mayúsculas) |
| `{ "visito": "pantalla" }` | En algún momento abrió esa pantalla |
| `{ "estado": "...", "existe": true }` | El valor no es nulo ni vacío |
| `{ "estado": "...", "mayorIgual": 50 }` | Número ≥ valor (p. ej. brillo) |
| `{ "estado": "...", "menorIgual": 5 }` | Número ≤ valor (p. ej. volumen del timbre) |
| `{ "evento": "tipo:objetivo" }` | Ocurrió ese evento |
| `{ "todas": [...] }` / `{ "alguna": [...] }` / `{ "no": {...} }` | Combinaciones |

El motor de tareas evalúa `exito` después de **cada** evento. Cuando se cumple,
la tarea se marca como completada en ese instante.

## 3. Clasificación de acciones

Cada acción del candidato se clasifica al momento (y se guarda cruda para que
POI pueda recalcular si cambian las reglas):

| Clase | Regla | ¿Penaliza? |
|---|---|---|
| **necesaria** | Avanza en alguna de las `rutasValidas` | No |
| **exploracion** | Abre una pantalla y regresa sin cambiar estado relevante, o está en `acciones.neutras` | Solo si es excesiva |
| **desviacion** | Cambia algo del estado que no tiene que ver con la tarea | Leve |
| **error** | Coincide con `acciones.error` o deshace un hito ya logrado | Sí |

"Excesiva" = la exploración supera 2× `pasosOptimos`. Una persona que busca en
un par de menús antes de encontrar Wi-Fi no es castigada.

## 4. Puntuación por tarea (propuesta inicial, 0–100)

Los pesos son configurables por evaluación en POI y se guarda la versión usada
con cada resultado.

| Componente | Peso | Cálculo |
|---|---|---|
| Resultado | 50 | Completada = 50. No completada = 50 × suma de pesos de `hitos` logrados |
| Eficiencia | 20 | 20 × min(1, pasosOptimos / accionesReales) |
| Tiempo | 15 | 15 si t ≤ tiempoReferencia; baja linealmente a 0 en tiempoLimite |
| Independencia | 15 | 15 − 5 por ayuda usada (mínimo 0) |
| Errores | — | −3 por error, máximo −15 |

Si la tarea no se completó, eficiencia y tiempo valen 0.

**Puntuación de la evaluación** = promedio ponderado de las tareas (cada tarea
puede tener peso propio). **Nivel** (Básico / Intermedio / Avanzado) por umbrales
definidos en POI, que se calibran con un piloto con empleados de nivel conocido.

## 5. Ayudas

- Progresivas: el botón **Ayuda** abre una hoja; cada pista nueva se pide con "Ver pista N de M".
  Abrir la hoja no gasta pistas, y volver a leer las ya vistas tampoco.
- Se registran como evento `ayuda.mostrada` con su índice.
- Después de la última pista puede venir "Mostrarme". `mostrarme` es un id o una **lista de ids en orden**
  (p. ej. `["app.ajustes", "ajustes.red", "ajustes.internet"]`): el simulador marca con un contorno verde el
  último de la lista que esté visible, así la guía avanza sola pantalla por pantalla hasta terminar la tarea.
  Si se usa, la tarea se marca `completada_con_guia` y el componente de independencia vale 0.
- Ids señalables: `statusbar`, `app.<id>`, `qs.<wifi|datos|bluetooth|avion|linterna|nomolestar|bateria|oscuro|brillo>`,
  `ajustes.<red|bluetooth|sonido|pantalla|internet|wifi|avion>`, `red.<ssid>`, `bt.switch`, `bt.<dispositivo>`,
  `sonido.timbre`, `pantalla.brillo`, `navegador.barra`, `resultado.<id>`, `archivos.buscar`, `archivos.<categoría>`,
  `archivo.<nombre>`, `conv.<contacto>`, `mensajes.nuevo`, `mensajes.enviar`, `contacto.<nombre>`, `contacto.llamar`,
  `contacto.mensaje`, `telefono.llamar`, `camara.disparador`, `mapas.buscar`, `mapas.ruta`.

## 6. Fin de una tarea

| Estado final | Cuándo |
|---|---|
| `completada` | Se cumplió `exito` |
| `completada_con_guia` | Se cumplió usando la ayuda "mostrarme" |
| `tiempo_agotado` | Se alcanzó `tiempoLimiteSeg` |
| `omitida` | El candidato tocó "No sé hacerlo / Siguiente" |
| `interrumpida` | La app se cerró o el teléfono se apagó; se reanuda o se cierra al volver |

## 7. Implementación (notas)

- Los pesos de `hitos` deben sumar **menos de 1**; el resto es el éxito final. POI debe validarlo (la app lo rechaza si no).
- Una acción que está en una ruta válida es **necesaria** aunque también coincida con un patrón de `acciones.error`.
- Deshacer un hito ya logrado (p. ej. apagar el Wi-Fi que acababa de encender) cuenta como **error**.
- La exploración no se castiga hasta 2 × `pasosOptimos`; el exceso entra al cálculo de eficiencia.
- La contraseña de Wi-Fi nunca se guarda en claro en los eventos (se guarda `••••`).
- Código: `src/engine/*`. Tareas de ejemplo: `src/data/sample-evaluation.ts`.
