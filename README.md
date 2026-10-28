# Roly · Evaluación Digital

App móvil (Expo SDK 57 + React Native + TypeScript) que evalúa habilidades digitales con un **teléfono Android simulado**.
Se conecta a POI (Laravel) por API REST. Diseño: Figma "Roly · Evaluación digital — Maquetado móvil".

Documentación de diseño y decisiones: [`docs/`](docs).

## Comandos

```bash
npm install
npm test            # 83 pruebas: motores, las 15 tareas, SQLite y sincronización (Vitest, sin dispositivo)
npm run typecheck   # TypeScript estricto
npm start           # Expo: escanear el QR con Expo Go (Android)
```

Variable opcional: `EXPO_PUBLIC_POI_URL` (URL base de la API de POI). También se puede escribir
en la pantalla de configuración del equipo: **7 toques seguidos en el logo** de la bienvenida.

> Expo Go sirve para desarrollar. Para el teléfono asignado (modo pantalla completa / kiosco) hará falta una
> *development build* (`expo-dev-client`) y, más adelante, el módulo Kotlin de Lock Task (ver docs/00_DECISIONES.md D-01).

### Prueba contra un POI real

```bash
POI_URL=http://127.0.0.1:8000/api/evaluacion/v1 POI_CODIGO=<código de POI> npx vitest run tests/integracion
```

### Generar la APK

Se compila en la nube de Expo (EAS, proyecto `@kian11/roly-evaluacion`); no hace falta Android Studio.
El perfil `apk` de `eas.json` apunta a `https://poi.roly.mx/api/evaluacion/v1`.

```bash
npx eas-cli@latest login                                   # una sola vez
EAS_NO_VCS=1 npx eas-cli@latest build -p android --profile apk
```

Al terminar, descarga el `.apk` y publícalo en POI (**Evaluación digital › App móvil**, o
`php artisan evaluacion:publicar-apk <ruta> --app-version=1.0.0`). POI muestra el enlace y el QR para instalarla.
Para una versión nueva, sube `version` en `app.json` (el `versionCode` lo incrementa EAS).

## Estructura

```
src/
  engine/       Motores en TypeScript puro (no importan React ni Expo → se prueban en Node)
    phone.ts        Estado del teléfono simulado + reductor (qué pasa al tocar X)
    task-runner.ts  Ejecuta UNA tarea: clasifica acciones, hitos, éxito, ayudas, tiempo
    classify.ts     necesaria / exploración / desviación / error
    scoring.ts      Puntuación por tarea y por evaluación
    session.ts      Orden de tareas del intento + registros para guardar/enviar
    schema.ts       Validación (zod) del paquete que baja de POI
  simulator/    Interfaz del Android simulado (solo recibe estado y `dispatch`; no conoce las tareas)
  db/           SQLite local (esquema, migraciones, repositorio)
  sync/         Cliente de la API, envío por lotes, enrolamiento del equipo
  state/        Store (Zustand) que une motores + base de datos + pantallas
  app/          Pantallas (Expo Router) de la app evaluadora
  data/         Evaluación y paquete de ejemplo para desarrollar sin POI
tests/          Pruebas de motores, base de datos y sincronización
```

## Cómo fluye una tarea

1. `TaskRunner.dispatch(accion)` aplica la acción al teléfono (`reducePhone`).
2. Se clasifica (`classifyAction`), se registra el evento (uuid, `seq`, `tRelMs`) y se evalúan hitos y éxito.
3. Al terminar, `EvaluationSession.finishTask()` la califica y `saveAttempt()` guarda todo en SQLite.
4. `triggerSync()` manda lotes de ≤ 500 eventos; cuando POI confirma, se **borran** los datos del candidato del equipo.

## Alcance de esta versión

Funcionan: registro, aviso de privacidad, práctica, progreso, ayudas progresivas ("Mostrarme" guiado paso a paso),
tiempo límite, omitir (con confirmación), resultado por tarea, cierre y sincronización con reintentos.

Apps simuladas: **Inicio, Centro de control** (se abre tocando o deslizando la barra de estado), **Ajustes**
(Red e Internet, Wi-Fi con contraseña, Bluetooth con dispositivos, Sonido, Pantalla), **Navegador, Archivos**
(búsqueda, categorías y visor), **Mensajes, Contactos, Teléfono** (marcador y llamada), **Cámara, Galería y Mapas**.
El brillo del teléfono simulado oscurece la pantalla de verdad.

La evaluación de ejemplo (`src/data/sample-evaluation.ts`) tiene 1 práctica y **15 tareas** de dificultad creciente:
abrir el navegador, linterna, tomar foto, quitar modo avión, subir brillo, silenciar el timbre, llamar a un contacto,
marcar un número, buscar en Internet, encontrar el sitio oficial, conectar una bocina Bluetooth, enviar un mensaje,
abrir un archivo, pedir la ruta en Mapas y conectarse a un Wi-Fi con contraseña.
