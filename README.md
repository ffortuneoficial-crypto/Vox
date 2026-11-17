# VOX — Entrenador conversacional

VOX es un entrenador de comunicación pensado para practicar hablando con una IA que conserva el contexto, responde y hace preguntas de seguimiento. La prioridad no es transcribir: es mantener una conversación útil y después analizarla con evidencia.

## Estado actual

- Interfaz móvil minimalista, preparada como PWA.
- Primer circuito local de conversación por turnos: micrófono → whisper.cpp → OmniRoute/LLM → respuesta hablada del navegador.
- Contexto conversacional conservado en memoria durante la sesión.
- El puente local escucha únicamente en `127.0.0.1`; no expone servicios a la red Wi-Fi.
- No se guardan audio ni transcripciones de las sesiones.
- El análisis profundo, los informes con evidencias y el modo de voz full-duplex todavía están pendientes.

## Ejecutar en Android / Termux

Requisitos: Node.js 18+, whisper.cpp con `ggml-tiny.bin`, y OmniRoute activo.

1. Inicia whisper.cpp en `127.0.0.1:8080` usando el modelo español.
2. Mantén OmniRoute activo en `127.0.0.1:20128`.
3. En otra sesión de Termux, clona el repositorio y ejecuta el puente:

```bash
cd ~
git clone https://github.com/ffortuneoficial-crypto/Vox.git
cd Vox/local-engine
node server.mjs
```

Si el repositorio ya está clonado, entra en `local-engine` y ejecuta `node server.mjs`.

Después abre https://ffortuneoficial-crypto.github.io/Vox/ en Chrome Android, entra a Entrenar y concede permiso al micrófono.

Consulta [local-engine/README.md](local-engine/README.md) para configuración y diagnóstico.

## Límites importantes

Esta versión es un prototipo local por turnos, no una conexión de voz full-duplex en tiempo real. La transcripción depende del modelo tiny y la voz de salida depende de la síntesis disponible en el navegador. El análisis de comunicación con puntuaciones sustentadas en evidencias se construirá después. Para distribuir VOX a terceros o centros de llamadas, el puente local deberá evolucionar a un backend autenticado; no se deben exponer claves de proveedor en el frontend.
