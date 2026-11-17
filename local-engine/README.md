# VOX — Motor local de conversación (prototipo)

Esta primera integración permite una conversación hablada por turnos:

1. El navegador graba cuando la persona toca **Hablar con VOX**.
2. El puente local envía el audio a whisper.cpp para transcribirlo en español.
3. El texto y el contexto reciente se envían a OmniRoute (API compatible con OpenAI).
4. VOX responde y el navegador lee la respuesta en voz alta.
5. La persona puede continuar hablando; el contexto se conserva solo durante esa sesión.

No es todavía audio full-duplex en tiempo real. Es el primer circuito funcional de escucha → comprensión → respuesta → voz. El audio y el historial no se guardan.

## Requisitos en Android / Termux

- Node.js 18 o superior.
- whisper.cpp compilado y el modelo `ggml-tiny.bin` disponible.
- whisper-server escuchando en `127.0.0.1:8080`.
- OmniRoute escuchando en `127.0.0.1:20128`.

## Arranque

Mantén activos los dos servicios que ya tienes. Si necesitas iniciar Whisper:

```bash
cd ~/Termux-STT/whisper.cpp
./build/bin/whisper-server --model models/ggml-tiny.bin --language es --host 127.0.0.1 --port 8080
```

Clona VOX una sola vez:

```bash
cd ~
git clone https://github.com/ffortuneoficial-crypto/Vox.git
cd Vox/local-engine
node server.mjs
```

Si ya tienes el repositorio clonado, entra directamente a su carpeta `local-engine` y ejecuta `node server.mjs`.

Por defecto el puente usa:
- Whisper: `http://127.0.0.1:8080`
- OmniRoute: `http://127.0.0.1:20128/v1`
- Modelo de conversación: `deepseek-v4.1-flash-free`
- Página autorizada: `https://ffortuneoficial-crypto.github.io`

Puedes cambiar el modelo o las direcciones mediante variables de entorno, sin editar el código:

```bash
OMNI_MODEL="nombre-del-modelo" node server.mjs
```

## Comprobación

Con los tres servicios activos, abre en Chrome Android:

`https://ffortuneoficial-crypto.github.io/Vox/`

Entra a **Entrenar**. El estado debe indicar que el motor local está conectado. Concede permiso al micrófono cuando Chrome lo solicite. Toca para hablar y vuelve a tocar para enviar tu intervención.

El puente solo escucha en `127.0.0.1`, no en la red Wi-Fi. La página pública solo puede acceder a las rutas de este puente desde el origen GitHub Pages configurado. No coloques claves privadas en el frontend.

## Límites de esta primera integración

- Conversación por turnos, no interrupción/streaming de voz en tiempo real.
- La transcripción depende del modelo local tiny; puede cometer errores.
- La voz de respuesta usa la síntesis de voz disponible en el navegador.
- El análisis profundo y los informes con evidencia se implementarán después.
- Para distribuir VOX a otros usuarios o centros de llamadas, habrá que sustituir el puente local por un backend autenticado y seguro. No se debe exponer OmniRoute ni una clave de proveedor al navegador.
