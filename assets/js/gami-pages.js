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
let fur=0,sideClosed=null;                               // lihat apply()
const lastOf=m=>{let l=-1;SC.forEach((z,k)=>{if((z.m||1)==m)l=k});return l};

/* ---------- penyimpanan progres ---------- */
const snapshot=()=>({t:Date.now(),
  s:{hp:state.hp,xp:state.xp,done:state.done,bd:[...state.bd],pos:state.pos,px:state.px},
  prog:prog,res:res,fail:FAIL,maxM:maxM,fur:fur,sd:sideClosed});
const setObj=(o,v,d)=>{Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,d||{},v||{})};
function apply(d){
  const s=(d&&d.s)||{};
  state.hp=typeof s.hp=='number'?s.hp:100;state.xp=s.xp||0;state.done=s.done||{};
  state.bd=new Set(s.bd||[]);state.pos=s.pos||{};state.px=s.px||{};
  setObj(prog,d&&d.prog,{1:0,2:0,3:0,4:0});setObj(res,d&&d.res,{});setObj(FAIL,d&&d.fail,{});
  maxM=(d&&d.maxM)||1;
  /* fur = indeks halaman terjauh yang pernah dibuka (dasar kunci linear sidebar & persen progres).
     Data lama tanpa fur: dipulihkan dari status materi supaya progres lama tidak hilang. */
  fur=d&&typeof d.fur=='number'?d.fur:legacyFur();
  sideClosed=d&&(d.sd===0||d.sd===1)?d.sd:null;
}
function legacyFur(){
  let f=0;
  for(let m=1;m<=4;m++){if(prog[m]==2)f=Math.max(f,lastOf(m));else if(prog[m]==1)f=Math.max(f,first(m))}
  return f;
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

/* ---------- progres (persen) ----------
   Setiap materi bernilai 25%. Di dalam satu materi, persennya mengikuti halaman terjauh yang sudah dibuka.
   Materi baru dihitung penuh (25%) setelah tantangan akhirnya lulus; sebelum itu maksimal sedikit di bawah 25%. */
function percent(){
  let t=0;
  for(let m=1;m<=4;m++){
    const a=first(m),n=lastOf(m)-a+1;let f;
    if(prog[m]==2)f=1;
    else{const d=Math.max(0,Math.min(fur-a,n-1));f=Math.min(d/(n-1),(n-2)/(n-1))}
    t+=f*25;
  }
  return Math.round(t);
}

/* ---------- ikon kecil ---------- */
const ICO={
  x:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  burger:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  chev:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  go:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- navigasi atas: logo = Beranda, progress bar ---------- */
function decorateHeader(){
  const logo=document.querySelector('.logo');
  if(logo){
    logo.setAttribute('role','link');logo.setAttribute('tabindex','0');logo.setAttribute('aria-label','GAMI, kembali ke Beranda');
    const home=()=>{if(PAGE.kind!=='beranda')go('beranda')};
    logo.onclick=home;
    logo.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();home()}};
  }
  const nav=document.querySelector('nav');
  if(nav){
    const p=percent();
    nav.onclick=null;nav.className='gp';
    nav.setAttribute('role','progressbar');nav.setAttribute('aria-label','Progres belajar Materi 1 sampai 4');
    nav.setAttribute('aria-valuemin','0');nav.setAttribute('aria-valuemax','100');nav.setAttribute('aria-valuenow',p);
    nav.innerHTML='<div class="gp-l">Progres</div><div class="gp-t"><i style="width:'+p+'%"></i></div><b>'+p+'%</b>';
  }
}

/* ---------- tombol "Mulai Belajar" di Beranda ---------- */
function decorateBeranda(){
  const grid=pg.firstElementChild;if(!grid)return;
  grid.classList.add('gd-grid');
  pg.insertAdjacentHTML('beforeend','<div class="gd-cta"><button type="button" class="gd-start" id="gdStart"><span>Mulai Belajar</span>'+ICO.go+'</button></div>');
  /* lanjut dari halaman terjauh yang pernah dibuka; pengguna baru otomatis mulai dari halaman pertama Materi 1 */
  $('#gdStart').onclick=()=>go(Math.max(0,Math.min(SC.length-1,fur)));
}

/* ---------- sidebar Materi (dropdown, terkunci linear, bisa ditutup) ---------- */
const MTITLE={1:'Belajar Mendalam (Deep Learning)',2:'Gamifikasi Pembelajaran',3:'Teknik Penyusunan Prompt',4:'Pengembangan Gamifikasi'};
const subFirst=(m,s)=>SC.findIndex(z=>(z.m||1)==m&&z.sub==s);
const subLast=(m,s)=>{let l=-1;SC.forEach((z,k)=>{if((z.m||1)==m&&z.sub==s)l=k});return l};
function setSide(closed,persist){
  sideClosed=closed?1:0;
  document.body.classList.toggle('sb-closed',closed);
  const b=document.querySelector('.sb-burger');if(b)b.setAttribute('aria-expanded',String(!closed));
  const x=document.querySelector('.sb-x');if(x)x.setAttribute('aria-expanded',String(!closed));
  if(persist)save();
}
function decorateSide(activeIdx,m){
  const side=$('#side');if(!side)return;
  const cur=activeIdx>=0?SC[activeIdx]:null;
  const curM=cur?(cur.m||1):m;
  side.className='sb';side.setAttribute('aria-label','Daftar materi');
  const items=[1,2,3,4].map(k=>{
    const mLocked=first(k)>fur;
    const subs=SUBS[k].map((t,s)=>{
      const a=subFirst(k,s),open=a>=0&&a<=fur,isCur=!!cur&&(cur.m||1)==k&&cur.sub==s;
      const done=open&&!isCur&&subLast(k,s)<fur;
      const ic=isCur?'▶':!open?'🔒':done?'✓':'○';
      const cls=isCur?'on':!open?'lock':done?'done':'';
      return '<li><button type="button" class="sb-i '+cls+'" data-idx="'+a+'"'+(open?'':' disabled title="Selesaikan bagian sebelumnya terlebih dahulu"')+(isCur?' aria-current="page"':'')+'><i aria-hidden="true">'+ic+'</i><span>'+esc(t)+'</span></button></li>';
    }).join('');
    const expanded=k==curM;
    return '<li class="sb-m'+(expanded?' open':'')+(mLocked?' lock':'')+'"><button type="button" class="sb-mt" aria-expanded="'+expanded+'"><span class="sb-n">'+(mLocked?'🔒':k)+'</span><span class="sb-t">'+esc(MTITLE[k])+'</span><span class="sb-ch">'+ICO.chev+'</span></button><ul class="sb-s">'+subs+'</ul></li>';
  }).join('');
  side.innerHTML='<div class="sb-h"><b>Materi</b><button type="button" class="sb-x" aria-label="Tutup daftar materi" aria-expanded="true">'+ICO.x+'</button></div><ul class="sb-l">'+items+'</ul>';
  side.querySelectorAll('.sb-mt').forEach(b=>b.onclick=()=>{
    const li=b.parentElement,o=!li.classList.contains('open');li.classList.toggle('open',o);b.setAttribute('aria-expanded',String(o));
  });
  side.querySelectorAll('.sb-i:not(:disabled)').forEach(b=>b.onclick=()=>go(+b.dataset.idx));
  side.querySelector('.sb-x').onclick=()=>setSide(true,true);
  /* tombol garis tiga (muncul hanya saat sidebar tertutup) di baris breadcrumb */
  const bc=$('#bc');
  if(bc&&!bc.querySelector('.sb-burger')){
    const bb=document.createElement('button');bb.type='button';bb.className='sb-burger';
    bb.setAttribute('aria-label','Buka daftar materi');bb.setAttribute('aria-expanded','false');bb.innerHTML=ICO.burger;
    bb.onclick=()=>setSide(false,true);bc.insertBefore(bb,bc.firstChild);
  }
  /* bawaan: terbuka; pada layar sempit tertutup dulu agar tidak menutupi isi. Pilihan pengguna diingat antar halaman. */
  setSide(sideClosed===null?matchMedia('(max-width:820px)').matches:!!sideClosed,false);
  const on=side.querySelector('.sb-i.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});
}

function decorate(activeIdx,m){
  decorateHeader();
  if(PAGE.kind==='beranda')decorateBeranda();
  else if(PAGE.kind==='scene')decorateSide(activeIdx,m);
}

/* ---------- mulai ---------- */
function boot(){
  apply(PREVIEW?{prog:{1:2,2:2,3:2,4:0},maxM:4}:load());
  if(PREVIEW)fur=SC.length-1;                              // pratinjau: semua bagian terbuka
  let act=-1,mm=1;
  if(PAGE.kind==='welcome')showWelcome();
  else if(PAGE.kind==='beranda')inner('beranda');
  else if(PAGE.kind==='progres')inner('progres');
  else{
    const m=SC[PAGE.idx].m||1;mm=m;
    if(!can(m))showLocked(m);else{inner(PAGE.idx);act=PAGE.idx;fur=Math.max(fur,PAGE.idx)}
    CUR=PAGE.idx;
  }
  if(PAGE.kind!=='welcome')decorate(act,mm);
  booting=false;save();
}
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});   // tombol Back: muat ulang agar progres terbaru dipakai
addEventListener('pagehide',()=>{if(booting)return;fin();save()});
boot();
})();
