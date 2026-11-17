import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.VOX_PORT || 8766);
const HOST = "127.0.0.1";
const WHISPER_URL = process.env.WHISPER_URL || "http://127.0.0.1:8080";
const OMNI_BASE_URL = (process.env.OMNI_BASE_URL || "http://127.0.0.1:20128/v1").replace(/\/$/, "");
const OMNI_MODEL = process.env.OMNI_MODEL || "deepseek-v4.1-flash-free";
const OMNI_API_KEY = process.env.OMNI_API_KEY || "";
const ALLOWED_ORIGIN = process.env.VOX_ALLOWED_ORIGIN || "https://ffortuneoficial-crypto.github.io";
const MAX_AUDIO = 18 * 1024 * 1024;

function send(res, status, data) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
  res.end(JSON.stringify(data));
}
function cors(req,res) {
  const origin=req.headers.origin;
  if(origin===ALLOWED_ORIGIN || origin==="http://localhost:8766"){
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Private-Network","true");
  }
}
function readBody(req,limit=MAX_AUDIO){
  return new Promise((resolve,reject)=>{
    const chunks=[];let size=0;
    req.on("data",chunk=>{size+=chunk.length;if(size>limit){reject(new Error("El archivo supera el límite permitido."));req.destroy();return;}chunks.push(chunk);});
    req.on("end",()=>resolve(Buffer.concat(chunks)));
    req.on("error",reject);
  });
}
async function reachable(url){
  try{const response=await fetch(url,{signal:AbortSignal.timeout(2500)});return response.ok;}
  catch{return false;}
}
const server=http.createServer(async(req,res)=>{
  cors(req,res);
  if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
  const url=new URL(req.url,"http://127.0.0.1");
  try{
    if(req.method==="GET" && url.pathname==="/api/health"){
      const [whisper,omni]=await Promise.all([reachable(WHISPER_URL),reachable(OMNI_BASE_URL+"/models")]);
      send(res,200,{whisper,omni,model:OMNI_MODEL});return;
    }
    if(req.method==="POST" && url.pathname==="/api/transcribe"){
      const audio=await readBody(req);
      if(!audio.length){send(res,400,{error:"No llegó audio."});return;}
      const form=new FormData();
      form.append("file",new Blob([audio],{type:req.headers["content-type"]||"audio/webm"}),"vox-audio.webm");
      form.append("response_format","json");
      form.append("language","es");
      const upstream=await fetch(WHISPER_URL+"/inference",{method:"POST",body:form,signal:AbortSignal.timeout(90000)});
      const raw=await upstream.text();
      if(!upstream.ok){send(res,502,{error:"Whisper: "+raw.slice(0,500)});return;}
      let parsed;try{parsed=JSON.parse(raw);}catch{parsed={text:raw};}
      send(res,200,{text:parsed.text||parsed.transcription||""});return;
    }
    if(req.method==="POST" && url.pathname==="/api/chat"){
      const raw=await readBody(req,256*1024);
      const body=JSON.parse(raw.toString("utf8"));
      const incoming=Array.isArray(body.messages)?body.messages:[];
      const messages=incoming.filter(m=>m && (m.role==="user"||m.role==="assistant") && typeof m.content==="string")
        .slice(-16).map(m=>({role:m.role,content:m.content.slice(0,5000)}));
      if(!messages.length || messages[messages.length-1].role!=="user"){send(res,400,{error:"Falta el mensaje del usuario."});return;}
      const system="Eres VOX, un entrenador conversacional de comunicación en español. Conversa de forma natural, cálida, directa y exigente sin humillar. No eres un transcriptor: escucha el sentido de lo que dice la persona, conserva el contexto, haz preguntas de seguimiento útiles y adapta la conversación al objetivo. No conviertas cada turno en una evaluación. Durante la práctica, responde como un interlocutor real y plantea situaciones cuando ayude. No inventes observaciones sobre la voz que no puedas medir. Cuando te pidan feedback, comenta solo aspectos observables en el contenido verbal y cita ejemplos concretos de lo que la persona dijo. Da una recomendación accionable cada vez, no una lista interminable. Mantén respuestas breves para que la conversación hablada fluya. Si no sabes algo, dilo.";
      const headers={"Content-Type":"application/json"};
      if(OMNI_API_KEY)headers.Authorization="Bearer "+OMNI_API_KEY;
      const upstream=await fetch(OMNI_BASE_URL+"/chat/completions",{method:"POST",headers,body:JSON.stringify({model:OMNI_MODEL,messages:[{role:"system",content:system},...messages],temperature:0.7,stream:false}),signal:AbortSignal.timeout(90000)});
      const upstreamText=await upstream.text();
      if(!upstream.ok){send(res,502,{error:"OmniRoute: "+upstreamText.slice(0,700)});return;}
      const data=JSON.parse(upstreamText);
      const text=data.choices?.[0]?.message?.content;
      send(res,200,{text:typeof text==="string"?text:""});return;
    }
    send(res,404,{error:"Ruta no encontrada."});
  }catch(error){
    if(!res.headersSent)send(res,500,{error:error.message||"Error interno del motor local."});
  }
});
server.listen(PORT,HOST,()=>console.log("VOX local engine: http://"+HOST+":"+PORT+" | Whisper "+WHISPER_URL+" | OmniRoute "+OMNI_BASE_URL+" | modelo "+OMNI_MODEL));
