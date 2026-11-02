# VOX — Preview 0.1

Entrenador de voz y comunicación, diseñado primero para móvil Android como PWA.

## Estructura

- `index.html`: interfaz y vistas.
- `css/app.css`: diseño responsive y tema visual.
- `js/app.js`: navegación, grabación, análisis local, ejercicios e historial.
- `manifest.webmanifest`: metadatos de instalación.
- `sw.js`: caché básica para uso offline del shell.
- `icons/vox.svg`: icono vectorial.

## Funciones implementadas

- Navegación entre Inicio, Entrenar, Academia y Progreso.
- Diseño responsive para móvil y escritorio.
- Captura de micrófono con MediaRecorder.
- Visualización de onda y medición RMS aproximada mediante Web Audio API.
- Reproducción de la grabación.
- Transcripción opcional con Web Speech API cuando el navegador la ofrece.
- Campo editable para transcripción manual.
- Indicadores locales básicos de extensión, frases largas y expresiones frecuentes.
- Historial local de sesiones mediante localStorage.
- Seis ejercicios iniciales.
- Service Worker y manifiesto PWA.

## Límites conocidos — no se deben ocultar

Esta versión no incluye todavía un backend, proveedor de IA, transcripción garantizada, análisis semántico avanzado, análisis fonético profesional, memoria sincronizada ni simulaciones conversacionales dinámicas.

La Web Speech API tiene soporte variable y su procesamiento puede depender del navegador o de un servicio remoto. Se activa únicamente al iniciar una sesión y el navegador puede solicitar permisos.

El análisis de texto es heurístico: detecta patrones simples y no comprende el significado. El RMS y el recuento de silencios son indicadores acústicos básicos, no una evaluación de autoridad, seguridad o calidad vocal.

El historial se guarda en el almacenamiento local del navegador. No se suben grabaciones ni transcripciones a un servidor en esta versión.

## Ejecutar

Publica el contenido en un hosting HTTPS estático. El acceso al micrófono requiere un contexto seguro como HTTPS o localhost. Abre la URL en Chrome Android y permite el micrófono al comenzar una sesión.

## Próxima fase recomendada

1. Probar en Android real permisos, grabación y reproducción.
2. Añadir pruebas automatizadas y validación de navegadores.
3. Diseñar una API backend con claves protegidas.
4. Conectar proveedor de transcripción configurable.
5. Incorporar análisis semántico estructurado con evidencia.
6. Persistir sesiones y preferencias con autenticación y políticas de acceso.
