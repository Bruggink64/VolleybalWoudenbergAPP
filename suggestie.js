// Suggesties binnen de app.
// Trainers sturen bij elke oefening (knop "Suggestie") of via de kop ("Idee of suggestie") een idee in.
// Het formulier staat in de app zelf; inzendingen gaan naar een eigen Firebase-database (Firestore).
// Werkwijze: Nieuw -> Goedkeuren (= opdracht aan Claude) -> Claude maakt een voorstel als pull request met
// "<!-- suggestie: id -->" (en bij een nieuwe oefening "<!-- oefening: nXX -->") in de beschrijving -> Bekijk voorstel (proefversie in de app) -> Live zetten of Aanpassing doorgeven.
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
const ST={nieuw:'Nieuw',goedgekeurd:'Goedgekeurd',aanpassen:'Aanpassing gevraagd',live:'Gaat live',afgewezen:'Afgewezen',verwerkt:'Verwerkt',bezig:'In behandeling'};
const BEZIG=['goedgekeurd','aanpassen','live'];
const REPO='Bruggink64/VolleybalWoudenbergAPP';

const css=document.createElement('style');
css.textContent='.sug{font-size:12.5px;padding:5px 9px;background:none}.sugg{margin-left:auto;align-self:center;font-size:13px;padding:6px 12px;margin-bottom:10px;background:#fff}'
+'dialog.sgd{border:0;border-radius:14px;padding:0;width:min(560px,94vw);max-height:88vh;background:var(--card);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.35)}'
+'dialog.sgd::backdrop{background:rgba(0,0,0,.45)}'
+'.sgd form,.sgd .sgb{padding:14px 16px 16px}'
+'.sgd h2{font:800 19px var(--disp);margin:0 0 4px;display:flex;justify-content:space-between;align-items:center;gap:10px}'
+'.sgd h2 button{font:600 14px var(--disp);padding:6px 12px}'+'.sgd.sgp{width:min(980px,98vw);height:92vh;max-height:92vh;overflow:hidden}.sgd.sgp[open]{display:flex;flex-direction:column}.sgp .sgph{padding-bottom:6px}.sgp .sgpf{flex:1;width:100%;border:0;border-top:1px solid var(--line);background:#fff}'
+'.sgd .sgsub{color:var(--mut);font-size:13.5px;margin:0 0 12px}'
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
+'.sgd .pill.nieuw{background:var(--acc);color:#1d1d1b}.sgd .sgx a{color:var(--link)}.sgd .sgx p+p{margin-top:6px}.sgd .sgo2{margin:0 0 8px}.sgd .sgo2 label{margin-top:0}'
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
// mailmelding via Web3Forms (publieke sleutel; het ontvangende adres staat bij Web3Forms, niet hier)
const MAILKEY='bf125108-ba1e-4acc-a8e0-274d913dd738';
function meld(d){
 try{fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
  body:JSON.stringify({access_key:MAILKEY,subject:'Nieuwe suggestie: '+String(d.oefening).slice(0,80),from_name:'VolleybalApp',
   message:'Oefening: '+d.oefening+'\nSoort: '+d.soort+'\nNaam: '+(d.naam||'(geen)')+'\n\n'+d.tekst+'\n\nBeheren: '+location.origin+location.pathname+'#beheer'})}).catch(()=>{});}catch(e){}
}
function send(d){
 return api(DB+'/suggesties'+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{
  oefening:str(d.oefening),soort:str(d.soort),tekst:str(d.tekst),naam:str(d.naam),status:str('nieuw'),tijd:{timestampValue:new Date().toISOString()}}})});
}
async function list(){
 let out=[],pt='';
 do{const j=await authed(DB+'/suggesties'+KEY+'&pageSize=300&orderBy='+encodeURIComponent('tijd desc')+(pt?'&pageToken='+encodeURIComponent(pt):''));
  (j.documents||[]).forEach(d=>{const f=d.fields||{};out.push({id:d.name.split('/').pop(),oefening:val(f.oefening),soort:val(f.soort),tekst:val(f.tekst),naam:val(f.naam),status:val(f.status)||'nieuw',tijd:val(f.tijd),opmerking:val(f.opmerking)});});
  pt=j.nextPageToken||'';}while(pt&&out.length<3000);
 return out;
}
const setFields=(id,o)=>authed(DB+'/suggesties/'+id+KEY+Object.keys(o).map(k=>'&updateMask.fieldPaths='+k).join(''),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,str(v)]))})});
const setStatus=(id,s)=>setFields(id,{status:s});
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
  try{await send({oefening:oef,soort,tekst,naam});meld({oefening:oef,soort,tekst,naam});last=Date.now();LS.set('sug_naam',naam);close();msg('Bedankt! Je suggestie is verstuurd.');}
  catch(err){btn.disabled=false;btn.textContent='Versturen';$('#sg_e').textContent='Versturen lukte niet. Controleer je internet en probeer het opnieuw.';}
 };
 setTimeout(()=>{const x=$('#sg_t');if(x)x.focus();},30);
}

// beheer: inloggen en de lijst
let filt='nieuw',items=[],AP={},PR={};
async function admin(stil){
 if(!(await AUTH.token()))return login();
 if(!stil){show('<div class="sgb"><h2>Suggesties <button type="button" data-x>Sluiten</button></h2><p class="sgsub">Laden...</p></div>');
 dlg.querySelector('[data-x]').onclick=close;}
 try{items=await list();
  // aanpassingen.json: oudere verwerkte suggesties met hun aanpassing
  try{AP=await fetch('aanpassingen.json?t='+Date.now()).then(r=>r.ok?r.json():{});}catch(e){AP={};}
  // voorstellen van Claude: pull requests op GitHub met '<!-- suggestie: id -->' in de beschrijving
  PR={};try{const L=await fetch('https://api.github.com/repos/'+REPO+'/pulls?state=all&per_page=60').then(r=>r.ok?r.json():[]);
   L.forEach(p=>{const m=/<!--\s*suggestie:\s*([\w-]+)\s*-->/.exec(p.body||'');if(!m||(p.state==='closed'&&!p.merged_at))return;
    if(PR[m[1]]&&PR[m[1]].number>p.number)return;
    const t=/<!--\s*aanpassing\s*-->([\s\S]*?)<!--\s*\/aanpassing\s*-->/.exec(p.body||'');
    PR[m[1]]={number:p.number,url:p.html_url,open:p.state==='open',merged:!!p.merged_at,sha:p.head.sha,tekst:t?t[1].trim():'',body:p.body||'',datum:p.merged_at||p.updated_at};});}catch(e){}
  // live gezet (pull request gemerged) of oude aanpassing: dan staat de suggestie op Verwerkt
  for(const i of items)if((PR[i.id]&&PR[i.id].merged&&BEZIG.includes(i.status))||(AP[i.id]&&i.status==='goedgekeurd')){try{await setStatus(i.id,'verwerkt');i.status='verwerkt';}catch(e){}}
  try{localStorage.setItem('sgAdmin','1');}catch(e){}
  const sc=dlg.scrollTop;draw();dlg.scrollTop=sc;badge();if(stil===true)msg('Vernieuwd');}
 catch(e){if(stil){if(stil===true)msg('Vernieuwen lukte niet');return;}if(e.status===403){try{localStorage.removeItem('sgAdmin');}catch(x){}AUTH.logout();login('Dit Google-account heeft geen toegang tot de suggesties.');}else if(e.status===401){login();}
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
const inTab=(i,t)=>t==='alles'||(t==='bezig'?BEZIG.includes(i.status):i.status===t);
function stand(i){const p=PR[i.id];
 if(i.status==='goedgekeurd')return p&&p.open?'Voorstel klaar':'Wordt uitgewerkt';
 if(i.status==='aanpassen')return p&&p.open&&i.opmerking&&p.body.includes(i.opmerking.slice(0,60))?'Voorstel bijgewerkt':'Aanpassing gevraagd';
 return ST[i.status]||i.status;}
function kader(i){const p=PR[i.id],a=AP[i.id];
 if(p&&p.merged)return '<div class="sgx"><b>Aanpassing (live)</b><p>'+esc(p.tekst||'Zie PR #'+p.number)+'</p><small>'+esc(when(p.datum))+' · <a href="'+esc(p.url)+'" target="_blank" rel="noopener">PR #'+p.number+'</a></small></div>';
 if(a)return '<div class="sgx"><b>Aanpassing (live)</b><p>'+esc(a.tekst)+'</p><small>'+esc([a.datum,a.pr?'PR #'+a.pr:''].filter(Boolean).join(' · '))+'</small></div>';
 if(!BEZIG.includes(i.status))return '';
 if(!p||!p.open)return '<div class="sgx"><b>Wordt uitgewerkt</b><p>Claude maakt hier een voorstel voor. Binnen het uur staat het hier, met een proefversie om te bekijken.</p></div>';
 let h='<div class="sgx"><b>Voorstel</b><p>'+esc(p.tekst||'Zie de beschrijving van PR #'+p.number)+'</p>'
  +'<p><button type="button" class="sgo" data-a="prev">Bekijk voorstel</button> <small>(proefversie in de app, nog niet live)</small></p>';
 if(i.status==='live')h+='<p><small>Je hebt op Live zetten gedrukt. Wordt binnen een uur verwerkt.</small></p>';
 else if(i.status==='aanpassen')h+='<p><small>Jouw aanpassing: '+esc(i.opmerking)+'</small></p>';
 return h+'</div>';}
function draw(){
 const n=s=>items.filter(i=>inTab(i,s)).length;
 const tabs=['nieuw','bezig','verwerkt','afgewezen','alles'];
 const rows=items.filter(i=>inTab(i,filt));
 const act=i=>{const b=[],p=PR[i.id],vs=BEZIG.includes(i.status)&&p&&p.open;
  if(i.status==='nieuw'||i.status==='afgewezen')b.push('<button type="button" class="sgo" data-a="goedgekeurd" title="Claude werkt de suggestie uit tot een voorstel">Goedkeuren</button>');
  if(vs&&i.status!=='live')b.push('<button type="button" class="sgo" data-a="live">Live zetten</button><button type="button" data-a="opm">Aanpassing doorgeven</button>');
  if(i.status!=='afgewezen'&&i.status!=='verwerkt')b.push('<button type="button" data-a="afgewezen">Afwijzen</button>');
  if(i.status!=='nieuw')b.push('<button type="button" data-a="nieuw">Terug naar nieuw</button>');
  b.push('<button type="button" data-a="weg">Verwijderen</button>');return b.join('');};
 show('<div class="sgb"><h2>Suggesties <span><button type="button" data-rt>Vernieuwen</button> <button type="button" data-x>Sluiten</button></span></h2>'
  +'<div class="sgtabs">'+tabs.map(t=>'<button type="button" data-f="'+t+'" class="'+(t===filt?'on':'')+'">'+(ST[t]||'Alles')+' ('+n(t)+')</button>').join('')+'</div>'
  +(rows.length?rows.map(i=>'<div class="sgi" data-id="'+esc(i.id)+'"><h3>'+esc(i.oefening||'Algemeen')+'<span class="pill '+esc(i.status)+'">'+esc(stand(i))+'</span></h3>'
    +'<p class="m">'+esc(i.soort)+' · '+esc(i.naam||'zonder naam')+' · '+esc(when(i.tijd))+'</p>'
    +'<p class="t">'+esc(i.tekst)+'</p>'+kader(i)
    +'<div class="sgo2" hidden><label>Wat moet er anders?</label><textarea maxlength="1000"></textarea><div class="sgr" style="margin-top:6px"><button type="button" class="sgo" data-a="opmsend">Versturen</button><button type="button" data-a="opmx">Annuleren</button></div></div>'
    +'<div class="sgr">'+act(i)+'</div></div>').join('')
   :'<p class="sgsub">Geen suggesties in deze lijst.</p>')
  +'<div class="sgf"><button type="button" class="lnk" data-out>Uitloggen</button><button type="button" data-r style="margin-left:auto">Vernieuwen</button></div></div>');
 const d=dlg;
 d.querySelector('[data-x]').onclick=close;
 d.querySelector('[data-out]').onclick=async()=>{await AUTH.logout();close();msg('Uitgelogd');};
 d.querySelector('[data-r]').onclick=()=>admin(true);d.querySelector('[data-rt]').onclick=()=>admin(true);
 d.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filt=b.dataset.f;draw();});
 d.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{
  const card=b.closest('.sgi'),id=card.dataset.id,a=b.dataset.a,it=items.find(x=>x.id===id),box=card.querySelector('.sgo2');
  if(a==='prev'){preview(it);return;}
  if(a==='opm'){box.hidden=false;box.querySelector('textarea').focus();return;}
  if(a==='opmx'){box.hidden=true;return;}
  if(a==='weg'&&!(await sure(b)))return;
  let o=null;
  if(a==='opmsend'){const t=box.querySelector('textarea').value.trim();if(!t){box.querySelector('textarea').focus();return;}o={status:'aanpassen',opmerking:t};}
  b.disabled=true;
  try{if(a==='weg'){await remove(id);items=items.filter(x=>x.id!==id);}
   else if(o){await setFields(id,o);Object.assign(it,o);}
   else{await setStatus(id,a);it.status=a;}
   const sc=d.scrollTop;draw();d.scrollTop=sc;
   msg(a==='weg'?'Verwijderd':o?'Aanpassing doorgegeven aan Claude':a==='live'?'Wordt binnen een uur verwerkt':a==='goedgekeurd'?'Claude werkt het uit tot een voorstel':'Op '+ST[a].toLowerCase()+' gezet');}
  catch(e){b.disabled=false;if(e.status===401||e.status===403){login('Log opnieuw in.');}else msg('Opslaan lukte niet');}
 });
}
// proefversie: de app uit het voorstel wordt hier in een venster getoond (zonder een andere site te openen)
let pdlg=null;
const RAW='https://raw.githubusercontent.com/'+REPO+'/';
async function bouwProef(sha,oid){
 const get=f=>fetch(RAW+sha+'/'+f).then(r=>{if(!r.ok)throw new Error(f+' '+r.status);return r.text();});
 let h=await get('index.html');
 const skip=/^(https?:)?\/\//,files=new Set();
 h.replace(/<script\s+src="([^"]+)"[^>]*><\/script>/g,(m,f)=>{if(!skip.test(f))files.add(f);return m;});
 h.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>/g,(m,f)=>{if(!skip.test(f))files.add(f);return m;});
 const txt={};await Promise.all([...files].map(async f=>{txt[f]=await get(f);}));
 h=h.replace(/<script\s+src="([^"]+)"[^>]*><\/script>/g,(m,f)=>skip.test(f)||f==='suggestie.js'?'':'<script>'+txt[f].replace(/<\/script/gi,'<\\/script')+'<\/script>');
 h=h.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>/g,(m,f)=>skip.test(f)?m:'<style>'+txt[f]+'</style>');
 // bij een Jeugd & Senioren-oefening direct de goede oefening tonen
 if(oid){const spring=function(id){try{setView('sen');var d=SEN.find(function(x){return x.id===id;});if(!d)return;
   senPick(['wu','insp','tech','spel','zes','eind'].indexOf(d.blok),-1);senTake(id);
   setTimeout(function(){var e=document.querySelector('.dr[data-oid="'+id+'"]');if(!e)return;
    var x=e.querySelector('.owexp');if(x&&e.classList.contains('closed'))x.click();
    // de kaart blijft op zijn plek (verplaatsen stopt de animatie); al het andere wordt verborgen
    for(var n=e;n&&n!==document.body;n=n.parentNode){Array.prototype.forEach.call(n.parentNode.children,function(c){if(c!==n&&c.tagName!=='SCRIPT'&&c.tagName!=='STYLE')c.style.display='none';});if(n!==e){n.style.display='block';n.style.maxWidth='900px';n.style.margin='0 auto';n.style.width='100%';}}
    var hd=document.querySelector('header');if(hd)hd.style.display='none';
    Array.prototype.forEach.call(e.querySelectorAll('.tools'),function(t){t.style.display='none';});},300);}catch(e){}};
  h=h.replace('</body>',()=>'<script>window.addEventListener("load",function(){('+spring.toString()+')('+JSON.stringify(oid)+');});<\/script></body>');}
 return h;
}
async function preview(it){
 const p=PR[it.id];if(!p)return;
 if(!pdlg){pdlg=document.createElement('dialog');pdlg.className='sgd sgp noprint';document.body.appendChild(pdlg);}
 const oid=(/Jeugd/.test(it.oefening)&&/\[([\w-]{1,8})\]/.exec(it.oefening)||[])[1]||(/<!--\s*oefening:\s*([\w-]+)\s*-->/.exec(p.body||'')||[])[1]||'';
 pdlg.innerHTML='<div class="sgb"><h2>Voorstel bekijken <button type="button" data-px>Sluiten</button></h2><p class="sgsub">Proefversie laden...</p></div>';
 if(!pdlg.open)pdlg.showModal();
 pdlg.querySelector('[data-px]').onclick=()=>pdlg.close();
 try{
  const html=await bouwProef(p.sha,oid);
  pdlg.innerHTML='<div class="sgb sgph"><h2>Voorstel (proefversie, nog niet live) <button type="button" data-px>Sluiten</button></h2>'
   +'<p class="sgsub">'+esc(p.tekst||'')+'</p></div><iframe class="sgpf" title="Proefversie van het voorstel"></iframe>';
  const f=pdlg.querySelector('iframe');f.setAttribute('sandbox','allow-scripts');f.srcdoc=html;
  pdlg.querySelector('[data-px]').onclick=()=>pdlg.close();
 }catch(e){pdlg.querySelector('.sgsub').textContent='De proefversie laden lukte niet ('+e.message+'). Probeer het later opnieuw.';}
}
// verwijderen pas na een tweede tik (geen browservenster)
function sure(b){return new Promise(res=>{if(b.dataset.sure){res(true);return;}b.dataset.sure='1';b.textContent='Zeker weten?';setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent='Verwijderen';}res(false);},3000);});}

// ---------- knoppen in de app ----------
const open=t=>ON?form(t):window.open(FORM.replace('OEFENING',encodeURIComponent(t)),'_blank','noopener');
// welke oefening: naam uit de kop, deel uit het tabblad
function label(dr){
 const h=dr.querySelector('h3');
 const deel=dr.closest('#v_sen')?'Jeugd & Senioren':'Mini’s';
 return deel+': '+(h?h.textContent.trim():'onbekend')+(dr.dataset.oid&&dr.dataset.oid.length<=8?' ['+dr.dataset.oid+']':'');
}
function add(root){
 root.querySelectorAll('.dr .tools').forEach(tl=>{
  if(tl.querySelector('.sug'))return;
  const b=document.createElement('button');b.className='sug';b.type='button';b.textContent='Suggestie';
  b.title='Suggestie voor deze oefening: stuur een verbetering of idee';
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
// icoon in de kop voor de beheerder: toont hoeveel acties klaarstaan (nieuw, of voorstel dat op jou wacht); alleen zichtbaar als je als beheerder bent ingelogd
let bb=null;
async function badge(){
 try{let ok=false;try{ok=localStorage.getItem('sgAdmin')==='1';}catch(e){}
  if(!ok||!ON)return;
  if(!(await AUTH.token())){if(bb)bb.style.display='none';return;}
  if(!bb){const h=document.querySelector('header');if(!h)return;
   bb=document.createElement('button');bb.type='button';bb.className='sugg noprint';bb.style.display='none';bb.title='Beheer: acties die op jou wachten';bb.onclick=()=>admin();h.appendChild(bb);}
  const its=await list();let P={};
  try{const L=await fetch('https://api.github.com/repos/'+REPO+'/pulls?state=open&per_page=60').then(r=>r.ok?r.json():[]);
   L.forEach(p=>{const m=/<!--\s*suggestie:\s*([\w-]+)\s*-->/.exec(p.body||'');if(m)P[m[1]]=p.body||'';});}catch(e){}
  let n=0;for(const i of its){if(i.status==='nieuw')n++;
   else if(i.status==='goedgekeurd'&&P[i.id]!=null)n++;
   else if(i.status==='aanpassen'&&P[i.id]!=null&&i.opmerking&&P[i.id].includes(i.opmerking.slice(0,60)))n++;}
  bb.textContent='\u{1F514} '+n;bb.style.display='';bb.style.background=n>0?'#ffd100':'';
 }catch(e){if(e&&(e.status===401||e.status===403)&&bb)bb.style.display='none';}
}
badge();setInterval(()=>{if(!document.hidden)badge();},60000);
// de lijst ververst zichzelf elke minuut zolang het beheervenster openstaat (niet tijdens het typen of de proefversie)
setInterval(()=>{try{if(dlg&&dlg.open&&dlg.querySelector('[data-rt]')&&!dlg.querySelector('.sgo2:not([hidden])')&&!(pdlg&&pdlg.open))admin('auto');}catch(e){}},60000);
// beheer direct openen met #beheer achter de link
const hash=()=>{if(ON&&location.hash==='#beheer')admin();};
window.addEventListener('hashchange',hash);hash();
})();
