(()=>{"use strict";
const $=s=>document.querySelector(s);
const views=["home","practice","history"];
let recorder=null,stream=null,recognition=null,started=0,tick=null,elapsed=0,recording=false,installPrompt=null;
const storeKey="vox.preview.sessions.v2";
let memorySessions=[];
const getSessions=()=>{try{const value=localStorage.getItem(storeKey);return value?JSON.parse(value):memorySessions}catch{return memorySessions}};
const setSessions=value=>{memorySessions=value;try{localStorage.setItem(storeKey,JSON.stringify(value))}catch{showMessage("El almacenamiento del navegador está bloqueado. La sesión no pudo guardarse de forma permanente.")}};
const words=s=>(s.trim().match(/\S+/g)||[]).length;
function showMessage(message){const box=$("#appMessage");if(box){box.textContent=message;box.hidden=false}}
function hideMessage(){const box=$("#appMessage");if(box){box.textContent="";box.hidden=true}}
function show(id){views.forEach(v=>{const el=$("#"+v);if(el)el.classList.toggle("active",v===id)});document.querySelectorAll(".navitem").forEach(b=>b.classList.toggle("active",b.dataset.view===id));if(id==="history")renderHistory();hideMessage()}
function fmt(n){n=Math.max(0,Math.floor(Number(n)||0));return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
function refreshStats(){const all=getSessions();$("#sessionCount").textContent=all.length;$("#wordCount").textContent=all.reduce((a,x)=>a+(x.words||0),0)}
function setupBars(){const box=$("#bars");if(!box)return;box.replaceChildren();for(let i=0;i<43;i++){const s=document.createElement("span");s.style.setProperty("--h",(12+Math.round(Math.abs(Math.sin(i*2.31))*55))+"px");s.style.setProperty("--d",(i%9)*-.08+"s");box.append(s)}}
function stopSpeech(){if(!recognition)return;const current=recognition;recognition=null;current.onend=null;current.onerror=null;try{current.stop()}catch{}}
function startSpeech(){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){$("#transcriptStatus").textContent="Dictado no disponible";$("#recordMessage").textContent="Puedes escribir tu práctica en el campo de texto.";return}
 try{
  recognition=new API();recognition.lang="es-CO";recognition.continuous=true;recognition.interimResults=true;
  recognition.onresult=e=>{let out="";for(let i=0;i<e.results.length;i++)out+=e.results[i][0].transcript+" ";const field=$("#transcript");field.value=out.trim();updateWords()};
  recognition.onerror=e=>{$("#transcriptStatus").textContent="Dictado no disponible ("+e.error+"). Puedes escribir."};
  recognition.onend=()=>{if(recording&&recognition){try{recognition.start()}catch{}}};
  recognition.start();$("#transcriptStatus").textContent="Dictado del navegador activo";
 }catch{$("#transcriptStatus").textContent="Dictado no disponible. Puedes escribir."}
}
async function start(){
 if(recording)return;hideMessage();
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){showMessage("Este navegador no permite grabar audio. Abre VOX en Chrome actualizado y usa HTTPS.");return}
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(!stream.getAudioTracks().some(t=>t.readyState==="live"))throw new Error("No se pudo activar el micrófono.");
  recorder=new MediaRecorder(stream);recorder.onstop=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;$("#saveBtn").disabled=!$("#transcript").value.trim()};
  recorder.onerror=()=>showMessage("La grabación tuvo un problema. Inténtalo de nuevo.");
  recorder.start();recording=true;started=Date.now();elapsed=0;
  $("#recordBtn").disabled=true;$("#stopBtn").disabled=false;$("#micState").classList.add("active");$("#micState").innerHTML="<i></i> MICRÓFONO ACTIVO";$("#visualizer").classList.add("live");$("#recordMessage").textContent="Te estamos escuchando. Habla con naturalidad.";$ ("#transcriptStatus").textContent="Esperando transcripción";$("#timer").textContent="00:00";
  tick=setInterval(()=>{$("#timer").textContent=fmt((Date.now()-started)/1000)},250);startSpeech();
 }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;recording=false;$("#recordBtn").disabled=false;$("#stopBtn").disabled=true;showMessage(e.name==="NotAllowedError"?"Permite el acceso al micrófono desde los ajustes del navegador.":e.name==="NotFoundError"?"No se encontró un micrófono disponible.":("No se pudo iniciar el micrófono: "+(e.message||"error desconocido")))}
}
function stop(){
 if(!recording)return;recording=false;elapsed=(Date.now()-started)/1000;clearInterval(tick);tick=null;stopSpeech();
 if(recorder&&recorder.state!=="inactive"){try{recorder.stop()}catch{stream?.getTracks().forEach(t=>t.stop());stream=null}}else{stream?.getTracks().forEach(t=>t.stop());stream=null}
 $("#recordBtn").disabled=false;$("#stopBtn").disabled=true;$("#micState").classList.remove("active");$("#micState").innerHTML="<i></i> MICRÓFONO APAGADO";$("#visualizer").classList.remove("live");$("#recordMessage").textContent="Sesión terminada. Revisa y guarda tu práctica.";$ ("#timer").textContent=fmt(elapsed);$("#transcriptStatus").textContent="Puedes revisar el texto";$("#saveBtn").disabled=!$("#transcript").value.trim()
}
function updateWords(){const n=words($("#transcript").value);$("#wordTally").textContent=n+" palabras";if(!recording)$("#saveBtn").disabled=n===0}
function save(){
 const text=$("#transcript").value.trim();if(!text){showMessage("Habla o escribe algo antes de guardar.");return}
 const all=getSessions();all.unshift({id:Date.now(),date:new Date().toISOString(),text,words:words(text),duration:Math.round(elapsed)});setSessions(all.slice(0,100));
 $("#transcript").value="";$("#saveBtn").disabled=true;elapsed=0;$("#timer").textContent="00:00";updateWords();refreshStats();show("history")
}
function renderHistory(){
 const all=getSessions(),el=$("#historyList");if(!all.length){el.innerHTML='<p class="empty">Todavía no hay sesiones guardadas. Tu primera práctica aparecerá aquí.</p>';return}
 el.replaceChildren();all.forEach(x=>{const article=document.createElement("article");article.className="history-item";const info=document.createElement("div"),title=document.createElement("strong"),meta=document.createElement("p"),duration=document.createElement("span");title.textContent="Práctica de comunicación";meta.textContent=new Date(x.date).toLocaleString("es-CO")+" · "+(x.words||0)+" palabras";duration.textContent=fmt(x.duration);info.append(title,meta);article.append(info,duration);el.append(article)})
}
$("#goPractice").addEventListener("click",()=>show("practice"));document.querySelectorAll("[data-home]").forEach(b=>b.addEventListener("click",()=>show("home")));document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));$("#recordBtn").addEventListener("click",start);$("#stopBtn").addEventListener("click",stop);$("#saveBtn").addEventListener("click",save);$("#transcript").addEventListener("input",updateWords);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#install").hidden=false});
$("#install").addEventListener("click",async()=>{if(!installPrompt){showMessage("Para instalar VOX, abre el menú de Chrome y elige «Instalar aplicación» o «Añadir a pantalla de inicio».");return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#install").hidden=true});
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>showMessage("La aplicación funciona, pero no se pudo activar el modo sin conexión.")));
setupBars();refreshStats();updateWords();
})();