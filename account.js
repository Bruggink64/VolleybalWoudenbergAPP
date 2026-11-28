// Trainingen online bewaren met een Google-account (optioneel, voor alle trainers).
// Zonder inloggen blijft alles op het apparaat, zoals altijd. Na inloggen staan de bewaarde trainingen
// (Mini's: vvw.trainingen, Jeugd & Senioren: vvw.senioren.bewaard) ook online in Firestore, in één document
// per trainer: trainersopslag/<uid>. Alleen die trainer zelf kan het lezen of wijzigen (zie tools/firestore.rules).
// De lijst op het apparaat blijft een kopie, zodat bewaarde trainingen ook zonder internet te openen zijn.
// Gebruikt window.vvwFire uit suggestie.js (Google-inlog via Firebase). Laadt na app.js en senioren-app.js.
(function(){
const COL='trainersopslag',VLAG='vvw.account',VUIL='vvw.account.nietbewaard';
const LIJST={minis:{k:'vvw.trainingen',max:50},senioren:{k:'vvw.senioren.bewaard',max:20}};
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
const vlag=k=>({get(){try{return localStorage.getItem(k)==='1';}catch(e){return false;}},set(v){try{if(v)localStorage.setItem(k,'1');else localStorage.removeItem(k);}catch(e){}}});
const aan=vlag(VLAG),vuil=vlag(VUIL);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const melding=t=>{try{if(typeof toast==='function')toast(t);}catch(e){}};
let user=null,bezig=false,fout='',open=false;

// online lijst + lijst op dit apparaat samenvoegen: online eerst, daarna wat online nog niet bestaat
function samen(online,lokaal,max){const s=new Set(online.map(x=>JSON.stringify(x)));return online.concat(lokaal.filter(x=>!s.has(JSON.stringify(x)))).slice(0,max);}
function herteken(){
 try{if(typeof savedUI==='function')savedUI();}catch(e){}
 try{if(window.senSavedUI)window.senSavedUI();}catch(e){}
 ui();
}
async function start(inloggen){
 const F=window.vvwFire;if(!F||bezig)return;bezig=true;fout='';ui();
 try{
  if(inloggen)await F.login();
  const u=await F.user();
  if(!u){user=null;aan.set(false);return;}
  const doc=await F.lees(COL,u.uid),fl=(doc&&doc.fields)||{};
  // bij inloggen, of als er vorige keer iets niet online kwam: wat op dit apparaat staat komt erbij
  const voegToe=inloggen||vuil.get();let extra=0;
  for(const s in LIJST){
   let L=[];try{L=fl[s]?JSON.parse(fl[s].stringValue):[];}catch(e){L=[];}
   if(!Array.isArray(L))L=[];
   if(voegToe){const n=L.length;L=samen(L,get(LIJST[s].k,[]),LIJST[s].max);extra+=L.length-n;}
   put(LIJST[s].k,L);
  }
  user=u;aan.set(true);
  if(extra||vuil.get())await schrijf();
  herteken();
  if(inloggen)melding(extra?'Ingelogd. '+extra+(extra===1?' training van dit apparaat staat':' trainingen van dit apparaat staan')+' nu ook in je account':'Ingelogd: je trainingen staan nu online');
 }catch(e){
  user=null;
  if(e&&(e.status===401||e.status===403)){aan.set(false);if(e.status===403)fout='Online bewaren lukt niet met dit account.';}
  else if(!/popup|cancel/i.test(String(e&&(e.code||e.message))))fout='Je online trainingen ophalen lukt nu niet (geen internet?). De trainingen op dit apparaat werken gewoon.';
 }finally{bezig=false;ui();}
}
async function schrijf(){
 const F=window.vvwFire;if(!F||!user)return false;
 const fields={tijd:{timestampValue:new Date().toISOString()}};
 for(const s in LIJST)fields[s]={stringValue:JSON.stringify(get(LIJST[s].k,[]))};
 try{await F.schrijf(COL,user.uid,fields);vuil.set(false);return true;}
 catch(e){vuil.set(true);melding('Online bewaren lukt nu niet; de training staat wel op dit apparaat');return false;}
}
async function uitloggen(){
 try{await window.vvwFire.logout();}catch(e){}
 user=null;aan.set(false);vuil.set(false);open=false;herteken();
 melding('Uitgelogd. De trainingen blijven op dit apparaat staan');
}
async function wissen(btn){
 if(!btn.dataset.sure){btn.dataset.sure=1;btn.textContent='Zeker weten? Wis online';return;}
 const F=window.vvwFire;if(!F||!user)return;
 try{await F.wis(COL,user.uid);}catch(e){if(!e||e.status!==404){melding('Wissen lukt nu niet, probeer het later opnieuw');return;}}
 await uitloggen();melding('Je online trainingen zijn gewist. Ze staan nog wel op dit apparaat');
}

// het blokje onder de bewaarde trainingen (bij Mini's en bij Jeugd & Senioren)
function html(){
 if(bezig)return '<p class="note">Je online trainingen ophalen&hellip;</p>';
 let h;
 if(user){
  h='<p class="note acc-on">&#9729; Online bewaard in je account ('+esc(user.email)+'). Je ziet deze trainingen op elk apparaat waar je inlogt.</p>'
   +'<div class="row"><button type="button" data-a="uit">Uitloggen</button><button type="button" data-a="info">'+(open?'Minder':'Wat wordt er bewaard?')+'</button></div>';
  if(open)h+='<div class="note acc-info"><p>Online staan alleen de namen en de inhoud van je bewaarde trainingen, in een eigen opslag die alleen jij met je Google-account kunt openen. Andere trainers zien ze niet. De opslag staat bij Google Firebase in Nederland.</p>'
   +'<div class="row"><button type="button" data-a="wis">Mijn online trainingen wissen</button></div></div>';
 }else{
  h='<div class="row"><button type="button" data-a="in">Inloggen met Google</button></div>'
   +'<p class="note">Zonder inloggen staan je bewaarde trainingen alleen op dit apparaat. Met inloggen heb je ze op je telefoon, tablet en computer.</p>';
 }
 return h+(fout?'<p class="note acc-warn">'+esc(fout)+'</p>':'');
}
function ui(){
 if(!window.vvwFire)return;
 ['saved','s_saved'].forEach(id=>{
  const lijst=document.getElementById(id);if(!lijst)return;
  let el=document.getElementById(id+'_acc');
  if(!el){el=document.createElement('div');el.id=id+'_acc';el.className='acc noprint';lijst.insertAdjacentElement('afterend',el);}
  el.innerHTML=html();
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
   if(a==='in')start(true);else if(a==='uit')uitloggen();else if(a==='info'){open=!open;ui();}else if(a==='wis')wissen(b);});
 });
}
window.vvwAcc={
 ui,
 aan:()=>!!user,
 // aanroepen na bewaren of verwijderen van een training
 bewaard(){if(user)schrijf();else if(aan.get())vuil.set(true);}
};
if(aan.get())start(false);else ui();
})();
