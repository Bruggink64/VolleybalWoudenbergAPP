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
// teams van andere clubs die we volgen: Nevobo-verenigingscode, team (soort/nummer), naam in de app,
// en hoe de naam in de Nevobo-gegevens eruitziet. Ze staan apart in de teamkeuze en tellen niet mee bij "Alle teams".
const EXTRA=[
 {club:'CKL7S2R',team:'heren/1',naam:'Keistad HS 1',herken:/keistad\s+hs\s*1$/i}   // AVV Keistad Amersfoort, Superdivisie
];
// -------------------

const FEED='https://api.nevobo.nl/export/vereniging/'+CLUB+'/';
const LSK='vvw_home_v2',TEAMK='vvw_home_team',STK='vvw_home_stand_v8';
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
const isWb=s=>/woudenberg/i.test(s);
// gevolgd team van een andere club, bijv. "AVV Keistad HS 1"
const isX=s=>EXTRA.find(e=>e.herken.test(String(s).trim()))||null;
const extraTeam=t=>EXTRA.some(e=>e.naam===t);
// "eigen" team: van Woudenberg of een gevolgd team
const isW=s=>isWb(s)||!!isX(s);
// "Vallei Finance Group Woudenberg DS 1" -> "DS 1", "AVV Keistad HS 1" -> "Keistad HS 1"
const teamVan=s=>{const x=isX(s);if(x)return x.naam;const m=/woudenberg\s+(.+)$/i.exec(s);return m?m[1].trim():s.trim();};
// thuiswedstrijd: Woudenberg speelt thuis in Woudenberg, een gevolgd team als het als eerste genoemd wordt
const isThuis=w=>extraTeam(w.team)?!!isX(w.a):/woudenberg/i.test(w.plaats||'');
const teamPad=e=>'/competitie/teams/'+e.club.toLowerCase()+'/'+e.team;

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

const rss=u=>fetch(u,{cache:'no-cache'}).then(x=>{if(!x.ok)throw new Error(x.status);return x.text();});
async function laad(){
 const r=await Promise.all(['programma','resultaten'].map(f=>rss(FEED+f+'.rss')));
 const data={p:parse(r[0],'p'),u:parse(r[1],'u'),bij:Date.now()};
 // gevolgde teams van andere clubs; lukt dat niet, dan de vorige gegevens van die teams houden
 await Promise.all(EXTRA.map(async e=>{
  const pad='https://api.nevobo.nl/export/team/'+e.club+'/'+e.team+'/';
  let p,u;try{const x=await Promise.all([rss(pad+'programma.rss'),rss(pad+'resultaten.rss')]);p=parse(x[0],'p');u=parse(x[1],'u');}
  catch(err){p=D?D.p.filter(w=>w.team===e.naam):[];u=D?D.u.filter(w=>w.team===e.naam):[];}
  data.p.push(...p.filter(w=>w.team===e.naam));data.u.push(...u.filter(w=>w.team===e.naam));
 }));
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
 const eigen=(await allePaginas('/competitie/pouleindelingen?vereniging=/relatiebeheer/verenigingen/'+CLUB.toLowerCase()+'&seizoen=/seizoenen/'+seizoen()))
  .concat(...(await Promise.all(EXTRA.map(e=>allePaginas('/competitie/pouleindelingen?team='+teamPad(e)+'&seizoen=/seizoenen/'+seizoen()).catch(()=>[])))));
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
   if(!tabel[t]||i.bij>=tabel[t].bij)tabel[t]={poule:p,naam:i.naam,bij:i.bij,rij:l.map(m=>[m.positie,m.omschrijving,m.gespeeld,m.punten,m.setsVoor,m.setsTegen,m.puntenVoor,m.puntenTegen])};});});
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
 // bekerwedstrijden van onze teams herkennen: "tijdstip|team", bijv. "1794756600000|DS 3"
 const bekerP=Array.from(new Set(eigen.map(m=>m.poule))).filter(p=>/beker/i.test(p));
 const eigenId={};eigen.forEach(m=>{eigenId[m['@id']]=teamVan(m.omschrijving||'');});
 const bg=[];for(let i=0;i<bekerP.length;i+=8)bg.push(bekerP.slice(i,i+8));
 const bw=(await Promise.all(bg.map(g=>allePaginas('/competitie/wedstrijden?'+g.map(p=>'poule[]='+encodeURIComponent(p)).join('&')).catch(()=>[])))).flat();
 const beker=[];bw.forEach(w=>{const t=Date.parse(w.tijdstip||'');(w.teams||[]).forEach(id=>{if(eigenId[id]&&t)beker.push(t+'|'+eigenId[id]);});});
 // vorm van de tegenstanders: laatste 5 uitslagen in de poule van elk eigen team (W/G/V)
 const vorm={};
 try{
  const pp=Array.from(new Set(Object.keys(tabel).map(t=>tabel[t].poule)));
  const naamVan={};Object.keys(perPoule).forEach(p=>perPoule[p].forEach(m=>{naamVan[m['@id']]=m.omschrijving||'';}));
  const pg=[];for(let i=0;i<pp.length;i+=8)pg.push(pp.slice(i,i+8));
  const pw=(await Promise.all(pg.map(g=>allePaginas('/competitie/wedstrijden?status=gespeeld&'+g.map(p=>'poule[]='+encodeURIComponent(p)).join('&')).catch(()=>[])))).flat();
  const perT={};
  pw.forEach(w=>{const e=w.eindstand,t=w.teams||[];if(!e||t.length!==2||!w.tijdstip)return;
   [0,1].forEach(i=>{const n=sleutel(naamVan[t[i]]||'');if(!n)return;const a=e[i],b=e[1-i];
    (perT[w.poule+'|'+n]=perT[w.poule+'|'+n]||[]).push([Date.parse(w.tijdstip),a>b?'W':a<b?'V':'G']);});});
  Object.keys(tabel).forEach(t=>{const p=tabel[t].poule,v=vorm[t]={};
   Object.keys(perT).forEach(k=>{if(k.indexOf(p+'|')===0)v[k.slice(p.length+1)]=perT[k].sort((x,y)=>x[0]-y[0]).slice(-5).map(x=>x[1]).join('');});});
 }catch(e){}
 const data={r,tabel,beker,eigenId,vorm,bij:Date.now()};put(STK,data);return data;
}
const isBeker=w=>!!(S&&S.beker&&S.beker.indexOf(w.t+'|'+w.team)>=0);
const bekerTag=w=>isBeker(w)?'<em class="hm-beker">Beker</em>':'';
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
const naam=(s,w)=>(isX(s)?'<b>'+esc(s)+'</b>':isWb(s)?'<b>Woudenberg '+esc(teamVan(s))+'</b>':esc(s))+(w?rang(w,s):'');

// ---- live standen ----
// Tijdens een wedstrijd houdt de teller (DWF) de stand bij; de Nevobo zet die op .../live.
// Alleen als dat wordt bijgehouden is er iets te zien. Elke 20 seconden opnieuw opvragen.
let LIVE={},vandaag=null;
const liveKey=w=>w.t+'|'+w.team;
async function wedstrijdenVandaag(){
 const dk=dagKey(new Date());
 if(vandaag&&vandaag.dag===dk&&Date.now()-vandaag.bij<30*60e3)return vandaag.w;
 const dt='&datum[after]='+dk+'&datum[before]='+dk+'T23:59:59';
 const l=(await allePaginas('/competitie/wedstrijden?vereniging=/relatiebeheer/verenigingen/'+CLUB.toLowerCase()+dt))
  .concat(...(await Promise.all(EXTRA.map(e=>allePaginas('/competitie/wedstrijden?team='+teamPad(e)+dt).catch(()=>[])))));
 vandaag={dag:dk,bij:Date.now(),w:l.map(m=>({id:m['@id'],t:Date.parse(m.tijdstip||''),teams:m.teams||[]}))};return vandaag.w;
}
let liveBezig=false;
async function checkLive(){
 if(liveBezig||!D||document.hidden)return;
 const el=$('v_home');if(!el||!el.offsetParent)return;
 const nu=Date.now(),loopt=t=>t<=nu+5*60e3&&t>=nu-3*3600e3;
 let nieuw={};
 if(D.p.some(w=>loopt(w.t))&&S&&S.eigenId){
  liveBezig=true;
  try{
   const l=(await wedstrijdenVandaag()).filter(m=>loopt(m.t));
   await Promise.all(l.map(async m=>{
    const team=m.teams.map(id=>S.eigenId[id]).find(Boolean);if(!team)return;
    const r=await fetch(API+m.id+'/live',{cache:'no-cache'}).catch(()=>null);if(!r||r.status!==200)return;
    const d=await r.json().catch(()=>null);if(!d||!d.stand)return;
    nieuw[m.t+'|'+team]={stand:d.stand,sets:(d.sets||[]).filter(x=>x&&(x[0]||x[1]))};
   }));
  }catch(e){nieuw=LIVE;}
  finally{liveBezig=false;}
 }
 // wedstrijden waarvan de uitslag al binnen is, niet meer als live tonen
 Object.keys(nieuw).forEach(k=>{if(D.u.some(w=>liveKey(w)===k))delete nieuw[k];});
 if(JSON.stringify(nieuw)!==JSON.stringify(LIVE)){LIVE=nieuw;teken();}
}
function liveBlok(lijst){
 const l=lijst.filter(w=>LIVE[liveKey(w)]).sort((a,b)=>a.t-b.t);if(!l.length)return '';
 return '<section class="card hm-live"><h3><i class="hm-puls"></i>Nu live</h3>'+l.map(w=>{const v=LIVE[liveKey(w)],n=v.sets.length;
  return '<a class="hm-w" href="'+esc(w.url)+'" target="_blank" rel="noopener"><span class="hm-s hm-ls">'+v.stand[0]+'–'+v.stand[1]+'</span>'
   +'<span class="hm-m"><span class="hm-ts">'+naam(w.a,w)+' <i>–</i> '+naam(w.b,w)+'</span>'
   +'<span class="hm-z">'+bekerTag(w)+v.sets.map((x,i)=>i===n-1?'<b>'+x[0]+'-'+x[1]+'</b>':x[0]+'-'+x[1]).join(', ')+'</span></span></a>';}).join('')
  +'<p class="hm-uitleg">Live stand uit het digitale wedstrijdformulier, ververst elke 20 seconden.</p></section>';
}

function programma(lijst){
 const nu=Date.now()-2*3600e3,rest=lijst.filter(w=>w.t>=nu).sort((a,b)=>a.t-b.t);
 if(!rest.length)return '<p class="hm-leeg">Geen wedstrijden gepland.</p>';
 const toon=meerP?rest.slice(0,AANTAL*4):rest.slice(0,AANTAL);let h='',dk='';
 toon.forEach(w=>{const d=new Date(w.t),k=dagKey(d);
  if(k!==dk){dk=k;h+='<h4 class="hm-dag">'+esc(dag(d))+'</h4>';}
  const thuis=isThuis(w);
  h+='<a class="hm-w" href="'+esc(w.url)+'" target="_blank" rel="noopener"><span class="hm-t">'+esc(tijd(d))+'</span>'
   +'<span class="hm-m"><span class="hm-ts">'+naam(w.a,w)+' <i>–</i> '+naam(w.b,w)+'</span>'
   +'<span class="hm-z">'+(LIVE[liveKey(w)]?'<em class="hm-livetag">Live '+LIVE[liveKey(w)].stand.join('–')+'</em>':'')+bekerTag(w)+(thuis?'<em class="hm-thuis">Thuis</em>':'<em class="hm-uit">Uit</em>')+esc([w.zaal,w.plaats].filter(Boolean).join(', '))+'</span></span></a>';});
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
   +(w.sets||isBeker(w)?'<span class="hm-z">'+bekerTag(w)+esc(w.sets||'')+'</span>':'')+'</span></a>';});
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
  const wk=D.p.filter(w=>!mini(w.team)&&!extraTeam(w.team)&&w.t>=nu-2*3600e3&&w.t<nu+7*864e5);
  const thuis=wk.filter(isThuis).length;
  const vorig=D.u.filter(w=>!mini(w.team)&&!extraTeam(w.team)&&w.t>=nu-7*864e5&&uitkomst(w)),win=vorig.filter(w=>uitkomst(w)==='win').length;
  return '<div class="hm-stats">'+tegel(wk.length,'komende 7 dagen','wedstrijden de ')+tegel(thuis,'thuis','daarvan ')+tegel(win+'/'+vorig.length,'gewonnen',null).replace('</span>','<i> afgelopen week</i></span>')+'</div>'
   +'<p class="hm-uitleg">Zonder de mini’s. Kies een team voor de cijfers van het seizoen.</p>';
 }
// seizoen van één team
 return teamKaart(team);
}

// ---- statistieken per team ----
// Alles wordt bij elke weergave opnieuw berekend uit de uitslagen (D) en de stand (S): niets staat vast in de code.
const pct=(a,b)=>b?Math.round(100*a/b)+'%':'–';
const gem=(a,b)=>b?(Math.round(10*a/b)/10).toString().replace('.',','):'';
const sleutelNaam=w=>sleutel(isW(w.a)?w.b:w.a);
function setsVan(w){const own=isW(w.a);
 return (w.sets||'').split(',').map(x=>/(\d+)\s*-\s*(\d+)/.exec(x)).filter(Boolean).map(m=>own?[+m[1],+m[2]]:[+m[2],+m[1]]);}
function teamStats(team){
 if(!D)return null;
 const g=D.u.filter(w=>w.team===team&&uitkomst(w)&&!isBeker(w)).sort((a,b)=>a.t-b.t);if(!g.length)return null; // alleen competitie, geen beker
 const st={g,n:g.length,W:0,G:0,V:0,sv:0,st:0,pv:0,pt:0,aantalSets:0,vijf:0,vijfW:0,schoon:0,schoonV:0,eerstW:0,eerstWV:0,eerstV:0,eerstVW:0,metSets:0,eerstTel:0,tel:{},thuis:{n:0,W:0,pv:0,pt:0,s:0},uit:{n:0,W:0,pv:0,pt:0,s:0},maand:{}};
 let reeks=0,langst=0,lw=0;
 g.forEach(w=>{const own=isW(w.a),u=uitkomst(w),ons=own?w.sa:w.sb,zij=own?w.sb:w.sa,ss=setsVan(w),k=own?st.thuis:st.uit;
  if(u==='win')st.W++;else if(u==='gelijk')st.G++;else st.V++;
  st.sv+=ons;st.st+=zij;k.n++;if(u==='win')k.W++;
  if(u==='win'&&zij===0)st.schoon++;if(u==='verlies'&&ons===0)st.schoonV++;
  if(u==='win'){lw++;if(lw>langst)langst=lw;}else lw=0;
  if(ss.length){st.metSets++;st.aantalSets+=ss.length;
   ss.forEach(x=>{st.pv+=x[0];st.pt+=x[1];k.pv+=x[0];k.pt+=x[1];k.s++;const key=x[0]+'-'+x[1];st.tel[key]=(st.tel[key]||0)+1;});
   if(ss.length>=5){st.vijf++;if(u==='win')st.vijfW++;}
   st.eerstTel++;const e=ss[0];
   if(e[0]>e[1]){st.eerstW++;if(u==='verlies')st.eerstWV++;}else{st.eerstV++;if(u==='win')st.eerstVW++;}}
  const m=new Date(w.t).toLocaleDateString('sv-SE',TZ).slice(0,7),o=st.maand[m]=st.maand[m]||{n:0,W:0};o.n++;if(u==='win')o.W++;});
 st.langst=langst;
 // huidige reeks
 const l=g[g.length-1],lu=uitkomst(l);for(let i=g.length-1;i>=0&&uitkomst(g[i])===lu;i--)reeks++;
 st.reeks=reeks;st.reeksSoort=lu;
 const top=Object.keys(st.tel).sort((a,b)=>st.tel[b]-st.tel[a])[0];st.top=top&&st.tel[top]>=2?[top,st.tel[top]]:null;
 return st;
}
const bol=(u,t)=>'<i class="hm-v '+u+'"'+(t?' title="'+esc(t)+'"':'')+'>'+(u==='win'?'W':u==='gelijk'?'G':'V')+'</i>';
const bolL=x=>x.split('').map(c=>bol(c==='W'?'win':c==='V'?'verlies':'gelijk')).join('');
function volgende(team){
 return D.p.filter(w=>w.team===team&&w.t>=Date.now()-2*3600e3).sort((a,b)=>a.t-b.t)[0]||null;
}
function standRij(team,naam){
 const t=S&&S.tabel&&S.tabel[team];if(!t)return null;const n=sleutel(naam);
 return t.rij.find(r=>sleutel(r[1]||'')===n)||t.rij.find(r=>{const x=sleutel(r[1]||'');return x.endsWith(n)||n.endsWith(x);})||null;
}
function volgBlok(team){
 const v=volgende(team);if(!v)return '';
 const opp=isW(v.a)?v.b:v.a,p=plek(team,opp),thuis=isThuis(v),k=S&&S.vorm&&S.vorm[team],f=k&&(k[sleutel(opp)]||k[Object.keys(k).find(x=>x.endsWith(sleutel(opp))||sleutel(opp).endsWith(x))||'']);
 return '<div class="hm-next"><span class="hm-nl">Volgende</span><span class="hm-nt"><b>'+esc(dag(new Date(v.t)))+' '+esc(tijd(new Date(v.t)))+'</b> '+(thuis?'<em class="hm-thuis">Thuis</em>':'<em class="hm-uit">Uit</em>')+'</span>'
  +'<span class="hm-no">'+esc(opp)+(p?' <span class="hm-r" title="'+p[0]+'e van '+p[1]+'">#'+p[0]+'</span>':'')+'</span>'+(f?'<span class="hm-nf" title="Vorm tegenstander (laatste 5)">'+bolL(f)+'</span>':'')+'</div>';
}
const kv=(a,b,t)=>(b===''||b==null)?'':'<div class="hm-kv"'+(t?' title="'+esc(t)+'"':'')+'><span>'+a+'</span><b>'+b+'</b></div>';
const bar=(p,tekst)=>'<span class="hm-bar"><i style="width:'+p+'%"></i></span><b>'+tekst+'</b>';
let meerStat=false,statTab='sets';
const MAANDEN=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function statSectie(team,st){
 if(statTab==='sets'){
  if(!st.metSets)return '<p class="hm-leeg">Geen setstanden beschikbaar.</p>';
  return '<div class="hm-kvs">'
   +kv('Gewonnen sets',pct(st.sv,st.sv+st.st)+' <i>('+st.sv+'–'+st.st+')</i>')
   +kv('5-setters',st.vijf?st.vijf+' <i>('+st.vijfW+' gewonnen)</i>':'0')
   +kv('Punten per set','<i>gescoord/tegen</i> '+gem(st.pv,st.aantalSets)+' / '+gem(st.pt,st.aantalSets))
   +kv('Gem. verschil per set',(st.pv>=st.pt?'+':'−')+gem(Math.abs(st.pv-st.pt),st.aantalSets))
   +(st.top?kv('Vaakst voorkomende setstand',esc(st.top[0])+' <i>('+st.top[1]+'×)</i>'):'')
   +kv('Winst zonder setverlies',st.schoon)
   +kv('Verlies zonder setwinst',st.schoonV)
   +kv('Eerste set gewonnen, wedstrijd verloren',st.eerstWV+' <i>van '+st.eerstW+'</i>')
   +kv('Eerste set verloren, wedstrijd gewonnen',st.eerstVW+' <i>van '+st.eerstV+'</i>')
   +kv('Langste winstreeks',st.langst)
   +'</div>';
 }
 if(statTab==='thuis'){
  const r=(naam,k)=>k.n?'<div class="hm-th"><span>'+naam+'</span>'+bar(Math.round(100*k.W/k.n),pct(k.W,k.n)+' <i>('+k.W+'/'+k.n+')</i>')+(k.s?'<small>'+gem(k.pv,k.s)+' punten per set voor, '+gem(k.pt,k.s)+' tegen</small>':'')+'</div>':'';
  return r('Thuis gewonnen',st.thuis)+r('Uit gewonnen',st.uit)||'<p class="hm-leeg">Nog niets te laten zien.</p>';
 }
 if(statTab==='tegen'){
  const v=volgende(team);if(!v)return '<p class="hm-leeg">Geen volgende wedstrijd gepland.</p>';
  const opp=isW(v.a)?v.b:v.a,n=sleutel(opp),p=plek(team,opp),mijn=standRij(team,'woudenberg'+team),zij=standRij(team,opp);
  const eigen=S&&S.tabel&&S.tabel[team]&&S.tabel[team].rij.find(r=>isW(r[1]||'')&&teamVan(r[1])===team);
  const heen=D.u.filter(w=>w.team===team&&uitkomst(w)&&!isBeker(w)&&(sleutelNaam(w)===n||sleutelNaam(w).endsWith(n)||n.endsWith(sleutelNaam(w)))).sort((a,b)=>a.t-b.t)[0];
  const k=S&&S.vorm&&S.vorm[team],f=k&&(k[n]||k[Object.keys(k).find(x=>x.endsWith(n)||n.endsWith(x))||'']);
  const di=eigen&&zij?(eigen[3]-zij[3]):null;
  const ow=heen?(isW(heen.a)?[heen.sa,heen.sb]:[heen.sb,heen.sa]):null;
  return '<div class="hm-kvs"><div class="hm-kv hm-kv1"><span>Tegenstander</span><b>'+esc(opp)+'</b></div>'
   +kv('Plek in de competitie',p?'#'+p[0]+' <i>van '+p[1]+'</i>':'')
   +kv('Vorm (laatste 5)',f?'<span class="hm-nf">'+bolL(f)+'</span>':'')
   +kv('Heenronde',ow?(ow[0]>ow[1]?'gewonnen':ow[0]<ow[1]?'verloren':'gelijk')+' <i>'+ow[0]+'–'+ow[1]+(heen.sets?' ('+esc(heen.sets)+')':'')+'</i>':'')
   +kv('Punten in de stand',di==null?'':(di===0?'gelijk':Math.abs(di)+' punt'+(Math.abs(di)===1?'':'en')+(di>0?' voor':' achter'))+' <i>op de tegenstander</i>')
   +'</div>';
 }
 if(statTab==='verloop'){
  const ms=Object.keys(st.maand).sort();if(ms.length<2)return '<p class="hm-leeg">Nog te weinig maanden om een verloop te tonen.</p>';
  return '<p class="hm-uitleg">Percentage gewonnen wedstrijden per maand</p><div class="hm-grafiek">'+ms.map(m=>{const o=st.maand[m],p=Math.round(100*o.W/o.n);
   return '<div title="'+o.W+' van '+o.n+' gewonnen"><b>'+p+'%</b><span class="hm-st"><i style="height:'+Math.max(p,3)+'%"></i></span><em>'+MAANDEN[+m.slice(5)-1]+'</em><small>'+o.W+'/'+o.n+'</small></div>';}).join('')+'</div>';
 }
 // vergelijk met andere Woudenberg-teams
 const rij=teams().filter(t=>!mini(t)&&(!extraTeam(t)||t===team)).map(t=>[t,teamStats(t)]).filter(x=>x[1]);
 rij.sort((a,b)=>b[1].W/b[1].n-a[1].W/a[1].n||b[1].n-a[1].n);
 return '<p class="hm-uitleg">Percentage gewonnen wedstrijden dit seizoen, zonder de mini’s'+(extraTeam(team)?', met '+esc(team)+' ter vergelijking':'')+'</p><div class="hm-vgl">'
  +rij.map(x=>'<div'+(x[0]===team?' class="eigen"':'')+'><span>'+esc(x[0])+'</span>'+bar(Math.round(100*x[1].W/x[1].n),pct(x[1].W,x[1].n)+' <i>('+x[1].W+'/'+x[1].n+')</i>')+'</div>').join('')+'</div>';
}
function teamKaart(team){
 const st=teamStats(team),nu=Date.now();
 if(!st)return '<div class="hm-vorm"><span>Nog geen uitslagen dit seizoen</span></div>'+(D?volgBlok(team):'');
 const g=st.g.slice().reverse(),vorm=g.slice(0,5).reverse().map(w=>bol(uitkomst(w),w.a+' – '+w.b+': '+w.sa+'-'+w.sb)).join('');
 const rs=st.reeks>=2?st.reeks+(st.reeksSoort==='win'?' gewonnen':st.reeksSoort==='verlies'?' verloren':' gelijk')+' op rij':'';
 const tabs=[['sets','Sets & punten'],['thuis','Thuis & uit'],['tegen','Tegenstander'],['verloop','Verloop'],['teams','Teams']];
 return '<div class="hm-stats hm-team">'+tegel(st.n,'gespeeld')+tegel(st.W,'gewonnen')+(st.G?tegel(st.G,'gelijk'):'')+tegel(st.V,'verloren')+tegel(st.sv+'–'+st.st,'sets')+(st.metSets?tegel(st.vijf,'5-setters'):'')+'</div>'
  +'<div class="hm-vorm"><span>Laatste '+Math.min(5,st.n)+'</span>'+vorm+(rs?'<span class="hm-reeks">'+rs+'</span>':'')+'</div>'
  +volgBlok(team)
  +'<button type="button" class="hm-meerstat" aria-expanded="'+meerStat+'">'+(meerStat?'Minder statistieken':'Meer statistieken')+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
  +(meerStat?'<section class="card hm-ms"><div class="hm-stab" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" data-s="'+t[0]+'" aria-selected="'+(statTab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'+statSectie(team,st)+'</section>':'');
}

function teken(){
 const el=$('v_home');if(!el)return;
 const team=get(TEAMK,''),f=l=>team?l.filter(w=>w.team===team):l.filter(w=>!extraTeam(w.team)),ts=teams();
 const o=t=>'<option'+(t===team?' selected':'')+'>'+esc(t)+'</option>',ex=ts.filter(extraTeam);
 const opt='<option value="">Alle teams</option>'+ts.filter(t=>!extraTeam(t)).map(o).join('')+(ex.length?'<optgroup label="Andere clubs">'+ex.map(o).join('')+'</optgroup>':'');
 const bij=D?'Bijgewerkt '+new Date(D.bij).toLocaleString('nl-NL',{...TZ,weekday:'short',hour:'2-digit',minute:'2-digit'}):'';
 el.innerHTML='<section class="hm-welkom"><h2>'+esc(WELKOM_TITEL)+'</h2><p class="hm-lang">'+esc(WELKOM_TEKST)+'</p><p class="hm-kort">'+esc(WELKOM_KORT)+'</p>'
  +'<div class="hm-snel"><button type="button" data-v="gen">Training mini’s</button><button type="button" data-v="sen">Training jeugd &amp; senioren</button>'
  +'<button type="button" data-v="rot">5-1 rotaties</button><button type="button" data-v="def">Verdediging</button><button type="button" data-v="aanval">Aanval</button></div></section>'
  +'<div class="hm-kop"><label for="hm_team">Team</label><select id="hm_team">'+opt+'</select><button type="button" id="hm_ver" class="hm-ver" aria-label="Vernieuwen" title="Vernieuwen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg><span>Vernieuwen</span></button></div>'
  +weekStat(team)
  +(D?liveBlok(f(D.p)):'')
  +'<div class="hm-seg" role="tablist"><button type="button" role="tab" data-t="p" aria-selected="'+(tab==='p')+'">Programma</button><button type="button" role="tab" data-t="u" aria-selected="'+(tab==='u')+'">Uitslagen</button></div>'
  +'<div class="hm-cols" data-tab="'+tab+'"><section class="card hm-lijst hm-p"><h3>Programma</h3>'+(D?programma(f(D.p)):'<p class="hm-leeg">Wedstrijden laden…</p>')+'</section>'
  +'<section class="card hm-lijst hm-u"><h3>Uitslagen</h3>'+(D?uitslagen(f(D.u)):'<p class="hm-leeg">Uitslagen laden…</p>')+'</section></div>'
  +stand(team)
  +'<p class="note hm-bron">'+((fout||bij)?esc(fout||bij)+'. ':'')+(S?'#3 = huidige plek in de competitiestand. ':'')+'Wedstrijdgegevens: Nevobo (volleybal.nl). Tik op een wedstrijd voor alle details. Meer over de club op <a href="https://www.volleybalwoudenberg.nl" target="_blank" rel="noopener">volleybalwoudenberg.nl</a>.</p>';
 el.querySelectorAll('.hm-snel button').forEach(b=>b.onclick=()=>{setView(b.dataset.v);window.scrollTo(0,0);});
 $('hm_team').onchange=e=>{put(TEAMK,e.target.value);meerP=meerU=false;teken();};
 $('hm_ver').onclick=ververs;
 el.querySelectorAll('.hm-meerstat').forEach(b=>b.onclick=()=>{meerStat=!meerStat;teken();});
 el.querySelectorAll('.hm-stab button').forEach(b=>b.onclick=()=>{statTab=b.dataset.s;teken();});
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

D=get(LSK,null);S=get(STK,null);teken();ververs().then(checkLive);
setInterval(checkLive,20000);
// uitslagen elke 5 minuten opnieuw ophalen zolang de homepagina open staat; de statistieken worden daarna vanzelf opnieuw berekend
let stilBezig=false;
async function stil(){
 const el=$('v_home');if(stilBezig||bezig||document.hidden||!el||!el.offsetParent||!D||Date.now()-D.bij<5*60e3-5000)return;
 stilBezig=true;try{D=await laad();fout='';teken();}catch(e){}finally{stilBezig=false;}
}
setInterval(stil,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkLive();stil();}});
// zonder gedeelde training in de link start de app op de homepagina
if(!location.hash.slice(1)&&typeof setView==='function')setView('home');
})();
