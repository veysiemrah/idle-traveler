/* Distinct world compositions on the existing canvas and animation loop. */
(function(root){
'use strict';
const V=root.IT.V2, TAU=Math.PI*2;
const dot=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();};
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function stars(c,w,h,time,sparse){
 for(let i=0;i<(sparse?28:110);i++){
  const x=((i*137.31)%w+time*(i%3+1)*.4)%w,y=(i*79.71)%(h*.88);
  dot(c,x,y,i%13===0?1.8:.8,i%7?'#b9d3ef':'#f8d798');
 }
}
function cloud(c,x,y,size,alpha){c.save();c.globalAlpha=alpha;for(const a of [[0,0,1],[-.7,.1,.65],[.7,.12,.7],[.3,-.25,.65]])ellipse(c,x+a[0]*size,y+a[1]*size,size*a[2],size*.4,'#fff');c.restore();}
function island(c,x,y,size){
 c.fillStyle='#517e7d';c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);c.lineTo(x+size*.35,y+size*.6);c.lineTo(x-size*.2,y+size*.9);c.closePath();c.fill();ellipse(c,x,y,size,size*.18,'#8fcfb6');
 c.fillStyle='#ebd5a1';c.fillRect(x-size*.16,y-size*.36,size*.32,size*.3);c.fillStyle='#aa7b73';c.beginPath();c.moveTo(x-size*.25,y-size*.36);c.lineTo(x,y-size*.65);c.lineTo(x+size*.25,y-size*.36);c.fill();
}
function gate(c,x,y,r,time,color){
 c.save();c.translate(x,y);c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.ellipse(0,0,r*.55,r,0,0,TAU);c.stroke();c.lineWidth=1;c.beginPath();c.ellipse(0,0,r*.7,r*1.13,0,0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8+time*.08;dot(c,Math.cos(a)*r*.55,Math.sin(a)*r,2.5,'#e6e1b3');}c.restore();
}
function draw(c,viewport,view,time,scene){
 const W=viewport.width,H=viewport.height,world=view.worldId,idx=V.WORLD[world].index;
 const t=viewport.reduced?0:time,sky=idx>=4;
 const sun=Math.sin(((scene.tod===undefined?.49:scene.tod)-.25)*TAU);
 const localNight=Math.max(0,Math.min(1,(.04-sun)/.25));
 const palette={cloud:['#539ac0','#e8d9b8'],storm:['#363d68','#a0a6c1'],upper:['#152e68','#7bbfdb'],planets:['#111b3e','#323d6c'],nebula:['#20214f','#645582'],deep:['#0c1831','#263e57'],rim:['#111827','#2c354d'],void:['#080f1e','#172435'],galaxies:['#141938','#3a3d68'],fracture:['#19223d','#60577a'],frontier:['#23485b','#d5ba86']}[world]||['#397c96','#c9dee3'];
 c.save();const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,palette[0]);g.addColorStop(1,palette[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
 scene.nightAmt=sky?1:Math.max(localNight,world==='storm'?.35:0);
 if(sky||world==='upper'||localNight>.5)stars(c,W,H,t,['void','rim','deep'].includes(world));
 if(world==='cloud'){
  ellipse(c,W*.5,H*1.3,W*1.1,H*.72,'#75aeba');ellipse(c,W*.38,H*1.28,W*.7,H*.63,'#8bbdb6');
  for(let i=0;i<6;i++)cloud(c,((i*.24*W-t*(4+i))%(W+160)+W+160)%(W+160)-80,H*(.12+i*.11),35+i*5,.25+i*.07);
  island(c,W*.76,H*.38,Math.min(65,W*.12));island(c,W*.18,H*.7,Math.min(85,W*.15));
  c.strokeStyle='#e5ead3';c.setLineDash([3,8]);c.beginPath();c.moveTo(W*.18,H*.7);c.quadraticCurveTo(W*.65,H*.4,W*.76,H*.38);c.stroke();c.setLineDash([]);
 }else if(world==='storm'){
  for(let i=0;i<8;i++)cloud(c,i*W/6+Math.sin(t*.1+i)*25,H*(.18+(i%3)*.22),W*.18,.12+(i%3)*.1);
  c.strokeStyle='#d2dfef33';for(let i=0;i<35;i++){let x=(i*51+t*35)%W,y=(i*79+t*75)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+22);c.stroke();}
  ellipse(c,W*.68,H*.42,W*.13,H*.23,'#adbcc533');dot(c,W*.68,H*.45,5,'#f9dea1');
 }else if(world==='upper'){
  ellipse(c,W*.5,H*1.95,W*1.6,H*1.45,'#458caa');c.strokeStyle='#b0dced66';c.lineWidth=3;c.beginPath();c.ellipse(W*.5,H*1.95,W*1.6,H*1.45,0,Math.PI,TAU);c.stroke();
  c.strokeStyle='#bde9ef55';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,H*(.3+i*.1));c.bezierCurveTo(W*.4,H*(.1+i*.13),W*.7,H*(.6-i*.08),W,H*(.2+i*.1));c.stroke();}
  gate(c,W*.78,H*.4,24,t,'#c9dfe2');
 }else if(world==='planets'){
  dot(c,W*.55,H*.48,30,'#e9bc76');
  for(let i=0;i<3;i++){let r=65+i*52;c.strokeStyle='#a7cbd444';c.lineWidth=1;c.beginPath();c.ellipse(W*.55,H*.48,r,r*.48,-.25,0,TAU);c.stroke();const a=t*.03+i*2;dot(c,W*.55+Math.cos(a)*r,H*.48+Math.sin(a)*r*.48,8+i*4,['#77bccc','#a18dc6','#bc8f74'][i]);}
 }else if(world==='nebula'){
  for(let i=0;i<9;i++){const x=W*(.1+(i*.17)%1),y=H*(.2+(i*.11)%.6);const neb=c.createRadialGradient(x,y,0,x,y,W*.35);neb.addColorStop(0,i%2?'#5aabbd30':'#c485c33a');neb.addColorStop(1,'#a07cab00');c.fillStyle=neb;c.fillRect(0,0,W,H);}
  c.strokeStyle='#a2ebe599';const x=W*.48,y=H*.47;for(let i=0;i<3;i++){c.beginPath();c.arc(x,y,35+i*40,Math.PI*1.1,Math.PI*(1.3+view.scanReveal*.6));c.stroke();}
 }else if(world==='deep'||world==='rim'||world==='void'){
  const x=W*.77,y=H*.44;
  if(world==='rim'){
   c.save();c.translate(-W*.1,H*.95);c.rotate(-.4);for(let i=0;i<7;i++)ellipse(c,0,0,W*(.7-i*.07),H*(.2-i*.018),`rgba(150,162,213,${.025+i*.005})`);c.restore();
   c.strokeStyle='#93e9e899';for(let i=0;i<3;i++){c.beginPath();c.arc(x,y,12+i*14+t%4,Math.PI*.7,Math.PI*1.3);c.stroke();}
  }
  if(world==='deep')gate(c,x,y,45,t,'#7598a6');
  if(world==='void'){c.strokeStyle='#466170';c.setLineDash([2,12]);c.beginPath();c.moveTo(W*.2,H*.8);c.lineTo(x,y);c.stroke();c.setLineDash([]);dot(c,x,y,5,'#d9b97c');}
  c.fillStyle='#88959f';c.fillRect(x-18,y-3,36,6);c.fillRect(x-3,y-12,6,24);
 }else if(world==='galaxies'){
  const centers=[[.22,.3],[.73,.4],[.45,.75]];
  c.strokeStyle='#8fc4d66b';c.beginPath();centers.forEach(([x,y],i)=>i?c.lineTo(W*x,H*y):c.moveTo(W*x,H*y));c.closePath();c.stroke();
  for(const [x,y] of centers){for(let j=0;j<70;j++){const a=j*.5+t*.02,r=j*.7;dot(c,W*x+Math.cos(a)*r,H*y+Math.sin(a)*r*.45,1.3,j%3?'#aaa8d7':'#e9d4ad');}dot(c,W*x,H*y,5,'#f0dfb8');}
 }else if(world==='fracture'){
  c.strokeStyle='#c8b7e4';c.lineWidth=2;for(let i=0;i<5;i++){const x=W*(.15+i*.18);c.beginPath();c.moveTo(x,0);c.lineTo(x-25,H*.35);c.lineTo(x+30,H*.5);c.lineTo(x-15,H);c.stroke();}
  gate(c,W*.72,H*.48,70,t,'#d0b6dd');
 }else if(world==='frontier'){
  dot(c,W*.78,H*.37,35,view.frontierOpen?'#82c8d4':'#f3d5a0');
  if(view.frontierOpen){for(let i=0;i<3;i++){dot(c,W*(.23+i*.21),H*(.3+i*.08),12+i*4,['#729f8e','#c6ad81','#bca1cd'][i]);}}ellipse(c,W*.5,H*1.2,W*.9,H*.6,'#527a7a');gate(c,W*.74,H*.55,60,t,'#b2ddd1');
  for(let i=0;i<4;i++)dot(c,W*(.17+i*.14),H*(.7-i*.06),3,'#f0d9a6');
 }
 // The traveler remains the visual anchor as the composition changes.
 const px=W*.38,py=H*.54+Math.sin(t*.8)*3,k=Math.min(1.1,Math.max(.55,viewport.k));
 if(['walk','skates','board','bike','horse','moto','car','van','train'].includes(scene.vehicle)){ellipse(c,px,py+5,62*k,12*k,'#748a9d');}
 if(!sky&&localNight>0){c.fillStyle=`rgba(10,17,47,${localNight*.65})`;c.fillRect(0,0,W,H);}
 if(V.drawTraveler)V.drawTraveler(c,scene.vehicle,px,py,k,{phase:scene.phase,wheel:scene.wheel,t,night:scene.nightAmt,tier:scene.vehTier||0,pal:0});
 c.restore();
}
V.WorldScene={draw,hitRegions(){return [];}};
})(window);
