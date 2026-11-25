// stijl2d.js – gedeelde stijl voor alle 2D-tekeningen (bovenaanzichten), in de lijn van de 3D-stijl (nov. 2026):
// donkere vrije zone, blauwgrijs veld met witte lijnen, net met gele band en zwarte palen met geel,
// spelers als zwarte schijf met een gloeiende ring en code in de rolkleur (libero geel), geel-blauwe bal.
// Wordt gebruikt door Jeugd & Senioren, 5-1 rotaties, Verdediging en Aanval. De mini's krijgen dezelfde
// kleuren via stijl2d.css (de 3D leest de mini-tekening uit, daarom blijven die kleurcodes in de SVG staan).
(function(){
'use strict';
const K={bg:'#1b1f28',apron:'#2b303b',court:'#4b5a7a',line:'#ffffff',band:'#ffd100',post:'#11131a',
 jersey:'#14171f',ball:'#ffd60a',ball2:'#1f5fd1',lib:'#ffd100'};
// donkere rolkleuren lichter maken, zoals in 3D (anders verdwijnen ze tegen het zwarte shirt)
const BRIGHT={'#1e293b':'#ffd100','#7f1d1d':'#ef4444','#0f766e':'#14b8a6','#6d28d9':'#a78bfa','#b45309':'#fb923c','#1d1d1b':'#cbd5e1','#64748b':'#94a3b8'};
function hex(c){c=String(c||'').trim().toLowerCase();if(/^#[0-9a-f]{3}$/.test(c))c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return /^#[0-9a-f]{6}$/.test(c)?c:null;}
function lum(c){const h=hex(c);if(!h)return .5;const v=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function bright(c){const h=hex(c);if(!h)return c||'#cbd5e1';if(BRIGHT[h])return BRIGHT[h];if(lum(h)>=.28)return h;
 const v=[1,3,5].map(i=>Math.round(parseInt(h.substr(i,2),16)*.55+255*.45));return '#'+v.map(x=>x.toString(16).padStart(2,'0')).join('');}
const isLib=l=>/^(LIB|L)$/i.test(String(l||'').trim());
// groot veld (viewBox 560x680: veld x 110-450, y 40-640, net y 340, 3m-lijnen y 230 en 450)
function court560(o){o=o||{};
 return '<rect width="560" height="680" fill="'+K.apron+'"/>'
  +'<rect x="110" y="40" width="340" height="600" fill="'+K.court+'"/>'
  +'<rect x="110" y="40" width="340" height="600" fill="none" stroke="'+K.line+'" stroke-width="3"/>'
  +'<line x1="110" y1="230" x2="450" y2="230" stroke="'+K.line+'" stroke-opacity=".7" stroke-width="2"/>'
  +'<line x1="110" y1="450" x2="450" y2="450" stroke="'+K.line+'" stroke-opacity=".7" stroke-width="2"/>'
  +(o.zones||'')+net(96,464,340,6);
}
// net van bovenaf: witte mazen (schaduw), gele band, antennes op de zijlijn en zwarte palen met gele rand
function net(x0,x1,y,w,ant){w=w||6;const r=Math.max(3,w*1.15);
 const a=ant||[x0+(x1-x0)*14/368,x1-(x1-x0)*14/368];
 return '<line x1="'+x0+'" y1="'+y+'" x2="'+x1+'" y2="'+y+'" stroke="#e2e8f0" stroke-opacity=".28" stroke-width="'+(w*2)+'"/>'
  +'<line x1="'+x0+'" y1="'+y+'" x2="'+x1+'" y2="'+y+'" stroke="'+K.band+'" stroke-width="'+w+'"/>'
  +a.map(x=>'<circle cx="'+x+'" cy="'+y+'" r="'+(r*.62)+'" fill="#e11d48" stroke="#fff" stroke-width="'+(w*.3)+'"/>').join('')
  +[x0,x1].map(x=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+K.post+'" stroke="'+K.band+'" stroke-width="'+(w*.4)+'"/>').join('');
}
// speler: gloed + zwarte schijf met ring in de rolkleur + code in de rolkleur. Libero: gele schijf, donkere code.
// anim = optionele <animate>-tags voor cx/cy (worden op elk onderdeel gezet); ty = animate voor de tekst (y+offset)
const fsz=(label,r,fs)=>{fs=fs||Math.round((r||16)*.66*10)/10;return String(label==null?'':label).length>3?fs*.86:fs;};
const tdy=(label,r,fs)=>Math.round(fsz(label,r,fs)*.36*10)/10; // tekst iets onder het midden zodat hij gecentreerd oogt
function tok(x,y,label,color,r,o){o=o||{};r=r||16;const c=bright(color),lib=isLib(label);
 const t=String(label==null?'':label).replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
 const sz=fsz(label,r,o.fs);
 return '<circle cx="'+x+'" cy="'+y+'" r="'+(r+4.5)+'" fill="'+c+'" opacity=".22">'+(o.a||'')+'</circle>'
  +'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(lib?K.lib:K.jersey)+'" stroke="'+c+'" stroke-width="'+(o.sw||Math.max(2,r*.19))+'">'+(o.a||'')+'</circle>'
  +(t?'<text x="'+x+'" y="'+(y+tdy(label,r,o.fs))+'" fill="'+(lib?K.jersey:c)+'" font-size="'+sz+'" font-weight="900" text-anchor="middle" font-family="Poppins,system-ui,sans-serif">'+(o.ta||'')+t+'</text>':'');
}
function ball(x,y,r,a){r=r||9.5;return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+K.ball+'" stroke="'+K.ball2+'" stroke-width="'+Math.max(1.2,r*.24)+'">'+(a||'')+'</circle>';}
window.S2D={K,bright,isLib,court560,net,tok,tdy,ball};
})();
