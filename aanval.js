// aanval.js – tabblad Aanval: het aanvalssysteem van de club (code = plek + snelheid) met animaties,
// en een plek om zelf aanvalscombinaties te maken, af te spelen, op te slaan (in deze browser) en te delen (link).
// De bal vliegt als een echte set: een parabool met de zwaartekracht, met een hoogste punt dat bij de snelheid hoort.
// Zo is de vliegtijd ook echt: een 1 is kort en vlak, een 3 hoog en lang. Te zien in 3D, in "Hoogte"
// (vooraanzicht vanaf de achterlijn) en van boven. Het 3D-beeld gebruikt de bouwstenen van 3d.js (three.js r128, cdnjs).
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl=(v,d)=>v.toFixed(d==null?1:d).replace('.',',');
const G=9.81;
// veld in meters: x van links (-4,5, kant van positie 4) naar rechts (+4,5), z van het net (0) naar de achterlijn (9).
// We kijken vanaf de eigen achterlijn naar het net, de spelverdeler staat rechts van het midden.
const SV=[1.2,.6],LIB=[-1.1,6.6];
const PLEK={
 '5':{x:-4.1,rij:'v',naam:'buiten, bij de linker antenne'},
 '4':{x:-3.0,rij:'v',naam:'iets binnen de linker antenne'},
 '3':{x:-1.8,rij:'v',naam:'tussen buiten en midden in'},
 '2':{x:-.6,rij:'v',naam:'een stukje voor de spelverdeler'},
 '1':{x:.4,rij:'v',naam:'vlak voor de spelverdeler (midden)'},
 'A':{x:2.0,rij:'a',naam:'achterover, dichtbij de spelverdeler'},
 'B':{x:3.0,rij:'a',naam:'achterover, verder van de spelverdeler'},
 'C':{x:4.1,rij:'a',naam:'achterover, bij de rechter antenne'},
 '7':{x:-3.0,rij:'b',naam:'achteraanval links (zelden)'},
 '8':{x:0,rij:'b',naam:'pipe: achteraanval in het midden'},
 '9':{x:3.0,rij:'b',naam:'dia achteraanval rechts'}};
const VOOR=['5','4','3','2','1'],ACHTER=['A','B','C'],ACHTERAANVAL=['7','8','9'];
const SNEL={
 '1':{naam:'heel snel',uitleg:'De bal gaat bijna recht en net boven de netband naar de aanvaller. De aanvaller springt al als de spelverdeler de bal raakt.'},
 '2':{naam:'normaal',uitleg:'Een boog van ongeveer 2 meter boven de netband. De aanvaller begint aan te lopen als de bal de handen van de spelverdeler verlaat.'},
 '3':{naam:'hoog',uitleg:'Een hoge boog. De aanvaller heeft veel tijd om aan te lopen: de veilige bal na een slechte pass.'}};
const ROL={
 BU:{naam:'Buitenaanvaller',kort:'Buiten',c:'#ffd100'},
 MI:{naam:'Middenaanvaller',kort:'Midden',c:'#c084fc'},
 DI:{naam:'Diagonaal',kort:'Diagonaal',c:'#fb7185'},
 AC:{naam:'Achterspeler',kort:'Achter',c:'#f97316'}};
const C_SV='#38bdf8',C_LIB='#34d399';
const rolVan=code=>{const p=code[0];return '12AB'.includes(p)?'MI':'345'.includes(p)?'BU':p==='C'||p==='9'?'DI':p==='7'?'BU':'AC';};
const geldig=code=>/^[1-5ABC789][123]$/.test(code||'');
const tekst=code=>'Snelheid '+code[1]+' ('+SNEL[code[1]].naam+'), '+PLEK[code[0]].naam;
const ALLE=[...VOOR,...ACHTER,...ACHTERAANVAL].flatMap(p=>['1','2','3'].map(s=>p+s));

// ---------- natuurkunde van de bal ----------
// parabool van a naar b ([x,hoogte,z]) met hoogste punt H; vliegtijd volgt uit de zwaartekracht
function boog(a,b,H){
 H=Math.max(H,a[1]+.02,b[1]+.02);
 const tu=Math.sqrt(2*(H-a[1])/G),td=Math.sqrt(2*(H-b[1])/G),T=tu+td,vy=G*tu;
 return {T,H,a,b,at:t=>{const u=Math.max(0,Math.min(T,t));return [a[0]+(b[0]-a[0])*u/T,a[1]+vy*u-G*u*u/2,a[2]+(b[2]-a[2])*u/T];}};
}
const RAAK=[SV[0],2.55,SV[1]+.05]; // waar de spelverdeler de bal speelt
// beginplek hoort bij de rol (waar de speler normaal aanvalt), niet bij de code:
// buiten komt van links buiten het veld (positie 4), midden vanuit het midden, diagonaal van rechts buiten het veld,
// een achteraanval begint achter in het veld aan de kant van de code
const START={BU:[-5.0,3.7],MI:[.1,3.1],DI:[5.0,3.7],AC:[0,6.2]};
function plekken(code,rol){
 const p=PLEK[code[0]];rol=ROL[rol]?rol:rolVan(code);
 let S,K,H,Lp;
 if(p.rij==='b'){S=[rol==='BU'?Math.min(p.x,-3.0):rol==='DI'?Math.max(p.x,3.0):p.x,7.4];K=[p.x+(S[0]-p.x)*.15,3.9];H=[p.x,2.95,3.25];Lp=[p.x,3.0];}
 else{
  S=START[rol].slice();
  const dx=S[0]-p.x,dz=S[1]-1.15,L=Math.hypot(dx,dz)||1;
  K=[p.x+dx/L*.35,1.15];H=[p.x,3.0,.45];Lp=[p.x,.55];}
 const d=Math.hypot(H[0]-RAAK[0],H[2]-RAAK[2]),s=code[1];
 const top=s==='1'?H[1]+.03+.02*d:s==='2'?4.4+.05*d:5.8+.05*d;
 return {S,K,H,Lp,set:boog(RAAK,H,top)};
}
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const lerp2=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];

// één rally: service, pass, set naar aanvaller j, aanval; alle aanvallers lopen hun eigen aanloop (ook de lokkers)
function rally(aan,j){
 const srv=boog([.8,2.9,-9.9],[LIB[0],.85,LIB[1]],3.7),t0=.3,Tp=t0+srv.T;
 const pass=boog([LIB[0],.85,LIB[1]],RAAK,4.3),Ts=Tp+pass.T;
 const P=aan.map(a=>Object.assign({},a,plekken(a.code,a.rol)));
 P.forEach(p=>{p.Tc=Ts+p.set.T;});
 const doel=P[j],Tc=doel.Tc,eind=Math.max(...P.map(p=>p.Tc))+.4,terug=eind+.5,L=terug+1.2;
 const land=[doel.H[0]*.55+(doel.H[0]>0?-.6:.6),.11,-5.6],Tl=Tc+.38;
 const ball=t=>{
  if(t<t0)return [.8,2.9,-9.9];
  if(t<Tp)return srv.at(t-t0);
  if(t<Ts)return pass.at(t-Tp);
  if(t<Tc)return doel.set.at(t-Ts);
  if(t<Tl){const u=(t-Tc)/(Tl-Tc);return [doel.H[0]+(land[0]-doel.H[0])*u,doel.H[1]+(land[1]-doel.H[1])*u-.3*u*(1-u),doel.H[2]+(land[2]-doel.H[2])*u];}
  if(t<terug+.6)return land;
  return null;};
 const actors=P.map(p=>{
  const tK=p.Tc-.32,tA=tK-Math.max(.93,Math.hypot(p.K[0]-p.S[0],p.K[1]-p.S[1])/4.6),tL=p.Tc+.36;
  return {label:p.code,color:ROL[p.rol].c,rol:p.rol,code:p.code,S:p.S,K:p.K,
   pos:t=>{if(t<tA)return p.S;if(t<tK){const u=(t-tA)/(tK-tA);return lerp2(p.S,p.K,u*u*(2-u)*.5+u*.5);}
    if(t<tL)return lerp2(p.K,p.Lp,(t-tK)/(tL-tK));if(t<terug)return p.Lp;return lerp2(p.Lp,p.S,ease((t-terug)/(L-terug-.1)));},
   lift:t=>t>tK&&t<tL?.85*Math.sin(Math.PI*(t-tK)/(tL-tK)):0};});
 const vast=(lab,c,xz,extra)=>Object.assign({label:lab,color:c,pos:()=>xz,lift:()=>0},extra||{});
 const all=[vast('SV',C_SV,SV,{lift:t=>Math.abs(t-Ts)<.25&&doel.code[1]==='1'?.25*Math.cos((t-Ts)/.25*Math.PI/2):0}),vast('L',C_LIB,LIB),...actors];
 const cap=t=>t<Tp?'Service van de tegenstander':t<Ts?'Pass naar de spelverdeler':t<Tc?'Set '+doel.code+': '+SNEL[doel.code[1]].naam+', '+PLEK[doel.code[0]].naam
  :t<eind?'Aanval met '+doel.code+' door de '+ROL[doel.rol].naam.toLowerCase():'Terug naar de beginplek';
 return {L,Ts,Tc,ball,actors:all,cap,doel,setT:doel.set.T,top:doel.set.H,setAt:doel.set.at};
}
// plan: één of meer rally's achter elkaar ("om de beurt": iedereen krijgt een keer de bal)
function plan(aan,doel){
 const R=(doel==='b'?aan.map((a,i)=>i):[Math.min(+doel||0,aan.length-1)]).map(j=>rally(aan,j));
 let o=0;R.forEach(r=>{r.o=o;o+=r.L;});const dur=o;
 const at=t=>{t=((t%dur)+dur)%dur;for(const r of R)if(t<r.o+r.L)return [r,t-r.o];return [R[R.length-1],t-R[R.length-1].o];};
 const n=R[0].actors.length;
 const actors=R[0].actors.map((a,i)=>({label:a.label,color:a.color,rol:a.rol,code:a.code,S:a.S,K:a.K,pos:t=>{const [r,u]=at(t);return r.actors[i].pos(u);},lift:t=>{const [r,u]=at(t);return r.actors[i].lift(u);}}));
 return {dur,R,n,actors,at,ball:t=>{const [r,u]=at(t);return r.ball(u);},cap:t=>{const [r,u]=at(t);return r.cap(u);}};
}

// ---------- three.js laden (zelfde bron als 3d.js) ----------
const SRC='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let laden=null;
function three(){
 if(window.THREE)return Promise.resolve();
 if(laden)return laden;
 laden=new Promise((res,rej)=>{const s=document.createElement('script');s.src=SRC;s.async=true;s.onload=res;s.onerror=()=>{laden=null;s.remove();rej(new Error('three.js'));};document.head.appendChild(s);});
 return laden;
}
const kan3d=()=>!!(window.__a3&&window.__a3.build);

// ---------- 2D-tekeningen ----------
const SX=29,X0=170;
const px=x=>X0+x*SX;
function hoogteSvg(P,t){
 const Y=h=>218-h*SX;
 let s='<svg viewBox="0 0 340 230" class="av-svg" role="img" aria-label="Hoogte van de bal, gezien vanaf de eigen achterlijn">';
 s+='<rect width="340" height="230" fill="#1d1d1b"/>';
 for(let h=1;h<=7;h++)s+='<line x1="8" x2="332" y1="'+Y(h)+'" y2="'+Y(h)+'" stroke="#ffffff" stroke-opacity=".07"/><text x="10" y="'+(Y(h)-2)+'" fill="#94a3b8" font-size="8">'+h+' m</text>';
 s+='<rect x="8" y="218" width="324" height="12" fill="#0a7be0"/>';
 // net met antennes
 s+='<rect x="'+px(-4.5)+'" y="'+Y(2.43)+'" width="'+(9*SX)+'" height="'+(.9*SX)+'" fill="url(#avnet)" stroke="#e5e7eb" stroke-opacity=".5"/><rect x="'+px(-4.5)+'" y="'+(Y(2.43)-2)+'" width="'+(9*SX)+'" height="4" fill="#ffd100"/>';
 [-4.5,4.5].forEach(x=>{s+='<line x1="'+px(x)+'" x2="'+px(x)+'" y1="'+Y(0)+'" y2="'+Y(2.43)+'" stroke="#94a3b8" stroke-width="2.5"/><line x1="'+px(x)+'" x2="'+px(x)+'" y1="'+Y(1.53)+'" y2="'+Y(3.23)+'" stroke="#ef4444" stroke-width="3" stroke-dasharray="5 5"/>';});
 s+='<defs><pattern id="avnet" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M6 0H0V6" fill="none" stroke="#e5e7eb" stroke-opacity=".35" stroke-width=".8"/></pattern></defs>';
 const [r,u]=P.at(t);
 // baan van de set (als stippellijn) zodra de pass onderweg is
 if(u>r.Ts-1.2){let d='';for(let i=0;i<=40;i++){const q=r.setAt(r.setT*i/40);d+=(i?'L':'M')+px(q[0]).toFixed(1)+' '+Y(q[1]).toFixed(1);}
  s+='<path d="'+d+'" fill="none" stroke="'+ROL[r.doel.rol].c+'" stroke-width="2" stroke-dasharray="5 4" opacity=".75"/>';
  const top=r.setAt(r.setT*(r.top>3.4?.5:.5));
  if(u<r.Tc+.6)s+='<text x="'+px(top[0])+'" y="'+(Y(r.top)-7)+'" fill="#fff" font-size="9" font-weight="700" text-anchor="middle">top '+nl(r.top)+' m · '+nl(r.setT,2)+' s</text>';}
 // spelers: verste (bij het net) eerst
 const L=P.actors.map(a=>({a,p:a.pos(t),h:a.lift(t)})).sort((x,y)=>x.p[1]-y.p[1]);
 L.forEach(({a,p,h})=>{const x=px(p[0]),k=.8+Math.min(1,p[1]/9)*.25,w=13*k,top=Y(h+1.55*k),arm=h>.15;
  s+='<g opacity="'+(a.label==='L'?.75:1)+'"><rect x="'+(x-w/2)+'" y="'+top+'" width="'+w+'" height="'+(1.25*k*SX)+'" rx="5" fill="'+a.color+'" stroke="#1d1d1b" stroke-width="1.5"/>';
  s+='<circle cx="'+x+'" cy="'+(top-5*k)+'" r="'+(5.5*k)+'" fill="#d9a066" stroke="#1d1d1b" stroke-width="1.2"/>';
  if(arm)s+='<line x1="'+(x+w/2-2)+'" y1="'+(top+3)+'" x2="'+(x+w/2+3)+'" y2="'+(top-16*k)+'" stroke="'+a.color+'" stroke-width="4" stroke-linecap="round"/>';
  s+='<text x="'+x+'" y="'+(top+15*k)+'" fill="#1d1d1b" font-size="'+(a.label.length>2?8:9)+'" font-weight="900" text-anchor="middle">'+esc(a.label)+'</text></g>';});
 const b=P.ball(t);
 if(b){s+='<ellipse cx="'+px(b[0])+'" cy="221" rx="5" ry="1.8" fill="#000" opacity=".45"/><circle cx="'+px(b[0])+'" cy="'+Y(b[1])+'" r="5.5" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>';}
 return s+'</svg>';
}
function bovenSvg(P,t){
 const Z=z=>26+z*SX;
 let s='<svg viewBox="0 0 340 300" class="av-svg" role="img" aria-label="Bovenaanzicht van de eigen helft">';
 s+='<rect width="340" height="300" fill="#1d1d1b"/><rect x="'+px(-4.5)+'" y="'+Z(0)+'" width="'+(9*SX)+'" height="'+(9*SX)+'" fill="#0a7be0" stroke="#fff" stroke-width="2"/>';
 s+='<rect x="'+px(-4.5)+'" y="4" width="'+(9*SX)+'" height="'+(Z(0)-4)+'" fill="#0a7be0" opacity=".45"/>';
 s+='<line x1="'+px(-4.5)+'" x2="'+px(4.5)+'" y1="'+Z(3)+'" y2="'+Z(3)+'" stroke="#bae6fd" stroke-width="1.5"/>';
 s+='<line x1="'+(px(-4.5)-8)+'" x2="'+(px(4.5)+8)+'" y1="'+Z(0)+'" y2="'+Z(0)+'" stroke="#ffd100" stroke-width="4"/>';
 [-4.5,4.5].forEach(x=>s+='<circle cx="'+px(x)+'" cy="'+Z(0)+'" r="3.5" fill="#ef4444"/>');
 Object.entries(PLEK).forEach(([k,p])=>{const z=p.rij==='b'?3.45:.2;s+='<text x="'+px(p.x)+'" y="'+(Z(z)+(p.rij==='b'?0:4))+'" fill="#fff" opacity=".45" font-size="9" font-weight="800" text-anchor="middle">'+k+'</text>';});
 const [r,u]=P.at(t);
 P.actors.forEach(a=>{if(!a.K)return;s+='<line x1="'+px(a.S[0])+'" y1="'+Z(a.S[1])+'" x2="'+px(a.K[0])+'" y2="'+Z(a.K[1])+'" stroke="'+a.color+'" stroke-width="2" stroke-dasharray="4 4" opacity=".7"/>';});
 if(u>r.Ts-1.2){const a=r.setAt(0),b=r.setAt(r.setT);s+='<line x1="'+px(a[0])+'" y1="'+Z(a[2])+'" x2="'+px(b[0])+'" y2="'+Z(b[2])+'" stroke="#fde047" stroke-width="1.5" stroke-dasharray="2 3"/>';}
 P.actors.forEach(a=>{const p=a.pos(t),h=a.lift(t),x=px(p[0]),y=Z(p[1]),R=11+h*4;
  s+='<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+a.color+'" stroke="#1d1d1b" stroke-width="2"/><text x="'+x+'" y="'+(y+3.5)+'" fill="#1d1d1b" font-size="'+(a.label.length>2?8:9.5)+'" font-weight="900" text-anchor="middle">'+esc(a.label)+'</text>';});
 const b=P.ball(t);
 if(b&&b[2]>-.8){s+='<circle cx="'+px(b[0])+'" cy="'+Z(b[2])+'" r="3" fill="#000" opacity=".45"/><circle cx="'+px(b[0])+'" cy="'+(Z(b[2])-b[1]*2.2)+'" r="'+(4+b[1]*.55)+'" fill="#fde047" stroke="#b45309" stroke-width="1.5"/>';}
 return s+'</svg>';
}

// ---------- animatieblok (3D / Hoogte / Van boven) ----------
const KEY_VIEW='vw.aanval.view';
const pref={get(){try{return localStorage.getItem(KEY_VIEW);}catch(e){return null;}},set(v){try{localStorage.setItem(KEY_VIEW,v);}catch(e){}}};
const blokken=[];
function Blok(el,titel){
 const B={el,titel,P:null,t:0,play:true,spd:1,view:pref.get()||'3d',r3:null,raf:0,last:0,vis:false,sig:''};
 el.className='av-anim';
 el.innerHTML='<div class="av-tabs" role="tablist"><button type="button" data-v="3d">3D</button><button type="button" data-v="hoogte">Hoogte</button><button type="button" data-v="boven">Van boven</button></div>'
  +'<div class="av-stage"></div><p class="av-cap" aria-live="polite"></p>'
  +'<div class="av-ctl"><button type="button" data-c="play" aria-label="Pauze">&#10074;&#10074;</button><button type="button" data-c="reset" aria-label="Opnieuw">&#8634;</button>'
  +'<button type="button" data-s=".25">0,25x</button><button type="button" data-s=".5">0,5x</button><button type="button" data-s="1">1x</button><button type="button" data-c="groot" class="av-groot">Groot en draaien</button></div>';
 B.stage=el.querySelector('.av-stage');B.capEl=el.querySelector('.av-cap');
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.v){B.view=b.dataset.v;pref.set(B.view);blokken.forEach(o=>{if(o!==B){o.view=B.view;o.sig='';marks(o);}});B.sig='';marks(B);draw(B);}
  else if(b.dataset.c==='play'){B.play=!B.play;marks(B);}
  else if(b.dataset.c==='reset'){B.t=0;B.play=true;marks(B);draw(B);}
  else if(b.dataset.s){B.spd=+b.dataset.s;marks(B);}
  else if(b.dataset.c==='groot'&&B.P&&window.open3D)window.open3D(model3d(B.P,B.titel()),B.t);});
 marks(B);blokken.push(B);
 if(window.IntersectionObserver)new IntersectionObserver(es=>{B.vis=es[0].isIntersecting;kick();},{rootMargin:'60px'}).observe(el);else B.vis=true;
 return B;
}
function marks(B){
 B.el.querySelectorAll('[data-v]').forEach(b=>{const on=b.dataset.v===B.view;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
 B.el.querySelectorAll('[data-s]').forEach(b=>b.classList.toggle('on',+b.dataset.s===B.spd));
 const p=B.el.querySelector('[data-c=play]');p.innerHTML=B.play?'&#10074;&#10074;':'&#9654;';p.setAttribute('aria-label',B.play?'Pauze':'Afspelen');
 B.el.querySelector('.av-groot').style.display=kan3d()?'':'none';
}
function zet(B,P){B.P=P;B.t=0;B.play=true;B.sig='';marks(B);draw(B);kick();}
// model voor 3d.js: posities als functie van f (0..1 van de hele herhaling)
function model3d(P,titel){
 const items=P.actors.map(a=>({kind:'player',label:a.label,color:a.color,pos:f=>a.pos(f*P.dur),lift:f=>a.lift(f*P.dur)}));
 return {title:titel,dur:P.dur,items,balls:[{at:f=>P.ball(f*P.dur)}],cap:f=>P.cap(f*P.dur),view:'achter'};
}
function stop3d(B){if(!B.r3)return;try{B.r3.B.dispose();B.r3.renderer.forceContextLoss();B.r3.renderer.dispose();}catch(e){}if(B.r3.cv)B.r3.cv.remove();B.r3=null;}
function bouw3d(B){
 const THREE=window.THREE,P=B.P;stop3d(B);
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){B.view='hoogte';marks(B);return null;}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 const m=model3d(P,'');const b3=window.__a3.build(m);
 // de baan van elke set als stippellijn in de lucht
 const lijnen=P.R.map(r=>{const pts=[];for(let i=0;i<=48;i++){const q=r.setAt(r.setT*i/48);pts.push(new THREE.Vector3(q[0],q[1],q[2]));}
  const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:ROL[r.doel.rol].c,dashSize:.25,gapSize:.18,transparent:true,opacity:.85}));l.computeLineDistances();b3.scene.add(l);return {r,l};});
 const cam=new THREE.PerspectiveCamera(42,1.5,.1,200);
 const cv=renderer.domElement;cv.className='av-cv';
 B.r3={renderer,B:b3,cam,lijnen,cv,th:.42,ph:1.1,rr:12.5};
 // zelf een beetje draaien met slepen
 let drag=null;
 cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId);});
 cv.addEventListener('pointermove',e=>{if(!drag||!B.r3)return;B.r3.th-=(e.clientX-drag[0])*.008;B.r3.ph=Math.max(.25,Math.min(1.45,B.r3.ph-(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];});
 const up=()=>{drag=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('webglcontextlost',e=>{e.preventDefault();B.r3=null;B.sig='';},false);
 return B.r3;
}
function draw(B){
 if(!B.P)return;
 const sig=B.view+'|'+(B.P.sig||'');
 if(B.view==='3d'){
  if(!kan3d()){B.view='hoogte';marks(B);}
  else if(!window.THREE){if(B.sig!=='laden'){B.sig='laden';B.stage.innerHTML='<div class="av-msg">3D laden&hellip;</div>';three().then(()=>{B.sig='';draw(B);kick();}).catch(()=>{B.view='hoogte';marks(B);B.sig='';draw(B);});}return;}
  else{
   if(B.sig!==sig||!B.r3){B.sig=sig;if(!bouw3d(B)){draw(B);return;}B.stage.innerHTML='';B.stage.appendChild(B.r3.cv);}
   const R3=B.r3,w=B.stage.clientWidth||320,h=Math.round(w*.62);
   if(R3.w!==w){R3.w=w;R3.renderer.setSize(w,h,false);R3.cv.style.width=w+'px';R3.cv.style.height=h+'px';R3.cam.aspect=w/h;R3.cam.updateProjectionMatrix();}
   const tg={x:0,y:2.0,z:1.2};R3.cam.position.set(tg.x+R3.rr*Math.sin(R3.ph)*Math.sin(R3.th),tg.y+R3.rr*Math.cos(R3.ph),tg.z+R3.rr*Math.sin(R3.ph)*Math.cos(R3.th));R3.cam.lookAt(tg.x,tg.y,tg.z);
   const f=(B.t/B.P.dur)%1;R3.B.update(f,R3.cam);
   const [r]=B.P.at(B.t);R3.lijnen.forEach(o=>{o.l.visible=o.r===r;});
   R3.renderer.render(R3.B.scene,R3.cam);
   cap(B);return;}
 }
 if(B.r3){stop3d(B);}
 B.sig=sig;
 B.stage.innerHTML=B.view==='boven'?bovenSvg(B.P,B.t):hoogteSvg(B.P,B.t);
 cap(B);
}
function cap(B){const c=B.P.cap(B.t);if(B.capEl._c!==c){B.capEl._c=c;B.capEl.textContent=c;}}
function kick(){if(!rafId&&actief())rafId=requestAnimationFrame(loop);}
let rafId=0,last=0,zichtbaar=false;
const actief=()=>zichtbaar&&!document.hidden&&blokken.some(b=>b.vis&&b.P);
function loop(ts){
 rafId=0;if(!actief()){last=0;return;}
 const dt=last?Math.min(.1,(ts-last)/1000):0;last=ts;
 blokken.forEach(B=>{if(!B.vis||!B.P)return;if(B.play)B.t+=dt*B.spd;draw(B);});
 rafId=requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{last=0;kick();});

// ---------- pagina ----------
let gekozen='52',uitleg=null,combo=null;
let C={naam:'',rijen:[],doel:'b'};
const VOORBEELD=[
 {naam:'Basis: snelle midden',rijen:[['MI','11'],['BU','52'],['DI','C2'],['AC','82']],uit:'SV achter: drie aanvallers voor en de pipe. De snelle midden trekt het blok, buiten en diagonaal krijgen een normale bal.'},
 {naam:'Midden achterover',rijen:[['MI','A1'],['BU','52'],['DI','92'],['AC','82']],uit:'SV voor: de midden loopt snel achter de spelverdeler langs (A1). Diagonaal en pipe vallen van achter de 3 meter aan.'},
 {naam:'Snel over de breedte',rijen:[['BU','51'],['MI','21'],['DI','C1']],uit:'Alles heel snel: een strakke bal naar buiten, een snelle midden net voor de spelverdeler en een snelle bal achterover naar de antenne.'},
 {naam:'Veilige hoge ballen',rijen:[['BU','53'],['DI','C3'],['AC','83']],uit:'Na een slechte pass: hoge ballen naar buiten, naar de rechter antenne en de pipe. Iedereen heeft tijd om aan te lopen.'}];
const LSK='vvw.aanval';
const opslag={get(){try{return JSON.parse(localStorage.getItem(LSK)||'[]');}catch(e){return [];}},set(v){try{localStorage.setItem(LSK,JSON.stringify(v));return true;}catch(e){return false;}}};
const melding=t=>{if(typeof window.toast==='function')window.toast(t);};

function plekKaart(){
 const Z=z=>22+z*SX;
 let s='<svg viewBox="0 0 340 168" class="av-kaart" role="group" aria-label="Kies een plek">';
 s+='<rect width="340" height="168" rx="12" fill="#0a7be0"/><rect x="'+px(-4.5)+'" y="'+Z(0)+'" width="'+(9*SX)+'" height="150" fill="none" stroke="#fff" stroke-width="2"/>';
 s+='<line x1="'+px(-4.5)+'" x2="'+px(4.5)+'" y1="'+Z(3)+'" y2="'+Z(3)+'" stroke="#bae6fd" stroke-width="1.5"/><text x="'+(px(4.5)-4)+'" y="'+(Z(3)-4)+'" fill="#bae6fd" font-size="8" text-anchor="end">3 m-lijn</text>';
 s+='<line x1="'+(px(-4.5)-8)+'" x2="'+(px(4.5)+8)+'" y1="'+Z(0)+'" y2="'+Z(0)+'" stroke="#ffd100" stroke-width="5"/><text x="170" y="12" fill="#fff" font-size="9" font-weight="700" text-anchor="middle">net</text>';
 [-4.5,4.5].forEach(x=>s+='<circle cx="'+px(x)+'" cy="'+Z(0)+'" r="4" fill="#ef4444" stroke="#fff"/>');
 s+='<circle cx="'+px(SV[0])+'" cy="'+Z(1.35)+'" r="12" fill="'+C_SV+'" stroke="#1d1d1b" stroke-width="2"/><text x="'+px(SV[0])+'" y="'+(Z(1.35)+3.5)+'" font-size="9" font-weight="900" text-anchor="middle" fill="#1d1d1b">SV</text>';
 Object.entries(PLEK).forEach(([k,p])=>{const z=p.rij==='b'?3.75:.55,on=gekozen[0]===k,c=ROL[rolVan(k+'2')].c;
  s+='<g class="av-pk" data-plek="'+k+'" tabindex="0" role="button" aria-pressed="'+on+'" aria-label="Plek '+k+': '+esc(p.naam)+'"><circle cx="'+px(p.x)+'" cy="'+Z(z)+'" r="'+(on?14:12)+'" fill="'+(on?'#1d1d1b':c)+'" stroke="'+(on?'#ffd100':'#1d1d1b')+'" stroke-width="'+(on?3:2)+'"/><text x="'+px(p.x)+'" y="'+(Z(z)+4.5)+'" font-size="'+(on?13:12)+'" font-weight="900" text-anchor="middle" fill="'+(on?'#ffd100':'#1d1d1b')+'">'+k+'</text></g>';});
 return s+'</svg>';
}
function boogje(s){const h=s==='1'?3:s==='2'?11:20;return '<svg viewBox="0 0 44 26" aria-hidden="true"><line x1="2" x2="42" y1="24" y2="24" stroke="currentColor" stroke-opacity=".35"/><path d="M4 18 Q22 '+(18-h*1.8)+' 40 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3 2.5"/><circle cx="40" cy="15" r="3" fill="#fde047" stroke="#b45309"/></svg>';}

function bouw(){
 const v=$('v_aanval');if(!v||v.dataset.ok)return;v.dataset.ok=1;
 v.innerHTML=
  '<section class="card av-uitleg"><h2>Aanvalscodes: zo werkt ons systeem</h2>'
  +'<p>Elke aanval heeft een code van twee tekens: <b>eerst de plek, dan de snelheid</b>. Zo betekent <b>52</b> een normale bal buiten, <b>11</b> een snelle bal in het midden en <b>C2</b> een normale bal achterover bij de antenne. Tik hieronder een plek en een snelheid aan.</p>'
  +'<div id="avKaart"></div>'
  +'<div class="av-snel" role="group" aria-label="Snelheid">'+['1','2','3'].map(s=>'<button type="button" data-snel="'+s+'">'+boogje(s)+'<span><b>'+s+'</b> '+SNEL[s].naam+'</span></button>').join('')+'</div>'
  +'<div class="av-code"><b id="avCode"></b><span id="avTekst"></span></div>'
  +'<div id="avAnim1"></div>'
  +'<details class="av-meer" open><summary>Uitleg plekken en snelheden</summary>'
  +'<h3>Plek (eerste teken)</h3><ul>'
  +'<li><b>Langs het net, vóór de spelverdeler:</b> 5 buiten bij de antenne, dan 4, 3 en 2 steeds verder naar binnen, en 1 vlak voor de spelverdeler (midden).</li>'
  +'<li><b>Achterover, achter de spelverdeler:</b> A dichtbij de spelverdeler, B verder weg en C bij de rechter antenne.</li>'
  +'<li><b>Achteraanval, achter de 3 meter:</b> 7 links (zelden), 8 de pipe in het midden en 9 de dia-achteraanval rechts. Afzetten achter de 3 meterlijn.</li></ul>'
  +'<h3>Snelheid (tweede teken)</h3><ul>'+['1','2','3'].map(s=>'<li><b>'+s+' '+SNEL[s].naam+':</b> '+SNEL[s].uitleg+'</li>').join('')+'</ul>'
  +'<p class="note">De animatie rekent met de zwaartekracht, dus ook de vliegtijd klopt: hoe hoger de bal, hoe langer hij onderweg is. In "Hoogte" kijk je vanaf de eigen achterlijn naar het net en zie je hoe hoog de bal gaat.</p></details>'
  +'</section>'
  +'<section class="card av-combi"><h2>Combinaties</h2>'
  +'<p>Kies per aanvaller een code. De spelers lopen tegelijk aan; bij "Om de beurt" krijgt elke aanvaller een keer de bal, de anderen lopen mee als lokker.</p>'
  +'<label class="t">Voorbeelden</label><div class="row av-vb">'+VOORBEELD.map((x,i)=>'<button type="button" data-vb="'+i+'">'+esc(x.naam)+'</button>').join('')+'</div>'
  +'<p class="note" id="avVbUit"></p>'
  +'<div id="avRijen"></div>'
  +'<div class="row"><button type="button" id="avPlus">+ Aanvaller</button></div>'
  +'<label class="t" for="avDoel">Bal gaat naar</label><select id="avDoel"></select>'
  +'<div id="avAnim2"></div>'
  +'<hr><label class="t" for="avNaam">Deze combinatie bewaren</label>'
  +'<div class="row"><input type="text" id="avNaam" maxlength="40" placeholder="Naam, bijv. snelle midden"><button type="button" id="avBewaar">Bewaar</button></div>'
  +'<div id="avLijst"></div><div id="avOnline"></div>'
  +'<label class="t">Delen met een trainer of team</label><div class="row"><button type="button" id="avLink">Kopieer link</button><button type="button" id="avTxt">Kopieer als tekst</button></div>'
  +'<p class="note">Met de link opent een ander dezelfde combinatie.</p>'
  +'</section>';
 v.querySelector('#avKaart').addEventListener('click',e=>{const g=e.target.closest('[data-plek]');if(g)kiesCode(g.dataset.plek+gekozen[1]);});
 v.querySelector('#avKaart').addEventListener('keydown',e=>{const g=e.target.closest('[data-plek]');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();kiesCode(g.dataset.plek+gekozen[1]);}});
 v.querySelectorAll('[data-snel]').forEach(b=>b.onclick=()=>kiesCode(gekozen[0]+b.dataset.snel));
 v.querySelectorAll('[data-vb]').forEach(b=>b.onclick=()=>{const x=VOORBEELD[+b.dataset.vb];C={naam:x.naam,rijen:x.rijen.map(r=>({rol:r[0],code:r[1]})),doel:'b'};$('avVbUit').textContent=x.uit;comboUI();});
 $('avPlus').onclick=()=>{if(C.rijen.length>=4){melding('Maximaal 4 aanvallers');return;}const vrij=['BU','MI','DI','AC'].find(r=>!C.rijen.some(x=>x.rol===r))||'BU';C.rijen.push({rol:vrij,code:{BU:'52',MI:'11',DI:'C2',AC:'82'}[vrij]});C.doel='b';$('avVbUit').textContent='';comboUI();};
 $('avDoel').onchange=e=>{C.doel=e.target.value;speel();};
 $('avBewaar').onclick=bewaar;
 $('avLink').onclick=()=>kopieer(link(),'Link gekopieerd');
 $('avTxt').onclick=()=>kopieer(alsTekst(),'Tekst gekopieerd, plak hem bijvoorbeeld in WhatsApp');
 uitleg=Blok($('avAnim1'),()=>'Aanval '+gekozen+': '+tekst(gekozen).toLowerCase());
 combo=Blok($('avAnim2'),()=>C.naam||'Combinatie '+C.rijen.map(r=>r.code).join(' + '));
 const x=VOORBEELD[0];if(!C.rijen.length){C={naam:x.naam,rijen:x.rijen.map(r=>({rol:r[0],code:r[1]})),doel:'b'};$('avVbUit').textContent=x.uit;}
 kiesCode(gekozen);comboUI();lijstUI();onlineUI();
}
function kiesCode(code){
 if(!geldig(code))return;gekozen=code;
 $('avKaart').innerHTML=plekKaart();
 document.querySelectorAll('#v_aanval [data-snel]').forEach(b=>{const on=b.dataset.snel===code[1];b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
 const rol=rolVan(code);
 $('avCode').textContent=code;$('avTekst').textContent=tekst(code)+'. Meestal voor de '+ROL[rol].naam.toLowerCase()+'.';
 const P=plan([{rol,code}],0);P.sig=code;zet(uitleg,P);
}
function codeOpties(sel){
 const grp=(lab,ps)=>'<optgroup label="'+lab+'">'+ps.flatMap(p=>['1','2','3'].map(s=>{const c=p+s;return '<option value="'+c+'"'+(c===sel?' selected':'')+'>'+c+' · '+SNEL[s].naam+', '+esc(PLEK[p].naam)+'</option>';})).join('')+'</optgroup>';
 return grp('Langs het net, vóór de SV',VOOR)+grp('Achterover, achter de SV',ACHTER)+grp('Achteraanval, achter de 3 m',ACHTERAANVAL);
}
function comboUI(){
 const box=$('avRijen');
 box.innerHTML=C.rijen.map((r,i)=>'<div class="av-rij" data-i="'+i+'"><span class="av-dot" style="background:'+ROL[r.rol].c+'">'+esc(r.code)+'</span>'
  +'<select data-k="rol" aria-label="Speler">'+Object.entries(ROL).map(([k,o])=>'<option value="'+k+'"'+(k===r.rol?' selected':'')+'>'+o.naam+'</option>').join('')+'</select>'
  +'<select data-k="code" aria-label="Aanvalscode">'+codeOpties(r.code)+'</select>'
  +'<button type="button" data-k="weg" aria-label="Verwijder deze aanvaller"'+(C.rijen.length<2?' disabled':'')+'>&#10005;</button></div>').join('');
 box.querySelectorAll('.av-rij').forEach(row=>{const i=+row.dataset.i;
  row.querySelector('[data-k=rol]').onchange=e=>{C.rijen[i].rol=e.target.value;$('avVbUit').textContent='';comboUI();};
  row.querySelector('[data-k=code]').onchange=e=>{C.rijen[i].code=e.target.value;$('avVbUit').textContent='';comboUI();};
  row.querySelector('[data-k=weg]').onclick=()=>{C.rijen.splice(i,1);C.doel='b';$('avVbUit').textContent='';comboUI();};});
 const d=$('avDoel');
 if(C.doel!=='b'&&+C.doel>=C.rijen.length)C.doel='b';
 d.innerHTML='<option value="b">Om de beurt (iedereen een keer)</option>'+C.rijen.map((r,i)=>'<option value="'+i+'"'+(String(i)===String(C.doel)?' selected':'')+'>'+esc(r.code)+' ('+ROL[r.rol].kort.toLowerCase()+')</option>').join('');
 d.value=String(C.doel);
 $('avNaam').value=C.naam||'';
 const dubbel=C.rijen.find((r,i)=>C.rijen.some((q,j)=>j<i&&q.code[0]===r.code[0]&&PLEK[r.code[0]].rij!=='b'));
 const w=box.querySelector('.av-warn');if(w)w.remove();
 if(dubbel)box.insertAdjacentHTML('beforeend','<p class="note av-warn">Let op: twee aanvallers op plek '+dubbel.code[0]+' lopen elkaar in de weg.</p>');
 speel();
}
function speel(){if(!C.rijen.length)return;const P=plan(C.rijen.map(r=>({rol:r.rol,code:r.code})),C.doel);P.sig=C.rijen.map(r=>r.rol+r.code).join('.')+C.doel;zet(combo,P);}
function lijstUI(){
 const a=opslag.get();
 $('avLijst').innerHTML=a.length?a.map((c,i)=>'<div class="sv"><button type="button" class="lnk" data-open="'+i+'">'+esc(c.naam)+' <span class="note">'+esc(c.rijen.map(r=>r.code).join(' + '))+'</span></button><button type="button" data-del="'+i+'">Verwijder</button></div>').join(''):'<p class="note">Nog geen bewaarde combinaties.</p>';
 $('avLijst').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const c=opslag.get()[+b.dataset.open];if(!c)return;C=JSON.parse(JSON.stringify(c));$('avVbUit').textContent='';comboUI();});
 $('avLijst').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const a=opslag.get();a.splice(+b.dataset.del,1);opslag.set(a);lijstUI();if(online)onlineSchrijf();});
}
// ---------- online bewaren voor de beheerder (Firebase, via suggestie.js) ----------
// Na inloggen als beheerder staat de lijst online (Firestore, document aanvalcombis/<uid>) en is hij op elk apparaat
// hetzelfde. Dit apparaat onthoudt dat online bewaren aan staat; de lijst in deze browser is dan een kopie.
const ONL='vvw.aanval.online';
const vlag={get(){try{return localStorage.getItem(ONL)==='1';}catch(e){return false;}},set(v){try{if(v)localStorage.setItem(ONL,'1');else localStorage.removeItem(ONL);}catch(e){}}};
let online=null,onlineFout='',bezig=false;
async function onlineStart(inloggen){
 const F=window.vvwFire;if(!F||bezig)return;bezig=true;onlineFout='';onlineUI();
 try{
  if(inloggen)await F.login();
  const u=await F.user();
  if(!u){online=null;vlag.set(false);return;}
  const doc=await F.lees('aanvalcombis',u.uid);
  let lijst=[];try{lijst=doc&&doc.fields&&doc.fields.lijst?JSON.parse(doc.fields.lijst.stringValue):[];}catch(e){lijst=[];}
  if(!Array.isArray(lijst))lijst=[];
  // bij het inloggen op een apparaat: wat hier al bewaard was en online nog niet bestaat, komt erbij
  const extra=inloggen?opslag.get().filter(c=>!lijst.some(x=>x.naam===c.naam)):[];
  lijst=lijst.concat(extra).slice(0,40);
  online=u;vlag.set(true);opslag.set(lijst);
  if(extra.length)await onlineSchrijf();
  lijstUI();if(inloggen)melding('Online bewaren staat aan');
 }catch(e){
  online=null;
  if(e&&e.status===403){vlag.set(false);onlineFout='Online bewaren kan alleen met het beheerdersaccount.';}
  else if(e&&e.status===401){vlag.set(false);}
  else if(!/popup|cancel/i.test(String(e&&(e.code||e.message))))onlineFout='Online lijst ophalen lukt nu niet (geen internet?). De combinaties op dit apparaat werken gewoon.';
 }finally{bezig=false;onlineUI();}
}
async function onlineSchrijf(){
 const F=window.vvwFire;if(!F||!online)return;
 try{await F.schrijf('aanvalcombis',online.uid,{lijst:{stringValue:JSON.stringify(opslag.get())},tijd:{timestampValue:new Date().toISOString()}});}
 catch(e){melding('Online bewaren lukt nu niet; hij staat wel op dit apparaat');}
}
function onlineUI(){
 const el=$('avOnline');if(!el)return;
 if(!window.vvwFire){el.innerHTML='';return;}
 if(bezig){el.innerHTML='<p class="note">Online lijst ophalen&hellip;</p>';return;}
 el.innerHTML=(online
  ?'<p class="note av-on">&#9729; Online bewaard ('+esc(online.email)+'): je ziet deze combinaties op elk apparaat waar je als beheerder inlogt.</p><div class="row"><button type="button" data-o="uit">Uitloggen</button></div>'
  :'<div class="row"><button type="button" data-o="in">Beheerder: inloggen en online bewaren</button></div><p class="note">Zonder inloggen staan bewaarde combinaties alleen op dit apparaat.</p>')
  +(onlineFout?'<p class="note av-warn">'+esc(onlineFout)+'</p>':'');
 const b=el.querySelector('[data-o]');if(!b)return;
 b.onclick=async()=>{if(b.dataset.o==='in')onlineStart(true);else{try{await window.vvwFire.logout();}catch(e){}online=null;vlag.set(false);onlineUI();melding('Uitgelogd; de combinaties blijven op dit apparaat staan');}};
}
function bewaar(){
 const naam=($('avNaam').value||'').trim()||C.naam||('Combinatie '+C.rijen.map(r=>r.code).join(' + '));
 C.naam=naam;const a=opslag.get().filter(c=>c.naam!==naam);a.unshift({naam,rijen:C.rijen,doel:C.doel});
 if(opslag.set(a.slice(0,40))){melding(online?'Bewaard (ook online): '+naam:'Bewaard: '+naam);lijstUI();$('avNaam').value=naam;if(online)onlineSchrijf();}else melding('Bewaren lukt niet in deze browser');
}
function code(){return 'aanval='+encodeURIComponent(C.naam||'').replace(/%20/g,'+')+'~'+C.rijen.map(r=>r.rol+r.code).join('.')+'~'+C.doel;}
function link(){return location.origin+location.pathname+'#'+code();}
function laad(h){
 const m=/^aanval=([^~]*)~([A-Z0-9.]+)~(b|\d)$/.exec(h||'');if(!m)return false;
 const rijen=m[2].split('.').map(x=>/^(BU|MI|DI|AC)([1-5ABC789][123])$/.exec(x)).filter(Boolean).slice(0,4).map(x=>({rol:x[1],code:x[2]}));
 if(!rijen.length)return false;
 let naam='';try{naam=decodeURIComponent(m[1].replace(/\+/g,' '));}catch(e){}
 C={naam:naam.slice(0,40),rijen,doel:m[3]};return true;
}
function alsTekst(){
 return (C.naam?'Aanvalscombinatie "'+C.naam+'"':'Aanvalscombinatie')+'\n'+C.rijen.map(r=>'- '+ROL[r.rol].naam+': '+r.code+' ('+SNEL[r.code[1]].naam+', '+PLEK[r.code[0]].naam+')').join('\n')+'\nBekijk de animatie: '+link();
}
function kopieer(t,msg){
 const mis=()=>{window.prompt?window.prompt('Kopieer:',t):0;};
 try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>melding(msg),()=>{if(navigator.share)navigator.share({text:t}).catch(()=>{});else melding('Kopiëren lukt niet, houd de link ingedrukt');});else mis();}catch(e){mis();}
}

// ---------- in- en uitschakelen met het tabblad ----------
window.aanvalView=function(aan){
 zichtbaar=!!aan;
 if(aan){bouw();blokken.forEach(B=>{B.sig='';});kick();if(vlag.get()&&!bezig)onlineStart(false);}
 else blokken.forEach(stop3d);
};
// directe link met een combinatie (#aanval=...)
function vanLink(){
 const h=location.hash.slice(1);if(!/^aanval=/.test(h))return;
 if(laad(h)&&typeof setView==='function'){setView('aanval');comboUI();setTimeout(()=>{const e=$('avAnim2');if(e&&e.scrollIntoView)e.scrollIntoView({block:'center'});},300);}
}
window.addEventListener('hashchange',vanLink);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',vanLink);else vanLink();
window.__aanval={plan,rally,plekken,PLEK,boog,state:()=>({gekozen,C,blokken})};
})();
