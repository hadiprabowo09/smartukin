/* ==========================================================================
   SMART UKIN TIMER — pages-data.js
   Riwayat Kegiatan, Rekap Waktu, Backup dan Restore, Pengaturan Aplikasi.
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App, UI = root.UkinUI, Store = root.UkinStore, Audio = root.UkinAudio, PDF = root.UkinPDF;
  var h = UI.h, icon = UI.icon, S = App.session;
  var STATUS = { done: 'Selesai', skipped: 'Dilewati', pending: 'Belum' };

  /* ---------- CSV ---------- */
  function csvCell(v, d) { v = String(v == null ? '' : v); return (v.indexOf(d) >= 0 || /["\n\r]/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function reportCsv(rep, d) {
    var rows = [['No', 'Sintaks', 'Tahap', 'Rencana (detik)', 'Aktual (detik)', 'Selisih (detik)', 'Status', 'Melebihi waktu']];
    rep.rows.forEach(function (r, i) {
      var act = Math.round(r.actualMs / 1000), diff = r.status === 'skipped' ? '' : act - r.plannedSec;
      rows.push([i + 1, r.name, r.phase, r.plannedSec, r.status === 'skipped' ? '' : act, diff, STATUS[r.status] || r.status, r.over && r.status !== 'skipped' ? 'Ya' : 'Tidak']);
    });
    rows.push([]);
    rows.push(['Judul', rep.title]); rows.push(['Mata pelajaran', rep.subject]); rows.push(['Kelas', rep.grade]); rows.push(['Model', rep.model]);
    rows.push(['Mulai', rep.startedAt ? new Date(rep.startedAt).toLocaleString('id-ID') : '']);
    rows.push(['Total direncanakan (detik)', Math.round(rep.plannedMs / 1000)]); rows.push(['Total aktual (detik)', Math.round(rep.actualMs / 1000)]);
    rows.push(['Selisih total (detik)', Math.round(rep.diffMs / 1000)]);
    rows.push(['Sintaks selesai', rep.counts.done]); rows.push(['Sintaks dilewati', rep.counts.skipped]); rows.push(['Sintaks melebihi waktu', rep.counts.over]);
    rows.push(['Ketepatan waktu sintaks (%)', rep.accuracySyntax]); rows.push(['Ketepatan waktu total (%)', rep.accuracyTotal]);
    return '﻿' + rows.map(function (r) { return r.map(function (c) { return csvCell(c, d); }).join(d); }).join('\r\n');
  }
  function exportCsv(rep, d) { UI.download('rekap-' + UI.safeName(rep.title) + '.csv', reportCsv(rep, d), 'text/csv;charset=utf-8'); }
  function exportPdf(rep) { UI.download('rekap-' + UI.safeName(rep.title) + '.pdf', PDF.buildReport(rep), 'application/pdf'); }
  function accClass(v) { return v >= 90 ? 'ok' : v >= 70 ? 'warn' : 'danger'; }

  /* ======================================================================
     RIWAYAT
     ====================================================================== */
  var hist = { title: 'Riwayat Kegiatan' };
  hist.render = function (view) {
    function draw() {
      UI.clear(view);
      var items = Store.history();
      view.appendChild(h('div', { class: 'card-head page-head' }, h('p', { class: 'muted' }, 'Setiap kegiatan yang diselesaikan di Live Timer tersimpan otomatis di perangkat ini.'),
        items.length ? h('button', { class: 'btn danger-o', onClick: function () {
          UI.confirm('Hapus SEMUA riwayat kegiatan?', { danger: true, ok: 'Hapus semua' }).then(function (ok) { if (ok) { Store.clearHistory(); draw(); } });
        } }, icon('trash', 16), 'Hapus semua') : null));
      if (!items.length) { view.appendChild(h('section', { class: 'card empty' }, h('h2', null, 'Belum ada riwayat'), h('p', null, 'Selesaikan satu kegiatan di Live Timer untuk melihat rekapnya di sini.'), h('a', { class: 'btn primary', href: '#/live' }, 'Buka Live Timer'))); return; }
      var list = h('div', { class: 'hist-list' });
      items.forEach(function (r) {
        list.appendChild(h('div', { class: 'card hist-row' },
          h('div', { class: 'hr-main' }, h('div', { class: 'pr-title' }, r.title), h('div', { class: 'pr-meta' }, UI.fmtDateTime(r.startedAt || r.savedAt) + ' · ' + [r.subject, r.grade].filter(Boolean).join(' · '))),
          h('div', { class: 'hr-nums' }, h('div', null, h('small', null, 'Rencana'), h('b', null, UI.fmtSecs(r.plannedMs / 1000))), h('div', null, h('small', null, 'Aktual'), h('b', null, UI.fmtSecs(r.actualMs / 1000))),
            h('div', null, h('small', null, 'Selisih'), h('b', null, UI.fmtSigned(r.diffMs))), h('div', null, h('small', null, 'Ketepatan'), h('b', { class: accClass(r.accuracySyntax) }, r.accuracySyntax + '%'))),
          h('div', { class: 'pr-actions' },
            h('button', { class: 'btn sm primary', onClick: function () { App.go('report', { id: r.id }); } }, 'Lihat rekap'),
            h('button', { class: 'btn sm', title: 'Ekspor CSV', onClick: function () { exportCsv(r, ','); } }, 'CSV'),
            h('button', { class: 'btn sm', title: 'Ekspor PDF', onClick: function () { exportPdf(r); } }, 'PDF'),
            h('button', { class: 'btn sm danger-o', 'aria-label': 'Hapus', onClick: function () { Store.deleteHistory(r.id); draw(); } }, icon('trash', 16)))));
      });
      view.appendChild(list);
    }
    draw();
  };
  App.pages.history = hist;

  /* ======================================================================
     REKAP
     ====================================================================== */
  var rp = { title: 'Rekap Waktu' };
  rp.render = function (view, params) {
    var rep = params.id ? Store.getHistory(params.id) : null;
    if (!rep && !params.id) rep = Store.history()[0] || null;
    if (!rep) { view.appendChild(h('section', { class: 'card empty' }, h('h2', null, 'Belum ada rekap'), h('p', null, 'Rekap muncul setelah kegiatan diselesaikan di Live Timer.'), h('a', { class: 'btn primary', href: '#/live' }, 'Buka Live Timer'))); return; }
    var stat = function (label, val, cls) { return h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, label), h('div', { class: 'stat-val ' + (cls || '') }, val)); };
    view.appendChild(h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('div', null, h('h2', null, rep.title), h('p', { class: 'muted' }, [rep.subject, rep.grade, rep.model].filter(Boolean).join(' · ') + (rep.startedAt ? ' — ' + UI.fmtDateTime(rep.startedAt) : ''))),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onClick: function () { exportPdf(rep); } }, icon('download', 16), 'PDF'),
          h('button', { class: 'btn', onClick: function () { exportCsv(rep, ','); } }, 'CSV (koma)'),
          h('button', { class: 'btn', title: 'Untuk Excel dengan pengaturan regional Indonesia', onClick: function () { exportCsv(rep, ';'); } }, 'CSV (titik koma)'))),
      h('div', { class: 'stats' },
        stat('Total direncanakan', UI.fmtSecs(rep.plannedMs / 1000)), stat('Total aktual', UI.fmtSecs(rep.actualMs / 1000)),
        stat('Selisih waktu', UI.fmtSigned(rep.diffMs), rep.diffMs > 1000 ? 'danger' : 'ok'),
        stat('Ketepatan waktu sintaks', rep.accuracySyntax + '%', accClass(rep.accuracySyntax)), stat('Ketepatan waktu total', rep.accuracyTotal + '%', accClass(rep.accuracyTotal)),
        stat('Selesai', rep.counts.done + ' dari ' + rep.counts.total), stat('Dilewati', String(rep.counts.skipped)), stat('Melebihi waktu', String(rep.counts.over), rep.counts.over ? 'danger' : 'ok'))));

    var tbody = h('tbody');
    rep.rows.forEach(function (r, i) {
      var diff = r.actualMs - r.plannedSec * 1000, sk = r.status === 'skipped', ov = r.over && !sk;
      tbody.appendChild(h('tr', { class: ov ? 'over' : sk ? 'skip' : '' },
        h('td', null, String(i + 1)), h('td', null, r.name + (r.repeats ? ' (diulang ' + r.repeats + '×)' : '')), h('td', null, UI.fmtSecs(r.plannedSec)),
        h('td', null, sk ? '—' : UI.fmtSecs(r.actualMs / 1000)), h('td', null, sk ? '—' : UI.fmtSigned(diff)),
        h('td', null, h('span', { class: 'chip ' + (sk ? '' : ov ? 'red' : 'green') }, (STATUS[r.status] || r.status) + (ov ? ' · lewat' : '')))));
    });
    view.appendChild(h('section', { class: 'card' }, h('h3', null, 'Durasi per Sintaks'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, ['No', 'Sintaks', 'Rencana', 'Aktual', 'Selisih', 'Status'].map(function (x) { return h('th', null, x); }))), tbody)),
      rep.gapMs > 1500 ? h('p', { class: 'muted' }, 'Waktu jeda antar-sintaks: ' + UI.fmtSecs(rep.gapMs / 1000)) : null));

    var max = 1; rep.rows.forEach(function (r) { max = Math.max(max, r.plannedSec * 1000, r.actualMs); });
    var chart = h('div', { class: 'bars' });
    rep.rows.forEach(function (r, i) {
      chart.appendChild(h('div', { class: 'bar-row' }, h('div', { class: 'bar-name' }, (i + 1) + '. ' + r.name),
        h('div', { class: 'bar-tracks' },
          h('div', { class: 'bar plan', style: { width: (r.plannedSec * 1000 / max * 100) + '%' }, title: 'Rencana ' + UI.fmtSecs(r.plannedSec) }),
          h('div', { class: 'bar act ' + (r.over ? 'over' : ''), style: { width: (r.actualMs / max * 100) + '%' }, title: 'Aktual ' + UI.fmtSecs(r.actualMs / 1000) }))));
    });
    view.appendChild(h('section', { class: 'card' }, h('h3', null, 'Grafik Rencana vs Aktual'),
      h('div', { class: 'legend' }, h('span', { class: 'lg plan' }, 'Rencana'), h('span', { class: 'lg act' }, 'Aktual'), h('span', { class: 'lg over' }, 'Aktual melebihi')), chart));
  };
  App.pages.report = rp;

  /* ======================================================================
     BACKUP
     ====================================================================== */
  var bk = { title: 'Backup dan Restore' };
  bk.render = function (view) {
    var info = h('div', { class: 'muted' });
    function refresh() {
      info.textContent = Store.projects().length + ' proyek · ' + Store.userTemplates().length + ' template pribadi · ' + Store.history().length + ' riwayat · penyimpanan ±' + Math.max(1, Math.round(Store.usageBytes() / 1024)) + ' KB' +
        (Store.persistent ? '' : ' (PERINGATAN: penyimpanan browser dinonaktifkan, data tidak akan bertahan)');
    }
    refresh();
    var mode = 'merge';
    var rMerge = h('input', { type: 'radio', name: 'imode', value: 'merge', checked: true, onChange: function () { mode = 'merge'; } });
    var rRepl = h('input', { type: 'radio', name: 'imode', value: 'replace', onChange: function () { mode = 'replace'; } });
    var file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    var fileName = h('span', { class: 'muted' }, 'Belum ada berkas dipilih');
    var pending = null;
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return; fileName.textContent = f.name;
      var rd = new FileReader();
      rd.onload = function () { try { pending = JSON.parse(rd.result); } catch (e) { pending = null; UI.toast('Berkas bukan JSON yang valid.', 'danger'); } };
      rd.readAsText(f);
    });
    view.appendChild(h('section', { class: 'card' }, h('h2', null, 'Cadangkan Data'),
      h('p', null, 'Seluruh proyek, sintaks, template pribadi, riwayat, dan pengaturan disimpan ke satu berkas JSON.'), info,
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onClick: function () {
          var d = new Date(), stamp = d.getFullYear() + UI.p2(d.getMonth() + 1) + UI.p2(d.getDate()) + '-' + UI.p2(d.getHours()) + UI.p2(d.getMinutes());
          UI.download('smart-ukin-backup-' + stamp + '.json', JSON.stringify(Store.exportAll(), null, 2), 'application/json'); UI.toast('Cadangan diunduh.', 'ok');
        } }, icon('download', 18), 'Unduh Cadangan Lengkap'),
        h('button', { class: 'btn', onClick: function () {
          var p = Store.activeProject(); if (!p) { UI.toast('Tidak ada proyek aktif.', 'warn'); return; }
          UI.download('ukin-' + UI.safeName(p.title) + '.json', JSON.stringify(Store.exportProject(p.id), null, 2), 'application/json');
        } }, 'Ekspor Proyek Aktif'))));
    view.appendChild(h('section', { class: 'card' }, h('h2', null, 'Pulihkan / Impor'),
      h('p', null, 'Pilih berkas cadangan lengkap atau berkas proyek tunggal hasil ekspor aplikasi ini.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onClick: function () { file.click(); } }, icon('upload', 18), 'Pilih Berkas…'), fileName, file),
      h('div', { class: 'radio-group' },
        h('label', { class: 'check' }, rMerge, 'Gabungkan dengan data yang ada (proyek ber-ID sama akan diperbarui)'),
        h('label', { class: 'check' }, rRepl, 'Ganti seluruh data saat ini dengan isi cadangan')),
      h('button', { class: 'btn primary', onClick: function () {
        if (!pending) { UI.toast('Pilih berkas cadangan terlebih dahulu.', 'warn'); return; }
        function go() {
          try {
            if (S.isActive()) S.discard();
            var r = Store.importData(pending, mode);
            S.engine.s = null; S.projectId = null; S.syncIdle(); App.applySettings();
            if (r.single) Store.setActive(r.single);
            UI.toast('Impor berhasil: ' + r.projects + ' proyek, ' + r.templates + ' template, ' + r.history + ' riwayat.', 'ok', 4500);
            pending = null; file.value = ''; fileName.textContent = 'Belum ada berkas dipilih'; refresh();
          } catch (e) { UI.toast(e.message || 'Impor gagal.', 'danger', 5000); }
        }
        if (mode === 'replace') UI.confirm('Semua data saat ini akan DIGANTI oleh isi berkas. Lanjutkan?', { danger: true, ok: 'Ganti data', title: 'Pulihkan cadangan' }).then(function (ok) { if (ok) go(); });
        else go();
      } }, icon('check', 18), 'Impor / Pulihkan')));
    view.appendChild(h('section', { class: 'card' }, h('h2', null, 'Hapus Semua Data'),
      h('p', { class: 'muted' }, 'Menghapus seluruh proyek, template, riwayat, dan pengaturan dari perangkat ini. Unduh cadangan lebih dulu.'),
      h('button', { class: 'btn danger-o', onClick: function () {
        UI.confirm('Hapus SEMUA data aplikasi di perangkat ini? Tidak dapat dibatalkan.', { danger: true, ok: 'Hapus semua', title: 'Reset aplikasi' }).then(function (ok) {
          if (!ok) return; S.discard(); Store.resetAll(); S.engine.s = null; App.applySettings(); UI.toast('Semua data dihapus.', 'ok'); App.go('dashboard'); setTimeout(function () { location.reload(); }, 400);
        });
      } }, icon('trash', 16), 'Hapus Semua Data')));
  };
  App.pages.backup = bk;

  /* ======================================================================
     PENGATURAN APLIKASI
     ====================================================================== */
  var st = { title: 'Pengaturan Aplikasi' };
  st.render = function (view) {
    var s = Store.settings();
    function upd(patch, applyView) { s = Store.patchSettings(patch); if (applyView) App.applySettings(); }
    function radio(name, val, label, cur, onSel) {
      var r = h('input', { type: 'radio', name: name, value: val, checked: cur === val, onChange: function () { onSel(val); } });
      return h('label', { class: 'choice' }, r, h('span', null, label));
    }
    var themeG = h('div', { class: 'choices' },
      radio('theme', 'light', 'Terang', s.theme, function (v) { upd({ theme: v }, true); }),
      radio('theme', 'dark', 'Gelap', s.theme, function (v) { upd({ theme: v }, true); }),
      radio('theme', 'contrast', 'Kontras tinggi', s.theme, function (v) { upd({ theme: v }, true); }));
    var sizeG = h('div', { class: 'choices' },
      radio('gsize', 'normal', 'Normal', s.guideSize, function (v) { upd({ guideSize: v }, true); }),
      radio('gsize', 'large', 'Besar', s.guideSize, function (v) { upd({ guideSize: v }, true); }),
      radio('gsize', 'xl', 'Sangat besar', s.guideSize, function (v) { upd({ guideSize: v }, true); }));
    var lhR = h('input', { type: 'range', min: 1.1, max: 2.2, step: 0.1, value: s.lineHeight, onInput: function () { upd({ lineHeight: +lhR.value }, true); lhV.textContent = (+lhR.value).toFixed(1); } });
    var lhV = h('b', null, s.lineHeight.toFixed(1));
    var cSilent = h('input', { type: 'checkbox', checked: s.silent, onChange: function () { upd({ silent: cSilent.checked }); } });
    var soundSel = h('select', { onChange: function () { upd({ alarmSound: soundSel.value }); } },
      Object.keys(Audio.SOUND_LABELS).map(function (k) { return h('option', { value: k, selected: s.alarmSound === k }, Audio.SOUND_LABELS[k]); }));
    var vol = h('input', { type: 'range', min: 0.05, max: 1, step: 0.05, value: s.volume, onInput: function () { upd({ volume: +vol.value }); } });
    var cVib = h('input', { type: 'checkbox', checked: s.vibrate, onChange: function () { upd({ vibrate: cVib.checked }); } });
    var cWake = h('input', { type: 'checkbox', checked: s.wakeLock, onChange: function () { upd({ wakeLock: cWake.checked }); } });
    var cFlash = h('input', { type: 'checkbox', checked: s.flash, onChange: function () { upd({ flash: cFlash.checked }); } });
    var cAuto = h('input', { type: 'checkbox', checked: s.autoMode, onChange: function () { upd({ autoMode: cAuto.checked }); } });
    var overSel = h('select', { onChange: function () { upd({ overtimeRemindSec: +overSel.value }); } },
      [[0, 'Tidak diingatkan'], [30, 'Setiap 30 detik'], [60, 'Setiap 1 menit'], [120, 'Setiap 2 menit']].map(function (o) { return h('option', { value: o[0], selected: s.overtimeRemindSec === o[0] }, o[1]); }));

    view.appendChild(h('section', { class: 'card form' }, h('h2', null, 'Tampilan'),
      UI.field('Tema', themeG), UI.field('Ukuran tulisan panduan', sizeG),
      UI.field('Jarak antarbaris panduan', h('div', { class: 'row' }, lhR, lhV))));
    view.appendChild(h('section', { class: 'card form' }, h('h2', null, 'Suara & Peringatan'),
      h('label', { class: 'check' }, cSilent, 'Mode senyap (tanpa suara; indikator warna & banner tetap tampil) — disarankan saat merekam video'),
      h('div', { class: 'grid2' }, UI.field('Pilihan suara alarm', soundSel), UI.field('Volume', vol)),
      h('div', { class: 'row' }, h('button', { class: 'btn', onClick: function () { Audio.unlock(); if (!Audio.play(s.alarmSound, 2, 784, s.volume)) UI.toast('Perangkat tidak mendukung audio.', 'warn'); } }, icon('bell', 16), 'Coba suara')),
      UI.field('Pengingat setelah melewati target waktu total', overSel),
      h('label', { class: 'check' }, cVib, 'Getar saat alarm (jika perangkat mendukung)'),
      h('label', { class: 'check' }, cFlash, 'Kilatan warna layar saat peringatan'),
      h('label', { class: 'check' }, cWake, 'Jaga layar tetap menyala saat timer berjalan')));
    view.appendChild(h('section', { class: 'card form' }, h('h2', null, 'Bawaan Proyek Baru'),
      h('label', { class: 'check' }, cAuto, 'Pindah sintaks otomatis saat waktu habis (dapat diubah per proyek)')));

    var off = h('section', { class: 'card form' }); st.off = off;
    view.appendChild(off); drawOffline();
    view.appendChild(h('section', { class: 'card' }, h('h2', null, 'Tentang'),
      h('p', null, 'SMART UKIN TIMER v1.0 — asisten pengatur waktu & panduan pembelajaran. Semua data tersimpan di perangkat Anda; tidak ada data yang dikirim ke server.'),
      h('p', { class: 'muted' }, 'Pintasan di Live Timer: Spasi = mulai/jeda · → = berikutnya · ← = sebelumnya · R = ulangi · F = presentasi · M = senyap.')));
  };
  function drawOffline() {
    var off = st.off; if (!off) return;
    UI.clear(off);
    var o = App.offline, on = navigator.onLine;
    var stateTxt = { ready: 'Siap dipakai offline', installing: 'Sedang menyiapkan cache…', checking: 'Memeriksa…', unsupported: 'Tidak didukung (butuh HTTPS atau localhost, dan browser modern)', error: 'Belum siap' }[o.state];
    var info = o.info ? ('Versi cache: ' + o.info.version + ' · ' + o.info.cached + '/' + o.info.total + ' berkas tersimpan') : '';
    off.appendChild(h('h2', null, 'Mode Offline & Pemasangan'));
    off.appendChild(h('div', { class: 'status-grid' },
      h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Koneksi saat ini'), h('div', { class: 'stat-val ' + (on ? 'ok' : 'danger') }, on ? 'ONLINE' : 'OFFLINE')),
      h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Kesiapan offline'), h('div', { class: 'stat-val ' + (o.state === 'ready' ? 'ok' : 'warn') }, stateTxt))));
    if (info) off.appendChild(h('p', { class: 'muted' }, info));
    off.appendChild(h('p', { class: 'muted' }, 'Buka aplikasi ini sekali dengan internet hingga status “Siap dipakai offline”. Setelah itu seluruh fitur dapat dipakai tanpa internet, termasuk setelah browser ditutup.'));
    var row = h('div', { class: 'row' },
      h('button', { class: 'btn', onClick: function () { App.checkOffline().then(function () { drawOffline(); UI.toast('Status offline diperbarui.', 'ok', 1800); }); } }, 'Periksa status offline'),
      h('button', { class: 'btn', onClick: function () {
        if (!navigator.onLine) { UI.toast('Perlu internet untuk memeriksa pembaruan.', 'warn'); return; }
        App.checkUpdate().then(function () { setTimeout(function () { drawOffline(); UI.toast(App.updateReady ? 'Pembaruan ditemukan.' : 'Aplikasi sudah versi terbaru.', 'ok'); }, 1200); });
      } }, 'Cek pembaruan'));
    if (App.updateReady) row.appendChild(h('button', { class: 'btn primary', onClick: function () { App.applyUpdate(); } }, 'Terapkan pembaruan & muat ulang'));
    if (App.installPrompt) row.appendChild(h('button', { class: 'btn primary', onClick: function () { App.installPrompt.prompt(); } }, icon('download', 16), 'Install sebagai aplikasi'));
    off.appendChild(row);
    off.appendChild(h('p', { class: 'muted' }, 'Tombol “Install” muncul bila browser mendukung. Di iPhone/iPad: Safari → Bagikan → “Tambah ke Layar Utama”. Di Chrome/Edge: menu ⋮ → “Instal aplikasi”.'));
  }
  st.onNet = drawOffline;
  App.pages.settings = st;
})(typeof self !== 'undefined' ? self : this);
