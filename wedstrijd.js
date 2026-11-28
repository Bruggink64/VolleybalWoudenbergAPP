// Wedstrijdpagina (november 2026): tik op een wedstrijd in het programma en je ziet
// - waar het is: sporthal, adres, kaartje (OpenStreetMap), knoppen Route, Zet in agenda en Delen
// - een prognose: winstkans en verwachte uitslag, met per uitslag de plek in de stand daarna
// - onderling: beide teams naast elkaar, eerdere duels dit seizoen en uitslagen tegen dezelfde tegenstanders
// - tijdens de wedstrijd: de live stand en het puntenverloop
// Alles komt uit de openbare JSON-API van de Nevobo (geen account, geen kosten). Gegevens van home.js via window.HM.
(function(){
const H=window.HM;if(!H)return;
const esc=H.esc;
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const json=u=>fetch(H.API+u,{headers:{Accept:'application/ld+json'}}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});
const HALK='vvw_sporthallen_v1';           // sporthallen (adres en plek op de kaart) bewaard in de browser
const THUISHAL='/accommodatie/sporthallen/de-camp';

// ---- gegevens ophalen ----
const cache={};let dlg=null,cur=null;
async function hal(id){
 const l=get(HALK,{});if(l[id])return l[id];
 const d=await json(id),a=d.adres||{};
 const h={naam:d.naam||'',straat:[a.straat,a.huisnummer,a.toevoeging].filter(x=>x!=null&&x!=='').join(' '),pc:(a.postcode||'').replace(/^(\d{4})\s?([A-Z]{2})$/,'$1 $2'),
  plaats:a.plaats||d.plaats||'',lat:+a.breedtegraad||null,lon:+a.lengtegraad||null,tel:d.telefoon||''};
 l[id]=h;put(HALK,l);return h;
}
async function laad(c){
 c.bezig=true;const w=c.w;
 try{
  const dk=H.dagKey(new Date(w.t)),dt='&datum[after]='+dk+'&datum[before]='+dk+'T23:59:59',ex=H.EXTRA.find(e=>e.naam===w.team);
  const l=await H.allePaginas(ex?'/competitie/wedstrijden?team='+H.teamPad(ex)+dt:'/competitie/wedstrijden?vereniging=/relatiebeheer/verenigingen/'+H.CLUB.toLowerCase()+dt);
  const op=l.filter(m=>Date.parse(m.tijdstip||'')===w.t),S=H.S;
  c.m=op.find(m=>S&&S.eigenId&&(m.teams||[]).some(id=>S.eigenId[id]===w.team))||(op.length===1?op[0]:null);
 }catch(e){}
 const m=c.m;
 await Promise.all([
  (async()=>{if(m&&m.sporthal)try{c.hal=await hal(m.sporthal);}catch(e){}})(),
  (async()=>{try{c.camp=await hal(THUISHAL);}catch(e){}})(),
  (async()=>{
   const S=H.S,p=(m&&m.poule)||(S&&S.tabel&&S.tabel[w.team]&&S.tabel[w.team].poule);
   if(!p||/beker/i.test(p)||H.mini(w.team))return;
   try{const q='poule[]='+encodeURIComponent(p);
    const r=await Promise.all([H.allePaginas('/competitie/pouleindelingen?'+q),H.allePaginas('/competitie/wedstrijden?'+q)]);
    c.poule={id:p,leden:r[0],wed:r[1]};}catch(e){c.pouleFout=true;}
  })()
 ]);
 c.bezig=false;c.klaar=true;teken();
}

// ---- prognose ----
// Per team: aandeel gewonnen ballen dit seizoen (punten voor / alle punten), iets naar 50% getrokken bij weinig wedstrijden.
// Daaruit de kans per bal (log5), per set (tot 25, of 15 in de vijfde set, twee punten verschil) en per uitslag.
const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};
function setKans(q,n){
 let p=0;for(let k=0;k<=n-2;k++)p+=C(n-1+k,k)*Math.pow(q,n)*Math.pow(1-q,k);
 return p+C(2*n-2,n-1)*Math.pow(q*(1-q),n-1)*q*q/(q*q+(1-q)*(1-q));
}
// vorm: 'vier' = altijd 4 sets, 'min4' = tot 3 gewonnen sets maar minstens 4 sets (bij 3-0 nog een vierde), 'bo5' = tot 3 gewonnen sets
function uitslagKansen(ps,p5,vorm){
 const out={};
 (function r(a,b,pr){const n=a+b;
  const klaar=vorm==='vier'?n===4:vorm==='min4'?(n>=4&&(a>=3||b>=3)):(a===3||b===3);
  if(klaar){out[a+'-'+b]=(out[a+'-'+b]||0)+pr;return;}
  const p=(n===4&&vorm!=='vier')?p5:ps;r(a+1,b,pr*p);r(a,b+1,pr*(1-p));})(0,0,1);
 return out;
}
// puntentelling van de poule afleiden uit de stand: welke telling past bij de meeste teams?
const TELLING={
 regio:u=>({'4-0':5,'3-0':5,'3-1':4,'3-2':3,'2-3':2,'1-3':1,'0-3':0,'0-4':0,'2-2':2})[u],
 nationaal:u=>({'4-0':3,'3-0':3,'3-1':3,'3-2':2,'2-3':1,'1-3':0,'0-3':0,'0-4':0,'2-2':1})[u],
 sets:u=>+u.split('-')[0]
};
function analyse(c){
 const P=c.poule;if(!P)return null;const w=c.w,S=H.S;
 const T={};P.leden.forEach(m=>{T[m['@id']]={id:m['@id'],naam:m.omschrijving||'',pos:m.positie||99,g:m.gespeeld||0,p:m.punten||0,sv:m.setsVoor||0,st:m.setsTegen||0,bv:0,bt:0,bv0:m.puntenVoor||0,bt0:m.puntenTegen||0,W:0,V:0,G:0,res:[]};});
 // eigen team en tegenstander
 let wij=null,zij=null;
 if(c.m&&(c.m.teams||[]).length===2){const t=c.m.teams;const i=t.findIndex(id=>(S&&S.eigenId&&S.eigenId[id]===w.team)||(T[id]&&H.isW(T[id].naam)&&H.teamVan(T[id].naam)===w.team));if(i>=0){wij=T[t[i]];zij=T[t[1-i]];}}
 if(!wij){const ids=Object.keys(T);wij=T[ids.find(id=>H.isW(T[id].naam)&&H.teamVan(T[id].naam)===w.team)];
  const opp=H.sleutel(H.isW(w.a)&&H.teamVan(w.a)===w.team?w.b:w.a);zij=T[ids.find(id=>{const n=H.sleutel(T[id].naam);return n===opp||n.endsWith(opp)||opp.endsWith(n);})];}
 if(!wij||!zij)return null;
 const gesp=P.wed.filter(m=>Array.isArray(m.eindstand)&&(m.teams||[]).length===2&&T[m.teams[0]]&&T[m.teams[1]]).sort((a,b)=>Date.parse(a.tijdstip)-Date.parse(b.tijdstip));
 gesp.forEach(m=>{const e=m.eindstand,ss=(m.setstanden||[]).slice().sort((a,b)=>a.set-b.set);
  [0,1].forEach(i=>{const t=T[m.teams[i]],a=e[i],b=e[1-i],u=a>b?'W':a<b?'V':'G';t[u]++;
   ss.forEach(s=>{t.bv+=i?s.puntenB:s.puntenA;t.bt+=i?s.puntenA:s.puntenB;});
   t.res.push({m,teg:m.teams[1-i],a,b,u,sets:ss.map(s=>i?s.puntenB+'-'+s.puntenA:s.puntenA+'-'+s.puntenB),t:Date.parse(m.tijdstip)});});});
 const teams=Object.values(T);
 teams.forEach(t=>{if(!(t.bv+t.bt)){t.bv=t.bv0;t.bt=t.bt0;}});
 // vorm van de wedstrijd
 const es=gesp.map(m=>m.eindstand.join('-'));
 const vorm=es.includes('2-2')?'vier':es.some(x=>x==='4-0'||x==='0-4')?'min4':es.some(x=>x==='3-0'||x==='0-3')?'bo5':/nationale/.test(P.id)?'bo5':'min4';
 // puntentelling
 let telling=null,best=0;
 Object.keys(TELLING).forEach(k=>{const f=TELLING[k];let ok=0;
  teams.forEach(t=>{const s=t.res.reduce((x,r)=>x+(f(r.a+'-'+r.b)||0),0);if(t.res.length&&s===t.p)ok++;});
  if(ok>best){best=ok;telling=k;}});
 if(best<Math.max(1,Math.ceil(teams.filter(t=>t.res.length).length/2)))telling=null;
 // prognose
 let prog=null;
 if(wij.res.length&&zij.res.length&&wij.bv+wij.bt>0&&zij.bv+zij.bt>0){
  const rho=t=>(t.bv+150)/(t.bv+t.bt+300),ra=rho(wij),rb=rho(zij);
  let q=ra*(1-rb)/(ra*(1-rb)+rb*(1-ra));
  q=.5+(q-.5)*.8; // iets voorzichtiger: teams hebben goede en slechte dagen
  q+=H.isThuis(w)?0.008:-0.008;q=Math.min(.95,Math.max(.05,q));
  const k=uitslagKansen(setKans(q,25),setKans(q,15),vorm);
  const lijst=Object.keys(k).map(u=>{const [a,b]=u.split('-').map(Number);return {u,a,b,kans:k[u]};}).sort((x,y)=>(y.a-y.b)-(x.a-x.b));
  const winst=lijst.filter(x=>x.a>x.b).reduce((s,x)=>s+x.kans,0),gelijk=lijst.filter(x=>x.a===x.b).reduce((s,x)=>s+x.kans,0);
  const top=lijst.slice().sort((x,y)=>y.kans-x.kans)[0];
  // plek in de stand na elke uitslag (andere teams gelijk; bij gelijke punten blijft de huidige volgorde)
  if(telling){const f=TELLING[telling];
   lijst.forEach(x=>{const pt=t=>t===wij?t.p+f(x.a+'-'+x.b):t===zij?t.p+f(x.b+'-'+x.a):t.p;
    const r=teams.slice().sort((s,t)=>pt(t)-pt(s)||s.pos-t.pos);x.plek=r.indexOf(wij)+1;x.punten=pt(wij);});}
  prog={winst,gelijk,top,lijst,weinig:wij.res.length<3||zij.res.length<3};
 }
 // eerdere duels en dezelfde tegenstanders
 const duels=wij.res.filter(r=>r.teg===zij.id);
 const samen=teams.filter(t=>t!==wij&&t!==zij).map(t=>({t,wij:wij.res.filter(r=>r.teg===t.id),zij:zij.res.filter(r=>r.teg===t.id)})).filter(x=>x.wij.length&&x.zij.length);
 return {T,wij,zij,prog,duels,samen,telling,vorm,aantal:teams.length};
}

// ---- weergave ----
const pct=x=>x>.995?'>99%':x>0&&x<.005?'<1%':Math.round(100*x)+'%';
const km=(a,b)=>{if(!a||!b||!a.lat||!b.lat)return null;const r=Math.PI/180,d=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;return 12742*Math.asin(Math.sqrt(d));};
const kort=s=>H.isWb(s)?'Woudenberg '+H.teamVan(s):H.isX(s)?H.teamVan(s):String(s);
const chip=r=>'<i class="wd-c '+(r.u==='W'?'win':r.u==='V'?'verlies':'gelijk')+'" title="'+esc(r.sets.join(', '))+'">'+r.a+'-'+r.b+'</i>';
const vormL=t=>t.res.slice(-5).map(r=>r.u).join('');
function adresVan(c){
 const h=c.hal;if(h)return {naam:h.naam,regel:[h.straat,[h.pc,h.plaats].filter(Boolean).join(' ')].filter(Boolean).join(', '),h};
 const w=c.w,d=(w.adres||'').split(',').map(x=>x.trim()).filter(Boolean);
 return {naam:w.zaal||d[0]||'',regel:d.slice(1).join(', ')||w.plaats||'',h:null};
}
function titel(w){return kort(w.a)+' – '+kort(w.b);}
function routeUrl(c){const a=adresVan(c);return a.h&&a.h.lat?'https://www.google.com/maps/dir/?api=1&destination='+a.h.lat+','+a.h.lon:'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent([a.naam,a.regel].filter(Boolean).join(', '));}

function locatie(c){
 const a=adresVan(c),w=c.w,h=a.h,thuis=H.isThuis(w);
 if(!a.naam&&!a.regel)return '<section class="wd-s"><h3>Locatie</h3><p class="wd-noot">'+(c.klaar?'Geen speellocatie bekend.':'Laden…')+'</p></section>';
 const afst=!thuis&&km(c.camp,h);
 let s='<section class="wd-s"><h3>Locatie</h3><p class="wd-hal"><b>'+esc(a.naam)+'</b>'+(a.regel?'<br>'+esc(a.regel):'')+'</p>';
 if(h&&h.tel)s+='<p class="wd-noot"><a href="tel:'+esc(h.tel.replace(/[^+\d]/g,''))+'">'+esc(h.tel.replace(/^\+31/,'0'))+'</a></p>';
 if(afst)s+='<p class="wd-noot">Hemelsbreed '+Math.round(afst)+' km vanaf De Camp.</p>';
 if(h&&h.lat){const d=.006,bb=[h.lon-d*1.6,h.lat-d,h.lon+d*1.6,h.lat+d].map(x=>x.toFixed(5)).join(',');
  s+='<div class="wd-kaart"><iframe title="Kaart van '+esc(a.naam)+'" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox='+bb+'&amp;layer=mapnik&amp;marker='+h.lat+','+h.lon+'"></iframe></div>';}
 s+='<div class="wd-knop"><a class="wd-b1" href="'+esc(routeUrl(c))+'" target="_blank" rel="noopener">Route</a><button type="button" data-wd="agenda">Zet in agenda</button><button type="button" data-wd="deel">Delen</button></div></section>';
 return s;
}
function live(c){
 const k=H.liveKey(c.w),v=H.LIVE[k];if(!v)return '';
 return '<section class="wd-s wd-live"><h3><i class="hm-puls"></i>Nu live <b>'+v.stand[0]+'–'+v.stand[1]+'</b></h3>'
  +'<div class="hm-sets">'+v.sets.map((x,i)=>'<span class="hm-set'+(i===v.sets.length-1?' nu':'')+'"><small>Set '+(i+1)+'</small>'+x[0]+'-'+x[1]+'</span>').join('')+'</div>'
  +H.verloopBlok(c.w,v.v,k)+'</section>';
}
function prognose(c,A){
 const w=c.w;
 if(H.mini(w.team))return '';
 if(H.isBeker(w))return '<section class="wd-s"><h3>Prognose</h3><p class="wd-noot">Bij bekerwedstrijden is er geen gezamenlijke stand, dus geen prognose.</p></section>';
 if(!c.klaar)return '<section class="wd-s"><h3>Prognose</h3><p class="wd-noot">Laden…</p></section>';
 if(!A||!A.prog)return '<section class="wd-s"><h3>Prognose</h3><p class="wd-noot">'+(c.pouleFout?'De stand kon niet worden geladen.':'Nog te weinig gespeeld voor een prognose.')+'</p></section>';
 const p=A.prog,wij=esc(kort(A.wij.naam)),zij=esc(kort(A.zij.naam)),verlies=1-p.winst-p.gelijk;
 let s='<section class="wd-s"><h3>Prognose</h3>'
  +'<div class="wd-kans"><span style="width:'+(100*p.winst).toFixed(1)+'%" class="w"></span>'+(p.gelijk>.005?'<span style="width:'+(100*p.gelijk).toFixed(1)+'%" class="g"></span>':'')+'<span style="width:'+(100*verlies).toFixed(1)+'%" class="z"></span></div>'
  +'<div class="wd-kl"><span><b>'+pct(p.winst)+'</b> '+wij+'</span>'+(p.gelijk>.005?'<span>'+pct(p.gelijk)+' gelijk</span>':'')+'<span>'+zij+' <b>'+pct(verlies)+'</b></span></div>'
  +'<p class="wd-verw">Meest waarschijnlijke uitslag: <b>'+p.top.a+'-'+p.top.b+'</b> <i>('+pct(p.top.kans)+')</i></p>'
  +'<table class="wd-tab"><thead><tr><th>Uitslag</th><th>Kans</th>'+(p.lijst[0].plek?'<th>Plek daarna</th>':'')+'</tr></thead><tbody>'
  +p.lijst.map(x=>'<tr'+(x===p.top?' class="top"':'')+'><td><b>'+x.a+'-'+x.b+'</b></td><td><span class="wd-mini"><i style="width:'+Math.max(2,Math.round(100*x.kans))+'%" class="'+(x.a>x.b?'w':x.a<x.b?'z':'g')+'"></i></span>'+pct(x.kans)+'</td>'
   +(x.plek?'<td>#'+x.plek+(x.plek<A.wij.pos?' <em class="op">▲</em>':x.plek>A.wij.pos?' <em class="neer">▼</em>':'')+' <i>'+x.punten+' pnt</i></td>':'')+'</tr>').join('')
  +'</tbody></table>'
  +'<p class="wd-noot">Een schatting op basis van de gescoorde ballen van beide teams dit seizoen, met een klein thuisvoordeel.'+(p.weinig?' Er zijn nog weinig wedstrijden gespeeld, dus de schatting is grof.':'')+(p.lijst[0].plek?' Plek daarna: als de andere teams niet spelen; bij gelijke punten blijft de huidige volgorde.':'')+'</p></section>';
 return s;
}
function spel(A){
 if(!A)return '';const wij=A.wij,zij=A.zij,ws=esc(kort(wij.naam)),zs=esc(kort(zij.naam));
 const T=Object.values(A.T).sort((a,b)=>a.pos-b.pos),boven=T.find(t=>t.pos===wij.pos-1),onder=T.find(t=>t.pos===wij.pos+1);
 const verschil=zij.p-wij.p,regels=[];
 regels.push(ws+' staat <b>#'+wij.pos+'</b> met '+wij.p+' punten, '+zs+' <b>#'+zij.pos+'</b> met '+zij.p+' punten'+(verschil?' ('+Math.abs(verschil)+' punt'+(Math.abs(verschil)===1?'':'en')+(verschil>0?' meer':' minder')+')':', evenveel')+'.');
 if(boven&&boven!==zij)regels.push('Op '+esc(kort(boven.naam))+' (#'+boven.pos+') is de achterstand '+(boven.p-wij.p)+' punt'+(boven.p-wij.p===1?'':'en')+'.');
 if(onder&&onder!==zij)regels.push(esc(kort(onder.naam))+' (#'+onder.pos+') staat '+(wij.p-onder.p)+' punt'+(wij.p-onder.p===1?'':'en')+' achter '+ws+'.');
 return '<section class="wd-s"><h3>Wat staat er op het spel</h3>'+regels.map(r=>'<p>'+r+'</p>').join('')+'</section>';
}
function onderling(c,A){
 if(!A)return '';const wij=A.wij,zij=A.zij;
 const rij=(n,a,b)=>'<tr><td>'+esc(a)+'</td><th>'+n+'</th><td>'+esc(b)+'</td></tr>';
 const bal=t=>t.bv+t.bt?pct(t.bv/(t.bv+t.bt)):'–';
 let s='<section class="wd-s"><h3>Onderling</h3><table class="wd-vgl"><thead><tr><td>'+esc(kort(wij.naam))+'</td><th></th><td>'+esc(kort(zij.naam))+'</td></tr></thead><tbody>'
  +rij('Plek','#'+wij.pos,'#'+zij.pos)+rij('Punten',wij.p,zij.p)+rij('Gespeeld',wij.res.length,zij.res.length)
  +rij('Gewonnen–verloren',wij.W+'–'+wij.V+(wij.G?' ('+wij.G+' gelijk)':''),zij.W+'–'+zij.V+(zij.G?' ('+zij.G+' gelijk)':''))
  +rij('Sets',wij.sv+'–'+wij.st,zij.sv+'–'+zij.st)+rij('Ballen gewonnen',bal(wij),bal(zij))
  +'<tr><td>'+H.bolL(vormL(wij))+'</td><th>Vorm</th><td>'+H.bolL(vormL(zij))+'</td></tr>'
  +'</tbody></table>';
 if(A.duels.length)s+='<h4>Eerder dit seizoen</h4>'+A.duels.map(r=>'<p class="wd-duel">'+chip(r)+' <span>'+esc(new Date(r.t).toLocaleDateString('nl-NL',{timeZone:'Europe/Amsterdam',day:'numeric',month:'short'}))+' · '+esc(r.sets.join(', '))+'</span></p>').join('');
 else s+='<p class="wd-noot">Dit seizoen nog niet tegen elkaar gespeeld.</p>';
 if(A.samen.length)s+='<h4>Tegen dezelfde tegenstanders</h4><table class="wd-samen"><thead><tr><th></th><th>'+esc(kort(wij.naam))+'</th><th>'+esc(kort(zij.naam))+'</th></tr></thead><tbody>'
  +A.samen.sort((a,b)=>a.t.pos-b.t.pos).map(x=>'<tr><td>'+esc(kort(x.t.naam))+' <span class="hm-r">#'+x.t.pos+'</span></td><td>'+x.wij.map(chip).join(' ')+'</td><td>'+x.zij.map(chip).join(' ')+'</td></tr>').join('')
  +'</tbody></table>';
 return s+'</section>';
}
function teken(){
 if(!dlg||!cur)return;const c=cur,w=c.w,d=new Date(w.t),A=analyse(c),thuis=H.isThuis(w);
 const sc=dlg.querySelector('.wd-in'),top=sc?sc.scrollTop:0;
 dlg.innerHTML='<div class="wd-kop"><div><span class="wd-dag">'+esc(H.dag(d))+' · '+esc(H.tijd(d))+'</span>'
  +'<h2>'+H.naam(w.a,w)+' <i>–</i> '+H.naam(w.b,w)+'</h2>'
  +'<span class="hm-z">'+H.bekerTag(w)+(thuis?'<em class="hm-thuis">Thuis</em>':'<em class="hm-uit">Uit</em>')+(A&&A.T&&H.S&&H.S.tabel&&H.S.tabel[w.team]&&H.S.tabel[w.team].naam?esc(H.S.tabel[w.team].naam):'')+'</span></div>'
  +'<button type="button" class="wd-x" data-wd="dicht" aria-label="Sluiten">Sluiten</button></div>'
  +'<div class="wd-in"><div class="wd-livebox">'+live(c)+'</div>'+locatie(c)+prognose(c,A)+spel(A)+onderling(c,A)
  +(c.klaar&&!c.m?'<p class="wd-noot">Niet alle gegevens van deze wedstrijd konden worden gevonden.</p>':'')
  +'<p class="wd-noot wd-bron">Gegevens: Nevobo. <a href="'+esc(w.url)+'" target="_blank" rel="noopener">Bekijk op volleybal.nl</a></p></div>';
 const ni=dlg.querySelector('.wd-in');if(ni)ni.scrollTop=top;
 dlg.querySelectorAll('[data-wd]').forEach(b=>b.onclick=()=>{const a=b.dataset.wd;if(a==='dicht')dlg.close();else if(a==='agenda')agenda(c);else if(a==='deel')deel(c,b);});
}

// ---- agenda en delen ----
function agenda(c){
 const w=c.w,a=adresVan(c),f=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''),ie=s=>String(s).replace(/[\\;,]/g,x=>'\\'+x).replace(/\n/g,'\\n');
 const lijn=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//VV Woudenberg//Trainersapp//NL','BEGIN:VEVENT','UID:'+w.t+'-'+H.sleutel(w.team)+'@vvwoudenberg-app','DTSTAMP:'+f(Date.now()),
  'DTSTART:'+f(w.t),'DTEND:'+f(w.t+((c.m&&c.m.lengte)||120)*60e3),'SUMMARY:'+ie('Volleybal: '+titel(w)),'LOCATION:'+ie([a.naam,a.regel].filter(Boolean).join(', ')),
  'DESCRIPTION:'+ie('Route: '+routeUrl(c)+'\nWedstrijd: '+w.url),'END:VEVENT','END:VCALENDAR'];
 const u=URL.createObjectURL(new Blob([lijn.join('\r\n')],{type:'text/calendar'})),l=document.createElement('a');
 l.href=u;l.download='wedstrijd-'+H.sleutel(w.team)+'-'+H.dagKey(new Date(w.t))+'.ics';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);
}
function deel(c,b){
 const w=c.w,a=adresVan(c),d=new Date(w.t);
 const tekst=titel(w)+'\n'+H.dag(d)+' om '+H.tijd(d)+'\n'+[a.naam,a.regel].filter(Boolean).join(', ')+'\nRoute: '+routeUrl(c);
 if(navigator.share){navigator.share({title:titel(w),text:tekst}).catch(()=>{});return;}
 window.open('https://wa.me/?text='+encodeURIComponent(tekst),'_blank','noopener');
}

function open(w){
 if(!dlg){dlg=document.createElement('dialog');dlg.className='wd noprint';dlg.setAttribute('aria-label','Wedstrijd');document.body.appendChild(dlg);
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});dlg.addEventListener('close',()=>{cur=null;dlg.innerHTML='';});}
 const k=H.liveKey(w);cur=cache[k]||(cache[k]={w});cur.w=w;
 // na 10 minuten opnieuw ophalen (stand kan veranderd zijn)
 if(cur.klaar&&Date.now()-(cur.bij||0)>10*60e3){cur.klaar=false;}
 teken();if(!dlg.open){if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');}
 const i=dlg.querySelector('.wd-in');if(i)i.scrollTop=0;
 if(!cur.klaar&&!cur.bezig){cur.bij=Date.now();laad(cur);}
}
window.VVW_WED={open,ververs:()=>{const b=dlg&&dlg.open&&cur&&dlg.querySelector('.wd-livebox');if(b)b.innerHTML=live(cur);},_analyse:analyse,_uitslagKansen:uitslagKansen,_setKans:setKans};
})();
