/* ==========================================================================
   SMART UKIN TIMER — templates.js
   10 template pembelajaran bawaan. Semua isi hanya contoh awal dan dapat
   diubah sepenuhnya oleh pengguna setelah dipakai.
   ========================================================================== */
(function (root) {
  'use strict';

  var PD = 'Pendahuluan', IN = 'Inti', PN = 'Penutup';

  function sx(phase, name, min, o) {
    o = o || {};
    return {
      phase: phase, name: name, durationSec: Math.round(min * 60),
      description: o.d || '', objective: o.g || '',
      teacherActivity: o.t || '', studentActivity: o.s || '', teacherSay: o.say || '',
      media: o.m || '', indicator: o.i || '', notes: o.n || '',
      checklist: (o.c || []).map(function (x) { return { text: x }; })
    };
  }

  /* ---------- blok pembuka & penutup yang dipakai bersama ---------- */
  function opening(tPembuka, tApersepsi, tTujuan) {
    return [
      sx(PD, 'Pembukaan & Kesiapan Belajar', tPembuka || 3, {
        d: 'Guru membuka pembelajaran dan membangun suasana kelas yang kondusif.',
        g: 'Murid siap secara fisik dan mental mengikuti pembelajaran.',
        t: 'Masuk kelas dengan senyum dan kontak mata\nMengucapkan salam dan menyapa murid\nMengajak murid berdoa\nMemeriksa kehadiran\nMemastikan kesiapan belajar (posisi duduk, alat tulis, perlengkapan)',
        say: 'Selamat pagi, anak-anak. Apa kabar hari ini? (sesuaikan salam)\nSebelum belajar, mari kita berdoa menurut agama dan kepercayaan masing-masing. Berdoa dimulai.\nSiapa yang hari ini tidak hadir? Apakah semua sudah siap belajar?',
        s: 'Menjawab salam, berdoa dengan tertib, merespons presensi, merapikan tempat duduk dan perlengkapan',
        i: 'Murid menjawab salam, berdoa tertib, dan menunjukkan kesiapan belajar',
        n: 'Bicara ramah, jelas, dan sesekali menghadap kamera. Jangan terlalu lama.',
        m: 'Daftar hadir',
        c: ['Salam & sapa murid', 'Berdoa bersama', 'Memeriksa kehadiran', 'Memastikan kesiapan belajar']
      }),
      sx(PD, 'Apersepsi & Pertanyaan Pemantik', tApersepsi || 3, {
        d: 'Menghubungkan pengetahuan awal murid dengan materi yang akan dipelajari.',
        g: 'Murid teringat pengetahuan awal dan penasaran terhadap materi.',
        t: 'Mengaitkan materi dengan pengalaman sehari-hari murid\nMengajukan 1–2 pertanyaan pemantik\nMemberi kesempatan beberapa murid menjawab\nMenanggapi jawaban murid secara positif',
        say: 'Anak-anak, pernahkah kalian mengalami/melihat [situasi sehari-hari terkait materi]?\nMenurut kalian, mengapa hal itu bisa terjadi?\nBagus sekali jawabannya. Ada pendapat lain?',
        s: 'Menjawab pertanyaan pemantik, menceritakan pengalaman, mengajukan dugaan awal',
        i: 'Murid aktif menjawab dan mengaitkan pengalaman dengan materi',
        n: 'Beri jeda 3–5 detik setelah bertanya. Panggil nama murid agar merata.',
        c: ['Mengaitkan dengan kehidupan sehari-hari', 'Mengajukan pertanyaan pemantik', 'Menanggapi jawaban murid']
      }),
      sx(PD, 'Tujuan, Manfaat & Rencana Kegiatan', tTujuan || 2, {
        d: 'Menyampaikan tujuan pembelajaran, manfaat, dan alur kegiatan.',
        g: 'Murid mengetahui apa yang dipelajari, mengapa penting, dan bagaimana alurnya.',
        t: 'Menyampaikan tujuan pembelajaran dengan bahasa yang mudah dipahami\nMenyampaikan manfaat mempelajari materi\nMenjelaskan kegiatan yang akan dilakukan secara singkat\nMenyampaikan cara penilaian bila perlu',
        say: 'Tujuan kita hari ini: kalian dapat [tujuan pembelajaran].\nManfaatnya, kalian bisa [manfaat dalam kehidupan sehari-hari].\nHari ini kita akan melakukan [kegiatan 1], kemudian [kegiatan 2], dan terakhir [kegiatan 3].',
        s: 'Menyimak tujuan, manfaat, dan alur kegiatan; mengajukan pertanyaan bila belum jelas',
        i: 'Murid dapat menyebutkan kembali tujuan pembelajaran',
        n: 'Tuliskan tujuan di papan/slide agar terlihat di kamera.',
        m: 'Papan tulis / slide tujuan',
        c: ['Menyampaikan tujuan', 'Menyampaikan manfaat', 'Menyampaikan kegiatan yang akan dilakukan']
      })
    ];
  }

  function closing(tSimpul, tRefleksi, tTindak) {
    return [
      sx(PN, 'Menyimpulkan & Penguatan', tSimpul || 2, {
        d: 'Murid dan guru menyimpulkan pembelajaran; guru memberi penguatan.',
        g: 'Murid mampu merangkum konsep utama pembelajaran.',
        t: 'Mengajak murid menyimpulkan pembelajaran\nMenanyakan poin penting yang dipelajari\nMemberikan penguatan dan meluruskan miskonsepsi\nMemberi apresiasi kepada murid',
        say: 'Mari kita simpulkan bersama. Apa yang sudah kita pelajari hari ini?\nBenar. Jadi, [poin penguatan guru].\nTerima kasih atas partisipasi kalian, kalian hebat!',
        s: 'Menyampaikan kesimpulan secara lisan; menyimak penguatan guru',
        i: 'Murid menyimpulkan materi dengan kalimat sendiri',
        n: 'Biarkan murid yang menyimpulkan lebih dulu, guru hanya melengkapi.',
        c: ['Murid menyimpulkan', 'Guru memberi penguatan', 'Memberi apresiasi']
      }),
      sx(PN, 'Refleksi', tRefleksi || 2, {
        d: 'Murid merefleksikan proses dan hasil belajar.',
        g: 'Murid menyadari pencapaian, kesulitan, dan perasaannya selama belajar.',
        t: 'Mengajukan pertanyaan refleksi\nMemberi kesempatan beberapa murid menjawab\nMenyampaikan umpan balik singkat',
        say: 'Bagian mana yang paling kalian sukai hari ini?\nApa yang masih terasa sulit?\nApa yang akan kalian lakukan agar lebih baik lagi?',
        s: 'Menjawab pertanyaan refleksi; menyebutkan kesulitan dan rencana perbaikan',
        i: 'Murid mengungkapkan refleksi dengan jujur dan jelas',
        c: ['Pertanyaan refleksi', 'Murid menjawab refleksi']
      }),
      sx(PN, 'Tindak Lanjut & Penutup', tTindak || 2, {
        d: 'Menyampaikan tindak lanjut, materi pertemuan berikutnya, dan menutup pembelajaran.',
        g: 'Murid mengetahui tugas/kegiatan lanjutan dan pembelajaran berakhir dengan tertib.',
        t: 'Menyampaikan tindak lanjut / tugas (bila ada)\nMenyampaikan materi pertemuan selanjutnya\nMengajak murid berdoa\nMengucapkan salam penutup',
        say: 'Untuk tindak lanjut, kalian [tugas/kegiatan lanjutan].\nPertemuan berikutnya kita akan belajar tentang [materi berikutnya].\nMari kita tutup dengan berdoa. Berdoa dimulai... selesai.\nSelamat pagi/siang dan sampai jumpa.',
        s: 'Menyimak tindak lanjut, berdoa, menjawab salam penutup',
        i: 'Pembelajaran ditutup tepat waktu dan tertib',
        n: 'Tutup dengan tenang, jangan terburu-buru. Pastikan kamera masih merekam sampai salam penutup.',
        c: ['Menyampaikan tindak lanjut', 'Menyampaikan materi pertemuan selanjutnya', 'Doa penutup', 'Salam penutup']
      })
    ];
  }

  /* ---------- 1. UKIN PPG Calon Guru ---------- */
  function tUKIN() {
    return opening(3, 2, 2).concat([
      sx(IN, 'Orientasi & Pemberian Stimulus', 3, {
        d: 'Mengorientasikan murid pada masalah/materi dan memberi stimulus awal.',
        g: 'Murid tertarik dan fokus pada masalah/materi inti.',
        t: 'Menampilkan stimulus (gambar, video singkat, benda nyata, cerita, atau masalah)\nMengajak murid mengamati stimulus\nMengajukan pertanyaan arahan',
        say: 'Coba perhatikan [media/gambar/benda] ini baik-baik.\nApa yang kalian amati? Apa yang ingin kalian ketahui?',
        s: 'Mengamati stimulus, menyampaikan hasil pengamatan dan pertanyaan',
        i: 'Murid terlibat dan mengajukan pertanyaan/dugaan', m: 'Media stimulus (gambar/video/benda nyata)',
        n: 'Pastikan media terlihat jelas oleh kamera dan murid.',
        c: ['Menampilkan stimulus', 'Murid mengamati', 'Pertanyaan arahan']
      }),
      sx(IN, 'Eksplorasi Materi', 4, {
        d: 'Guru memfasilitasi murid mengeksplorasi konsep/materi.',
        g: 'Murid memahami konsep inti materi.',
        t: 'Menjelaskan konsep inti secara runtut dan jelas\nMenggunakan contoh konkret\nMengecek pemahaman melalui pertanyaan singkat',
        say: 'Perhatikan penjelasan Ibu/Bapak. Konsep utamanya adalah [konsep].\nContohnya [contoh konkret].\nSudah paham sampai di sini? Siapa yang bisa mengulang?',
        s: 'Menyimak, mencatat, bertanya, dan menjawab pertanyaan guru',
        i: 'Murid dapat menjelaskan ulang konsep dengan bahasa sendiri', m: 'Slide / papan tulis / bahan ajar',
        c: ['Menjelaskan konsep inti', 'Memberi contoh konkret', 'Mengecek pemahaman']
      }),
      sx(IN, 'Demonstrasi / Pengamatan', 3, {
        d: 'Guru atau murid mendemonstrasikan/mengamati langkah kerja atau fenomena.',
        g: 'Murid memahami langkah atau prosedur melalui contoh nyata.',
        t: 'Mendemonstrasikan langkah kerja secara bertahap\nMemastikan semua murid dapat melihat\nMenanyakan hal yang diamati',
        say: 'Perhatikan demonstrasi berikut. Langkah pertama... langkah kedua...\nApa yang kalian lihat? Apa bedanya dengan tadi?',
        s: 'Mengamati demonstrasi dan mencatat hal penting',
        i: 'Murid menyebutkan langkah/ciri yang diamati', m: 'Alat demonstrasi / media'
      }),
      sx(IN, 'Diskusi Kelompok', 5, {
        d: 'Murid berdiskusi dalam kelompok untuk memecahkan tugas.',
        g: 'Murid berkolaborasi dan berpikir kritis memecahkan tugas.',
        t: 'Membagi kelompok dan membagikan LKPD\nMenjelaskan tugas dan batas waktu\nBerkeliling memantau dan membimbing kelompok',
        say: 'Silakan bergabung dengan kelompok masing-masing. Kalian punya waktu 5 menit.\nBacalah LKPD dan kerjakan bersama. Semua anggota harus berkontribusi.',
        s: 'Berdiskusi, membagi peran, mengerjakan LKPD bersama',
        i: 'Seluruh anggota kelompok berpartisipasi dan LKPD terisi', m: 'LKPD, alat tulis',
        n: 'Gunakan penghitung waktu. Beri bimbingan tanpa memberikan jawaban langsung.',
        c: ['Membagi kelompok', 'Membagikan LKPD', 'Menjelaskan tugas & waktu', 'Berkeliling membimbing']
      }),
      sx(IN, 'Praktik / Aktivitas & Pendampingan', 4, {
        d: 'Murid melakukan praktik/aktivitas dengan pendampingan guru.',
        g: 'Murid menerapkan konsep dalam aktivitas nyata.',
        t: 'Mengamati aktivitas murid\nMemberi bimbingan individual\nMemberi umpan balik langsung',
        say: 'Bagus, lanjutkan. Coba perbaiki bagian [..] seperti ini.\nAda yang mengalami kesulitan? Ayo kita bantu bersama.',
        s: 'Melakukan praktik/aktivitas dan meminta bantuan bila perlu',
        i: 'Murid melakukan aktivitas dengan benar', n: 'Catat murid yang perlu bantuan untuk umpan balik.'
      }),
      sx(IN, 'Presentasi / Demonstrasi Hasil', 3, {
        d: 'Perwakilan kelompok mempresentasikan atau mendemonstrasikan hasil.',
        g: 'Murid mampu mengomunikasikan hasil belajar.',
        t: 'Mempersilakan 1–2 kelompok tampil\nMengarahkan kelompok lain menyimak dan menanggapi\nMemberi apresiasi',
        say: 'Kelompok [..], silakan menyampaikan hasil diskusi kalian.\nKelompok lain, ada tanggapan atau pertanyaan?',
        s: 'Mempresentasikan hasil, menanggapi, dan mengajukan pertanyaan',
        i: 'Presentasi runtut, percaya diri, dan ditanggapi kelompok lain'
      }),
      sx(IN, 'Umpan Balik & Penguatan Pemahaman', 2, {
        d: 'Guru memberi umpan balik atas hasil kerja dan menguatkan pemahaman.',
        g: 'Murid memperbaiki pemahaman berdasarkan umpan balik.',
        t: 'Menyampaikan umpan balik positif dan perbaikan\nMeluruskan miskonsepsi\nMengaitkan hasil kelompok dengan konsep utama',
        say: 'Kerja kalian bagus, terutama pada bagian [..]. Yang perlu diperbaiki adalah [..].\nJadi, konsep yang benar adalah [..].',
        s: 'Menyimak umpan balik dan memperbaiki pemahaman',
        i: 'Murid memperbaiki jawaban/kinerja setelah umpan balik'
      }),
      sx(IN, 'Asesmen Formatif', 3, {
        d: 'Menilai ketercapaian tujuan pembelajaran secara cepat.',
        g: 'Guru mengetahui ketercapaian tujuan pembelajaran.',
        t: 'Memberikan 2–3 soal/tugas singkat atau pertanyaan lisan\nMengamati jawaban dan kinerja murid\nMencatat hasil pengamatan',
        say: 'Sekarang kerjakan soal singkat ini secara individu.\nIni bukan ujian, ibu/bapak ingin tahu sejauh mana pemahaman kalian.',
        s: 'Mengerjakan soal/tugas singkat secara mandiri',
        i: 'Mayoritas murid menjawab benar sesuai tujuan', m: 'Lembar soal / kartu jawaban',
        n: 'Sebutkan secara lisan bahwa ini asesmen formatif agar terlihat di video.'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 2. PJOK ---------- */
  function tPJOK() {
    return [
      sx(PD, 'Pendahuluan & Kesiapan Fisik', 3, {
        d: 'Membuka pembelajaran dan memastikan murid siap secara fisik.',
        g: 'Murid siap secara fisik dan area latihan aman.',
        t: 'Mengumpulkan murid, memberi salam dan berdoa\nMemeriksa kehadiran dan kondisi kesehatan murid\nMemeriksa pakaian/sepatu olahraga\nMemastikan lapangan dan alat aman',
        say: 'Selamat pagi, anak-anak. Baris yang rapi ya. Mari berdoa terlebih dahulu.\nAda yang sedang sakit atau cedera hari ini? Sudah minum dan memakai sepatu yang benar?',
        s: 'Berbaris rapi, berdoa, melaporkan kondisi kesehatan',
        i: 'Murid siap dan tertib', n: 'Cek area dari benda berbahaya sebelum mulai.', m: 'Peluit, daftar hadir',
        c: ['Salam & doa', 'Presensi', 'Cek kesehatan & pakaian', 'Cek keamanan area dan alat']
      }),
      sx(PD, 'Pemanasan', 5, {
        d: 'Pemanasan dinamis dan peregangan untuk mencegah cedera.',
        g: 'Tubuh siap bergerak; risiko cedera berkurang.',
        t: 'Memimpin pemanasan (jalan/jogging ringan, peregangan dinamis dari kepala ke kaki)\nMemberi contoh gerakan yang benar\nMenggunakan hitungan atau musik\nMengamati kualitas gerakan murid',
        say: 'Kita mulai pemanasan. Ikuti gerakan Ibu/Bapak, hitungan delapan.\nPeregangan leher... bahu... lengan... pinggang... lutut... pergelangan kaki.\nBagus, jaga tubuh tetap rileks.',
        s: 'Mengikuti pemanasan dengan benar dan bersemangat',
        i: 'Murid mengikuti pemanasan lengkap dengan gerakan benar', m: 'Musik / peluit',
        c: ['Pemanasan umum', 'Peregangan dinamis', 'Pemanasan khusus gerakan inti']
      }),
      sx(PD, 'Apersepsi & Penyampaian Tujuan', 3, {
        d: 'Mengaitkan pengalaman gerak murid dan menyampaikan tujuan.',
        g: 'Murid memahami keterampilan gerak yang akan dipelajari.',
        t: 'Mengajukan pertanyaan pemantik tentang pengalaman bermain/olahraga\nMenyampaikan tujuan pembelajaran dan manfaatnya\nMenjelaskan alur kegiatan dan aturan keselamatan',
        say: 'Siapa yang pernah bermain [permainan/olahraga terkait]? Bagian mana yang menurutmu sulit?\nHari ini tujuan kita: kalian dapat mempraktikkan [keterampilan gerak].\nIngat aturan keselamatan: dengarkan peluit, jaga jarak, jangan mendorong.',
        s: 'Menjawab pertanyaan, menyimak tujuan dan aturan keselamatan',
        i: 'Murid menyebutkan tujuan dan aturan keselamatan', n: 'Singkat dan jelas, murid sudah panas — jangan terlalu lama diam.',
        c: ['Pertanyaan pemantik', 'Tujuan & manfaat', 'Alur kegiatan', 'Aturan keselamatan']
      }),
      sx(IN, 'Demonstrasi / Pengamatan Teknik', 4, {
        d: 'Guru/murid model mendemonstrasikan teknik gerak; murid mengamati.',
        g: 'Murid memahami fase gerak (persiapan, pelaksanaan, akhir).',
        t: 'Mendemonstrasikan teknik gerak secara utuh lalu per bagian (lambat)\nMenjelaskan kata kunci gerakan\nMemastikan semua murid melihat\nMenunjuk murid model bila perlu',
        say: 'Perhatikan gerakan [teknik] ini. Fase persiapan: [..]. Fase pelaksanaan: [..]. Fase akhir: [..].\nSekarang perhatikan sekali lagi dengan lebih lambat.\nApa kata kunci gerakannya?',
        s: 'Mengamati, menyebutkan kata kunci gerakan, mencoba gerakan tanpa alat',
        i: 'Murid dapat menjelaskan fase gerak', m: 'Alat/bola/peralatan olahraga',
        c: ['Demonstrasi utuh', 'Demonstrasi per bagian', 'Kata kunci gerakan']
      }),
      sx(IN, 'Latihan Keterampilan', 6, {
        d: 'Murid berlatih keterampilan gerak secara individu/berpasangan.',
        g: 'Murid mampu melakukan keterampilan gerak dengan teknik yang benar.',
        t: 'Mengatur formasi dan jarak latihan\nMemberi instruksi latihan bertahap (mudah ke sulit)\nBerkeliling memberi koreksi dan umpan balik\nMemodifikasi tugas gerak sesuai kemampuan',
        say: 'Cari pasangan. Lakukan [gerakan] sebanyak [..] kali, lalu bergantian.\nBagus! Perhatikan posisi [..]. Coba lagi.\nYang sudah lancar, tantang diri dengan jarak/tempo yang lebih sulit.',
        s: 'Berlatih sungguh-sungguh, saling mengamati dan memberi masukan teman',
        i: 'Murid melakukan gerak dengan teknik yang benar secara konsisten', m: 'Bola/alat sesuai materi, cones',
        n: 'Berikan umpan balik spesifik (sebut nama murid).',
        c: ['Mengatur formasi & jarak', 'Instruksi bertahap', 'Koreksi gerak individu', 'Modifikasi tugas gerak']
      }),
      sx(IN, 'Aktivitas Kelompok', 6, {
        d: 'Murid menerapkan keterampilan dalam bentuk kerja sama kelompok.',
        g: 'Murid mampu bekerja sama dan menerapkan keterampilan dalam situasi kelompok.',
        t: 'Membagi kelompok yang seimbang\nMenjelaskan tugas dan aturan\nMemantau kerja sama dan sportivitas\nMemberi penguatan perilaku positif',
        say: 'Kita bentuk kelompok berisi [..] orang. Tugas kelompok: [..].\nIngat, semua anggota harus mendapat giliran. Saling menyemangati ya.',
        s: 'Bekerja sama dalam kelompok, bergantian, dan saling membantu',
        i: 'Kerja sama dan tanggung jawab kelompok terlihat', m: 'Rompi/penanda kelompok, alat'
      }),
      sx(IN, 'Permainan Sederhana', 5, {
        d: 'Permainan yang memodifikasi keterampilan agar menyenangkan.',
        g: 'Murid menerapkan keterampilan dalam permainan secara sportif dan menyenangkan.',
        t: 'Menjelaskan aturan permainan singkat\nMemimpin jalannya permainan\nMemastikan keselamatan dan sportivitas\nMemberi apresiasi',
        say: 'Sekarang kita bermain [nama permainan]. Aturannya: [..].\nSiap? Mulai! Tetap sportif dan jaga keselamatan.',
        s: 'Bermain sesuai aturan dengan senang dan sportif',
        i: 'Murid bermain sesuai aturan, sportif, dan senang', n: 'Hentikan segera bila ada risiko cedera.'
      }),
      sx(IN, 'Asesmen Keterampilan', 3, {
        d: 'Menilai kemampuan gerak murid menggunakan rubrik/observasi.',
        g: 'Guru memperoleh data ketercapaian keterampilan murid.',
        t: 'Memanggil beberapa murid (kelompok kecil) secara bergantian\nMengamati dan menilai dengan rubrik/daftar cek\nMencatat hasil',
        say: 'Sekarang beberapa teman akan melakukan [keterampilan] satu per satu. Yang lain menunggu dan menyemangati.\nIni untuk melihat sejauh mana kemajuan kalian.',
        s: 'Melakukan unjuk kerja secara bergantian dan menyemangati teman',
        i: 'Murid mencapai kriteria pada rubrik keterampilan', m: 'Rubrik/lembar observasi',
        n: 'Sebutkan bahwa ini asesmen keterampilan.'
      }),
      sx(PN, 'Pendinginan', 3, {
        d: 'Pendinginan untuk menurunkan denyut jantung dan peregangan statis.',
        g: 'Tubuh kembali ke kondisi normal; risiko cedera/nyeri berkurang.',
        t: 'Mengajak murid berjalan pelan dan mengatur napas\nMemimpin peregangan statis (tahan 10–15 detik)\nMengingatkan minum dan merapikan alat',
        say: 'Kita lakukan pendinginan. Berjalan pelan, tarik napas... buang napas.\nPeregangan statis, tahan sampai hitungan sepuluh.\nSetelah ini minum air dan rapikan peralatan.',
        s: 'Berjalan pelan, mengatur napas, melakukan peregangan statis',
        i: 'Murid mengikuti pendinginan dengan tenang', m: 'Musik tenang (opsional)',
        c: ['Jalan pelan & atur napas', 'Peregangan statis', 'Merapikan alat']
      }),
      sx(PN, 'Refleksi, Tindak Lanjut & Penutup', 2, {
        d: 'Refleksi, penguatan, tindak lanjut, doa dan salam.',
        g: 'Murid mengetahui capaian belajar dan tindak lanjut.',
        t: 'Mengajukan pertanyaan refleksi dan menyimpulkan bersama\nMemberi penguatan dan apresiasi\nMenyampaikan tindak lanjut dan materi berikutnya\nMengajak berdoa dan mengucap salam',
        say: 'Bagaimana perasaan kalian setelah berolahraga hari ini? Bagian mana yang masih sulit?\nKesimpulannya, [..]. Terima kasih, kalian hebat!\nPertemuan depan kita belajar [..]. Mari berdoa. Selamat pagi.',
        s: 'Menjawab refleksi, menyimpulkan, berdoa, memberi salam',
        i: 'Murid dapat menyebutkan manfaat dan kesulitan gerak', n: 'Tutup dengan apresiasi positif.',
        c: ['Refleksi', 'Simpulan', 'Tindak lanjut', 'Doa & salam']
      })
    ];
  }

  /* ---------- 3. PBL ---------- */
  function tPBL() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Orientasi Peserta Didik pada Masalah', 4, {
        d: 'Guru menyajikan masalah kontekstual dan memotivasi murid.',
        g: 'Murid memahami masalah yang harus dipecahkan.',
        t: 'Menyajikan masalah kontekstual (kasus, video, berita, gambar)\nMemotivasi murid agar terlibat dalam pemecahan masalah\nMengajukan pertanyaan agar murid merumuskan masalah',
        say: 'Perhatikan kasus berikut: [masalah kontekstual].\nMenurut kalian, apa masalah utamanya? Mengapa masalah ini penting untuk dipecahkan?',
        s: 'Mengamati masalah, merumuskan pertanyaan/masalah',
        i: 'Murid dapat menyatakan masalah dengan kalimat sendiri', m: 'Kasus/video/gambar masalah',
        c: ['Menyajikan masalah', 'Memotivasi', 'Murid merumuskan masalah']
      }),
      sx(IN, 'Mengorganisasikan Peserta Didik untuk Belajar', 4, {
        d: 'Membagi kelompok dan membagi tugas penyelidikan.',
        g: 'Murid siap menyelidiki dengan pembagian peran jelas.',
        t: 'Membentuk kelompok heterogen\nMembagikan LKPD dan sumber belajar\nMenjelaskan tugas, peran, dan batas waktu\nMembantu merencanakan langkah penyelidikan',
        say: 'Bergabunglah dengan kelompok. Bagi peran: ketua, pencatat, penyaji, pengatur waktu.\nLKPD ini berisi masalah dan langkah kerjanya. Waktu kalian [..] menit.',
        s: 'Membentuk kelompok, membagi peran, membaca LKPD, merencanakan langkah',
        i: 'Kelompok terbentuk tertib dan rencana kerja disusun', m: 'LKPD, sumber belajar',
        c: ['Membentuk kelompok', 'Membagi peran', 'Membagikan LKPD', 'Menjelaskan tugas & waktu']
      }),
      sx(IN, 'Membimbing Penyelidikan Individu/Kelompok', 8, {
        d: 'Murid mengumpulkan informasi dan mencari solusi dengan bimbingan guru.',
        g: 'Murid menemukan alternatif solusi berdasarkan data/informasi.',
        t: 'Berkeliling ke tiap kelompok\nMengajukan pertanyaan penuntun (scaffolding)\nMendorong murid mengumpulkan data/informasi yang relevan\nMemastikan semua anggota terlibat',
        say: 'Informasi apa yang sudah kalian temukan? Apakah cukup untuk menjawab masalah?\nAdakah cara lain untuk memecahkan masalah ini?\nIngat, catat semua temuan di LKPD.',
        s: 'Mengumpulkan dan menganalisis data, berdiskusi, merumuskan solusi',
        i: 'Kelompok menghasilkan solusi disertai alasan/bukti', n: 'Pantau waktu; beri bimbingan, bukan jawaban.'
      }),
      sx(IN, 'Mengembangkan & Menyajikan Hasil Karya', 6, {
        d: 'Kelompok menyusun dan mempresentasikan solusi.',
        g: 'Murid mampu mengomunikasikan solusi dengan jelas.',
        t: 'Membantu kelompok menyusun laporan/karya\nMempersilakan beberapa kelompok mempresentasikan\nMengarahkan kelompok lain menanggapi',
        say: 'Silakan kelompok [..] mempresentasikan solusi kalian.\nKelompok lain, apakah solusi tersebut masuk akal? Mengapa?',
        s: 'Menyusun laporan/karya, mempresentasikan, menanggapi',
        i: 'Presentasi jelas dan solusi relevan dengan masalah'
      }),
      sx(IN, 'Menganalisis & Mengevaluasi Proses Pemecahan Masalah', 4, {
        d: 'Murid dan guru mengevaluasi proses dan hasil pemecahan masalah.',
        g: 'Murid memahami solusi terbaik dan proses berpikir yang dilakukan.',
        t: 'Mengajak murid membandingkan berbagai solusi\nMemberi umpan balik dan penguatan konsep\nMelakukan asesmen formatif singkat',
        say: 'Dari semua solusi tadi, mana yang paling tepat? Mengapa?\nBagaimana proses berpikir kalian? Apa yang akan diperbaiki?',
        s: 'Membandingkan solusi, merefleksikan proses, menjawab asesmen singkat',
        i: 'Murid mengevaluasi solusi dengan alasan logis'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 4. PjBL ---------- */
  function tPjBL() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Penentuan Pertanyaan Mendasar', 3, {
        d: 'Guru memberi pertanyaan mendasar yang memandu proyek.',
        g: 'Murid memahami tujuan dan fokus proyek.',
        t: 'Menyajikan fenomena/pertanyaan mendasar\nMengajak murid mengidentifikasi proyek yang dapat menjawabnya',
        say: 'Pertanyaan besar kita: [pertanyaan mendasar]. Proyek apa yang dapat membantu kita menjawabnya?',
        s: 'Mengajukan ide dan memahami proyek', i: 'Murid memahami pertanyaan mendasar'
      }),
      sx(IN, 'Mendesain Perencanaan Proyek', 4, {
        d: 'Murid merencanakan proyek (alat, bahan, langkah, peran).',
        g: 'Murid memiliki rencana proyek yang jelas.',
        t: 'Membagi kelompok dan membagikan panduan proyek\nMembimbing penyusunan rancangan proyek\nMemeriksa kelayakan rencana',
        say: 'Rancanglah proyek kalian: apa yang dibuat, bahan apa, siapa mengerjakan apa.\nTunjukkan rencananya pada Ibu/Bapak sebelum mulai.',
        s: 'Menyusun rencana, membagi peran, menyiapkan alat dan bahan', i: 'Rencana proyek terdokumentasi', m: 'Lembar perencanaan proyek'
      }),
      sx(IN, 'Menyusun Jadwal Pelaksanaan', 3, {
        d: 'Menyepakati jadwal dan tahapan penyelesaian proyek.',
        g: 'Murid mampu mengatur waktu penyelesaian proyek.',
        t: 'Membimbing penyusunan jadwal dan batas akhir\nMengingatkan penentuan prioritas tugas',
        say: 'Susunlah jadwal pengerjaan: apa yang dikerjakan lebih dulu, kapan selesai?',
        s: 'Menyusun jadwal kegiatan dan batas waktu', i: 'Jadwal realistis dan disepakati'
      }),
      sx(IN, 'Memonitor Pelaksanaan & Kemajuan Proyek', 8, {
        d: 'Murid mengerjakan proyek; guru memonitor dan membimbing.',
        g: 'Proyek berjalan sesuai rencana dan kolaborasi terjaga.',
        t: 'Berkeliling memonitor kemajuan\nMemberi umpan balik dan bimbingan\nMengingatkan jadwal dan keselamatan kerja\nMencatat perkembangan dengan lembar observasi',
        say: 'Sudah sampai tahap mana proyek kalian? Apa kendalanya?\nBagus, pertahankan. Perhatikan bagian [..].',
        s: 'Mengerjakan proyek, berkolaborasi, mengatasi kendala', i: 'Proyek berjalan sesuai rencana', m: 'Alat/bahan proyek, lembar monitoring'
      }),
      sx(IN, 'Menguji Hasil / Presentasi Produk', 5, {
        d: 'Kelompok mempresentasikan dan menguji hasil proyek.',
        g: 'Murid mampu mengomunikasikan dan menguji produk.',
        t: 'Mempersilakan kelompok mempresentasikan/mendemonstrasikan produk\nMenilai dengan rubrik\nMendorong tanggapan kelompok lain',
        say: 'Silakan tampilkan hasil proyek kalian dan jelaskan bagaimana membuatnya.\nApakah produk ini menjawab pertanyaan mendasar?',
        s: 'Mempresentasikan produk, menjawab pertanyaan', i: 'Produk memenuhi kriteria rubrik', m: 'Rubrik penilaian produk'
      }),
      sx(IN, 'Mengevaluasi Pengalaman', 3, {
        d: 'Refleksi proses dan hasil proyek.',
        g: 'Murid menyadari pembelajaran dari proses proyek.',
        t: 'Mengajak refleksi proses\nMemberi umpan balik dan penguatan',
        say: 'Apa pelajaran terpenting dari proyek ini? Apa yang bisa diperbaiki lain kali?',
        s: 'Merefleksikan proses kerja dan hasil', i: 'Murid menyebutkan pelajaran dan perbaikan'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 5. Discovery Learning ---------- */
  function tDiscovery() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Stimulation (Pemberian Rangsangan)', 3, {
        d: 'Guru memberikan rangsangan agar murid ingin tahu.',
        g: 'Murid termotivasi dan memiliki rasa ingin tahu.',
        t: 'Menampilkan fenomena/gambar/demonstrasi yang memunculkan pertanyaan\nTidak langsung menjelaskan konsep',
        say: 'Perhatikan baik-baik. Apa yang kalian lihat? Apa yang menarik perhatian kalian?',
        s: 'Mengamati dan mengungkapkan rasa ingin tahu', i: 'Murid mengajukan pertanyaan', m: 'Media rangsangan'
      }),
      sx(IN, 'Problem Statement (Identifikasi Masalah)', 3, {
        d: 'Murid merumuskan masalah dan hipotesis.',
        g: 'Murid dapat merumuskan masalah dan dugaan sementara.',
        t: 'Membimbing murid merumuskan pertanyaan masalah\nMengarahkan murid membuat hipotesis',
        say: 'Dari pengamatan tadi, apa pertanyaan yang ingin kita jawab?\nApa dugaan sementara kalian?',
        s: 'Merumuskan masalah dan hipotesis', i: 'Rumusan masalah dan hipotesis jelas'
      }),
      sx(IN, 'Data Collection (Pengumpulan Data)', 6, {
        d: 'Murid mengumpulkan data melalui pengamatan/percobaan/membaca.',
        g: 'Murid memperoleh data yang relevan.',
        t: 'Membagikan LKPD/alat percobaan\nMembimbing pengumpulan data\nMemastikan pencatatan data tertib',
        say: 'Lakukan langkah-langkah pada LKPD, catat semua data dengan teliti.',
        s: 'Melakukan percobaan/pengamatan dan mencatat data', i: 'Data tercatat lengkap dan benar', m: 'LKPD, alat percobaan'
      }),
      sx(IN, 'Data Processing (Pengolahan Data)', 5, {
        d: 'Murid mengolah dan menganalisis data.',
        g: 'Murid mengolah data menjadi informasi bermakna.',
        t: 'Membimbing pengolahan (tabel/grafik/klasifikasi)\nMengajukan pertanyaan penuntun',
        say: 'Apa pola yang terlihat dari data kalian? Bagaimana cara menyajikannya?',
        s: 'Mengolah data, mencari pola', i: 'Pola/hasil olahan data benar'
      }),
      sx(IN, 'Verification (Pembuktian)', 4, {
        d: 'Murid memeriksa hipotesis berdasarkan hasil pengolahan data.',
        g: 'Murid mampu membuktikan atau merevisi hipotesis.',
        t: 'Meminta kelompok memaparkan hasil\nMembandingkan hasil dengan hipotesis awal',
        say: 'Apakah dugaan awal kalian terbukti? Apa buktinya?',
        s: 'Memverifikasi hipotesis dan mempresentasikan hasil', i: 'Kesimpulan didukung data'
      }),
      sx(IN, 'Generalization (Menarik Simpulan)', 3, {
        d: 'Murid menarik simpulan umum dari temuan.',
        g: 'Murid menyimpulkan konsep secara mandiri.',
        t: 'Membimbing murid menyusun generalisasi\nMemberi penguatan konsep',
        say: 'Jadi, apa yang bisa kita simpulkan secara umum dari penemuan hari ini?',
        s: 'Menyusun simpulan dan menerapkan pada contoh lain', i: 'Simpulan benar dan umum'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 6. Cooperative Learning ---------- */
  function tCooperative() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Menyajikan Informasi', 5, {
        d: 'Guru menyajikan informasi/konsep kunci kepada murid.',
        g: 'Murid memiliki pemahaman dasar untuk bekerja dalam kelompok.',
        t: 'Menyajikan materi secara ringkas dan jelas\nMemberi contoh\nMengecek pemahaman singkat',
        say: 'Perhatikan penjelasan berikut sebelum bekerja dalam kelompok. Konsep utamanya [..].',
        s: 'Menyimak dan bertanya', i: 'Murid memahami informasi dasar', m: 'Slide/papan tulis'
      }),
      sx(IN, 'Mengorganisasikan Murid ke dalam Kelompok', 3, {
        d: 'Membentuk kelompok belajar heterogen.',
        g: 'Kelompok terbentuk dengan peran jelas.',
        t: 'Membagi kelompok heterogen (3–5 murid)\nMenetapkan peran (ketua, pencatat, juru bicara, pengatur waktu)\nMenjelaskan aturan kerja sama',
        say: 'Kita bentuk kelompok. Setiap anggota punya peran dan tanggung jawab.\nIngat: sukses kelompok adalah sukses bersama.',
        s: 'Bergabung dengan kelompok dan membagi peran', i: 'Kelompok terbentuk cepat dan tertib', c: ['Membentuk kelompok', 'Membagi peran', 'Aturan kerja sama']
      }),
      sx(IN, 'Membimbing Kelompok Bekerja & Belajar', 8, {
        d: 'Murid mengerjakan tugas kelompok; guru membimbing.',
        g: 'Murid saling membantu menguasai materi.',
        t: 'Membagikan LKPD\nBerkeliling memantau kerja sama dan interaksi\nMemberi bantuan seperlunya',
        say: 'Kerjakan bersama, pastikan semua anggota memahami jawabannya.\nJika ada yang belum paham, teman satu kelompok membantu dulu.',
        s: 'Bekerja sama, berdiskusi, saling membantu', i: 'Seluruh anggota aktif dan LKPD selesai', m: 'LKPD'
      }),
      sx(IN, 'Presentasi / Evaluasi Hasil Belajar', 5, {
        d: 'Kelompok mempresentasikan hasil; guru mengevaluasi.',
        g: 'Murid dapat mengomunikasikan hasil dan guru mengetahui ketercapaian.',
        t: 'Meminta kelompok menyampaikan hasil\nMemberi umpan balik\nMemberi kuis singkat individu bila perlu',
        say: 'Kelompok [..], silakan presentasi. Kelompok lain, siapkan pertanyaan.',
        s: 'Mempresentasikan, menanggapi, mengerjakan kuis', i: 'Hasil benar dan komunikatif'
      }),
      sx(IN, 'Memberikan Penghargaan', 2, {
        d: 'Memberi penghargaan atas usaha dan hasil individu/kelompok.',
        g: 'Murid termotivasi dan menghargai kerja sama.',
        t: 'Mengumumkan kelompok terbaik/kemajuan terbaik\nMemberi apresiasi pada proses, bukan hanya hasil',
        say: 'Kelompok [..] bekerja sama dengan sangat baik. Beri tepuk tangan!',
        s: 'Menerima dan memberi apresiasi', i: 'Murid merasa dihargai'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 7. Berdiferensiasi ---------- */
  function tDiff() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Pemetaan Kebutuhan / Asesmen Diagnostik', 3, {
        d: 'Memetakan kesiapan, minat, dan profil belajar murid.',
        g: 'Guru mengetahui kebutuhan belajar murid.',
        t: 'Mengajukan pertanyaan/kuis singkat awal\nMengamati respons murid\nMengelompokkan murid berdasarkan kesiapan/minat',
        say: 'Sebelum mulai, jawab pertanyaan singkat ini. Tidak ada jawaban salah, Ibu/Bapak ingin tahu kebutuhan belajar kalian.',
        s: 'Menjawab asesmen awal', i: 'Data kesiapan/minat murid terkumpul', m: 'Kartu diagnostik'
      }),
      sx(IN, 'Penyampaian Konten (Diferensiasi Konten)', 5, {
        d: 'Menyampaikan konten dalam beragam cara (visual, auditori, kinestetik).',
        g: 'Murid memahami konten sesuai gaya belajarnya.',
        t: 'Menyajikan materi dengan beberapa modalitas\nMenyediakan bahan bacaan berjenjang',
        say: 'Materi ini bisa kalian pelajari lewat gambar, penjelasan lisan, atau praktik langsung.',
        s: 'Memilih/menyimak cara belajar yang sesuai', i: 'Murid memahami konsep dasar', m: 'Media multimodal'
      }),
      sx(IN, 'Aktivitas Berdiferensiasi (Proses)', 10, {
        d: 'Murid mengerjakan tugas sesuai kesiapan/minat dalam kelompok berbeda.',
        g: 'Setiap murid mendapat tantangan sesuai kemampuan.',
        t: 'Membagikan tugas berjenjang (dasar, menengah, lanjut)\nBerkeliling dan memberi bimbingan berbeda tiap kelompok\nMenyediakan scaffolding untuk yang membutuhkan',
        say: 'Setiap kelompok punya tugas berbeda sesuai kebutuhan. Kerjakan dan tanyakan bila perlu.',
        s: 'Mengerjakan tugas sesuai tingkat kesiapan', i: 'Murid mengerjakan tugas sesuai levelnya dengan sukses', m: 'LKPD berjenjang'
      }),
      sx(IN, 'Produk Berdiferensiasi / Presentasi', 6, {
        d: 'Murid menunjukkan pemahaman melalui produk pilihan.',
        g: 'Murid menunjukkan pemahaman dengan cara yang disukainya.',
        t: 'Memberi pilihan produk (poster, lisan, tulisan, demonstrasi)\nMemfasilitasi presentasi\nMenilai dengan rubrik yang sama pada kriteria inti',
        say: 'Tunjukkan pemahaman kalian dengan cara yang kalian pilih.',
        s: 'Membuat dan menampilkan produk', i: 'Produk menunjukkan ketercapaian tujuan', m: 'Rubrik'
      }),
      sx(IN, 'Umpan Balik & Asesmen Formatif', 3, {
        d: 'Memberi umpan balik personal.',
        g: 'Murid mengetahui kekuatan dan area perbaikan.',
        t: 'Memberi umpan balik personal singkat\nMelakukan cek pemahaman akhir',
        say: 'Kekuatan kalian ada pada [..]. Tantangan berikutnya adalah [..].',
        s: 'Menerima umpan balik, memperbaiki', i: 'Murid menindaklanjuti umpan balik'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 8. Deep Learning ---------- */
  function tDeep() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Memahami (Pengalaman Belajar Bermakna)', 8, {
        d: 'Murid membangun pemahaman konsep secara berkesadaran dan bermakna.',
        g: 'Murid memahami konsep dan mengaitkannya dengan kehidupan nyata.',
        t: 'Menyajikan konteks nyata dan pertanyaan esensial\nMemfasilitasi eksplorasi konsep (mindful, meaningful)\nMendorong murid bertanya dan menghubungkan konsep',
        say: 'Mengapa hal ini penting dalam kehidupan kalian? Apa yang ingin kalian ketahui lebih jauh?\nCoba hubungkan dengan pengalaman kalian.',
        s: 'Mengeksplorasi, bertanya, mengaitkan dengan pengalaman', i: 'Murid menjelaskan konsep bermakna', m: 'Sumber belajar kontekstual',
        n: 'Prinsip: berkesadaran, bermakna, menggembirakan (joyful).'
      }),
      sx(IN, 'Mengaplikasi (Tugas Otentik & Kolaborasi)', 12, {
        d: 'Murid menerapkan pemahaman pada tugas otentik secara kolaboratif.',
        g: 'Murid mampu menerapkan konsep untuk memecahkan masalah nyata.',
        t: 'Memberikan tugas otentik\nMemfasilitasi kolaborasi dan komunikasi\nMemberi umpan balik formatif sepanjang proses',
        say: 'Gunakan pemahaman kalian untuk memecahkan masalah ini bersama kelompok.\nBagaimana kalian memastikan solusi ini bermanfaat?',
        s: 'Berkolaborasi, mencoba, memperbaiki solusi', i: 'Solusi/produk menunjukkan penerapan konsep', m: 'LKPD, bahan tugas otentik'
      }),
      sx(IN, 'Menyajikan & Berbagi Hasil', 5, {
        d: 'Murid menyajikan hasil kepada teman.',
        g: 'Murid mampu mengomunikasikan gagasan dan menerima masukan.',
        t: 'Memfasilitasi presentasi\nMengarahkan umpan balik teman sebaya', say: 'Ceritakan proses dan hasil kalian. Teman lain, beri masukan yang membangun.',
        s: 'Mempresentasikan dan memberi/menerima umpan balik', i: 'Komunikasi jelas dan umpan balik konstruktif'
      }),
      sx(IN, 'Merefleksi (Refleksi Mendalam)', 3, {
        d: 'Murid merefleksikan proses berpikir dan perasaan belajar.',
        g: 'Murid sadar terhadap proses belajarnya.',
        t: 'Mengajukan pertanyaan refleksi mendalam\nMenanggapi dengan empati',
        say: 'Apa yang kalian pelajari tentang diri sendiri? Apa yang akan kalian lakukan berbeda?',
        s: 'Merefleksikan proses belajar', i: 'Refleksi menunjukkan kesadaran belajar'
      })
    ], closing(2, 2, 2));
  }

  /* ---------- 9. Microteaching ---------- */
  function tMicro() {
    return [
      sx(PD, 'Membuka Pelajaran', 2, {
        d: 'Salam, sapa, dan kondisikan murid.', g: 'Murid siap belajar.',
        t: 'Salam dan sapa\nBerdoa singkat\nMenyampaikan tujuan', say: 'Selamat pagi, anak-anak. Hari ini kita akan belajar [..]. Tujuannya agar kalian dapat [..].',
        s: 'Menjawab salam dan menyimak', i: 'Pembukaan singkat dan jelas', n: 'Fokus pada keterampilan membuka pelajaran.'
      }),
      sx(PD, 'Apersepsi', 1.5, {
        d: 'Menghubungkan materi dengan pengalaman.', g: 'Murid tertarik.',
        t: 'Mengajukan satu pertanyaan pemantik', say: 'Pernahkah kalian [..]? Apa yang kalian rasakan?',
        s: 'Menjawab pertanyaan', i: 'Murid merespons'
      }),
      sx(IN, 'Penyajian Materi Inti', 5, {
        d: 'Menjelaskan satu konsep inti dengan contoh.', g: 'Murid memahami konsep inti.',
        t: 'Menjelaskan runtut\nMemberi contoh konkret\nMenggunakan media\nMengecek pemahaman', say: 'Perhatikan. Konsep utamanya [..]. Contohnya [..]. Apakah sudah jelas?',
        s: 'Menyimak dan bertanya', i: 'Murid menjelaskan ulang', m: 'Media sederhana', n: 'Fokus pada keterampilan menjelaskan dan bertanya.'
      }),
      sx(IN, 'Aktivitas / Latihan Singkat', 3, {
        d: 'Murid mencoba menerapkan konsep.', g: 'Murid menerapkan konsep.',
        t: 'Memberi tugas singkat\nMemantau dan membimbing', say: 'Sekarang coba kerjakan [tugas] ini selama tiga menit.',
        s: 'Mengerjakan tugas', i: 'Tugas dikerjakan benar'
      }),
      sx(IN, 'Penguatan & Penilaian', 1.5, {
        d: 'Memberi umpan balik dan menilai cepat.', g: 'Murid mengetahui ketercapaian.',
        t: 'Memberi umpan balik\nMemberi satu pertanyaan penilaian', say: 'Bagus. Satu pertanyaan terakhir: [..].',
        s: 'Menjawab pertanyaan penilaian', i: 'Jawaban murid benar'
      }),
      sx(PN, 'Menutup Pelajaran', 2, {
        d: 'Menyimpulkan dan menutup.', g: 'Pembelajaran berakhir rapi.',
        t: 'Menyimpulkan bersama\nRefleksi singkat\nSalam penutup', say: 'Apa yang kita pelajari hari ini? Terima kasih dan sampai jumpa.',
        s: 'Menyimpulkan dan menjawab salam', i: 'Simpulan benar'
      })
    ];
  }

  /* ---------- 10. Umum ---------- */
  function tUmum() {
    return opening(3, 3, 2).concat([
      sx(IN, 'Penyampaian & Eksplorasi Materi', 8, {
        d: 'Guru menyampaikan materi dan murid mengeksplorasi.', g: 'Murid memahami materi.',
        t: 'Menjelaskan materi dengan jelas dan runtut\nMenggunakan media dan contoh\nMengajukan pertanyaan pemahaman',
        say: 'Perhatikan penjelasan berikut. Konsep pentingnya adalah [..]. Contohnya [..].',
        s: 'Menyimak, mencatat, bertanya', i: 'Murid memahami konsep', m: 'Slide/papan tulis'
      }),
      sx(IN, 'Latihan / Aktivitas Murid', 10, {
        d: 'Murid melakukan latihan atau aktivitas belajar.', g: 'Murid menerapkan materi.',
        t: 'Membagikan tugas/LKPD\nBerkeliling membimbing\nMemberi umpan balik', say: 'Kerjakan tugas berikut. Waktu kalian [..] menit.',
        s: 'Mengerjakan latihan/aktivitas', i: 'Latihan dikerjakan benar', m: 'LKPD/lembar latihan'
      }),
      sx(IN, 'Diskusi / Presentasi', 6, {
        d: 'Murid mempresentasikan atau mendiskusikan hasil.', g: 'Murid mampu mengomunikasikan hasil.',
        t: 'Memfasilitasi diskusi\nMemberi penguatan', say: 'Siapa yang ingin menyampaikan hasilnya? Yang lain, tanggapi.',
        s: 'Presentasi dan menanggapi', i: 'Komunikasi jelas'
      }),
      sx(IN, 'Asesmen', 4, {
        d: 'Menilai ketercapaian pembelajaran.', g: 'Guru mengetahui ketercapaian.',
        t: 'Memberikan soal/tugas penilaian singkat\nMencatat hasil', say: 'Kerjakan soal singkat ini secara mandiri.',
        s: 'Mengerjakan asesmen', i: 'Mayoritas murid mencapai tujuan'
      })
    ], closing(2, 2, 2));
  }

  var DEFS = [
    { id: 'tpl-ukin', name: 'Template UKIN PPG Calon Guru', model: 'Umum / sesuai RPP', desc: 'Alur lengkap pendahuluan–inti–penutup untuk take video UKIN PPG Calon Guru.', build: tUKIN },
    { id: 'tpl-pjok', name: 'Template Pembelajaran PJOK', model: 'Pembelajaran PJOK', desc: 'Kesiapan fisik, pemanasan, latihan, permainan, asesmen, pendinginan, refleksi.', build: tPJOK },
    { id: 'tpl-pbl', name: 'Template Problem Based Learning (PBL)', model: 'Problem Based Learning (PBL)', desc: 'Lima sintaks PBL dengan pendahuluan dan penutup.', build: tPBL },
    { id: 'tpl-pjbl', name: 'Template Project Based Learning (PjBL)', model: 'Project Based Learning (PjBL)', desc: 'Enam sintaks PjBL: pertanyaan mendasar hingga evaluasi pengalaman.', build: tPjBL },
    { id: 'tpl-discovery', name: 'Template Discovery Learning', model: 'Discovery Learning', desc: 'Stimulation, problem statement, data collection, processing, verification, generalization.', build: tDiscovery },
    { id: 'tpl-coop', name: 'Template Cooperative Learning', model: 'Cooperative Learning', desc: 'Informasi, pembentukan kelompok, bimbingan, presentasi, penghargaan.', build: tCooperative },
    { id: 'tpl-diff', name: 'Template Pembelajaran Berdiferensiasi', model: 'Pembelajaran Berdiferensiasi', desc: 'Diferensiasi konten, proses, dan produk berdasarkan kebutuhan murid.', build: tDiff },
    { id: 'tpl-deep', name: 'Template Pembelajaran Mendalam (Deep Learning)', model: 'Pembelajaran Mendalam', desc: 'Memahami, mengaplikasi, merefleksi: berkesadaran, bermakna, menggembirakan.', build: tDeep },
    { id: 'tpl-micro', name: 'Template Microteaching', model: 'Microteaching', desc: 'Skenario singkat 15 menit untuk latihan keterampilan dasar mengajar.', build: tMicro },
    { id: 'tpl-umum', name: 'Template Pembelajaran Umum', model: 'Umum', desc: 'Kerangka sederhana yang mudah disesuaikan untuk pembelajaran apa pun.', build: tUmum }
  ];

  root.UkinTemplates = {
    /* daftar ringkas */
    list: function () {
      return DEFS.map(function (d) {
        var sy = d.build();
        var total = sy.reduce(function (a, s) { return a + s.durationSec; }, 0);
        return { id: d.id, name: d.name, model: d.model, desc: d.desc, builtin: true, count: sy.length, totalSec: total };
      });
    },
    /* template lengkap (syntaxes baru tiap pemanggilan) */
    get: function (id) {
      for (var i = 0; i < DEFS.length; i++) {
        if (DEFS[i].id === id) {
          var sy = DEFS[i].build();
          return {
            id: DEFS[i].id, name: DEFS[i].name, model: DEFS[i].model, desc: DEFS[i].desc, builtin: true,
            syntaxes: sy, totalSec: sy.reduce(function (a, s) { return a + s.durationSec; }, 0)
          };
        }
      }
      return null;
    }
  };
})(typeof self !== 'undefined' ? self : this);
