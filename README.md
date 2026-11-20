# VOX — Entrenador de comunicación

VOX es un producto en construcción para practicar comunicación con una IA conversacional, desarrollar habilidades de expresión y revisar el progreso con evidencia.

## Aplicación web actual

La aplicación principal vive en la raíz del repositorio:

- `index.html`: entrada principal, navegación y pantallas.
- `css/app.css`: identidad visual, temas oscuro/claro y diseño responsive.
- `js/app.js`: autenticación Supabase, captura de audio, transcripción del navegador y guardado de sesiones.
- `manifest.webmanifest` y `sw.js`: instalación PWA y caché.

La interfaz actual conserva el circuito de grabación y transcripción. **Todavía no incorpora el motor conversacional de IA en la aplicación web raíz**, ni análisis automático de comunicación, TTS integrado o conversación de voz full-duplex. No se deben presentar esas capacidades como terminadas.

## Funciones disponibles

- Registro e inicio de sesión con Supabase Auth (correo y contraseña).
- Sesión persistente.
- Captura de audio con permiso explícito del navegador.
- Transcripción en directo cuando el navegador ofrece Web Speech API.
- Revisión del texto y reproducción del audio grabado.
- Guardado explícito de sesión, transcripción y audio en Supabase Storage/Database.
- Historial de sesiones del usuario.
- Apariencia clara y oscura.

## Desarrollo local

La aplicación es estática. Se puede servir la raíz con cualquier servidor HTTP local. Para desarrollo en Android/Termux:

```bash
pkg install nodejs
npx serve .
```

Abre la dirección local que indique el servidor desde Chrome Android. Para usar micrófono, el navegador requiere HTTPS o localhost y permiso explícito.

## Próximas capacidades de producto

- Runtime conversacional IA conectado a un backend autenticado.
- Voz bidireccional, respuesta hablada e interrupción configurable.
- Simulaciones de situaciones reales.
- Análisis de comunicación sustentado en evidencias.
- Memoria selectiva con transparencia y control del usuario.

La arquitectura objetivo y los límites de privacidad están documentados en `docs/MVP_PRODUCT_ARCHITECTURE.md` y `docs/PRODUCT_DIRECTION.md`.
