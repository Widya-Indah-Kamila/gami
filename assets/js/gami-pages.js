/* =====================================================================
   GAMI — penghubung antar halaman
   Mesin (gami-engine.js) sama persis dengan file tunggal GAMI.html.
   Berkas ini hanya mengerjakan dua hal:
   1) menyimpan & memulihkan progres (XP, HP, lencana, status materi) antar halaman;
   2) mengubah perpindahan internal go(n) menjadi perpindahan antar berkas HTML.
   ===================================================================== */
(()=>{
const SITE=window.GAMI_SITE,PAGE=window.GAMI_PAGE||{};
const PREVIEW=/[?&]preview=1/.test(location.search);   // mode pratinjau: semua materi terbuka, progres tidak disimpan
const QS=PREVIEW?'?preview=1':'';
const KEY='gami.progress.v1';
let booting=true,CUR=-1;

/* ---------- penyimpanan progres ---------- */
const snapshot=()=>({t:Date.now(),
  s:{hp:state.hp,xp:state.xp,done:state.done,bd:[...state.bd],pos:state.pos,px:state.px},
  prog:prog,res:res,fail:FAIL,maxM:maxM});
const setObj=(o,v,d)=>{Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,d||{},v||{})};
function apply(d){
  const s=(d&&d.s)||{};
  state.hp=typeof s.hp=='number'?s.hp:100;state.xp=s.xp||0;state.done=s.done||{};
  state.bd=new Set(s.bd||[]);state.pos=s.pos||{};state.px=s.px||{};
  setObj(prog,d&&d.prog,{1:0,2:0,3:0,4:0});setObj(res,d&&d.res,{});setObj(FAIL,d&&d.fail,{});
  maxM=(d&&d.maxM)||1;
}
const enc=d=>{try{return btoa(unescape(encodeURIComponent(JSON.stringify(d))))}catch(e){return ''}};
const dec=h=>{try{return JSON.parse(decodeURIComponent(escape(atob(h))))}catch(e){return null}};
function load(){
  /* localStorage (utama) + #gami=... di URL (cadangan bila localStorage tidak dibagi antar berkas, mis. Firefox via file://) */
  let a=null,b=null;
  try{a=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  const m=/[#&]gami=([^&]+)/.exec(location.hash);if(m)b=dec(m[1]);
  return a&&b?(a.t>=b.t?a:b):(a||b);
}
function save(){
  if(PREVIEW)return null;
  const d=snapshot();
  try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}
  try{history.replaceState(null,'',location.pathname+location.search+'#gami='+enc(d))}catch(e){}
  return d;
}
const fin=()=>{try{window.__gamiFin&&window.__gamiFin()}catch(e){}};

/* ---------- perpindahan halaman ---------- */
function leave(rel,same){
  fin();const d=save();
  if(same){location.reload();return}
  location.href='../'+rel+QS+(PREVIEW||!d?'':'#gami='+enc(d));
}
const inner=go;
go=function(n){
  if(booting)return inner(n);
  if(typeof n==='string'){
    const t={beranda:SITE.beranda,progres:SITE.progres,welcome:SITE.welcome}[n];
    if(t)leave(t,t===PAGE.rel);
    return;
  }
  const idx=Math.max(0,Math.min(SC.length-1,n)),m=SC[idx].m||1;
  if(!can(m)){msg('Materi '+m+' masih terkunci. Lulus Materi '+(m-1)+' dulu (XP minimal '+GATE.xp+', HP tidak habis).');return}
  leave(SITE.scenes[idx],idx===CUR);
};

/* ---------- tampilan khusus ---------- */
function showWelcome(){
  document.querySelector('header').style.display='none';
  document.querySelector('.wrap').style.display='none';
  pg.hidden=true;
  document.getElementById('wl').hidden=false;
  document.body.style.overflow='hidden';
  document.getElementById('wlb').onclick=()=>go('beranda');
}
function showLocked(m){
  document.body.classList.remove('m1');navR(m);
  $('#side').innerHTML='';
  $('#bc').innerHTML='<b>Materi '+m+'</b><span>Terkunci</span>';
  $('#stage').innerHTML='<div class="c" style="text-align:center;padding:30px"><div class="big">🔒</div><h1>Materi '+m+' masih terkunci</h1><p>Selesaikan Materi '+(m-1)+' beserta tantangannya (XP minimal '+GATE.xp+', HP tidak habis) terlebih dahulu.</p><p><button class="bt y" id="toB">🏠 Kembali ke Beranda</button></p></div>';
  $('#toB').onclick=()=>go('beranda');
  $('#prev').disabled=true;$('#next').disabled=true;$('#dots').innerHTML='';
}

/* ---------- mulai ---------- */
function boot(){
  apply(PREVIEW?{prog:{1:2,2:2,3:2,4:0},maxM:4}:load());
  if(PAGE.kind==='welcome')showWelcome();
  else if(PAGE.kind==='beranda')inner('beranda');
  else if(PAGE.kind==='progres')inner('progres');
  else{
    const m=SC[PAGE.idx].m||1;
    if(!can(m))showLocked(m);else inner(PAGE.idx);
    CUR=PAGE.idx;
  }
  booting=false;save();
}
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});   // tombol Back: muat ulang agar progres terbaru dipakai
addEventListener('pagehide',()=>{if(booting)return;fin();save()});
boot();
})();
