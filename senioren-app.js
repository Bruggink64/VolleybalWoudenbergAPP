// Jeugd & Senioren: trainingsgenerator voor 90 minuten op 1 veld (6 tegen 6).
// Gebruikt $, esc, toast en LS uit index.html. Oefeningen staan in senioren.js (window.SEN).
(function(){
const SEN=window.SEN||[];
const THEMA={warming:'Warming-up',inspelen:'Inspelen',sideout:'5-1 side-out',service:'Service en pass',aanval:'Aanval',blok:'Blok en blokverdediging',verdediging:'Veldverdediging',transitie:'Transitie'};
const BLOK=['wu','insp','tech','spel','zes','eind'];
const BNAAM=['Warming-up','Inspelen','Techniek','Spelsituatie','6 tegen 6 op het thema','Eindspel'];
const BLEN=[10,10,20,20,20,10];
const ROL={sv:'Spelverdeler',dia:'Diagonaal',pl:'Buitenspeler (passer-loper)',mid:'Midden',lib:'Libero'};
const AFK={sv:'SV',dia:'DIA',pl:'PL',mid:'MID',lib:'LIB'};
const ROLV=Object.keys(ROL),ROLMAX={sv:3,dia:3,pl:6,mid:4,lib:2};
const T={th:['all','all','all','all','all','all'],n:12,slots:[],pins:new Set(),built:false,pm:false,R:{sv:1,dia:1,pl:2,mid:2,lib:1}};
const NMIN=4,NMAX=12;
const rsum=R=>ROLV.reduce((a,k)=>a+R[k],0);
// standaardgroep bij n spelers: eerst een volledige zeshoek, daarna aanvullen
function defR(n){const R={sv:0,dia:0,pl:0,mid:0,lib:0},o=['sv','pl','mid','lib','dia','pl','mid','pl','dia','mid','pl','pl'];
 for(let i=0;i<n;i++){const k=o[i%o.length];R[k]=Math.min(ROLMAX[k],R[k]+1);}
 let t=rsum(R);for(const k of ['pl','mid','dia']){while(t<n&&R[k]<ROLMAX[k]){R[k]++;t++;}}return R;}
const byId=new Map(SEN.map(d=>[d.id,d]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];

// Oefeningen voor blok b: eerst passend bij thema en spelersaantal, anders ruimer
// Wat ontbreekt er in de groep voor deze oefening? sv en mid zijn vast; diagonaal en libero kan een passer-loper overnemen
const RQ=new Map();
function reqOf(d){if(RQ.has(d.id))return RQ.get(d.id);const q=Object.assign({},d.rol||{});
 const extra=d.p.filter(p=>/^SV\d$/.test(p[0])&&!(d.ro&&d.ro[p[0]])).length;if(extra)q.sv=(q.sv||0)+extra;
 const r=Object.keys(q).length?q:null;RQ.set(d.id,r);return r;}
function ontbreekt(d){
 const q=reqOf(d);
 if(!T.pm||!q)return{hard:[],zacht:[]};
 const R=T.R,hard=[],zacht=[];
 if((q.sv||0)>R.sv)hard.push('sv');
 if((q.mid||0)>R.mid)hard.push('mid');
 const md=Math.max(0,(q.dia||0)-R.dia),ml=Math.max(0,(q.lib||0)-R.lib);
 if(md+ml>R.pl){if(md)hard.push('dia');if(ml)hard.push('lib');}
 else{if(md)zacht.push('dia');if(ml)zacht.push('lib');}
 return{hard,zacht};
}
const okR=d=>!ontbreekt(d).hard.length;
// Past de oefening bij het aantal spelers? Niet te veel spelers in de rij: hooguit een derde van de groep (minimaal 2)
const maxRij=()=>Math.max(2,Math.round(T.n/3));
const okF=d=>{const v=verdeling(d);return !v.kort&&v.rij<=maxRij();};
function pool(b){
 const all=SEN.filter(d=>d.blok===BLOK[b]),th=T.th[b];
 const okN=all.filter(d=>d.need<=T.n),okT=d=>th==='all'||d.thema.includes(th),R=d=>!T.pm||okR(d);
 // van streng naar ruim: posities, thema en aantal spelers; de eerste stap met oefeningen wint
 const stap=[[R,okT,okF],[R,okT],[R,okF],[R],[okT,okF],[okT],[okF],[]];
 for(const fs of stap){const x=okN.filter(d=>fs.every(f=>f(d)));if(x.length)return x;}
 const t=all.filter(okT);return t.length?t:all;
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
 // d.vs: vaste verdeling (bijv. 6 tegen 4); d.allen: iedereen doet mee, verdeeld over twee teams aan weerszijden van het net
 if(d.vs&&n>=d.vs[0]+d.vs[1]){const t=d.vs[0]+d.vs[1];return{team:true,vs:true,a:d.vs[0],b:d.vs[1],rij:n-t,groepen:1,in:t,kort:0};}
 if(d.allen&&n>=d.need)return{allen:true,rij:0,groepen:1,in:n,kort:0};
 if(team(d)){const a=Math.ceil(n/2);return{team:true,a,b:n-a,rij:0,groepen:1,in:n,kort:0};}
 const k=d.need;
 if(n<k)return{in:n,rij:0,groepen:1,kort:k-n};
 const tr=d.p.some(p=>p[1]==='#2dd4bf'),vrij=d.blok==='wu'||d.blok==='insp';
 // warming-up en inspelen: alle groepjes tegelijk; andere blokken: hooguit 2 groepen naast elkaar
 const groepen=vrij?Math.floor(n/k):tr?1:(n>=2*k?2:1),inn=groepen*k;
 return{in:inn,rij:n-inn,groepen,kort:0};
}
// Volgorde van doordraaien: eigen opgave (d.door) of alle eigen spelers in volgorde, daarna de rij
// Materiaal (pion, mat, hoepel, korf, box, ladder, lint, doelzone, ballenkar) staat tussen de spelers in d.p;
// welk naam welk materiaal is, staat in senioren-obj.js (window.senObj). Materiaal wordt nooit als speler getekend.
const objOf=(d,p)=>window.senObj?window.senObj(d,p):null;
const isPion=(d,p)=>objOf(d,p)==='pion';
const actors=d=>d.p.filter(p=>p[1]!=='#2dd4bf'&&p[1]!=='#f87171'&&!objOf(d,p)&&!(p[0]==='P'&&p[1]==='#fb923c')).map(p=>p[0]);
function doorOrder(d){
 if(team(d)||d.allen||d.vast)return []; // geen doordraaien: iedereen komt op zijn eigen plek terug
 if(d.door)return d.door;
 return actors(d);
}
// Welke positie uit jouw groep staat waar? Vaste posities uit de oefening eerst, daarna de rest van de groep
function rolMap(d){
 if(!T.pm)return{};
 const R=Object.assign({},T.R),ro=d.ro||{},lab={},ac=actors(d);
 ac.forEach(nm=>{const r=ro[nm];if(!r)return;if(R[r]>0){lab[nm]=r;R[r]--;}});
 ac.forEach(nm=>{const r=ro[nm];if(!r||lab[nm])return;if((r==='dia'||r==='lib')&&R.pl>0){lab[nm]='pl';R.pl--;}});
 ac.forEach(nm=>{if(lab[nm]||ro[nm])return;const r=['pl','dia','mid','lib','sv'].find(k=>R[k]>0);if(r){lab[nm]=r;R[r]--;}});
 const tot={},seen={};Object.values(lab).forEach(r=>tot[r]=(tot[r]||0)+1);
 const out={};ac.forEach(nm=>{const r=lab[nm];if(!r)return;seen[r]=(seen[r]||0)+1;out[nm]=AFK[r]+(tot[r]>1?seen[r]:'');});
 return out;
}
function posNote(d){const o=ontbreekt(d);let t='';
 if(o.hard.length)t+='<p class="sbadge warn">Vraagt '+o.hard.map(k=>ROL[k].toLowerCase()).join(' en ')+(o.hard.includes('sv')?'; zonder spelverdeler zet de trainer op of een buitenspeler.':'; die heb je niet in je groep.')+'</p>';
 if(o.zacht.length)t+='<p class="sbadge">Zonder '+o.zacht.map(k=>ROL[k].toLowerCase()).join(' en ')+': een buitenspeler (passer-loper) neemt die rol over.</p>';
 return t;}
function badge(d){const v=verdeling(d);return posNote(d)+'<p class="sbadge'+(v.kort?' warn':'')+'">'+(v.vs?v.in+' spelers: '+v.a+' tegen '+v.b+(v.rij?', '+v.rij+' reserve':''):v.allen?T.n+' spelers: twee teams, ieder aan een kant van het net':v.team?T.n+' spelers: '+v.a+' tegen '+v.b:v.kort?'Vraagt '+d.need+' spelers, je hebt er '+T.n:T.n+' spelers: '+v.in+' in de oefening'+(v.groepen>1?' ('+v.groepen+' groepen)':'')+(v.rij?', '+v.rij+' in de rij':''))+'</p>';}
function splitTeams(){
 const A={},B={};let ta=0,tb=0;
 ['sv','mid','dia','lib','pl'].forEach(k=>{for(let i=0;i<T.R[k];i++){const toA=ta<=tb;if(toA){A[k]=(A[k]||0)+1;ta++;}else{B[k]=(B[k]||0)+1;tb++;}}});
 const f=o=>ROLV.filter(k=>o[k]).map(k=>o[k]+' '+AFK[k]).join(', ');
 let t=' Team A: '+f(A)+'. Team B: '+f(B)+'.';
 if(!A.sv||!B.sv)t+=T.R.sv?' Eén team heeft geen spelverdeler: laat een buitenspeler opzetten of de trainer.':' Je hebt geen spelverdeler: de trainer zet op, of een buitenspeler.';
 return t;
}
function plan(d){
 const n=T.n,v=verdeling(d);
 if(v.vs)return v.in+' spelers: '+v.a+' tegen '+v.b+(v.rij?'. De overige '+v.rij+' speler'+(v.rij>1?'s zijn':' is')+' reserve en wisselen in.':'.');
 if(v.allen)return n+' spelers: twee teams, ieder aan een kant van het net. Is het aantal oneven, dan speelt één team met een speler meer.';
 if(v.team&&T.pm)return n+' spelers: '+v.a+' tegen '+v.b+'.'+splitTeams();
 if(v.team)return n+' spelers: '+v.a+' tegen '+v.b+(n<12?'. Speel met minder posities: de spelverdeler blijft, de trainer brengt de bal in bij de kant met minder spelers.':' in de 5-1 opstelling.');
 if(v.kort)return 'Deze oefening vraagt '+d.need+' spelers en je hebt er '+n+'. De trainer neemt '+(v.kort>1?v.kort+' rollen':'een rol')+' over, bijvoorbeeld de aangever of de serveerder.';
 let t=n+' spelers: '+d.need+' tegelijk in de oefening';
 if(v.groepen>2)t+=', '+v.groepen+' groepjes tegelijk verspreid over het veld';else if(v.groepen===2)t+=', twee groepen naast elkaar (links en rechts op het veld, of op elke helft een groep)';
 if(v.rij)t+='. '+v.rij+' speler'+(v.rij>1?'s wachten':' wacht')+' in de rij en '+(v.rij>1?'draaien':'draait')+' na elke bal of ronde door';
 const o=doorOrder(d);if(o.length>1||(o.length&&v.rij))t+='. Doordraaien: '+o.join(' → ')+(v.rij?' → achteraan in de rij → '+o[0]:' → '+o[0]);
 return t+'.';
}
// Zonenummers 1 t/m 6 (eigen veld onder, overkant gespiegeld boven), licht op de achtergrond
const ZONES=[[4,165,412],[3,280,412],[2,395,412],[5,165,560],[6,280,560],[1,395,560],[2,165,290],[3,280,290],[4,395,290],[1,165,140],[6,280,140],[5,395,140]]
 .map(([n,x,y])=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="44" font-weight="800" fill="#fff" fill-opacity=".13">'+n+'</text>').join('');
// Balbaan: pijl per balbeweging met het nummer van de stap erbij
function balBaan(d,b){
 const segs=b.slice(1).map((v,i)=>[b[i],v,i+1]).filter(([a,c])=>Math.hypot(c[0]-a[0],c[1]-a[1])>8);
 if(!segs.length)return '';
 let o='<defs><marker id="bp'+d.id+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#fde047"/></marker></defs><g class="bbaan">';
 segs.forEach(([a,c,n])=>{const L=Math.hypot(c[0]-a[0],c[1]-a[1]),k=Math.min(14,L/3)/L,ex=c[0]-(c[0]-a[0])*k,ey=c[1]-(c[1]-a[1])*k;
  o+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+ex.toFixed(1)+'" y2="'+ey.toFixed(1)+'" stroke="#fde047" stroke-width="2.5" stroke-dasharray="7 5" opacity=".85" marker-end="url(#bp'+d.id+')"/>';});
 if(!d.baan)segs.forEach(([a,c,n])=>{const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2,L=Math.hypot(c[0]-a[0],c[1]-a[1]),ox=-(c[1]-a[1])/L*13,oy=(c[0]-a[0])/L*13;
  o+='<g><circle cx="'+(mx+ox).toFixed(1)+'" cy="'+(my+oy).toFixed(1)+'" r="10" fill="#1d1d1b" stroke="#fde047" stroke-width="2"/><text x="'+(mx+ox).toFixed(1)+'" y="'+(my+oy+4).toFixed(1)+'" text-anchor="middle" font-size="12" font-weight="900" fill="#fde047">'+n+'</text></g>';});
 return o+'</g>';
}
// tekening per soort materiaal (veld 560x680)
function objSvg(k,x,y){
 const t=(tx,yy)=>'<text x="'+x+'" y="'+(yy==null?y+5:yy)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#1d1d1b">'+tx+'</text>';
 switch(k){
  case 'mat':return '<g><rect x="'+(x-32)+'" y="'+(y-18)+'" width="64" height="36" rx="5" fill="#e2e8f0" fill-opacity=".92" stroke="#1d1d1b" stroke-width="2.5"/>'+t('mat')+'</g>';
  case 'pion':return '<g class="pion"><ellipse cx="'+x+'" cy="'+(y+9)+'" rx="13" ry="5" fill="#000" fill-opacity=".28"/><path d="M'+(x-12)+' '+(y+9)+' L'+x+' '+(y-14)+' L'+(x+12)+' '+(y+9)+' Z" fill="#f97316" stroke="#7c2d12" stroke-width="2" stroke-linejoin="round"/><path d="M'+(x-6.5)+' '+(y-1)+' L'+(x+6.5)+' '+(y-1)+' L'+(x+8)+' '+(y+2.5)+' L'+(x-8)+' '+(y+2.5)+' Z" fill="#fff"/></g>';
  case 'hoepel':return '<g class="hoepel"><circle cx="'+x+'" cy="'+y+'" r="22" fill="none" stroke="#f8fafc" stroke-width="5"/><circle cx="'+x+'" cy="'+y+'" r="22" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="6 6"/></g>';
  case 'korf':return '<g class="korf"><circle cx="'+x+'" cy="'+y+'" r="17" fill="#fb923c" fill-opacity=".25" stroke="#fb923c" stroke-width="4"/><path d="M'+(x-10)+' '+(y-6)+' L'+(x+10)+' '+(y+6)+' M'+(x+10)+' '+(y-6)+' L'+(x-10)+' '+(y+6)+'" stroke="#fb923c" stroke-width="2"/>'+t('korf',y+34).replace('#1d1d1b','#fff')+'</g>';
  case 'box':return '<g class="box"><rect x="'+(x-26)+'" y="'+(y-18)+'" width="52" height="36" rx="3" fill="#92400e" stroke="#fde68a" stroke-width="2.5"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#fde68a">box</text></g>';
  case 'kar':return '<g class="kar"><rect x="'+(x-20)+'" y="'+(y-14)+'" width="40" height="28" rx="4" fill="#64748b" stroke="#fff" stroke-width="2"/><circle cx="'+(x-8)+'" cy="'+(y-3)+'" r="6" fill="#fde047"/><circle cx="'+(x+6)+'" cy="'+(y+4)+'" r="6" fill="#fde047"/><circle cx="'+(x+8)+'" cy="'+(y-6)+'" r="5" fill="#fde047"/></g>';
  case 'ladder':{let r='<g class="ladder"><rect x="'+(x-22)+'" y="'+(y-90)+'" width="44" height="180" fill="none" stroke="#fde047" stroke-width="3"/>';for(let i=1;i<6;i++)r+='<line x1="'+(x-22)+'" y1="'+(y-90+i*30)+'" x2="'+(x+22)+'" y2="'+(y-90+i*30)+'" stroke="#fde047" stroke-width="3"/>';return r+'</g>';}
  case 'lint':return '<g class="lint"><rect x="'+(x-5)+'" y="'+(y-22)+'" width="10" height="44" rx="3" fill="#e11d48" stroke="#fff" stroke-width="1.5"/></g>';
  case 'kaarten':return '<g class="kaarten"><rect x="'+(x-12)+'" y="'+(y-16)+'" width="24" height="32" rx="3" fill="#fff" stroke="#1d1d1b" stroke-width="2" transform="rotate(-8 '+x+' '+y+')"/><rect x="'+(x-12)+'" y="'+(y-16)+'" width="24" height="32" rx="3" fill="#fecaca" stroke="#1d1d1b" stroke-width="2" transform="rotate(8 '+x+' '+y+')"/></g>';
  case 'zone':return '<g class="zone"><rect x="'+(x-40)+'" y="'+(y-30)+'" width="80" height="60" rx="6" fill="#fde047" fill-opacity=".22" stroke="#fde047" stroke-width="3" stroke-dasharray="8 5"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#fde047">doel</text></g>';
 }
 return '';
}
// Bewegende animatie op een groot veld (viewBox 560x680, net op y=340)
function anim(d){
 const D=9,kt='0;0.15;0.3;0.45;0.6;0.82;0.96;1',kb='0;0.15;0.3;0.45;0.6;0.7;0.96;1';
 let o='<svg viewBox="0 0 560 680" role="img" aria-label="Animatie: '+esc(d.t)+'" class="senv">'
  +S2D.court560({zones:ZONES})+'<text x="122" y="62" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">overkant</text><text x="122" y="628" fill="#fff" fill-opacity=".7" font-size="14" font-weight="700">eigen veld</text>';
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
  o+='<circle cx="'+RX+'" cy="'+y+'" r="13" fill="#14171f" stroke="#ffd100" stroke-opacity=".7" stroke-width="2.5">'+(ord.length?'<animate attributeName="cx" values="'+xs+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+ys+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>':'')+'</circle>';}
 if(v.rij)o+='<text x="55" y="404" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" fill-opacity=".85">rij</text>';
 // label 'N× groep' alleen als de tekening minder spelers toont dan er meedoen
 const getekend=d.p.filter(p=>p[1]!=='#2dd4bf'&&!objOf(d,p)).length;
 if(v.groepen>(d.baan?4:1)&&getekend<v.in)o+='<text x="505" y="404" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">'+v.groepen+'×</text><text x="505" y="422" text-anchor="middle" font-size="11" fill="#fff" fill-opacity=".85">groep</text>';
 // materiaal onder de spelers tekenen (mat, pion, hoepel, korf, box, ladder, lint, doelzone, ballenkar)
 const isObj=p=>!!objOf(d,p);
 d.p.filter(isObj).forEach(p=>{o+=objSvg(objOf(d,p),p[2][0][0],p[2][0][1]);});
 const i0=o.length;
 d.p.forEach(p=>{const q=p[2];if(q.some((v,i)=>i&&Math.hypot(v[0]-q[i-1][0],v[1]-q[i-1][1])>4))o+='<polyline points="'+q.map(v=>v.join(',')).join(' ')+'" fill="none" stroke="'+p[1]+'" stroke-width="2.5" stroke-dasharray="6 5" opacity=".8"/>';});
 const b=d.bal;o+=balBaan(d,b);
 const rm=rolMap(d);
 d.p.filter(p=>!isObj(p)).forEach(p=>{const q=p[2],to=dest[p[0]]||q[0],vs=q.length===7?[...q,q[6]]:[...q,q[3],to,to,q[0]],vx=vs.map(v=>v[0]).join(';'),vy=vs.map(v=>v[1]).join(';');
  const ty=S2D.tdy(p[0],17,11),an=(n,v)=>'<animate attributeName="'+n+'" values="'+v+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>';
  o+='<g>'+S2D.tok(q[0][0],q[0][1],p[0],p[1],17,{fs:11,a:an('cx',vx)+an('cy',vy),ta:an('x',vx)+an('y',vs.map(v=>v[1]+ty).join(';'))})
   +(rm[p[0]]?'<text font-size="18" font-weight="900" text-anchor="middle" fill="#fff" stroke="#1d1d1b" stroke-width="6" stroke-linejoin="round" paint-order="stroke" x="'+q[0][0]+'" y="'+(q[0][1]+40)+'"><animate attributeName="x" values="'+vx+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="y" values="'+vs.map(v=>v[1]+40).join(';')+'" keyTimes="'+kt+'" dur="'+D+'s" repeatCount="indefinite"/>'+rm[p[0]]+'</text>':'')+'</g>';});
 const still=b.every(x=>x[0]===b[0][0]&&x[1]===b[0][1]);if(still)return o+'</svg>';
 const bs=b.length===6?[...b,b[5],b[5]]:[...b,b[4],b[4],b[0]];
 o+='<circle r="10" fill="#ffd60a" stroke="#1f5fd1" stroke-width="2.5" cx="'+b[0][0]+'" cy="'+b[0][1]+'"><animate attributeName="cx" values="'+bs.map(v=>v[0]).join(';')+'" keyTimes="'+(b.length===6?kt:kb)+'" dur="'+D+'s" repeatCount="indefinite"/><animate attributeName="cy" values="'+bs.map(v=>v[1]).join(';')+'" keyTimes="'+(b.length===6?kt:kb)+'" dur="'+D+'s" repeatCount="indefinite"/></circle>';
 if(d.baan){const G=Math.min(4,Math.max(1,v.groepen)),grp=o.slice(i0);o=o.slice(0,i0);
  for(let g=0;g<G;g++){o+='<g transform="translate('+((g-(G-1)/2)*85)+',0)">'+grp+'</g>';if(g<G-1)o+='<line x1="'+(280+(g-(G-1)/2)*85+42.5)+'" y1="40" x2="'+(280+(g-(G-1)/2)*85+42.5)+'" y2="640" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="3 7"/>';}}
 return o+'</svg>';
}
const LEGS='<p class="leg"><span><i style="background:#ffd60a;box-shadow:inset 0 0 0 2px #1f5fd1"></i>bal</span><span><i style="background:#ffcc00"></i>eigen team</span><span><i style="background:#c084fc"></i>spelverdeler</span><span><i style="background:#34d399"></i>libero of verdediger</span><span><i style="background:#fb923c"></i>blok</span><span><i style="background:#f87171"></i>overkant</span><span><i style="background:#2dd4bf"></i>trainer</span><span><i class="ln"></i>looplijn</span></p>';
const LEGP='<p class="leg"><span>Onder elke speler staat zijn positie uit jouw groep (SV, DIA, PL, MID, LIB).</span></p>';
const ROLT={
 warming:{sv:'Warm je handen en vingers op en let tijdens het lopen al op de plek van je teamgenoten.',dia:'Warm je schouder en sprongen op en maak lange loopbewegingen vanaf de buitenkant.',pl:'Beweeg veel: versnel en rem af, praat en neem de bal aan met stabiele armen.',mid:'Werk aan snelle voeten langs het net: sluit aan, spring en land stevig.',lib:'Blijf laag en beweeglijk en train je eerste aanraking.'},
 inspelen:{sv:'Speel steeds hoog en voor; kijk eerst naar de pass en dan naar het net.',dia:'Bouw je loop en slag rustig op; richt op controle voor kracht.',pl:'Pass hoog en breed naar de spelverdeler en loop daarna direct aan.',mid:'Wees aanspeelbaar met een korte aanloop en een vlakke, snelle slag.',lib:'Neem de eerste bal, controleer en pass hoog naar de spelverdeler.'},
 sideout:{sv:'Loop direct naar het net, kijk naar de pass en kies de aanvaller met de beste kans; zet vlak langs het net op.',dia:'Wees klaar voor een hoge bal aan de rand, kies de richting en spring volledig.',pl:'Neem de service aan, pass naar het doel en ga direct aanvallen.',mid:'Bied je aan voor de snelle bal en maak bij een slechte pass ruimte voor de buitenspeler.',lib:'Neem de moeilijke servicezones, pass hoog naar het net en help bij onzekere ballen.'},
 service:{sv:'Loop na de pass direct naar het net en kies de aanvaller met de beste kans.',dia:'Serveer gericht op een zone of op een speler en ga meteen naar je veldpositie.',pl:'Pass zodat de bal na één stap bij de spelverdeler komt en roep wie de bal neemt.',mid:'Blijf bij het net en wees de snelle optie na een goede pass.',lib:'Je bent het anker in de pass: roep, neem de ruimte tussen de buitenspelers en pass hoog.'},
 aanval:{sv:'Wissel bewust van aanvaller en zet op de juiste hoogte en plek in het net.',dia:'Sla vanuit positie 2 en vanuit achter de driemeterlijn; varieer scherp, diagonaal en lijn.',pl:'Neem een goede aanloop na de pass en sla op het tempo van de spelverdeler.',mid:'Loop een snelle of kruisaanval; timing met de spelverdeler en een korte, scherpe slag.',lib:'Je slaat niet aan; pass, dek de aanval en let op de afgeslagen bal.'},
 blok:{sv:'Blokkeer als tweede bal of zet na de verdediging direct op; kijk naar de bal.',dia:'Blokkeer op de buitenaanvaller, lees de handen en beweeg je schouders voorbij het net.',pl:'Zet je blok hoog en dicht bij het net en sluit aan bij het midden.',mid:'Jouw blok is de basis: lees de spelverdeler, schuif zijwaarts en sluit het blok met de buitenspeler.',lib:'Dek achter het blok en neem de bal die langs of over het blok komt.'},
 verdediging:{sv:'Verdedig op je positie tot de bal gespeeld is, zet daarna direct op en loop naar het net.',dia:'Neem je deel van de verdediging en speel de bal hoog terug.',pl:'Blijf laag, lees de slag en speel de bal speelbaar naar het midden van het net.',mid:'Dek na je blok de bal vlak achter het blok en kom daarna meteen terug voor de aanval.',lib:'Leid de verdediging: roep je teamgenoten, lees de schouder van de slagman en neem de moeilijke ballen.'},
 transitie:{sv:'Schakel direct van verdedigen naar opzetten en bied je teamgenoten een goede bal.',dia:'Schakel snel om van blok naar aanval en maak je klaar voor een hoge bal.',pl:'Loop na de verdediging snel aan, pass op de spelverdeler en ga aanvallen.',mid:'Kom na het blok snel naar de aanval en wees aanspeelbaar voor de snelle bal.',lib:'Je stuurt de omschakeling: pass de verdedigde bal hoog naar het net en loop door.'}
};
function rolTaken(d){
 const th=d.thema.find(t=>t!=='warming'&&t!=='inspelen')||d.thema[0],rs=T.pm?ROLV.filter(k=>T.R[k]>0):Object.keys(reqOf(d)||{});
 if(!rs.length||!ROLT[th])return '';
 return '<h4>Opdracht per positie</h4><ul>'+ROLV.filter(k=>rs.includes(k)).map(k=>'<li><b>'+ROL[k]+':</b> '+esc(ROLT[th][k])+'</li>').join('')+'</ul>';
}
const THOPT=v=>'<option value="all">Gemengd</option>'+Object.entries(THEMA).map(([k,n])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+n+'</option>').join('');
const ul=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
function detail(d,open){
 return '<div class="dt"><p>'+esc(d.opzet)+'</p>'
  +(d.doel?'<h4>Doel</h4><p>'+esc(d.doel)+'</p>':'')
  +'<h4>Verloop</h4><ol class="stpol">'+d.stappen.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
  +(d.aandacht.length?'<h4>Aandachtspunten</h4>'+ul(d.aandacht):'')+rolTaken(d)
  +(d.variatie?'<details'+(open?' open':'')+'><summary>Variatie</summary><p>'+esc(d.variatie)+'</p></details>':'')+'</div>';
}
function chips(d){const v=verdeling(d);return '<span class="chip">± '+d.min+' min</span><span class="chip'+(v.kort?' warn':'')+'">'+(team(d)?'vanaf 4 spelers':d.allen?'vanaf '+d.need+' spelers':d.need+' spelers per groep')+'</span>'+(d.zb?'<span class="chip">zonder bal</span>':'')+Object.entries(reqOf(d)||{}).map(([k,c])=>'<span class="chip">'+ROL[k].toLowerCase()+(c>1?' ×'+c:'')+'</span>').join('')+d.thema.map(t=>'<span class="chip">'+esc(THEMA[t])+'</span>').join('');}
function render(){
 let t0=0;
 $('s_out').innerHTML=T.slots.map((items,b)=>{const start=t0,len=BLEN[b],sum=items.reduce((a,d)=>a+d.min,0);t0+=len;
  return '<section class="blk"><div class="tm" title="Start na '+start+' minuten"><div>'+start+'<small>min</small></div></div><div class="bc"><div class="bh"><h2>'+BNAAM[b]+'</h2><span>'+len+' minuten, ingepland ± '+sum+'</span></div><div class="row noprint bth"><label for="th'+b+'">Thema</label><select id="th'+b+'" onchange="senTh('+b+',this.value)">'+THOPT(T.th[b])+'</select></div>'
  +items.map((d,i)=>{const pinned=T.pins.has(d.id);return '<div class="dr'+(pinned?' pin':'')+'" data-oid="'+esc(d.id)+'"><div class="dh"><h3>'+esc(d.t)+'</h3><div class="tools noprint">'
   +'<button class="'+(pinned?'on':'')+'" aria-pressed="'+pinned+'" onclick="senPin(\''+d.id+'\')">'+(pinned?'Vastgezet':'Vastzetten')+'</button>'
   +'<button onclick="senSwap('+b+','+i+')">Wissel</button><button onclick="senPick('+b+','+i+')">Kies zelf</button>'
   +'<button aria-label="Verwijder '+esc(d.t)+'" onclick="senDel('+b+','+i+')">Verwijder</button></div></div>'
   +'<div class="meta">'+chips(d)+'</div><div class="body"><div>'+badge(d)+stpWrap(d,anim(d))+LEGS+(T.pm?LEGP:'')+'</div><div><p class="plan">'+esc(plan(d))+'</p>'+detail(d,false)+'</div></div></div>';}).join('')
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
 $('s_plist').innerHTML=L.length?L.map(d=>'<button '+(inT.has(d.id)?'disabled ':'')+'onclick="senTake(\''+d.id+'\')"><b>'+esc(d.t)+'</b><span>'+(d.zb?'zonder bal, ':'')+esc(d.thema.map(t=>THEMA[t]).join(', '))+', '+(team(d)?'vanaf 4':d.need)+' spelers, ± '+d.min+' min'+(reqOf(d)?', met '+Object.keys(reqOf(d)).map(k=>ROL[k].toLowerCase()).join(', '):'')+(ontbreekt(d).hard.length?', jouw groep mist een positie':'')+(inT.has(d.id)?', staat al in de training':'')+'</span></button>').join(''):'<p class="note">Geen oefening gevonden voor dit blok.</p>';};
window.senTake=id=>{const d=byId.get(id),{b,i}=PK;if(i<0)T.slots[b].push(d);else{T.pins.delete(T.slots[b][i].id);T.slots[b][i]=d;}$('s_pick').close();render();};
function asText(){let t='Training jeugd/senioren (90 min, '+T.n+' spelers'+(T.pm?': '+ROLV.filter(k=>T.R[k]).map(k=>T.R[k]+' '+ROL[k].toLowerCase()).join(', '):'')+')\n',t0=0;
 T.slots.forEach((items,b)=>{t+='\n'+t0+' min – '+BNAAM[b]+' ('+BLEN[b]+' min'+(T.th[b]==='all'?'':', '+THEMA[T.th[b]])+')\n';t0+=BLEN[b];items.forEach(d=>t+='• '+d.t+'\n');});
 return t+'\nVV Woudenberg trainingsapp';}
window.senShare=()=>{const t=asText();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Training gekopieerd als tekst'),()=>{const e=$('s_box');e.style.display='';e.value=t;e.select();toast('Selecteer en kopieer de tekst');});};
const KEY='vvw.senioren.bewaard';
function savedUI(){const L=LS.get(KEY,[]);$('s_saved').innerHTML=L.map((s,i)=>'<div class="row"><button style="flex:3" onclick="senLoad('+i+')">'+esc(s.name)+'</button><button aria-label="Verwijder '+esc(s.name)+'" onclick="senForget('+i+')">×</button></div>').join('');if(window.vvwAcc)vvwAcc.ui();}
window.senSavedUI=()=>{if($('s_saved'))savedUI();};
window.senSave=()=>{if(!T.slots.flat().length){toast('Deze training is nog leeg');return;}const name=$('s_name').value.trim()||'Training '+new Date().toLocaleDateString('nl-NL');
 const L=LS.get(KEY,[]);L.unshift({name,th:T.th.slice(),n:T.n,pm:T.pm,R:Object.assign({},T.R),slots:T.slots.map(a=>a.map(d=>d.id))});if(LS.set(KEY,L.slice(0,20))){toast(window.vvwAcc&&vvwAcc.aan()?'Training bewaard (ook online)':'Bewaard op dit apparaat');$('s_name').value='';savedUI();if(window.vvwAcc)vvwAcc.bewaard();}else toast('Bewaren lukt niet in deze browser');};
window.senLoad=i=>{const s=LS.get(KEY,[])[i];if(!s)return;const old=s.slots.length===5;T.th=Array.isArray(s.th)?s.th.slice():BLOK.map(()=>'all');if(old){T.th.splice(1,0,'all');s.slots.splice(1,0,[]);}T.n=Math.max(NMIN,Math.min(NMAX,s.n||12));T.pm=!!s.pm&&!!s.R;if(T.pm){T.R=Object.assign({sv:0,dia:0,pl:0,mid:0,lib:0},s.R);T.n=Math.max(NMIN,Math.min(NMAX,rsum(T.R)));}T.slots=s.slots.map(a=>a.map(id=>byId.get(id)).filter(Boolean));T.pins=new Set();controls();render();toast('Training geladen');};
window.senForget=i=>{const L=LS.get(KEY,[]);L.splice(i,1);LS.set(KEY,L);savedUI();if(window.vvwAcc)vvwAcc.bewaard();};
function controls(){
 const same=T.th.every(x=>x===T.th[0]);$('s_th').value=same?T.th[0]:'mix';$('s_n').value=T.n;$('s_nv').textContent=T.n;
 $('s_pm').checked=T.pm;$('s_slw').style.display=T.pm?'none':'';$('s_pos').style.display=T.pm?'':'none';
 $('s_pos').innerHTML=ROLV.map(k=>'<div class="prow"><span>'+ROL[k]+'</span><button aria-label="Minder '+ROL[k].toLowerCase()+'" onclick="senRol(\''+k+'\',-1)"'+(T.R[k]<=0?' disabled':'')+'>−</button><b>'+T.R[k]+'</b><button aria-label="Meer '+ROL[k].toLowerCase()+'" onclick="senRol(\''+k+'\',1)"'+(T.R[k]>=ROLMAX[k]||rsum(T.R)>=NMAX?' disabled':'')+'>+</button></div>').join('')
  +'<p class="note" style="margin:4px 0 0">Totaal: <b>'+rsum(T.R)+'</b> spelers'+(rsum(T.R)<NMIN?' (minimaal '+NMIN+')':'')+'</p>'+geenPos();
}
// Wat doet de app als een positie ontbreekt? Kort uitgelegd onder de keuze
function geenPos(){if(!T.pm)return '';const R=T.R,t=[];
 if(!R.sv)t.push('Geen spelverdeler: oefeningen met een vaste spelverdeler vallen af. Bij 6 tegen 6 zet de trainer of een buitenspeler op.');
 if(!R.mid)t.push('Geen midden: oefeningen met een vaste middenspeler vallen af.');
 const mis=[!R.dia&&'diagonaal',!R.lib&&'libero'].filter(Boolean).join(' en ');
 if(mis)t.push(R.pl?'Geen '+mis+': een buitenspeler neemt die plek over.':'Geen '+mis+' en geen buitenspelers: oefeningen met een vaste '+mis.replace(' en ',' of ')+' vallen af.');
 if(!R.pl)t.push('Geen buitenspelers: de andere spelers vullen die plekken in.');
 return t.length?'<ul class="note geenpos">'+t.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'';}
// groep per positie: aantal spelers volgt uit de posities
window.senRol=(k,dl)=>{const v=T.R[k]+dl;if(v<0||v>ROLMAX[k]||(dl>0&&rsum(T.R)>=NMAX))return;T.R[k]=v;T.n=Math.max(NMIN,rsum(T.R));controls();fit();render();};
window.senPm=on=>{T.pm=on;if(on){T.R=defR(T.n);T.n=Math.max(NMIN,rsum(T.R));}controls();fit();render();};
// thema van één blok wijzigen: dat blok wordt opnieuw gevuld (vastgezette oefeningen blijven)
window.senTh=(b,v)=>{T.th[b]=v;const u=new Set(T.slots.flat().map(d=>d.id)),keep=T.slots[b].filter(d=>T.pins.has(d.id));
 T.slots[b].forEach(d=>{if(!T.pins.has(d.id))u.delete(d.id);});T.slots[b]=fill(b,u,keep);controls();render();};
const CSS='.prow{display:flex;align-items:center;gap:8px;margin:4px 0}.prow span{flex:1}.prow b{min-width:1.5em;text-align:center}.prow button{width:36px;min-height:36px;padding:0}.pmt{display:flex;align-items:center;gap:8px;margin-top:12px}.pmt input{width:auto}.geenpos{margin:6px 0 0;padding-left:18px}.geenpos li{margin:2px 0}';
function build(){
 if(!document.getElementById('s_css')){const st=document.createElement('style');st.id='s_css';st.textContent=CSS;document.head.appendChild(st);}
 const v=$('v_sen');
 v.innerHTML='<aside class="card noprint"><p class="note" style="margin:0 0 12px">Een training voor jeugd en senioren duurt 90 minuten op 1 veld.</p>'
  +'<label class="t" for="s_th">Thema voor alle blokken</label><select id="s_th">'+THOPT('all')+'<option value="mix" disabled>Per blok gekozen</option></select>'
  +'<p class="note" style="margin:4px 0 0">Bij elk blok kun je ook een eigen thema kiezen, zo combineer je thema\'s.</p>'
  +'<div id="s_slw"><label class="t" for="s_n">Aantal spelers: <b id="s_nv">12</b></label><input type="range" id="s_n" min="'+NMIN+'" max="'+NMAX+'" value="12"></div>'
  +'<label class="t pmt"><input type="checkbox" id="s_pm" onchange="senPm(this.checked)"> Posities opgeven (wie is er?)</label><div id="s_pos" style="display:none"></div>'
  +'<p class="note" style="margin:4px 0 0">Met posities kiest de app oefeningen die passen bij wie er is: spelverdeler, midden, buiten, diagonaal en libero. Zet een positie op 0 als die er niet is.</p>'
  +'<button class="go" onclick="senGen()">Nieuwe training</button><button class="quiet" onclick="window.print()">Training printen</button><p class="note" id="s_info"></p><hr>'
  +'<label class="t" for="s_name">Deze training bewaren</label><div class="row"><input type="text" id="s_name" maxlength="40" placeholder="Naam, bijv. dinsdag dames 2"><button onclick="senSave()">Bewaar</button></div><div id="s_saved"></div>'
  +'<label class="t">Delen met een trainer</label><div class="row"><button onclick="senShare()">Kopieer als tekst</button></div><textarea id="s_box" readonly style="display:none" aria-label="Gekopieerde tekst"></textarea></aside>'
  +'<main><div id="s_out"></div><details class="card noprint" style="margin-top:6px"><summary><b>Alle oefeningen</b></summary><div class="lib" id="s_lib"></div></details>'
  +'<p class="note">Oefeningen voor jeugd en senioren zijn eigen beschrijvingen van VV Woudenberg. De trainer bepaalt zelf of een oefening past bij het niveau van de groep. De animatie toont de opstelling op een heel veld; het eigen team staat onder het net.</p></main>'
  +'<dialog id="s_pick"><div class="pkh"><h2>Kies een oefening <button onclick="this.closest(\'dialog\').close()">Sluiten</button></h2><div class="row"><input type="text" id="s_pq" placeholder="Zoek op naam" oninput="senPickList()" aria-label="Zoek op naam"><select id="s_pb" onchange="senPickList()" aria-label="Blok">'+BNAAM.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select></div></div><div id="s_plist"></div></dialog>';
 $('s_th').onchange=e=>{T.th=BLOK.map(()=>e.target.value);gen();};
 $('s_n').oninput=e=>{T.n=+e.target.value;$('s_nv').textContent=T.n;};
 $('s_n').onchange=e=>{T.n=+e.target.value;$('s_nv').textContent=T.n;fit();render();toast('Training aangepast aan '+T.n+' spelers');};
 controls();savedUI();gen();T.built=true;
}
// bij minder spelers: niet-vastgezette oefeningen die te veel spelers vragen automatisch vervangen
// ander aantal spelers of andere posities: niet-vastgezette oefeningen die niet (meer) passen vervangen
// (te veel spelers nodig, een positie die ontbreekt, of te veel spelers in de rij)
function fit(){const u=new Set(T.slots.flat().map(d=>d.id)),goed=d=>d.need<=T.n&&okR(d)&&okF(d);
 T.slots.forEach((items,b)=>items.forEach((d,i)=>{if(T.pins.has(d.id)||goed(d))return;
  const th=T.th[b],zelfTh=th!=='all'&&d.thema.includes(th);
  const p=pool(b).filter(x=>!u.has(x.id)&&goed(x)&&(!zelfTh||x.thema.includes(th)));if(p.length){const x=rnd(p);u.delete(d.id);u.add(x.id);items[i]=x;}}));}
window.senGen=gen;window.senAnim=anim;window.__sen={T,verdeling,okF,ontbreekt,reqOf};
window.senView=()=>{if(!T.built)build();};
// ---------- stap voor stap afspelen (Vorige / Afspelen / Volgende / Opnieuw / Groot) ----------
// De animatie duurt 9 s; elke stap is één balbeweging. Stapgrenzen in fracties van de looptijd.
const STB=[0,.15,.3,.45,.6,.82],STD=9,STS=new WeakMap();
function stpLabels(d){const v=verdeling(d),o=doorOrder(d),l=d.stappen.slice(0,4).map(String),h=l.map((x,i)=>i);
 if(d.bal.length===6){l.push(d.stappen[d.stappen.length-1]);h.push(h.length-1);}
 else if(o.length>1||(o.length&&v.rij)){l.push('Doordraaien: iedereen schuift een plek door.');h.push(-1);}
 return {l,h};}
function stpWrap(d,svg){const {l,h}=stpLabels(d);
 return '<div class="stp" data-senid="'+d.id+'" data-l="'+esc(JSON.stringify(l))+'" data-h="'+esc(JSON.stringify(h))+'">'+svg
  +'<div class="stpbar noprint" role="group" aria-label="Animatie bedienen">'
  +'<button type="button" data-stp="prev" aria-label="Vorige stap">&lsaquo;<span class="stpt"> Vorige</span></button>'
  +'<button type="button" data-stp="play" class="stpp" aria-label="Pauze">&#10074;&#10074;</button>'
  +'<button type="button" data-stp="next" aria-label="Volgende stap">Volgende &rsaquo;</button>'
  +'<button type="button" data-stp="reset" aria-label="Opnieuw vanaf de beginopstelling">&#8634;</button>'
  +'<button type="button" data-stp="full" aria-label="Groot scherm">&#10530;</button></div>'
  +'<p class="stpcap noprint" aria-live="polite"></p></div>';}
(function(){
 const st=el=>{let s=STS.get(el);if(!s){s={mode:'play',step:0,stop:null};STS.set(el,s);}return s;};
 const svgOf=el=>el.querySelector('svg.senv'),N=el=>JSON.parse(el.dataset.l||'[]').length;
 const now=sv=>{try{return sv.getCurrentTime()%STD;}catch(e){return 0;}};
 const stepAt=(f,n)=>{for(let i=1;i<=n;i++)if(f<STB[i]*STD)return i;return 0;};
 const setT=(sv,t)=>{try{sv.setCurrentTime(t);}catch(e){}};
 function playStep(el,i){const sv=svgOf(el),s=st(el);if(!sv)return;s.mode='step';s.step=i;sv.pauseAnimations();
  if(i<=0){setT(sv,0);s.stop=null;return;}setT(sv,STB[i-1]*STD+.001);s.stop=STB[i]*STD;sv.unpauseAnimations();}
 function act(el,a){const sv=svgOf(el),s=st(el),n=N(el);if(!sv)return;
  if(a==='play'){if(s.mode==='play'){sv.pauseAnimations();s.mode='pause';}else{s.mode='play';s.stop=null;sv.unpauseAnimations();}}
  else if(a==='next'){if(s.mode==='play'||s.mode==='pause'){const c=stepAt(now(sv),n);if(c>0){s.mode='step';s.step=c;s.stop=STB[c]*STD;sv.unpauseAnimations();}else playStep(el,1);}
   else playStep(el,s.step>=n?1:s.step+1);}
  else if(a==='prev'){const c=s.mode==='step'?s.step:stepAt(now(sv),n);playStep(el,Math.max(0,c-1));}
  else if(a==='reset')playStep(el,0);
  else if(a==='full')full(el);
  tick();}
 function full(el){let f=document.getElementById('stpFull');
  if(!f){f=document.createElement('div');f.id='stpFull';f.className='noprint';f.setAttribute('role','dialog');f.setAttribute('aria-modal','true');f.setAttribute('aria-label','Animatie groot');document.body.appendChild(f);}
  const box=el.closest('.dr,.owdetail'),t=box?((box.querySelector('h3,h2')||{}).textContent||''):'';
  f.innerHTML='<div class="stpfh"><b>'+esc(t)+'</b><button type="button" data-stp="close" aria-label="Sluiten">&#10005; Sluiten</button></div>'
   +el.outerHTML.replace(/\bid="([^"]+)"/g,'id="$1_f"').replace(/url\(#([^)]+)\)/g,'url(#$1_f)');
  f.style.display='flex';document.body.style.overflow='hidden';const b=f.querySelector('[data-stp=close]');if(b)b.focus();}
 function close(){const f=document.getElementById('stpFull');if(f){f.style.display='none';f.innerHTML='';document.body.style.overflow='';}}
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-stp]');
  if(b){e.preventDefault();e.stopPropagation();if(b.dataset.stp==='close')return close();const el=b.closest('.stp');if(el)act(el,b.dataset.stp);return;}
  const li=e.target.closest('ol.stpol>li');
  if(li){const body=li.closest('.body'),el=body&&body.querySelector('.stp');if(!el)return;const idx=[...li.parentNode.children].indexOf(li),h=JSON.parse(el.dataset.h||'[]'),i=h.indexOf(idx);if(i>=0)playStep(el,i+1);tick();}
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 function tick(){document.querySelectorAll('.stp').forEach(el=>{if(!el.offsetParent&&!el.closest('#stpFull'))return;const sv=svgOf(el);if(!sv)return;
  const s=st(el),n=N(el),t=now(sv);
  if(s.mode==='step'&&s.stop!=null&&(t>=s.stop-.02||t<STB[Math.max(0,s.step-1)]*STD-.05)){sv.pauseAnimations();setT(sv,s.stop);s.stop=null;}
  const i=s.mode==='step'?s.step:stepAt(t,n),L=JSON.parse(el.dataset.l||'[]'),H=JSON.parse(el.dataset.h||'[]');
  const cap=i>0?'<b>Stap '+i+' van '+n+'</b> '+esc(L[i-1]||''):(s.mode==='step'?'<b>Beginopstelling</b> Druk op Volgende voor stap 1.':'<b>Terug naar de beginopstelling</b>');
  const c=el.querySelector('.stpcap');if(c&&c._h!==cap){c._h=cap;c.innerHTML=cap;}
  const pb=el.querySelector('.stpp'),pl=s.mode==='play';if(pb&&pb._p!==pl){pb._p=pl;pb.innerHTML=pl?'&#10074;&#10074;':'&#9654;';pb.setAttribute('aria-label',pl?'Pauze':'Afspelen');}
  const pv=el.querySelector('[data-stp=prev]');if(pv){const dis=s.mode==='step'&&s.step===0;if(pv.disabled!==dis)pv.disabled=dis;}
  const body=el.closest('.body'),ol=body&&body.querySelector('ol.stpol');
  if(ol){const k=i>0?H[i-1]:-1;[...ol.children].forEach((li,j)=>{const on=j===k;if(li.classList.contains('stpon')!==on)li.classList.toggle('stpon',on);});}
 });}
 setInterval(tick,100);
})();

})();
