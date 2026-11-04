/* ==========================================================================
   SMART UKIN TIMER — pages-main.js
   Dashboard, Buat Proyek Baru, Template Pembelajaran, Pengaturan Sintaks.
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App, UI = root.UkinUI, Store = root.UkinStore, Tpl = root.UkinTemplates;
  var h = UI.h, icon = UI.icon;
  var S = App.session;

  function chip(text, cls) { return text ? h('span', { class: 'chip ' + (cls || '') }, text) : null; }
  function projectSum(p) { return p.syntaxes.reduce(function (a, s) { return a + s.durationSec; }, 0); }
  function allTemplates() { return Tpl.list().concat(Store.userTemplates().map(function (t) { return { id: t.id, name: t.name, model: t.model, desc: t.desc, builtin: false, count: t.syntaxes.length, totalSec: t.totalSec }; })); }
  function getTemplate(id) { return Tpl.get(id) || Store.userTemplates().filter(function (t) { return t.id === id; })[0] || null; }

  /* ======================================================================
     1. DASHBOARD
     ====================================================================== */
  var dash = { title: 'Dashboard' };
  dash.render = function (view) {
    var refs = {};
    dash.refs = refs;
    var p = Store.activeProject();
    var hero;
    if (!p && !S.engine.hasSession()) {
      hero = h('section', { class: 'card empty' },
        h('h2', null, 'Belum ada proyek'),
        h('p', null, 'Buat proyek pembelajaran baru atau mulai dari template yang sudah disediakan.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: '#/new' }, icon('plus'), 'Buat Proyek Baru'),
          h('a', { class: 'btn', href: '#/templates' }, icon('layout'), 'Lihat Template')));
    } else {
      var cfg = S.engine.s.cfg;
      refs.title = h('h2', { class: 'hero-title' }, cfg.title);
      refs.status = h('span', { class: 'chip status' }, '');
      refs.big = h('div', { class: 'big-time', id: 'dashBig' }, '--:--');
      refs.bigLabel = h('div', { class: 'big-label' }, 'SISA WAKTU TOTAL');
      refs.bar = h('div', { class: 'bar-fill' });
      var stat = function (k, label) { refs[k] = h('div', { class: 'stat-val' }, '-'); return h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, label), refs[k]); };
      hero = h('section', { class: 'card hero' },
        h('div', { class: 'hero-top' },
          h('div', null,
            h('div', { class: 'brandline' }, 'SMART UKIN TIMER'),
            refs.title,
            h('div', { class: 'chips' }, chip(cfg.subject, 'navy'), chip(cfg.grade, 'navy'), chip(cfg.model, 'orange'), refs.status)),
          h('div', { class: 'hero-timer' }, refs.bigLabel, refs.big)),
        h('div', { class: 'progress big' }, refs.bar),
        h('div', { class: 'stats' },
          stat('planned', 'Total durasi direncanakan'), stat('elapsed', 'Waktu berjalan'), stat('remain', 'Waktu tersisa'),
          stat('pct', 'Kemajuan keseluruhan'), stat('done', 'Sintaks selesai'),
          stat('cur', 'Sintaks berlangsung'), stat('next', 'Sintaks berikutnya')),
        h('div', { class: 'row actions' },
          h('a', { class: 'btn primary lg', href: '#/live' }, icon('play'), 'Buka Live Timer'),
          h('a', { class: 'btn', href: '#/syntax' }, icon('list'), 'Atur Sintaks'),
          h('a', { class: 'btn', href: '#/teleprompter' }, icon('type'), 'Teleprompter')));
    }

    /* daftar proyek */
    var list = h('div', { class: 'project-list' });
    var projects = Store.projects(), activeId = Store.activeId();
    if (!projects.length) list.appendChild(h('p', { class: 'muted' }, 'Belum ada proyek tersimpan.'));
    projects.forEach(function (pr) {
      var isActive = pr.id === activeId;
      list.appendChild(h('div', { class: 'project-row' + (isActive ? ' active' : '') },
        h('div', { class: 'pr-main' },
          h('div', { class: 'pr-title' }, pr.title, isActive ? chip('Aktif', 'orange') : null),
          h('div', { class: 'pr-meta' }, [pr.subject, pr.grade, pr.model].filter(Boolean).join(' · ') || 'Tanpa keterangan',
            ' — ', pr.syntaxes.length + ' sintaks · ' + UI.fmtSecs(pr.totalSec))),
        h('div', { class: 'pr-actions' },
          isActive ? null : h('button', { class: 'btn sm', onClick: function () { App.activateProject(pr.id).then(function (ok) { if (ok) dash.render(UI.clear(view)); }); } }, 'Aktifkan'),
          h('button', { class: 'btn sm', onClick: function () { App.activateProject(pr.id).then(function (ok) { if (ok) App.go('syntax'); }); } }, icon('edit', 16), 'Edit'),
          h('button', { class: 'btn sm', title: 'Duplikat', onClick: function () { Store.duplicateProject(pr.id); UI.toast('Proyek digandakan.', 'ok'); dash.render(UI.clear(view)); } }, icon('copy', 16)),
          h('button', { class: 'btn sm danger-o', title: 'Hapus', onClick: function () {
            UI.confirm('Hapus proyek "' + pr.title + '"? Tindakan ini tidak dapat dibatalkan.', { danger: true, ok: 'Hapus', title: 'Hapus proyek' }).then(function (ok) {
              if (!ok) return;
              if (S.projectId === pr.id && S.isActive()) S.discard();
              Store.deleteProject(pr.id); S.syncIdle(); UI.toast('Proyek dihapus.', 'ok'); dash.render(UI.clear(view));
            });
          } }, icon('trash', 16))
        )));
    });
    view.appendChild(hero);
    view.appendChild(h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, 'Proyek Pembelajaran'),
        h('div', { class: 'row' }, h('a', { class: 'btn sm primary', href: '#/new' }, icon('plus', 16), 'Proyek Baru'),
          h('a', { class: 'btn sm', href: '#/templates' }, 'Template'))),
      list));
    dash.view = view;
  };
  dash.onTick = function (vm) {
    var r = dash.refs; if (!r || !r.big || !vm) return;
    var set = function (el, t) { if (el.textContent !== t) el.textContent = t; };
    set(r.big, UI.fmtRemain(vm.total.remainingMs));
    r.big.className = 'big-time ' + vm.total.color;
    set(r.planned, UI.fmtSecs(vm.total.plannedMs / 1000));
    set(r.elapsed, UI.fmtElapsed(vm.total.elapsedMs));
    set(r.remain, UI.fmtRemain(vm.total.remainingMs));
    set(r.pct, Math.round(vm.total.pct) + '%');
    set(r.done, vm.doneCount + ' dari ' + vm.count);
    set(r.cur, vm.status === 'idle' ? '(belum dimulai)' : vm.status === 'finished' ? '(selesai)' : vm.syn.name);
    set(r.next, vm.next ? vm.next.name : '—');
    r.bar.style.width = vm.total.pct + '%'; r.bar.className = 'bar-fill ' + vm.total.color;
    var txt = { idle: 'Siap dimulai', running: '● Berjalan', paused: '❚❚ Dijeda', finished: '✓ Selesai' }[vm.status];
    set(r.status, txt);
  };
  App.pages.dashboard = dash;

  /* ======================================================================
     2. BUAT PROYEK BARU
     ====================================================================== */
  var np = { title: 'Buat Proyek Baru' };
  np.render = function (view) {
    var st = { totalSec: 40 * 60, start: '', end: '' };
    var iTitle = h('input', { type: 'text', placeholder: 'mis. UKIN Take 1 – Bola Voli', maxlength: 120 });
    var iSubj = h('input', { type: 'text', placeholder: 'mis. PJOK / Matematika', maxlength: 80 });
    var iGrade = h('input', { type: 'text', placeholder: 'mis. Kelas VII / Fase D', maxlength: 60 });
    var iModel = h('input', { type: 'text', placeholder: 'mis. Problem Based Learning', maxlength: 80 });
    var sel = h('select', null, h('option', { value: '' }, '— Mulai kosong —'));
    var gB = h('optgroup', { label: 'Template bawaan' }), gU = h('optgroup', { label: 'Template saya' });
    allTemplates().forEach(function (t) { (t.builtin ? gB : gU).appendChild(h('option', { value: t.id }, t.name + ' (' + t.count + ' sintaks, ' + UI.fmtSecs(t.totalSec) + ')')); });
    sel.appendChild(gB); if (gU.children.length) sel.appendChild(gU);
    var tplInfo = h('small', { class: 'hint' }, 'Template hanya titik awal; semua isi bisa diubah.');
    var hms = UI.hmsField(st.totalSec, function (t) { st.totalSec = t; syncEnd(); });
    var iStart = h('input', { type: 'time' }), iEnd = h('input', { type: 'time' });
    function syncEnd() { var s = UI.hmToMin(st.start); if (s != null) { st.end = UI.minToHm(s + st.totalSec / 60); iEnd.value = st.end; } }
    iStart.addEventListener('change', function () { st.start = iStart.value; syncEnd(); });
    iEnd.addEventListener('change', function () {
      st.end = iEnd.value; var s = UI.hmToMin(st.start), e = UI.hmToMin(st.end);
      if (s != null && e != null) { var d = ((e - s) + 1440) % 1440; if (d === 0) d = 1440; st.totalSec = d * 60; hms.set(st.totalSec); }
      else if (s == null) UI.toast('Isi waktu mulai agar waktu selesai bisa dihitung menjadi total durasi.', 'warn');
    });
    sel.addEventListener('change', function () {
      var t = getTemplate(sel.value);
      if (t) { st.totalSec = t.totalSec; hms.set(st.totalSec); syncEnd(); if (!iModel.value) iModel.value = t.model || ''; if (!iTitle.value) iTitle.placeholder = t.name.replace(/^Template\s+/, ''); tplInfo.textContent = t.desc || ''; }
    });
    var form = h('form', { class: 'card form', onSubmit: function (e) {
      e.preventDefault();
      var t = getTemplate(sel.value);
      var meta = { title: iTitle.value.trim() || (t ? t.name.replace(/^Template\s+/, '') : 'Proyek baru'), subject: iSubj.value.trim(), grade: iGrade.value.trim(),
        model: iModel.value.trim(), totalSec: st.totalSec, startTime: st.start, endTime: st.end };
      var p = t ? Store.projectFromTemplate(t, meta) : Store.saveProject({ title: meta.title, subject: meta.subject, grade: meta.grade, model: meta.model,
        totalSec: meta.totalSec, startTime: meta.startTime, endTime: meta.endTime, syntaxes: [], autoMode: Store.settings().autoMode });
      if (!p) { UI.toast('Gagal menyimpan. Penyimpanan perangkat mungkin penuh.', 'danger'); return; }
      App.activateProject(p.id).then(function () { UI.toast('Proyek dibuat. Atur sintaks sesuai kebutuhan.', 'ok'); App.go('syntax'); });
    } },
      h('h2', null, 'Informasi Kegiatan'),
      h('div', { class: 'grid2' }, UI.field('Judul kegiatan / pembelajaran', iTitle), UI.field('Mata pelajaran', iSubj),
        UI.field('Kelas / jenjang', iGrade), UI.field('Model pembelajaran', iModel)),
      UI.field('Mulai dari template', sel, null), tplInfo,
      h('h2', null, 'Waktu'),
      h('div', { class: 'grid2' }, UI.field('Total durasi kegiatan', hms),
        UI.field('Waktu mulai (opsional)', iStart), UI.field('Waktu selesai yang ditargetkan', iEnd, 'Mengubah waktu selesai akan menghitung ulang total durasi.')),
      h('div', { class: 'row' }, h('button', { class: 'btn primary lg', type: 'submit' }, icon('check'), 'Buat Proyek'),
        h('a', { class: 'btn', href: '#/dashboard' }, 'Batal')));
    view.appendChild(form);
  };
  App.pages.new = np;

  /* ======================================================================
     3. TEMPLATE PEMBELAJARAN
     ====================================================================== */
  var tp = { title: 'Template Pembelajaran' };
  function previewTemplate(t) {
    var full = getTemplate(t.id); if (!full) return;
    var ol = h('ol', { class: 'tpl-prev' });
    full.syntaxes.forEach(function (s) { ol.appendChild(h('li', null, h('b', null, s.name), ' ', h('span', { class: 'muted' }, '· ' + UI.fmtSecs(s.durationSec) + (s.phase ? ' · ' + s.phase : '')))); });
    UI.modal({ title: full.name, body: [h('p', { class: 'muted' }, full.desc), ol], wide: true,
      buttons: [{ label: 'Tutup', cls: 'ghost' }, { label: 'Gunakan template ini', cls: 'primary', onClick: function () { useTemplate(t); } }] });
  }
  function useTemplate(t) {
    var full = getTemplate(t.id); if (!full) return;
    var iT = h('input', { type: 'text', value: full.name.replace(/^Template\s+/, ''), maxlength: 120 });
    var iS = h('input', { type: 'text', placeholder: 'Mata pelajaran' }), iG = h('input', { type: 'text', placeholder: 'Kelas / jenjang' });
    UI.modal({ title: 'Buat proyek dari template', body: h('div', { class: 'form' }, UI.field('Judul kegiatan', iT), UI.field('Mata pelajaran', iS), UI.field('Kelas / jenjang', iG)),
      buttons: [{ label: 'Batal', cls: 'ghost' }, { label: 'Buat Proyek', cls: 'primary', onClick: function () {
        var p = Store.projectFromTemplate(full, { title: iT.value.trim(), subject: iS.value.trim(), grade: iG.value.trim() });
        if (!p) { UI.toast('Gagal menyimpan.', 'danger'); return false; }
        App.activateProject(p.id).then(function () { UI.toast('Proyek dibuat dari template.', 'ok'); App.go('syntax'); });
      } }] });
  }
  tp.render = function (view) {
    function draw() {
      UI.clear(view);
      var active = Store.activeProject();
      var top = h('div', { class: 'card-head page-head' }, h('p', { class: 'muted' }, 'Template dapat dipakai langsung dan tetap bisa diedit sepenuhnya. Durasi hanyalah contoh.'),
        active ? h('button', { class: 'btn', onClick: function () {
          var n = h('input', { type: 'text', value: 'Template – ' + active.title, maxlength: 120 });
          UI.modal({ title: 'Simpan proyek aktif sebagai template', body: UI.field('Nama template', n), buttons: [{ label: 'Batal', cls: 'ghost' },
            { label: 'Simpan', cls: 'primary', onClick: function () {
              Store.saveUserTemplate({ name: n.value.trim() || 'Template saya', model: active.model, desc: 'Template pribadi dari proyek "' + active.title + '".', syntaxes: active.syntaxes });
              UI.toast('Template disimpan.', 'ok'); draw();
            } }] });
        } }, icon('save'), 'Simpan proyek aktif sebagai template') : null);
      view.appendChild(top);
      var grid = h('div', { class: 'tpl-grid' });
      allTemplates().forEach(function (t) {
        grid.appendChild(h('div', { class: 'card tpl-card' },
          h('div', null, h('h3', null, t.name), h('p', { class: 'muted' }, t.desc),
            h('div', { class: 'chips' }, chip(t.count + ' sintaks', 'navy'), chip(UI.fmtSecs(t.totalSec), 'navy'), t.builtin ? chip('Bawaan') : chip('Milik saya', 'orange'))),
          h('div', { class: 'row' },
            h('button', { class: 'btn primary sm', onClick: function () { useTemplate(t); } }, 'Gunakan'),
            h('button', { class: 'btn sm', onClick: function () { previewTemplate(t); } }, 'Pratinjau'),
            t.builtin ? null : h('button', { class: 'btn sm danger-o', onClick: function () {
              UI.confirm('Hapus template "' + t.name + '"?', { danger: true, ok: 'Hapus' }).then(function (ok) { if (ok) { Store.deleteUserTemplate(t.id); draw(); } });
            } }, icon('trash', 16)))));
      });
      view.appendChild(grid);
    }
    draw();
  };
  App.pages.templates = tp;

  /* ======================================================================
     4. PENGATURAN SINTAKS
     ====================================================================== */
  var sp = { title: 'Pengaturan Sintaks' };
  var PHASES = ['Pendahuluan', 'Inti', 'Penutup'];
  var PRESET_WARN = [[300, '5 menit sebelum selesai'], [180, '3 menit sebelum selesai'], [60, '1 menit sebelum selesai'], [30, '30 detik sebelum selesai']];

  function editSyntax(sx, isNew, done) {
    var d = JSON.parse(JSON.stringify(sx));
    var iName = h('input', { type: 'text', value: d.name, maxlength: 120 });
    var iPhase = h('input', { type: 'text', value: d.phase, list: 'phaseList', placeholder: 'Pendahuluan / Inti / Penutup' });
    var dl = h('datalist', { id: 'phaseList' }, PHASES.map(function (p) { return h('option', { value: p }); }));
    var dur = UI.durField(d.durationSec, function (t) { d.durationSec = t; });
    var ta = function (v, rows, ph) { return h('textarea', { rows: rows || 3, placeholder: ph || '' }, v); };
    var tDesc = ta(d.description, 2), tObj = ta(d.objective, 2), tTeach = ta(d.teacherActivity, 4, 'Satu langkah per baris'), tSay = ta(d.teacherSay, 4, 'Kalimat yang akan diucapkan, satu per baris');
    var tStu = ta(d.studentActivity, 3), tMedia = h('input', { type: 'text', value: d.media }), tInd = ta(d.indicator, 2), tNotes = ta(d.notes, 2);
    var tCheck = ta(d.checklist.map(function (c) { return c.text; }).join('\n'), 4, 'Satu butir checklist per baris');
    var body = h('div', { class: 'form syn-form' }, dl,
      h('div', { class: 'grid2' }, UI.field('Nama sintaks', iName), UI.field('Tahap (kelompok)', iPhase)),
      UI.field('Durasi sintaks', dur),
      UI.field('Deskripsi kegiatan', tDesc), UI.field('Tujuan kegiatan', tObj),
      UI.field('Aktivitas guru (langkah guru)', tTeach), UI.field('Contoh kalimat / instruksi guru', tSay),
      UI.field('Aktivitas murid', tStu), UI.field('Media / alat yang dibutuhkan', tMedia),
      UI.field('Indikator keberhasilan / asesmen', tInd), UI.field('Catatan penting', tNotes),
      UI.field('Checklist kegiatan', tCheck));
    UI.modal({ title: isNew ? 'Tambah Sintaks' : 'Edit Sintaks', body: body, wide: true,
      buttons: [{ label: 'Batal', cls: 'ghost' }, { label: 'Simpan', cls: 'primary', onClick: function () {
        if (!iName.value.trim()) { UI.toast('Nama sintaks tidak boleh kosong.', 'warn'); return false; }
        d.name = iName.value.trim(); d.phase = iPhase.value.trim(); d.description = tDesc.value; d.objective = tObj.value;
        d.teacherActivity = tTeach.value; d.teacherSay = tSay.value; d.studentActivity = tStu.value; d.media = tMedia.value;
        d.indicator = tInd.value; d.notes = tNotes.value;
        d.checklist = tCheck.value.split('\n').map(function (x) { return { text: x.trim() }; }).filter(function (x) { return x.text; });
        done(d);
      } }] });
  }

  sp.render = function (view) {
    var P = Store.activeProject();
    if (!P) {
      view.appendChild(h('section', { class: 'card empty' }, h('h2', null, 'Belum ada proyek aktif'),
        h('p', null, 'Buat proyek atau pilih template terlebih dahulu.'),
        h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/new' }, 'Buat Proyek'), h('a', { class: 'btn', href: '#/templates' }, 'Template'))));
      return;
    }
    var holder = h('div'); view.appendChild(holder);
    var refs = {};

    function save(quiet) {
      var s = Store.saveProject(P);
      if (!s) { UI.toast('Gagal menyimpan. Penyimpanan perangkat mungkin penuh.', 'danger'); return; }
      P = s; if (!quiet) refs.saved && (refs.saved.textContent = 'Tersimpan ' + UI.fmtClockTime(Date.now()));
      S.syncIdle();
    }
    function sum() { return P.syntaxes.reduce(function (a, s) { return a + s.durationSec; }, 0); }
    function updateSummary() {
      if (!refs.sum) return;
      var tot = sum(), diff = tot - P.totalSec;
      refs.sum.textContent = UI.fmtSecs(tot); refs.total.textContent = UI.fmtSecs(P.totalSec);
      refs.diff.textContent = diff === 0 ? 'Pas' : (diff > 0 ? '+' : '-') + UI.fmtSecs(Math.abs(diff));
      refs.warn.className = 'notice ' + (diff === 0 ? 'ok' : 'warn');
      refs.warn.textContent = diff === 0 ? '✓ Jumlah durasi sintaks tepat sama dengan total waktu.' :
        diff > 0 ? '⚠ Jumlah durasi sintaks MELEBIHI total waktu sebesar ' + UI.fmtSecs(diff) + '. Kurangi durasi sintaks atau tambah total waktu.' :
          '⚠ Jumlah durasi sintaks KURANG ' + UI.fmtSecs(-diff) + ' dari total waktu. Tambah durasi sintaks atau kurangi total waktu.';
      refs.btns.hidden = diff === 0;
    }
    function rowsCount() { return P.syntaxes.length; }

    function draw() {
      UI.clear(holder); refs = {};
      var active = S.isActive();
      /* pilih proyek */
      var selP = h('select', { onChange: function () { App.activateProject(selP.value).then(function () { P = Store.activeProject(); draw(); }); } },
        Store.projects().map(function (x) { return h('option', { value: x.id, selected: x.id === P.id }, x.title); }));
      refs.saved = h('span', { class: 'muted saved' }, '');
      holder.appendChild(h('div', { class: 'card-head page-head' }, UI.field('Proyek yang diedit', selP),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onClick: function () { var j = Store.exportProject(P.id); UI.download('ukin-' + UI.safeName(P.title) + '.json', JSON.stringify(j, null, 2), 'application/json'); } }, icon('download', 16), 'Ekspor JSON'),
          h('button', { class: 'btn', onClick: function () {
            var n = h('input', { type: 'text', value: 'Template – ' + P.title });
            UI.modal({ title: 'Simpan sebagai template', body: UI.field('Nama template', n), buttons: [{ label: 'Batal', cls: 'ghost' },
              { label: 'Simpan', cls: 'primary', onClick: function () { Store.saveUserTemplate({ name: n.value.trim() || 'Template saya', model: P.model, desc: 'Template pribadi dari proyek "' + P.title + '".', syntaxes: P.syntaxes }); UI.toast('Template disimpan.', 'ok'); } }] });
          } }, icon('save', 16), 'Simpan sebagai template'))));
      if (active) holder.appendChild(h('div', { class: 'notice warn' }, 'Sesi timer sedang berjalan/dijeda. Perubahan sintaks berlaku pada sesi berikutnya (tidak mengganggu sesi yang sedang berjalan).'));

      /* info proyek */
      var inp = function (key, label, ph) { var i = h('input', { type: 'text', value: P[key], placeholder: ph || '', maxlength: 120, onChange: function () { P[key] = i.value.trim() || (key === 'title' ? 'Proyek tanpa judul' : ''); save(); } }); return UI.field(label, i); };
      holder.appendChild(h('section', { class: 'card form' }, h('div', { class: 'card-head' }, h('h2', null, 'Informasi Kegiatan'), refs.saved),
        h('div', { class: 'grid2' }, inp('title', 'Judul kegiatan'), inp('subject', 'Mata pelajaran'), inp('grade', 'Kelas / jenjang'), inp('model', 'Model pembelajaran'))));

      /* timer total */
      var hms = UI.hmsField(P.totalSec, function (t) { P.totalSec = t; var s = UI.hmToMin(P.startTime); if (s != null) { P.endTime = UI.minToHm(s + t / 60); iEnd.value = P.endTime; } save(); updateSummary(); });
      var iStart = h('input', { type: 'time', value: P.startTime, onChange: function () { P.startTime = iStart.value; var s = UI.hmToMin(P.startTime); if (s != null) { P.endTime = UI.minToHm(s + P.totalSec / 60); iEnd.value = P.endTime; } save(); } });
      var iEnd = h('input', { type: 'time', value: P.endTime, onChange: function () {
        var s = UI.hmToMin(P.startTime), e = UI.hmToMin(iEnd.value);
        if (s == null || e == null) { UI.toast('Isi waktu mulai terlebih dahulu.', 'warn'); iEnd.value = P.endTime; return; }
        var d = ((e - s) + 1440) % 1440; if (d === 0) d = 1440;
        P.endTime = iEnd.value; P.totalSec = d * 60; hms.set(P.totalSec); save(); updateSummary();
      } });
      var cAuto = h('input', { type: 'checkbox', checked: P.autoStartAtSchedule, onChange: function () { P.autoStartAtSchedule = cAuto.checked; save(); } });
      var selMode = h('select', { onChange: function () { P.autoMode = selMode.value === 'auto'; save(); } },
        h('option', { value: 'auto', selected: P.autoMode }, 'Otomatis — pindah sintaks saat waktu habis'),
        h('option', { value: 'manual', selected: !P.autoMode }, 'Manual — pindah saat saya menekan tombol'));
      var gap = UI.durField(P.gapSec, function (t) { P.gapSec = t; save(); }, { min: 0 });
      var warnBox = h('div', { class: 'warn-list' });
      function drawWarn() {
        UI.clear(warnBox);
        PRESET_WARN.forEach(function (w) {
          var c = h('input', { type: 'checkbox', checked: P.warnings.indexOf(w[0]) >= 0, onChange: function () {
            P.warnings = P.warnings.filter(function (x) { return x !== w[0]; }); if (c.checked) P.warnings.push(w[0]);
            P.warnings.sort(function (a, b) { return b - a; }); save(); drawWarn();
          } });
          warnBox.appendChild(h('label', { class: 'check' }, c, w[1]));
        });
        var cEnd = h('input', { type: 'checkbox', checked: P.warnEnd, onChange: function () { P.warnEnd = cEnd.checked; save(); } });
        warnBox.appendChild(h('label', { class: 'check' }, cEnd, 'Alarm saat waktu habis'));
        var customs = P.warnings.filter(function (x) { return !PRESET_WARN.some(function (w) { return w[0] === x; }); });
        var cw = h('div', { class: 'chips custom-warn' });
        customs.forEach(function (x) { cw.appendChild(h('span', { class: 'chip navy removable' }, App.warnLabel(x) + ' sebelum selesai', h('button', { class: 'chip-x', 'aria-label': 'Hapus', onClick: function () { P.warnings = P.warnings.filter(function (y) { return y !== x; }); save(); drawWarn(); } }, '×'))); });
        var cm = h('input', { type: 'number', min: 0, max: 999, value: 0, 'aria-label': 'Menit' }), cs = h('input', { type: 'number', min: 0, max: 59, value: 45, 'aria-label': 'Detik' });
        warnBox.appendChild(cw);
        warnBox.appendChild(h('div', { class: 'row add-warn' }, h('span', null, 'Batas peringatan sendiri:'), h('div', { class: 'dur-field' }, cm, h('span', null, 'm'), cs, h('span', null, 'd')),
          h('button', { class: 'btn sm', type: 'button', onClick: function () {
            var t = (parseInt(cm.value, 10) || 0) * 60 + (parseInt(cs.value, 10) || 0);
            if (t < 1) { UI.toast('Isi batas waktu lebih dari 0.', 'warn'); return; }
            if (P.warnings.indexOf(t) >= 0) { UI.toast('Batas tersebut sudah ada.', 'warn'); return; }
            P.warnings.push(t); P.warnings.sort(function (a, b) { return b - a; }); save(); drawWarn();
          } }, icon('plus', 16), 'Tambah')));
      }
      drawWarn();
      holder.appendChild(h('section', { class: 'card form' }, h('h2', null, 'Timer Total & Peringatan'),
        h('div', { class: 'grid2' }, UI.field('Total waktu kegiatan', hms), UI.field('Waktu mulai', iStart),
          UI.field('Waktu selesai yang ditargetkan', iEnd, 'Isi waktu mulai lalu waktu selesai untuk menghitung total otomatis.'),
          h('label', { class: 'check inline' }, cAuto, 'Mulai otomatis pada waktu mulai (saat halaman Live Timer dibuka)')),
        h('div', { class: 'grid2' }, UI.field('Mode perpindahan sintaks', selMode), UI.field('Jeda antar-sintaks (mode otomatis)', gap)),
        h('h3', null, 'Peringatan waktu total'), warnBox));

      /* ringkasan durasi */
      refs.sum = h('b'); refs.total = h('b'); refs.diff = h('b'); refs.warn = h('div', { class: 'notice' });
      refs.btns = h('div', { class: 'row' },
        h('button', { class: 'btn sm', onClick: function () { P.totalSec = Math.max(1, sum()); var s = UI.hmToMin(P.startTime); if (s != null) P.endTime = UI.minToHm(s + P.totalSec / 60); save(); draw(); } }, 'Samakan total waktu dengan jumlah sintaks'),
        h('button', { class: 'btn sm', onClick: function () {
          var cur = sum(); if (!cur) return; var f = P.totalSec / cur;
          P.syntaxes.forEach(function (x) { x.durationSec = Math.max(5, Math.round(x.durationSec * f)); });
          var diff = P.totalSec - sum(), big = P.syntaxes.reduce(function (m, x) { return x.durationSec > m.durationSec ? x : m; }, P.syntaxes[0]);
          if (big) big.durationSec = Math.max(5, big.durationSec + diff);
          save(); draw(); UI.toast('Durasi sintaks diskalakan proporsional ke total waktu.', 'ok');
        } }, 'Skalakan durasi sintaks ke total waktu'));
      holder.appendChild(h('section', { class: 'card' }, h('h2', null, 'Perhitungan Durasi'),
        h('div', { class: 'sumbar' }, h('div', null, 'Jumlah durasi sintaks', h('br'), refs.sum), h('div', null, 'Total waktu target', h('br'), refs.total), h('div', null, 'Selisih', h('br'), refs.diff)),
        refs.warn, refs.btns));

      /* daftar sintaks */
      var list = h('div', { class: 'syn-list' });
      var dragIdx = null;
      function move(i, j) { if (j < 0 || j >= rowsCount() || i === j) return; var it = P.syntaxes.splice(i, 1)[0]; P.syntaxes.splice(j, 0, it); save(); draw(); }
      P.syntaxes.forEach(function (sx, i) {
        var durEl = UI.durField(sx.durationSec, function (t) { sx.durationSec = t; save(true); updateSummary(); });
        var row = h('div', { class: 'syn-row', draggable: 'true' },
          h('span', { class: 'grip', title: 'Seret untuk mengurutkan' }, icon('grip', 18)),
          h('div', { class: 'syn-no' }, String(i + 1)),
          h('div', { class: 'syn-main' }, h('div', { class: 'syn-name' }, sx.name), h('div', { class: 'syn-meta' }, sx.phase ? chip(sx.phase, 'navy') : null,
            sx.checklist.length ? chip(sx.checklist.length + ' checklist') : null)),
          durEl,
          h('div', { class: 'syn-actions' },
            h('button', { class: 'icon-btn', title: 'Naik', 'aria-label': 'Naikkan', disabled: i === 0, onClick: function () { move(i, i - 1); } }, icon('up', 18)),
            h('button', { class: 'icon-btn', title: 'Turun', 'aria-label': 'Turunkan', disabled: i === rowsCount() - 1, onClick: function () { move(i, i + 1); } }, icon('down', 18)),
            h('button', { class: 'icon-btn', title: 'Edit', 'aria-label': 'Edit sintaks', onClick: function () { editSyntax(sx, false, function (d) { P.syntaxes[i] = d; save(); draw(); }); } }, icon('edit', 18)),
            h('button', { class: 'icon-btn', title: 'Gandakan', 'aria-label': 'Gandakan sintaks', onClick: function () { var c = JSON.parse(JSON.stringify(sx)); c.id = Store.uid('s'); P.syntaxes.splice(i + 1, 0, c); save(); draw(); } }, icon('copy', 18)),
            h('button', { class: 'icon-btn danger', title: 'Hapus', 'aria-label': 'Hapus sintaks', onClick: function () {
              UI.confirm('Hapus sintaks "' + sx.name + '"?', { danger: true, ok: 'Hapus' }).then(function (ok) { if (ok) { P.syntaxes.splice(i, 1); save(); draw(); } });
            } }, icon('trash', 18))));
        row.addEventListener('dragstart', function (e) { dragIdx = i; row.classList.add('dragging'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); } catch (x) {} });
        row.addEventListener('dragend', function () { row.classList.remove('dragging'); });
        row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('over'); });
        row.addEventListener('dragleave', function () { row.classList.remove('over'); });
        row.addEventListener('drop', function (e) { e.preventDefault(); row.classList.remove('over'); if (dragIdx != null) move(dragIdx, i); dragIdx = null; });
        list.appendChild(row);
      });
      if (!P.syntaxes.length) list.appendChild(h('p', { class: 'muted pad' }, 'Belum ada sintaks. Tambahkan sintaks pertama.'));
      holder.appendChild(h('section', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', null, 'Daftar Sintaks (' + P.syntaxes.length + ')'),
          h('button', { class: 'btn primary', onClick: function () {
            var phase = P.syntaxes.length ? P.syntaxes[P.syntaxes.length - 1].phase : 'Inti';
            editSyntax(Store.normSyntax({ name: '', phase: phase, durationSec: 180 }), true, function (d) { P.syntaxes.push(d); save(); draw(); });
          } }, icon('plus', 18), 'Tambah Sintaks')),
        list));
      updateSummary();
    }
    draw();
  };
  App.pages.syntax = sp;
})(typeof self !== 'undefined' ? self : this);
