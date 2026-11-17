(()=>{"use strict";
const $=selector=>document.querySelector(selector);
const SUPABASE_URL="https://kmwmwacgsojpkbqwhomd.supabase.co";
const SUPABASE_KEY="sb_publishable_cS2Rrx0VuOUsQNLd33gNZQ_fgWf0BrI";
const client=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let mode="login",transitioning=false;

function reveal(){
  const boot=$("#authBoot"),shell=$("#authShell");
  boot.classList.add("is-done");
  shell.hidden=false;
  requestAnimationFrame(()=>shell.classList.add("is-visible"));
}
function message(text,type="info"){
  const el=$("#authMessage");
  el.textContent=text;
  el.className="auth-message"+(type?" "+type:"");
}
function redirectToApp(){
  window.location.replace("./index.html");
}
function successTransition(){
  if(transitioning)return;
  transitioning=true;
  $("#authSubmit").disabled=true;
  $("#successScene").classList.add("is-active");
  window.setTimeout(()=>window.location.replace("./index.html"),1550);
}
function fieldParts(name){
  const map={
    email:{field:"#emailField",input:"#authEmail",error:"#emailError"},
    password:{field:"#passwordField",input:"#authPassword",error:"#passwordError"},
    confirm:{field:"#confirmField",input:"#authConfirm",error:"#confirmError"}
  };
  return map[name];
}
function clearFieldError(name){
  const parts=fieldParts(name);
  if(!parts)return;
  $(parts.field).classList.remove("has-error");
  $(parts.input).setAttribute("aria-invalid","false");
  $(parts.error).textContent="";
}
function markField(name,text){
  const parts=fieldParts(name);
  if(!parts)return;
  $(parts.field).classList.add("has-error");
  $(parts.input).setAttribute("aria-invalid","true");
  $(parts.error).textContent=text;
}
function clearErrors(){
  ["email","password","confirm"].forEach(clearFieldError);
  message("");
}
function shakeCard(){
  const card=$("#authCard");
  card.classList.remove("is-shaking");
  void card.offsetWidth;
  card.classList.add("is-shaking");
  window.setTimeout(()=>card.classList.remove("is-shaking"),480);
}
function fail(text,fields=[]){
  fields.forEach(([name,detail])=>markField(name,detail));
  message(text,"error");
  shakeCard();
}
function setMode(next){
  mode=next;
  const signup=mode==="signup";
  document.querySelectorAll("[data-auth-mode]").forEach(button=>{
    const active=button.dataset.authMode===mode;
    button.classList.toggle("active",active);
    button.setAttribute("aria-selected",String(active));
  });
  $("#authHeading").textContent=signup?"Crea tu espacio.":"Hola de nuevo.";
  $("#authSubheading").textContent=signup
    ?"Empieza a entrenar tu comunicación y construye confianza a tu ritmo."
    :"Qué bueno tenerte de vuelta. Sigamos trabajando en tu voz.";
  $("#confirmField").hidden=!signup;
  $("#authConfirm").required=signup;
  $("#authPassword").autocomplete=signup?"new-password":"current-password";
  $("#authSubmit .submit-label").textContent=signup?"Crear mi cuenta":"Entrar a VOX";
  clearErrors();
}
function errorText(error){
  const value=String(error?.message||"");
  if(/invalid login credentials|invalid email or password/i.test(value))return"El correo o la contraseña no son correctos. Revísalos e inténtalo otra vez.";
  if(/email not confirmed/i.test(value))return"Tu correo todavía no está confirmado. Busca el mensaje de confirmación en tu bandeja de entrada.";
  if(/user already registered/i.test(value))return"Este correo ya tiene una cuenta. Prueba iniciando sesión.";
  if(/password should be at least|password.*minimum/i.test(value))return"La contraseña debe tener al menos 6 caracteres.";
  if(/invalid email|email.*valid/i.test(value))return"Escribe una dirección de correo válida.";
  if(/email rate limit exceeded/i.test(value))return"Se enviaron demasiados correos. Espera un momento antes de intentarlo de nuevo.";
  if(/failed to fetch|fetch failed|network/i.test(value))return"No logramos conectar con VOX. Comprueba tu conexión e inténtalo otra vez.";
  return value||"No pudimos completar la operación. Inténtalo de nuevo.";
}
function loading(active){
  const button=$("#authSubmit");
  button.disabled=active||transitioning;
  button.classList.toggle("is-loading",active);
  button.innerHTML=active
    ?'<span class="button-spinner"></span><span class="submit-label">Un momento...</span>'
    :'<span class="submit-label">'+(mode==="signup"?"Crear mi cuenta":"Entrar a VOX")+'</span><span class="submit-arrow" aria-hidden="true">↗</span>';
}
function validate(email,password,confirm){
  clearErrors();
  if(!email){
    fail("Escribe el correo con el que creaste tu cuenta.",[["email","Este campo es obligatorio."]]);
    $("#authEmail").focus();
    return false;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    fail("Ese correo no parece tener un formato válido.",[["email","Revisa la dirección de correo."]]);
    $("#authEmail").focus();
    return false;
  }
  if(!password){
    fail("Escribe tu contraseña para continuar.",[["password","Este campo es obligatorio."]]);
    $("#authPassword").focus();
    return false;
  }
  if(mode==="signup"&&password.length<6){
    fail("La contraseña debe tener al menos 6 caracteres.",[["password","Usa al menos 6 caracteres."]]);
    $("#authPassword").focus();
    return false;
  }
  if(mode==="signup"&&password!==confirm){
    fail("Las contraseñas no coinciden. Vuelve a escribirlas.",[["confirm","Las contraseñas deben coincidir."]]);
    $("#authConfirm").focus();
    return false;
  }
  return true;
}
async function submit(event){
  event.preventDefault();
  if(transitioning)return;
  if(!client){
    fail("No se pudo cargar la conexión segura. Comprueba tu internet y recarga la página.");
    return;
  }
  const email=$("#authEmail").value.trim();
  const password=$("#authPassword").value;
  const confirm=$("#authConfirm").value;
  if(!validate(email,password,confirm))return;

  loading(true);
  message(mode==="signup"?"Creando tu espacio...":"Comprobando tus datos...","info");
  try{
    if(mode==="signup"){
      const {data,error}=await client.auth.signUp({email,password});
      if(error)throw error;
      if(data.session){
        successTransition();
        return;
      }
      setMode("login");
      message("Tu cuenta ya está creada. Revisa tu correo para confirmar la dirección y después inicia sesión.","success");
      return;
    }
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!data.session)throw new Error("No se pudo iniciar la sesión. Inténtalo de nuevo.");
    successTransition();
  }catch(error){
    const raw=String(error?.message||"");
    if(/invalid login credentials|invalid email or password/i.test(raw)){
      fail(errorText(error),[["email","Comprueba el correo."],["password","Comprueba la contraseña."]]);
    }else if(/invalid email|email.*valid/i.test(raw)){
      fail(errorText(error),[["email","Revisa la dirección de correo."]]);
    }else if(/password/i.test(raw)&&mode==="signup"){
      fail(errorText(error),[["password","Revisa la contraseña."]]);
    }else{
      fail(errorText(error));
    }
  }finally{
    loading(false);
  }
}
async function init(){
  if(!client){
    reveal();
    fail("No se pudo cargar Supabase. Comprueba tu conexión y vuelve a cargar la página.");
    return;
  }
  try{
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    if(data.session){
      redirectToApp();
      return;
    }
  }catch(error){
    reveal();
    fail(errorText(error));
    return;
  }
  reveal();
  if(new URLSearchParams(location.search).get("reason")==="connection"){
    message("No pudimos verificar tu sesión. Inicia sesión cuando el servicio esté disponible.","info");
  }
  client.auth.onAuthStateChange((event,session)=>{
    if(session&&event==="SIGNED_IN")successTransition();
  });
}

document.querySelectorAll("[data-auth-mode]").forEach(button=>button.addEventListener("click",()=>setMode(button.dataset.authMode)));
$("#authForm").addEventListener("submit",submit);
["email","password","confirm"].forEach(name=>{
  const parts=fieldParts(name);
  $(parts.input).addEventListener("input",()=>clearFieldError(name));
});
$("#togglePassword").addEventListener("click",()=>{
  const input=$("#authPassword"),show=input.type==="password";
  input.type=show?"text":"password";
  $("#togglePassword").textContent=show?"Ocultar":"Ver";
  $("#togglePassword").setAttribute("aria-label",show?"Ocultar contraseña":"Mostrar contraseña");
});
init();
if("serviceWorker"in navigator&&location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
})();