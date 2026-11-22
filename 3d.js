// 3d.js – 3D-weergave van de animaties (versie 2, fase 0: proef).
// Knop "3D" bij de 5-1 rotaties en bij de animaties van Jeugd & Senioren. Opent een venster met een
// draaibaar 3D-veld. De gegevens komen uit dezelfde bron als de 2D-animatie (ROT in index.html en
// window.SEN in senioren.js); er wordt niets per oefening opnieuw getekend.
// three.js (open source) wordt pas geladen als iemand op 3D tikt. Werkt het niet, dan blijft 2D gewoon werken.
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

// ---------- veld: SVG-coördinaten (560x680, veld x 110-450, y 40-640, net y 340) naar meters ----------
const MX=x=>(x-280)/(340/9),MZ=y=>(y-340)/(600/18);
const ease=u=>u*u*(3-2*u);
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

// ---------- modellen ----------
// Jeugd & Senioren: spelers met 4 (of 7) posities, bal met 5 (of 6) punten, 9 seconden per ronde (zoals in 2D)
const OBJ=new Set(['K','M','M1','M2','M5','M6','Z','GZ','BOX']);
function senModel(d){
 const kt=[0,.15,.3,.45,.6,.82,.96,1],kb=[0,.15,.3,.45,.6,.7,.96,1],STB=[0,.15,.3,.45,.6,.82];
 const b=d.bal||[],six=b.length===6,still=!b.length||b.every(x=>x[0]===b[0][0]&&x[1]===b[0][1]);
 const items=[];
 const people=d.p.filter(p=>!OBJ.has(p[0]));
 const tracks=people.map(p=>{const q=p[2];return q.length>=7?[...q.slice(0,7),q[6]]:[...q,q[3],q[0],q[0],q[0]];});
 d.p.forEach(p=>{if(!OBJ.has(p[0]))return;const [x,y]=p[2][0];items.push({kind:/^M\d?$/.test(p[0])?'mat':p[0]==='K'?'cone':'box',pos:[MX(x),MZ(y)]});});
 // bal: punten en tijden zoals in 2D; contact op 1 m hoogte
 let bp=null,bt=null;
 if(!still){const bs=six?[...b,b[5],b[5]]:[...b,b[4],b[4],b[0]];bp=bs.map(v=>[MX(v[0]),1,MZ(v[1])]);bt=six?kt:kb;}
 // sprong: een speler dicht bij het net die de bal raakt en de bal gaat daarna over het net
 const jumps=people.map(()=>[]);
 if(bp)for(let i=1;i<b.length;i++){const t=bt[i],nx=bp[i+1];if(!nx||bp[i][2]*nx[2]>=0)continue;
  people.forEach((p,j)=>{const q=kfAt(tracks[j],kt,t);if(Math.hypot(q[0]-b[i][0],q[1]-b[i][1])<45&&Math.abs(q[1]-340)<110){jumps[j].push(t);bp[i][1]=2.7;}});}
 people.forEach((p,j)=>items.push({kind:'player',label:p[0],color:p[1],pos:f=>{const q=kfAt(tracks[j],kt,f);return [MX(q[0]),MZ(q[1])];},lift:f=>jumps[j].reduce((h,t)=>h+bump(f,t,.05,.6),0)}));
 const balls=bp?[{at:f=>(!six&&f>=.96)?null:ballAt(bp,bt,f)}]:[];
 const st=(d.stappen||[]).slice(0,4);
 const cap=f=>{for(let i=1;i<STB.length;i++)if(f<STB[i])return i<=st.length?'Stap '+i+': '+st[i-1]:'';return six?'Stap 5: '+(d.stappen[d.stappen.length-1]||''):'Terug naar de beginopstelling';};
 return {title:d.t,dur:9,items,balls,cap,court:'#0a7be0'};
}
// 5-1 rotaties: drie fases (service, pass naar SV, set-up en aanloop), zoals op het tabblad 5-1 rotaties
function rotModel(n){
 const R=ROT[n],my=typeof mapY==='function'?mapY:(y=>y),P=v=>[MX(v[0]),MZ(my(v[1]))];
 const eio=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const tgCol=new Set(R.tg.map(t=>t.col));
 const items=Object.entries(R.players).map(([k,o])=>({kind:'player',label:k,color:o.c,
  pos:f=>{const F=f*3,seg=Math.min(2,Math.floor(F)),lt=F-seg,st=eio(lt),a=P(o.kf[seg]),b=P(o.kf[seg+1]||o.kf[seg]);let x=a[0]+(b[0]-a[0])*st;const z=a[1]+(b[1]-a[1])*st;if(seg===0&&o.arc0)x+=Math.sin(st*Math.PI)*MX(280+o.arc0);return [x,z];},
  lift:f=>{const F=f*3;return F>=2&&tgCol.has(o.c)&&k!=='SV'?bump(F,2.85,.2,.65):0;}}));
 const rv=R.players[R.recv].kf[0],pass=[MX(rv[0]),.9,MZ(my(rv[1]))],sv=[MX(336),2.5,MZ(my(188))],srv=[MX(280),2.6,MZ(48)];
 const seg=(a,c,peak)=>u=>[a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*u+4*peak*u*(1-u),a[2]+(c[2]-a[2])*u];
 const s0=seg(srv,pass,2.2),s1=seg(pass,sv,2.6);
 const balls=[{at:f=>{const F=f*3;if(F<1)return s0(F);if(F<2)return s1(F-1);return null;}}]
  .concat(R.tg.map(t=>{const to=[MX(t.to[0]),3,MZ(my(t.to[1]))],s2=seg(sv,to,1.2);return {at:f=>{const F=f*3;return F>=2?s2(F-2):null;},color:t.col};}));
 const caps=['Fase 1: service onderweg; SV, MID1 en DIA maken direct ruimte','Fase 2: pass naar SV; de aanvallers halen uit om aan te lopen','Fase 3: vier set-up-opties vanuit SV; iedereen loopt tegelijk aan'];
 return {title:R.title,dur:3/.48,items,balls,cap:f=>caps[Math.min(2,Math.floor(f*3))],court:'#0a7be0'};
}

// standpunten: afstand, draaiing om het veld, hoek vanaf boven, middelpunt (meters)
const VIEWS={achter:{r:17,th:0,ph:.78,tz:1.2},boven:{r:25,th:0,ph:.02,tz:0},zij:{r:17,th:Math.PI/2,ph:.85,tz:0},overkant:{r:17,th:Math.PI,ph:.78,tz:-1.2}};
// ---------- venster ----------
const CSS='#d3{border:0;padding:0;margin:0;width:100vw;max-width:100vw;height:100%;max-height:100dvh;background:var(--bg,#fff);color:inherit}'
 +'#d3[open]{display:flex;flex-direction:column}#d3::backdrop{background:rgba(0,0,0,.6)}'
 +'#d3 .d3h{display:flex;align-items:center;gap:10px;padding:10px 12px 6px}#d3 .d3h b{flex:1;font-size:16px;line-height:1.25}'
 +'#d3 button{min-height:40px;padding:6px 12px;font-weight:700;border-radius:10px}'
 +'#d3 .d3c{position:relative;flex:1;min-height:200px;margin:0 12px;border-radius:14px;overflow:hidden;background:#1d1d1b;touch-action:none}'
 +'#d3 canvas{display:block;width:100%;height:100%;cursor:grab}#d3 .d3msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;text-align:center;padding:20px}'
 +'#d3 .d3cap{margin:8px 12px 0;font-size:15px;min-height:2.6em}'
 +'#d3 .d3bar{display:flex;flex-wrap:wrap;gap:6px;padding:6px 12px}#d3 .d3bar .on{outline:2px solid var(--acc,#0089fe)}'
 +'#d3 .d3n{margin:0 12px calc(10px + env(safe-area-inset-bottom));font-size:12.5px;opacity:.75}';
let V=null; // het open venster
function ui(){
 let dlg=document.getElementById('d3');
 if(dlg)return dlg;
 const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 dlg=document.createElement('dialog');dlg.id='d3';dlg.className='noprint';dlg.setAttribute('aria-label','3D-weergave');
 dlg.innerHTML='<div class="d3h"><b></b><button type="button" data-d3="close" aria-label="Sluiten">&#10005; Sluiten</button></div>'
  +'<div class="d3c"><div class="d3msg">3D laden&hellip;</div></div>'
  +'<p class="d3cap" aria-live="polite"></p>'
  +'<div class="d3bar" role="group" aria-label="Standpunt"><button type="button" data-cam="achter">Achter</button><button type="button" data-cam="boven">Boven</button><button type="button" data-cam="zij">Zij</button><button type="button" data-cam="overkant">Overkant</button></div>'
  +'<div class="d3bar" role="group" aria-label="Afspelen"><button type="button" data-d3="play" aria-label="Pauze">&#10074;&#10074;</button><button type="button" data-d3="reset" aria-label="Opnieuw">&#8634;</button><button type="button" data-spd=".25">0,25x</button><button type="button" data-spd=".5">0,5x</button><button type="button" data-spd="1">1x</button></div>'
  +'<p class="d3n">Proefversie 3D. Sleep om te draaien, knijp of scroll om in te zoomen.</p>';
 document.body.appendChild(dlg);
 dlg.addEventListener('close',stop);
 dlg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!V)return;
  if(b.dataset.d3==='close')dlg.close();
  else if(b.dataset.d3==='play'){V.play=!V.play;mark();}
  else if(b.dataset.d3==='reset'){V.f=0;V.play=true;mark();}
  else if(b.dataset.spd){V.spd=+b.dataset.spd;mark();}
  else if(b.dataset.cam){cam(b.dataset.cam);mark();}});
 return dlg;
}
function mark(){const dlg=document.getElementById('d3');if(!dlg||!V)return;
 const pb=dlg.querySelector('[data-d3=play]');pb.innerHTML=V.play?'&#10074;&#10074;':'&#9654;';pb.setAttribute('aria-label',V.play?'Pauze':'Afspelen');
 dlg.querySelectorAll('[data-spd]').forEach(b=>b.classList.toggle('on',+b.dataset.spd===V.spd));
 dlg.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===V.view));}

function open(model){
 const dlg=ui();
 dlg.querySelector('.d3h b').textContent=model.title;
 const box=dlg.querySelector('.d3c');box.innerHTML='<div class="d3msg">3D laden&hellip;</div>';
 dlg.querySelector('.d3cap').textContent='';
 if(!dlg.open)dlg.showModal();
 loadThree().then(()=>{if(dlg.open)start(model,box);})
  .catch(()=>{box.innerHTML='<div class="d3msg">3D kon niet geladen worden (geen internet?). De 2D-animatie werkt gewoon.</div>';});
}

// ---------- 3D-scène ----------
function label(THREE,text,color){
 const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');
 g.fillStyle='rgba(29,29,27,.85)';g.beginPath();if(g.roundRect)g.roundRect(4,8,120,48,14);else g.rect(4,8,120,48);g.fill();
 g.strokeStyle=color;g.lineWidth=5;g.stroke();
 g.fillStyle='#fff';g.font='900 30px Poppins,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,64,33);
 const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(.9,.45,1);s.renderOrder=10;return s;
}
function start(model,box){
 const THREE=window.THREE;
 stop();
 box.innerHTML='';
 const renderer=new THREE.WebGLRenderer({antialias:true});
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 box.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1d1d1b');
 const camera=new THREE.PerspectiveCamera(45,1,.1,200);
 scene.add(new THREE.HemisphereLight(0xffffff,0x334155,.85));
 const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(6,14,8);scene.add(sun);
 const mat=c=>new THREE.MeshLambertMaterial({color:c});
 // vloer, veld, lijnen
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,40),mat('#3f3f46'));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
 const court=new THREE.Mesh(new THREE.PlaneGeometry(9,18),mat(model.court));court.rotation.x=-Math.PI/2;scene.add(court);
 const line=(w,d,x,z,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c||'#ffffff'}));m.rotation.x=-Math.PI/2;m.position.set(x,.005,z);scene.add(m);};
 line(9.1,.05,0,-9);line(9.1,.05,0,9);line(.05,18.1,-4.5,0);line(.05,18.1,4.5,0);line(9,.05,0,0);line(9,.04,0,-3,'#bae6fd');line(9,.04,0,3,'#bae6fd');
 // net: band van 1 m, bovenkant 2,43 m, palen en antennes
 const netM=new THREE.Mesh(new THREE.PlaneGeometry(9.6,.92),new THREE.MeshBasicMaterial({color:'#e5e7eb',transparent:true,opacity:.35,side:THREE.DoubleSide}));netM.position.set(0,1.97,0);scene.add(netM);
 const band=new THREE.Mesh(new THREE.BoxGeometry(9.6,.07,.03),mat('#ffd100'));band.position.set(0,2.43,0);scene.add(band);
 [-5.1,5.1].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,10),mat('#94a3b8'));p.position.set(x,1.3,0);scene.add(p);});
 [-4.5,4.5].forEach(x=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1.8,6),mat('#ef4444'));a.position.set(x,2.33,0);scene.add(a);});
 // spelers en voorwerpen
 const shadowM=new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.28});
 const shadowG=new THREE.CircleGeometry(.32,20);
 const actors=[];
 model.items.forEach(it=>{
  if(it.kind==='mat'){const m=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,1),mat('#e2e8f0'));m.position.set(it.pos[0],.06,it.pos[1]);scene.add(m);return;}
  if(it.kind==='cone'){const m=new THREE.Mesh(new THREE.ConeGeometry(.18,.4,14),mat('#f97316'));m.position.set(it.pos[0],.2,it.pos[1]);scene.add(m);return;}
  if(it.kind==='box'){const m=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),mat('#a16207'));m.position.set(it.pos[0],.3,it.pos[1]);scene.add(m);return;}
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.26,1.25,16),mat(it.color));body.position.y=.63;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),mat('#d9a066'));head.position.y=1.42;g.add(head);
  const lb=label(THREE,it.label,it.color);lb.position.y=2.05;g.add(lb);
  const sh=new THREE.Mesh(shadowG,shadowM);sh.rotation.x=-Math.PI/2;sh.position.y=.01;scene.add(sh);
  scene.add(g);actors.push({it,g,sh});
 });
 const balls=model.balls.map(b=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.15,18,14),mat('#fde047'));scene.add(m);
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.14,16),shadowM);sh.rotation.x=-Math.PI/2;sh.position.y=.012;scene.add(sh);
  let ring=null;if(b.color){ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,8,20),mat(b.color));scene.add(ring);}
  return {b,m,sh,ring};});
 // camera: draaien om een punt (bolcoördinaten)
 const O={r:20,th:0,ph:1.05,tg:new THREE.Vector3(0,.8,0)};
 const place=()=>{O.ph=Math.max(.02,Math.min(1.5,O.ph));O.r=Math.max(6,Math.min(40,O.r));
  camera.position.set(O.tg.x+O.r*Math.sin(O.ph)*Math.sin(O.th),O.tg.y+O.r*Math.cos(O.ph),O.tg.z+O.r*Math.sin(O.ph)*Math.cos(O.th));camera.lookAt(O.tg);};
 const size=()=>{const w=box.clientWidth||300,h=box.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  // smal scherm: iets verder weg zodat het hele veld in beeld blijft
  O.asp=h/w;};
 // aanraken: één vinger draait, twee vingers zoomen
 const el=renderer.domElement,pts=new Map();let pinch=0;
 el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}if(V)V.view='';mark();});
 el.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;
  if(pts.size===1){O.th-=(e.clientX-p[0])*.008;O.ph-=(e.clientY-p[1])*.006;place();}
  pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch){O.r*=pinch/d;place();}pinch=d;}});
 const up=e=>{pts.delete(e.pointerId);pinch=0;};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>{e.preventDefault();O.r*=Math.exp(e.deltaY*.001);place();},{passive:false});
 V={renderer,scene,camera,model,actors,balls,O,f:0,play:true,spd:1,view:'achter',place,raf:0,last:0,ro:null,frames:0,slow:0};
 window.__d3=V;
 size();cam('achter');
 V.ro=new ResizeObserver(()=>{size();place();});V.ro.observe(box);
 mark();
 const capEl=document.getElementById('d3').querySelector('.d3cap');
 const loop=ts=>{
  if(!V||V.renderer!==renderer)return;
  const dt=V.last?Math.min(.1,(ts-V.last)/1000):0;V.last=ts;
  if(V.play)V.f=(V.f+dt*V.spd/model.dur)%1;
  const f=V.f;
  actors.forEach(a=>{const p=a.it.pos(f),h=a.it.lift?a.it.lift(f):0;a.g.position.set(p[0],h,p[1]);a.sh.position.set(p[0],.01,p[1]);});
  balls.forEach(o=>{const q=o.b.at(f);const vis=!!q;o.m.visible=o.sh.visible=vis;if(o.ring)o.ring.visible=vis;if(!q)return;o.m.position.set(q[0],q[1],q[2]);o.sh.position.set(q[0],.012,q[2]);if(o.ring){o.ring.position.copy(o.m.position);o.ring.lookAt(camera.position);}});
  const c=model.cap(f);if(capEl._c!==c){capEl._c=c;capEl.textContent=c;}
  renderer.render(scene,camera);
  // traag toestel? meld het één keer
  if(dt){V.frames++;if(dt>.07)V.slow++;if(V.frames===90&&V.slow>45)capEl.insertAdjacentHTML('afterend','<p class="d3n">Deze telefoon heeft moeite met 3D. De 2D-animatie werkt even goed.</p>');}
  V.raf=requestAnimationFrame(loop);};
 V.raf=requestAnimationFrame(loop);
}
function cam(name){if(!V)return;const v=VIEWS[name];if(!v)return;
 const a=V.O.asp||1;V.view=name;V.O.r=v.r*(name==='zij'?Math.max(1,a)*1.1:name==='boven'?Math.max(1,a*.75):(a<1?1.15:1+(a-1)*.8));V.O.th=v.th;V.O.ph=v.ph;V.O.tg.set(0,.8,v.tz);V.place();}
function stop(){
 if(!V)return;cancelAnimationFrame(V.raf);if(V.ro)V.ro.disconnect();
 V.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});
 V.renderer.dispose();if(V.renderer.domElement)V.renderer.domElement.remove();V=null;window.__d3=null;
}

// ---------- knoppen ----------
window.open3D=open;
window.d3Sen=id=>{const d=(window.SEN||[]).find(x=>x.id===id);if(d)open(senModel(d));};
window.d3Rot=()=>{if(typeof ROT!=='undefined'&&typeof rotN!=='undefined')open(rotModel(rotN));};
document.addEventListener('click',e=>{const b=e.target.closest('[data-sen3d]');if(!b)return;e.preventDefault();e.stopPropagation();window.d3Sen(b.dataset.sen3d);},true);
// knop bij de 5-1 rotaties (naast Pauzeer en Opnieuw)
const rp=document.getElementById('rotPlay');
if(rp&&!document.getElementById('rot3d')){const b=document.createElement('button');b.id='rot3d';b.type='button';b.textContent='Bekijk in 3D';b.onclick=()=>window.d3Rot();rp.parentNode.appendChild(b);}
})();
