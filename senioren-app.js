// Jeugd & Senioren: trainingsgenerator voor 90 minuten op 1 veld (6 tegen 6).
// Gebruikt $, esc, toast en LS uit index.html. Oefeningen staan in senioren.js (window.SEN).
(function(){
const SEN=window.SEN||[];
const NIV=['2e klasse','1e klasse','Promotieklasse','3e divisie','2e divisie'],NIVK=['2e klasse','1e klasse','Promotie','3e divisie','2e divisie'];
const THEMA={sideout:'5-1 side-out',service:'Service en pass',aanval:'Aanval',blok:'Blok en blokverdediging',verdediging:'Veldverdediging',transitie:'Transitie'};
const BLOK=['wu','tech','spel','zes','eind'];
const BNAAM=['Warming-up met bal','Techniek','Spelsituatie','6 tegen 6 op het thema','Eindspel'];
const BLEN=[15,20,20,25,10];
const T={niv:1,thema:'all',n:12,slots:[],pins:new Set(),built:false};
const byId=new Map(SEN.map(d=>[d.id,d]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];

function pool(b,strict){
 const p=SEN.filter(d=>d.blok===BLOK[b]&&d.niv.includes(T.niv));
 if(T.thema==='all')return p;
 const q=p.filter(d=>d.thema.includes(T.thema));
 return q.length||strict?q:p;
}
function fill(b,used,keep){
 const items=keep.slice();let sum=items.reduce((a,d)=>a+d.min,0);
 let p=pool(b).filter(d=>!used.has(d.id));
 while(p.length&&sum<BLEN[b]-2&&items.length<3){const d=rnd(p);items.push(d);used.add(d.id);sum+=d.min;p=p.filter(x=>x!==d);}
 return items;
}
function gen(){
 const u=new Set(),keep=BLOK.map((_,b)=>(T.slots[b]||[]).filter(d=>T.pins.has(d.id)&&d.niv.includes(T.niv)));
 T.pins=new Set(keep.flat().map(d=>d.id));keep.flat().forEach(d=>u.add(d.id));
 T.slots=BLOK.map((_,b)=>fill(b,u,keep[b]));render();
}
function plan(d){
 const n=T.n;
 if(d.blok==='wu')return 'Alle '+n+' spelers doen tegelijk mee, verdeeld over beide helften van het veld.';
 if(d.blok==='zes'||d.blok==='eind'){
  if(n>=12)return n+' spelers: 6 tegen 6'+(n>12?', '+(n-12)+' wissel'+(n-12>1?'s draaien':' draait')+' in na elke rotatie.':'.');
  const a=Math.ceil(n/2);return n+' spelers: '+a+' tegen '+(n-a)+'. De trainer vult aan of speelt de bal in aan de kant met minder spelers.';
 }
 if(d.blok==='spel'){const g=Math.floor(n/3),r=n-g*3;return n+' spelers: '+g+' drietallen. Twee drietallen spelen, de rest haalt ballen en wisselt na 5 punten in'+(r?'; '+r+' speler'+(r>1?'s':'')+' vult een drietal aan.':'.');}
 const h=Math.ceil(n/2);return n+' spelers: twee groepen van ongeveer '+h+', elk op een helft van het veld. Na elke ronde wisselen de rollen.';
}
// Bewegende animatie op een groot veld (viewBox 560x680, net op y=340)
function anim(d){
 const D=7,kt='0;0.2;0.4;0.6;0.88;1',kb='0;0.15;0.3;0.45;0.6;0.88;1';
 let o='<svg viewBox="0 0 560 680" role="img" aria-label="Animatie: '+esc(d.t)+'" class="senv">'
  +'<rect x="110" y="40" width="340" height="600" rx="4" style="fill:var(--court)" stroke="#fff" stroke-width="3"/>'
  +'<line x1="110" y1="230" x2="450" y2="230" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 4"/>'
  +'<line x1="110" y1="450" x2="450" y2="450" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 4"/>'
  +'<line x1="96" y1="340" x2="464" y2="340" stroke="#ffd100" stroke-width="6"/>'
  +'<text x="122" y="62" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">overkant</text><text x="122" y="628" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">eigen veld</text>';
 d.p.forEach(p=>{const q=p[2];if(q.some((v,i)=>i&&Math.hypot(v[0]-q[i-1][0],v[1]-q[i-1][1])>4))o+='<polyline points="'+q.map(v=>v.join(',')).join(' ')+'" fill="none" stroke="'+p[1]+'" stroke-width="2.5" stroke-dasharray="6 5" opacity=".8"/>';});
 const b=d.bal;o+='<polyline points="'+b.map(v=>v.join(',')).join(' ')+'" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="3 5" opacity=".7"/>';
 d.p.forEach(p=>{const q=p[2],vs=[...q,q[3],q[0]],vx=vs.map(v=>v[0]).join(';'),vy=vs.map(v=>v[1]).join(';');
  o+='<g><circle r="17" fill="'+p[1]+'" stroke="#1d1d1b" stroke-width="3" cx="'+q[0][0]+'" cy="'+q[0][1]+'"><animate attributeName="cx" values="'+vx+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+vy+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/></circle>'
   +'<text font-size="11" font-weight="900" text-anchor="middle" fill="#1d1d1b" x="'+q[0][0]+'" y="'+(q[0][1]+4)+'"><animate attributeName="x" values="'+vx+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="y" values="'+vs.map(v=>v[1]+4).join(';')+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>'+esc(p[0])+'</text></g>';});
 const bs=[...b,b[4],b[0]];
 o+='<circle r="10" fill="#fde047" stroke="#b45309" stroke-width="2.5" cx="'+b[0][0]+'" cy="'+b[0][1]+'"><animate attributeName="cx" values="'+bs.map(v=>v[0]).join(';')+'" keyTimes="'+kb+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+bs.map(v=>v[1]).join(';')+'" keyTimes="'+kb+'" dur="'+D+'s" repeatCount="indefinite"/></circle>';
 return o+'</svg>';
}
const LEGS='<p class="leg"><span><i style="background:#fde047"></i>bal</span><span><i style="background:#ffcc00"></i>eigen team</span><span><i style="background:#c084fc"></i>spelverdeler</span><span><i style="background:#34d399"></i>libero of verdediger</span><span><i style="background:#fb923c"></i>blok</span><span><i style="background:#f87171"></i>overkant</span><span><i style="background:#2dd4bf"></i>trainer</span><span><i class="ln"></i>looplijn</span></p>';
const ul=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
function detail(d,open){
 return '<div class="dt"><p>'+esc(d.opzet)+'</p>'
  +(d.doel?'<h4>Doel</h4><p>'+esc(d.doel)+'</p>':'')
  +'<h4>Verloop</h4><ol>'+d.stappen.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
  +(d.aandacht.length?'<h4>Aandachtspunten</h4>'+ul(d.aandacht):'')
  +(d.variatie?'<details'+(open?' open':'')+'><summary>Variatie</summary><p>'+esc(d.variatie)+'</p></details>':'')+'</div>';
}
function chips(d){return '<span class="chip">± '+d.min+' min</span>'+d.thema.map(t=>'<span class="chip">'+esc(THEMA[t])+'</span>').join('');}
function render(){
 let t0=0;
 $('s_out').innerHTML=T.slots.map((items,b)=>{const start=t0,len=BLEN[b],sum=items.reduce((a,d)=>a+d.min,0);t0+=len;
  return '<section class="blk"><div class="tm" title="Start na '+start+' minuten"><div>'+start+'<small>min</small></div></div><div class="bc"><div class="bh"><h2>'+BNAAM[b]+'</h2><span>'+len+' minuten, ingepland ± '+sum+'</span></div>'
  +items.map((d,i)=>{const pinned=T.pins.has(d.id);return '<div class="dr'+(pinned?' pin':'')+'"><div class="dh"><h3>'+esc(d.t)+'</h3><div class="tools noprint">'
   +'<button class="'+(pinned?'on':'')+'" aria-pressed="'+pinned+'" onclick="senPin(\''+d.id+'\')">'+(pinned?'Vastgezet':'Vastzetten')+'</button>'
   +'<button onclick="senSwap('+b+','+i+')">Wissel</button><button onclick="senPick('+b+','+i+')">Kies zelf</button>'
   +'<button aria-label="Verwijder '+esc(d.t)+'" onclick="senDel('+b+','+i+')">Verwijder</button></div></div>'
   +'<div class="meta">'+chips(d)+'</div><div class="body"><div>'+anim(d)+LEGS+'</div><div><p class="plan">'+esc(plan(d))+'</p>'+detail(d,false)+'</div></div></div>';}).join('')
  +'<button class="noprint add" onclick="senPick('+b+',-1)">Oefening toevoegen aan '+BNAAM[b].toLowerCase()+'</button></div></section>';}).join('');
 $('s_info').textContent=NIV[T.niv-1]+(T.thema==='all'?'':' • thema '+THEMA[T.thema])+' • 90 minuten op 1 veld.';
 $('s_lib').innerHTML=BLOK.map((k,b)=>'<h4>'+BNAAM[b]+'</h4><ul>'+SEN.filter(d=>d.blok===k&&d.niv.includes(T.niv)).map(d=>'<li>'+esc(d.t)+'</li>').join('')+'</ul>').join('');
}
window.senPin=id=>{T.pins.has(id)?T.pins.delete(id):T.pins.add(id);render();};
window.senDel=(b,i)=>{T.pins.delete(T.slots[b][i].id);T.slots[b].splice(i,1);render();};
window.senSwap=(b,i)=>{const u=new Set(T.slots.flat().map(d=>d.id)),p=pool(b).filter(d=>!u.has(d.id));
 if(!p.length){toast('Geen andere oefening voor dit blok op dit niveau');return;}
 T.pins.delete(T.slots[b][i].id);T.slots[b][i]=rnd(p);render();};
let PK=null;
window.senPick=(b,i)=>{PK={b,i};$('s_pq').value='';$('s_pb').value=String(b);senPickList();$('s_pick').showModal();};
window.senPickList=()=>{const q=$('s_pq').value.trim().toLowerCase(),b=+$('s_pb').value,inT=new Set(T.slots.flat().map(d=>d.id));
 const L=SEN.filter(d=>d.blok===BLOK[b]&&d.niv.includes(T.niv)&&(!q||d.t.toLowerCase().includes(q)));
 $('s_plist').innerHTML=L.length?L.map(d=>'<button '+(inT.has(d.id)?'disabled ':'')+'onclick="senTake(\''+d.id+'\')"><b>'+esc(d.t)+'</b><span>'+esc(d.thema.map(t=>THEMA[t]).join(', '))+', ± '+d.min+' min'+(inT.has(d.id)?', staat al in de training':'')+'</span></button>').join(''):'<p class="note">Geen oefening gevonden voor dit blok op dit niveau.</p>';};
window.senTake=id=>{const d=byId.get(id),{b,i}=PK;if(i<0)T.slots[b].push(d);else{T.pins.delete(T.slots[b][i].id);T.slots[b][i]=d;}$('s_pick').close();render();};
function asText(){let t='Training '+NIV[T.niv-1]+(T.thema==='all'?'':' – '+THEMA[T.thema])+' (90 min, '+T.n+' spelers)\n',t0=0;
 T.slots.forEach((items,b)=>{t+='\n'+t0+' min – '+BNAAM[b]+' ('+BLEN[b]+' min)\n';t0+=BLEN[b];items.forEach(d=>t+='• '+d.t+'\n');});
 return t+'\nVV Woudenberg trainingsapp';}
window.senShare=()=>{const t=asText();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Training gekopieerd als tekst'),()=>{const e=$('s_box');e.style.display='';e.value=t;e.select();toast('Selecteer en kopieer de tekst');});};
const KEY='vvw.senioren.bewaard';
function savedUI(){const L=LS.get(KEY,[]);$('s_saved').innerHTML=L.map((s,i)=>'<div class="row"><button style="flex:3" onclick="senLoad('+i+')">'+esc(s.name)+'</button><button aria-label="Verwijder '+esc(s.name)+'" onclick="senForget('+i+')">×</button></div>').join('');}
window.senSave=()=>{if(!T.slots.flat().length){toast('Deze training is nog leeg');return;}const name=$('s_name').value.trim()||NIV[T.niv-1]+' '+new Date().toLocaleDateString('nl-NL');
 const L=LS.get(KEY,[]);L.unshift({name,niv:T.niv,thema:T.thema,n:T.n,slots:T.slots.map(a=>a.map(d=>d.id))});if(LS.set(KEY,L.slice(0,20))){toast('Bewaard op dit apparaat');$('s_name').value='';savedUI();}else toast('Bewaren lukt niet in deze browser');};
window.senLoad=i=>{const s=LS.get(KEY,[])[i];if(!s)return;Object.assign(T,{niv:s.niv,thema:s.thema,n:s.n});T.slots=s.slots.map(a=>a.map(id=>byId.get(id)).filter(Boolean));T.pins=new Set();controls();render();toast('Training geladen');};
window.senForget=i=>{const L=LS.get(KEY,[]);L.splice(i,1);LS.set(KEY,L);savedUI();};
function controls(){
 $('s_lv').innerHTML=NIV.map((n,i)=>'<button class="'+(T.niv===i+1?'on':'')+'" aria-pressed="'+(T.niv===i+1)+'" title="'+n+'" onclick="senNiv('+(i+1)+')">'+NIVK[i]+'</button>').join('');
 $('s_th').value=T.thema;$('s_n').value=T.n;$('s_nv').textContent=T.n;
}
window.senNiv=v=>{T.niv=v;controls();gen();};
function build(){
 const v=$('v_sen');
 v.innerHTML='<aside class="card noprint"><p class="note" style="margin:0 0 12px">Een training voor jeugd en senioren duurt 90 minuten op 1 veld.</p>'
  +'<label class="t">Niveau</label><div class="row seg" id="s_lv"></div>'
  +'<label class="t" for="s_th">Thema van de training</label><select id="s_th"><option value="all">Gemengd</option>'+Object.entries(THEMA).map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('')+'</select>'
  +'<label class="t" for="s_n">Aantal spelers: <b id="s_nv">12</b></label><input type="range" id="s_n" min="6" max="18" value="12">'
  +'<button class="go" onclick="senGen()">Nieuwe training</button><button class="quiet" onclick="window.print()">Training printen</button><p class="note" id="s_info"></p><hr>'
  +'<label class="t" for="s_name">Deze training bewaren</label><div class="row"><input type="text" id="s_name" maxlength="40" placeholder="Naam, bijv. dinsdag dames 2"><button onclick="senSave()">Bewaar</button></div><div id="s_saved"></div>'
  +'<label class="t">Delen met een trainer</label><div class="row"><button onclick="senShare()">Kopieer als tekst</button></div><textarea id="s_box" readonly style="display:none" aria-label="Gekopieerde tekst"></textarea></aside>'
  +'<main><div id="s_out"></div><details class="card noprint" style="margin-top:6px"><summary><b>Alle oefeningen van dit niveau</b></summary><div class="lib" id="s_lib"></div></details>'
  +'<p class="note">Oefeningen voor jeugd en senioren zijn eigen beschrijvingen van VV Woudenberg. De animatie toont de opstelling op een heel veld; het eigen team staat onder het net.</p></main>'
  +'<dialog id="s_pick"><div class="pkh"><h2>Kies een oefening <button onclick="this.closest(\'dialog\').close()">Sluiten</button></h2><div class="row"><input type="text" id="s_pq" placeholder="Zoek op naam" oninput="senPickList()" aria-label="Zoek op naam"><select id="s_pb" onchange="senPickList()" aria-label="Blok">'+BNAAM.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select></div></div><div id="s_plist"></div></dialog>';
 $('s_th').onchange=e=>{T.thema=e.target.value;gen();};
 $('s_n').oninput=e=>{T.n=+e.target.value;$('s_nv').textContent=T.n;render();};
 controls();savedUI();gen();T.built=true;
}
window.senGen=gen;window.senAnim=anim;
window.senView=()=>{if(!T.built)build();};
})();
