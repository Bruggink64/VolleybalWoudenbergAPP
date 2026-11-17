// scenes.js – scene-engine: tekent per oefening een bovenaanzicht-animatie.
// Gebruik: window.scene(d, n, courts) -> SVG-string.  d = rij uit D, n = aantal spelers, courts = minivelden.
// De scene wordt afgeleid uit de VolleyWijzer-data (window.VWX): benodigdheden, leerlijn en
// sleutelwoorden in de uitvoering. Per oefening bij te sturen via window.SCENE_OVERRIDES[id] (onderaan).
(function(){
'use strict';
const VB_W=320,PAD=30,VMARGIN=22;
const C={line:'#fff',net:'#ffcc00',navy:'#001a33',skin:'#d9a066',ball:'#fde047',ballS:'#b45309',
 teamA:'#1e293b',teamB:'#7f1d1d',trainer:'#0f766e',setter:'#6d28d9',wissel:'#b45309',hoepel:'#f8fafc',pylon:'#f97316',mat:'#2563eb',dikkemat:'#1d4ed8',kast:'#92400e',korf:'#fb923c',bank:'#a16207',kar:'#64748b',muur:'#475569',doel:'#e2e8f0',stoel:'#78350f',koord:'#e11d48'};

// ---------- tekst -> scene-specificatie ----------
const flat=s=>Array.isArray(s)?s[0]+' '+s[1]:s;
const textOf=x=>[x.t,x.i,...x.u.map(flat),...x.a.map(flat)].join(' ').toLowerCase();
const OBJ=[[/hoepel/,'hoepel'],[/pylon|hoedje|dopje|kegel|blokje/,'pylon'],[/dikke mat/,'dikkemat'],[/\bmat/,'mat'],[/kast|bok\b/,'kast'],[/korf|korv|basket/,'korf'],[/bank/,'bank'],[/ballenkar|emmer|bak\b/,'kar'],[/wandrek|muur|wand\b/,'muur'],[/doel/,'doel'],[/stoel/,'stoel'],[/lint|koord|elastiek|touw/,'koord']];
function objects(x){
 const o=[];
 for(const b of x.b){
  const label=(Array.isArray(b)?b[0]:b).toLowerCase();
  const n=Array.isArray(b)?(parseInt(b[1])||1):1;
  for(const [re,t] of OBJ){ if(re.test(label)){ if(!o.some(q=>q.t===t))o.push({t,n:Math.min(n,12)}); break; } }
 }
 return o;
}
function derive(d){
 const x=(window.VWX||{})[d[3]];
 if(!x)return null;
 const t=textOf(x),c=x.c,lvl=+d[0];
 const over=/over het net|over de lijn van het net/.test(t);
 const spec={field:x.v||'450_x_520',net:true,objs:objects(x),form:'pairs',action:'throw',trainer:/trainer/.test(t),teams:null,over,title:x.t};
 const vs=t.match(/(\d)\s*(?:tegen|vs\.?|teg\.)\s*(\d)/);
 const teamDefault=lvl<=2?[2,2]:lvl<=4?[3,3]:[4,4];
 const numbered=x.u.filter(s=>Array.isArray(s)&&/^\d[.)]/.test(s[0])).length>=3;
 if(/tikkertje|tikspel|\btikkers?\b|jager|getikt (is|wordt|bent)/.test(t))spec.form='tag';
 else if(/estafette/.test(t))spec.form='relay';
 else if(/circuit|stations/.test(t)||numbered)spec.form='circuit';
 else if(vs){spec.form='vs';spec.teams=[Math.max(1,Math.min(6,+vs[1])),Math.max(1,Math.min(6,+vs[2]))];}
 else if(/king of the court|partij|wedstrijd|spelvorm|rally|punt gescoord|scoort een punt|team /.test(t)&&(over||c.startsWith('tactiek'))){spec.form='vs';spec.teams=teamDefault;}
 else if(/kring|cirkel/.test(t))spec.form='circle';
 else if(/muur|wandrek/.test(t))spec.form='wall';
 else if(/rij|achter elkaar|om de beurt/.test(t)&&(spec.objs.length||spec.trainer))spec.form='queue';
 else if(/tweetal|twee aan twee|paren|partner|naar elkaar|overgooien|overspelen|tegenover/.test(t))spec.form='pairs';
 else if(/drietal/.test(t))spec.form='triples';
 else if(c==='warming')spec.form='scatter';
 else if(c==='serveren')spec.form='serve';
 else if(c==='aanvallen'||c==='verdedigen')spec.form='queue';
 else if(c==='blokkeren')spec.form='netpairs';
 else if(c.startsWith('tactiek')){spec.form='vs';spec.teams=teamDefault;}
 if(c==='blokkeren'&&spec.form==='pairs')spec.form='netpairs';
 if(c==='serveren'&&(spec.form==='pairs'||spec.form==='queue'))spec.form='serve';
 // actie
 if(/smash|slaan|slaat|sla de bal|aanval/.test(t)||c==='aanvallen')spec.action='smash';
 else if(/serveer|service|opslag/.test(t)||c==='serveren')spec.action='serve';
 else if(/blok/.test(t)||c==='blokkeren')spec.action='block';
 else if(/duik|duikt|valt|rol over|zweef/.test(t)||c==='verdedigen')spec.action='dive';
 else if(/rolt|rollen|rol de bal/.test(t))spec.action='roll';
 else if(/stuit/.test(t))spec.action='bounce';
 else if(/bovenhands/.test(t)||c==='bovenhands')spec.action='overhead';
 else if(/onderarms/.test(t)||c==='onderarms')spec.action='forearm';
 else if(/gooi|werp/.test(t))spec.action='throw';
 else spec.action=c==='warming'?'run':'throw';
 if(spec.form==='tag'||spec.form==='relay'||spec.form==='scatter')spec.action=spec.action==='throw'&&/bal/.test(t)?'throw':'run';
 if(c==='warming'&&!over&&!/\bnet\b/.test(t))spec.net=false;
 if(spec.form==='wall')spec.net=false;
 const ov=(window.SCENE_OVERRIDES||{})[d[3]];
 return ov?Object.assign(spec,ov):spec;
}

// ---------- tekenprimitieven ----------
const n2=v=>Math.round(v*10)/10;
function player(x,y,col,extra){return '<g transform="translate('+n2(x)+' '+n2(y)+')">'+(extra||'')+'<ellipse cx="0" cy="1.6" rx="5.6" ry="3.1" fill="'+(col||C.teamA)+'"/><circle cx="0" cy="-0.6" r="3.4" fill="'+C.skin+'"/></g>';}
function ball(x,y,anim){return '<circle cx="'+n2(x)+'" cy="'+n2(y)+'" r="2.8" fill="'+C.ball+'" stroke="'+C.ballS+'" stroke-width="1">'+(anim||'')+'</circle>';}
function motion(path,dur,begin){return '<animateMotion path="'+path+'" dur="'+n2(dur)+'s" begin="'+n2(begin||0)+'s" repeatCount="indefinite"/>';}
const arcPath=(a,b,h)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2-h;return 'M0 0 Q '+n2(mx-a[0])+' '+n2(my-a[1])+' '+n2(b[0]-a[0])+' '+n2(b[1]-a[1]);};
const thereBack=(a,b,h)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2-h,dx=b[0]-a[0],dy=b[1]-a[1];return 'M0 0 Q '+n2(mx-a[0])+' '+n2(my-a[1])+' '+n2(dx)+' '+n2(dy)+' Q '+n2(mx-a[0])+' '+n2(my-a[1])+' 0 0';};
function obj(t,x,y){
 x=n2(x);y=n2(y);
 switch(t){
  case 'hoepel':return '<circle cx="'+x+'" cy="'+y+'" r="5" fill="none" stroke="'+C.hoepel+'" stroke-width="1.6"/>';
  case 'pylon':return '<path d="M'+x+' '+n2(y-4)+' l3.2 6.5 h-6.4 z" fill="'+C.pylon+'" stroke="#7c2d12" stroke-width=".6"/>';
  case 'mat':return '<rect x="'+n2(x-9)+'" y="'+n2(y-5)+'" width="18" height="10" rx="1.5" fill="'+C.mat+'" stroke="#fff" stroke-width=".8"/>';
  case 'dikkemat':return '<rect x="'+n2(x-12)+'" y="'+n2(y-7)+'" width="24" height="14" rx="2" fill="'+C.dikkemat+'" stroke="#fff" stroke-width="1"/>';
  case 'kast':return '<rect x="'+n2(x-7)+'" y="'+n2(y-5)+'" width="14" height="10" rx="1" fill="'+C.kast+'" stroke="#fde68a" stroke-width=".8"/><line x1="'+n2(x-7)+'" y1="'+y+'" x2="'+n2(x+7)+'" y2="'+y+'" stroke="#fde68a" stroke-width=".6"/>';
  case 'korf':return '<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+n2(y+9)+'" stroke="#334155" stroke-width="1.4"/><circle cx="'+x+'" cy="'+y+'" r="4.5" fill="none" stroke="'+C.korf+'" stroke-width="1.8"/>';
  case 'bank':return '<rect x="'+n2(x-16)+'" y="'+n2(y-2.5)+'" width="32" height="5" rx="1" fill="'+C.bank+'" stroke="#fde68a" stroke-width=".6"/>';
  case 'kar':return '<rect x="'+n2(x-7)+'" y="'+n2(y-5)+'" width="14" height="10" rx="1.5" fill="'+C.kar+'" stroke="#fff" stroke-width=".8"/><circle cx="'+n2(x-3)+'" cy="'+n2(y-1)+'" r="1.8" fill="'+C.ball+'"/><circle cx="'+n2(x+2)+'" cy="'+n2(y+1)+'" r="1.8" fill="'+C.ball+'"/><circle cx="'+n2(x+4)+'" cy="'+n2(y-2)+'" r="1.8" fill="'+C.ball+'"/>';
  case 'doel':return '<rect x="'+n2(x-3)+'" y="'+n2(y-8)+'" width="6" height="16" fill="none" stroke="'+C.doel+'" stroke-width="1.6"/>';
  case 'stoel':return '<rect x="'+n2(x-3.5)+'" y="'+n2(y-3.5)+'" width="7" height="7" rx="1" fill="'+C.stoel+'" stroke="#fde68a" stroke-width=".6"/>';
  case 'koord':return '<line x1="'+n2(x-20)+'" y1="'+y+'" x2="'+n2(x+20)+'" y2="'+y+'" stroke="'+C.koord+'" stroke-width="1.4" stroke-dasharray="3 2"/>';
  default:return '';
 }
}

// ---------- veld (velden staan onder elkaar) ----------
function dims(spec){const m=String(spec.field).split('_x_').map(Number);return m.length===2&&m[0]>0&&m[1]>0?m:[450,520];}
function fieldHeight(spec){const [a,b]=dims(spec);return (VB_W-2*PAD)*a/(2*b)+2*VMARGIN;}
function makeField(y0,spec){
 const pad=PAD,cw=VB_W-2*pad;
 const [a,b]=dims(spec); // breedte x diepte (per helft)
 const ch=cw*a/(2*b);
 const top=y0+VMARGIN;
 const F={cw,ch,top,pad,P:(u,v)=>[pad+u*cw,top+v*ch]};
 let o='<rect x="'+n2(pad)+'" y="'+n2(top)+'" width="'+n2(cw)+'" height="'+n2(ch)+'" rx="3" fill="#fff" fill-opacity=".13" stroke="'+C.line+'" stroke-width="1.6"/>';
 if(spec.form==='wall'){
  o+='<rect x="'+n2(pad-6)+'" y="'+n2(top-6)+'" width="6" height="'+n2(ch+12)+'" fill="'+C.muur+'"/>';
 }else if(spec.net){
  const nx=n2(F.P(.5,0)[0]);
  o+='<line x1="'+nx+'" y1="'+n2(top-8)+'" x2="'+nx+'" y2="'+n2(top+ch+8)+'" stroke="'+C.net+'" stroke-width="3"/><circle cx="'+nx+'" cy="'+n2(top-8)+'" r="2.2" fill="'+C.navy+'"/><circle cx="'+nx+'" cy="'+n2(top+ch+8)+'" r="2.2" fill="'+C.navy+'"/>';
 }else{
  const nx=n2(F.P(.5,0)[0]);
  o+='<line x1="'+nx+'" y1="'+n2(top)+'" x2="'+nx+'" y2="'+n2(top+ch)+'" stroke="'+C.line+'" stroke-width="1" stroke-dasharray="4 3" opacity=".6"/>';
 }
 F.svg=o;
 return F;
}

// ---------- materialen plaatsen ----------
function placeObjects(F,spec,ctx){
 let o='';const targets=[];
 const grid=(n,u0,u1,v0,v1)=>{const cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),pts=[];for(let i=0;i<n;i++){const c=i%cols,r=Math.floor(i/cols);pts.push(F.P(u0+(u1-u0)*(cols===1?.5:c/(cols-1)),v0+(v1-v0)*(rows===1?.5:r/(rows-1))));}return pts;};
 const line=(n,u,v0,v1)=>Array.from({length:n},(_,i)=>F.P(u,v0+(v1-v0)*(n===1?.5:i/(n-1))));
 const q=spec.form==='queue',cir=spec.form==='circuit';
 for(const ob of spec.objs){
  const n=ob.n||1;let pts=[];
  if(ob.at)pts=ob.at.map(p=>F.P(p[0],p[1]));
  else if(ob.grid)pts=grid(Math.min(n,12),.15,.85,.2,.8);
  else switch(ob.t){
   case 'hoepel':pts=q?line(Math.min(n,4),spec.over?.72:.38,.2,.8):grid(Math.min(n,8),.15,.85,.2,.8);break;
   case 'pylon':pts=q?line(Math.min(n,4),spec.over?.78:.42,.2,.8):(n>=6?[...line(Math.ceil(n/2),.02,.08,.92),...line(Math.floor(n/2),.98,.08,.92)]:line(n,.5,.1,.9));break;
   case 'mat':case 'dikkemat':pts=q?line(Math.min(n,3),spec.over?.75:.4,.25,.75):(n===1?[F.P(.75,.5)]:[F.P(.25,.5),F.P(.75,.5)]);break;
   case 'kast':pts=q?[F.P(spec.over?.44:.4,.5)]:(n===1?[F.P(.44,.5)]:[F.P(.44,.3),F.P(.56,.7)]);break;
   case 'korf':pts=q?line(Math.min(n,3),spec.over?.9:.45,.25,.75):(n===1?[F.P(.94,.5)]:[F.P(.06,.5),F.P(.94,.5)]);break;
   case 'bank':pts=q?[F.P(spec.over?.7:.4,.5)]:[F.P(.25,.5),F.P(.75,.5)].slice(0,Math.min(n,2));break;
   case 'kar':pts=[F.P(-0.07,0.08)];break;
   case 'doel':pts=q?line(Math.min(n,2),.96,.3,.7):[F.P(.04,.5),F.P(.96,.5)].slice(0,Math.min(n,2));break;
   case 'stoel':pts=line(Math.min(n,4),spec.over?.75:.4,.2,.8);break;
   case 'koord':pts=[F.P(.5,.5)];break;
   case 'muur':continue;
  }
  if(cir)pts=pts.slice(0,2);
  for(const p of pts)o+=obj(ob.t,p[0],p[1]);
  if(['hoepel','mat','dikkemat','korf','doel','kast','pylon','stoel','bank'].includes(ob.t))targets.push(...pts.map(p=>({t:ob.t,p})));
 }
 ctx.targets=targets;
 return o;
}

// ---------- bal-animaties ----------
function ballAnim(action,a,b,dur,begin){
 const d=dur||2.4,bg=n2(begin||0);
 switch(action){
  case 'roll':return ball(a[0],a[1],motion(thereBack(a,b,0),d*1.4,bg));
  case 'bounce':return ball(a[0],a[1],motion(thereBack(a,b,2),d,bg)+'<animate attributeName="r" values="2.8;1.6;2.8;1.6;2.8" dur="'+d+'s" begin="'+bg+'s" repeatCount="indefinite"/>');
  case 'serve':return ball(a[0],a[1],motion(arcPath(a,b,26),d*1.3,bg)+'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.85;.86;1" dur="'+n2(d*1.3)+'s" begin="'+bg+'s" repeatCount="indefinite"/>');
  case 'smash':return ball(a[0],a[1],'<animateMotion dur="'+d+'s" begin="'+bg+'s" repeatCount="indefinite" keyTimes="0;.55;1" keyPoints="0;.5;1" calcMode="linear" path="M0 0 Q '+n2((b[0]-a[0])*.25)+' '+n2((b[1]-a[1])*.25-18)+' '+n2((b[0]-a[0])*.5)+' '+n2((b[1]-a[1])*.5-10)+' L '+n2(b[0]-a[0])+' '+n2(b[1]-a[1])+'"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.9;1" dur="'+d+'s" begin="'+bg+'s" repeatCount="indefinite"/>');
  case 'block':return ball(a[0],a[1],motion(thereBack(a,b,8),d,bg));
  case 'dive':return ball(a[0],a[1],motion(arcPath(a,b,10),d,bg)+'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.8;.81;1" dur="'+d+'s" begin="'+bg+'s" repeatCount="indefinite"/>');
  case 'overhead':return ball(a[0],a[1],motion(thereBack(a,b,14),d,bg));
  case 'forearm':return ball(a[0],a[1],motion(thereBack(a,b,11),d,bg));
  case 'run':case 'none':return '';
  case 'hold':return ball((a[0]+b[0])/2,(a[1]+b[1])/2);
  case 'arc':return ball(a[0],a[1],motion(arcPath(a,b,8),d,bg)+'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.8;.81;1" dur="'+d+'s" begin="'+bg+'s" repeatCount="indefinite"/>');
  case 'throw':default:return ball(a[0],a[1],motion(thereBack(a,b,9),d,bg));
 }
}
const moveTo=(a,b,dur,begin)=>'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;'+n2(b[0]-a[0])+' '+n2(b[1]-a[1])+';'+n2(b[0]-a[0])+' '+n2(b[1]-a[1])+';0 0" keyTimes="0;.45;.6;1" dur="'+dur+'s" begin="'+n2(begin||0)+'s" repeatCount="indefinite"/>';
const jump=bg=>'<animateTransform attributeName="transform" type="scale" additive="sum" values="1;1.35;1;1;1" keyTimes="0;.15;.3;.9;1" dur="2.4s" begin="'+n2(bg||0)+'s" repeatCount="indefinite"/>';
const dive=dir=>'<animateTransform attributeName="transform" type="rotate" additive="sum" values="0;0;'+(dir>0?70:-70)+';0" keyTimes="0;.55;.7;1" dur="2.4s" repeatCount="indefinite"/>';
const jitter=i=>'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;'+(5-i%3*5)+' '+(i%2?-6:6)+';'+(i%2?-4:4)+' '+(2-i%3*2)+';0 0" dur="'+n2(1.6+i%4*.35)+'s" repeatCount="indefinite"/>';

// ---------- formaties ----------
function distribute(total,f){const base=Math.floor(total/f),rem=total%f;return Array.from({length:f},(_,i)=>base+(i<rem?1:0));}
const vspread=(n,v0,v1)=>Array.from({length:n},(_,i)=>v0+(v1-v0)*(n===1?.5:i/(n-1)));
function scatterPts(k,F){const pts=[];const cols=Math.ceil(Math.sqrt(k*2)),rows=Math.ceil(k/cols);for(let i=0;i<k;i++){const c=i%cols,r=Math.floor(i/cols);pts.push(F.P(.1+.8*(cols===1?.5:c/(cols-1))+(r%2?.04:-.04),.15+.7*(rows===1?.5:r/(rows-1))));}return pts;}
const bench=(F,r,right)=>player(...F.P(right?1.08:-0.08,.25+r*.17),C.wissel);

function formationOld(F,spec,k,fi){
 // statische basisvormen (fallback)
 let o='';const P=F.P,act=spec.action,tg=F.ctx.targets;
 const sideA=C.teamA,sideB=C.teamB;
 if(k<=0)return o;
 switch(spec.form){
  case 'pairs':case 'netpairs':{
   const np=spec.form==='netpairs';
   if(k===1){const a=P(np?.44:.25,.5);return player(a[0],a[1],sideA,np?jump(0):'')+(spec.trainer?'':ballAnim(act,a,P(np?.56:.45,.5),2.4,0));}
   const pairs=Math.floor(k/2),rest=k-pairs*2;
   const overNet=spec.over||np||(spec.net&&['serve','smash'].includes(act));
   const lanes=overNet?pairs:Math.ceil(pairs/2);
   const vsl=vspread(lanes,.15,.85);
   for(let i=0;i<pairs;i++){
    const sh=!overNet&&i%2?.5:0;                       // niet over het net: paren verdelen over beide helften
    const v=vsl[overNet?i:Math.floor(i/2)];
    const uA=np?.44:overNet?.3:.14+sh,uB=np?.56:overNet?.7:.38+sh;
    const a=P(uA,v),b=P(uB,v);
    const ex=np||act==='block'?jump(i*.3):act==='dive'?moveTo(a,P(uA-.06,v+.1),2.4,i*.3):'';
    o+=player(a[0],a[1],sideA,ex)+player(b[0],b[1],overNet?sideB:sideA,np?jump(1.2+i*.3):'');
    o+=ballAnim(act==='run'?'throw':act,a,b,2.4,i*.3);
   }
   for(let r=0;r<rest;r++)o+=bench(F,r,false);
   break;
  }
  case 'triples':{
   if(k<3){const a=P(.2,.5),b=P(.4,.5);o+=player(...a,sideA);if(k===2)o+=player(...b,sideA)+ballAnim(act,a,b,2,0);break;}
   const g=Math.floor(k/3),rest=k-g*3;const vs=vspread(g,.18,.82);
   vs.forEach((v,i)=>{const sh=i%2?.5:0;const a=P(.1+sh,v),b=P(.25+sh,v-.08),c=P(.4+sh,v+.06);o+=player(...a,sideA)+player(...b,sideA)+player(...c,sideA)+ballAnim(act,a,b,1.6,i*.2)+ballAnim(act,b,c,1.6,i*.2+.8);});
   for(let r=0;r<rest;r++)o+=bench(F,r,false);
   break;
  }
  case 'vs':{
   let [ta,tb]=spec.teams==='half'?[Math.min(6,Math.ceil(k/2)),Math.min(6,Math.floor(k/2))]:(spec.teams||[2,2]);
   if(k<ta+tb){ta=Math.ceil(k/2);tb=k-ta;}                 // te weinig spelers: teams verkleinen
   const posT=(n,u0,u1)=>{const pts=[];if(n===1)pts.push([.5*(u0+u1),.5]);else if(n===2)pts.push([u0+.6*(u1-u0),.3],[u0+.3*(u1-u0),.7]);else if(n===3)pts.push([u0+.7*(u1-u0),.25],[u0+.35*(u1-u0),.5],[u0+.7*(u1-u0),.75]);else{const rows=Math.ceil(n/2);for(let i=0;i<n;i++)pts.push([u0+(i%2?.3:.7)*(u1-u0),.2+.6*(Math.floor(i/2)/Math.max(1,rows-1))]);}return pts.map(p=>P(p[0],p[1]));};
   const A=posT(ta,.08,.46),B=tb?posT(tb,.92,.54):[];
   A.forEach(p=>o+=player(p[0],p[1],sideA));B.forEach(p=>o+=player(p[0],p[1],sideB));
   if(A.length&&B.length){const a=A[0],b=B[B.length-1];o+=ball(a[0],a[1],motion(thereBack(a,b,16),3.2,fi*.4));}
   const extra=k-ta-tb;for(let r=0;r<extra&&r<4;r++)o+=bench(F,r,true);
   if(extra>4)o+='<text x="'+n2(P(1.08,0)[0]-6)+'" y="'+n2(P(0,.98)[1])+'" fill="#fff" font-size="7" font-weight="800">+'+(extra-4)+'</text>';
   break;
  }
  case 'queue':{
   const rows=spec.rows||Math.max(1,Math.min(tg.length||(spec.trainer?1:2),4,Math.ceil(k/2)));
   const per=distribute(k,rows);
   const vs=vspread(rows,.2,.8);
   const trP=P(spec.over?.44:.36,.5);
   if(spec.trainer)o+=player(trP[0],trP[1],C.trainer);
   vs.forEach((v,i)=>{
    const front=P(.12,v);
    for(let j=0;j<per[i];j++)o+=player(...P(.12-j*.07,v),sideA,j===0&&act==='dive'?dive(i%2?1:-1)+moveTo(front,P(.22,v+(i%2?.08:-.08)),2.4,i*.4):j===0&&act==='smash'?moveTo(front,P(.3,v),2.4,i*.4):'');
    const target=tg.length?tg[i%tg.length].p:P(spec.over?.78:.42,v);
    if(spec.trainer){
     const tr=trP;
     if(act==='smash'){o+=ballAnim('throw',tr,P(.32,v),2.4,i*.4)+ballAnim('smash',P(.32,v),P(.8,v+(i%2?.15:-.15)),2.4,i*.4+1.2);}
     else if(act==='dive'||act==='block')o+=ballAnim(act,tr,P(.22,v+(i%2?.08:-.08)),2.4,i*.4);
     else{o+=ballAnim(act==='run'?'throw':act,tr,front,2.4,i*1.2);if(spec.over&&tg.length)o+=ballAnim('serve',front,target,2.4,i*1.2+1.2);}
    }else o+=ballAnim(act==='block'?'smash':act==='run'?'throw':act,front,target,2.4,i*.4);
   });
   break;
  }
  case 'serve':{
   let kk=k;
   if(spec.keepers&&k>2){o+=player(...P(.45,.5),sideB)+player(...P(.55,.5),sideA);kk=k-2;}
   const half=spec.oneSide?kk:Math.ceil(kk/2),vsA=vspread(half,.12,.88),vsB=vspread(kk-half,.12,.88);
   const sv=(a,b,bg)=>act==='roll'?ballAnim('roll',a,b,2.2,bg):ballAnim('serve',a,b,2.6,bg);
   vsA.forEach((v,i)=>{const a=P(act==='roll'?.04:-0.04,v);o+=player(...a,sideA)+sv(a,act==='roll'?P(.47,.3+.4*v):P(spec.oneSide?.6+.3*(i%3)/2:.8,spec.oneSide?v:1-v),i*.5);});
   vsB.forEach((v,i)=>{const a=P(act==='roll'?.96:1.04,v);o+=player(...a,sideB)+sv(a,act==='roll'?P(.53,.3+.4*v):P(.2,1-v),i*.5+1.3);});
   break;
  }
  case 'relay':{
   const rows=Math.min(4,Math.max(Math.min(2,k),Math.ceil(k/3)));const per=distribute(k,rows);const vs=vspread(rows,.2,.8);
   vs.forEach((v,i)=>{const front=P(.06,v),turn=P(.46,v);o+=obj('pylon',turn[0],turn[1]);for(let j=0;j<per[i];j++)o+=player(...P(.06-j*.07,v),sideA,j===0?moveTo(front,turn,3,i*.3):'');});
   break;
  }
  case 'tag':{
   const pts=scatterPts(k,F);
   pts.forEach((p,i)=>o+=player(p[0],p[1],i===0?sideB:sideA,i===0&&k>1?'<animateMotion path="M0 0 L'+n2(pts[1%k][0]-p[0])+' '+n2(pts[1%k][1]-p[1])+' L'+n2(pts[2%k][0]-p[0])+' '+n2(pts[2%k][1]-p[1])+' L0 0" dur="4.5s" repeatCount="indefinite"/>':jitter(i)));
   break;
  }
  case 'scatter':{
   const pts=scatterPts(k,F);
   pts.forEach((p,i)=>{o+=player(p[0],p[1],sideA,jitter(i));if(act!=='run'&&i%2===0&&pts[i+1])o+=ballAnim(act,p,pts[i+1],2,i*.2);});
   break;
  }
  case 'circle':{
   const c=P(.5,.5),rx=F.cw*.3,ry=F.ch*.38;
   const pts=Array.from({length:k},(_,i)=>{const a=i/k*6.283;return [c[0]+Math.cos(a)*rx,c[1]+Math.sin(a)*ry];});
   pts.forEach(p=>o+=player(p[0],p[1],sideA));
   if(k>1)o+=ball(pts[0][0],pts[0][1],'<animateMotion path="M0 0 '+pts.map((p,i)=>'L'+n2(pts[(i+1)%k][0]-pts[0][0])+' '+n2(pts[(i+1)%k][1]-pts[0][1])).join(' ')+'" dur="'+n2(k*0.7)+'s" repeatCount="indefinite"/>');
   break;
  }
  case 'wall':{
   const rows=Math.min(k,5);const per=distribute(k,rows);const vs=vspread(rows,.12,.88);
   vs.forEach((v,i)=>{const a=P(.14,v),w=P(0,v);for(let j=0;j<per[i];j++)o+=player(...P(.14+j*.08,v),sideA);o+=ballAnim(act==='run'?'throw':act,a,w,1.6,i*.25);});
   break;
  }
  case 'solo':{ // ieder een eigen bal, verspreid
   const pts=scatterPts(k,F);
   pts.forEach((p,i)=>{
    if(spec.under)o+=obj(spec.under,p[0],p[1]);
    const dur=n2(1.4+i%3*.3),bg=n2(i*.17);
    const b=act==='hold'||act==='none'?'':'<animate attributeName="r" values="'+(act==='bounce'?'2.8;1.5;2.8':'2.6;4.6;2.6')+'" dur="'+dur+'s" begin="'+bg+'s" repeatCount="indefinite"/>';
    o+=player(p[0],p[1],sideA,spec.move?jitter(i):'');
    if(act!=='none')o+=ball(p[0]+6,p[1]-3,b+(spec.move?jitter(i):''));
   });
   break;
  }
  case 'cross':{ // van zijlijn naar zijlijn oversteken
   const us=vspread(k-(spec.tagger&&k>1?1:0),.08,.92);
   us.forEach((u,i)=>{const a=P(u,-0.09),b=P(u,1.09);
    o+=player(a[0],a[1],sideA,moveTo(a,b,5,i*.12)+(act!=='run'?'<circle cx="6" cy="-3" r="2.8" fill="'+C.ball+'" stroke="'+C.ballS+'" stroke-width="1"/>':''));});
   if(spec.tagger&&k>1){const c=P(.5,.5);o+=player(c[0],c[1],sideB,'<animateMotion path="M0 0 L'+n2(-F.cw*.3)+' 0 L'+n2(F.cw*.3)+' 0 L0 0" dur="5s" repeatCount="indefinite"/>');}
   break;
  }
  case 'sideline':{ // spelers op beide zijlijnen, doel in het midden
   const top=Math.ceil(k/2),usA=vspread(top,.15,.85),usB=vspread(k-top,.15,.85);
   if(spec.bench)[[.3,.03],[.7,.03],[.3,.97],[.7,.97]].forEach(q=>o+=obj('bank',...P(q[0],q[1])));
   if(spec.trainer)o+=player(...P(-0.07,.5),C.trainer);
   if(spec.mid==='hoepel')for(let h=0;h<3;h++){const a=P(0,.5);o+='<g><circle cx="'+n2(a[0])+'" cy="'+n2(a[1])+'" r="6" fill="none" stroke="'+C.hoepel+'" stroke-width="1.8"/><animateMotion path="M0 0 L'+n2(F.cw)+' 0" dur="6s" begin="'+(h*2)+'s" repeatCount="indefinite"/></g>';}
   else if(spec.mid==='bal'||!spec.mid){const c=P(.5,.5);o+='<circle cx="'+n2(c[0])+'" cy="'+n2(c[1])+'" r="5.5" fill="#f8fafc" stroke="#334155" stroke-width="1"/>';}
   else o+=obj(spec.mid,...P(.5,.5));
   usA.forEach((u,i)=>{const a=P(u,-0.09);o+=player(a[0],a[1],sideA)+ballAnim('arc',a,P(spec.mid==='hoepel'?u:.5+(u-.5)*.15,.47),1.8,i*.4);});
   usB.forEach((u,i)=>{const a=P(u,1.09);o+=player(a[0],a[1],spec.bench?sideB:sideA)+ballAnim('arc',a,P(spec.mid==='hoepel'?u:.5+(u-.5)*.15,.53),1.8,i*.4+.9);});
   break;
  }
  case 'lanes':{ // smalle veldjes naast elkaar, 1 tegen 1, rest op de hotseat
   const L=Math.max(1,Math.min(3,Math.floor(k/2)));
   for(let i=1;i<L;i++){const a=P(0,i/L),b=P(1,i/L);o+='<line x1="'+n2(a[0])+'" y1="'+n2(a[1])+'" x2="'+n2(b[0])+'" y2="'+n2(b[1])+'" stroke="#fff" stroke-width="1" stroke-dasharray="4 3"/>';}
   for(let i=0;i<L;i++){const v=(i+.5)/L,a=P(.14,v),b=P(.86,v);
    o+=player(a[0],a[1],sideA);if(k>=2)o+=player(b[0],b[1],sideB)+ballAnim(act==='roll'?'roll':'throw',a,b,2.6,i*.5);}
   const extra=Math.max(0,k-2*L);for(let r=0;r<extra&&r<4;r++)o+=bench(F,r,true);
   if(extra)o+='<text x="'+n2(P(1.02,0)[0])+'" y="'+n2(P(0,.12)[1])+'" fill="#fff" font-size="6" font-weight="800">hotseat</text>';
   break;
  }
  case 'feed':{ // aangever (trainer of speler) gooit/rolt naar ontvangers
   const fd=spec.over?P(.3,.5):P(.04,.5);
   o+=player(fd[0],fd[1],spec.trainer?C.trainer:sideB);
   const m=Math.min(k,spec.recv||2),vs=vspread(m,.3,.7);
   if(spec.chase){const end=P(.62,.5);vs.forEach((v,i)=>{const a=P(.04,v<.5?.3:.7);o+=player(a[0],a[1],sideA,moveTo(a,end,3,0));});o+=ballAnim('roll',fd,end,2.15,0);}
   else vs.forEach((v,i)=>{const a=P(spec.over?.74:.6,v);o+=player(a[0],a[1],sideA)+ballAnim(act==='roll'?'roll':'serve',fd,[a[0]+(i%2?6:-6),a[1]+(i%2?5:-5)],2.2,i*1.4);});
   for(let r=0;r<k-m&&r<5;r++)o+=bench(F,r,!spec.chase);
   break;
  }
  case 'netrun':{ // aan het net aantikken/springen, daarna naar de achterlijn
   const left=Math.ceil(k/2),vA=vspread(left,.12,.88),vB=vspread(k-left,.12,.88);
   vspread(5,.1,.9).forEach(v=>{const c=P(.5,v);o+='<rect x="'+n2(c[0]-2)+'" y="'+n2(c[1]-2)+'" width="4" height="4" fill="'+C.koord+'"/>';});
   vA.forEach((v,i)=>{const a=P(.45,v);o+=player(a[0],a[1],sideA,moveTo(a,P(.03,v),4,i*.5));});
   vB.forEach((v,i)=>{const a=P(.55,v);o+=player(a[0],a[1],sideA,moveTo(a,P(.97,v),4,i*.5+.25));});
   break;
  }
  case 'circuit':{
   const st=[[.2,.25],[.8,.25],[.8,.75],[.2,.75]];const per=distribute(k,4);
   st.forEach((s,i)=>{const c=P(s[0],s[1]);o+='<text x="'+n2(c[0]-16)+'" y="'+n2(c[1]-9)+'" fill="#fff" font-size="8" font-weight="900">'+(i+1)+'</text>';for(let j=0;j<per[i];j++)o+=player(c[0]+(j%3)*8-8,c[1]+(Math.floor(j/3)?8:0)+(j%2?3:-3),sideA);if(per[i]>1)o+=ballAnim(act==='run'?'throw':act,[c[0]-8,c[1]-3],[c[0],c[1]+3],1.8,i*.3);});
   // doordraai-pijl
   const a=P(.32,.12),b=P(.68,.12);o+='<path d="M'+n2(a[0])+' '+n2(a[1])+' L'+n2(b[0])+' '+n2(b[1])+' m-5 -3 l5 3 l-5 3" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>';
   break;
  }
 }
 return o;
}

// ---------- tijdlijn-hulpjes: spelers en bal bewegen langs punten ----------
const n3=v=>Math.round(v*1000)/1000;
function norm(pts,times){
 const p=pts.slice(),t=times.map(x=>Math.max(0,Math.min(1,x)));
 for(let i=1;i<t.length;i++)if(t[i]<t[i-1])t[i]=t[i-1];
 if(t[0]>0){p.unshift(p[0]);t.unshift(0);}
 if(t[t.length-1]<1){p.push(p[p.length-1]);t.push(1);}
 return [p,t];
}
function tl(pts,times,dur,begin){
 const [p,t]=norm(pts,times),a=p[0];
 return '<animateTransform attributeName="transform" type="translate" additive="sum" values="'+p.map(q=>n2(q[0]-a[0])+' '+n2(q[1]-a[1])).join(';')+'" keyTimes="'+t.map(n3).join(';')+'" dur="'+n2(dur)+'s" begin="'+n2(begin||0)+'s" repeatCount="indefinite"/>';
}
function vis(t0,t1,dur,begin){
 t0=Math.max(0,t0);t1=Math.min(1,t1);
 const v=t0<=0?['1','0']:['0','1','0'],kt=t0<=0?[0,t1]:[0,t0,t1];
 return '<animate attributeName="opacity" calcMode="discrete" values="'+v.join(';')+'" keyTimes="'+kt.map(n3).join(';')+'" dur="'+n2(dur)+'s" begin="'+n2(begin||0)+'s" repeatCount="indefinite"/>';
}
// bal die langs punten beweegt; kind: throw (boog: bal wordt groter), bounce (stuit halverwege), roll (over de grond)
function mball(pts,times,dur,begin,kind,win){
 const [p,t]=norm(pts,times);
 const kf=[[0,2.8]],m=kind==='roll'?2.8:kind==='bounce'?1.6:4.4;
 for(let i=0;i<p.length-1;i++){
  if(p[i][0]===p[i+1][0]&&p[i][1]===p[i+1][1]||t[i+1]-t[i]<.004)continue;
  if(t[i]>kf[kf.length-1][0])kf.push([t[i],2.8]);
  kf.push([(t[i]+t[i+1])/2,m]);kf.push([t[i+1],2.8]);
 }
 if(kf[kf.length-1][0]<1)kf.push([1,2.8]);
 const rA=kind==='roll'||kf.length<3?'':'<animate attributeName="r" values="'+kf.map(q=>q[1]).join(';')+'" keyTimes="'+kf.map(q=>n3(q[0])).join(';')+'" dur="'+n2(dur)+'s" begin="'+n2(begin||0)+'s" repeatCount="indefinite"/>';
 return '<g transform="translate('+n2(p[0][0])+' '+n2(p[0][1])+')">'+tl(p,t,dur,begin)+(win?vis(win[0],win[1],dur,begin):'')+'<circle r="2.8" fill="'+C.ball+'" stroke="'+C.ballS+'" stroke-width="1">'+rA+'</circle></g>';
}
const KIND=a=>a==='roll'?'roll':a==='bounce'?'bounce':'throw';
const lerp=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
const roam=(i,amp,dur)=>{const a=amp||14,s=[[1,.6],[-.7,1],[-1,-.5],[.6,-1],[.9,.9],[-.9,.3]],q=k=>s[(i+k)%6];
 return tl([[0,0],[q(0)[0]*a,q(0)[1]*a*.7],[q(2)[0]*a,q(2)[1]*a*.7],[q(3)[0]*a,q(3)[1]*a*.7],[0,0]],[0,.25,.5,.75,1],dur||(4+i%3*.7),-(i%4)*.6);};
const trace=pts=>'<polyline points="'+pts.map(p=>n2(p[0])+','+n2(p[1])).join(' ')+'" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>';
// rij die doorschuift: voorste speler loopt het parcours (course), sluit achteraan, de rest schuift op
function lineRot(slots,course,S,col,via,bg){
 const m=slots.length,T=m*S,cN=course.length;let o=trace([slots[0],...course]);
 const pts=[slots[0]],tm=[0];
 course.forEach((c,i)=>{pts.push(c);tm.push((cN===1?.3:.2+.35*i/(cN-1))*S);});
 pts.push(course[cN-1]);tm.push(.62*S);
 if(m===1){pts.push(slots[0]);tm.push(.95*S);}
 else{
  if(via){pts.push(via);tm.push(.8*S);}
  pts.push(slots[m-1]);tm.push(.95*S);
  for(let k=1;k<m;k++){pts.push(slots[m-k]);tm.push(k*S);pts.push(slots[m-k-1]);tm.push(k*S+.3*S);}
 }
 const kt=tm.map(x=>x/T);
 for(let j=0;j<m;j++)o+=player(slots[0][0],slots[0][1],col,tl(pts,kt,T,(bg||0)-((m-j)%m)*S));
 return o;
}

function formation(F,spec,k,fi){
 // k = aantal spelers op dit veld
 let o='';const P=F.P,act=spec.action,tg=F.ctx.targets;
 const sideA=C.teamA,sideB=C.teamB;
 if(k<=0)return o;
 switch(spec.form){
  case 'pairs':case 'netpairs':{
   const np=spec.form==='netpairs';
   if(k===1)return formationOld(F,spec,k,fi);
   const pairs=Math.floor(k/2),rest=k-pairs*2;
   const overNet=spec.over||np||(spec.net&&['serve','smash'].includes(act));
   const lanes=overNet?pairs:Math.ceil(pairs/2);
   const vsl=vspread(lanes,.15,.85);
   for(let i=0;i<pairs;i++){
    const sh=!overNet&&i%2?.5:0,v=vsl[overNet?i:Math.floor(i/2)];
    const uA=np?.44:overNet?.3:.14+sh,uB=np?.56:overNet?.7:.38+sh;
    const a=P(uA,v),b=P(uB,v),T=4.4,bg=i*.35,dy=F.ch*.08*(i%2?1:-1),colB=overNet?sideB:sideA;
    if(np){ // samen zijwaarts langs het net en springen
     const mv=q=>tl([q,[q[0],q[1]+dy*1.6],[q[0],q[1]+dy*1.6],q,q],[0,.3,.5,.8,1],4.8,0);
     o+=player(a[0],a[1],sideA,jump(bg)+mv(a).replace('begin="0s"','begin="'+n2(bg)+'s"'))+player(b[0],b[1],sideB,jump(bg+.25)+mv(b).replace('begin="0s"','begin="'+n2(bg+.25)+'s"'));
     if(act!=='none')o+=ballAnim('block',a,b,2.4,bg);
    }else if(act==='hold'||act==='none'){ // trekken/duwen op de plaats
     const w=(q,d)=>tl([q,[q[0]+3*d,q[1]],[q[0]-2*d,q[1]+1],q],[0,.35,.7,1],1.6,bg);
     o+=player(a[0],a[1],sideA,w(a,1))+player(b[0],b[1],colB,w(b,1));
     if(act==='hold'){const c=lerp(a,b,.5);o+=mball([c,[c[0]+3,c[1]],[c[0]-2,c[1]+1],c],[0,.35,.7,1],1.6,bg,'roll');}
    }else if(spec.follow){ // gooien, zelf onder het net door, bal bij het net afvangen
     const nb=P(.57,v);
     o+=trace([a,nb])+player(a[0],a[1],sideA,tl([a,a,nb,nb,a],[0,.22,.5,.78,1],T+1,bg))+player(b[0],b[1],colB);
     o+=mball([a,a,b,b,nb,a],[0,.05,.3,.52,.74,1],T+1,bg,KIND(act));
    }else{
     const kind=KIND(act),b2=act==='roll'?lerp(b,a,.35):[b[0],b[1]+(act==='dive'?dy*2.2:dy)],a2=act==='roll'?a:[a[0],a[1]-dy];
     o+=player(a[0],a[1],sideA,tl([a,a,a2,a],[0,.5,.9,1],T,bg))+player(b[0],b[1],colB,tl([b,b2,b2,b,b],[0,.4,.5,.75,1],T,bg));
     o+=mball([a,a,b2,b2,a2,a],[0,.05,.4,.5,.9,1],T,bg,kind);
    }
   }
   for(let r=0;r<rest;r++)o+=bench(F,r,false);
   break;
  }
  case 'triples':{ // driehoek: A -> B -> C -> A
   if(k<3)return formationOld(F,spec,k,fi);
   const g=Math.floor(k/3),rest=k-g*3,vs=vspread(g,.22,.78),T=5,kind=KIND(act);
   vs.forEach((v,i)=>{const sh=!spec.over&&i%2?.5:0,bg=i*.5;
    const a=P(.12+sh,v+.08),b=P(spec.over?.43:.4+sh,v-.1),c=spec.over?P(.7,v+.05):P(.28+sh,v-.14);
    const b2=[b[0],b[1]+5],c2=[c[0]+5,c[1]+4];
    o+=player(a[0],a[1],sideA)+player(b[0],b[1],sideA,tl([b,b2,b2,b],[0,.28,.36,.6],T,bg))+player(c[0],c[1],spec.over?sideB:sideA,tl([c,c,c2,c2,c],[0,.36,.62,.7,.95],T,bg));
    o+=mball([a,a,b2,b2,c2,c2,a],[0,.04,.28,.36,.62,.7,.96],T,bg,kind);});
   for(let r=0;r<rest;r++)o+=bench(F,r,false);
   break;
  }
  case 'vs':{ // rally: de bal gaat heen en weer, de ontvanger loopt naar de bal
   let [ta,tb]=spec.teams==='half'?[Math.min(6,Math.ceil(k/2)),Math.min(6,Math.floor(k/2))]:(spec.teams||[2,2]);
   if(k<ta+tb){ta=Math.ceil(k/2);tb=k-ta;}
   if(!tb)return formationOld(F,spec,k,fi);
   const posT=(n,u0,u1)=>{const pts=[];if(n===1)pts.push([.5*(u0+u1),.5]);else if(n===2)pts.push([u0+.6*(u1-u0),.3],[u0+.3*(u1-u0),.7]);else if(n===3)pts.push([u0+.7*(u1-u0),.25],[u0+.35*(u1-u0),.5],[u0+.7*(u1-u0),.75]);else{const rows=Math.ceil(n/2);for(let i=0;i<n;i++)pts.push([u0+(i%2?.3:.7)*(u1-u0),.2+.6*(Math.floor(i/2)/Math.max(1,rows-1))]);}return pts.map(p=>P(p[0],p[1]));};
   // tri: 3 tegen 3 met de driehoek met de punt naar voren (midvoor vooraan, twee spelers achter)
   const tri=spec.tri&&ta===3&&tb===3&&!!spec.rally;
   const A=tri?[P(.4,.5),P(.2,.25),P(.2,.75)]:posT(ta,.08,.46),B=tri?[P(.6,.5),P(.8,.25),P(.8,.75)]:posT(tb,.92,.54),T=7,bg=fi*.5;
   // rally: eigen balverloop [team,index,{u,v}]; start: wie de bal serveert
   const ev=tri?spec.rally:[['B',tb-1,[7,6]],['A',ta>1?1:0,[-7,-5]],['B',0,[6,-6]],['A',0,[0,0]]];
   const kfs={};const key=(s,i)=>s+i;
   const bp=[tri&&spec.start?(spec.start[0]==='A'?A:B)[spec.start[1]]:A[0]],bt=[0];
   ev.forEach((e,n)=>{
    const base=(e[0]==='A'?A:B)[e[1]],L=Array.isArray(e[2])?[base[0]+e[2][0],base[1]+e[2][1]]:P(e[2].u,e[2].v);
    const s=n*.25+.04,ar=n*.25+.2,dep=n===3?1:(n+1)*.25+.04;
    bp.push(bp[bp.length-1]);bt.push(s);bp.push(L);bt.push(ar);
    const q=kfs[key(e[0],e[1])]||(kfs[key(e[0],e[1])]={base,p:[base],t:[0]});
    q.p.push(base,L,L);q.t.push(s,ar,dep);
    if(n<3){q.p.push(base);q.t.push(Math.min(1,dep+.1));}
   });
   A.forEach((p,i)=>{const q=kfs[key('A',i)];o+=player(p[0],p[1],sideA,q?tl(q.p,q.t,T,bg):'');});
   B.forEach((p,i)=>{const q=kfs[key('B',i)];o+=player(p[0],p[1],sideB,q?tl(q.p,q.t,T,bg):'');});
   o+=mball(bp,bt,T,bg,KIND(act));
   const extra=k-ta-tb;for(let r=0;r<extra&&r<4;r++)o+=bench(F,r,true);
   if(extra>4)o+='<text x="'+n2(P(1.08,0)[0]-6)+'" y="'+n2(P(0,.98)[1])+'" fill="#fff" font-size="7" font-weight="800">+'+(extra-4)+'</text>';
   break;
  }
  case 'queue':{ // rijen die doorschuiven
   const rows=spec.rows||Math.max(1,Math.min(tg.length||(spec.trainer||spec.setter?1:2),4,Math.ceil((k-(spec.setter?1:0))/2)));
   const per=distribute(Math.max(1,k-(spec.setter?1:0)),rows),vs=vspread(rows,.2,.8);
   const trP=P(spec.over?.44:.36,.5);
   const feeder=spec.trainer||spec.setter;
   if(feeder)o+=player(trP[0],trP[1],spec.trainer?C.trainer:C.setter);
   const S=spec.course?4.6:3.2,kind=KIND(act);
   vs.forEach((v,i)=>{
    const m=per[i];if(!m)return;
    const slots=Array.from({length:m},(_,j)=>P(.12-j*.07,v)),side=i%2?.1:-.1,bg=i*.6;
    const course=spec.course?spec.course.map(c=>P(c[0],c[1])):[act==='smash'?P(.3,v):act==='dive'?P(.22,v+side):P(.2,v)];
    const cN=course.length,hit=course[0],lastC=course[cN-1];
    const target=tg.length?tg[i%tg.length].p:P(spec.over?.78:.42,v);
    o+=lineRot(slots,course,S,sideA,P(.16,v+(rows===1?.2:.11)),bg);
    const tA=cN===1?.3:.2;
    if(feeder){
     if(act==='smash'){const far=P(.8,v+side*1.5);o+=mball([trP,trP,hit,hit,far,far],[0,.04,tA,tA+.04,.52,1],S,bg,'throw',[0,.58]);}
     else{
      const dest=!spec.back&&spec.over&&tg.length?target:trP;
      if(cN>1){o+=mball([trP,trP,hit,hit,trP,trP],[0,.03,tA,tA+.05,.36,1],S,bg,kind,[0,.38])+mball([trP,trP,lastC,lastC,trP,trP],[0,.4,.55,.6,.8,1],S,bg,kind,[.4,.82]);}
      else o+=mball([trP,trP,hit,hit,dest,dest],[0,.05,tA,tA+.08,.62,1],S,bg,kind,[0,.7]);
     }
    }else{
     const tL=cN===1?.32:.57;
     o+=mball([lastC,lastC,target,target],[0,tL,tL+.28,1],S,bg,act==='smash'||act==='block'?'throw':kind,[tL-.03,tL+.36]);
    }
   });
   break;
  }
  case 'relay':{ // om de beurt heen en terug, daarna achteraan sluiten
   const rows=Math.min(4,Math.max(Math.min(2,k),Math.ceil(k/3))),per=distribute(k,rows),vs=vspread(rows,.2,.8);
   const far=tg.length?null:.46;
   vs.forEach((v,i)=>{const m=per[i];if(!m)return;
    const turn=tg.length?[tg[i%tg.length].p[0]-8,P(0,v)[1]]:P(far,v);
    if(!tg.length)o+=obj('pylon',turn[0]+7,turn[1]);
    o+=lineRot(Array.from({length:m},(_,j)=>P(.06-j*.07,v)),[turn],3.4,sideA,P(.1,v+.1),0);});
   break;
  }
  case 'tag':{
   const pts=scatterPts(k,F);
   pts.forEach((p,i)=>o+=player(p[0],p[1],i===0?sideB:sideA,i===0&&k>1?'<animateMotion path="M0 0 L'+n2(pts[1%k][0]-p[0])+' '+n2(pts[1%k][1]-p[1])+' L'+n2(pts[(k>2?k-1:1)][0]-p[0])+' '+n2(pts[(k>2?k-1:1)][1]-p[1])+' L'+n2(pts[2%k][0]-p[0])+' '+n2(pts[2%k][1]-p[1])+' L0 0" dur="6s" repeatCount="indefinite"/>':roam(i,15)));
   break;
  }
  case 'scatter':{
   const pts=scatterPts(k,F),run=act==='run';
   pts.forEach((p,i)=>{o+=player(p[0],p[1],sideA,run?roam(i,15):jitter(i));if(!run&&i%2===0&&pts[i+1])o+=ballAnim(act,p,pts[i+1],2,i*.2);});
   break;
  }
  case 'solo':{
   const pts=scatterPts(k,F);
   pts.forEach((p,i)=>{
    if(spec.under)o+=obj(spec.under,p[0],p[1]);
    const dur=n2(1.4+i%3*.3),bg=n2(i*.17),mv=spec.move?roam(i,13):'';
    const b=act==='hold'||act==='none'?'':'<animate attributeName="r" values="'+(act==='bounce'?'2.8;1.5;2.8':'2.6;4.6;2.6')+'" dur="'+dur+'s" begin="'+bg+'s" repeatCount="indefinite"/>';
    o+=player(p[0],p[1],sideA,mv);
    if(act!=='none')o+='<g transform="translate('+n2(p[0]+6)+' '+n2(p[1]-3)+')">'+mv+(act==='hold'?'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;-12 0;-6 6;0 0" dur="2s" begin="'+bg+'s" repeatCount="indefinite"/>':'')+'<circle r="2.8" fill="'+C.ball+'" stroke="'+C.ballS+'" stroke-width="1">'+b+'</circle></g>';
   });
   break;
  }
  case 'circle':{
   if(!spec.flee||k<3)return formationOld(F,spec,k,fi);
   // Stand in de mand: bal omhoog, iedereen rent weg, stop, bal door de benen rollen
   const c=P(.5,.5),T=8,r=k-1;
   const ring=Array.from({length:r},(_,i)=>{const a=i/r*6.283;return [c[0]+Math.cos(a)*F.cw*.12,c[1]+Math.sin(a)*F.ch*.2];});
   const out=ring.map(p=>[Math.max(F.pad+6,Math.min(F.pad+F.cw-6,c[0]+(p[0]-c[0])*3)),Math.max(F.top+6,Math.min(F.top+F.ch-6,c[1]+(p[1]-c[1])*2.1))]);
   ring.forEach((p,i)=>o+=player(p[0],p[1],sideA,tl([p,p,out[i],out[i],p],[0,.12,.4,.88,1],T,0)));
   o+=player(c[0],c[1],sideB);
   o+=mball([c,[c[0]+1,c[1]-1],c,c,out[0],out[0],c],[0,.2,.4,.52,.72,.88,1],T,0,'throw');
   break;
  }
  case 'circuit':{ // groepjes draaien door naar het volgende station
   const st=[[.2,.25],[.8,.25],[.8,.75],[.2,.75]].map(q=>P(q[0],q[1])),per=distribute(k,4),T=16;
   st.forEach((c,i)=>{o+='<text x="'+n2(c[0]-18)+'" y="'+n2(c[1]-10)+'" fill="#fff" font-size="8" font-weight="900">'+(i+1)+'</text>';
    if(act!=='none'&&act!=='run')o+=ballAnim(act==='roll'?'roll':act,[c[0]-8,c[1]-3],[c[0]+2,c[1]+4],1.8,i*.3);});
   o+=trace([...st,st[0]]);
   for(let g=0;g<4;g++){const pts=[],tm=[];
    for(let q=0;q<=4;q++){const c=st[(g+q)%4];pts.push(c);tm.push(q/4);if(q<4){pts.push(c);tm.push(q/4+.19);}}
    for(let j=0;j<per[g];j++){const dx=(j%3)*8-8,dy=(Math.floor(j/3)?8:0)+(j%2?3:-3);o+=player(st[g][0]+dx,st[g][1]+dy,sideA,tl(pts,tm,T,0));}}
   break;
  }
  case 'feed':{
   if(spec.chase)return formationOld(F,spec,k,fi);
   const fd=spec.over?P(.3,.5):P(.04,.5);
   o+=player(fd[0],fd[1],spec.trainer?C.trainer:sideB);
   const m=Math.min(k,spec.recv||2),vs=vspread(m,.3,.7),T=m*2.6;
   vs.forEach((v,i)=>{const a=P(spec.over?.74:.6,v),L=[a[0]+(i%2?9:-10),a[1]+(i%2?9:-9)],t0=i/m,w=1/m;
    o+=player(a[0],a[1],sideA,tl([a,a,L,L,a],[0,t0+.1*w,t0+.55*w,t0+.8*w,Math.min(1,t0+w)],T,0));
    o+=mball([fd,fd,L,L],[0,t0+.05*w,t0+.6*w,1],T,0,KIND(act),[t0,t0+.85*w]);});
   for(let r=0;r<k-m&&r<5;r++)o+=bench(F,r,true);
   break;
  }
  case 'lanes':{
   const L=Math.max(1,Math.min(3,Math.floor(k/2)));
   for(let i=1;i<L;i++){const a=P(0,i/L),b=P(1,i/L);o+='<line x1="'+n2(a[0])+'" y1="'+n2(a[1])+'" x2="'+n2(b[0])+'" y2="'+n2(b[1])+'" stroke="#fff" stroke-width="1" stroke-dasharray="4 3"/>';}
   for(let i=0;i<L;i++){const v=(i+.5)/L,a=P(.14,v),b=P(.86,v),d=F.ch/L*.22*(i%2?1:-1),T=5,bg=i*.6;
    if(k<2){o+=player(a[0],a[1],sideA);break;}
    const b2=[b[0],b[1]+d],a2=[a[0],a[1]-d];
    o+=player(a[0],a[1],sideA,tl([a,a,a2,a],[0,.5,.9,1],T,bg))+player(b[0],b[1],sideB,tl([b,b2,b2,b,b],[0,.4,.5,.75,1],T,bg));
    o+=mball([a,a,b2,b2,a2,a],[0,.05,.4,.5,.9,1],T,bg,KIND(act));}
   const extra=Math.max(0,k-2*L);for(let r=0;r<extra&&r<4;r++)o+=bench(F,r,true);
   if(extra)o+='<text x="'+n2(P(1.02,0)[0])+'" y="'+n2(P(0,.12)[1])+'" fill="#fff" font-size="6" font-weight="800">hotseat</text>';
   break;
  }
  default:return formationOld(F,spec,k,fi);
 }
 return o;
}

// ---------- hoofdfunctie ----------
window.scene=function(d,n,courts){
 const spec=derive(d);
 if(!spec)return null;
 n=Math.max(1,n|0);courts=Math.max(1,courts|0);
 const one=['tag','scatter','circle','relay','circuit','wall','solo','cross','sideline','lanes','netrun'].includes(spec.form)||spec.teams==='half';
 const grp=spec.form==='vs'?(Array.isArray(spec.teams)?spec.teams:[2,2]).reduce((a,b)=>a+b):spec.form==='triples'?3:spec.form==='feed'?4:spec.form==='queue'?6:spec.form==='serve'?6:2;
 const f=one?1:Math.max(1,Math.min(courts,Math.ceil(n/grp)));
 const per=distribute(n,f);
 const FH=fieldHeight(spec),VB_H=FH*f;
 let o='';
 for(let i=0;i<f;i++){
  const F=makeField(i*FH,spec);F.ctx={};
  if(i)o+='<line x1="8" y1="'+n2(i*FH)+'" x2="'+(VB_W-8)+'" y2="'+n2(i*FH)+'" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>';
  o+=F.svg;
  o+=placeObjects(F,spec,F.ctx);
  if(spec.trainer&&!['queue','feed','sideline'].includes(spec.form))o+=player(...F.P(.5,-0.13),C.trainer);
  o+=formation(F,spec,per[i],i);
 }
 const label=spec.form==='vs'&&Array.isArray(spec.teams)?spec.teams.join(' tegen '):'';
 return '<svg class="scn" viewBox="0 0 '+VB_W+' '+n2(VB_H)+'" role="img" aria-label="'+String(spec.title||'').replace(/[<>&"]/g,'')+'"><rect width="'+VB_W+'" height="'+n2(VB_H)+'" fill="#7fb2a3"/>'+o+(label?'<text x="4" y="'+n2(VB_H-5)+'" fill="#fff" font-size="7" font-weight="800">'+label+'</text>':'')+'</svg>';
};
window.sceneSpec=derive;

// ---------- handmatige correcties per oefening (id uit VolleyWijzer) ----------
// Velden: form (pairs|netpairs|triples|vs|queue|serve|relay|tag|scatter|circle|wall|circuit|solo|cross|sideline|lanes|feed|netrun),
// extra: teams 'half', rows, course [[u,v],..] (looproute voorste speler), back, follow, flee, oneSide, keepers, tagger, move, under, mid, bench, chase, objs met at:[[u,v]] of grid:true,
// action (throw|roll|bounce|serve|smash|block|dive|overhead|forearm|run), teams [a,b], net true/false,
// over true/false, trainer true/false, objs [{t:'hoepel',n:8}, ...]
window.SCENE_OVERRIDES={
 // ===== Level 1: alle 68 oefeningen nagelopen tegen de VolleyWijzer-tekst (16-11-2026) =====
 // Swing door de rollende hoepels
 '019634e5-7931-74ff-b2a3-399a62d8f6a3':{form:'sideline',mid:'hoepel',trainer:true,net:false,objs:[]},
 // Grote en kleine ballenspel
 '019634e5-7933-7590-8182-2ebaaff7ddf3':{form:'sideline',mid:'bal',bench:true,trainer:false,net:false,objs:[]},
 // Wilhelm Tell: onder het net door met stuit
 '019634e5-7933-7590-8182-2ebab06665a1':{form:'pairs',over:true,action:'bounce'},
 // Tsjechische aanval: zo ver mogelijk over het net
 '019634e5-7934-7523-a328-c371f64fb4df':{form:'serve',oneSide:true,action:'throw'},
 // Spiegelwand
 '019634e5-7937-7a4b-b94f-72dab7c6645c':{form:'netpairs',action:'none',objs:[]},
 // Hands-up in the air: lintje aantikken, naar achterlijn
 '019634e5-7937-7a4b-b94f-72dab7f825ba':{form:'netrun',objs:[]},
 // Door de hoepel
 '019634e5-7937-7a4b-b94f-72dab83bdc40':{form:'scatter',action:'run',net:false,objs:[{t:'hoepel',n:4,grid:true}]},
 // Ballonnenlijn
 '019634e5-7937-7a4b-b94f-72dab8b21d34':{form:'netrun',objs:[{t:'korf',at:[[.5,-.1],[.5,1.1]]}]},
 // Blokpower: krachtcircuit in tweetallen
 '019634e5-793c-7072-a870-f2f142564964':{form:'circuit',action:'none',net:false},
 // Vanaf de knieën
 '019634e5-7938-77b2-bd07-cc1ac9453eaa':{form:'pairs',action:'overhead',over:false},
 // Ballonstuit
 '019634e5-7938-77b2-bd07-cc1ac9f09eb9':{form:'pairs',action:'overhead',over:false},
 // Stoot zo hoog je kan
 '019634e5-7939-7697-a5ba-31eb28a80892':{form:'solo',action:'up',net:false},
 // Vang-stoot in de hoepel
 '019634e5-7939-7697-a5ba-31eb29980890':{form:'pairs',over:true,action:'overhead'},
 // Bounce-set estafette
 '019634e5-793a-7046-b336-683366e64e29':{form:'queue',over:true,action:'overhead',objs:[{t:'kar',n:1}]},
 // Zo hoog als je kan
 '019634e5-793c-7072-a870-f2f13c109bcc':{form:'solo',action:'up',net:false},
 // Gooien, rennen, afvangen
 '019634e5-793c-7072-a870-f2f13d08fec9':{form:'pairs',over:true,action:'forearm',follow:true},
 // 1 tegen 1 onderarms: 3 smalle veldjes + hotseat
 '019634e5-793c-7072-a870-f2f13ea424bc':{form:'lanes',action:'throw',objs:[]},
 // Circuit balrollen
 '019634e5-793c-7072-a870-f2f1489e9a6d':{form:'circuit',action:'roll',net:false},
 // Vang-gooi en radslag: vangen rechtsachter, achter de pylon langs, vangen linksachter
 '019634e5-793c-7072-a870-f2f13def96ff':{form:'queue',rows:1,trainer:true,over:true,back:true,action:'forearm',course:[[.3,.82],[.2,.5],[.3,.18]],objs:[{t:'pylon',at:[[.3,.5]]}]},
 // Rol en scoor: keepers voor het net
 '019634e5-793c-7072-a870-f2f13fca9d50':{form:'serve',action:'roll',keepers:true},
 // Hotseat met rollen
 '019634e5-793c-7072-a870-f2f1416d2c82':{form:'lanes',action:'roll',net:false,objs:[]},
 // Stand in de mand
 '019634e5-793c-7072-a870-f2f141c459ad':{form:'circle',action:'throw',net:false,flee:true},
 // Circuit onderhands serveren
 '019634e5-793c-7072-a870-f2f14220d652':{form:'circuit',action:'throw'},
 // Ballon hooghouden
 '019634e5-793c-7072-a870-f2f143c53532':{form:'solo',action:'up',net:false},
 // Reactiebal
 '019634e5-793c-7072-a870-f2f1448916fe':{form:'solo',action:'bounce',net:false,trainer:false},
 // Sluit hem op
 '019634e5-793c-7072-a870-f2f14558a552':{form:'pairs',action:'roll',over:false,net:false,objs:[]},
 // Zo laag mogelijk
 '019634e5-793c-7072-a870-f2f14635fa5b':{form:'pairs',over:true,action:'overhead'},
 // Door elkaar
 '019634e5-793c-7072-a870-f2f146a98bd1':{form:'solo',action:'up',move:true,net:false},
 // Lopen en vangen
 '019634e5-793c-7072-a870-f2f147826d9e':{form:'scatter',action:'throw',net:false,objs:[{t:'hoepel',n:4,grid:true}]},
 // In de kegel: trainer gooit over het net naar 2 spelers
 '019634e5-793d-7613-951a-d149edca6c49':{form:'feed',over:true,trainer:true,action:'throw',objs:[{t:'kar',n:1}]},
 // Speel en go
 // 3 tegen 3 met bonuspunt: ontvangers in een driehoek met de punt naar voren; serve, pass naar midvoor, set naar rechtsvoor, aanval in drie keer over het net
 '0196a4b5-9be9-7219-887d-be6420e014f6':{form:'vs',teams:[3,3],action:'overhead',tri:true,start:['B',1],rally:[['A',1,{u:.2,v:.25}],['A',0,{u:.4,v:.5}],['A',2,{u:.4,v:.8}],['B',0,{u:.62,v:.5}]]},
 '019634e5-793d-7613-951a-d149ed333e53':{form:'vs',teams:[1,1],action:'throw'},
 // Om de pylon en pass
 '019634e5-793d-7613-951a-d149ee672fbe':{form:'pairs',over:true,action:'throw',objs:[]},
 // Van grote hoogte: speler op de kast gooit, 2 verdedigers
 '019634e5-793d-7613-951a-d149ee8f8038':{form:'feed',over:true,trainer:false,action:'throw',objs:[{t:'kast',at:[[.3,.5]]}]},
 // Catch Volley level 1: 2 tegen 2
 '01975944-bec0-775a-9991-663c91d09600':{form:'vs',teams:[2,2],action:'throw'},
 // Tikkertje
 '019634e5-7936-7cec-850c-700cd7c3aa6c':{form:'tag',net:false},
 // Gnoes en krokodil
 '019634e5-793a-7046-b336-683367c5453b':{form:'cross',tagger:true,action:'run',net:false,trainer:false},
 // Schipper mag ik overvaren
 '019634e5-793a-7046-b336-683368765870':{form:'cross',tagger:true,action:'run',net:false},
 // Tienbal: twee teams
 '019634e5-793b-7622-9bb8-027660d482aa':{form:'vs',teams:'half',net:false,action:'throw'},
 // Smijtbal
 '019634e5-793b-7622-9bb8-027661bc2a28':{form:'vs',teams:'half',net:true,action:'throw',trainer:false},
 // Overleven op een eiland
 '019634e5-793b-7622-9bb8-0276624e1c80':{form:'solo',under:'mat',action:'up',net:false,objs:[],trainer:false},
 // Zig zag estafette
 '019634e5-793b-7622-9bb8-027663be3946':{form:'cross',action:'run',net:false,trainer:false,objs:[{t:'pylon',n:12,grid:true}]},
 // Go with the flow
 '019634e5-793c-7072-a870-f2f13b61cde6':{form:'solo',action:'hold',net:false},
 // Gooien en vangen variaties
 '019634e5-793c-7072-a870-f2f13c0db1dd':{form:'solo',action:'up',net:false},
 // Kangoeroebal
 '019634e5-793c-7072-a870-f2f13f5de9ea':{form:'cross',action:'overhead',net:false},
 // Stoot en draai
 '019634e5-793c-7072-a870-f2f140c090b6':{form:'pairs',action:'overhead',over:false,net:false},
 // Jongleren
 '019634e5-793c-7072-a870-f2f141ac07f2':{form:'solo',action:'up',net:false},
 // Dribbelspel
 '019634e5-793c-7072-a870-f2f1430b60f0':{form:'solo',action:'bounce',move:true,net:false,trainer:false},
 // Rol en go
 '019634e5-793c-7072-a870-f2f144377ff6':{form:'feed',chase:true,trainer:true,over:false,net:false,action:'roll'},
 // Actie circuit 1
 '019634e5-793c-7072-a870-f2f148220ecd':{form:'circuit',action:'throw'},
 // Balworstelen
 '019634e5-793c-7072-a870-f2f1491514a7':{form:'pairs',action:'hold',net:false},
 // Ligsteun stoeien
 '019634e5-793c-7072-a870-f2f149a5ee5c':{form:'pairs',action:'none',net:false},
 // Hotseat werpen
 '019634e5-793c-7072-a870-f2f149bbb7f8':{form:'lanes',action:'throw',net:false,objs:[]},
 // Oversteken
 '01965e1b-48b5-7d56-95a1-323691dde713':{form:'cross',action:'throw',net:false},
 // 1 tegen 1 toernooi werpen
 '019634e5-793c-7072-a870-f2f14a3225d7':{form:'vs',teams:[1,1],action:'throw',net:true},
 // Potje 1 - 1
 '019634e5-793c-7072-a870-f2f14a54b83e':{form:'vs',teams:[1,1],action:'throw',net:true},
 // Er in en er uit
 '019634e5-793d-7613-951a-d149ec544465':{form:'vs',teams:[2,2],action:'throw'},
 // Klimmen als Piet
 '0196c86d-df8b-7084-a8ff-c2d713e91173':{form:'queue',rows:1,action:'throw',net:false,trainer:false,course:[[.3,.5],[.52,.5],[.68,.5]],objs:[{t:'korf',at:[[.88,.5]]},{t:'bank',at:[[.3,.5]]},{t:'kast',at:[[.52,.5],[.68,.5]]}]},
 // ===== Level 2: nagelopen tegen de VolleyWijzer-tekst (16-11-2026) =====
 // Tippen van de bal
 '019634e5-793d-7613-951a-d149ef9be91d':{form:'queue',action:'bounce',over:false,trainer:false,objs:[{t:'mat',n:4}]},
 // Smashball Level 1
 '019634e5-793d-7613-951a-d149efa659c3':{form:'vs',teams:[1,1],action:'bounce'},
 // Tippie!
 '019634e5-793d-7613-951a-d149f0d4ad4e':{form:'pairs',over:true,action:'throw',objs:[]},
 // Smash estafette
 '019634e5-793d-7613-951a-d149f1443304':{form:'queue',over:true,action:'smash',objs:[{t:'kast',n:1}]},
 // Hit him
 '019d9638-57d2-7f6e-a0c2-24e5d402d5ed':{form:'sideline',mid:'bal',bench:true,net:false,objs:[]},
 // Smash de pylonen van de kast
 '019d9641-7f66-78ad-9679-fe3646583651':{form:'sideline',mid:'kast',bench:true,net:false,trainer:false,objs:[]},
 // Grijp 'm
 '019634e5-793d-7613-951a-d149f1e7051c':{form:'netpairs',action:'block',objs:[]},
 // Basket Volley
 '019634e5-7950-7cfe-8161-87285acc8a81':{form:'queue',action:'overhead',over:false},
 // Bovenhands mikken in de hoepels
 '019634e5-7950-7cfe-8161-87285b3b3f89':{form:'queue',action:'overhead',over:true},
 // Hoepels in het veld
 '019634e5-7950-7cfe-8161-87285bb5b731':{form:'solo',action:'up',move:true,net:false,objs:[{t:'hoepel',n:8,grid:true}]},
 // Klim en Bounce
 '019634e5-7950-7cfe-8161-87285c8cc5d5':{form:'queue',action:'overhead',over:false},
 // Breed staan
 '019634e5-7951-7817-aca9-99d067760c69':{form:'pairs',action:'forearm',over:false},
 // Onderarms vanaf de knieën
 '019634e5-7951-7817-aca9-99d067774959':{form:'pairs',action:'forearm',over:false},
 // Voor jezelf
 '019634e5-7951-7817-aca9-99d06845eaad':{form:'solo',action:'up',net:false},
 // Onderarms met 2-tallen
 '019634e5-7951-7817-aca9-99d068dcb1cc':{form:'pairs',action:'forearm',over:false},
 // Challenge Haak
 '019634e5-7951-7817-aca9-99d069987bc2':{form:'feed',over:true,trainer:true,action:'throw'},
 // Door het poortje
 '019634e5-7951-7817-aca9-99d06a71aa64':{form:'feed',over:true,trainer:true,action:'throw'},
 // Swing en stuit
 '019634e5-7951-7817-aca9-99d06add3dfc':{form:'pairs',over:true,action:'throw',objs:[]},
 // Naar de bank
 '019634e5-7951-7817-aca9-99d06b48521a':{form:'queue',over:true,action:'throw',trainer:false},
 // Onderhandse estafette
 '019634e5-7951-7817-aca9-99d06b73655e':{form:'queue',over:true,action:'throw',trainer:false},
 // Opstaan en spelen
 '019634e5-7951-7817-aca9-99d06c3a7e3b':{form:'solo',action:'up',net:false},
 // Wie is het snelst?
 '019634e5-7951-7817-aca9-99d06c759cbe':{form:'feed',chase:true,trainer:true,net:false,over:false,action:'roll'},
 // Poort tikkertje
 '019634e5-7951-7817-aca9-99d06d4b2599':{form:'tag',net:false},
 // Watje blazen
 '019634e5-7951-7817-aca9-99d06e89c1a7':{form:'relay',action:'run',net:false},
 // Wie duikt het verst?
 '019634e5-7951-7817-aca9-99d06f54c02b':{form:'cross',action:'run',net:false},
 // Smash en keepersspel
 '019634e5-7951-7817-aca9-99d070155e5c':{form:'serve',action:'roll',keepers:true},
 // Duik je rot
 '019634e5-7951-7817-aca9-99d070c96958':{form:'pairs',action:'dive',over:false,net:false},
 // Op commando
 '019634e5-7951-7817-aca9-99d0712272ce':{form:'pairs',action:'dive',over:false},
 // De omgedraaide Pylon
 '01965ca3-e34a-7ac8-b61c-22d1b11c974d':{form:'vs',teams:[1,1],action:'throw'},
 // Traag-snel
 '01965ca5-b3f8-7438-af59-647408fa3e13':{form:'feed',over:true,trainer:true,action:'throw'},
 // Lopen en bouncen
 '01965cad-0e9b-78be-bdc3-2ec1b481743e':{form:'feed',over:false,trainer:true,action:'throw'},
 // In het vak (kort-diep)
 '01966696-e277-7cd7-af5b-70b4ee8e4fc8':{form:'queue',over:true,action:'throw',objs:[]},
 // Vangbal
 '019634e5-793c-7072-a870-f2f1446e86d1':{form:'solo',action:'up',net:false},
 // Duikbal
 '01965c48-6246-7a65-92a5-8b0eb168544d':{form:'vs',teams:'half',net:false,action:'throw',trainer:false,objs:[{t:'dikkemat',at:[[0.06,0.5],[0.94,0.5]]}]},
 // Lijn tikspel
 '01965c48-6246-7a65-92a5-8b0eb0a04d63':{form:'tag',net:false},
 // Reuzen jagerbal
 '01965c4a-22cf-7f8b-a3e3-a5abfbfcf039':{form:'vs',teams:'half',net:false,action:'roll',trainer:false},
 // Rollende hoepel
 '01965c51-79c3-73ec-b1c3-89615669541d':{form:'cross',action:'run',net:false,trainer:true,objs:[]},
 // Zijwaarts en overgooien
 '01965c51-79c3-73ec-b1c3-8961570bca88':{form:'pairs',action:'throw',over:false},
 // Vuistbal
 '01965c53-4d60-7042-8f76-e243c2fe9259':{form:'vs',teams:'half',net:false,action:'roll',objs:[{t:'pylon',at:[[0.02,0.35],[0.02,0.65],[0.98,0.35],[0.98,0.65]]}]},
 // Esta-doorgeef-fette
 '01965c5a-ae7f-7a6d-b3b6-3e4cfe6dbbf4':{form:'relay',action:'run',net:false},
 // Bovenhands en draai
 '01965c6c-eeac-7570-82c0-9f23f02629fa':{form:'solo',action:'up',net:false},
 // Wegstoten
 '01965c6e-c35b-76bb-b3c9-d4ccad487577':{form:'pairs',action:'bounce',over:false},
 // Eénarmige bandiet
 '01965c76-210b-7bfd-9a47-ea6f774d1c30':{form:'solo',action:'up',net:false},
 // Dribbelen op de plaats
 '01965c76-210b-7bfd-9a47-ea6f7777ea5c':{form:'solo',action:'bounce',net:false},
 // Hoofd, schouders .. BAL
 '01965c7f-4622-72a6-9c6d-a207f412c309':{form:'pairs',action:'hold',trainer:true,net:false},
 // Spikebal
 '01965c7f-4622-72a6-9c6d-a207f4bd2ae2':{form:'pairs',action:'bounce',over:false,objs:[]},
 // Duwen en trekken
 '01965c8a-3d71-7646-b67f-39c2032b19e5':{form:'pairs',action:'none',net:false},
 // 1 tegen 1 in tweeën
 '01965c93-6538-7e0b-a076-c329faa5927e':{form:'vs',teams:[1,1],action:'bounce'},
 // Actie circuit 2
 '01965c9a-b9b3-739e-b4e7-baeac87ff0cd':{form:'circuit',action:'throw'},
 // Pepernoten estafette 2
 '0196c877-062d-7c70-a042-663a9e4f1f31':{form:'scatter',action:'run',net:false,objs:[{t:'pylon',n:12,grid:true}]},
 // ===== Level 3: nagelopen tegen de VolleyWijzer-tekst (16-11-2026) =====
 // Als een stofzuiger
 '01963934-d22f-7a1b-95d6-e42e541014dd':{form:'pairs',action:'dive',over:false},
 // Smashbewust
 '0196429a-e516-7b98-a481-6fa5f7ea413e':{form:'lanes',action:'throw',objs:[]},
 // Scoor je punt!
 '0196429a-e516-7b98-a481-6fa5f85944a0':{form:'queue',action:'smash',trainer:true,over:true},
 // Gooi en smash!
 '019642a4-0004-7cde-9b92-03fafc77125b':{form:'queue',action:'smash',trainer:true,over:true},
 // Mik en door
 '01964291-b2ac-7f4f-bbcb-5629b78092a2':{form:'pairs',over:true,action:'throw',objs:[]},
 // Stuit en set
 '019639d9-9d41-74f2-94ca-8c0c5c1b90d0':{form:'pairs',over:true,action:'bounce'},
 // Bounce en play
 '019639e0-f54a-7f62-8897-49897e4040fb':{form:'queue',action:'overhead',over:false},
 // Grootste stuiterbal
 '019639e0-f54b-7880-b08a-995af1c5dd0c':{form:'queue',action:'overhead',over:false,setter:true,objs:[]},
 // Lummelen
 '019639e2-c2bb-70f6-9ba6-a8a9230e8b03':{form:'vs',teams:'half',action:'overhead',objs:[]},
 // Bouwen maar!
 '019642d1-d27f-7fa9-8db8-0111893a3292':{form:'feed',over:false,trainer:true,action:'throw'},
 // Kattenrug
 '019642d1-d27f-7fa9-8db8-011189d8ba6d':{form:'triples',over:true,action:'forearm',trainer:false},
 // Stoelbal (onderarms)
 '019642d3-9488-772e-83b1-bae7fda5bc7a':{form:'pairs',action:'forearm',over:false},
 // Hoephoephoepel
 '019642da-e669-721e-926c-ddf748e758e3':{form:'pairs',action:'forearm',over:false,trainer:false,objs:[]},
 // Verzamelen!
 '01965c48-6246-7a65-92a5-8b0eb20711ce':{form:'serve'},
 // Mat duiken
 '0196393c-2b13-75c9-8d33-e16913cb7a69':{form:'relay',action:'run',net:false},
 // Sloveens matduiken
 '0196393c-2b13-75c9-8d33-e16914ae3985':{form:'relay',action:'run',net:false,trainer:false},
 // Turboduiken
 '0196393c-2b13-75c9-8d33-e169151acf2c':{form:'relay',action:'run',net:false},
 // Dolfijnen en tijgers
 '0196393c-2b13-75c9-8d33-e169153027a5':{form:'relay',action:'run',net:false},
 // Buikglijden over de bal
 '0196393d-f930-769e-8e60-d05065973b8d':{form:'pairs',action:'none',net:false},
 // Wie passt de bal?
 '01965cf6-4f15-7102-b88c-caf650a664f4':{form:'vs',teams:[2,2],action:'overhead'},
 // Speel, vang en scoor
 '01965cf6-4f15-7102-b88c-caf650d37c72':{form:'vs',teams:[2,2],action:'throw'},
 // Als-dan
 '01965cf8-1941-7c93-ac97-9f58955595a8':{form:'queue',action:'forearm',over:false},
 // Hoepelbal
 '01965cff-7bac-7490-ad1a-923c10b4783c':{form:'vs',teams:[2,2],action:'bounce'},
 // Door en door
 '01965cff-7bac-7490-ad1a-923c10c400c4':{form:'vs',teams:[2,2],action:'throw',trainer:false},
 // Pass volley
 '01965d01-4016-7ee2-a613-8cd51a086189':{form:'vs',teams:[2,2],action:'forearm',trainer:false},
 // Ratten en raven
 '01965d08-999e-7fe0-afb4-12d502f4d9f7':{form:'cross',action:'run',net:false,trainer:false},
 // Trefbal
 '01965d11-bc8d-7ad9-bde0-769d1ca0252b':{form:'vs',teams:'half',net:false,action:'throw'},
 // Tennis
 '01965d11-bc8d-7ad9-bde0-769d1d082413':{form:'vs',teams:[1,1],action:'throw',net:true},
 // Inspelen over het net
 '01965d1a-f559-76aa-a7db-8f1aca771ca5':{form:'vs',teams:[2,2],action:'forearm',net:true},
 // Zit stootbal
 '01965d1a-f559-76aa-a7db-8f1acaf487f0':{form:'pairs',action:'overhead',over:false},
 // Onderarms jongleren
 '01965d1a-f559-76aa-a7db-8f1acbc86d22':{form:'solo',action:'up',net:false},
 // Stuiterbal
 '01965d24-126d-7839-8a77-9267e3b3ccda':{form:'wall',action:'forearm'},
 // Dribbelen in beweging
 '01965d24-126e-731f-9e5b-2193bdf649b2':{form:'cross',action:'bounce',net:false,trainer:false},
 // Stuit-en-vangbal
 '01965d2d-3384-7cd0-8d7d-657736c29ac0':{form:'wall',action:'throw',objs:[]},
 // Commando..
 '01965d2f-0734-76ee-9abf-730d1a0dc90f':{form:'solo',action:'none',net:false},
 // Ogen dicht
 '01965d36-7b8a-7cc9-8013-0dba40575ee7':{form:'cross',action:'run',net:false},
 // Turbo
 '01965d38-3482-7cdd-96d5-041085814cda':{form:'vs',teams:[2,2],action:'forearm',net:true},
 // Kingkong
 '01965d41-57ff-7ffd-9042-9a85e6fc898e':{form:'vs',teams:[2,2],action:'throw',net:true,trainer:false,objs:[]},
 // Actie circuit 3
 '01965d48-aef9-70a9-8164-4ac8c644aebb':{form:'circuit',action:'throw'},
 // Bewegende pakjesboot
 '0196c88b-288e-7e5e-8a6e-16aae7eee204':{form:'relay',action:'run',objs:[]},
 // ===== Level 4: nagelopen tegen de VolleyWijzer-tekst (16-11-2026) =====
 // Over de sloot
 '01965cc8-860b-72f4-ab49-27513475d2d6':{form:'relay',action:'run'},
 // Sit and jump
 '01965cd1-afa1-779c-9759-25d8029bb4bf':{form:'pairs',action:'none',over:false},
 // Het aanval spel
 '01965cd3-79cc-77d1-a26b-5b46a897fc8b':{form:'vs',teams:[2,2],action:'smash'},
 // Doeltjes smash
 '01965cda-e03a-76ad-86b7-a552f905c374':{form:'queue',action:'smash',over:true,objs:[]},
 // Smashball Level 4
 '01965e24-68bb-7d54-aabd-b3be2fd299d7':{form:'vs',teams:[3,3],action:'smash'},
 // Korfvolley
 '01965d7f-a683-7877-83fc-fd99691f8941':{form:'pairs',action:'overhead',over:false},
 // Deense One on One (bovenhands)
 '01965d7f-a683-7877-83fc-fd996a1590e2':{form:'vs',teams:[1,1],action:'overhead'},
 // Set op de korf
 '01965d7f-a683-7877-83fc-fd996a35afbc':{form:'queue',action:'overhead',trainer:true,over:false},
 // Korfbal
 '01965d81-7197-77a8-a501-c22ff5b81722':{form:'queue',action:'overhead',trainer:true,over:false},
 // In het doel
 '01965d88-cf90-78e9-80f4-0bdf9c79502f':{form:'queue',action:'overhead',over:false},
 // Dubbele kans
 '01966696-e277-7cd7-af5b-70b4ee36c0d7':{form:'queue',action:'forearm',trainer:true,over:false},
 // Eerst onderarms spelen
 '0196669e-3b08-7672-822c-d03d91520050':{form:'feed',over:true,trainer:true,action:'throw'},
 // Pass met beloning
 '01a0a491-1a39-716d-8423-216655931d61':{form:'feed',over:true,trainer:true,action:'throw'},
 // Serveren op schietschijf
 '019db3d4-e86c-7290-ae2f-6801a64b9d66':{form:'wall',action:'throw',objs:[]},
 // Stuit serie
 '019666a9-320c-7302-8659-40bb4bbb992f':{form:'solo',action:'bounce',net:false},
 // Pannenkoek
 '019666b0-8a80-76f9-a45f-d063001d94da':{form:'pairs',action:'throw',over:false},
 // Rennen en duiken
 '019666b0-8a81-7bf0-94da-aed2d1600dfd':{form:'pairs',over:true,action:'dive',objs:[]},
 // Kom eronder!
 '019666b0-8a81-7bf0-94da-aed2d1fab9a6':{form:'pairs',over:true,action:'dive',objs:[]},
 // Eronderdoor
 '019666b2-587b-7303-981e-7fc0a1b46fd5':{form:'pairs',action:'dive',over:false},
 // Aanvalluh 3-tal
 '01965dff-cb54-717e-9a19-3c9c7a084f35':{form:'queue',action:'smash',trainer:true,over:true},
 // Koop een koe
 '01965d7f-a683-7877-83fc-fd9969d5f081':{form:'cross',action:'run',net:false,objs:[]},
 // Steen, papier, schaar
 '01965d88-cf90-78e9-80f4-0bdf9bafa57a':{form:'pairs',action:'none',net:false},
 // Indian Dodge
 '01965d8a-98f6-73d6-b0f8-284e754c7e20':{form:'vs',teams:'half',net:false,action:'throw',objs:[]},
 // 4 tegen 4 met hoepel
 '01965d91-eaa4-7783-aa10-7dfb13853c2b':{form:'vs',teams:[4,4],action:'throw',net:true},
 // Carrousel
 '01965d93-bd4c-7c7e-823a-23b424b666b7':{form:'vs',teams:'half',action:'overhead',net:true},
 // Grote doelbalspel
 '01965e12-2516-7d64-a58c-ea5e525fe5f5':{form:'vs',teams:'half',net:false,action:'throw'},
 // Stoot en push up
 '01965e12-2516-7d64-a58c-ea5e53461efc':{form:'pairs',action:'throw',over:false,net:false},
 // Door de poort
 '01965e1b-48b5-7d56-95a1-32369334a506':{form:'queue',action:'smash',over:true,trainer:false,objs:[]},
 // Drie tegen drie
 '01965e1d-14da-7eb4-9f61-3b11b8054917':{form:'vs',teams:[3,3],action:'throw',net:true},
 // Om de beurt 2vs2
 '01965e24-68bb-7d54-aabd-b3be30a960b9':{form:'vs',teams:[2,2],action:'throw'},
 // Pakjes op de daken
 '0196c89b-a786-7e2b-a109-f264e034103d':{form:'queue',rows:1,action:'throw',net:false,trainer:false,course:[[0.3,0.5],[0.55,0.5]],objs:[{t:'korf',at:[[0.8,0.5]]},{t:'bank',at:[[0.3,0.5]]},{t:'kast',at:[[0.55,0.5]]}]},
 // Zwieren van dak naar dak
 '0196c89b-a786-7e2b-a109-f264e0b6667d':{form:'cross',action:'run',net:false,trainer:false,objs:[{t:'bank',at:[[0.3,0],[0.7,0],[0.3,1],[0.7,1]]}]},
 // ===== Level 5: nagelopen tegen de VolleyWijzer-tekst (16-11-2026) =====
 // Het aanvallende team
 '019666b9-af21-705d-afad-a50bc4c11fa3':{form:'queue',action:'smash',setter:true,over:true},
 // Raak slaan in het vak
 '019666b9-af21-705d-afad-a50bc5b9c03c':{form:'queue',action:'smash',setter:true,over:true,objs:[]},
 // Smash in het doel
 '019666bb-81b9-73b4-8853-b74736dc0875':{form:'queue',action:'smash',trainer:true,over:true,objs:[{t:'doel',at:[[0.94,0.5]]}]},
 // Smash tegen-standers
 '019666c2-e385-718f-83a9-2b02a1b118fd':{form:'queue',action:'smash',setter:true,over:true},
 // Smash erlangs
 '019666c2-e385-718f-83a9-2b02a29631c5':{form:'queue',action:'smash',setter:true,over:true,objs:[]},
 // Smash en hit
 '019666c2-e385-718f-83a9-2b02a2e271c3':{form:'queue',action:'smash',setter:true,over:true,objs:[]},
 // Smash met blok
 '019666c2-e385-718f-83a9-2b02a0ed1baa':{form:'queue',action:'smash',setter:true,over:true,objs:[]},
 // Tchouksmash vanuit set
 '019d966f-44d4-75c3-8f63-e8a77927546a':{form:'queue',action:'smash',setter:true},
 // Gooi hem neer
 '0196ed8e-f166-701c-9d7e-e5308059bed1':{form:'queue',action:'block',setter:true,over:false,objs:[]},
 // Blokkeer het doel
 '0196ed8e-f166-701c-9d7e-e53080a8c906':{form:'queue',action:'smash',over:true,objs:[{t:'doel',at:[[0.6,0.5]]}]},
 // Spiegelblok
 '0196ed8d-2f83-7e63-8651-3ce31db33208':{form:'netpairs',action:'none'},
 // Blok-blok-blok
 '0196ed8e-f166-701c-9d7e-e530819e8fcd':{form:'netrun',objs:[],trainer:true},
 // Snelduel
 '0196ed8d-2f84-79b0-96c7-2e01016f5e02':{form:'netrun',objs:[],trainer:true},
 // Hard in het blok
 '0196ed8d-2f84-79b0-96c7-2e0101ac4d20':{form:'pairs',action:'throw',over:false},
 // Blok en verdedig niet alleen
 '0196ed8d-2f84-79b0-96c7-2e01028f9096':{form:'queue',action:'smash',trainer:true,over:true},
 // V-vorm
 '0196f790-9329-778b-b010-78045ebe07d8':{form:'triples',action:'overhead',over:false},
 // In een driehoek
 '0196f790-9329-778b-b010-78045f793732':{form:'triples',action:'overhead',over:false},
 // Blauwe vlinder
 '0196f790-9329-778b-b010-78046027571e':{form:'triples',action:'overhead',over:true},
 // Bovenhands (2 met 2)
 '0196f734-fe85-7e72-8153-a978ef00ddfd':{form:'vs',teams:[2,2],action:'overhead',trainer:false},
 // Bovenhands in de korf
 '0196f72d-ba06-7f80-b34a-acdf23021306':{form:'triples',action:'overhead',over:false},
 // Achteruit
 '0196f72d-ba06-7f80-b34a-acdf2400f6d7':{form:'triples',action:'overhead',over:false},
 // Achter over het net
 '0196ed8d-2f84-79b0-96c7-2e0103e254f2':{form:'triples',action:'overhead',over:true},
 // Blinde korf
 '0196ed8d-2f84-79b0-96c7-2e0103e49111':{form:'triples',action:'overhead',over:false,objs:[{t:'korf',n:1}]},
 // Speedpassen
 '01966739-dc94-7f51-815c-caa7fa099b1b':{form:'pairs',over:true,action:'forearm'},
 // Take 5
 '0196673b-af27-74ee-9385-56d56ed20ff0':{form:'feed',over:true,trainer:true,action:'throw'},
 // Oranje vlinder (onderarms)
 '01966743-0799-76d5-a811-27208f25e142':{form:'triples',over:true,action:'forearm'},
 // Don't drop the baby
 '01966743-0799-76d5-a811-27208f2e150c':{form:'vs',teams:[2,2],action:'forearm'},
 // Baggertennis
 '01966743-0799-76d5-a811-27208ff2d4f4':{form:'vs',teams:'half',action:'forearm',trainer:false},
 // Achterover
 '0196674c-3dc8-7345-b029-60c0cbf38c7f':{form:'triples',over:true,action:'forearm',trainer:false},
 // Onder-achterwaartse set
 '0196674c-3dc8-7345-b029-60c0cc5b491a':{form:'triples',action:'forearm',over:false},
 // Rennen voor de noodbal
 '0196674d-fe77-7155-9a96-468c6ba2cab0':{form:'feed',over:false,trainer:true,action:'throw',recv:1},
 // Het Ingooi spel
 '0196ed96-5987-7c6b-9744-5ad85824d897':{form:'pairs',over:true,action:'throw'},
 // Tsjechisch doelverdedigen
 '0196ed96-5987-7c6b-9744-5ad858a8d44e':{form:'queue',action:'smash',over:false},
 // Achtje
 '0196ed96-5987-7c6b-9744-5ad8597c8400':{form:'queue',action:'dive',trainer:true,over:false},
 // Teamverdediging
 '0196ed96-5987-7c6b-9744-5ad85a315905':{form:'feed',over:false,trainer:true,action:'throw',recv:3},
 // Omgekeerde wereld
 '0196ed96-5987-7c6b-9744-5ad85b29c004':{form:'queue',action:'dive',trainer:true,over:false,rows:1},
 // Solo
 '0196ed96-5987-7c6b-9744-5ad85bb4a414':{form:'pairs',action:'dive',over:false},
 // Powerbal
 '0196ed96-5987-7c6b-9744-5ad85c9bbc2b':{form:'feed',over:true,trainer:false,action:'throw',recv:3,objs:[{t:'kast',at:[[0.3,0.5]]}]},
 // Rondje verdedigen
 '0196ed96-5987-7c6b-9744-5ad85d0e03f2':{form:'queue',action:'dive',trainer:true,over:false},
 // Run and dig
 '0196ed96-5987-7c6b-9744-5ad85d148b5a':{form:'queue',action:'dive',trainer:true,over:false},
 // 8-baan
 '0196ed96-5987-7c6b-9744-5ad85d3f55f3':{form:'pairs',action:'dive',over:false},
 // Tweeslag verdedigen
 '0196ed96-5987-7c6b-9744-5ad85d99422f':{form:'feed',over:true,trainer:true,action:'throw'},
 // Sprongbal
 '0196ed96-5987-7c6b-9744-5ad85deaea0e':{form:'feed',over:true,trainer:true,action:'throw',objs:[]},
 // Pepperen
 '0196ed96-5987-7c6b-9744-5ad85ecc38cf':{form:'pairs',over:false,action:'throw'},
 // Voor-tijdens-na (serveren)
 '0196a4b3-c6a0-7bcd-a324-4915c0138da0':{form:'vs',teams:[1,2],action:'smash'},
 // De setter van het net
 '0196a4bc-f0a1-7c7a-8276-73f50b3658cc':{form:'queue',action:'smash',trainer:true,over:true},
 // Iemand is hem, niemand is hem
 '0196a486-01b0-7144-8664-2faa783a7470':{form:'tag',net:false,trainer:false,objs:[{t:'hoepel',at:[[1.08,0.4],[1.08,0.6]]}]},
 // Mattensmash
 '0196a48f-3325-7d72-a14a-838aa9b8f42a':{form:'vs',teams:'half',net:false,action:'throw',objs:[{t:'mat',at:[[0.06,0.5],[0.94,0.5]]}]},
 // Vlinderen
 '0196a498-5501-74a5-ac7d-18d6a8cc9df2':{form:'triples',over:true,action:'forearm'},
 // Boter, kaas en eieren
 '0196a498-5501-74a5-ac7d-18d6a9c35ff2':{form:'relay',action:'run',net:false,objs:[{t:'hoepel',at:[[0.7,0.3],[0.8,0.3],[0.9,0.3],[0.7,0.5],[0.8,0.5],[0.9,0.5],[0.7,0.7],[0.8,0.7],[0.9,0.7]]}]},
 // Bokje springen
 '0196a49a-2312-73ee-9105-62d959212af8':{form:'pairs',action:'throw',over:false,net:false},
 // Achterover spelen
 '0196a4a1-7ee9-7779-8fc2-6b16c86d01cd':{form:'solo',action:'up',net:false},
 // The ball
 '0196a4a1-7ee9-7779-8fc2-6b16c8b2bde5':{form:'pairs',action:'hold',net:false,objs:[]},
 // Tennisbalpylon
 '0196a4a1-7ee9-7779-8fc2-6b16c93759c6':{form:'vs',teams:[2,2],action:'throw',net:true,objs:[]},
 // Chaosbal
 '0196a4aa-a974-73ee-908d-7a2733ed581d':{form:'vs',teams:[3,3],action:'throw',net:true},
 // King of the court
 '0196a4aa-a974-73ee-908d-7a27343c2cab':{form:'vs',teams:[2,2],action:'smash',net:true},
 // 1 tegen 1 King of the Court
 '0196c980-87cc-7f49-897e-7e71b7a2676f':{form:'vs',teams:[1,1],action:'throw',net:true},
 // Sinttchoukbal
 '0196c8a4-ccc7-7eb0-98e7-87545ccbbb49':{form:'queue',action:'smash',over:false,net:false}
};
})();
