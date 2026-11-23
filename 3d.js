// 3d.js – 3D-weergave van alle animaties (versie 2).
// Standaard toont de app elke animatie in 3D: mini's, Jeugd & Senioren, 5-1 rotaties en verdediging.
// De 2D-animatie blijft eronder bestaan als reserve: bij geen internet, geen WebGL, een te trage telefoon
// of als de trainer zelf op "2D" tikt. De 3D-beelden volgen de 2D-animatie (zelfde tijd, zelfde knoppen),
// dus er wordt niets per oefening opnieuw getekend.
// three.js (open source, r128) komt van cdnjs en wordt pas geladen als er een animatie in beeld is.
(function(){
'use strict';
const SRC='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let loading=null;
function loadThree(){
 if(window.THREE)return Promise.resolve();
 if(loading)return loading;
 loading=new Promise((res,rej)=>{const s=document.createElement('script');s.src=SRC;s.async=true;s.onload=res;s.onerror=()=>{loading=null;s.remove();rej(new Error('three.js niet geladen'));};document.head.appendChild(s);});
 return loading;
}

// ---------- groot veld: SVG-coördinaten (560x680, veld x 110-450, y 40-640, net y 340) naar meters ----------
const MX=x=>(x-280)/(340/9),MZ=y=>(y-340)/(600/18);
const ease=u=>u*u*(3-2*u);
const my=y=>typeof mapY==='function'?mapY(y):y;
function kfAt(vals,times,f){
 for(let i=0;i<times.length-1;i++){if(f<times[i+1]||i===times.length-2){const a=vals[i],b=vals[i+1],span=times[i+1]-times[i]||1,u=Math.max(0,Math.min(1,(f-times[i])/span)),e=ease(u);return [a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e];}}
 return vals[vals.length-1];
}
// boog van de bal tussen twee punten (meters): hoger bij een lange bal of als hij over het net gaat
function arcPeak(a,c){const d=Math.hypot(c[0]-a[0],c[2]-a[2]);let h=Math.min(4.2,.6+d*.32);if(a[2]*c[2]<0)h=Math.max(h,2.9);return d<.2?0:h;}
function ballAt(pts,times,f){
 for(let i=0;i<times.length-1;i++){if(f<times[i+1]||i===times.length-2){const a=pts[i],c=pts[i+1],span=times[i+1]-times[i]||1,u=Math.max(0,Math.min(1,(f-times[i])/span));
  return [a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*u+4*arcPeak(a,c)*u*(1-u),a[2]+(c[2]-a[2])*u];}}
 return pts[pts.length-1];
}
const bump=(f,t0,w,h)=>{const d=Math.abs(f-t0);return d<w?h*Math.sin((1-d/w)*Math.PI/2):0;};
const seg3=(a,c,peak)=>u=>[a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*u+4*peak*u*(1-u),a[2]+(c[2]-a[2])*u];

// ---------- modellen ----------
// Jeugd & Senioren: spelers met 4 (of 7) posities, bal met 5 (of 6) punten, 9 seconden per ronde (zoals in 2D)
const SOBJ=new Set(['K','M','M1','M2','M5','M6','Z','GZ','BOX']);
function senModel(d){
 const kt=[0,.15,.3,.45,.6,.82,.96,1],kb=[0,.15,.3,.45,.6,.7,.96,1],STB=[0,.15,.3,.45,.6,.82];
 const b=d.bal||[],six=b.length===6,still=!b.length||b.every(x=>x[0]===b[0][0]&&x[1]===b[0][1]);
 const items=[];
 const people=d.p.filter(p=>!SOBJ.has(p[0]));
 const tracks=people.map(p=>{const q=p[2];return q.length>=7?[...q.slice(0,7),q[6]]:[...q,q[3],q[0],q[0],q[0]];});
 d.p.forEach(p=>{if(!SOBJ.has(p[0]))return;const [x,y]=p[2][0];const P=[MX(x),MZ(y)];items.push({kind:/^M\d?$/.test(p[0])?'mat':p[0]==='K'?'pylon':'kast',pos:()=>P});});
 let bp=null,bt=null;
 if(!still){const bs=six?[...b,b[5],b[5]]:[...b,b[4],b[4],b[0]];bp=bs.map(v=>[MX(v[0]),1,MZ(v[1])]);bt=six?kt:kb;}
 // sprong: een speler dicht bij het net die de bal raakt en de bal gaat daarna over het net
 const jumps=people.map(()=>[]);
 if(bp)for(let i=1;i<b.length;i++){const t=bt[i],nx=bp[i+1];if(!nx||bp[i][2]*nx[2]>=0)continue;
  people.forEach((p,j)=>{const q=kfAt(tracks[j],kt,t);if(Math.hypot(q[0]-b[i][0],q[1]-b[i][1])<45&&Math.abs(q[1]-340)<110){jumps[j].push(t);bp[i][1]=2.7;}});}
 people.forEach((p,j)=>items.push({kind:'player',label:p[0],color:p[1],pos:f=>{const q=kfAt(tracks[j],kt,f);return [MX(q[0]),MZ(q[1])];},lift:f=>jumps[j].reduce((h,t)=>h+bump(f,t,.05,.6),0)}));
 // een tussenpunt midden op een rechte baan waar niemand staat (bijv. halverwege een set) is alleen voor de timing
 // in 2D; in 3D zou de bal daar naar de grond zakken en weer omhoog stuiteren. Zo'n punt laten we weg.
 if(bp){const keep=[];for(let i=0;i<bp.length;i++){let drop=false;
  if(i>0&&i<b.length-1&&bp[i][1]===1){const a=b[i-1],c=b[i],n=b[i+1],lx=n[0]-a[0],ly=n[1]-a[1],L=Math.hypot(lx,ly)||1,off=Math.abs((c[0]-a[0])*ly-(c[1]-a[1])*lx)/L,al=(c[0]-a[0])*lx+(c[1]-a[1])*ly;
   if(off<10&&al>0&&al<L*L&&!people.some((p,j)=>{const q=kfAt(tracks[j],kt,bt[i]);return Math.hypot(q[0]-c[0],q[1]-c[1])<45;}))drop=true;}
  if(!drop)keep.push(i);}
  bp=keep.map(i=>bp[i]);bt=keep.map(i=>bt[i]);}
 const balls=bp?[{at:f=>(!six&&f>=.96)?null:ballAt(bp,bt,f)}]:[];
 const st=(d.stappen||[]).slice(0,4);
 const cap=f=>{for(let i=1;i<STB.length;i++)if(f<STB[i])return i<=st.length?'Stap '+i+': '+st[i-1]:'';return six?'Stap 5: '+(d.stappen[d.stappen.length-1]||''):'Terug naar de beginopstelling';};
 return {title:d.t,dur:9,items,balls,cap};
}
// 5-1 rotaties: drie fases (service, pass naar SV, set-up en aanloop), zoals op het tabblad 5-1 rotaties
function rotModel(n){
 const R=ROT[n],P=v=>[MX(v[0]),MZ(my(v[1]))];
 const eio=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const tgCol=new Set(R.tg.map(t=>t.col));
 const items=Object.entries(R.players).map(([k,o])=>({kind:'player',label:k,color:o.c,
  pos:f=>{const F=f*3,seg=Math.min(2,Math.floor(F)),lt=F-seg,st=eio(lt),a=P(o.kf[seg]),b=P(o.kf[seg+1]||o.kf[seg]);let x=a[0]+(b[0]-a[0])*st;const z=a[1]+(b[1]-a[1])*st;if(seg===0&&o.arc0)x+=Math.sin(st*Math.PI)*MX(280+o.arc0);return [x,z];},
  lift:f=>{const F=f*3;return F>=2&&tgCol.has(o.c)&&k!=='SV'?bump(F,2.85,.2,.65):0;}}));
 const rv=R.players[R.recv].kf[0],pass=[MX(rv[0]),.9,MZ(my(rv[1]))],sv=[MX(336),2.5,MZ(my(188))],srv=[MX(280),2.6,MZ(48)];
 const s0=seg3(srv,pass,2.2),s1=seg3(pass,sv,2.6);
 const balls=[{at:f=>{const F=f*3;if(F<1)return s0(F);if(F<2)return s1(F-1);return null;}}]
  .concat(R.tg.map(t=>{const to=[MX(t.to[0]),3,MZ(my(t.to[1]))],s2=seg3(sv,to,1.2);return {at:f=>{const F=f*3;return F>=2?s2(F-2):null;},color:t.col};}));
 const caps=['Fase 1: service onderweg; SV, MID1 en DIA maken direct ruimte','Fase 2: pass naar SV; de aanvallers halen uit om aan te lopen','Fase 3: vier set-up-opties vanuit SV; iedereen loopt tegelijk aan'];
 return {title:R.title,dur:3/.48,items,balls,cap:f=>caps[Math.min(2,Math.floor(f*3))],sig:'r'+n};
}
// Verdediging en blokdekking: zelfde gegevens als het tabblad Verdediging (DEFS/DEFZ, getDef())
function defModel(){
 const {key,sc}=getDef(),fd=dMode==='field_defense';
 const P=v=>[MX(v[0]),MZ(my(v[1]))];
 const kfPos=kf=>f=>{const F=Math.min(2.999,f*3),s=Math.floor(F),st=ease(F-s),a=P(kf[s]),b=P(kf[s+1]||kf[s]);return [a[0]+(b[0]-a[0])*st,a[1]+(b[1]-a[1])*st];};
 const items=[],balls=[],polys=[];
 const own=Object.entries(sc.players);
 let hitter=null;
 if(!fd){const h=P(sc.hit);let best=1e9;own.forEach(([k,o])=>{const q=P(o.kf[2]),d=Math.hypot(q[0]-h[0],q[1]-h[1]);if(d<best){best=d;hitter=k;}});}
 own.forEach(([k,o])=>{const end=P(o.kf[2]),net=fd&&end[1]<1.4;
  items.push({kind:'player',label:k,color:o.c,ring:k===dInsp,pos:kfPos(o.kf),
   lift:f=>{const F=f*3;return net?bump(F,2.35,.25,.6):(k===hitter?bump(F,2,.3,.7):0);}});});
 if(fd){
  Object.values(sc.opp).forEach(o=>items.push({kind:'player',label:o.label,color:o.active?'#ef4444':'#64748b',pos:kfPos(o.kf),lift:f=>o.active?bump(f*3,2,.25,.7):0}));
  const pp=P(sc.pas),sp=P(sc.set),dt=P(sc.tgt);
  items.push({kind:'player',label:'PASS',color:'#64748b',pos:()=>pp},{kind:'player',label:'SET',color:'#f97316',pos:()=>sp});
  const ao=Object.values(sc.opp).find(o=>o.active),hit=ao?P(ao.kf[2]):[0,MZ(my(158))];
  const a0=seg3([pp[0],1,pp[1]],[sp[0],2.6,sp[1]],1.6),a1=seg3([sp[0],2.6,sp[1]],[hit[0],3.1,hit[1]],1.2),a2=seg3([hit[0],3.1,hit[1]],[dt[0],.6,dt[1]],0);
  balls.push({at:f=>{const F=Math.min(2.999,f*3),s=Math.floor(F),u=F-s;return s===0?a0(u):s===1?a1(u):a2(u);}});
  if(DEFZ[key])Object.entries(DEFZ[key]).forEach(([r,z])=>{const sel=r===dInsp;if(!dAll&&!sel)return;
   polys.push({pts:z.poly.trim().split(/\s+/).map(q=>{const a=q.split(',');return [MX(+a[0]),MZ(+a[1])];}),color:z.fill,op:sel?.56:.34});});
  if(sc.shadow)polys.push({pts:sc.shadow.trim().split(/\s+/).map(q=>{const a=q.split(',');return [MX(+a[0]),MZ(my(+a[1]))];}),color:'#ef4444',op:.3,vis:f=>f*3>=1});
 }else{
  sc.blk.forEach(q=>{const p=P(q);items.push({kind:'player',label:'BLK',color:'#ef4444',pos:()=>p,lift:f=>bump(f*3,2,.3,.7)});});
  const sf=P(sc.setFrom),h=P(sc.hit),reb=P([sc.hit[0]+18,sc.hit[1]+68]);
  const a0=seg3([sf[0],2.5,sf[1]],[h[0],3.1,h[1]],1.4),a1=seg3([h[0],3.1,h[1]],[reb[0],.3,reb[1]],.4);
  balls.push({at:f=>{const F=Math.min(2.999,f*3);return F<2?a0(F/2):a1(F-2);}});
 }
 const caps=fd?['Fase 1: pass onderweg naar hun setter (team wacht in 1e uitgangspositie)','Fase 2: setter speelt naar aanvaller; verplaatsen van 1e naar 2e uitgangspositie','Fase 3: slagmoment; blok sluiten en stilzitten uit de blokschaduw']:['Fase 1: pass naar onze spelverdeler (aanloop start)','Fase 2: set onderweg; 2-3 cup blokdekking sluit onder de aanvaller','Fase 3: slag en afgeketste blokbal oprapen in de 1e of 2e ring'];
 return {title:sc.title,dur:3/.48,items,balls,polys,cap:f=>caps[Math.min(2,Math.floor(f*3))],sig:key+dMode+dInsp+dAll};
}
// Mini's: de animatie komt uit scenes.js (SVG met SMIL). Het 3D-beeld leest elk beeldje de posities uit
// die SVG (spelers, bal, materiaal), dus het loopt altijd gelijk met 2D. Hoogte van de bal = grootte in 2D.
const MOBJ={'#2563eb':'mat','#1d4ed8':'dikkemat','#92400e':'kast','#a16207':'bank','#64748b':'kar','#78350f':'stoel','#475569':'muur'};
function miniModel(svg){
 const vb=svg.viewBox.baseVal,cx=VBW/2,cy=vb.height/2,S=.04;
 const toM=(x,y)=>[(y-cy)*S,(x-cx)*S];
 let I=null;
 const tick=()=>{const m=svg.getScreenCTM();I=m?m.inverse():null;};
 const loc=(el,x,y)=>{const m=el.getScreenCTM();if(!m||!I)return null;const q=I.multiply(m);return {x:q.a*x+q.c*y+q.e,y:q.b*x+q.d*y+q.f,s:Math.hypot(q.a,q.b),r:Math.atan2(q.b,q.a)};};
 const A=(el,n)=>parseFloat(el.getAttribute(n))||0;
 const items=[],balls=[],courts=[],nets=[],lines=[];
 tick();
 svg.querySelectorAll('rect').forEach(r=>{const fl=(r.getAttribute('fill')||'').toLowerCase(),x=A(r,'x'),y=A(r,'y'),w=A(r,'width'),h=A(r,'height');
  if(fl==='#fff'&&r.getAttribute('fill-opacity')){const c=toM(x+w/2,y+h/2);courts.push({x:c[0],z:c[1],w:h*S,d:w*S});return;}
  const kind=MOBJ[fl]||((r.getAttribute('stroke')||'').toLowerCase()==='#e2e8f0'&&fl==='none'?'doel':null);
  if(!kind)return;
  if(kind==='muur'){const c=toM(x+w/2,y+h/2);items.push({kind,pos:()=>c,len:h*S});return;}
  items.push({kind,pos:()=>{const p=loc(r,x+w/2,y+h/2);return p?toM(p.x,p.y):null;}});});
 svg.querySelectorAll('line').forEach(l=>{const s=(l.getAttribute('stroke')||'').toLowerCase(),x1=A(l,'x1'),y1=A(l,'y1'),x2=A(l,'x2'),y2=A(l,'y2');
  if(s==='#ffcc00'){const a=toM(x1,y1),b=toM(x2,y2);nets.push({z:a[1],x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0])});}
  else if(s==='#e11d48')items.push({kind:'koord',pos:()=>{const p=loc(l,(x1+x2)/2,(y1+y2)/2);return p?toM(p.x,p.y):null;},len:Math.abs(x2-x1)*S});
  else if(l.getAttribute('stroke-dasharray')==='4 3')lines.push([toM(x1,y1),toM(x2,y2)]);});
 svg.querySelectorAll('polyline').forEach(pl=>{const pts=(pl.getAttribute('points')||'').trim().split(/\s+/).map(q=>{const a=q.split(',');return toM(+a[0],+a[1]);});for(let i=0;i<pts.length-1;i++)lines.push([pts[i],pts[i+1]]);});
 svg.querySelectorAll('path').forEach(p=>{if((p.getAttribute('fill')||'').toLowerCase()!=='#f97316')return;const m=(p.getAttribute('d')||'').match(/M\s*([-\d.]+)[ ,]+([-\d.]+)/);if(!m)return;const x=+m[1],y=+m[2]+4;
  items.push({kind:'pylon',pos:()=>{const q=loc(p,x,y);return q?toM(q.x,q.y):null;}});});
 svg.querySelectorAll('circle').forEach(c=>{const fl=(c.getAttribute('fill')||'').toLowerCase(),st=(c.getAttribute('stroke')||'').toLowerCase(),x=A(c,'cx'),y=A(c,'cy');
  if(fl==='none'&&st==='#f8fafc'){items.push({kind:'hoepel',pos:()=>{const q=loc(c,x,y);return q?toM(q.x,q.y):null;}});return;}
  if(st==='#fb923c'){items.push({kind:'korf',pos:()=>{const q=loc(c,x,y);return q?toM(q.x,q.y):null;}});return;}
  if(fl==='#fde047'&&c.r.baseVal.value>=2.4){const par=c.parentNode;
   balls.push({at:()=>{const q=loc(c,x,y);if(!q)return null;
    const op=+getComputedStyle(c).opacity*(par&&par.nodeName==='g'?+getComputedStyle(par).opacity:1);if(op<.5)return null;
    const r=c.r.animVal.value,h=r<2.8?.12+Math.max(0,r-1.5)/1.3*.78:.9+(r-2.8)/1.8*2.1;const m=toM(q.x,q.y);return [m[0],h,m[1]];}});}});
 svg.querySelectorAll('ellipse').forEach(e=>{if(e.getAttribute('rx')!=='5.6')return;const g=e.parentNode,col=e.getAttribute('fill');
  let last=null;
  items.push({kind:'player',color:col,kid:true,
   pos:()=>{const q=loc(g,0,0);last=q;return q?toM(q.x,q.y):null;},
   lift:()=>last?Math.max(0,last.s-1)/.35*.5:0,
   tilt:()=>last&&Math.abs(last.r)>.5?last.r:0});});
 const xs=courts.length?courts:[{x:0,z:0,w:4.5,d:10.4}];
 const W=Math.max(...xs.map(c=>c.x+c.w/2))-Math.min(...xs.map(c=>c.x-c.w/2)),D=Math.max(...xs.map(c=>c.d));
 const card=svg.closest('.dr,.owdetail,details,.card,.hall,#hallBody'),hd=card&&card.querySelector('h3,h2,summary b');
 const title=(hd&&hd.textContent.trim())||svg.getAttribute('aria-label')||'Animatie';
 return {title,dur:1e9,view:'zij',fit:asp=>D*Math.max(1.05,1.45*asp)+Math.max(0,W-4.5)*.6,items,balls,cap:()=>'',mini:{courts,nets,lines},tick,k:Math.max(.45,D/20,W/14),
  seek:t=>{try{svg.pauseAnimations();svg.setCurrentTime(t);}catch(e){}},
  release:()=>{try{svg.unpauseAnimations();}catch(e){}},
  now:()=>{try{return svg.getCurrentTime();}catch(e){return 0;}}};
}
const VBW=320; // breedte van de mini-SVG (scenes.js)

// ---------- 3D-scène opbouwen (gedeeld door venster en ingebouwde weergave) ----------
function label(THREE,text,color){
 const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');
 g.fillStyle='rgba(29,29,27,.85)';g.beginPath();if(g.roundRect)g.roundRect(4,8,120,48,14);else g.rect(4,8,120,48);g.fill();
 g.strokeStyle=color;g.lineWidth=5;g.stroke();
 g.fillStyle='#fff';g.font='900 '+(text.length>3?24:30)+'px Poppins,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,64,33);
 const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(.9,.45,1);s.renderOrder=10;return s;
}
function build(model){
 const THREE=window.THREE;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1d1d1b');
 scene.add(new THREE.HemisphereLight(0xffffff,0x334155,.85));
 const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(6,14,8);scene.add(sun);
 const cache={};const mat=c=>cache[c]||(cache[c]=new THREE.MeshLambertMaterial({color:c}));
 const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);scene.add(o);return o;};
 const flat=(w,d,x,z,c,y)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c||'#ffffff'}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.005,z);scene.add(m);return m;};
 const net=(x0,x1,z,h)=>{const w=x1-x0,cx=(x0+x1)/2;
  const nm=new THREE.Mesh(new THREE.PlaneGeometry(w,.9),new THREE.MeshBasicMaterial({color:'#e5e7eb',transparent:true,opacity:.35,side:THREE.DoubleSide}));nm.position.set(cx,h-.47,z);scene.add(nm);
  const band=add(new THREE.BoxGeometry(w,.07,.03),mat('#ffd100'),cx,h,z);
  [x0,x1].forEach(x=>add(new THREE.CylinderGeometry(.05,.05,h+.15,10),mat('#94a3b8'),x,(h+.15)/2,z));return band;};
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),mat('#3f3f46'));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
 if(model.mini){
  const M=model.mini;
  M.courts.forEach(c=>{flat(c.w,c.d,c.x,c.z,'#0a7be0',0);const L=(w,d,x,z)=>flat(w,d,x,z,'#ffffff');
   L(c.w+.05,.05,c.x,c.z-c.d/2);L(c.w+.05,.05,c.x,c.z+c.d/2);L(.05,c.d,c.x-c.w/2,c.z);L(.05,c.d,c.x+c.w/2,c.z);});
  M.nets.forEach(n=>net(n.x0,n.x1,n.z,2.1));
  if(M.lines.length){const pts=[];M.lines.forEach(([a,b])=>{pts.push(new THREE.Vector3(a[0],.02,a[1]),new THREE.Vector3(b[0],.02,b[1]));});
   const g=new THREE.BufferGeometry().setFromPoints(pts);scene.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.55})));}
 }else{
  flat(9,18,0,0,'#0a7be0',0);
  const L=(w,d,x,z,c)=>flat(w,d,x,z,c);
  L(9.1,.05,0,-9);L(9.1,.05,0,9);L(.05,18.1,-4.5,0);L(.05,18.1,4.5,0);L(9,.05,0,0);L(9,.04,0,-3,'#bae6fd');L(9,.04,0,3,'#bae6fd');
  net(-4.8,4.8,0,2.43);
  [-4.5,4.5].forEach(x=>add(new THREE.CylinderGeometry(.015,.015,1.8,6),mat('#ef4444'),x,2.33,0));
 }
 // vlakken op de vloer (verdedigingsvakken, blokschaduw)
 const polys=(model.polys||[]).map((p,i)=>{const sh=new THREE.Shape(p.pts.map(q=>new THREE.Vector2(q[0],-q[1])));
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:p.op,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.008+i*.0005;scene.add(m);return {p,m};});
 // spelers en materiaal
 const shadowM=new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.28});
 const shadowG=new THREE.CircleGeometry(.32,20);
 const actors=[];
 const objMesh=it=>{const g=new THREE.Group();const B=(w,h,d,c,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.y=y==null?h/2:y;g.add(m);return m;};
  switch(it.kind){
   case 'mat':B(1,.1,1.8,'#2563eb');break;
   case 'dikkemat':B(1.4,.4,2,'#1d4ed8');break;
   case 'kast':B(.6,1,1.2,'#92400e');break;
   case 'bank':B(.3,.4,3,'#a16207');break;
   case 'kar':B(.5,.6,.7,'#64748b');[[-.1,-.15],[.1,.1],[0,.2]].forEach(q=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),mat('#fde047'));b.position.set(q[0],.68,q[1]);g.add(b);});break;
   case 'stoel':B(.45,.45,.45,'#78350f');break;
   case 'doel':[-.6,.6].forEach(x=>{const p=B(.06,1,.06,'#e2e8f0');p.position.x=x;});B(1.26,.06,.06,'#e2e8f0',1);break;
   case 'muur':B(it.len||6,2.4,.25,'#475569');break;
   case 'koord':{const c=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,it.len||1.6,6),mat('#e11d48'));c.rotation.x=Math.PI/2;c.position.y=1.3;g.add(c);break;}
   case 'korf':{const p=B(.04,1.6,.04,'#334155');const r=new THREE.Mesh(new THREE.TorusGeometry(.25,.03,8,20),mat('#fb923c'));r.rotation.x=Math.PI/2;r.position.y=1.6;g.add(r);break;}
   case 'hoepel':{const r=new THREE.Mesh(new THREE.TorusGeometry(.35,.025,8,24),mat('#f8fafc'));r.rotation.x=Math.PI/2;r.position.y=.03;g.add(r);break;}
   case 'pylon':{const c=new THREE.Mesh(new THREE.ConeGeometry(.15,.35,14),mat('#f97316'));c.position.y=.175;g.add(c);break;}
   default:return null;}
  return g;};
 model.items.forEach(it=>{
  if(it.kind!=='player'){const g=objMesh(it);if(!g)return;scene.add(g);actors.push({it,g});return;}
  const k=it.kid?.78:1,g=new THREE.Group(),body=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.2*k,.26*k,1.25*k,16),mat(it.color));torso.position.y=.63*k;body.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.17*k,16,12),mat('#d9a066'));head.position.y=1.42*k;body.add(head);
  g.add(body);
  if(it.label){const lb=label(THREE,it.label,it.color);lb.position.y=2.05;g.add(lb);}
  if(it.ring){const r=new THREE.Mesh(new THREE.RingGeometry(.42,.5,28),new THREE.MeshBasicMaterial({color:'#ffffff'}));r.rotation.x=-Math.PI/2;r.position.y=.015;g.add(r);}
  const sh=new THREE.Mesh(shadowG,shadowM);sh.rotation.x=-Math.PI/2;sh.position.y=.01;sh.scale.setScalar(k);scene.add(sh);
  scene.add(g);actors.push({it,g,sh,body});
 });
 const br=model.mini?.12:.15;
 const balls=model.balls.map(b=>{const m=new THREE.Mesh(new THREE.SphereGeometry(br,18,14),mat('#fde047'));scene.add(m);
  const sh=new THREE.Mesh(new THREE.CircleGeometry(br*.95,16),shadowM);sh.rotation.x=-Math.PI/2;sh.position.y=.012;scene.add(sh);
  let ring=null;if(b.color){ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,8,20),mat(b.color));scene.add(ring);}
  return {b,m,sh,ring};});
 function update(f,camera){
  if(model.tick)model.tick();
  for(const a of actors){const p=a.it.pos(f);a.g.visible=!!p;if(a.sh)a.sh.visible=!!p;if(!p)continue;
   const h=a.it.lift?a.it.lift(f):0;a.g.position.set(p[0],h,p[1]);if(a.sh)a.sh.position.set(p[0],.01,p[1]);
   if(a.it.tilt&&a.body){a.body.rotation.z=a.it.tilt(f);}}
  for(const o of balls){const q=o.b.at(f);const vis=!!q;o.m.visible=o.sh.visible=vis;if(o.ring)o.ring.visible=vis;if(!q)continue;
   o.m.position.set(q[0],q[1],q[2]);o.sh.position.set(q[0],.012,q[2]);if(o.ring){o.ring.position.copy(o.m.position);o.ring.lookAt(camera.position);}}
  for(const P of polys)if(P.p.vis)P.m.visible=P.p.vis(f);
 }
 function dispose(){scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});}
 return {scene,update,dispose};
}
// standpunten: afstand, draaiing om het veld, hoek vanaf boven, middelpunt (meters); k = schaal (mini's kleiner)
const VIEWS={achter:{r:17,th:0,ph:.78,tz:1.2},boven:{r:25,th:0,ph:.02,tz:0},zij:{r:17,th:Math.PI/2,ph:.85,tz:0},overkant:{r:17,th:Math.PI,ph:.78,tz:-1.2}};
function aim(O,name,asp,model){const v=VIEWS[name],k=(model&&model.k)||1;
 O.r=model&&model.fit&&name==='zij'?model.fit(asp):v.r*k*(name==='zij'?Math.max(1,asp)*1.1:name==='boven'?Math.max(1,asp*.75):(asp<1?1.15:1.05+(asp-1)*1.1));O.th=v.th;O.ph=v.ph;O.tg.set(0,.8*Math.min(1,k+.2),v.tz*k);}
function place(O,camera){O.ph=Math.max(.02,Math.min(1.5,O.ph));O.r=Math.max(3,Math.min(45,O.r));
 camera.position.set(O.tg.x+O.r*Math.sin(O.ph)*Math.sin(O.th),O.tg.y+O.r*Math.cos(O.ph),O.tg.z+O.r*Math.sin(O.ph)*Math.cos(O.th));camera.lookAt(O.tg);}

// ---------- groot venster: zelf draaien, zoomen, standpunt, pauze, snelheid ----------
const CSS='#d3{border:0;padding:0;margin:0;width:100vw;max-width:100vw;height:100%;max-height:100dvh;background:var(--bg,#fff);color:inherit}'
 +'#d3[open]{display:flex;flex-direction:column}#d3::backdrop{background:rgba(0,0,0,.6)}'
 +'#d3 .d3h{display:flex;align-items:center;gap:10px;padding:10px 12px 6px}#d3 .d3h b{flex:1;font-size:16px;line-height:1.25}'
 +'#d3 button{min-height:40px;padding:6px 12px;font-weight:700;border-radius:10px}'
 +'#d3 .d3c{position:relative;flex:1;min-height:200px;margin:0 12px;border-radius:14px;overflow:hidden;background:#1d1d1b;touch-action:none}'
 +'#d3 canvas{display:block;width:100%;height:100%;cursor:grab}#d3 .d3msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;text-align:center;padding:20px}'
 +'#d3 .d3cap{margin:8px 12px 0;font-size:15px;min-height:1.3em}'
 +'#d3 .d3bar{display:flex;flex-wrap:wrap;gap:6px;padding:6px 12px}#d3 .d3bar .on{outline:2px solid var(--acc,#0089fe)}'
 +'#d3 .d3n{margin:0 12px calc(10px + env(safe-area-inset-bottom));font-size:12.5px;opacity:.75}'
 // ingebouwde 3D over de 2D-animatie
 +'.a3w{position:relative}.a3w>canvas.a3c{position:absolute;display:none;pointer-events:none;border-radius:10px}'
 +'.a3w.a3on>canvas.a3c{display:block}.a3w.a3on>svg,.a3w.a3on>#rotSvg>svg,.a3w.a3on>#dSvg>svg{visibility:hidden}'
 +'.a3w>.a3b{position:absolute;top:6px;right:6px;display:flex;gap:6px;z-index:2}.a3w>#rotSvg~.a3b,.a3w>#dSvg~.a3b{top:16px}.a3w>.a3b button{min-height:32px;padding:4px 10px;font-size:13px;font-weight:800;border-radius:9px;border:0;background:rgba(29,29,27,.78);color:#fff;cursor:pointer}'
 +'.a3w:not(.a3on)>.a3b [data-a3=open]{display:none}.a3w.a3sm>canvas.a3c,.a3w.a3sm>.a3b{display:none!important}.a3w.a3sm.a3on>svg{visibility:visible}'
 +'@media print{.a3w>canvas.a3c,.a3w>.a3b{display:none!important}.a3w.a3on>svg,.a3w.a3on>#rotSvg>svg,.a3w.a3on>#dSvg>svg{visibility:visible!important}}';
let cssDone=false;
function css(){if(cssDone)return;cssDone=true;const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);}
let V=null; // het open venster
function ui(){
 let dlg=document.getElementById('d3');
 if(dlg)return dlg;
 css();
 dlg=document.createElement('dialog');dlg.id='d3';dlg.className='noprint';dlg.setAttribute('aria-label','3D-weergave');
 dlg.innerHTML='<div class="d3h"><b></b><button type="button" data-d3="close" aria-label="Sluiten">&#10005; Sluiten</button></div>'
  +'<div class="d3c"><div class="d3msg">3D laden&hellip;</div></div>'
  +'<p class="d3cap" aria-live="polite"></p>'
  +'<div class="d3bar" role="group" aria-label="Standpunt"><button type="button" data-cam="achter">Achter</button><button type="button" data-cam="boven">Boven</button><button type="button" data-cam="zij">Zij</button><button type="button" data-cam="overkant">Overkant</button></div>'
  +'<div class="d3bar" role="group" aria-label="Afspelen"><button type="button" data-d3="play" aria-label="Pauze">&#10074;&#10074;</button><button type="button" data-d3="reset" aria-label="Opnieuw">&#8634;</button><button type="button" data-spd=".25">0,25x</button><button type="button" data-spd=".5">0,5x</button><button type="button" data-spd="1">1x</button></div>'
  +'<p class="d3n">Sleep om te draaien, knijp of scroll om in te zoomen.</p>';
 document.body.appendChild(dlg);
 dlg.addEventListener('close',stop);
 dlg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!V)return;
  if(b.dataset.d3==='close')dlg.close();
  else if(b.dataset.d3==='play'){V.play=!V.play;mark();}
  else if(b.dataset.d3==='reset'){V.t=0;V.play=true;mark();}
  else if(b.dataset.spd){V.spd=+b.dataset.spd;mark();}
  else if(b.dataset.cam){V.view=b.dataset.cam;aim(V.O,V.view,V.asp,V.model);place(V.O,V.camera);mark();}});
 return dlg;
}
function mark(){const dlg=document.getElementById('d3');if(!dlg||!V)return;
 const pb=dlg.querySelector('[data-d3=play]');pb.innerHTML=V.play?'&#10074;&#10074;':'&#9654;';pb.setAttribute('aria-label',V.play?'Pauze':'Afspelen');
 dlg.querySelectorAll('[data-spd]').forEach(b=>b.classList.toggle('on',+b.dataset.spd===V.spd));
 dlg.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===V.view));}
function open(model,t0){
 const dlg=ui();
 dlg.querySelector('.d3h b').textContent=model.title;
 const box=dlg.querySelector('.d3c');box.innerHTML='<div class="d3msg">3D laden&hellip;</div>';
 dlg.querySelector('.d3cap').textContent='';
 if(!dlg.open)dlg.showModal();
 loadThree().then(()=>{if(dlg.open)start(model,box,t0||0);})
  .catch(()=>{box.innerHTML='<div class="d3msg">3D kon niet geladen worden (geen internet?). De 2D-animatie werkt gewoon.</div>';});
}
function start(model,box,t0){
 const THREE=window.THREE;
 stop();
 box.innerHTML='';
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){box.innerHTML='<div class="d3msg">Dit toestel kan geen 3D tonen. De 2D-animatie werkt gewoon.</div>';return;}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 box.appendChild(renderer.domElement);
 const B=build(model);
 const camera=new THREE.PerspectiveCamera(45,1,.1,200);
 const O={r:20,th:0,ph:1.05,tg:new THREE.Vector3(0,.8,0)};
 V={renderer,B,camera,model,O,t:t0,play:true,spd:1,view:'achter',asp:1,raf:0,last:0,ro:null,frames:0,slow:0};
 window.__d3=V;
 const size=()=>{const w=box.clientWidth||300,h=box.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();V.asp=h/w;};
 const el=renderer.domElement,pts=new Map();let pinch=0;
 el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}if(V)V.view='';mark();});
 el.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;
  if(pts.size===1){O.th-=(e.clientX-p[0])*.008;O.ph-=(e.clientY-p[1])*.006;place(O,camera);}
  pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch){O.r*=pinch/d;place(O,camera);}pinch=d;}});
 const up=e=>{pts.delete(e.pointerId);pinch=0;};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>{e.preventDefault();O.r*=Math.exp(e.deltaY*.001);place(O,camera);},{passive:false});
 V.view=model.view||'achter';size();aim(O,V.view,V.asp,model);place(O,camera);
 V.ro=new ResizeObserver(()=>{size();if(V&&V.view)aim(O,V.view,V.asp,model);place(O,camera);});V.ro.observe(box);
 mark();
 const capEl=document.getElementById('d3').querySelector('.d3cap');
 const loop=ts=>{
  if(!V||V.renderer!==renderer)return;
  const dt=V.last?Math.min(.1,(ts-V.last)/1000):0;V.last=ts;
  if(V.play)V.t+=dt*V.spd;
  if(model.seek)model.seek(V.t);
  const f=(V.t/model.dur)%1;
  B.update(f,camera);
  const c=model.cap(f);if(capEl._c!==c){capEl._c=c;capEl.textContent=c;}
  renderer.render(B.scene,camera);
  if(dt){V.frames++;if(dt>.07)V.slow++;if(V.frames===90&&V.slow>45)capEl.insertAdjacentHTML('afterend','<p class="d3n">Deze telefoon heeft moeite met 3D. Tik op Sluiten en daarna op 2D voor de gewone animatie.</p>');}
  V.raf=requestAnimationFrame(loop);};
 V.raf=requestAnimationFrame(loop);
}
function stop(){
 if(!V)return;cancelAnimationFrame(V.raf);if(V.ro)V.ro.disconnect();
 if(V.model.release)V.model.release();
 V.B.dispose();try{V.renderer.forceContextLoss();}catch(e){}V.renderer.dispose();if(V.renderer.domElement)V.renderer.domElement.remove();V=null;window.__d3=null;
}

// ---------- ingebouwde 3D: standaard over elke 2D-animatie ----------
// Eén gedeelde WebGL-tekenaar; elk zichtbaar veld krijgt een gewoon canvas waarin het beeld wordt gekopieerd.
const KEY='vw3d';
const store={get(){try{return localStorage.getItem(KEY);}catch(e){return null;}},set(v){try{localStorage.setItem(KEY,v);}catch(e){}}};
let want3d=store.get()!=='2d',broken=false; // broken: geen WebGL/three.js of te traag toestel
const hosts=[],bySvg=new WeakMap();
let R=null,io=null,ro=null,raf=0,lastTs=0,cost=0,costN=0;
const on=()=>want3d&&!broken;
function btns(h){const live=on()&&!!h.B&&!h.err,show=!broken&&(live||!want3d);
 h.bar.style.display=show?'':'none';
 const k=(live?'1':'0')+show;if(h.bk===k)return;h.bk=k;
 h.bar.innerHTML=live?'<button type="button" data-a3="open" aria-label="Draaibaar 3D-venster openen">&#10530; Draaien</button><button type="button" data-a3="mode" aria-label="Toon 2D-animatie">2D</button>':'<button type="button" data-a3="mode" aria-label="Toon 3D-animatie">3D</button>';}
function refresh(){hosts.forEach(h=>{h.wrap.classList.toggle('a3on',on()&&!!h.B);btns(h);});kick();}
function svgOf(h){return h.kind==='rot'?h.wrap.querySelector('#rotSvg svg'):h.kind==='def'?h.wrap.querySelector('#dSvg svg'):h.svg;}
function modelOf(h){
 if(h.kind==='mini')return miniModel(h.svg);
 if(h.kind==='sen'){const st=h.wrap.closest('.stp'),id=st&&st.dataset.senid,d=id&&(window.SEN||[]).find(x=>x.id===id);return d?senModel(d):null;}
 if(h.kind==='rot')return typeof ROT!=='undefined'?rotModel(rotN):null;
 if(h.kind==='def')return typeof getDef==='function'?defModel():null;
}
function frameOf(h){
 if(h.kind==='sen'){try{return (h.svg.getCurrentTime()%9)/9;}catch(e){return 0;}}
 if(h.kind==='rot')return (typeof rotF!=='undefined'?rotF:0)/3;
 if(h.kind==='def')return (typeof dF!=='undefined'?dF:0)/3;
 return 0;
}
function sigOf(h){if(h.kind==='rot')return 'r'+rotN;if(h.kind==='def'){const g=getDef();return g.key+dMode+dInsp+dAll;}
 if(h.kind==='sen'){const st=h.wrap.closest('.stp');return 's'+(st&&st.dataset.senid);}
 return 'm'+h.svg.getAttribute('aria-label')+h.svg.childElementCount;}
function addHost(kind,target){
 css();
 let wrap;
 if(kind==='rot'||kind==='def'){wrap=target.parentNode&&target.parentNode.classList.contains('a3w')?target.parentNode:null;
  if(!wrap){wrap=document.createElement('div');wrap.className='a3w';target.parentNode.insertBefore(wrap,target);wrap.appendChild(target);}}
 else{const p=target.parentNode;
  if(p&&p.classList&&p.classList.contains('a3w'))wrap=p; // kopie (bijv. groot scherm): opnieuw opbouwen
  else{wrap=document.createElement('div');wrap.className='a3w';p.insertBefore(wrap,target);wrap.appendChild(target);}}
 hosts.filter(x=>x.wrap===wrap).forEach(drop);
 wrap.querySelectorAll(':scope>canvas.a3c,:scope>.a3b').forEach(n=>n.remove());
 wrap.classList.remove('a3on');
 const cv=document.createElement('canvas');cv.className='a3c';cv.setAttribute('aria-hidden','true');wrap.appendChild(cv);
 const bar=document.createElement('div');bar.className='a3b noprint';wrap.appendChild(bar);
 const h={kind,wrap,svg:kind==='rot'||kind==='def'?null:target,cv,ctx:cv.getContext('2d'),bar,B:null,model:null,sig:'',vis:false,w:0,hgt:0};
 if(h.svg)bySvg.set(h.svg,h);
 hosts.push(h);btns(h);
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.a3==='mode'){want3d=!want3d;store.set(want3d?'3d':'2d');if(want3d)ensure();refresh();}
  else if(b.dataset.a3==='open'){const m=modelOf(h);if(!m)return;open(m,h.kind==='mini'?m.now():frameOf(h)*m.dur);}});
 if(io)io.observe(wrap);if(ro)ro.observe(wrap);
 return h;
}
function drop(h){const i=hosts.indexOf(h);if(i>=0)hosts.splice(i,1);if(io)io.unobserve(h.wrap);if(ro)ro.unobserve(h.wrap);if(h.B)h.B.dispose();h.B=null;}
function scan(){
 document.querySelectorAll('svg.scn,svg.senv').forEach(s=>{if(!bySvg.has(s))addHost(s.classList.contains('scn')?'mini':'sen',s);});
 ['rotSvg','dSvg'].forEach(id=>{const el=document.getElementById(id);if(el&&!hosts.some(h=>h.wrap.contains(el)))addHost(id==='rotSvg'?'rot':'def',el);});
 kick();
}
let scanQ=0;
function queueScan(){if(scanQ)return;scanQ=requestAnimationFrame(()=>{scanQ=0;scan();});}
function ensure(){
 if(R||broken)return;
 loadThree().then(()=>{
  if(R)return;
  try{const c=document.createElement('canvas');R=new THREE.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:false});R.setPixelRatio(1);R.setScissorTest(true);
   // WebGL kwijt (bijv. door de videokaart): opnieuw beginnen in plaats van een stilstaand beeld te laten staan
   c.addEventListener('webglcontextlost',e=>{e.preventDefault();lost();},false);}
  catch(e){broken=true;refresh();return;}
  kick();
 }).catch(()=>{/* geen internet: 2D blijft */});
}
function lost(){const r=R;R=null;hosts.forEach(h=>{h.B=null;h.sig='';h.wrap.classList.remove('a3on');btns(h);});try{if(r)r.dispose();}catch(e){}
 if(++losses<=3)setTimeout(ensure,500);else{broken=true;refresh();}}
let losses=0;
function kick(){if(!raf&&on()&&hosts.some(h=>h.vis&&!h.small))raf=requestAnimationFrame(loop);}
function loop(ts){
 raf=0;
 if(!on()||!R)return;
 if(V){raf=requestAnimationFrame(loop);return;} // groot venster open: even niet
 if(ts-lastTs<33){raf=requestAnimationFrame(loop);return;} // ~30 beelden per seconde is genoeg
 lastTs=ts;
 const t0=performance.now();
 const dpr=Math.min(1.5,window.devicePixelRatio||1);
 for(const h of hosts.slice())if(!h.wrap.isConnected||(h.svg&&!h.svg.isConnected))drop(h);
 const act=[];
 for(const h of hosts){if(!h.vis||h.small)continue;const s=svgOf(h);if(!s)continue;const r=s.getBoundingClientRect();if(r.width<20||r.height<20)continue;
  const wr=h.wrap.getBoundingClientRect();act.push({h,r,wr,s});}
 let need=[1,1];act.forEach(a=>{need[0]=Math.max(need[0],Math.round(a.r.width*dpr));need[1]=Math.max(need[1],Math.round(a.r.height*dpr));});
 const cur=R.getSize(new THREE.Vector2());if(need[0]>cur.x||need[1]>cur.y)R.setSize(Math.max(need[0],cur.x),Math.max(need[1],cur.y),false);
 const H=R.domElement.height;
 for(const a of act){const h=a.h;
  try{
  if(h.err)continue;
  const sig=sigOf(h);
  if(!h.B||h.sig!==sig){if(h.B)h.B.dispose();h.B=null;h.model=modelOf(h);if(!h.model){h.wrap.classList.remove('a3on');btns(h);continue;}h.B=build(h.model);h.sig=sig;
   h.cam=new THREE.PerspectiveCamera(45,1,.1,200);h.O={r:20,th:0,ph:1.05,tg:new THREE.Vector3(0,.8,0)};h.w=0;h.wrap.classList.add('a3on');btns(h);}
  const w=Math.round(a.r.width*dpr),hh=Math.round(a.r.height*dpr);
  if(h.w!==w||h.hgt!==hh){h.w=w;h.hgt=hh;h.cv.width=w;h.cv.height=hh;h.cam.aspect=w/hh;h.cam.updateProjectionMatrix();aim(h.O,h.model.view||'achter',hh/w,h.model);place(h.O,h.cam);}
  const st=h.cv.style,L=(a.r.left-a.wr.left)+'px',T=(a.r.top-a.wr.top)+'px';
  if(st.left!==L)st.left=L;if(st.top!==T)st.top=T;st.width=a.r.width+'px';st.height=a.r.height+'px';
  h.B.update(frameOf(h),h.cam);
  R.setViewport(0,0,w,hh);R.setScissor(0,0,w,hh);R.render(h.B.scene,h.cam);
  h.ctx.drawImage(R.domElement,0,H-hh,w,hh,0,0,w,hh);
  }catch(e){ // deze animatie lukt niet in 3D: toon 2D en ga door met de rest
   h.err=true;h.B=null;h.wrap.classList.remove('a3on');btns(h);if(window.console)console.warn('3D',e);}
 }
 // te traag? dan terug naar 2D voor deze sessie
 if(act.length){cost=cost*.9+(performance.now()-t0)*.1;costN++;
  if(costN>60&&cost>40){broken=true;refresh();return;}}
 if(act.length&&R)raf=requestAnimationFrame(loop);
}
function init(){
 css();
 io=new IntersectionObserver(es=>{es.forEach(e=>{const h=hosts.find(x=>x.wrap===e.target);if(h)h.vis=e.isIntersecting;});if(on())ensure();kick();},{rootMargin:'100px'});
 ro=new ResizeObserver(es=>{es.forEach(e=>{const h=hosts.find(x=>x.wrap===e.target);if(!h)return;h.small=e.contentRect.width<200;h.wrap.classList.toggle('a3sm',h.small);});kick();});
 hosts.forEach(h=>{io.observe(h.wrap);ro.observe(h.wrap);});
 new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;
  if(n.matches('svg.scn,svg.senv')||(n.nodeName!=='svg'&&n.querySelector&&n.querySelector('svg.scn,svg.senv'))){queueScan();return;}}}).observe(document.body,{childList:true,subtree:true});
 scan();
 if(on())ensure();
 document.addEventListener('visibilitychange',kick);
}

// ---------- knoppen ----------
window.open3D=open;
window.d3Sen=id=>{const d=(window.SEN||[]).find(x=>x.id===id);if(!d)return;const h=hosts.find(x=>x.kind==='sen'&&x.wrap.closest('.stp')&&x.wrap.closest('.stp').dataset.senid===id);open(senModel(d),h?frameOf(h)*9:0);};
window.d3Rot=()=>{if(typeof ROT!=='undefined'&&typeof rotN!=='undefined')open(rotModel(rotN),rotF/3*(3/.48));};
window.d3Def=()=>{if(typeof getDef==='function')open(defModel(),dF/3*(3/.48));};
window.__a3={hosts,state:()=>({want3d,broken,ready:!!R}),gl:()=>R,senModel,miniModel,rotModel,defModel,build};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
