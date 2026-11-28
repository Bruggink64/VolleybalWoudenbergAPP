// Trainingen online bewaren met een Google-account (optioneel, voor alle trainers).
// Zonder inloggen blijft alles op het apparaat, zoals altijd. Na inloggen staan de bewaarde trainingen
// (Mini's: vvw.trainingen, Jeugd & Senioren: vvw.senioren.bewaard) en de favoriete teams van de homepagina (vvw.favteams) ook online in Firestore, in één document
// per trainer: trainersopslag/<uid>. Alleen die trainer zelf kan het lezen of wijzigen (zie tools/firestore.rules).
// De lijst op het apparaat blijft een kopie, zodat bewaarde trainingen ook zonder internet te openen zijn.
// Gebruikt window.vvwFire uit suggestie.js (Google-inlog via Firebase). Laadt na app.js en senioren-app.js.
(function(){
const COL='trainersopslag',VLAG='vvw.account',VUIL='vvw.account.nietbewaard';
const NAAMK='vvw.account.naam'; // voornaam voor de welkomsttitel op Home
const LIJST={minis:{k:'vvw.trainingen',max:50},senioren:{k:'vvw.senioren.bewaard',max:20},teams:{k:'vvw.favteams',max:10}};
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
const vlag=k=>({get(){try{return localStorage.getItem(k)==='1';}catch(e){return false;}},set(v){try{if(v)localStorage.setItem(k,'1');else localStorage.removeItem(k);}catch(e){}}});
const aan=vlag(VLAG),vuil=vlag(VUIL);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const melding=t=>{try{if(typeof toast==='function')toast(t);}catch(e){}};
let user=null,bezig=false,fout='',open=false,mailOpen=false,mailMsg='',mailAdres='',mailWw='';

// voornaam: eerste woord van de Google-naam, anders het begin van het e-mailadres (jan.jansen@... -> Jan)
function voornaam(u){let n=(u.naam||'').trim().split(/\s+/)[0]||(u.email||'').split('@')[0].split(/[._\-+0-9]/)[0]||'';n=n.slice(0,30);return n?n.charAt(0).toUpperCase()+n.slice(1):'';}
// online lijst + lijst op dit apparaat samenvoegen: online eerst, daarna wat online nog niet bestaat
function samen(online,lokaal,max){const s=new Set(online.map(x=>JSON.stringify(x)));return online.concat(lokaal.filter(x=>!s.has(JSON.stringify(x)))).slice(0,max);}
function herteken(){
 try{if(typeof savedUI==='function')savedUI();}catch(e){}
 try{if(window.senSavedUI)window.senSavedUI();}catch(e){}
 try{if(window.vvwHomeTeken)window.vvwHomeTeken();}catch(e){}
 ui();
}
async function start(inloggen){
 const F=window.vvwFire;if(!F||bezig)return;bezig=true;fout='';ui();
 try{
  if(inloggen)await (typeof inloggen==='function'?inloggen():F.login());
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
  try{localStorage.setItem(NAAMK,voornaam(u));}catch(e){}
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
 user=null;aan.set(false);vuil.set(false);open=false;try{localStorage.removeItem(NAAMK);}catch(e){}herteken();
 melding('Uitgelogd. De trainingen blijven op dit apparaat staan');
}
async function wissen(btn){
 if(!btn.dataset.sure){btn.dataset.sure=1;btn.textContent='Zeker weten? Wis online';return;}
 const F=window.vvwFire;if(!F||!user)return;
 try{await F.wis(COL,user.uid);}catch(e){if(!e||e.status!==404){melding('Wissen lukt nu niet, probeer het later opnieuw');return;}}
 await uitloggen();melding('Je online gegevens zijn gewist. Ze staan nog wel op dit apparaat');
}

// inloggen met e-mail en wachtwoord: foutmeldingen van Firebase in gewone woorden
const MAILFOUT={'auth/invalid-email':'Dat e-mailadres klopt niet.','auth/missing-password':'Vul een wachtwoord in.',
 'auth/weak-password':'Kies een wachtwoord van minstens 6 tekens.','auth/email-already-in-use':'Er bestaat al een account met dit e-mailadres. Kies Inloggen (of Inloggen met Google als je zo begonnen bent).',
 'auth/invalid-credential':'E-mailadres of wachtwoord klopt niet.','auth/wrong-password':'E-mailadres of wachtwoord klopt niet.','auth/user-not-found':'E-mailadres of wachtwoord klopt niet.',
 'auth/too-many-requests':'Te vaak geprobeerd. Wacht even en probeer het opnieuw.','auth/operation-not-allowed':'Inloggen met e-mail staat nog niet aan. Gebruik voorlopig Google.',
 'auth/network-request-failed':'Geen internet. Probeer het opnieuw als je verbinding hebt.'};
async function mailActie(m,adres,ww){
 const F=window.vvwFire;if(!F||bezig)return;mailMsg='';
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adres)){mailMsg='Vul eerst je e-mailadres in.';ui();return;}
 if(m==='reset'){
  try{await F.reset(adres);mailMsg='Als er een account met dit adres is, staat er nu een mail klaar om een nieuw wachtwoord te kiezen. Kijk ook in je spam.';}
  catch(e){mailMsg=MAILFOUT[e&&e.code]||'Versturen lukt nu niet, probeer het later opnieuw.';}
  ui();return;
 }
 if(m==='nieuw'&&ww.length<6){mailMsg='Kies een wachtwoord van minstens 6 tekens.';ui();return;}
 let mis='';
 await start(async()=>{try{await F.mail(adres,ww,m==='nieuw');}catch(e){mis=MAILFOUT[e&&e.code]||'Inloggen lukt nu niet, probeer het opnieuw.';throw Object.assign(new Error('popup'),{code:'auth/popup-mail'});}});
 if(mis)mailMsg=mis;else{mailOpen=false;mailMsg='';mailWw='';}
 ui();
}

// het blokje onder de bewaarde trainingen (bij Mini's en bij Jeugd & Senioren)
function html(home){
 const kop=home?'<h3>Mijn account</h3>':'';
 if(bezig)return kop+'<p class="note">Je online gegevens ophalen&hellip;</p>';
 let h=kop;
 if(user){
  h+='<p class="note acc-on">&#9729; Ingelogd als '+esc(user.email)+'. Je favoriete teams en bewaarde trainingen staan in je account; je ziet ze op elk apparaat waar je inlogt.</p>'
   +'<div class="row"><button type="button" data-a="uit">Uitloggen</button><button type="button" data-a="info">'+(open?'Minder':'Wat wordt er bewaard?')+'</button></div>';
  if(open)h+='<div class="note acc-info"><p>Online staan alleen de namen en de inhoud van je bewaarde trainingen en je favoriete teams, in een eigen opslag die alleen jij met je Google-account kunt openen. Andere trainers zien ze niet. De opslag staat bij Google Firebase in Nederland.</p>'
   +'<div class="row"><button type="button" data-a="wis">Mijn online gegevens wissen</button></div></div>';
 }else{
  h+='<div class="row"><button type="button" data-a="in">Inloggen met Google</button><button type="button" data-a="mail" aria-expanded="'+mailOpen+'">'+(mailOpen?'Sluiten':'Geen Google? Met e-mail')+'</button></div>'
   +(mailOpen?'<form class="acc-mail" novalidate><input type="email" name="m" autocomplete="username" placeholder="E-mailadres" aria-label="E-mailadres" maxlength="120" value="'+esc(mailAdres)+'">'
    +'<input type="password" name="w" autocomplete="current-password" placeholder="Wachtwoord (minstens 6 tekens)" aria-label="Wachtwoord" maxlength="100" value="'+esc(mailWw)+'">'
    +'<div class="row"><button type="submit" data-m="in">Inloggen</button><button type="button" data-m="nieuw">Account maken</button><button type="button" class="lnk" data-m="reset">Wachtwoord vergeten</button></div>'
    +(mailMsg?'<p class="note">'+esc(mailMsg)+'</p>':'')+'</form>':'')
   +'<p class="note">'+(home?'Log in om je favoriete teams en bewaarde trainingen op je telefoon, tablet en computer te hebben. Zonder inloggen blijft alles op dit apparaat.':'Zonder inloggen staan je bewaarde trainingen alleen op dit apparaat. Met inloggen heb je ze op je telefoon, tablet en computer.')+'</p>';
 }
 return h+(fout?'<p class="note acc-warn">'+esc(fout)+'</p>':'');
}
function ui(){
 if(!window.vvwFire)return;
 ['saved','s_saved'].forEach(id=>{
  const lijst=document.getElementById(id);
  if(lijst&&!document.getElementById(id+'_acc')){const el=document.createElement('div');el.id=id+'_acc';el.className='acc noprint';lijst.insertAdjacentElement('afterend',el);}
 });
 ['hm_acc','saved_acc','s_saved_acc'].forEach(id=>{
  const el=document.getElementById(id);if(!el)return;
  if(id==='hm_acc')el.style.display='';
  el.innerHTML=html(id==='hm_acc');
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
   if(a==='in')start(true);else if(a==='mail'){mailOpen=!mailOpen;mailMsg='';ui();}else if(a==='uit')uitloggen();else if(a==='info'){open=!open;ui();}else if(a==='wis')wissen(b);});
  const f=el.querySelector('.acc-mail');
  if(f){const doe=m=>{mailAdres=f.m.value.trim();mailWw=f.w.value;mailActie(m,mailAdres,mailWw);};f.onsubmit=e=>{e.preventDefault();doe('in');};f.querySelectorAll('button[type=button][data-m]').forEach(b=>b.onclick=()=>doe(b.dataset.m));}
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
