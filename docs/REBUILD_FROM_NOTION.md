# VOX — Rebuild desde cero: producto, wireflow y contratos
**Base normativa:** Notion · VOX — Product & Engineering HQ  
**Estado:** definición funcional inicial; no autoriza todavía implementación visual ni backend.  
**Rama de trabajo:** `rebuild/vox-from-notion`

## 0. Regla de reconstrucción
Esta reconstrucción no hereda pantallas, componentes, navegación, estilos ni lógica de las implementaciones anteriores. Los documentos previos sirven únicamente como registro histórico y fuente de requisitos vigentes cuando coincidan con el HQ de Notion. No se reutilizarán sus métricas, layouts ni controles.

La fuente de verdad del producto es Notion. Este documento convierte esa visión en flujos verificables; no declara que el producto ya esté construido.

## 1. Definición
VOX es una IA conversacional por voz y texto, capaz de adaptarse a contextos, roles e instrucciones definidos por el usuario. Tiene dos pilares que comparten un único motor:
- **Conversar:** conversación abierta, explicación, brainstorming, compañía conversacional, role-play y contextos personalizados.
- **Mejorar:** prácticas para desarrollar voz, dicción, claridad, presencia, escucha, improvisación, persuasión y otras habilidades comunicativas.

Los modos son configuraciones del mismo runtime, no chatbots independientes.

## 2. Principios invariantes
1. Identidad base coherente: honestidad, respeto, claridad, utilidad y consistencia.
2. Expresión adaptable: tono, energía, formalidad, cercanía, directividad y detalle.
3. Tres niveles de iniciativa configurables: reactivo, colaborativo y proactivo.
4. Voz natural y pulsar para hablar; comportamiento de interrupción configurable.
5. Texto siempre disponible como alternativa y respuesta visible.
6. Cloud-first: ningún servidor local, Termux, Whisper local ni OmniRoute local como requisito.
7. Audio temporal y no persistido por defecto. Guardar historial requiere acción explícita.
8. Memoria selectiva distinta del historial; candidata transparente, controlable y eliminable.
9. Ninguna puntuación, progreso o recompensa inventada.
10. Cada control tiene flujo, estado, resultado y criterio de aceptación.

## 3. Arquitectura de información
Navegación móvil propuesta:
- **Conversar:** entrada principal al motor abierto y a prompts/contextos personalizados.
- **Modos:** catálogo breve de prácticas guiadas y simulaciones.
- **Sesiones:** conversaciones/prácticas guardadas por decisión del usuario.
- **Cuenta:** preferencias de voz, interrupción, iniciativa, estilo, memoria y privacidad.

La acción principal no es un dashboard: es empezar o continuar una interacción.

## 4. Wireflow A — primera entrada
1. Splash/carga mínima → comprobar sesión autenticada.
2. Sin sesión: bienvenida breve → registro/inicio de sesión.
3. Sesión iniciada: onboarding de preferencias, opcional y omitible:
   - objetivo inicial (conversar libremente / mejorar comunicación / ambos);
   - preferencia de interacción (voz natural / pulsar para hablar / texto);
   - iniciativa (reactiva / colaborativa / proactiva);
   - tono base adaptable (sin encasillar una personalidad fija).
4. Explicar por separado permiso de micrófono, procesamiento temporal y consentimiento de guardado.
5. Llegar a Conversar con una acción clara para iniciar. El onboarding no debe bloquear el uso por voz o texto.

**Criterios:** el usuario puede omitir y cambiar todo después; no se solicita micrófono sin acción; no se guarda audio ni transcripción durante el onboarding.

## 5. Wireflow B — conversación abierta
1. Entrar en Conversar.
2. Elegir voz o texto; el usuario puede cambiar modalidad si el estado técnico lo permite.
3. Opcionalmente definir contexto mediante prompt, rol, objetivo, audiencia o restricciones.
4. Iniciar interacción.
5. Entrada de texto o voz → transcripción cloud si es voz → runtime compartido → respuesta textual → TTS opcional.
6. Continuar turnos conservando contexto de sesión.
7. Acciones disponibles: detener, cancelar respuesta, editar prompt/contexto, cambiar a texto y solicitar feedback.
8. Finalizar → pantalla/resumen de cierre → guardar o descartar. Guardar explica campos concretos que se conservarán.

**Criterios:** el prompt no puede anular seguridad, privacidad ni autorización; una falla de TTS deja visible la respuesta textual; una falla de STT permite reintentar o escribir; cancelar no guarda automáticamente.

## 6. Wireflow C — práctica guiada
1. Entrar en Modos.
2. Seleccionar una práctica breve con objetivo, duración estimada y qué observará VOX.
3. Leer instrucción y criterio de éxito comprensible.
4. Responder por voz o texto.
5. VOX analiza solo evidencia disponible:
   - texto: estructura, claridad, concisión, relevancia, muletillas observables;
   - audio: ritmo, pausas, variación tonal o intensidad solo si la medición es fiable;
   - interpretación cualitativa: etiquetada como observación de coaching, no como hecho objetivo.
6. Feedback: evidencia concreta → impacto → una prioridad de mejora → reintento práctico.
7. Repetir, cambiar de práctica o terminar.
8. Guardar informe solo con acción explícita.

**Primeras prácticas propuestas:** claridad y estructura; autoridad serena; ritmo y pausas; escucha activa y respuesta. Se validará un subconjunto antes de construir un catálogo extenso.

**Criterios:** sin score numérico hasta validar rúbrica, repetibilidad y calibración; no inferir personalidad, salud mental, honestidad o confianza interna desde la voz.

## 7. Wireflow D — simulación / role-play
1. Desde Modos, elegir una plantilla pequeña (entrevista, cliente difícil, reunión o conversación difícil) o crear una propia.
2. Configurar rol de VOX, rol del usuario, situación, objetivo, dificultad y límites.
3. VOX confirma brevemente el escenario y empieza en personaje.
4. Conversación multi-turno con capacidad de salir del rol o pedir una pausa.
5. Al cerrar, el usuario elige si desea feedback.
6. Feedback vinculado a conductas observables del intercambio; no evaluar rasgos personales.
7. Guardar o descartar.

**Criterios:** el usuario puede editar contexto antes y durante la sesión; el rol nunca anula reglas base; el feedback no aparece sin contexto o evidencia suficiente.

## 8. Wireflow E — sesiones e historial
1. Sesiones muestra estado vacío si no hay registros guardados.
2. Cada registro identifica tipo, fecha, contexto y contenido realmente almacenado.
3. Abrir sesión permite leer contenido guardado y feedback disponible.
4. El usuario puede eliminar una sesión; pedir confirmación clara y reflejar resultado.
5. No convertir automáticamente conversaciones guardadas en memoria persistente.

**Criterios:** ninguna sesión aparece si se descartó; no inventar estadísticas; eliminar respeta propiedad del usuario y RLS.

## 9. Wireflow F — memoria selectiva
Capas separadas:
- Contexto temporal de sesión.
- Historial guardado por consentimiento.
- Memoria persistente selectiva.

Flujo de memoria:
1. El motor detecta una posible memoria útil.
2. Genera una propuesta con contenido, motivo y ámbito sugerido (general/proyecto/rol).
3. La propuesta no se vuelve permanente sin una interacción transparente de control del usuario.
4. El usuario puede aceptar, editar, rechazar, consultar, corregir, eliminar o desactivar memoria.
5. No guardar datos sensibles por defecto.
6. Al eliminar, propagar borrado a los almacenes controlados por VOX; documentar límites de proveedores.

**Criterios:** memoria desactivada no genera nuevas propuestas persistentes; historial no alimenta memoria silenciosamente; siempre se muestra el ámbito para evitar contaminación entre proyectos.

## 10. Wireflow G — cuenta y preferencias
Preferencias editables en cualquier momento:
- Modalidad de voz preferida: natural / pulsar para hablar / texto.
- Interrupción: comportamiento configurable, con opciones que dependan de capacidades reales.
- Voz de salida: activar/desactivar y seleccionar solo voces realmente disponibles.
- Iniciativa: reactiva / colaborativa / proactiva.
- Expresión: tono, energía, formalidad, cercanía, directividad y nivel de detalle.
- Memoria: consultar, corregir, borrar, desactivar.
- Privacidad: sesiones guardadas, exportación/borrado cuando esté implementado, cerrar sesión.

**Criterios:** mostrar capacidades no disponibles como no disponibles, no como toggles funcionales; persistir preferencias por usuario; permitir restablecer valores.

## 11. Máquina de estados de voz
Estados mínimos:
- idle
- requesting_permission
- listening / recording
- uploading
- transcribing
- thinking
- generating_speech
- speaking
- paused
- cancelling
- completed
- recoverable_error

Transiciones y reglas:
- El micrófono solo se activa tras gesto explícito y permiso del navegador.
- Detener captura debe detener tracks del micrófono.
- Cancelar debe abortar trabajo compatible y evitar reproducir respuestas obsoletas.
- Interrupción durante TTS detiene reproducción si el navegador/proveedor lo permite.
- Si no existe streaming, declarar turn-based y mostrar procesamiento por turnos.
- Si STT falla: reintentar o texto. Si LLM falla: conservar entrada. Si TTS falla: conservar respuesta textual.
- No prometer full-duplex hasta medir latencia, eco, interrupción y compatibilidad Android Chrome.

## 12. Arquitectura técnica objetivo
Browser/PWA → endpoint cloud autenticado → STT → orquestador → LLM → TTS opcional → browser.
Adaptadores reemplazables:
- SpeechToTextAdapter
- LanguageModelAdapter
- TextToSpeechAdapter
- ConversationRuntime
- ModeRegistry
- VoiceSessionController
- SessionRepository
- MemoryService
- UsageGuard

Supabase es candidato para Auth, RLS, metadatos y Edge Functions. No asumir que Edge Functions resuelve streaming/tiempos/tamaño: realizar prueba técnica antes de elegirlo como broker. Si no cumple, backend dedicado autenticado. Secretos de proveedores solo en servidor.

## 13. Matriz de estados por pantalla
| Superficie | Vacío | Carga | Error | Recuperación |
|---|---|---|---|---|
| Conversar | invitación a iniciar | procesando turno | STT/LLM/TTS/red | reintentar o texto |
| Modos | catálogo breve disponible | cargando definiciones | catálogo no disponible | conversación abierta |
| Sesiones | no hay sesiones guardadas | cargando historial | fallo de consulta | reintentar; no perder datos |
| Memoria | sin recuerdos aprobados | consultando | fallo de lectura/borrado | reintentar y mostrar estado real |
| Cuenta | datos mínimos | guardando preferencia | fallo de actualización | revertir UI o reintentar |

## 14. Decisiones que requieren validación antes del build
1. Proveedores STT, LLM y TTS: calidad español, latencia, streaming, costo, límites, retención y términos de uso.
2. Broker cloud: prueba comparativa Supabase Edge Functions frente a backend dedicado.
3. Presupuesto por usuario, cuotas, rate limiting y protección de abuso.
4. Política final de retención, exportación y borrado; términos de procesamiento de proveedores.
5. Rúbrica de feedback para las primeras prácticas.
6. Precedencia de identidad base, preferencias, modo y prompt de usuario.
7. Capacidades reales de interrupción en Android Chrome.

## 15. Definition of Ready — diseño
No iniciar la interfaz final hasta que:
- Los wireflows A–G hayan sido revisados.
- El MVP inicial y las prácticas concretas estén delimitados.
- Los estados y errores de voz estén cubiertos.
- Los contratos de preferencias y memoria estén definidos.
- Se haya elegido la estrategia técnica de voz cloud tras pruebas.
- La exploración visual se revise en MagicPath/Figma y se apruebe antes de programar.

## 16. Definition of Done — implementación
Una capacidad solo está terminada si su flujo completo funciona, cada control tiene acción real, existen estados de carga/error/vacío, se respetan permisos y privacidad, persiste según contrato, se probó en Android Chrome, no inventa datos y está documentada.

## 17. Estado de ejecución
- [x] Fuente de verdad de Notion revisada.
- [x] Nuevo proyecto privado y vacío de MagicPath creado: `474352471653883904`.
- [x] Primer lienzo funcional iniciado con el flujo de producto central.
- [x] Rama aislada creada: `rebuild/vox-from-notion`.
- [ ] Wireflows completos y revisión de producto.
- [ ] Comparativa técnica de proveedores y broker.
- [ ] Diseño visual completo y aprobación.
- [ ] Implementación limpia en GitHub.
- [ ] QA Android Chrome y documentación final.

**Nota de ejecución:** MagicPath agotó la cuota de llamadas API durante la primera construcción del wireflow. El lienzo nuevo existe y contiene el inicio del mapa; no se afirma que el prototipo esté terminado. La continuación visual requiere disponibilidad de cuota en MagicPath o uso de Figma.
