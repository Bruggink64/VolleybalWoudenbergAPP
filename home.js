// Homepagina: welkomstbericht, snelkoppelingen en het programma en de uitslagen van VV Woudenberg.
// De wedstrijden komen rechtstreeks uit de openbare RSS-feeds van de Nevobo (volleybal.nl);
// er is geen account of sleutel nodig. De laatste gegevens worden in de browser bewaard,
// zodat de pagina zonder internet de vorige stand laat zien.
(function(){
// ---- aanpassen ----
const CLUB='CKL8Z3K';                 // verenigingscode van VV Woudenberg bij de Nevobo
const WELKOM_TITEL='Welkom, trainer!';
const WELKOM_TEKST='Fijn dat je er bent. Stel hier in een paar tikken een training samen voor de mini’s of voor jeugd en senioren, en bekijk de 5-1 rotaties en de verdediging. Hieronder zie je wie er deze week speelt en hoe onze teams het deden. Veel trainingsplezier!';
const WELKOM_KORT='Stel snel een training samen en zie hieronder wie er deze week speelt.'; // op de telefoon
const AANTAL=8;                       // aantal wedstrijden per lijst voordat "Meer tonen" verschijnt
// -------------------

const FEED='https://api.nevobo.nl/export/vereniging/'+CLUB+'/';
const LSK='vvw_home_v1',TEAMK='vvw_home_team',STK='vvw_home_stand_v4';
// competitiestand: plek van elk team in de poules van onze teams (JSON-API van de Nevobo)
const API='https://api.nevobo.nl';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const TZ={timeZone:'Europe/Amsterdam'};
const dag=d=>d.toLocaleDateString('nl-NL',{...TZ,weekday:'long',day:'numeric',month:'long'});
const tijd=d=>d.toLocaleTimeString('nl-NL',{...TZ,hour:'2-digit',minute:'2-digit'});
const dagKey=d=>d.toLocaleDateString('sv-SE',TZ);
const isW=s=>/woudenberg/i.test(s);
// "Vallei Finance Group Woudenberg DS 1" -> "DS 1"
const teamVan=s=>{const m=/woudenberg\s+(.+)$/i.exec(s);return m?m[1].trim():s.trim();};

function parse(xml,soort){
 const d=new DOMParser().parseFromString(xml,'text/xml');
 if(d.querySelector('parsererror'))throw new Error('Onleesbare feed');
 return Array.from(d.querySelectorAll('item')).map(it=>{
  const t=(it.querySelector('title')||{}).textContent||'',ds=(it.querySelector('description')||{}).textContent||'';
  const st=(it.getElementsByTagName('nevobo:status')[0]||{}).textContent||'';
  const w={t:Date.parse((it.querySelector('pubDate')||{}).textContent||''),url:(it.querySelector('link')||{}).textContent||'',status:st.trim()};
  if(soort==='p'){
   const m=/^[^:]+:\d\d:\s*(.+?)\s+-\s+(.+)$/.exec(t)||/^(.+?)\s+-\s+(.+)$/.exec(t);
   if(!m)return null;w.a=m[1].trim();w.b=m[2].replace(/,\s*Uitslag:.*$/,'').trim(); // net gespeeld: uitslag staat al in de titel
   const loc=/Speellocatie:\s*(.+)$/.exec(ds);
   if(loc){const p=loc[1].split(',').map(x=>x.trim());w.zaal=p[0];const pc=/\d{4}\s?[A-Z]{2}\s+(.+)$/.exec(p[p.length-1]);w.plaats=pc?pc[1].trim():'';}
  }else{
   const m=/^(.+?)\s+-\s+(.+?),\s*Uitslag:\s*(\d+)-(\d+)/.exec(t);
   if(!m)return null;w.a=m[1].trim();w.b=m[2].trim();w.sa=+m[3];w.sb=+m[4];
   const s=/Setstanden:\s*(.+)$/.exec(ds);w.sets=s?s[1].trim():'';
  }
  w.team=isW(w.a)?teamVan(w.a):teamVan(w.b);
  return isNaN(w.t)?null:w;
 }).filter(Boolean);
}

async function laad(){
 const r=await Promise.all(['programma','resultaten'].map(f=>fetch(FEED+f+'.rss',{cache:'no-cache'}).then(x=>{if(!x.ok)throw new Error(x.status);return x.text();})));
 const data={p:parse(r[0],'p'),u:parse(r[1],'u'),bij:Date.now()};
 put(LSK,data);return data;
}

// ---- stand ----
// "Vallei Finance Group Woudenberg DS 1" -> "valleifinancegroupwoudenbergds1"
const sleutel=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const seizoen=()=>{const n=new Date(),y=n.getFullYear();return n.getMonth()>=6?y+'-'+(y+1):(y-1)+'-'+y;};
async function allePaginas(pad){
 const uit=[];let url=API+pad;
 for(let i=0;url&&i<30;i++){
  const r=await fetch(url,{headers:{Accept:'application/ld+json'},cache:'no-cache'});if(!r.ok)throw new Error(r.status);
  const d=await r.json();uit.push(...(d['hydra:member']||[]));
  const nx=d['hydra:view']&&d['hydra:view']['hydra:next'];url=nx?API+nx:null;
 }
 return uit;
}
async function laadStand(){
 const eigen=await allePaginas('/competitie/pouleindelingen?vereniging=/relatiebeheer/verenigingen/'+CLUB.toLowerCase()+'&seizoen=/seizoenen/'+seizoen());
 const poules=Array.from(new Set(eigen.map(m=>m.poule))).filter(p=>!/beker/i.test(p)); // alleen de competitie, geen beker
 const groepen=[];for(let i=0;i<poules.length;i+=8)groepen.push(poules.slice(i,i+8));
 const leden=(await Promise.all(groepen.map(g=>allePaginas('/competitie/pouleindelingen?'+g.map(p=>'poule[]='+encodeURIComponent(p)).join('&'))))).flat();
 const perPoule={};leden.forEach(m=>{(perPoule[m.poule]=perPoule[m.poule]||[]).push(m);});
 // naam en laatste wijziging van elke poule, voor de standtabel onderaan
 const info={};await Promise.all(poules.map(p=>fetch(API+p,{headers:{Accept:'application/ld+json'}}).then(x=>x.ok?x.json():null).then(d=>{if(d)info[p]={naam:d.omschrijving||'',bij:Date.parse(d.laatsteUpdate||'')||0};}).catch(()=>{})));
 // tabel[eigen team] = stand van de poule die het laatst is bijgewerkt (na de winterstop de nieuwe poule)
 const tabel={};
 Object.keys(perPoule).forEach(p=>{const l=perPoule[p].slice().sort((a,b)=>(a.positie||99)-(b.positie||99)),i=info[p]||{naam:'',bij:0};
  l.filter(m=>isW(m.omschrijving||'')).forEach(o=>{const t=teamVan(o.omschrijving);
   if(!tabel[t]||i.bij>=tabel[t].bij)tabel[t]={naam:i.naam,bij:i.bij,rij:l.map(m=>[m.positie,m.omschrijving,m.gespeeld,m.punten,m.setsVoor,m.setsTegen,m.puntenVoor,m.puntenTegen])};});});
 // r[eigen team]["naam tegenstander"] = [plek, aantal teams]
 const r={};
 Object.keys(perPoule).forEach(p=>{
  const l=perPoule[p];
  l.filter(m=>isW(m.omschrijving||'')).forEach(o=>{
   const t=teamVan(o.omschrijving),k=r[t]=r[t]||{};
   l.forEach(m=>{const n=sleutel(m.omschrijving||''),oud=k[n];
    if(m.positie&&!oud)k[n]=[m.positie,l.length];});
  });
 });
 const data={r,tabel,bij:Date.now()};put(STK,data);return data;
}
function plek(team,naam){
 const k=S&&S.r&&S.r[team];if(!k)return null;const n=sleutel(naam);
 if(k[n])return k[n];
 // naam net anders geschreven (bijv. met of zonder sponsor)
 const alt=Object.keys(k).find(x=>x.endsWith(n)||n.endsWith(x));return alt?k[alt]:null;
}
function rang(w,naam){
 const p=plek(w.team,naam);if(!p)return '';
 return ' <span class="hm-r" title="'+p[0]+'e van '+p[1]+' in de competitie">#'+p[0]+'</span>';
}

function stand(team){
 const t=team&&S&&S.tabel&&S.tabel[team];if(!t||!t.rij.length)return '';
 return '<section class="card hm-stand"><h3>Stand'+(t.naam?' <span>'+esc(t.naam)+'</span>':'')+'</h3><table><thead><tr><th>#</th><th class="hm-sn">Team</th><th title="gespeeld">G</th><th title="punten">P</th><th title="sets voor–tegen">Sets</th><th title="punten voor–tegen (gescoorde ballen)">Ptn</th></tr></thead><tbody>'
  +t.rij.map(r=>'<tr'+(isW(r[1]||'')&&teamVan(r[1])===team?' class="eigen"':'')+'><td>'+esc(r[0]||'')+'</td><td class="hm-sn">'+naam(r[1]||'')+'</td><td>'+esc(r[2]??'')+'</td><td><b>'+esc(r[3]??'')+'</b></td><td>'+esc((r[4]??'')+'–'+(r[5]??''))+'</td><td>'+(r[6]==null?'':esc(r[6]+'–'+r[7]))+'</td></tr>').join('')
  +'</tbody></table></section>';
}

let S=null,D=null,meerP=false,meerU=false,fout='',tab='p';
function teams(){
 const s=new Set();if(D){D.p.forEach(w=>s.add(w.team));D.u.forEach(w=>s.add(w.team));}
 const v=x=>{const m=/^([A-Z]+)\s*(\d*)/.exec(x)||[];return [m[1]||x,+(m[2]||0)];};
 const volg='DS HS DR HR MA JA MB JB MC JC XC MD JD XD N5 N6 CMV'.split(' ');
 return Array.from(s).sort((x,y)=>{const a=v(x),b=v(y),ia=volg.indexOf(a[0]),ib=volg.indexOf(b[0]);
  return (ia<0?99:ia)-(ib<0?99:ib)||String(a[0]).localeCompare(b[0])||a[1]-b[1];});
}
// eigen teams zonder sponsornaam: "Vallei Finance Group Woudenberg DS 1" -> "Woudenberg DS 1"
const naam=(s,w)=>(isW(s)?'<b>Woudenberg '+esc(teamVan(s))+'</b>':esc(s))+(w?rang(w,s):'');

function programma(lijst){
 const nu=Date.now()-2*3600e3,rest=lijst.filter(w=>w.t>=nu).sort((a,b)=>a.t-b.t);
 if(!rest.length)return '<p class="hm-leeg">Geen wedstrijden gepland.</p>';
 const toon=meerP?rest.slice(0,AANTAL*4):rest.slice(0,AANTAL);let h='',dk='';
 toon.forEach(w=>{const d=new Date(w.t),k=dagKey(d);
  if(k!==dk){dk=k;h+='<h4 class="hm-dag">'+esc(dag(d))+'</h4>';}
  const thuis=/woudenberg/i.test(w.plaats||'');
  h+='<a class="hm-w" href="'+esc(w.url)+'" target="_blank" rel="noopener"><span class="hm-t">'+esc(tijd(d))+'</span>'
   +'<span class="hm-m"><span class="hm-ts">'+naam(w.a,w)+' <i>–</i> '+naam(w.b,w)+'</span>'
   +'<span class="hm-z">'+(thuis?'<em class="hm-thuis">Thuis</em>':'<em class="hm-uit">Uit</em>')+esc([w.zaal,w.plaats].filter(Boolean).join(', '))+'</span></span></a>';});
 if(rest.length>toon.length||meerP)h+='<button type="button" class="hm-meer" data-m="p">'+(meerP?'Minder tonen':'Meer tonen ('+(rest.length-toon.length)+' meer)')+'</button>';
 return h;
}
function uitslagen(lijst){
 const rest=lijst.slice().sort((a,b)=>b.t-a.t);
 if(!rest.length)return '<p class="hm-leeg">Nog geen uitslagen.</p>';
 const toon=meerU?rest.slice(0,AANTAL*4):rest.slice(0,AANTAL);let h='',dk='';
 toon.forEach(w=>{const d=new Date(w.t),k=dagKey(d);
  if(k!==dk){dk=k;h+='<h4 class="hm-dag">'+esc(dag(d))+'</h4>';}
  const res=uitkomst(w);
  h+='<a class="hm-w" href="'+esc(w.url)+'" target="_blank" rel="noopener"><span class="hm-s '+res+'">'+w.sa+'–'+w.sb+'</span>'
   +'<span class="hm-m"><span class="hm-ts">'+naam(w.a,w)+' <i>–</i> '+naam(w.b,w)+'</span>'
   +(w.sets?'<span class="hm-z">'+esc(w.sets)+'</span>':'')+'</span></a>';});
 if(rest.length>toon.length||meerU)h+='<button type="button" class="hm-meer" data-m="u">'+(meerU?'Minder tonen':'Meer tonen ('+(rest.length-toon.length)+' meer)')+'</button>';
 return h;
}
// mini-teams (L1 t/m L6) tellen niet mee in de clubcijfers
const mini=t=>/^L\d/i.test(t);
// 'win', 'gelijk' (2-2 bij vaste sets), 'verlies', of '' bij een onderling duel
function uitkomst(w){const wa=isW(w.a),wb=isW(w.b);if(wa&&wb)return '';
 const ons=wa?w.sa:w.sb,zij=wa?w.sb:w.sa;return ons>zij?'win':ons<zij?'verlies':'gelijk';}
function tegel(b,kort,lang){return '<div><b>'+b+'</b><span>'+(lang?'<i>'+lang+'</i>':'')+kort+'</span></div>';}
function weekStat(team){
 if(!D)return '';const nu=Date.now();
 if(!team){
  const wk=D.p.filter(w=>!mini(w.team)&&w.t>=nu-2*3600e3&&w.t<nu+7*864e5);
  const thuis=wk.filter(w=>/woudenberg/i.test(w.plaats||'')).length;
  const vorig=D.u.filter(w=>!mini(w.team)&&w.t>=nu-7*864e5&&uitkomst(w)),win=vorig.filter(w=>uitkomst(w)==='win').length;
  return '<div class="hm-stats">'+tegel(wk.length,'komende 7 dagen','wedstrijden de ')+tegel(thuis,'thuis','daarvan ')+tegel(win+'/'+vorig.length,'gewonnen',null).replace('</span>','<i> afgelopen week</i></span>')+'</div>'
   +'<p class="hm-uitleg">Zonder de mini’s. Kies een team voor de cijfers van het seizoen.</p>';
 }
 // seizoen van één team
 const g=D.u.filter(w=>w.team===team&&uitkomst(w)).sort((a,b)=>b.t-a.t);
 let W=0,G=0,V=0,sv=0,st=0;
 g.forEach(w=>{const u=uitkomst(w);if(u==='win')W++;else if(u==='gelijk')G++;else V++;const wa=isW(w.a);sv+=wa?w.sa:w.sb;st+=wa?w.sb:w.sa;});
 const volg=D.p.filter(w=>w.team===team&&w.t>=nu-2*3600e3).sort((a,b)=>a.t-b.t)[0];
 const vorm=g.slice(0,5).reverse().map(w=>{const u=uitkomst(w);return '<i class="hm-v '+u+'" title="'+esc(w.a+' – '+w.b+': '+w.sa+'-'+w.sb)+'">'+(u==='win'?'W':u==='gelijk'?'G':'V')+'</i>';}).join('');
 return '<div class="hm-stats hm-team">'+tegel(g.length,'gespeeld')+tegel(W,'gewonnen')+(G?tegel(G,'gelijk'):'')+tegel(V,'verloren')+tegel(sv+'–'+st,'sets')+'</div>'
  +'<div class="hm-vorm">'+(vorm?'<span>Laatste '+Math.min(5,g.length)+'</span>'+vorm:'<span>Nog geen uitslagen dit seizoen</span>')
  +(volg?'<span class="hm-volg">Volgende: <b>'+esc(dag(new Date(volg.t)))+' '+esc(tijd(new Date(volg.t)))+'</b>, '+(isW(volg.a)?esc(volg.b):esc(volg.a))+(/woudenberg/i.test(volg.plaats||'')?' (thuis)':' (uit)')+'</span>':'')+'</div>';
}

function teken(){
 const el=$('v_home');if(!el)return;
 const team=get(TEAMK,''),f=l=>team?l.filter(w=>w.team===team):l,ts=teams();
 const opt='<option value="">Alle teams</option>'+ts.map(t=>'<option'+(t===team?' selected':'')+'>'+esc(t)+'</option>').join('');
 const bij=D?'Bijgewerkt '+new Date(D.bij).toLocaleString('nl-NL',{...TZ,weekday:'short',hour:'2-digit',minute:'2-digit'}):'';
 el.innerHTML='<section class="hm-welkom"><h2>'+esc(WELKOM_TITEL)+'</h2><p class="hm-lang">'+esc(WELKOM_TEKST)+'</p><p class="hm-kort">'+esc(WELKOM_KORT)+'</p>'
  +'<div class="hm-snel"><button type="button" data-v="gen">Training mini’s</button><button type="button" data-v="sen">Training jeugd &amp; senioren</button>'
  +'<button type="button" data-v="rot">5-1 rotaties</button><button type="button" data-v="def">Verdediging</button></div></section>'
  +'<div class="hm-kop"><label for="hm_team">Team</label><select id="hm_team">'+opt+'</select><button type="button" id="hm_ver" class="hm-ver" aria-label="Vernieuwen" title="Vernieuwen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg><span>Vernieuwen</span></button></div>'
  +weekStat(team)
  +'<div class="hm-seg" role="tablist"><button type="button" role="tab" data-t="p" aria-selected="'+(tab==='p')+'">Programma</button><button type="button" role="tab" data-t="u" aria-selected="'+(tab==='u')+'">Uitslagen</button></div>'
  +'<div class="hm-cols" data-tab="'+tab+'"><section class="card hm-lijst hm-p"><h3>Programma</h3>'+(D?programma(f(D.p)):'<p class="hm-leeg">Wedstrijden laden…</p>')+'</section>'
  +'<section class="card hm-lijst hm-u"><h3>Uitslagen</h3>'+(D?uitslagen(f(D.u)):'<p class="hm-leeg">Uitslagen laden…</p>')+'</section></div>'
  +stand(team)
  +'<p class="note hm-bron">'+((fout||bij)?esc(fout||bij)+'. ':'')+(S?'#3 = huidige plek in de competitiestand. ':'')+'Wedstrijdgegevens: Nevobo (volleybal.nl). Tik op een wedstrijd voor alle details. Meer over de club op <a href="https://www.volleybalwoudenberg.nl" target="_blank" rel="noopener">volleybalwoudenberg.nl</a>.</p>';
 el.querySelectorAll('.hm-snel button').forEach(b=>b.onclick=()=>{setView(b.dataset.v);window.scrollTo(0,0);});
 $('hm_team').onchange=e=>{put(TEAMK,e.target.value);meerP=meerU=false;teken();};
 $('hm_ver').onclick=ververs;
 el.querySelectorAll('.hm-seg button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;teken();});
 el.querySelectorAll('.hm-meer').forEach(b=>b.onclick=()=>{if(b.dataset.m==='p')meerP=!meerP;else meerU=!meerU;teken();});
}
let bezig=false;
async function ververs(){
 if(bezig)return;bezig=true;fout='';const b=$('hm_ver');if(b){b.disabled=true;b.classList.add('laadt');}
 laadStand().then(x=>{S=x;if(!bezig)teken();}).catch(()=>{});
 try{D=await laad();}
 catch(e){fout=D?'Geen verbinding, dit is de stand van '+new Date(D.bij).toLocaleString('nl-NL',{...TZ,weekday:'short',hour:'2-digit',minute:'2-digit'}):'De wedstrijden konden niet worden geladen. Probeer het later opnieuw';}
 finally{bezig=false;teken();}
}

D=get(LSK,null);S=get(STK,null);teken();ververs();
// zonder gedeelde training in de link start de app op de homepagina
if(!location.hash.slice(1)&&typeof setView==='function')setView('home');
})();
