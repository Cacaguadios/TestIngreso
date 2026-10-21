# Decisiones — Roly Evaluación Digital

Registro de decisiones tomadas. Cada una con fecha y motivo.

## D-01 · Dispositivo asignado por la empresa (2026-10-21)

La evaluación se hace en un teléfono de Roly, no en el del candidato.
Modelo de referencia: **Xiaomi Redmi 15C** (Android con HyperOS).

**Consecuencias:**
- Se puede usar modo kiosco real (Device Owner + Lock Task Mode), igual que en REVeL
  (`Proyecto Roly/REVeL_React_Native_Kotlin_Modo_Kiosco.txt`).
  - Fase 1: pantalla completa inmersiva + bloqueo del botón atrás (suficiente para pilotos).
  - Fase 2: módulo Kotlin con Lock Task para que el candidato no pueda salir de la app.
- Se trabaja con una sola resolución y densidad conocidas → el simulador se diseña
  y prueba para esa pantalla primero.
- El teléfono es compartido entre candidatos: al terminar, la app vuelve a la
  pantalla de bienvenida y borra los datos locales del intento **solo después** de
  confirmar que POI los recibió.
- Se requiere **development build** (expo-dev-client). Expo Go solo sirve para prototipar.

## D-02 · El candidato inicia la evaluación por sí mismo (2026-10-21)

No hay un reclutador que la inicie desde POI.

**Consecuencias:**
- El dispositivo se **enrola una sola vez** en POI (lo hace un administrador).
  Queda con un token guardado en SecureStore. Todos los intentos quedan ligados
  al dispositivo y, por tanto, a la sucursal donde está.
- El candidato captura sus datos (nombre, apellidos, puesto, sucursal) y la app
  elige la evaluación según el **puesto** (mapeo puesto → evaluación configurado en POI).
- Riesgo: suplantación (alguien hace la prueba por otro). Mitigación opcional,
  configurable por evaluación en POI: un **PIN de 4–6 dígitos** que entrega el
  encargado de la sucursal. Por defecto desactivado.
- Aviso de privacidad (LFPDPPP) obligatorio antes del registro, con aceptación registrada.
- Antes de las tareas calificadas habrá **1 tarea de práctica sin calificación**
  para que el candidato entienda cómo funciona el teléfono simulado.

## D-03 · El simulador imita Android / HyperOS (2026-10-21)

El simulador debe parecerse a lo que el candidato encontrará en el Redmi 15C real.

**Consecuencias:**
- Pantalla de inicio, Ajustes, barra de estado y navegación con estilo HyperOS.
- HyperOS separa **Centro de notificaciones** (deslizar desde arriba a la izquierda)
  y **Centro de control** (deslizar desde arriba a la derecha). El simulador debe
  replicarlo, porque es una de las formas reales de activar Wi-Fi, datos, etc.
- Navegación por **gestos** y por **botones** (atrás / inicio / recientes) según
  cómo vengan configurados los equipos. Por defecto: la que traiga el Redmi 15C de fábrica.
- Los nombres de menús deben copiarse del equipo real en español
  (p. ej. "Ajustes", "Wi-Fi", "Tarjetas SIM y redes móviles", "Conexión y uso compartido").
  **Pendiente:** tomar capturas de pantalla del Redmi 15C real para cada pantalla a simular.
- El botón/gesto "atrás" del sistema real se intercepta y se registra como acción
  del simulador; nunca saca al candidato de la app.
- Para escribir se usa el **teclado real** del teléfono (mide también la habilidad de escritura).

## Pendientes de decidir

- Fórmula de puntuación definitiva y umbrales de nivel (se calibran con un piloto).
- ¿El candidato puede reintentar una tarea? ¿Cuántas veces?
- Tiempo límite por tarea y por evaluación.
- ¿Instrucciones con audio?
