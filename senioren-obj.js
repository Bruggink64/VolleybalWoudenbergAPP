// senioren-obj.js – welk materiaal is een "speler" uit een Jeugd & Senioren-oefening (window.SEN)?
// Eén plek voor 2D (senioren-app.js), 3D (3d.js) en de controle (tools/controle-animaties.js).
// Namen: PN1.. of KG1.. = pion, M of M1..M6 = mat, HP1.. = hoepel, KO1.. = korf, BX/BOX = box of bank,
// LAD = loopladder, LINT = lint aan het net, Z/GZ/ZN1.. = doelzone op de vloer, KAR = ballenkar.
// Wijkt een oefening af (een oude naam), zet het dan per oefening in OBJX.
(function(root){
'use strict';
const OBJX={
 n5:{P:'pion'},n58:{P1:'pion',P2:'pion'},n60:{M:'pion'},n62:{M:'pion',M2:'pion'},n68:{P1:'pion',P2:'pion'},n85:{M:'pion',M2:'pion'},
 n90:{P1:'pion',P2:'pion'},n93:{M1:'pion',M2:'pion',M5:'pion',M6:'pion'},n96:{M1:'pion',M2:'pion',M5:'pion',M6:'pion'},n101:{M1:'pion',M2:'pion'},
 n115:{K:'pion'},n116:{K:'pion'},n11:{K:'korf'},n59:{K:'kaarten'}
};
function kind(d,p){
 const n=p[0],x=OBJX[d.id];
 if(x&&Object.prototype.hasOwnProperty.call(x,n))return x[n];
 if(/^(PN|KG)\d*$|^KE$/.test(n))return 'pion';
 if(/^M\d?$/.test(n))return 'mat';
 if(/^HP\d*$/.test(n))return 'hoepel';
 if(/^KO\d*$/.test(n))return 'korf';
 if(/^(BX|BOX)\d*$/.test(n))return 'box';
 if(/^LAD\d*$/.test(n))return 'ladder';
 if(/^LINT\d*$/.test(n))return 'lint';
 if(/^(Z|GZ|ZN\d*)$/.test(n))return 'zone';
 if(/^KAR\d*$/.test(n))return 'kar';
 if(/^KT\d*$/.test(n))return 'kaarten';
 return null;
}
const api={kind,OBJX};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root){root.senObj=kind;root.senPion=(d,p)=>kind(d,p)==='pion';}
})(typeof window!=='undefined'?window:null);
