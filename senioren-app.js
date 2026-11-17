// Jeugd & Senioren: trainingsgenerator voor 90 minuten op 1 veld (6 tegen 6).
// Gebruikt $, esc, toast en LS uit index.html. Oefeningen staan in senioren.js (window.SEN).
(function(){
const SEN=window.SEN||[];
const THEMA={warming:'Warming-up',inspelen:'Inspelen',sideout:'5-1 side-out',service:'Service en pass',aanval:'Aanval',blok:'Blok en blokverdediging',verdediging:'Veldverdediging',transitie:'Transitie'};
const BLOK=['wu','insp','tech','spel','zes','eind'];
const BNAAM=['Warming-up','Inspelen','Techniek','Spelsituatie','6 tegen 6 op het thema','Eindspel'];
const BLEN=[10,10,20,20,20,10];
const T={th:['all','all','all','all','all','all'],n:12,slots:[],pins:new Set(),built:false};
const NMIN=4,NMAX=12;
const byId=new Map(SEN.map(d=>[d.id,d]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];

// Oefeningen voor blok b: eerst passend bij thema en spelersaantal, anders ruimer
function pool(b){
 const all=SEN.filter(d=>d.blok===BLOK[b]),th=T.th[b];
 const okN=all.filter(d=>d.need<=T.n),okT=d=>th==='all'||d.thema.includes(th);
 const best=okN.filter(okT);if(best.length)return best;
 const t=all.filter(okT);if(t.length)return t;
 return okN.length?okN:all;
}
function fill(b,used,keep){
 const items=keep.slice();let sum=items.reduce((a,d)=>a+d.min,0);
 let p=pool(b).filter(d=>!used.has(d.id));
 while(p.length&&sum<BLEN[b]-2&&items.length<3){const d=rnd(p);items.push(d);used.add(d.id);sum+=d.min;p=p.filter(x=>x!==d);}
 return items;
}
function gen(){
 const u=new Set(),keep=BLOK.map((_,b)=>(T.slots[b]||[]).filter(d=>T.pins.has(d.id)));
 T.pins=new Set(keep.flat().map(d=>d.id));keep.flat().forEach(d=>u.add(d.id));
 T.slots=BLOK.map((_,b)=>fill(b,u,keep[b]));render();
}
// Hoe de spelers verdeeld worden: in de oefening, dubbel (2 groepen) of in de rij
const team=d=>d.blok==='zes'||d.blok==='eind';
function verdeling(d){
 const n=T.n;
 if(team(d)){const a=Math.ceil(n/2);return{team:true,a,b:n-a,rij:0,groepen:1,in:n,kort:0};}
 const k=d.need;
 if(n<k)return{in:n,rij:0,groepen:1,kort:k-n};
 const tr=d.p.some(p=>p[1]==='#2dd4bf'),vrij=d.blok==='wu'||d.blok==='insp';
 // warming-up en inspelen: alle groepjes tegelijk; andere blokken: hooguit 2 groepen naast elkaar
 const groepen=vrij?Math.floor(n/k):tr?1:(n>=2*k?2:1),inn=groepen*k;
 return{in:inn,rij:n-inn,groepen,kort:0};
}
// Volgorde van doordraaien: eigen opgave (d.door) of alle eigen spelers in volgorde, daarna de rij
const OBJ=new Set(['K','M','M1','M2','M5','M6','Z','GZ','BOX']);
function doorOrder(d){
 if(team(d))return [];
 if(d.door)return d.door;
 return d.p.filter(p=>p[1]!=='#2dd4bf'&&p[1]!=='#f87171'&&!OBJ.has(p[0])&&!(p[0]==='P'&&p[1]==='#fb923c')).map(p=>p[0]);
}
function badge(d){const v=verdeling(d);return '<p class="sbadge'+(v.kort?' warn':'')+'">'+(v.team?T.n+' spelers: '+v.a+' tegen '+v.b:v.kort?'Vraagt '+d.need+' spelers, je hebt er '+T.n:T.n+' spelers: '+v.in+' in de oefening'+(v.groepen>1?' ('+v.groepen+' groepen)':'')+(v.rij?', '+v.rij+' in de rij':''))+'</p>';}
function plan(d){
 const n=T.n,v=verdeling(d);
 if(v.team)return n+' spelers: '+v.a+' tegen '+v.b+(n<12?'. Speel met minder posities: de spelverdeler blijft, de trainer brengt de bal in bij de kant met minder spelers.':' in de 5-1 opstelling.');
 if(v.kort)return 'Deze oefening vraagt '+d.need+' spelers en je hebt er '+n+'. De trainer neemt '+(v.kort>1?v.kort+' rollen':'een rol')+' over, bijvoorbeeld de aangever of de serveerder.';
 let t=n+' spelers: '+d.need+' tegelijk in de oefening';
 if(v.groepen>2)t+=', '+v.groepen+' groepjes tegelijk verspreid over het veld';else if(v.groepen===2)t+=', twee groepen naast elkaar (links en rechts op het veld, of op elke helft een groep)';
 if(v.rij)t+='. '+v.rij+' speler'+(v.rij>1?'s wachten':' wacht')+' in de rij en '+(v.rij>1?'draaien':'draait')+' na elke bal of ronde door';
 const o=doorOrder(d);if(o.length>1||(o.length&&v.rij))t+='. Doordraaien: '+o.join(' → ')+(v.rij?' → achteraan in de rij → '+o[0]:' → '+o[0]);
 return t+'.';
}
// Bewegende animatie op een groot veld (viewBox 560x680, net op y=340)
function anim(d){
 const D=9,kt='0;0.15;0.3;0.45;0.6;0.82;0.96;1',kb='0;0.12;0.24;0.36;0.48;0.6;0.96;1';
 let o='<svg viewBox="0 0 560 680" role="img" aria-label="Animatie: '+esc(d.t)+'" class="senv">'
  +'<rect x="110" y="40" width="340" height="600" rx="4" style="fill:var(--court)" stroke="#fff" stroke-width="3"/>'
  +'<line x1="110" y1="230" x2="450" y2="230" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 4"/>'
  +'<line x1="110" y1="450" x2="450" y2="450" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 4"/>'
  +'<line x1="96" y1="340" x2="464" y2="340" stroke="#ffd100" stroke-width="6"/>'
  +'<text x="122" y="62" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">overkant</text><text x="122" y="628" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">eigen veld</text>';
 const v=verdeling(d),ord=doorOrder(d),start=nm=>{const p=d.p.find(x=>x[0]===nm);return p?p[2][0]:null;};
 const gap=Math.min(34,240/Math.max(1,v.rij-1)),ry=i=>420+i*gap,RX=55;
 // waar gaat elke speler heen bij het doordraaien?
 const dest={};ord.forEach((nm,i)=>{if(i<ord.length-1)dest[nm]=start(ord[i+1]);else dest[nm]=v.rij?[RX,ry(v.rij-1)]:start(ord[0]);});
 const op='0;0;0;0;0;1;1;0';
 // pijlen en tekst tijdens het doordraaien
 if(ord.length>1||(ord.length&&v.rij)){
  o+='<defs><marker id="ah'+d.id+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#fff"/></marker></defs><g opacity="0"><animate attributeName="opacity" values="'+op+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>';
  ord.forEach(nm=>{const p=d.p.find(x=>x[0]===nm);if(!p||!dest[nm])return;const a=p[2][3],b=dest[nm];if(Math.hypot(b[0]-a[0],b[1]-a[1])<8)return;
   const mx=(a[0]+b[0])/2+(b[1]-a[1])*.18,my=(a[1]+b[1])/2-(b[0]-a[0])*.18;
   o+='<path d="M'+a[0]+' '+a[1]+' Q'+mx+' '+my+' '+b[0]+' '+b[1]+'" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#ah'+d.id+')"/>';});
  if(v.rij&&start(ord[0])){const b=start(ord[0]);o+='<path d="M'+RX+' '+ry(0)+' Q'+((RX+b[0])/2)+' '+(Math.min(ry(0),b[1])-40)+' '+b[0]+' '+b[1]+'" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#ah'+d.id+')"/>';}
  o+='<rect x="215" y="652" width="130" height="24" rx="12" fill="#1d1d1b"/><text x="280" y="669" text-anchor="middle" font-size="14" font-weight="800" fill="#ffd100">doordraaien</text></g>';
 }
 // spelers in de rij: links naast het veld; bij doordraaien schuift de voorste het veld in en de rest op
 for(let i=0;i<v.rij;i++){const y=ry(i),to=i===0&&ord.length&&start(ord[0])?start(ord[0]):[RX,ry(i-1)];
  const xs=[RX,RX,RX,RX,RX,to[0],to[0],RX].join(';'),ys=[y,y,y,y,y,to[1],to[1],y].join(';');
  o+='<circle cx="'+RX+'" cy="'+y+'" r="13" fill="#ffcc00" fill-opacity=".6" stroke="#1d1d1b" stroke-width="2">'+(ord.length?'<animate attributeName="cx" values="'+xs+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+ys+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>':'')+'</circle>';}
 if(v.rij)o+='<text x="55" y="404" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" fill-opacity=".85">rij</text>';
 // label 'N× groep' alleen als de tekening minder spelers toont dan er meedoen
 const getekend=d.p.filter(p=>p[1]!=='#2dd4bf'&&!OBJ.has(p[0])).length;
 if(v.groepen>1&&getekend<v.in)o+='<text x="505" y="404" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">'+v.groepen+'×</text><text x="505" y="422" text-anchor="middle" font-size="11" fill="#fff" fill-opacity=".85">groep</text>';
 d.p.forEach(p=>{const q=p[2];if(q.some((v,i)=>i&&Math.hypot(v[0]-q[i-1][0],v[1]-q[i-1][1])>4))o+='<polyline points="'+q.map(v=>v.join(',')).join(' ')+'" fill="none" stroke="'+p[1]+'" stroke-width="2.5" stroke-dasharray="6 5" opacity=".8"/>';});
 const b=d.bal;o+='<polyline points="'+b.map(v=>v.join(',')).join(' ')+'" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="3 5" opacity=".7"/>';
 d.p.forEach(p=>{const q=p[2],to=dest[p[0]]||q[0],vs=[...q,q[3],to,to,q[0]],vx=vs.map(v=>v[0]).join(';'),vy=vs.map(v=>v[1]).join(';');
  o+='<g><circle r="17" fill="'+p[1]+'" stroke="#1d1d1b" stroke-width="3" cx="'+q[0][0]+'" cy="'+q[0][1]+'"><animate attributeName="cx" values="'+vx+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+vy+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/></circle>'
   +'<text font-size="11" font-weight="900" text-anchor="middle" fill="#1d1d1b" x="'+q[0][0]+'" y="'+(q[0][1]+4)+'"><animate attributeName="x" values="'+vx+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="y" values="'+vs.map(v=>v[1]+4).join(';')+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>'+esc(p[0])+'</text></g>';});
 const still=b.every(x=>x[0]===b[0][0]&&x[1]===b[0][1]);if(still)return o+'</svg>';
 const bs=[...b,b[4],b[4],b[0]];
 o+='<circle r="10" fill="#fde047" stroke="#b45309" stroke-width="2.5" cx="'+b[0][0]+'" cy="'+b[0][1]+'"><animate attributeName="cx" values="'+bs.map(v=>v[0]).join(';')+'" keyTimes="'+kb+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+bs.map(v=>v[1]).join(';')+'" keyTimes="'+kb+'" dur="'+D+'s" repeatCount="indefinite"/></circle>';
 return o+'</svg>';
}
const LEGS='<p class="leg"><span><i style="background:#fde047"></i>bal</span><span><i style="background:#ffcc00"></i>eigen team</span><span><i style="background:#c084fc"></i>spelverdeler</span><span><i style="background:#34d399"></i>libero of verdediger</span><span><i style="background:#fb923c"></i>blok</span><span><i style="background:#f87171"></i>overkant</span><span><i style="background:#2dd4bf"></i>trainer</span><span><i class="ln"></i>looplijn</span></p>';
const THOPT=v=>'<option value="all">Gemengd</option>'+Object.entries(THEMA).map(([k,n])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+n+'</option>').join('');
const ul=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
function detail(d,open){
 return '<div class="dt"><p>'+esc(d.opzet)+'</p>'
  +(d.doel?'<h4>Doel</h4><p>'+esc(d.doel)+'</p>':'')
  +'<h4>Verloop</h4><ol>'+d.stappen.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
  +(d.aandacht.length?'<h4>Aandachtspunten</h4>'+ul(d.aandacht):'')
  +(d.variatie?'<details'+(open?' open':'')+'><summary>Variatie</summary><p>'+esc(d.variatie)+'</p></details>':'')+'</div>';
}
function chips(d){const v=verdeling(d);return '<span class="chip">± '+d.min+' min</span><span class="chip'+(v.kort?' warn':'')+'">'+(team(d)?'vanaf 4 spelers':d.need+' spelers per groep')+'</span>'+(d.zb?'<span class="chip">zonder bal</span>':'')+d.thema.map(t=>'<span class="chip">'+esc(THEMA[t])+'</span>').join('');}
function render(){
 let t0=0;
 $('s_out').innerHTML=T.slots.map((items,b)=>{const start=t0,len=BLEN[b],sum=items.reduce((a,d)=>a+d.min,0);t0+=len;
  return '<section class="blk"><div class="tm" title="Start na '+start+' minuten"><div>'+start+'<small>min</small></div></div><div class="bc"><div class="bh"><h2>'+BNAAM[b]+'</h2><span>'+len+' minuten, ingepland ± '+sum+'</span></div><div class="row noprint bth"><label for="th'+b+'">Thema</label><select id="th'+b+'" onchange="senTh('+b+',this.value)">'+THOPT(T.th[b])+'</select></div>'
  +items.map((d,i)=>{const pinned=T.pins.has(d.id);return '<div class="dr'+(pinned?' pin':'')+'"><div class="dh"><h3>'+esc(d.t)+'</h3><div class="tools noprint">'
   +'<button class="'+(pinned?'on':'')+'" aria-pressed="'+pinned+'" onclick="senPin(\''+d.id+'\')">'+(pinned?'Vastgezet':'Vastzetten')+'</button>'
   +'<button onclick="senSwap('+b+','+i+')">Wissel</button><button onclick="senPick('+b+','+i+')">Kies zelf</button>'
   +'<button aria-label="Verwijder '+esc(d.t)+'" onclick="senDel('+b+','+i+')">Verwijder</button></div></div>'
   +'<div class="meta">'+chips(d)+'</div><div class="body"><div>'+badge(d)+anim(d)+LEGS+'</div><div><p class="plan">'+esc(plan(d))+'</p>'+detail(d,false)+'</div></div></div>';}).join('')
  +'<button class="noprint add" onclick="senPick('+b+',-1)">Oefening toevoegen aan '+BNAAM[b].toLowerCase()+'</button></div></section>';}).join('');
 $('s_info').textContent=T.n+' spelers • 90 minuten op 1 veld.';
 $('s_lib').innerHTML=BLOK.map((k,b)=>'<h4>'+BNAAM[b]+'</h4><ul>'+SEN.filter(d=>d.blok===k).map(d=>'<li>'+esc(d.t)+' <span class="note">('+d.thema.map(t=>THEMA[t]).join(', ')+')</span></li>').join('')+'</ul>').join('');
}
window.senPin=id=>{T.pins.has(id)?T.pins.delete(id):T.pins.add(id);render();};
window.senDel=(b,i)=>{T.pins.delete(T.slots[b][i].id);T.slots[b].splice(i,1);render();};
window.senSwap=(b,i)=>{const u=new Set(T.slots.flat().map(d=>d.id)),p=pool(b).filter(d=>!u.has(d.id));
 if(!p.length){toast('Geen andere oefening voor dit blok');return;}
 T.pins.delete(T.slots[b][i].id);T.slots[b][i]=rnd(p);render();};
let PK=null;
window.senPick=(b,i)=>{PK={b,i};$('s_pq').value='';$('s_pb').value=String(b);senPickList();$('s_pick').showModal();};
window.senPickList=()=>{const q=$('s_pq').value.trim().toLowerCase(),b=+$('s_pb').value,inT=new Set(T.slots.flat().map(d=>d.id));
 const L=SEN.filter(d=>d.blok===BLOK[b]&&(!q||d.t.toLowerCase().includes(q)));
 $('s_plist').innerHTML=L.length?L.map(d=>'<button '+(inT.has(d.id)?'disabled ':'')+'onclick="senTake(\''+d.id+'\')"><b>'+esc(d.t)+'</b><span>'+(d.zb?'zonder bal, ':'')+esc(d.thema.map(t=>THEMA[t]).join(', '))+', '+(team(d)?'vanaf 4':d.need)+' spelers, ± '+d.min+' min'+(inT.has(d.id)?', staat al in de training':'')+'</span></button>').join(''):'<p class="note">Geen oefening gevonden voor dit blok.</p>';};
window.senTake=id=>{const d=byId.get(id),{b,i}=PK;if(i<0)T.slots[b].push(d);else{T.pins.delete(T.slots[b][i].id);T.slots[b][i]=d;}$('s_pick').close();render();};
function asText(){let t='Training jeugd/senioren (90 min, '+T.n+' spelers)\n',t0=0;
 T.slots.forEach((items,b)=>{t+='\n'+t0+' min – '+BNAAM[b]+' ('+BLEN[b]+' min'+(T.th[b]==='all'?'':', '+THEMA[T.th[b]])+')\n';t0+=BLEN[b];items.forEach(d=>t+='• '+d.t+'\n');});
 return t+'\nVV Woudenberg trainingsapp';}
window.senShare=()=>{const t=asText();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Training gekopieerd als tekst'),()=>{const e=$('s_box');e.style.display='';e.value=t;e.select();toast('Selecteer en kopieer de tekst');});};
const KEY='vvw.senioren.bewaard';
function savedUI(){const L=LS.get(KEY,[]);$('s_saved').innerHTML=L.map((s,i)=>'<div class="row"><button style="flex:3" onclick="senLoad('+i+')">'+esc(s.name)+'</button><button aria-label="Verwijder '+esc(s.name)+'" onclick="senForget('+i+')">×</button></div>').join('');}
window.senSave=()=>{if(!T.slots.flat().length){toast('Deze training is nog leeg');return;}const name=$('s_name').value.trim()||'Training '+new Date().toLocaleDateString('nl-NL');
 const L=LS.get(KEY,[]);L.unshift({name,th:T.th.slice(),n:T.n,slots:T.slots.map(a=>a.map(d=>d.id))});if(LS.set(KEY,L.slice(0,20))){toast('Bewaard op dit apparaat');$('s_name').value='';savedUI();}else toast('Bewaren lukt niet in deze browser');};
window.senLoad=i=>{const s=LS.get(KEY,[])[i];if(!s)return;const old=s.slots.length===5;T.th=Array.isArray(s.th)?s.th.slice():BLOK.map(()=>'all');if(old){T.th.splice(1,0,'all');s.slots.splice(1,0,[]);}T.n=Math.max(NMIN,Math.min(NMAX,s.n||12));T.slots=s.slots.map(a=>a.map(id=>byId.get(id)).filter(Boolean));T.pins=new Set();controls();render();toast('Training geladen');};
window.senForget=i=>{const L=LS.get(KEY,[]);L.splice(i,1);LS.set(KEY,L);savedUI();};
function controls(){
 const same=T.th.every(x=>x===T.th[0]);$('s_th').value=same?T.th[0]:'mix';$('s_n').value=T.n;$('s_nv').textContent=T.n;
}
// thema van één blok wijzigen: dat blok wordt opnieuw gevuld (vastgezette oefeningen blijven)
window.senTh=(b,v)=>{T.th[b]=v;const u=new Set(T.slots.flat().map(d=>d.id)),keep=T.slots[b].filter(d=>T.pins.has(d.id));
 T.slots[b].forEach(d=>{if(!T.pins.has(d.id))u.delete(d.id);});T.slots[b]=fill(b,u,keep);controls();render();};
function build(){
 const v=$('v_sen');
 v.innerHTML='<aside class="card noprint"><p class="note" style="margin:0 0 12px">Een training voor jeugd en senioren duurt 90 minuten op 1 veld.</p>'
  +'<label class="t" for="s_th">Thema voor alle blokken</label><select id="s_th">'+THOPT('all')+'<option value="mix" disabled>Per blok gekozen</option></select>'
  +'<p class="note" style="margin:4px 0 0">Bij elk blok kun je ook een eigen thema kiezen, zo combineer je thema\'s.</p>'
  +'<label class="t" for="s_n">Aantal spelers: <b id="s_nv">12</b></label><input type="range" id="s_n" min="'+NMIN+'" max="'+NMAX+'" value="12">'
  +'<button class="go" onclick="senGen()">Nieuwe training</button><button class="quiet" onclick="window.print()">Training printen</button><p class="note" id="s_info"></p><hr>'
  +'<label class="t" for="s_name">Deze training bewaren</label><div class="row"><input type="text" id="s_name" maxlength="40" placeholder="Naam, bijv. dinsdag dames 2"><button onclick="senSave()">Bewaar</button></div><div id="s_saved"></div>'
  +'<label class="t">Delen met een trainer</label><div class="row"><button onclick="senShare()">Kopieer als tekst</button></div><textarea id="s_box" readonly style="display:none" aria-label="Gekopieerde tekst"></textarea></aside>'
  +'<main><div id="s_out"></div><details class="card noprint" style="margin-top:6px"><summary><b>Alle oefeningen</b></summary><div class="lib" id="s_lib"></div></details>'
  +'<p class="note">Oefeningen voor jeugd en senioren zijn eigen beschrijvingen van VV Woudenberg. De trainer bepaalt zelf of een oefening past bij het niveau van de groep. De animatie toont de opstelling op een heel veld; het eigen team staat onder het net.</p></main>'
  +'<dialog id="s_pick"><div class="pkh"><h2>Kies een oefening <button onclick="this.closest(\'dialog\').close()">Sluiten</button></h2><div class="row"><input type="text" id="s_pq" placeholder="Zoek op naam" oninput="senPickList()" aria-label="Zoek op naam"><select id="s_pb" onchange="senPickList()" aria-label="Blok">'+BNAAM.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select></div></div><div id="s_plist"></div></dialog>';
 $('s_th').onchange=e=>{T.th=BLOK.map(()=>e.target.value);gen();};
 $('s_n').oninput=e=>{T.n=+e.target.value;$('s_nv').textContent=T.n;fit();render();};
 controls();savedUI();gen();T.built=true;
}
// bij minder spelers: niet-vastgezette oefeningen die te veel spelers vragen automatisch vervangen
function fit(){const u=new Set(T.slots.flat().map(d=>d.id));
 T.slots.forEach((items,b)=>items.forEach((d,i)=>{if(T.pins.has(d.id)||d.need<=T.n)return;
  const p=pool(b).filter(x=>!u.has(x.id)&&x.need<=T.n);if(p.length){const x=rnd(p);u.delete(d.id);u.add(x.id);items[i]=x;}}));}
window.senGen=gen;window.senAnim=anim;
window.senView=()=>{if(!T.built)build();};
})();
