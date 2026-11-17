(()=>{"use strict";
const $=s=>document.querySelector(s);
const screens=["home","practice"];
function show(id){if(!screens.includes(id))return;screens.forEach(name=>$("#"+name)?.classList.toggle("active",name===id));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.go===id));window.scrollTo(0,0)}
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>show(button.dataset.go)));
try{const sessions=JSON.parse(localStorage.getItem("vox.sessions.v3")||"[]");$("#sessionCount").textContent=Array.isArray(sessions)?sessions.length:0}catch{$("#sessionCount").textContent="0"}
if("serviceWorker"in navigator&&location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
})();