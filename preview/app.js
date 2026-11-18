(()=>{"use strict";
const $=selector=>document.querySelector(selector);
const API="http://127.0.0.1:8766";
const SUPABASE_URL="https://kmwmwacgsojpkbqwhomd.supabase.co";
const SUPABASE_KEY="sb_publishable_cS2Rrx0VuOUsQNLd33gNZQ_fgWf0BrI";
const supabaseClient=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const screens=["home"];
let recorder=null,stream=null,chunks=[],messages=[],busy=false,sessionActive=false,currentUser=null,focusMode="libre";

function show(id){
  if(!screens.includes(id))return;
  screens.forEach(name=>$("#"+name)?.classList.toggle("active",name===id));
  document.querySelectorAll(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.go===id));
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="home")checkEngine();
}
function toast(message){
  const el=$("#appMessage");el.textContent=message;el.hidden=false;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4200);
}
function setUser(user){
  currentUser=user||null;
  const email=currentUser?.email||"Tu espacio";
  const rawName=currentUser?.user_metadata?.full_name||currentUser?.user_metadata?.name||currentUser?.email?.split("@")[0]||"Cris";
  const firstName=String(rawName).trim().split(/[ ._-]+/)[0];
  const greeting=$("#homeGreeting");if(greeting)greeting.textContent="Hola, "+(firstName||"Cris");
  /* La cuenta se mantiene autenticada sin mostrar datos en esta pantalla. */
}
async function requireSession(){
  if(!supabaseClient){window.location.replace("./auth.html?reason=connection");return;}
  try{
    const {data,error}=await supabaseClient.auth.getSession();
    if(error)throw error;
    if(!data.session){window.location.replace("./auth.html");return;}
    setUser(data.session.user);
    document.body.classList.add("app-ready");
    $("#appBoot").classList.add("is-done");
    checkEngine();
    supabaseClient.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"||!session){window.location.replace("./auth.html");return;}
      setUser(session.user);
    });
  }catch(error){
    console.error("VOX session check:",error);
    window.location.replace("./auth.html?reason=connection");
  }
}
function status(message,kind=""){ /* Estado interno: la pantalla principal permanece limpia. */ }
function setBusy(value){busy=value;$("#voiceOrb").disabled=value;$("#voiceAction").disabled=value;}

/* VOX — live visual response for the abstract intelligence core */
let voxAnalyser=null,voxAudioContext=null,voxAudioData=null,voxAudioFrame=0,voxSpeechEnergy=0;
function initVoxCore(){setOrbState("idle","Estoy aquí","Puedes escribirme o hablar conmigo.");}
function setVoxAudioStream(mediaStream){
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    voxAudioContext?.close();voxAudioContext=new AudioCtx();
    const source=voxAudioContext.createMediaStreamSource(mediaStream);
    voxAnalyser=voxAudioContext.createAnalyser();voxAnalyser.fftSize=256;
    voxAudioData=new Uint8Array(voxAnalyser.fftSize);source.connect(voxAnalyser);
    voxAudioContext.resume?.();
    const animate=()=>{
      if(!voxAnalyser||!voxAudioData)return;
      voxAnalyser.getByteTimeDomainData(voxAudioData);
      let sum=0;for(let i=0;i<voxAudioData.length;i++){const d=(voxAudioData[i]-128)/128;sum+=d*d;}
      const level=Math.min(1,Math.sqrt(sum/voxAudioData.length)*5);
      document.documentElement.style.setProperty("--voice-energy",String(level));
      voxAudioFrame=requestAnimationFrame(animate);
    };
    cancelAnimationFrame(voxAudioFrame);voxAudioFrame=requestAnimationFrame(animate);
  }catch(error){console.warn("VOX audio visualizer:",error);}
}
function setOrbState(state,title,caption){
  const orb=$("#voiceOrb");if(!orb)return;
  orb.dataset.state=state;
  if(state!=="speaking")voxSpeechEnergy=0;
  orb.setAttribute("aria-label",title||"VOX");\n  $("#voxCore")?.setAttribute("data-state",state);
  const stateLabel=$("#orbState"),captionLabel=$("#orbCaption"),actionLabel=$("#voiceActionLabel");
  if(stateLabel&&title)stateLabel.textContent=title;
  if(captionLabel&&caption)captionLabel.textContent=caption;
  if(actionLabel){
    actionLabel.textContent=state==="listening"?"Terminar de hablar":state==="thinking"?"Preparando respuesta…":state==="speaking"?"VOX está hablando":"Comenzar conversación";
  }
}
function addMessage(role,content){ /* El contexto vive en memoria; VOX no presenta una interfaz de chat. */ }
async function checkEngine(){
  try{
    const response=await fetch(API+"/api/health",{cache:"no-store"});
    if(!response.ok)throw new Error("No disponible");
    const data=await response.json();
    if(data.whisper&&data.omni)status("Motor local conectado","online");
    else status("Falta conectar un servicio local","error");
  }catch{status("Motor local desconectado · inicia VOX en Termux","error");}
}
async function startRecording(){
  if(busy||recorder)return;
  try{
    const health=await fetch(API+"/api/health",{cache:"no-store"});
    if(!health.ok)throw new Error("No se encuentra el motor local");
    const data=await health.json();
    if(!data.whisper||!data.omni)throw new Error("Whisper u OmniRoute no están disponibles");
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    setVoxAudioStream(stream);
    chunks=[];
    const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(type=>MediaRecorder.isTypeSupported(type));
    recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    recorder.ondataavailable=event=>{if(event.data&&event.data.size)chunks.push(event.data);};
    recorder.onstop=processRecording;recorder.start();sessionActive=true;
    setOrbState("listening","Te escucho","Habla con naturalidad. Estoy prestando atención.");
  }catch(error){
    status("No se pudo iniciar el micrófono","error");setOrbState("idle","Estoy aquí","Cuando quieras, podemos empezar otra vez.");
    toast(error.message==="Failed to fetch"?"No encuentro el motor local. Inicia los servicios en Termux.":error.message||"Revisa el permiso del micrófono.");
  }
}
function stopRecording(){
  if(recorder&&recorder.state!=="inactive"){
    recorder.stop();setOrbState("thinking","Estoy pensando","Estoy preparando una respuesta para ayudarte.");
    if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}
    voxAnalyser=null;voxAudioData=null;voxAudioContext?.close();voxAudioContext=null;
  }
}
async function processRecording(){
  const type=recorder?.mimeType||"audio/webm";recorder=null;
  const blob=new Blob(chunks,{type});chunks=[];
  if(blob.size<1200){status("No se detectó suficiente audio","");setOrbState("idle","Tocar para hablar con VOX");return;}
  setBusy(true);setOrbState("thinking","Estoy pensando");
  try{
    const transcribe=await fetch(API+"/api/transcribe",{method:"POST",headers:{"Content-Type":type},body:blob});
    if(!transcribe.ok)throw new Error(await responseError(transcribe));
    const result=await transcribe.json(),spoken=(result.text||"").trim();
    if(!spoken){status("No pude reconocer esas palabras","");toast("Inténtalo otra vez, hablando con claridad.");return;}
    if(!messages.length){
      const focusInstructions={
        libre:"Eres VOX, un entrenador de voz y comunicación. Mantén una conversación natural, cálida e inteligente. Escucha primero, haz preguntas útiles y ayuda al usuario a expresarse mejor sin convertir cada respuesta en una clase.",
        seguridad:"Eres VOX, un entrenador experto en seguridad al hablar. Ayuda al usuario a expresarse con confianza, reducir dudas y comunicar sus ideas con firmeza. Practica con situaciones reales, da una observación concreta cada vez y evita elogios vacíos.",
        claridad:"Eres VOX, un entrenador experto en claridad, dicción y expresión oral. Ayuda al usuario a ordenar ideas, articular con precisión y explicar de forma comprensible. Propón ejercicios breves dentro de la conversación y da correcciones específicas y respetuosas.",
        liderazgo:"Eres VOX, un entrenador de comunicación y liderazgo. Ayuda al usuario a transmitir autoridad serena, estructurar mensajes y adaptar el tono a situaciones laborales. Simula conversaciones reales y ofrece feedback directo, concreto y respetuoso."
      };
      messages.push({role:"system",content:focusInstructions[focusMode]});
    }
    messages.push({role:"user",content:spoken});addMessage("user",spoken);status("VOX está pensando…");
    const response=await fetch(API+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
    if(!response.ok)throw new Error(await responseError(response));
    const answer=await response.json(),reply=(answer.text||"").trim();
    if(!reply)throw new Error("El modelo no devolvió una respuesta.");
    messages.push({role:"assistant",content:reply});addMessage("assistant",reply);
    status("VOX está disponible","online");speak(reply);
  }catch(error){status("No se pudo completar la respuesta","error");setOrbState("idle","Tocar para hablar con VOX");toast(error.message||"Error de conexión.");}
  finally{setBusy(false);}
}
async function responseError(response){
  try{const data=await response.json();return data.error||"Error del motor local ("+response.status+")";}
  catch{return"Error del motor local ("+response.status+")";}
}
function speak(text){
  if(!("speechSynthesis"in window)){setOrbState("idle","Tocar para hablar con VOX");return;}
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="es-ES";utterance.rate=1;
  utterance.onstart=()=>{voxSpeechUntil=Date.now()+text.length*45;setOrbState("speaking","VOX está hablando");};
  utterance.onboundary=event=>{const ch=text.slice(event.charIndex,event.charIndex+Math.max(1,event.charLength||2));voxSpeechEnergy=/[aeiouáéíóú]/i.test(ch)?(.28+Math.random()*.48):(.12+Math.random()*.22);document.documentElement.style.setProperty("--voice-energy",String(voxSpeechEnergy));};
  utterance.onend=()=>{voxSpeechEnergy=0;setOrbState("idle","Tocar para hablar con VOX");};
  utterance.onerror=()=>{voxSpeechEnergy=0;setOrbState("idle","Tocar para hablar con VOX");};
  window.speechSynthesis.speak(utterance);
}
function endSession(){
  if(recorder)stopRecording();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  setOrbState("idle","Tocar para hablar con VOX");
  if(sessionActive&&messages.length){
    const count=Number(localStorage.getItem("vox.sessionCount")||0)+1;
    localStorage.setItem("vox.sessionCount",String(count));$("#sessionCount").textContent=String(count);
  }
  messages=[];sessionActive=false;
  $("#conversation").innerHTML="";
  status("Sesión finalizada","");
}

function ensureFocusPrompt(){
  if(messages.some(message=>message.role==="system"))return;
  const prompts={
    libre:"Eres VOX, un entrenador de voz y comunicación. Mantén una conversación natural, cálida e inteligente. Escucha primero, haz preguntas útiles y ayuda al usuario a expresarse mejor sin convertir cada respuesta en una clase.",
    seguridad:"Eres VOX, un entrenador experto en seguridad al hablar. Ayuda al usuario a expresarse con confianza, reducir dudas y comunicar sus ideas con firmeza. Practica con situaciones reales, da una observación concreta cada vez y evita elogios vacíos.",
    claridad:"Eres VOX, un entrenador experto en claridad, dicción y expresión oral. Ayuda al usuario a ordenar ideas, articular con precisión y explicar de forma comprensible. Propón ejercicios breves dentro de la conversación y da correcciones específicas y respetuosas.",
    liderazgo:"Eres VOX, un entrenador de comunicación y liderazgo. Ayuda al usuario a transmitir autoridad serena, estructurar mensajes y adaptar el tono a situaciones laborales. Simula conversaciones reales y ofrece feedback directo, concreto y respetuoso."
  };
  messages.push({role:"system",content:prompts[focusMode]||prompts.libre});
}
async function sendTextMessage(value){
  const content=value.trim();if(!content||busy)return;
  ensureFocusPrompt();
  messages.push({role:"user",content});sessionActive=true;
  setBusy(true);setOrbState("thinking","Estoy pensando","Estoy preparando una respuesta.");
  try{
    const response=await fetch(API+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
    if(!response.ok)throw new Error(await responseError(response));
    const result=await response.json(),reply=(result.text||"").trim();
    if(!reply)throw new Error("El modelo no devolvió una respuesta.");
    messages.push({role:"assistant",content:reply});speak(reply);
  }catch(error){setOrbState("idle","Estoy aquí");toast(error.message||"No pude conectar con VOX.");}
  finally{setBusy(false);}
}
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>show(button.dataset.go)));
$("#logoutButton").addEventListener("click",async()=>{
  if(!supabaseClient)return;
  const button=$("#logoutButton");button.disabled=true;
  const {error}=await supabaseClient.auth.signOut();
  if(error){toast(error.message||"No se pudo cerrar la sesión.");button.disabled=false;}
  else window.location.replace("./auth.html");
});
const toggleVoice=()=>{if(recorder){stopRecording();return;}if(window.speechSynthesis?.speaking)window.speechSynthesis.cancel();startRecording();};
$("#voiceOrb").addEventListener("click",toggleVoice);
$("#messageForm").addEventListener("submit",event=>{event.preventDefault();const input=$("#messageInput");const value=input.value;input.value="";sendTextMessage(value);});
$("#voiceAction").addEventListener("click",toggleVoice);
document.querySelectorAll("[data-focus]").forEach(button=>button.addEventListener("click",()=>{
  if(recorder||busy){toast("Espera a que termine la intervención para cambiar el enfoque.");return;}
  if(messages.length){messages=[];sessionActive=false;if(window.speechSynthesis?.speaking)window.speechSynthesis.cancel();}
  focusMode=button.dataset.focus;
  document.querySelectorAll("[data-focus]").forEach(option=>{
    const active=option===button;option.classList.toggle("active",active);option.setAttribute("aria-pressed",String(active));
  });
  const descriptions={libre:"Toca el botón y empecemos a practicar.",seguridad:"Trabajaremos confianza y firmeza al expresarte.",claridad:"Practicaremos dicción y claridad al comunicar tus ideas.",liderazgo:"Entrenaremos presencia y comunicación con autoridad."};
  $("#orbCaption").textContent=descriptions[focusMode];
}));
$("#menuButton").addEventListener("click",()=>{const panel=$("#menuPanel"),open=panel.hidden;panel.hidden=!open;$("#menuButton").setAttribute("aria-expanded",String(open));});
document.addEventListener("click",event=>{if(!event.target.closest("#menuButton")&&!event.target.closest("#menuPanel")){$("#menuPanel").hidden=true;$("#menuButton").setAttribute("aria-expanded","false");}});
$("#sessionCount").textContent=localStorage.getItem("vox.sessionCount")||"0";
if("serviceWorker"in navigator&&location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
initVoxCore();
requireSession();
})();