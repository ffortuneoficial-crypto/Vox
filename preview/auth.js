(()=>{"use strict";
const $=selector=>document.querySelector(selector);
const SUPABASE_URL="https://kmwmwacgsojpkbqwhomd.supabase.co";
const SUPABASE_KEY="sb_publishable_cS2Rrx0VuOUsQNLd33gNZQ_fgWf0BrI";
let client=null,clientPromise=null,mode="login",transitioning=false;

function getClient(){
  if(client)return Promise.resolve(client);
  if(clientPromise)return clientPromise;
  clientPromise=new Promise((resolve,reject)=>{
    const create=()=>{
      if(!window.supabase?.createClient){reject(new Error("No se pudo cargar la conexión segura."));return;}
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      resolve(client);
    };
    if(window.supabase?.createClient){create();return;}
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0";
    script.async=true;script.onload=create;
    script.onerror=()=>reject(new Error("No logramos conectar con el servicio de acceso."));
    document.head.appendChild(script);
  }).catch(error=>{clientPromise=null;throw error;});
  return clientPromise;
}
function message(text,type="info"){
  const el=$("#authMessage");el.textContent=text;el.className="auth-message"+(type?" "+type:"");
}
function redirectToApp(){window.location.replace("./index.html");}
function successTransition(){
  if(transitioning)return;
  transitioning=true;$("#authSubmit").disabled=true;
  $("#successScene").classList.add("is-active");
  window.setTimeout(redirectToApp,1350);
}
function fieldParts(name){
  const map={
    name:{field:"#nameField",input:"#authName",error:"#nameError"},
    email:{field:"#emailField",input:"#authEmail",error:"#emailError"},
    password:{field:"#passwordField",input:"#authPassword",error:"#passwordError"},
    confirm:{field:"#confirmField",input:"#authConfirm",error:"#confirmError"}
  };
  return map[name];
}
function clearFieldError(name){
  const p=fieldParts(name);if(!p)return;
  $(p.field).classList.remove("has-error");$(p.input).setAttribute("aria-invalid","false");$(p.error).textContent="";
}
function markField(name,text){
  const p=fieldParts(name);if(!p)return;
  $(p.field).classList.add("has-error");$(p.input).setAttribute("aria-invalid","true");$(p.error).textContent=text;
}
function clearErrors(){["name","email","password","confirm"].forEach(clearFieldError);message("");}
function shakeAccess(){
  const card=$("#authAccess");card.classList.remove("is-shaking");void card.offsetWidth;
  card.classList.add("is-shaking");window.setTimeout(()=>card.classList.remove("is-shaking"),380);
}
function fail(text,fields=[]){
  fields.forEach(([name,detail])=>markField(name,detail));message(text,"error");shakeAccess();
}
function setMode(next){
  mode=next;document.body.dataset.authMode=mode;
  const signup=mode==="signup";
  $("#authHeading").textContent=signup?"Crear cuenta":"Bienvenido";
  $("#authSubtitle").textContent=signup?"Crea tu espacio y empieza a entrenar":"Inicia sesión para continuar";
  $("#nameField").hidden=!signup;$("#confirmField").hidden=!signup;
  $("#authName").required=signup;$("#authConfirm").required=signup;
  $("#authPassword").autocomplete=signup?"new-password":"current-password";
  $("#authSubmit .submit-label").textContent=signup?"Crear cuenta":"Iniciar sesión";
  $("#authModePrompt").textContent=signup?"¿Ya tienes una cuenta?":"¿No tienes una cuenta?";
  $("#authModeLink").textContent=signup?"Inicia sesión":"Crear cuenta";
  $("#formMeta").hidden=signup;
  $("#authConfirm").value="";
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
  const button=$("#authSubmit");button.disabled=active||transitioning;
  button.classList.toggle("is-loading",active);
  button.innerHTML=active?'<span class="button-spinner"></span><span class="submit-label">Un momento...</span>':'<span class="submit-label">'+(mode==="signup"?"Crear cuenta":"Iniciar sesión")+'</span>';
}
function validate(name,email,password,confirm){
  clearErrors();
  if(mode==="signup"&&!name.trim()){
    fail("Escribe tu nombre para crear la cuenta.",[["name","Este campo es obligatorio."]]);$("#authName").focus();return false;
  }
  if(!email){
    fail("Escribe el correo con el que quieres acceder.",[["email","Este campo es obligatorio."]]);$("#authEmail").focus();return false;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    fail("Ese correo no parece tener un formato válido.",[["email","Revisa la dirección de correo."]]);$("#authEmail").focus();return false;
  }
  if(!password){
    fail("Escribe tu contraseña para continuar.",[["password","Este campo es obligatorio."]]);$("#authPassword").focus();return false;
  }
  if(mode==="signup"&&password.length<6){
    fail("La contraseña debe tener al menos 6 caracteres.",[["password","Usa al menos 6 caracteres."]]);$("#authPassword").focus();return false;
  }
  if(mode==="signup"&&password!==confirm){
    fail("Las contraseñas no coinciden.",[["confirm","Repite exactamente la misma contraseña."]]);$("#authConfirm").focus();return false;
  }
  return true;
}
async function submit(event){
  event.preventDefault();if(transitioning)return;
  const name=$("#authName").value.trim(),email=$("#authEmail").value.trim(),password=$("#authPassword").value,confirm=$("#authConfirm").value;
  if(!validate(name,email,password,confirm))return;
  loading(true);message(mode==="signup"?"Creando tu espacio...":"Comprobando tus datos...","info");
  try{
    const authClient=await getClient();
    if(mode==="signup"){
      const {data,error}=await authClient.auth.signUp({email,password,options:{data:{full_name:name}}});
      if(error)throw error;
      if(data.session){successTransition();return;}
      setMode("login");
      message("Tu cuenta ya está creada. Revisa tu correo para confirmar la dirección y después inicia sesión.","success");
      return;
    }
    const {data,error}=await authClient.auth.signInWithPassword({email,password});
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
    }else fail(errorText(error));
  }finally{loading(false);}
}
async function init(){
  if(new URLSearchParams(location.search).get("reason")==="connection"){
    message("No pudimos verificar tu sesión. Inicia sesión cuando el servicio esté disponible.","info");
  }
  try{
    const authClient=await getClient();
    const {data,error}=await authClient.auth.getSession();if(error)throw error;
    if(data.session){redirectToApp();return;}
    authClient.auth.onAuthStateChange((event,session)=>{if(session&&event==="SIGNED_IN")successTransition();});
  }catch(error){message("El acceso está listo. Cuando tengas conexión podrás iniciar sesión.","info");}
}
$("#authModeLink").addEventListener("click",()=>setMode(mode==="signup"?"login":"signup"));
$("#authForm").addEventListener("submit",submit);
["name","email","password","confirm"].forEach(name=>{
  const p=fieldParts(name);$(p.input).addEventListener("input",()=>clearFieldError(name));
});
$("#togglePassword").addEventListener("click",()=>{
  const input=$("#authPassword"),show=input.type==="password";input.type=show?"text":"password";
  $("#togglePassword").classList.toggle("is-visible",show);
  $("#togglePassword").setAttribute("aria-label",show?"Ocultar contraseña":"Mostrar contraseña");
});
setMode("login");init();
if("serviceWorker"in navigator&&location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
})();