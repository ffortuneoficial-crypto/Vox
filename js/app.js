(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "vox.sessions.v1";
  const state = {
    stream: null, recorder: null, chunks: [], startedAt: 0, elapsed: 0,
    timerId: null, audioContext: null, analyser: null, animationId: null,
    recognition: null, transcriptFinal: "", audioUrl: null, samples: [],
    silenceStarted: null, silenceDurations: [], recording: false
  };

  const exercises = [
    {module:"01 / CONTROL VOCAL",time:"3 MIN",title:"Pausa con intención",desc:"Lee una idea en voz alta. Haz una pausa breve antes de la idea principal y otra antes de concluir. Evita llenar cada silencio con palabras.",prompt:"Explica por qué una pausa puede hacer que una idea importante se entienda mejor.",goal:"Practicar pausas deliberadas sin perder naturalidad."},
    {module:"02 / ORATORIA",time:"5 MIN",title:"Una idea, tres pasos",desc:"Explica un tema usando esta secuencia: idea principal, explicación y ejemplo. Cierra con una conclusión de una frase.",prompt:"Explícame algo que sabes hacer utilizando tres pasos: idea, explicación y ejemplo.",goal:"Organizar una explicación para que otra persona pueda seguirla."},
    {module:"03 / LIDERAZGO",time:"5 MIN",title:"Instrucciones claras",desc:"Imagina que debes orientar a un compañero. Explica qué debe hacer, por qué importa y cuál es el resultado esperado.",prompt:"Un compañero cometió un error en una tarea. Explícale cómo corregirlo con firmeza y respeto.",goal:"Dar instrucciones claras sin sonar agresivo."},
    {module:"04 / CONEXIÓN",time:"4 MIN",title:"Escucha antes de responder",desc:"Lee una objeción, resume lo que la otra persona necesita y responde directamente. No te defiendas antes de comprender.",prompt:"Alguien te dice: 'Siento que no estás teniendo en cuenta lo que te estoy diciendo'. ¿Cómo responderías?",goal:"Responder a la necesidad expresada, no solo a las palabras."},
    {module:"05 / AGILIDAD",time:"3 MIN",title:"Improvisa con estructura",desc:"Tienes 20 segundos para pensar y 60 para hablar. Presenta una postura, una razón y un ejemplo concreto.",prompt:"¿Qué habilidad debería aprender todo el mundo y por qué? Tienes que defender tu respuesta con un ejemplo.",goal:"Construir una respuesta clara sin preparación extensa."},
    {module:"02 / ORATORIA",time:"5 MIN",title:"Explica algo complejo",desc:"Elige un concepto que conozcas y explícalo como si hablaras con alguien que nunca lo ha escuchado. Evita tecnicismos innecesarios.",prompt:"Explica cómo funciona una conexión a internet a una persona que no sabe de tecnología.",goal:"Adaptar vocabulario y ejemplos al interlocutor."}
  ];

  function getSessions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }
  function saveSessions(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50))); }
    catch { showToast("No se pudo guardar el historial en este dispositivo."); }
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
  }
  function setView(name) {
    $$(".view").forEach(view => view.classList.toggle("active", view.id === "view-" + name));
    $$("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === name));
    window.scrollTo({top: 0, behavior: "smooth"});
    if (name === "progreso") renderProgress();
  }
  $$("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  $$("[data-go]").forEach(button => button.addEventListener("click", () => setView(button.dataset.go)));

  function renderStats() {
    const sessions = getSessions();
    const seconds = sessions.reduce((sum, item) => sum + (item.duration || 0), 0);
    $("#stat-sessions").textContent = sessions.length;
    $("#stat-minutes").innerHTML = Math.round(seconds / 60) + " <em>min</em>";
    $("#stat-last").textContent = sessions.length ? new Date(sessions[0].createdAt).toLocaleDateString("es-CO", {day:"2-digit", month:"short"}) : "Aún no";
  }

  function renderExercises() {
    $("#exercise-grid").innerHTML = exercises.map((exercise, index) => `
      <article class="exercise-card">
        <div class="exercise-meta"><span>${exercise.module}</span><span>${exercise.time}</span></div>
        <h3>${exercise.title}</h3><p>${exercise.desc}</p>
        <button class="text-button" data-exercise="${index}">Practicar este ejercicio ↗</button>
      </article>`).join("");
    $$("[data-exercise]").forEach(button => button.addEventListener("click", () => {
      const exercise = exercises[Number(button.dataset.exercise)];
      $("#session-prompt").textContent = exercise.prompt;
      $("#record-hint").textContent = "Objetivo: " + exercise.goal;
      setView("entrenar");
      showToast("Ejercicio preparado en la sala de entrenamiento.");
    }));
  }

  function renderProgress() {
    const sessions = getSessions();
    const words = sessions.reduce((sum, item) => sum + (item.wordCount || 0), 0);
    const seconds = sessions.reduce((sum, item) => sum + (item.duration || 0), 0);
    $("#progress-sessions").textContent = sessions.length;
    $("#progress-words").textContent = words;
    $("#progress-minutes").textContent = Math.round(seconds / 60);
    const list = $("#history-list");
    if (!sessions.length) {
      list.innerHTML = '<div class="empty-state">Todavía no hay sesiones. Tu primera práctica aparecerá aquí.</div>';
      return;
    }
    list.innerHTML = sessions.map(item => `
      <div class="history-row"><div><strong>${escapeHtml(item.title || "Práctica libre")}</strong><p>${new Date(item.createdAt).toLocaleString("es-CO")} · ${item.wordCount || 0} palabras revisadas</p></div><span class="history-time">${formatTime(item.duration || 0)}</span></div>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }

  function setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      $("#transcript-status").textContent = "No disponible en este navegador";
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = event => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const phrase = event.results[i][0].transcript;
        if (event.results[i].isFinal) state.transcriptFinal += phrase.trim() + " ";
        else interim += phrase;
      }
      $("#transcript").value = (state.transcriptFinal + interim).trim();
    };
    recognition.onerror = event => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        $("#transcript-status").textContent = "Reconocimiento: " + event.error;
      }
    };
    recognition.onend = () => {
      if (state.recording) {
        try { recognition.start(); } catch {}
      }
    };
    return recognition;
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast("Este navegador no permite grabar audio. Prueba con Chrome actualizado y conexión HTTPS.");
      return;
    }
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation:true, noiseSuppression:true, autoGainControl:true}});
      state.chunks = [];
      state.samples = [];
      state.silenceDurations = [];
      state.transcriptFinal = "";
      $("#transcript").value = "";
      state.recorder = new MediaRecorder(state.stream);
      state.recorder.ondataavailable = event => { if (event.data.size) state.chunks.push(event.data); };
      state.recorder.onstop = finishAudio;
      state.recorder.start(500);
      state.startedAt = Date.now();
      state.elapsed = 0;
      state.recording = true;
      state.silenceStarted = null;
      $("#record-start").disabled = true;
      $("#record-stop").disabled = false;
      $("#record-orb").classList.add("recording");
      $("#record-state").textContent = "VOX ESTÁ ESCUCHANDO";
      $("#record-hint").textContent = "Habla con naturalidad. Puedes finalizar cuando termines.";
      $("#transcript-status").textContent = "Sesión activa";
      state.timerId = setInterval(() => {
        state.elapsed = (Date.now() - state.startedAt) / 1000;
        $("#timer").textContent = formatTime(state.elapsed);
      }, 250);
      setupAudioAnalysis();
      state.recognition = setupRecognition();
      if (state.recognition) {
        try { state.recognition.start(); $("#transcript-status").textContent = "Reconocimiento del navegador activo"; }
        catch { $("#transcript-status").textContent = "Grabación activa; transcripción no iniciada"; }
      }
    } catch (error) {
      showToast(error.name === "NotAllowedError" ? "Necesitas permitir el acceso al micrófono." : "No se pudo iniciar el micrófono: " + error.message);
    }
  }

  function setupAudioAnalysis() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !state.stream) return;
    state.audioContext = new AudioContextClass();
    const source = state.audioContext.createMediaStreamSource(state.stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 1024;
    source.connect(state.analyser);
    const data = new Uint8Array(state.analyser.fftSize);
    const canvas = $("#waveform");
    const ctx = canvas.getContext("2d");
    const draw = () => {
      if (!state.recording || !state.analyser) return;
      state.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const value = (data[i] - 128) / 128; sum += value * value; }
      const rms = Math.sqrt(sum / data.length);
      state.samples.push(rms);
      if (state.samples.length > 3000) state.samples.shift();
      const now = performance.now();
      if (rms < 0.012) {
        if (state.silenceStarted === null) state.silenceStarted = now;
      } else if (state.silenceStarted !== null) {
        const duration = now - state.silenceStarted;
        if (duration > 250) state.silenceDurations.push(duration);
        state.silenceStarted = null;
      }
      const width = canvas.width, height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#b7f36b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = Math.max(1, Math.floor(data.length / width));
      for (let x = 0; x < width; x++) {
        const value = (data[x * step] - 128) / 128;
        const y = height / 2 + value * height * .38;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      state.animationId = requestAnimationFrame(draw);
    };
    draw();
  }

  function stopRecording() {
    if (!state.recording) return;
    state.recording = false;
    clearInterval(state.timerId);
    cancelAnimationFrame(state.animationId);
    if (state.recognition) {
      state.recognition.onend = null;
      try { state.recognition.stop(); } catch {}
      state.recognition = null;
    }
    if (state.recorder && state.recorder.state !== "inactive") state.recorder.stop();
    if (state.stream) state.stream.getTracks().forEach(track => track.stop());
    if (state.audioContext) state.audioContext.close().catch(() => {});
    $("#record-start").disabled = false;
    $("#record-stop").disabled = true;
    $("#record-orb").classList.remove("recording");
    $("#record-state").textContent = "SESIÓN FINALIZADA";
    $("#record-hint").textContent = "Tu audio está listo. Puedes escucharlo y revisar la intervención.";
    $("#transcript-status").textContent = "Sesión finalizada";
    $("#timer").textContent = formatTime(state.elapsed);
    $("#analyze-btn").disabled = false;
  }

  function finishAudio() {
    const blob = new Blob(state.chunks, {type: state.recorder?.mimeType || "audio/webm"});
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioUrl = URL.createObjectURL(blob);
    $("#audio-player").src = state.audioUrl;
    $("#audio-player-wrap").hidden = false;
    $("#analyze-btn").disabled = false;
  }

  function analyzeText(text) {
    const clean = text.trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
    const lower = clean.toLowerCase();
    const fillers = ["eh", "este", "pues", "o sea", "digamos", "bueno", "como que", "básicamente", "literalmente"];
    const fillerHits = [];
    fillers.forEach(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = lower.match(new RegExp("\\b" + escaped + "\\b", "g"));
      if (matches?.length) fillerHits.push({word, count:matches.length});
    });
    const sentences = clean.split(/[.!?]+/).map(part => part.trim()).filter(Boolean);
    const longSentences = sentences.filter(sentence => sentence.split(/\s+/).length > 28);
    const repeated = words.length > 0 && new Set(words.map(word => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))).size / words.length < .62;
    return {words:words.length, sentences:sentences.length, fillerHits, longSentences, repeated, clean};
  }

  function createReport() {
    const text = $("#transcript").value;
    const result = analyzeText(text);
    const avgRms = state.samples.length ? state.samples.reduce((a,b)=>a+b,0) / state.samples.length : null;
    const pauses = state.silenceDurations.length;
    const cards = [];
    if (result.words) {
      cards.push({title:"Extensión de tu intervención",body:`Se detectaron ${result.words} palabras distribuidas en ${result.sentences} frases aproximadas. ${result.words < 35 ? "La muestra es breve; sirve para practicar, pero no permite evaluar toda tu capacidad comunicativa." : "Hay material suficiente para revisar algunos patrones del texto, aunque no para emitir un diagnóstico completo."}`,evidence:`${result.words} PALABRAS · ${result.sentences} FRASES`});
      if (result.fillerHits.length) {
        cards.push({title:"Expresiones de apoyo detectadas",body:"Aparecen expresiones que pueden funcionar como muletillas según el contexto. No todas son errores: revisa si aportan significado o solo ocupan espacio.",evidence:result.fillerHits.map(item=>item.word+" × "+item.count).join(" · ")});
      } else {
        cards.push({title:"Muletillas frecuentes",body:"No se detectaron las expresiones de apoyo más comunes en la lista básica de este prototipo. Esto no significa que no existan otras repeticiones.",evidence:"SIN COINCIDENCIAS EN LA LISTA BÁSICA"});
      }
      if (result.longSentences.length) {
        cards.push({title:"Frases extensas",body:"Hay frases de más de 28 palabras. Comprueba si contienen varias ideas que podrían separarse para facilitar la comprensión.",evidence:result.longSentences.length+" FRASE(S) LARGA(S)"});
      } else {
        cards.push({title:"Longitud de las frases",body:"No se detectaron frases de más de 28 palabras. Aun así, la claridad depende de la relación entre las ideas, no solo de la longitud.",evidence:"SIN FRASES LARGAS SEGÚN ESTE UMBRAL"});
      }
      cards.push({title:"Estructura y claridad",body:"Lee tu transcripción y comprueba si aparece una idea principal, una explicación y un cierre. Este prototipo todavía no interpreta el significado ni puede verificar argumentos o contradicciones.",evidence:"REVISIÓN SEMÁNTICA AUTOMÁTICA: NO CONECTADA"});
    } else {
      cards.push({title:"Transcripción pendiente",body:"No hay texto para analizar. Tu grabación se capturó, pero este navegador no entregó una transcripción. Puedes escribir lo que dijiste en el campo de transcripción y volver a revisar.",evidence:"SIN TEXTO DISPONIBLE"});
    }
    if (avgRms !== null) {
      cards.push({title:"Señal de audio",body:`Se calculó un nivel RMS medio aproximado de ${avgRms.toFixed(3)} durante la captura. Esta cifra depende del micrófono, distancia y ganancia; no mide autoridad, seguridad ni calidad vocal.`,evidence:"RMS MEDIO · "+avgRms.toFixed(3)});
      cards.push({title:"Pausas y silencios",body:`Se detectaron ${pauses} intervalos de silencio superiores a 250 ms usando un umbral acústico simple. Ruido ambiente y respiración pueden alterar este recuento.`,evidence:pauses+" INTERVALO(S) DETECTADO(S)"});
    } else {
      cards.push({title:"Análisis acústico",body:"No hay muestras acústicas disponibles para esta sesión. Graba una intervención para medir señales básicas del audio.",evidence:"SIN AUDIO ANALIZABLE"});
    }
    $("#report-content").innerHTML = '<div class="report-grid">'+cards.map(card=>`<article class="report-item"><h4>${escapeHtml(card.title)}</h4><p>${escapeHtml(card.body)}</p><div class="evidence">${escapeHtml(card.evidence)}</div></article>`).join("")+'</div><p class="report-disclaimer">Límite importante: este es un análisis local preliminar basado en reglas y señales simples. No utiliza un modelo de IA, no evalúa intención, personalidad, liderazgo ni emociones, y no sustituye una evaluación acústica o lingüística profesional.</p>';
    $("#report-panel").hidden = false;
    $("#report-panel").scrollIntoView({behavior:"smooth", block:"start"});
    const sessions = getSessions();
    sessions.unshift({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),createdAt:new Date().toISOString(),duration:Math.round(state.elapsed),wordCount:result.words,title:$("#session-prompt").textContent.slice(0,70),transcript:text});
    saveSessions(sessions);
    renderStats();
    renderProgress();
  }

  $("#record-start").addEventListener("click", startRecording);
  $("#record-stop").addEventListener("click", stopRecording);
  $("#analyze-btn").addEventListener("click", createReport);
  $("#clear-history").addEventListener("click", () => {
    if (!confirm("¿Quieres borrar todas las sesiones guardadas en este dispositivo? Esta acción no se puede deshacer.")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderStats(); renderProgress(); showToast("Historial local eliminado.");
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker:", error)));
  }
  renderStats();
  renderExercises();
})();