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

/* VOX hologram — human side-profile mesh with live audio response */
let voxAnalyser=null,voxAudioContext=null,voxAudioData=null,voxFrame=0,voxSpeechEnergy=0;
function initVoxHologram(){
  const canvas=$("#voxFace");if(!canvas)return;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  let w=0,h=0,dpr=1,lastFrame=0;
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  if("ResizeObserver"in window)new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize",resize);
  resize();

  // Asymmetric silhouette: forehead, nose, lips, chin, jaw and rear skull.
  const outline=[
    [.51,.015],[.39,.02],[.29,.055],[.20,.11],[.14,.19],[.11,.27],
    [.055,.335],[.065,.375],[.12,.405],[.105,.435],[.135,.465],
    [.18,.485],[.155,.525],[.20,.555],[.235,.575],[.245,.615],
    [.285,.67],[.36,.72],[.47,.755],[.585,.735],[.68,.675],
    [.755,.595],[.835,.535],[.895,.465],[.925,.365],[.90,.265],
    [.835,.17],[.735,.095],[.625,.035],[.55,.012]
  ];
  const inside=(p,poly)=>{
    let hit=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))hit=!hit;
    }
    return hit;
  };
  let seed=4817;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const points=[];
  // Boundary samples retain the silhouette while the interior points make an irregular mesh.
  outline.forEach((p,i)=>{
    const q=outline[(i+1)%outline.length];
    for(let k=0;k<3;k++){const t=k/3;points.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
  });
  const rows=19,cols=18;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=.075+c/ (cols-1)*.84+(rand()-.5)*.025;
    const y=.035+r/(rows-1)*.70+(rand()-.5)*.025;
    if(inside([x,y],outline))points.push([x,y]);
  }
  const anchors=[
    [.29,.29],[.39,.30],[.55,.285],[.66,.30],[.20,.39],[.13,.43],
    [.21,.50],[.30,.55],[.37,.59],[.42,.68],[.58,.70],[.74,.53],
    [.77,.38],[.48,.14],[.65,.13]
  ];
  anchors.forEach(p=>points.push(p));

  // Bowyer-Watson Delaunay triangulation: natural, non-grid triangular facets.
  function triangulate(input){
    const pts=input.map(p=>({x:p[0],y:p[1]})),n=pts.length;
    pts.push({x:-10,y:-10},{x:10,y:-10},{x:0,y:10});
    const circle=(a,b,c)=>{
      const d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));
      if(Math.abs(d)<1e-9)return null;
      const aa=a.x*a.x+a.y*a.y,bb=b.x*b.x+b.y*b.y,cc=c.x*c.x+c.y*c.y;
      const x=(aa*(b.y-c.y)+bb*(c.y-a.y)+cc*(a.y-b.y))/d;
      const y=(aa*(c.x-b.x)+bb*(a.x-c.x)+cc*(b.x-a.x))/d;
      return {x,y,r2:(x-a.x)**2+(y-a.y)**2};
    };
    let triangles=[{v:[n,n+1,n+2],c:circle(pts[n],pts[n+1],pts[n+2])}];
    for(let i=0;i<n;i++){
      const bad=[];
      for(const tr of triangles)if(tr.c&&(pts[i].x-tr.c.x)**2+(pts[i].y-tr.c.y)**2<=tr.c.r2+1e-9)bad.push(tr);
      const edges=new Map();
      bad.forEach(tr=>{
        const v=tr.v;
        [[v[0],v[1]],[v[1],v[2]],[v[2],v[0]]].forEach(e=>{
          const key=e[0]<e[1]?e[0]+":"+e[1]:e[1]+":"+e[0];
          const old=edges.get(key);if(old)old.count++;else edges.set(key,{edge:e,count:1});
        });
      });
      triangles=triangles.filter(tr=>!bad.includes(tr));
      for(const item of edges.values())if(item.count===1){
        const e=item.edge,c=circle(pts[e[0]],pts[e[1]],pts[i]);
        if(c)triangles.push({v:[e[0],e[1],i],c});
      }
    }
    return triangles.filter(tr=>tr.v.every(i=>i<n)).map(tr=>tr.v);
  }
  const mesh=triangulate(points);
  const stars=Array.from({length:95},(_,i)=>({x:((i*73)%997)/997,y:((i*191)%991)/991,r:.35+(i%4)*.38,p:i*1.71}));
  const mapPoint=(p,t,level)=>{
    const faceX=w*.405,faceY=-h*.035,faceW=w*.57,faceH=h*1.06;
    const sway=Math.sin(t*.42)*.006;
    return {
      x:faceX+p[0]*faceW+(p[1]-.5)*sway*w,
      y:faceY+p[1]*faceH+Math.sin(t*1.15+p[0]*4)*.65,
      depth:.3+(1-p[0])*.7
    };
  };
  const drawPath=(points2,t,level)=>{
    const pts=points2.map(p=>mapPoint(p,t,level));
    ctx.beginPath();pts.forEach((p,i)=>{if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
  };
  const strokeCurve=(pts,t,level,width=1.1,alpha=.8)=>{
    drawPath(pts,t,level);ctx.strokeStyle="rgba(44,221,255,"+alpha+")";
    ctx.lineWidth=width;ctx.shadowColor="#00d9ff";ctx.shadowBlur=7;ctx.stroke();ctx.shadowBlur=0;
  };
  const bezierPoints=(a,c1,c2,b,n=20)=>{
    const out=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;
      out.push([u*u*u*a[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*b[0],
                u*u*u*a[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*b[1]]);
    }return out;
  };
  const draw=(time)=>{
    voxFrame=requestAnimationFrame(draw);
    if(time-lastFrame<28)return;lastFrame=time;
    const state=$("#voiceOrb")?.dataset.state||"idle",t=time*.001;
    let level=0;
    if(voxAnalyser&&state==="listening"&&voxAudioData){
      voxAnalyser.getByteTimeDomainData(voxAudioData);
      let sum=0;for(let i=0;i<voxAudioData.length;i++){const d=(voxAudioData[i]-128)/128;sum+=d*d;}
      level=Math.min(1,Math.sqrt(sum/voxAudioData.length)*5.5);
    }
    if(state==="speaking")level=Math.max(level,voxSpeechEnergy||(.16+.18*Math.abs(Math.sin(time*.012))));
    if(state==="thinking")level=.045+.025*Math.sin(time*.004);
    if(state==="listening")level=Math.max(.025,level);

    ctx.clearRect(0,0,w,h);
    const faceX=w*.70,faceY=h*.43;
    const bg=ctx.createRadialGradient(faceX,faceY,4,faceX,faceY,Math.max(w,h)*.8);
    bg.addColorStop(0,"rgba(0,103,150,.14)");bg.addColorStop(.56,"rgba(0,38,78,.06)");bg.addColorStop(1,"rgba(0,5,29,0)");
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    stars.forEach(s=>{
      const a=.10+.24*(.5+.5*Math.sin(t*1.15+s.p));
      ctx.fillStyle="rgba(65,222,255,"+a+")";ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();
    });

    // Soft holographic volume behind the human face.
    const faceGlow=ctx.createRadialGradient(faceX,faceY,4,faceX,faceY,w*.34);
    faceGlow.addColorStop(0,"rgba(0,179,222,.13)");faceGlow.addColorStop(.65,"rgba(0,99,158,.055)");faceGlow.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=faceGlow;ctx.fillRect(faceX-w*.4,0,w*.55,h);

    const outlineMapped=outline.map(p=>mapPoint(p,t,level));
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
    // Translucent face plane and irregular polygon network.
    ctx.beginPath();outlineMapped.forEach((p,i)=>{if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.closePath();
    const skin=ctx.createLinearGradient(w*.44,0,w*.94,h);
    skin.addColorStop(0,"rgba(0,166,204,.07)");skin.addColorStop(.48,"rgba(0,107,151,.065)");skin.addColorStop(1,"rgba(0,31,70,.02)");
    ctx.fillStyle=skin;ctx.fill();
    const projected=points.map(p=>mapPoint(p,t,level));
    for(const tri of mesh){
      const a=projected[tri[0]],b=projected[tri[1]],c=projected[tri[2]];
      const mx=(a.x+b.x+c.x)/3,my=(a.y+b.y+c.y)/3;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
      ctx.strokeStyle="rgba(48,211,240,"+(.16+(a.depth+b.depth+c.depth)/3*.18)+")";
      ctx.lineWidth=.58;ctx.stroke();
      if((tri[0]+tri[1]+tri[2])%17===0){ctx.fillStyle="rgba(12,168,210,.04)";ctx.fill();}
      if((tri[0]*3+tri[1]+tri[2])%13===0){
        ctx.fillStyle="rgba(91,237,255,.52)";ctx.shadowColor="#00cfff";ctx.shadowBlur=5;
        ctx.beginPath();ctx.arc(mx,my,.85,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }
    }
    // Facial silhouette: forehead, bridge, nose, lips, chin and jaw.
    strokeCurve(bezierPoints([.51,.015],[.31,.00],[.17,.10],[.14,.25]),t,level,1.6,.78);
    strokeCurve(bezierPoints([.14,.25],[.09,.31],[.015,.335],[.055,.375]),t,level,1.8,.9);
    strokeCurve(bezierPoints([.055,.375],[.09,.405],[.145,.402],[.105,.435]),t,level,1.5,.92);
    strokeCurve(bezierPoints([.105,.435],[.10,.46],[.145,.47],[.18,.485]),t,level,1.4,.88);
    strokeCurve(bezierPoints([.18,.485],[.13,.515],[.16,.545],[.20,.555]),t,level,1.45,.88);
    strokeCurve(bezierPoints([.20,.555],[.21,.63],[.27,.70],[.40,.735]),t,level,1.5,.8);
    strokeCurve(bezierPoints([.40,.735],[.59,.77],[.72,.65],[.835,.535]),t,level,1.35,.7);

    // Brow ridges and two asymmetric eyes, set into the face rather than drawn as a mask.
    strokeCurve(bezierPoints([.20,.255],[.28,.225],[.36,.225],[.445,.255]),t,level,1.65,.78);
    strokeCurve(bezierPoints([.46,.235],[.53,.205],[.63,.215],[.69,.245]),t,level,1.45,.68);
    strokeCurve(bezierPoints([.205,.295],[.27,.265],[.37,.268],[.425,.292]),t,level,1.35,.92);
    strokeCurve(bezierPoints([.205,.295],[.28,.335],[.36,.333],[.425,.292]),t,level,1.05,.75);
    strokeCurve(bezierPoints([.48,.285],[.545,.26],[.63,.27],[.685,.295]),t,level,1.2,.8);
    strokeCurve(bezierPoints([.48,.285],[.55,.32],[.63,.32],[.685,.295]),t,level,1,.65);
    [[.32,.30],[.59,.295]].forEach((p,i)=>{
      const q=mapPoint(p,t,level);ctx.fillStyle="rgba(123,247,255,.9)";
      ctx.shadowColor="#00dfff";ctx.shadowBlur=8;ctx.beginPath();ctx.arc(q.x,q.y,(i?1.8:2.2),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    });
    // Nose planes and nostril catch-light.
    strokeCurve([[.315,.29],[.30,.35],[.27,.405],[.17,.445],[.105,.435]],t,level,1.35,.85);
    strokeCurve([[.27,.405],[.22,.435],[.18,.447]],t,level,1,.65);
    strokeCurve(bezierPoints([.105,.435],[.13,.45],[.16,.455],[.19,.445]),t,level,1.1,.85);

    // The mouth opens and closes in time with the TTS speech events or live microphone.
    const mouthOpen=.006+Math.min(.075,level*.12);
    strokeCurve(bezierPoints([.145,.515],[.19,.50],[.255,.50],[.315,.525]),t,level,1.35,.9);
    strokeCurve(bezierPoints([.145,.515],[.19,.515+mouthOpen],[.26,.515+mouthOpen],[.315,.525]),t,level,1.1,.75);
    strokeCurve(bezierPoints([.16,.545+mouthOpen],[.21,.56+mouthOpen],[.27,.56+mouthOpen],[.33,.54+mouthOpen]),t,level,1.2,.9);
    // Ear and neck/shoulder silhouette, with loose polygon fragments at the rear.
    strokeCurve(bezierPoints([.77,.34],[.88,.34],[.89,.49],[.79,.55]),t,level,1.25,.65);
    strokeCurve(bezierPoints([.76,.39],[.82,.39],[.83,.48],[.77,.49]),t,level,1,.6);
    strokeCurve(bezierPoints([.40,.72],[.44,.82],[.44,.96],[.54,1.12]),t,level,1.55,.72);
    strokeCurve(bezierPoints([.67,.67],[.66,.82],[.74,.93],[.82,1.12]),t,level,1.5,.62);
    strokeCurve([[.54,1.12],[.66,1.06],[.78,1.09],[.91,1.02]],t,level,1.1,.48);
    strokeCurve([[.82,.18],[.90,.20],[.99,.32],[1.02,.42]],t,level,1,.4);
    ctx.restore();

    // Loose triangular fragments around the crown and back edge, like the supplied hologram.
    ctx.save();ctx.strokeStyle="rgba(39,210,239,.38)";ctx.lineWidth=.72;
    const fragments=[
      [[.76,.09],[.88,.025],[.91,.14]],[[.88,.22],[.98,.17],[.94,.30]],
      [[.84,.58],[.98,.53],[.93,.68]],[[.73,.76],[.88,.82],[.82,.94]],
      [[.48,.015],[.53,-.10],[.59,.04]],[[.35,.06],[.27,-.02],[.25,.11]]
    ];
    fragments.forEach(poly=>{
      const p=poly.map(v=>mapPoint(v,t,level));ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);ctx.lineTo(p[1].x,p[1].y);ctx.lineTo(p[2].x,p[2].y);ctx.closePath();ctx.stroke();
      p.forEach(q=>{ctx.fillStyle="#65edff";ctx.shadowColor="#00dfff";ctx.shadowBlur=7;ctx.beginPath();ctx.arc(q.x,q.y,1.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
    });
    ctx.restore();

    // A luminous audio waveform crossing in from the left, as in the reference.
    const baseY=h*.64,startX=-2,endX=w*.43,bars=112,gap=(endX-startX)/bars;
    for(let i=0;i<bars;i++){
      const x=i/(bars-1),pulse=Math.abs(Math.sin(i*.43+t*(state==="speaking"?9:3.1))*.48+Math.sin(i*.17-t*1.7)*.32);
      const peaks=.25+.75*Math.pow(Math.abs(Math.sin(i*.095+1.3)),5);
      const envelope=Math.exp(-Math.pow((x-.34)/.43,2));
      const height=(1.2+pulse*5+peaks*(7+level*67)*envelope)*(h/320);
      const alpha=.22+envelope*.48+level*.24;
      const grad=ctx.createLinearGradient(0,baseY-height,0,baseY+height);
      grad.addColorStop(0,"rgba(37,227,255,0)");grad.addColorStop(.48,"rgba(65,236,255,"+alpha+")");grad.addColorStop(.52,"rgba(153,250,255,"+(alpha+.12)+")");grad.addColorStop(1,"rgba(37,227,255,0)");
      ctx.fillStyle=grad;ctx.shadowColor="#00dfff";ctx.shadowBlur=level>.12?9:4;
      ctx.fillRect(startX+i*gap,baseY-height/2,Math.max(1,gap*.56),height);
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