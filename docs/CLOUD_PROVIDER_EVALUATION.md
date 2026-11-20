# VOX — Evaluación preliminar de proveedores cloud
**Fecha de consulta:** 20 noviembre 2026  
**Estado:** shortlist para pruebas; no es una selección definitiva ni una autorización de gasto.

## 1. Criterios de selección
- Calidad en español latinoamericano, acentos colombianos y ruido real.
- Latencia de extremo a extremo, no solo latencia anunciada por proveedor.
- Streaming, detección de fin de turno y cancelación/interrupción.
- Coste por hora de audio, por caracteres de voz y por tokens del modelo.
- Privacidad, retención, uso de datos y opciones de procesamiento.
- SDK/API compatible con PWA Android Chrome y backend autenticado.
- Portabilidad: adaptadores reemplazables, sin acoplar la UI a un proveedor.

## 2. Speech-to-text (STT)
| Proveedor | Precio público consultado | Capacidades publicadas | Lectura para VOX |
|---|---:|---|---|
| AssemblyAI STT-3.7 Realtime | US$0.30/h | streaming, 32 idiomas, keyterms | candidato de prueba para turnos/streaming |
| AssemblyAI Universal-2 | US$0.15/h | batch, 99 idiomas | opción económica para audio ya capturado, no para interacción en vivo |
| ElevenLabs Scribe v3 Live | US$0.22/h | realtime, 90+ idiomas, keyterms | candidato si se prueba junto con su TTS |
| Deepgram Nova-3 Multilingual | US$0.0092/min (US$0.552/h) en tarifa listada | 60+ idiomas; streaming | candidato técnico, validar español y latencia |
| OpenAI gpt-live-transcribe | US$0.017/min (US$1.02/h estimado) | transcripción live | candidato si se prioriza integración OpenAI; coste mayor en esta comparación |

Los precios son tarifas públicas consultadas el 20-11-2026 y pueden cambiar. No sustituyen pruebas con grabaciones reales de usuarios.

## 3. LLM / motor conversacional
| Proveedor / familia | Precio o modalidad consultada | Ventaja | Riesgo / condición |
|---|---|---|---|
| Gemini 3.8 Flash | tarifa publicada por tokens; página indica tier gratuito y tier de pago | opción inicial de bajo coste y buena disponibilidad para pruebas | en Free, Google indica que el contenido puede usarse para mejorar productos; en Paid indica que no. Para datos de usuarios, no usar Free sin consentimiento y revisión de términos |
| OpenAI GPT-Live / Realtime | GPT-Live publicado a US$0.05/min; Realtime factura tokens de audio/texto según modelo | posibilidad de experiencia de voz integrada y baja latencia | coste real depende del modelo, duración y uso; medir coste total por sesión |
| Otros LLM compatibles | pendiente de prueba | competencia y portabilidad | evaluar calidad español, tool calling, límites y privacidad |

No se recomienda elegir solo por precio por millón de tokens: hay que medir calidad conversacional, contexto largo, estabilidad, latencia, políticas de datos y coste de una sesión típica.

## 4. Text-to-speech (TTS)
| Proveedor | Precio público consultado | Capacidades publicadas | Lectura para VOX |
|---|---:|---|---|
| ElevenLabs v4 Turbo | US$0.04 / 1.000 caracteres | 90+ idiomas, baja latencia anunciada (~100 ms) | candidato de calidad/expresividad |
| ElevenLabs v3 Conversational | US$0.04 / 1.000 caracteres | conversación, 70+ idiomas, latencia anunciada (~280 ms) | candidato de conversación |
| Deepgram Aura-2 | US$0.03 / 1.000 caracteres | TTS API | candidato económico; probar voz español |
| OpenAI Realtime | incluido en facturación de modelo de audio/tokens según modalidad | audio integrado en el modelo | evaluar frente a STT+LLM+TTS separado |

No comparar mil caracteres con minutos de audio sin medir longitud y velocidad real del texto.

## 5. Backend / broker
Supabase Edge Functions publican límites de duración de 150 s en Free y 400 s en planes pagos, memoria 256 MB, CPU 2 s por request e idle timeout 150 s. Son límites relevantes para carga de audio y respuestas largas. Por tanto:
- Supabase Edge Functions pueden probarse para autenticación, autorización, cuotas y solicitudes breves.
- No se debe asumir que son el mejor transporte para WebSocket/streaming de voz persistente.
- Ejecutar una prueba vertical desde Android Chrome: autenticación → emisión de credencial efímera o envío seguro → STT → LLM → TTS → cancelación.
- Si el transporte/tiempo real no cumple, separar broker de voz en un backend dedicado y mantener Supabase para Auth, Postgres, RLS y almacenamiento de metadatos.

## 6. Recomendación provisional de arquitectura
**MVP:** turnos push-to-talk cloud, con texto siempre disponible y TTS opcional. Mantener modo de voz natural como interacción hablada por turnos en la primera etapa; no vender full-duplex. Probar interrupción de reproducción/cancelación y medir el límite real.
**Evolución:** streaming STT/LLM/TTS o speech-to-speech solo después de probar latencia, eco, turn detection, interrupción, coste y navegador Android.

**Shortlist para prueba comparativa inicial:**
- STT: AssemblyAI Realtime y ElevenLabs Scribe v3 Live; incluir Deepgram como tercer comparador si el costo y SDK lo justifican.
- LLM: Gemini Flash Paid frente a OpenAI modelo conversacional adecuado. No usar el tier gratuito con datos privados de usuarios sin revisión de términos.
- TTS: ElevenLabs v4 Turbo frente a Deepgram Aura-2; valorar voz integrada Realtime como alternativa.
- Broker: prueba de Supabase Edge Functions para el flujo corto; si no cumple streaming/cancelación, backend dedicado.

Esta shortlist no es una decisión irrevocable. Debe resolverse con un benchmark pequeño y reproducible, usando el mismo conjunto de frases/escenarios en español colombiano.

## 7. Benchmark obligatorio
Crear 20–30 muestras de voz consentidas (habla normal, ruido, nombres propios, velocidad variable, silencios, acento local), sin almacenar muestras más tiempo del necesario. Medir:
- WER/CER y errores semánticos importantes.
- Tiempo desde fin de voz hasta texto transcrito.
- Tiempo desde fin de turno hasta primer token/respuesta visible.
- Tiempo hasta primer audio TTS.
- tasa de cancelación/interrupción correcta.
- errores, desconexiones y recuperación.
- coste estimado por sesión de 5 y 15 minutos.
- términos de retención, entrenamiento y eliminación por proveedor.

No usar el resultado de una prueba de laboratorio como promesa de precisión universal.

## 8. Fuentes
- [Supabase Edge Functions — Limits](https://supabase.com/docs/guides/functions/limits)
- [AssemblyAI — Speech-to-text API pricing guide (17 Nov 2026)](https://www.assemblyai.com/blog/speech-to-text-api-pricing)
- [Deepgram — Pricing](https://deepgram.com/pricing)
- [ElevenLabs — API pricing](https://elevenlabs.io/pricing/api)
- [Google Gemini API — Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [OpenAI API — Pricing](https://developers.openai.com/api/docs/pricing)

