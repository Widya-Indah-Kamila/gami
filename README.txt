GAMI — versi terpecah per halaman
=================================

CARA MEMAKAI
- Ekstrak ZIP, lalu buka  index.html  (otomatis menuju halaman Welcome).
- Jangan memindahkan satu berkas HTML saja: semua halaman memakai folder "assets" bersama.
- Perlu internet untuk font Google dan ikon Font Awesome (sama seperti file GAMI.html asli).
- Progres (XP, HP, lencana, materi terbuka) tersimpan otomatis di browser dan terbawa antar halaman.

STRUKTUR
  index.html                -> pengalih ke Welcome
  daftar-halaman.html       -> daftar semua halaman (mode pratinjau, semua materi terbuka)
  01-welcome/               -> Welcome
  02-beranda/               -> Beranda (4 kartu: Tujuan, Petunjuk, Materi, Praktik)
  03-materi-1/ ... 06-materi-4/  -> satu HTML per sub-materi / tahap tantangan
  07-progres/               -> Progres Saya
  assets/css, assets/js, assets/img
      gami-engine.js  : seluruh logika/isi materi (sama dengan GAMI.html asli)
      gami-pages.js   : penghubung antar halaman + penyimpanan progres
      gami-sitemap.js : daftar nama berkas tiap halaman (ubah di sini bila nama berkas diganti)

MENGUBAH ISI
- Teks dan tampilan tiap halaman ada di gami-engine.js (cari id scene, mis. '1.1.1').
- Gambar ada di assets/img (bisa diganti dengan nama berkas yang sama).
- Tautan Google Drive pengumpulan Praktik: cari DRIVE_URL di gami-engine.js.

PRATINJAU
- Tambahkan ?preview=1 di akhir alamat halaman (atau pakai daftar-halaman.html) untuk membuka halaman mana pun
  tanpa mengikuti urutan dan tanpa menyimpan progres.
- Untuk mengulang dari nol: hapus data situs/localStorage browser, atau buka dengan jendela penyamaran (incognito).

CATATAN: nilai lulus Materi (XP minimal 700, HP tidak habis) ada di gami-engine.js pada konstanta GATE.
