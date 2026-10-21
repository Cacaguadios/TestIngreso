# Roly · Evaluación Digital

App móvil (Expo SDK 57 + React Native + TypeScript) que evalúa habilidades digitales con un **teléfono Android simulado**.
Se conecta a POI (Laravel) por API REST. Diseño: Figma "Roly · Evaluación digital — Maquetado móvil".

Documentación de diseño y decisiones: [`docs/`](docs).

## Comandos

```bash
npm install
npm test            # 60 pruebas de los motores, SQLite y sincronización (Vitest, sin dispositivo)
npm run typecheck   # TypeScript estricto
npm start           # Expo: escanear el QR con Expo Go (Android)
```

Variable opcional: `EXPO_PUBLIC_POI_URL` (URL base de la API de POI). También se puede escribir
en la pantalla de configuración del equipo: **7 toques seguidos en el logo** de la bienvenida.

> Expo Go sirve para desarrollar. Para el teléfono asignado (modo pantalla completa / kiosco) hará falta una
> *development build* (`expo-dev-client`) y, más adelante, el módulo Kotlin de Lock Task (ver docs/00_DECISIONES.md D-01).

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

Funcionan: registro, aviso de privacidad, práctica, progreso, ayudas progresivas ("Mostrarme"), tiempo límite,
omitir, resultado por tarea, cierre, sincronización con reintentos, y las apps simuladas **Inicio, Ajustes
(Red e Internet, Internet/Wi-Fi con contraseña, Bluetooth, Sonido, Pantalla), Ajustes rápidos y Navegador**.

El motor ya soporta Archivos y Mensajes (búsqueda, enviar), pero sus pantallas muestran
"disponible en una versión posterior" (Galería, Cámara, Contactos, Mapas y Teléfono igual).
