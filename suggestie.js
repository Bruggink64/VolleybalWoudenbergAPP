// Suggesties binnen de app.
// Trainers sturen bij elke oefening (knop "Suggestie") of via de kop ("Idee of suggestie") een idee in.
// Het formulier staat in de app zelf; inzendingen gaan naar een eigen Firebase-database (Firestore).
// De beheerder opent de lijst via "Beheer" onderaan het formulier of met #beheer achter de link,
// logt in met Google en keurt suggesties goed of af.
//
// Veiligheid: de apiKey en projectId hieronder zijn geen geheimen (Firebase zet ze altijd in de webpagina).
// Wie wat mag, regelen de beveiligingsregels in Firebase (zie tools/firestore.rules):
// iedereen mag alleen een nieuwe suggestie toevoegen, alleen de beheerder mag de lijst lezen en wijzigen.
//
// Zolang FB leeg is, opent de knop nog het oude Google Formulier.
(function(){
const FB={apiKey:'AIzaSyCrzJ9_EqRrELhFap4Aumte7a4P_Z_eVDY',projectId:'vv-woudenberg-trainersapp'};
const FORM='https://docs.google.com/forms/d/e/1FAIpQLSfW4r07un-M1WLEXwtFc9mlvhTlo5_dnSGVkD_UVD9D4X4hRA/viewform?usp=pp_url&entry.534773472=OEFENING';
const ON=!!(FB.apiKey&&FB.projectId);
const SOORT=['Animatie klopt niet','Tekst aanpassen','Nieuwe oefening','Anders'];
const ST={nieuw:'Nieuw',goedgekeurd:'Goedgekeurd',afgewezen:'Afgewezen',verwerkt:'Verwerkt'};

const css=document.createElement('style');
css.textContent='.sug{font-size:12.5px;padding:5px 9px;background:none}.sugg{margin-left:auto;align-self:center;font-size:13px;padding:6px 12px;margin-bottom:10px;background:#fff}'
+'dialog.sgd{border:0;border-radius:14px;padding:0;width:min(560px,94vw);max-height:88vh;background:var(--card);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.35)}'
+'dialog.sgd::backdrop{background:rgba(0,0,0,.45)}'
+'.sgd form,.sgd .sgb{padding:14px 16px 16px}'
+'.sgd h2{font:800 19px var(--disp);margin:0 0 4px;display:flex;justify-content:space-between;align-items:center;gap:10px}'
+'.sgd h2 button{font:600 14px var(--disp);padding:6px 12px}'+'.sgd .sgsub{color:var(--mut);font-size:13.5px;margin:0 0 12px}'
+'.sgd label{display:block;font-size:13px;font-weight:650;margin:12px 0 5px}'
+'.sgd input,.sgd textarea,.sgd select{font:inherit;width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--card);color:var(--ink)}'
+'.sgd textarea{min-height:110px;resize:vertical}'
+'.sgd .sgr{display:flex;flex-wrap:wrap;gap:6px}.sgd .sgr button{flex:1 1 auto}'
+'.sgd .sgf{display:flex;gap:8px;align-items:center;margin-top:16px}.sgd .sgf .sgo{margin-left:auto}'
+'.sgd .sgo{background:var(--acc);color:#1d1d1b;border-color:var(--acc);font-weight:700}'
+'.sgd .lnk{background:none;border:0;color:var(--link);padding:4px 0;font-size:13px}'
+'.sgd .err{color:#c0262d;font-size:13.5px;margin:10px 0 0;min-height:1em}'
+'.sgd .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}'
+'.sgd .sgtabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}.sgd .sgtabs button{font-size:13px;padding:6px 10px}'
+'.sgd .sgi{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:10px}'
+'.sgd .sgi h3{font:700 14.5px var(--disp);margin:0 0 2px}'
+'.sgd .sgi .m{color:var(--mut);font-size:12.5px;margin:0 0 6px}'
+'.sgd .sgi p.t{margin:0 0 8px;white-space:pre-wrap;overflow-wrap:anywhere}'
+'.sgd .sgi .sgr button{flex:0 1 auto;font-size:13px;padding:6px 10px}'
+'.sgd .pill{display:inline-block;font-size:11.5px;font-weight:700;border-radius:999px;padding:1px 8px;background:var(--chip);margin-left:6px;vertical-align:1px}'
+'.sgd .pill.nieuw{background:var(--acc);color:#1d1d1b}'
+'.sgd .sgx{border-left:4px solid var(--blue);background:var(--chip);border-radius:8px;padding:8px 10px;margin:0 0 8px}'
+'.sgd .sgx b{display:block;font-size:12.5px;margin-bottom:2px}.sgd .sgx p{margin:0;white-space:pre-wrap}.sgd .sgx small{color:var(--mut)}';
document.head.appendChild(css);

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const msg=t=>{if(typeof window.toast==='function')window.toast(t);};
const LS={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){}}};

// ---------- Firestore en inloggen via de REST-API (geen extra bibliotheek nodig) ----------
const DB='https://firestore.googleapis.com/v1/projects/'+FB.projectId+'/databases/(default)/documents';
const KEY='?key='+encodeURIComponent(FB.apiKey);
const str=v=>({stringValue:String(v)});
const val=f=>f?(f.stringValue!=null?f.stringValue:f.timestampValue!=null?f.timestampValue:''):'';
async function api(url,opt){
 const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error((j.error&&j.error.message)||('HTTP '+r.status));e.status=r.status;throw e;}
 return j;
}
// inloggen met Google (Firebase Authentication). De Firebase-bibliotheek wordt alleen geladen als iemand
// de beheerpagina opent; trainers die een suggestie sturen hebben hem niet nodig. Firebase onthoudt de inlog op dit apparaat.
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
let fbp=null;
function fb(){
 if(!fbp)fbp=Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js')]).then(async([A,U])=>{
  const app=A.initializeApp({apiKey:FB.apiKey,projectId:FB.projectId,authDomain:FB.projectId+'.firebaseapp.com'},'suggesties');
  const auth=U.getAuth(app);
  await new Promise(r=>{const off=U.onAuthStateChanged(auth,()=>{off();r();});});
  return {auth,U};
 });
 return fbp;
}
const AUTH={
 async login(){const {auth,U}=await fb();await U.signInWithPopup(auth,new U.GoogleAuthProvider());},
 async token(){try{const {auth}=await fb();return auth.currentUser?await auth.currentUser.getIdToken():null;}catch(e){return null;}},
 async logout(){try{const {auth,U}=await fb();await U.signOut(auth);}catch(e){}}
};
async function authed(url,opt){
 const t=await AUTH.token();if(!t){const e=new Error('niet ingelogd');e.status=401;throw e;}
 opt=opt||{};opt.headers=Object.assign({'Authorization':'Bearer '+t},opt.headers||{});
 return api(url,opt);
}
function send(d){
 return api(DB+'/suggesties'+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{
  oefening:str(d.oefening),soort:str(d.soort),tekst:str(d.tekst),naam:str(d.naam),status:str('nieuw'),tijd:{timestampValue:new Date().toISOString()}}})});
}
async function list(){
 let out=[],pt='';
 do{const j=await authed(DB+'/suggesties'+KEY+'&pageSize=300&orderBy='+encodeURIComponent('tijd desc')+(pt?'&pageToken='+encodeURIComponent(pt):''));
  (j.documents||[]).forEach(d=>{const f=d.fields||{};out.push({id:d.name.split('/').pop(),oefening:val(f.oefening),soort:val(f.soort),tekst:val(f.tekst),naam:val(f.naam),status:val(f.status)||'nieuw',tijd:val(f.tijd)});});
  pt=j.nextPageToken||'';}while(pt&&out.length<3000);
 return out;
}
const setStatus=(id,s)=>authed(DB+'/suggesties/'+id+KEY+'&updateMask.fieldPaths=status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{status:str(s)}})});
const remove=id=>authed(DB+'/suggesties/'+id+KEY,{method:'DELETE'});

// ---------- venster ----------
let dlg=null;
function box(){
 if(!dlg){dlg=document.createElement('dialog');dlg.className='sgd noprint';document.body.appendChild(dlg);
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});}
 return dlg;
}
function show(html){const d=box();d.innerHTML=html;if(!d.open){d.showModal?d.showModal():d.setAttribute('open','');}return d;}
const close=()=>{if(dlg)dlg.close();if(location.hash==='#beheer')history.replaceState(null,'',location.pathname+location.search);};

// formulier voor trainers
let last=0;
function form(oef){
 const d=show('<form novalidate><h2>Suggestie sturen <button type="button" data-x>Sluiten</button></h2>'
  +'<p class="sgsub">'+esc(oef)+'</p>'
  +'<label>Soort</label><div class="sgr" role="radiogroup">'+SOORT.map((s,i)=>'<button type="button" role="radio" data-s="'+esc(s)+'" aria-checked="'+(i===(oef==='Algemeen'?2:0))+'" class="'+(i===(oef==='Algemeen'?2:0)?'on':'')+'">'+esc(s)+'</button>').join('')+'</div>'
  +'<label for="sg_t">Je suggestie</label><textarea id="sg_t" maxlength="2000" placeholder="Wat kan beter, of welke oefening mis je?"></textarea>'
  +'<label for="sg_n">Je naam (mag leeg blijven)</label><input id="sg_n" maxlength="80" autocomplete="name">'
  +'<input class="hp" id="sg_w" tabindex="-1" autocomplete="off" aria-hidden="true">'
  +'<p class="err" id="sg_e" role="alert"></p>'
  +'<div class="sgf"><button type="button" class="lnk" data-beheer>Beheer</button><button type="submit" class="sgo">Versturen</button></div></form>');
 const $=s=>d.querySelector(s);
 $('#sg_n').value=LS.get('sug_naam')||'';
 d.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{d.querySelectorAll('[data-s]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b);});});
 $('[data-x]').onclick=close;
 $('[data-beheer]').onclick=admin;
 $('form').onsubmit=async e=>{
  e.preventDefault();
  const tekst=$('#sg_t').value.trim(),naam=$('#sg_n').value.trim(),soort=(d.querySelector('[data-s].on')||{}).dataset.s||'Anders';
  if(!tekst){$('#sg_e').textContent='Schrijf eerst je suggestie.';$('#sg_t').focus();return;}
  if($('#sg_w').value){close();return;} // ingevuld door een spambot
  if(Date.now()-last<20000){$('#sg_e').textContent='Even wachten, je hebt net al iets verstuurd.';return;}
  const btn=$('.sgo');btn.disabled=true;btn.textContent='Versturen...';
  try{await send({oefening:oef,soort,tekst,naam});last=Date.now();LS.set('sug_naam',naam);close();msg('Bedankt! Je suggestie is verstuurd.');}
  catch(err){btn.disabled=false;btn.textContent='Versturen';$('#sg_e').textContent='Versturen lukte niet. Controleer je internet en probeer het opnieuw.';}
 };
 setTimeout(()=>{const x=$('#sg_t');if(x)x.focus();},30);
}

// beheer: inloggen en de lijst
let filt='nieuw',items=[],AP={};
async function admin(){
 if(!(await AUTH.token()))return login();
 show('<div class="sgb"><h2>Suggesties <button type="button" data-x>Sluiten</button></h2><p class="sgsub">Laden...</p></div>');
 dlg.querySelector('[data-x]').onclick=close;
 try{items=await list();
  // aanpassingen.json (in de site) zegt welke suggesties Claude heeft verwerkt en wat er is veranderd;
  // zo'n goedgekeurde suggestie wordt hier vanzelf op Verwerkt gezet
  try{AP=await fetch('aanpassingen.json?t='+Date.now()).then(r=>r.ok?r.json():{});}catch(e){AP={};}
  for(const i of items)if(AP[i.id]&&i.status==='goedgekeurd'){try{await setStatus(i.id,'verwerkt');i.status='verwerkt';}catch(e){}}
  draw();}
 catch(e){if(e.status===403){AUTH.logout();login('Dit Google-account heeft geen toegang tot de suggesties.');}else if(e.status===401){login();}
  else dlg.querySelector('.sgsub').textContent='Laden lukte niet: '+e.message;}
}
function login(err){
 const d=show('<div class="sgb"><h2>Beheer suggesties <button type="button" data-x>Sluiten</button></h2>'
  +'<p class="sgsub">Alleen voor de beheerder van de app. Log in met je Google-account.</p>'
  +'<p class="err" id="sg_e" role="alert">'+esc(err||'')+'</p>'
  +'<div class="sgf"><button type="button" class="sgo">Inloggen met Google</button></div></div>');
 const $=s=>d.querySelector(s);
 $('[data-x]').onclick=close;
 $('.sgo').onclick=async()=>{const b=$('.sgo');b.disabled=true;
  try{await AUTH.login();admin();}
  catch(x){b.disabled=false;$('#sg_e').textContent=/popup-closed|cancelled/.test(x.code||'')?'Inloggen afgebroken.':/popup-blocked/.test(x.code||'')?'De browser blokkeerde het inlogvenster. Sta pop-ups toe en probeer opnieuw.':'Inloggen lukte niet: '+(x.code||x.message);}};
}
function when(t){const d=new Date(t);return isNaN(d)?'':d.toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
function draw(){
 const n=s=>items.filter(i=>s==='alles'||i.status===s).length;
 const tabs=['nieuw','goedgekeurd','verwerkt','afgewezen','alles'];
 const rows=items.filter(i=>filt==='alles'||i.status===filt);
 const act=i=>{const b=[];
  if(i.status!=='goedgekeurd'&&i.status!=='verwerkt')b.push('<button type="button" class="sgo" data-a="goedgekeurd">Goedkeuren</button>');
  if(i.status!=='afgewezen')b.push('<button type="button" data-a="afgewezen">Afwijzen</button>');
  if(i.status==='goedgekeurd')b.push('<button type="button" data-a="verwerkt">Verwerkt</button>');
  if(i.status!=='nieuw')b.push('<button type="button" data-a="nieuw">Terug naar nieuw</button>');
  b.push('<button type="button" data-a="weg">Verwijderen</button>');return b.join('');};
 show('<div class="sgb"><h2>Suggesties <button type="button" data-x>Sluiten</button></h2>'
  +'<div class="sgtabs">'+tabs.map(t=>'<button type="button" data-f="'+t+'" class="'+(t===filt?'on':'')+'">'+(ST[t]||'Alles')+' ('+n(t)+')</button>').join('')+'</div>'
  +(rows.length?rows.map(i=>'<div class="sgi" data-id="'+esc(i.id)+'"><h3>'+esc(i.oefening||'Algemeen')+'<span class="pill '+esc(i.status)+'">'+esc(ST[i.status]||i.status)+'</span></h3>'
    +'<p class="m">'+esc(i.soort)+' · '+esc(i.naam||'zonder naam')+' · '+esc(when(i.tijd))+'</p>'
    +'<p class="t">'+esc(i.tekst)+'</p>'+(AP[i.id]?'<div class="sgx"><b>Aanpassing</b><p>'+esc(AP[i.id].tekst)+'</p><small>'+esc([AP[i.id].datum,AP[i.id].pr?'PR #'+AP[i.id].pr:''].filter(Boolean).join(' · '))+'</small></div>':'')+'<div class="sgr">'+act(i)+'</div></div>').join('')
   :'<p class="sgsub">Geen suggesties in deze lijst.</p>')
  +'<div class="sgf"><button type="button" class="lnk" data-out>Uitloggen</button><button type="button" data-r style="margin-left:auto">Vernieuwen</button></div></div>');
 const d=dlg;
 d.querySelector('[data-x]').onclick=close;
 d.querySelector('[data-out]').onclick=async()=>{await AUTH.logout();close();msg('Uitgelogd');};
 d.querySelector('[data-r]').onclick=admin;
 d.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filt=b.dataset.f;draw();});
 d.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{
  const id=b.closest('.sgi').dataset.id,a=b.dataset.a,it=items.find(x=>x.id===id);
  if(a==='weg'&&!(await sure(b)))return;
  b.disabled=true;
  try{if(a==='weg'){await remove(id);items=items.filter(x=>x.id!==id);}else{await setStatus(id,a);it.status=a;}
   const sc=d.scrollTop;draw();d.scrollTop=sc;msg(a==='weg'?'Verwijderd':'Op '+ST[a].toLowerCase()+' gezet');}
  catch(e){b.disabled=false;if(e.status===401||e.status===403){login('Log opnieuw in.');}else msg('Opslaan lukte niet');}
 });
}
// verwijderen pas na een tweede tik (geen browservenster)
function sure(b){return new Promise(res=>{if(b.dataset.sure){res(true);return;}b.dataset.sure='1';b.textContent='Zeker weten?';setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent='Verwijderen';}res(false);},3000);});}

// ---------- knoppen in de app ----------
const open=t=>ON?form(t):window.open(FORM.replace('OEFENING',encodeURIComponent(t)),'_blank','noopener');
// welke oefening: naam uit de kop, deel uit het tabblad
function label(dr){
 const h=dr.querySelector('h3');
 const deel=dr.closest('#v_sen')?'Jeugd & Senioren':'Mini’s';
 return deel+': '+(h?h.textContent.trim():'onbekend');
}
function add(root){
 root.querySelectorAll('.dr .tools').forEach(tl=>{
  if(tl.querySelector('.sug'))return;
  const b=document.createElement('button');b.className='sug';b.type='button';b.textContent='Suggestie';
  b.title='Stuur een verbetering of idee voor deze oefening';
  b.onclick=()=>open(label(tl.closest('.dr')));
  tl.appendChild(b);
 });
}
// algemene knop in de kop, voor een nieuwe oefening of ander idee
const hd=document.querySelector('header');
if(hd){const g=document.createElement('button');g.className='sugg noprint';g.type='button';g.textContent='Idee of suggestie';
 g.title='Stuur een idee voor de app of een nieuwe oefening';g.onclick=()=>open('Algemeen');hd.appendChild(g);}
// de app tekent oefeningen telkens opnieuw: knoppen toevoegen zodra er iets verandert
add(document);
new MutationObserver(()=>add(document)).observe(document.body,{childList:true,subtree:true});
// beheer direct openen met #beheer achter de link
const hash=()=>{if(ON&&location.hash==='#beheer')admin();};
window.addEventListener('hashchange',hash);hash();
})();
