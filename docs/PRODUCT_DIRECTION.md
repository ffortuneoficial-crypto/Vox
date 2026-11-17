# VOX — Dirección de producto

## Producto
VOX es un entrenador conversacional de comunicación impulsado por IA. No es una aplicación de transcripción. La persona practica hablando con un interlocutor de IA que mantiene el contexto, pregunta, profundiza, simula situaciones y analiza la comunicación con evidencia.

## Experiencia principal
1. Conversación oral bidireccional; el primer prototipo funciona por turnos y el objetivo posterior es voz full-duplex en tiempo real.
2. Simulaciones configurables: cliente difícil, entrevista, supervisor, conversación cotidiana, liderazgo y resolución de conflictos.
3. Análisis posterior: claridad, estructura, escucha, argumentación, vocabulario, tono, ritmo, pausas y respuesta bajo presión.
4. Informe con evidencias observables, fragmentos relevantes, nivel de confianza y recomendaciones concretas.
5. Memoria de progreso por usuario y entrenamiento adaptativo entre sesiones.

## Principios
- La transcripción es una señal auxiliar, nunca el producto.
- No inventar métricas, diagnósticos ni elogios. Toda conclusión debe vincularse a evidencia.
- Separar observaciones lingüísticas de señales acústicas; no inferir personalidad ni emociones como hechos.
- La IA debe conversar naturalmente, no interrogar con una lista fija.
- Micrófono con permiso explícito, indicador visible y controles claros.
- No conservar audio por defecto. Permitir revisar, exportar y borrar datos.
- No exponer claves de proveedores de IA en el cliente web.

## Arquitectura objetivo
- Cliente multiplataforma: PWA web responsive, preparado para Android, iOS y escritorio.
- Servicio backend autenticado: crea sesiones, autoriza conexión de voz y protege credenciales.
- Motor de voz en tiempo real: audio bidireccional con modelo de IA; el navegador no se conecta directamente con una clave secreta.
- Orquestador de conversación: rol, escenario, objetivos, contexto y memoria autorizada.
- Analizador posterior: transcripciones y métricas acústicas/lingüísticas con referencias a evidencia.
- Persistencia: perfiles, sesiones, informes y preferencias con consentimiento y políticas de acceso.

## Estado de implementación
- Interfaz PWA minimalista publicada desde `preview/`.
- Primer circuito local implementado: captura de audio en navegador, transcripción mediante whisper.cpp, conversación contextual mediante OmniRoute y respuesta hablada con síntesis del navegador.
- El puente de desarrollo se ejecuta en Termux y solo escucha en loopback (`127.0.0.1`). No es arquitectura de producción ni se debe compartir como servicio.
- No se guardan grabaciones ni el historial de conversación al cerrar la sesión.
- La versión publicada incorpora autenticación por correo y contraseña mediante Supabase Auth, con sesiones persistentes.
- Todavía no hay modo full-duplex, informes analíticos validados ni persistencia multiusuario de las conversaciones.

## Criterios de aceptación de la primera experiencia real
- El usuario puede hablar y escuchar respuestas de la IA sin alternar entre dictado y texto.
- La IA responde al contexto y puede hacer preguntas de seguimiento.
- La sesión puede finalizarse y produce un informe sustentado en evidencias.
- No hay puntuaciones sin datos suficientes.
- El usuario controla permisos, retención y eliminación de datos.


## Authentication entry and visual system (17 Nov 2026)

- `preview/auth.html` is the standalone entry point for login and registration; it is not embedded in the main app.
- `preview/auth.js` manages Supabase email/password authentication, session detection, and redirects authenticated users to `preview/index.html`.
- `preview/index.html` is the protected main application. It verifies the Supabase session before revealing the app and redirects unauthenticated users to `auth.html`.
- The PWA manifest starts at `auth.html`; a valid existing session immediately continues to the main app.
- `preview/auth.css` and `preview/app.css` use a soft, colorful, animated visual system with responsive layouts and loading states.
- `preview/sw.js` caches both entry points and their assets independently.
