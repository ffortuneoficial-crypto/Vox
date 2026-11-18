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

/* Render the wireframe face and live voice response */
let voxAnalyser=null,voxAudioContext=null,voxAudioData=null,voxFrame=0,voxSpeechEnergy=0,voxSpeechUntil=0;
function initVoxHologram(){
  const canvas=$("#voxFace");if(!canvas)return;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  let w=0,h=0,dpr=1,last=0;
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);
    w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  if("ResizeObserver"in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener("resize",resize);
  resize();
  const rows=19,cols=17,points=[];
  for(let r=0;r<rows;r++){
    const v=r/(rows-1),row=[];
    const y=-1+v*2;
    const width=Math.sqrt(Math.max(0,1-y*y))*((v<.22)?(.82+v):1);
    for(let c=0;c<cols;c++){
      const u=c/(cols-1),x=(u*2-1)*width;
      const z=Math.sqrt(Math.max(0,1-x*x-y*y));
      row.push({x,y,z,u,v});
    }
    points.push(row);
  }
  const stars=Array.from({length:85},(_,i)=>({x:((i*73)%997)/997,y:((i*191)%991)/991,r:.35+(i%4)*.35,p:i*1.7}));
  const draw=(time)=>{
    voxFrame=requestAnimationFrame(draw);
    if(time-last<30)return;last=time;
    const state=$("#voiceOrb")?.dataset.state||"idle";
    let level=0;
    if(voxAnalyser&&state==="listening"&&voxAudioData){
      voxAnalyser.getByteTimeDomainData(voxAudioData);
      let sum=0;for(let i=0;i<voxAudioData.length;i++){const d=(voxAudioData[i]-128)/128;sum+=d*d;}
      level=Math.min(1,Math.sqrt(sum/voxAudioData.length)*4.5);
    }
    if(state==="speaking")level=Math.max(level,voxSpeechEnergy||(.18+.22*Math.abs(Math.sin(time*.012))));
    else if(state==="thinking")level=.08+.04*Math.sin(time*.004);
    else if(state==="listening")level=Math.max(.035,level);
    const t=time*.001,scale=Math.min(w/500,h/390),cx=w*.68,cy=h*.48;
    ctx.clearRect(0,0,w,h);
    const bg=ctx.createRadialGradient(cx,cy,5,cx,cy,Math.max(w,h)*.72);
    bg.addColorStop(0,"rgba(0,105,153,.16)");bg.addColorStop(.55,"rgba(0,43,83,.08)");bg.addColorStop(1,"rgba(0,5,30,0)");
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(const s of stars){const a=.12+.22*(.5+.5*Math.sin(t*1.2+s.p));ctx.fillStyle="rgba(74,222,255,"+a+")";ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();}
    const rot=Math.sin(t*.38)*.045,breath=1+Math.sin(t*1.2)*.008;
    const project=(p)=>{
      let x=p.x*Math.cos(rot)-p.z*Math.sin(rot),z=p.x*Math.sin(rot)+p.z*Math.cos(rot);
      const persp=1+z*.12;
      return {x:cx+x*145*scale*breath*persp,y:cy+p.y*174*scale*breath+Math.sin(t*1.4+p.x*3)*1.2*scale,z};
    };
    const projected=points.map(row=>row.map(project));
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    // triangulated facial mesh
    for(let r=0;r<rows-1;r++)for(let c=0;c<cols-1;c++){
      const a=projected[r][c],b=projected[r][c+1],d=projected[r+1][c],e=projected[r+1][c+1];
      const alpha=.16+Math.max(0,(a.z+b.z+d.z+e.z)/4)*.2;
      ctx.strokeStyle="rgba(37,213,244,"+alpha+")";ctx.lineWidth=.65*scale;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(e.x,e.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.stroke();
      if((r+c)%2===0){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(e.x,e.y);ctx.stroke();}
    }
    // bright facial contour and features
    const line=(pts,width=1.4,alpha=.8)=>{
      ctx.beginPath();pts.forEach((p,i)=>{const q=project(p);if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});
      ctx.strokeStyle="rgba(49,225,255,"+alpha+")";ctx.lineWidth=width*scale;ctx.shadowColor="#00cfff";ctx.shadowBlur=8*scale;ctx.stroke();ctx.shadowBlur=0;
    };
    const curve=(fn,a,b,n=40)=>{const arr=[];for(let i=0;i<=n;i++){const x=a+(b-a)*i/n;arr.push(fn(x));}line(arr,1.5,.92);};
    // eyes, brows, nose, lips and jaw are drawn as luminous wire contours
    for(const side of [-1,1]){
      curve(x=>({x:x*side,y:-.31-.055*Math.sin((x+.25)*Math.PI*2),z:.82}),.12,.62,18);
      curve(x=>({x:x*side,y:-.39-.035*Math.sin((x+.2)*Math.PI*2),z:.8}),.13,.6,16);
      curve(x=>({x:x*side,y:-.48-.035*Math.sin((x+.1)*Math.PI*2),z:.72}),.13,.58,16);
    }
    curve(x=>({x,y:-.58-.06*Math.sin((x+1)*Math.PI/2),z:.65}),-.58,.58,22);
    line([{x:0,y:-.38,z:.9},{x:-.035,y:-.08,z:.96},{x:-.12,y:.03,z:.92},{x:0,y:.09,z:.95},{x:.12,y:.03,z:.92}],1.6,.85);
    curve(x=>({x,y:.27+.035*Math.cos(x*5)+level*.09*Math.cos(x*9),z:.9}),-.37,.37,26);
    curve(x=>({x,y:.34-level*.12*Math.cos(x*4),z:.91}),-.35,.35,26);
    curve(x=>({x,y:.3+level*.15*Math.cos(x*4),z:.93}),-.28,.28,22);
    // jaw and cheekbone contour
    curve(x=>({x,y:.25+.75*Math.sqrt(Math.max(0,1-x*x)),z:.65}),-.94,.94,34);
    // glowing vertices
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const p=projected[r][c];if((r*3+c*5)%4===0){ctx.fillStyle="rgba(111,245,255,"+(.28+p.z*.35)+")";ctx.beginPath();ctx.arc(p.x,p.y,(.7+p.z*.7)*scale,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
    // audio waveform, brighter and more active while speaking/listening
    const baseY=h*.72,startX=w*.035,endX=w*.39,bars=64,gap=(endX-startX)/bars;
    for(let i=0;i<bars;i++){
      const wave=Math.abs(Math.sin(i*.29+t*(state==="speaking"?8:3))*.52+Math.sin(i*.11-t*2)*.28);
      const envelope=Math.exp(-Math.pow((i-bars*.48)/(bars*.38),2));
      const height=(3+wave*18+level*36*envelope)*Math.min(1,scale);
      const x=startX+i*gap;
      const grad=ctx.createLinearGradient(0,baseY-height,0,baseY+height);grad.addColorStop(0,"rgba(35,225,255,.04)");grad.addColorStop(.5,"rgba(74,237,255,"+(.45+level*.45)+")");grad.addColorStop(1,"rgba(35,225,255,.04)");
      ctx.fillStyle=grad;ctx.shadowColor="#00cfff";ctx.shadowBlur=level>0.15?7:3;
      ctx.fillRect(x,baseY-height/2,Math.max(1,gap*.48),height);
    }
    ctx.shadowBlur=0;
  };
  cancelAnimationFrame(voxFrame);voxFrame=requestAnimationFrame(draw);
}
function setVoxAudioStream(mediaStream){
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    voxAudioContext?.close();voxAudioContext=new AudioCtx();
    const source=voxAudioContext.createMediaStreamSource(mediaStream);
    voxAnalyser=voxAudioContext.createAnalyser();voxAnalyser.fftSize=256;
    voxAudioData=new Uint8Array(voxAnalyser.fftSize);source.connect(voxAnalyser);
    voxAudioContext.resume?.();
  }catch(error){console.warn("VOX visual audio analyser:",error);}
}

function setOrbState(state,title,caption){
  const orb=$("#voiceOrb");if(!orb)return;
  orb.dataset.state=state;
  if(state!=="speaking")voxSpeechEnergy=0;
  orb.setAttribute("aria-label",title||"VOX");
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
  utterance.onboundary=event=>{const ch=text.slice(event.charIndex,event.charIndex+Math.max(1,event.charLength||2));voxSpeechEnergy=/[aeiouáéíóú]/i.test(ch)?(.28+Math.random()*.48):(.12+Math.random()*.22);};
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
initVoxHologram();
requireSession();
})();