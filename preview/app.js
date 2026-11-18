(()=>{"use strict";
const $=selector=>document.querySelector(selector);
const API="http://127.0.0.1:8766";
const SUPABASE_URL="https://kmwmwacgsojpkbqwhomd.supabase.co";
const SUPABASE_KEY="sb_publishable_cS2Rrx0VuOUsQNLd33gNZQ_fgWf0BrI";
const supabaseClient=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const screens=["home"];
let recorder=null,stream=null,chunks=[],messages=[],busy=false,sessionActive=false,currentUser=null;

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
  $("#accountStatus").textContent=email.length>24?email.slice(0,21)+"…":email;
  $("#accountStatus").title=email;
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
function status(message,kind=""){
  const el=$("#engineStatus");el.className="engine-status "+kind;el.querySelector("span").textContent=message;
}
function setBusy(value){busy=value;$("#talkButton").disabled=value;$("#endButton").disabled=value;}
function setOrbState(state,title,caption){
  const orb=$("#voiceOrb");if(!orb)return;
  orb.dataset.state=state;
  orb.setAttribute("aria-label",title||"VOX");
  $("#orbState").textContent=title||"VOX";
  if(caption)$("#orbCaption").textContent=caption;
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
    chunks=[];
    const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(type=>MediaRecorder.isTypeSupported(type));
    recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    recorder.ondataavailable=event=>{if(event.data&&event.data.size)chunks.push(event.data);};
    recorder.onstop=processRecording;recorder.start();sessionActive=true;
    $("#talkButton").classList.add("recording");$("#talkLabel").textContent="Terminar de hablar";setOrbState("listening","Te escucho","Estoy atento a lo que quieres decir.");
    $("#controlHint").textContent="Te estoy escuchando. Toca cuando hayas terminado.";status("Escuchando…","online");
  }catch(error){
    status("No se pudo iniciar el micrófono","error");setOrbState("idle","No pude escucharte","Revisa el permiso del micrófono.");
    toast(error.message==="Failed to fetch"?"No encuentro el motor local. Inicia los servicios en Termux.":error.message||"Revisa el permiso del micrófono.");
  }
}
function stopRecording(){
  if(recorder&&recorder.state!=="inactive"){
    recorder.stop();$("#talkButton").classList.remove("recording");$("#talkLabel").textContent="Hablar con VOX";
    $("#controlHint").textContent="Estoy procesando lo que me dijiste.";setOrbState("thinking","Estoy pensando","Dame un momento para preparar mi respuesta.");
    if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}
  }
}
async function processRecording(){
  const type=recorder?.mimeType||"audio/webm";recorder=null;
  const blob=new Blob(chunks,{type});chunks=[];
  if(blob.size<1200){status("No se detectó suficiente audio","");$("#controlHint").textContent="Prueba otra vez y habla un poco más cerca del micrófono.";setOrbState("idle","No te escuché","Acércate un poco al micrófono e inténtalo de nuevo.");return;}
  setBusy(true);setOrbState("thinking","Estoy escuchando","Estoy comprendiendo tu mensaje.");status("Entendiendo lo que dijiste…");
  try{
    const transcribe=await fetch(API+"/api/transcribe",{method:"POST",headers:{"Content-Type":type},body:blob});
    if(!transcribe.ok)throw new Error(await responseError(transcribe));
    const result=await transcribe.json(),spoken=(result.text||"").trim();
    if(!spoken){status("No pude reconocer esas palabras","");toast("Inténtalo otra vez, hablando con claridad.");return;}
    messages.push({role:"user",content:spoken});addMessage("user",spoken);status("VOX está pensando…");
    const response=await fetch(API+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
    if(!response.ok)throw new Error(await responseError(response));
    const answer=await response.json(),reply=(answer.text||"").trim();
    if(!reply)throw new Error("El modelo no devolvió una respuesta.");
    messages.push({role:"assistant",content:reply});addMessage("assistant",reply);
    status("VOX está disponible","online");$("#controlHint").textContent="Puedes volver a hablar cuando quieras.";speak(reply);
  }catch(error){status("No se pudo completar la respuesta","error");setOrbState("idle","Algo salió mal","Revisa el motor local e inténtalo de nuevo.");toast(error.message||"Error de conexión.");}
  finally{setBusy(false);}
}
async function responseError(response){
  try{const data=await response.json();return data.error||"Error del motor local ("+response.status+")";}
  catch{return"Error del motor local ("+response.status+")";}
}
function speak(text){
  if(!("speechSynthesis"in window)){setOrbState("idle","Respuesta lista","Tu respuesta está preparada.");return;}
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="es-ES";utterance.rate=1;
  utterance.onstart=()=>setOrbState("speaking","VOX está hablando","Escucha. Estoy aquí contigo.");
  utterance.onend=()=>setOrbState("idle","Estoy aquí","Cuando quieras, seguimos hablando.");
  utterance.onerror=()=>setOrbState("idle","Estoy aquí","Puedes volver a hablar cuando quieras.");
  window.speechSynthesis.speak(utterance);
}
function endSession(){
  if(recorder)stopRecording();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  setOrbState("idle","Estoy aquí","Toca el micrófono cuando quieras volver a hablar.");
  if(sessionActive&&messages.length){
    const count=Number(localStorage.getItem("vox.sessionCount")||0)+1;
    localStorage.setItem("vox.sessionCount",String(count));$("#sessionCount").textContent=String(count);
  }
  messages=[];sessionActive=false;
  $("#conversation").innerHTML="";
  $("#controlHint").textContent="Toca para empezar a hablar. Toca de nuevo cuando termines.";
  status("Sesión finalizada","");toast("Sesión cerrada. No se guardó la conversación.");
}
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>show(button.dataset.go)));
$("#logoutButton").addEventListener("click",async()=>{
  if(!supabaseClient)return;
  const button=$("#logoutButton");button.disabled=true;
  const {error}=await supabaseClient.auth.signOut();
  if(error){toast(error.message||"No se pudo cerrar la sesión.");button.disabled=false;}
  else window.location.replace("./auth.html");
});
$("#talkButton").addEventListener("click",()=>recorder?stopRecording():startRecording());
$("#endButton").addEventListener("click",endSession);
$("#sessionCount").textContent=localStorage.getItem("vox.sessionCount")||"0";
if("serviceWorker"in navigator&&location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
requireSession();
})();