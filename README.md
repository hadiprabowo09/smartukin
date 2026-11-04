# SMART UKIN TIMER & TEACHING GUIDE

Aplikasi web (PWA) pengatur waktu + panduan mengajar untuk take video UKIN PPG Calon Guru,
microteaching, simulasi, dan supervisi. HTML/CSS/JavaScript murni — **tanpa CDN, tanpa API, tanpa server**.

## Cara memakai (3 langkah)

1. **Taruh folder ini di hosting HTTPS** (mis. GitHub Pages, Netlify, Cloudflare Pages — gratis), lalu buka alamatnya.
   Untuk mencoba di komputer sendiri: `python3 -m http.server 8000` di folder ini, lalu buka `http://localhost:8000`.
   > Service Worker (mode offline) hanya aktif di **HTTPS** atau **localhost**. Membuka `index.html` langsung dari
   > file (`file://`) tetap berjalan, tetapi tanpa cache offline.
2. **Buka sekali dengan internet** sampai di menu *Pengaturan Aplikasi* tertulis **“Siap dipakai offline”**
   (juga tampil di pojok kiri bawah). Opsional: *Install* sebagai aplikasi (Chrome/Edge: menu ⋮ → Instal aplikasi;
   iPhone/iPad: Safari → Bagikan → Tambah ke Layar Utama).
3. **Selesai.** Setelah itu semua fitur berjalan tanpa internet, juga setelah browser ditutup dan dibuka lagi.

## Alur kerja saat take video

1. *Template Pembelajaran* → pilih template → **Gunakan** (atau *Buat Proyek Baru*).
2. *Pengaturan Sintaks* → sesuaikan nama, durasi, panduan guru/murid, kalimat guru, checklist.
   Aplikasi memperingatkan jika jumlah durasi sintaks ≠ total waktu (tersedia tombol *skalakan otomatis*).
3. *Live Timer* → tekan **MULAI** (Spasi). Tombol **F** = mode presentasi layar penuh.
4. Selesai → rekap tersimpan otomatis di *Riwayat Kegiatan*; ekspor **PDF/CSV** dari *Rekap Waktu*.

Pintasan Live Timer: `Spasi` mulai/jeda · `→` berikutnya · `←` sebelumnya · `R` ulangi · `F` presentasi · `M` senyap.

## Kelengkapan fitur (sesuai spesifikasi)

| Bagian | Status |
|---|---|
| Total timer, timer sintaks, panduan guru | ✓ |
| Dashboard (judul, mapel, kelas, model, durasi, berjalan, sisa, sintaks aktif, %, selesai, berikutnya) | ✓ |
| Pengaturan total timer (jam/menit/detik, waktu mulai & selesai, peringatan 5/3/1 mnt, 30 dtk, habis, batas kustom) | ✓ |
| Sintaks tak terbatas: tambah/hapus/gandakan/urut (tombol & seret), 12 kolom isian, checklist | ✓ |
| Live Mode: 4 pertanyaan panduan, progress ganda, tombol Mulai/Jeda/Lanjutkan/Berikutnya/Ulangi/Selesaikan | ✓ |
| Otomatis/manual, lewati, loncat sintaks, ±waktu saat berjalan, jeda antar-sintaks | ✓ |
| Teleprompter (sintaks saat ini / seluruh naskah, ukuran huruf, jarak baris, gulir otomatis, cermin) | ✓ |
| 10 template (UKIN, PJOK, PBL, PjBL, Discovery, Cooperative, Berdiferensiasi, Deep Learning, Microteaching, Umum) + template pribadi | ✓ |
| Tema terang / gelap / kontras tinggi, 3 ukuran teks, jarak baris | ✓ |
| Alarm Web Audio (4 pilihan suara), mode senyap, banner & kilatan visual, warna hijau–kuning–merah | ✓ |
| PWA + Service Worker (18 aset di-precache), indikator ONLINE/OFFLINE, status “siap offline” | ✓ |
| Proyek ganda, gandakan, hapus, impor/ekspor JSON, backup & restore | ✓ |
| Rekap: tabel, grafik, ketepatan waktu, ekspor PDF & CSV | ✓ |

## Catatan teknis

- **Akurasi timer**: berbasis timestamp (`Date.now`), bukan hitungan interval. Tetap benar saat tab di background,
  layar dikunci, atau halaman di-refresh — status sesi disimpan dan dipulihkan.
  Bila aplikasi tertutup > 3 jam, sesi dijeda otomatis agar tidak “melompat”.
- **Data** disimpan di `localStorage` perangkat (±5 MB). Unduh cadangan berkala dari menu *Backup dan Restore*.
  Browser (terutama Safari iOS) dapat menghapus data situs yang lama tak dibuka — cadangan melindungi dari ini.
- **Layar tetap menyala** saat timer berjalan (Wake Lock) bila browser mendukung.
- **Font**: memakai font sistem agar benar-benar offline tanpa berkas font tambahan.
- Ekspor **PDF** memakai pembuat PDF internal (font Helvetica); huruf beraksen otomatis disederhanakan.
- Setelah mengubah berkas aplikasi, naikkan `VERSION` di `sw.js` agar perangkat mengunduh versi baru
  (tombol *Cek pembaruan* ada di Pengaturan Aplikasi).

## Pengujian

```
node tests/engine.test.js     # 24 uji logika timer (jam simulasi)
python3 tests/e2e.py          # 72 pemeriksaan di Chrome headless (butuh playwright)
```

## Struktur

```
index.html  manifest.webmanifest  sw.js
css/style.css
js/engine.js      inti timer (tanpa DOM, bisa diuji di Node)
js/templates.js   10 template     js/storage.js   penyimpanan & backup
js/audio.js       alarm lokal     js/pdf.js       pembuat PDF
js/ui.js          helper UI       js/app.js       router, sesi, PWA
js/pages-*.js     halaman aplikasi
icons/            ikon PWA
```
