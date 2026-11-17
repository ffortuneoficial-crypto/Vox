# VOX — Dirección de producto

## Producto
VOX es un entrenador conversacional de comunicación impulsado por IA. No es una aplicación de transcripción. La persona practica hablando con un interlocutor de IA que mantiene el contexto, pregunta, profundiza, simula situaciones y analiza la comunicación con evidencia.

## Experiencia principal
1. Conversación oral bidireccional en tiempo real desde la primera versión.
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
- Analizador posterior: transcriptos y métricas acústicas/lingüísticas con referencias a evidencia.
- Persistencia: perfiles, sesiones, informes y preferencias con consentimiento y políticas de acceso.
- Panel de progreso: evolución longitudinal y ejercicios siguientes.

## Estado de implementación
La interfaz pública actual es una maqueta/prototipo frontend. Aún no hay un backend ni un proveedor de IA conectado; por tanto, no debe anunciarse que ya mantiene conversaciones inteligentes. La primera entrega cambia la interfaz y deja explícito ese límite. El siguiente hito técnico es implementar el backend seguro y la conexión de voz en tiempo real.

## Criterios de aceptación de la primera experiencia real
- El usuario puede hablar y escuchar respuestas de la IA sin alternar entre dictado y texto.
- La IA responde al contexto y puede hacer preguntas de seguimiento.
- La sesión puede finalizarse y produce un informe sustentado en evidencias.
- No hay puntuaciones sin datos suficientes.
- El usuario controla permisos, retención y eliminación de datos.
