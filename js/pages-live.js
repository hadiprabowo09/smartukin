/* ==========================================================================
   SMART UKIN TIMER — pages-live.js
   Live Timer (mode take video / presentasi) dan Teleprompter.
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App, UI = root.UkinUI, Store = root.UkinStore;
  var h = UI.h, icon = UI.icon, S = App.session;

  function lines(t) { return String(t || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function reqFs(el) { var f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { try { var r = f.call(el); if (r && r.catch) r.catch(function () {}); } catch (e) {} } }
  function exitFs() { var f = document.exitFullscreen || document.webkitExitFullscreen; if (f && fsEl()) { try { var r = f.call(document); if (r && r.catch) r.catch(function () {}); } catch (e) {} } }
  /* true bila fokus ada di kolom isian teks (pintasan keyboard dinonaktifkan).
     Checkbox/radio/slider tidak dihitung agar pintasan tetap jalan setelah mencentang checklist. */
  function typing(e) {
    var t = e.target; if (!t) return false;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return true;
    if (t.tagName === 'INPUT') return ['checkbox', 'radio', 'range', 'button'].indexOf(t.type) < 0;
    return false;
  }
  /* Spasi/Enter pada tombol atau tautan yang sedang fokus dibiarkan memicu klik bawaan (hindari aksi ganda) */
  function onButton(e) { var t = e.target; return t && (t.tagName === 'BUTTON' || t.tagName === 'A') && (e.key === ' ' || e.key === 'Enter'); }

  var STATUS_TXT = { idle: 'SIAP', running: 'BERJALAN', paused: 'DIJEDA', finished: 'SELESAI' };

  /* ======================================================================
     LIVE TIMER
     ====================================================================== */
  var live = { title: 'Live Timer' };
  live.render = function (view) {
    var R = live.R = { key: '', autoFired: false };
    live.view = view;
    if (!S.engine.hasSession()) {
      view.appendChild(h('section', { class: 'card empty' }, h('h2', null, 'Belum ada proyek'),
        h('p', null, 'Buat proyek atau pilih template terlebih dahulu agar Live Timer dapat digunakan.'),
        h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/new' }, 'Buat Proyek'), h('a', { class: 'btn', href: '#/templates' }, 'Template'))));
      live.R = null; return;
    }
    var st = Store.settings();
    var root_ = h('div', { class: 'live' });
    live.root = root_;

    /* --- atas --- */
    R.title = h('div', { class: 'lv-title' });
    R.totalRemain = h('div', { class: 'lv-total-num' }, '--:--');
    R.elapsed = h('b', null, '00:00'); R.remain = h('b', null, '--:--'); R.est = h('b', null, '—'); R.pct = h('b', null, '0%');
    R.totalBar = h('div', { class: 'bar-fill' });
    R.status = h('span', { class: 'lv-status' }, '');
    R.exitPresent = h('button', { class: 'present-exit', title: 'Keluar dari mode presentasi (Esc)', onClick: function () { setPresent(false); } }, icon('minimize', 18), 'Keluar');
    var top = h('div', { class: 'lv-top' },
      h('div', { class: 'lv-top-l' }, R.title, h('div', { class: 'lv-sub' }, R.status)),
      h('div', { class: 'lv-top-c' }, h('div', { class: 'lv-cap' }, 'TOTAL WAKTU'), R.totalRemain),
      h('div', { class: 'lv-top-r' },
        h('div', null, 'Berjalan ', R.elapsed), h('div', null, 'Tersisa ', R.remain), h('div', null, 'Estimasi selesai ', R.est), h('div', null, 'Kemajuan ', R.pct)),
      h('div', { class: 'progress total' }, R.totalBar), R.exitPresent);

    /* --- tengah (kiri) --- */
    R.phase = h('span', { class: 'chip navy' }); R.idx = h('span', { class: 'lv-idx' });
    R.synName = h('div', { class: 'lv-synname' });
    R.synTime = h('div', { class: 'lv-syntime', id: 'liveSynTime' }, '--:--');
    R.synCap = h('div', { class: 'lv-cap' }, 'SISA WAKTU SINTAKS');
    R.synBar = h('div', { class: 'bar-fill' });
    R.next = h('div', { class: 'lv-next' });
    R.sched = h('div', { class: 'lv-sched' });
    R.media = h('div', { class: 'lv-media' });
    R.check = h('div', { class: 'lv-check' });
    var left = h('div', { class: 'lv-left' },
      h('div', { class: 'lv-synhead' }, R.idx, R.phase), R.synName, R.synCap, R.synTime,
      h('div', { class: 'progress syn' }, R.synBar), R.next, R.sched, R.media, R.check);

    /* --- panduan --- */
    R.guide = h('div', { class: 'lv-guide' });
    var main = h('div', { class: 'lv-main' }, left, R.guide);

    /* --- kontrol --- */
    var btn = function (cls, ic, label, fn, extra) { return h('button', Object.assign({ class: 'btn lg ' + cls, type: 'button', onClick: fn }, extra || {}), icon(ic, 26), h('span', null, label)); };
    R.bStart = btn('go', 'play', 'MULAI', function () { S.begin(); });
    R.bPause = btn('amber', 'pause', 'JEDA', function () { S.pause(); });
    R.bResume = btn('go', 'play', 'LANJUTKAN', function () { S.resume(); });
    R.bPrev = btn('', 'prev', 'SEBELUMNYA', function () { S.prev(); });
    R.bNext = btn('primary', 'next', 'SINTAKS BERIKUTNYA', function () { S.next(); });
    R.bRepeat = btn('', 'repeat', 'ULANGI SINTAKS', function () { S.repeat(); });
    R.bFinish = btn('danger', 'stop', 'SELESAIKAN', function () {
      UI.confirm('Selesaikan kegiatan sekarang? Rekap waktu akan disimpan ke Riwayat.', { title: 'Selesaikan kegiatan', ok: 'Selesaikan', danger: true }).then(function (ok) { if (ok) S.finish(); });
    });
    var primary = h('div', { class: 'lv-ctl-main' }, R.bStart, R.bPause, R.bResume, R.bPrev, R.bNext, R.bRepeat, R.bFinish);

    var sm = function (ic, label, fn, title) { return h('button', { class: 'btn sm tool', type: 'button', title: title || label, onClick: fn }, icon(ic, 16), h('span', null, label)); };
    R.bAuto = sm('clock', 'Otomatis', function () { S.setAuto(!S.engine.s.auto); }, 'Pindah sintaks otomatis / manual');
    R.bSilent = sm('bell', 'Suara', function () {
      var s = Store.settings(); Store.patchSettings({ silent: !s.silent }); updateTools();
      UI.toast(!s.silent ? 'Mode senyap aktif (tanpa suara, indikator visual tetap tampil).' : 'Suara alarm aktif.', 'ok');
    }, 'Mode senyap');
    var tools = h('div', { class: 'lv-ctl-tools' },
      R.bAuto, R.bSilent,
      sm('minus', '30 dtk', function () { S.adjustSyntax(-30); }, 'Kurangi 30 detik pada sintaks ini'),
      sm('plus', '30 dtk', function () { S.adjustSyntax(30); }, 'Tambah 30 detik pada sintaks ini'),
      sm('clock', 'Atur waktu', adjustModal, 'Tambah/kurangi waktu sintaks & total'),
      sm('skip', 'Lewati', function () { S.skip(); }, 'Lewati sintaks ini (ditandai dilewati)'),
      sm('list', 'Daftar sintaks', jumpModal, 'Loncat ke sintaks tertentu'),
      sm('type', 'Ukuran teks', function () {
        var order = ['normal', 'large', 'xl'], cur = Store.settings().guideSize, nx = order[(order.indexOf(cur) + 1) % 3];
        Store.patchSettings({ guideSize: nx }); App.applySettings(); UI.toast('Ukuran teks panduan: ' + { normal: 'Normal', large: 'Besar', xl: 'Sangat besar' }[nx], 'ok', 1500);
      }, 'Ukuran teks panduan'),
      sm('maximize', 'Presentasi', function () { setPresent(!document.body.classList.contains('present')); }, 'Mode layar penuh / presentasi (F)'),
      sm('x', 'Reset sesi', function () {
        UI.confirm('Hapus sesi timer ini tanpa menyimpan rekap?', { title: 'Reset sesi', ok: 'Reset', danger: true }).then(function (ok) { if (ok) { S.discard(); App.go('live'); } });
      }, 'Buang sesi tanpa rekap'));

    R.overlay = h('div', { class: 'lv-done', hidden: true });
    root_.appendChild(top); root_.appendChild(main); root_.appendChild(h('div', { class: 'lv-controls' }, primary, tools)); root_.appendChild(R.overlay);
    view.appendChild(root_);

    /* kunci keyboard */
    R.keys = function (e) {
      if (typing(e) || onButton(e) || UI.hasModal() || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (k === ' ') { e.preventDefault(); var s = S.status(); if (s === 'running' || s === 'paused') S.toggle(); else S.begin(); }
      else if (k === 'ArrowRight' || k === 'n' || k === 'N') { S.next(); }
      else if (k === 'ArrowLeft' || k === 'p' || k === 'P') { S.prev(); }
      else if (k === 'r' || k === 'R') { S.repeat(); }
      else if (k === 'f' || k === 'F') { setPresent(!document.body.classList.contains('present')); }
      else if (k === 'm' || k === 'M') { R.bSilent.click(); }
    };
    document.addEventListener('keydown', R.keys);
    R.fsChange = function () { if (!fsEl() && document.body.classList.contains('present')) document.body.classList.remove('present'); };
    document.addEventListener('fullscreenchange', R.fsChange); document.addEventListener('webkitfullscreenchange', R.fsChange);
    updateTools();
    live.onTick(S.vm());
  };

  function setPresent(on) {
    document.body.classList.toggle('present', !!on);
    if (on) reqFs(document.documentElement); else exitFs();
  }

  function updateTools() {
    var R = live.R; if (!R || !S.engine.s) return;
    var auto = S.engine.s.auto, silent = Store.settings().silent;
    var a = R.bAuto; UI.clear(a).append(icon('clock', 16), h('span', null, auto ? 'Otomatis' : 'Manual'));
    a.classList.toggle('on', auto); a.setAttribute('aria-pressed', auto ? 'true' : 'false');
    var b = R.bSilent; UI.clear(b).append(icon(silent ? 'bellOff' : 'bell', 16), h('span', null, silent ? 'Senyap' : 'Suara'));
    b.classList.toggle('on', silent); b.setAttribute('aria-pressed', silent ? 'true' : 'false');
  }

  function adjustModal() {
    if (!S.isActive()) { UI.toast('Mulai timer terlebih dahulu.', 'warn'); return; }
    var mk = function (label, fn) { return h('button', { class: 'btn', type: 'button', onClick: fn }, label); };
    var body = h('div', { class: 'form' },
      h('h4', null, 'Waktu sintaks yang sedang berjalan'),
      h('div', { class: 'row' }, mk('−5 mnt', function () { S.adjustSyntax(-300); }), mk('−1 mnt', function () { S.adjustSyntax(-60); }), mk('−30 dtk', function () { S.adjustSyntax(-30); }),
        mk('+30 dtk', function () { S.adjustSyntax(30); }), mk('+1 mnt', function () { S.adjustSyntax(60); }), mk('+5 mnt', function () { S.adjustSyntax(300); })),
      h('h4', null, 'Total waktu kegiatan'),
      h('div', { class: 'row' }, mk('−5 mnt', function () { S.adjustTotal(-300); }), mk('−1 mnt', function () { S.adjustTotal(-60); }),
        mk('+1 mnt', function () { S.adjustTotal(60); }), mk('+5 mnt', function () { S.adjustTotal(300); })),
      h('small', { class: 'hint' }, 'Perubahan hanya berlaku pada sesi ini dan tidak mengubah proyek tersimpan.'));
    UI.modal({ title: 'Atur waktu', body: body, buttons: [{ label: 'Selesai', cls: 'primary' }] });
  }
  function jumpModal() {
    var e = S.engine, s = e.s; if (!s) return;
    var cur = S.status() === 'idle' ? -1 : s.index;
    var list = h('div', { class: 'jump-list' });
    var m;
    s.cfg.syntaxes.forEach(function (sx, i) {
      var r = s.recs[i], mark = r.status === 'done' ? '✓' : r.status === 'skipped' ? '↷' : '';
      list.appendChild(h('button', { class: 'jump-item' + (i === cur ? ' cur' : ''), type: 'button', onClick: function () {
        if (!S.isActive()) { UI.toast('Mulai timer terlebih dahulu untuk berpindah sintaks.', 'warn'); return; }
        S.jump(i); m.close();
      } }, h('span', { class: 'jn' }, (i + 1) + '.'), h('span', { class: 'jt' }, sx.name), h('span', { class: 'jd' }, UI.fmtSecs(sx.durationSec)), h('span', { class: 'jm' }, mark)));
    });
    m = UI.modal({ title: 'Loncat ke sintaks', body: list, buttons: [{ label: 'Tutup', cls: 'ghost' }] });
  }

  function guideCard(cls, q, content, asQuote) {
    var arr = lines(content), body;
    if (!arr.length) body = h('p', { class: 'empty-line' }, '—');
    else if (asQuote) body = h('div', null, arr.map(function (x) { return h('p', { class: 'say' }, x); }));
    else body = h('ul', null, arr.map(function (x) { return h('li', null, x); }));
    return h('section', { class: 'g-card ' + cls }, h('h3', null, q), body);
  }

  function renderGuide(vm) {
    var R = live.R, d = vm.syn.data;
    UI.clear(R.guide);
    var notes = lines(d.notes);
    var watch = notes.slice();
    if (lines(d.indicator).length) watch = watch.concat(lines(d.indicator).map(function (x) { return 'Indikator: ' + x; }));
    R.guide.appendChild(guideCard('g-do', 'APA YANG HARUS SAYA LAKUKAN?', d.teacherActivity));
    R.guide.appendChild(guideCard('g-say', 'APA YANG HARUS SAYA UCAPKAN?', d.teacherSay, true));
    R.guide.appendChild(guideCard('g-stu', 'APA YANG HARUS DILAKUKAN MURID?', d.studentActivity));
    R.guide.appendChild(guideCard('g-note', 'APA YANG HARUS SAYA PERHATIKAN?', watch.join('\n')));
    R.guide.scrollTop = 0;
    /* media + checklist */
    UI.clear(R.media);
    if (d.media) R.media.appendChild(h('div', null, h('b', null, 'Media/alat: '), d.media));
    UI.clear(R.check);
    if (d.checklist && d.checklist.length) {
      R.check.appendChild(h('div', { class: 'lv-cap' }, 'CHECKLIST'));
      d.checklist.forEach(function (c, i) {
        var key = d.id + ':' + i;
        var cb = h('input', { type: 'checkbox', checked: !!S.checks[key], onChange: function () { S.toggleCheck(key); lbl.classList.toggle('done', cb.checked); } });
        var lbl = h('label', { class: 'check big' + (S.checks[key] ? ' done' : '') }, cb, h('span', null, c.text));
        R.check.appendChild(lbl);
      });
    }
  }

  function renderDone(vm) {
    var R = live.R; UI.clear(R.overlay);
    var rep = S.engine.report();
    R.overlay.appendChild(h('div', { class: 'card done-card' }, h('h2', null, '✓ Kegiatan selesai'),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Direncanakan'), h('div', { class: 'stat-val' }, UI.fmtSecs(rep.plannedMs / 1000))),
        h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Aktual'), h('div', { class: 'stat-val' }, UI.fmtSecs(rep.actualMs / 1000))),
        h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Selisih'), h('div', { class: 'stat-val' }, UI.fmtSigned(rep.diffMs))),
        h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, 'Sintaks selesai'), h('div', { class: 'stat-val' }, rep.counts.done + '/' + rep.counts.total))),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary lg', onClick: function () { App.go('report', { id: S.reportId || '' }); } }, icon('chart'), 'Lihat Rekap Waktu'),
        h('button', { class: 'btn lg', onClick: function () { S.restart(); } }, icon('repeat'), 'Siapkan ulang'),
        h('button', { class: 'btn lg ghost', onClick: function () { R.overlay.hidden = true; } }, 'Tutup'))));
  }

  live.onTick = function (vm) {
    var R = live.R; if (!R || !vm) return;
    var set = function (el, t) { if (el.textContent !== t) el.textContent = t; };
    var cfg = S.engine.s.cfg;
    set(R.title, cfg.title);
    var finished = vm.status === 'finished', idle = vm.status === 'idle', inGap = vm.phase === 'gap' && !finished;

    /* total */
    set(R.totalRemain, UI.fmtRemain(vm.total.remainingMs));
    R.totalRemain.className = 'lv-total-num ' + vm.total.color;
    set(R.elapsed, UI.fmtElapsed(vm.total.elapsedMs)); set(R.remain, UI.fmtRemain(vm.total.remainingMs));
    set(R.pct, Math.round(vm.total.pct) + '%');
    set(R.est, vm.estimatedEnd ? UI.fmtClockTime(vm.estimatedEnd) : (cfg.endTime && idle ? cfg.endTime : '—'));
    R.totalBar.style.width = vm.total.pct + '%'; R.totalBar.className = 'bar-fill ' + vm.total.color;
    R.status.className = 'lv-status ' + vm.status; set(R.status, STATUS_TXT[vm.status] || '');

    /* sintaks */
    var key = vm.syn.id + ':' + vm.phase;
    if (key !== R.key) {
      R.key = key;
      renderGuide(vm);
      set(R.idx, 'Sintaks ' + (vm.index + 1) + ' / ' + vm.count);
      set(R.phase, vm.syn.data.phase || ''); R.phase.hidden = !vm.syn.data.phase;
    }
    set(R.synName, (inGap ? 'Bersiap: ' : '') + vm.syn.name);
    if (inGap) {
      set(R.synCap, 'JEDA ANTAR-SINTAKS'); set(R.synTime, UI.fmtRemain(vm.gap.remainingMs));
      R.synTime.className = 'lv-syntime ok' + (R.synTime.textContent.length > 5 ? ' long' : ''); R.synBar.style.width = (vm.gap.elapsedMs / vm.gap.plannedMs * 100) + '%'; R.synBar.className = 'bar-fill ok';
    } else {
      set(R.synCap, vm.syn.over ? 'WAKTU SINTAKS LEWAT' : 'SISA WAKTU SINTAKS');
      set(R.synTime, finished ? '00:00' : UI.fmtRemain(vm.syn.remainingMs));
      R.synTime.className = 'lv-syntime ' + vm.syn.color + (R.synTime.textContent.length > 5 ? ' long' : '');
      R.synBar.style.width = vm.syn.pct + '%'; R.synBar.className = 'bar-fill ' + vm.syn.color;
    }
    set(R.next, vm.next ? 'Berikutnya: ' + vm.next.name + ' (' + UI.fmtSecs(vm.next.durationSec) + ')' : (finished ? '' : 'Ini sintaks terakhir'));

    /* jadwal mulai otomatis */
    var P = Store.activeProject(), sched = '';
    if (idle && P && P.autoStartAtSchedule && P.startTime && P.id === S.projectId) {
      var mins = UI.hmToMin(P.startTime), now = new Date(), tgt = new Date(now); tgt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      var diff = tgt - now;
      if (diff > 0) sched = 'Mulai otomatis pukul ' + P.startTime + ' (dalam ' + UI.fmtSecs(Math.ceil(diff / 1000)) + ')';
      else if (diff > -15000 && !R.autoFired) { R.autoFired = true; S.begin(); }
    }
    set(R.sched, sched);

    /* tombol */
    var active = vm.status === 'running' || vm.status === 'paused';
    R.bStart.hidden = active; R.bPause.hidden = vm.status !== 'running'; R.bResume.hidden = vm.status !== 'paused';
    var lbl = R.bStart.querySelector('span:last-child'); var want = finished ? 'MULAI ULANG' : 'MULAI';
    if (lbl && lbl.textContent !== want) lbl.textContent = want;
    [R.bPrev, R.bNext, R.bRepeat, R.bFinish].forEach(function (b) { b.disabled = !active; });
    R.bRepeat.disabled = !active || inGap;
    updateToolsMaybe();

    document.body.classList.toggle('live-running', vm.status === 'running');
    if (finished) { if (R.overlay.hidden && !R.doneShown) { renderDone(vm); R.overlay.hidden = false; R.doneShown = true; } }
    else { R.doneShown = false; R.overlay.hidden = true; }
  };
  var lastAuto = null, lastSilent = null;
  function updateToolsMaybe() {
    var a = S.engine.s && S.engine.s.auto, sl = Store.settings().silent;
    if (a !== lastAuto || sl !== lastSilent) { lastAuto = a; lastSilent = sl; updateTools(); }
  }
  live.destroy = function () {
    var R = live.R; if (!R) return;
    document.removeEventListener('keydown', R.keys);
    document.removeEventListener('fullscreenchange', R.fsChange); document.removeEventListener('webkitfullscreenchange', R.fsChange);
    document.body.classList.remove('present', 'live-running'); exitFs(); lastAuto = lastSilent = null; live.R = null;
  };
  App.pages.live = live;

  /* ======================================================================
     TELEPROMPTER
     ====================================================================== */
  var tp = { title: 'Teleprompter' };
  tp.render = function (view) {
    var T = tp.T = { preview: 0, key: '', raf: null, scrolling: false, last: 0 };
    if (!S.engine.hasSession()) {
      view.appendChild(h('section', { class: 'card empty' }, h('h2', null, 'Belum ada proyek'), h('p', null, 'Buat proyek atau pilih template terlebih dahulu.'),
        h('a', { class: 'btn primary', href: '#/new' }, 'Buat Proyek')));
      tp.T = null; return;
    }
    var st = Store.settings();
    var wrap = h('div', { class: 'tp' }); T.wrap = wrap;
    T.body = h('div', { class: 'tp-body', tabindex: '0' });
    T.synTime = h('b', null, '--:--'); T.totalTime = h('b', null, '--:--'); T.pos = h('span', { class: 'tp-pos' });
    function apply() {
      var s = Store.settings();
      T.body.style.setProperty('--tp-fs', s.tpFont + 'px'); T.body.style.setProperty('--tp-lh', s.tpLine);
      T.body.classList.toggle('mirror', !!s.tpMirror);
    }
    var fontR = h('input', { type: 'range', min: 24, max: 140, step: 2, value: st.tpFont, 'aria-label': 'Ukuran huruf', onInput: function () { Store.patchSettings({ tpFont: +fontR.value }); apply(); } });
    var lhR = h('input', { type: 'range', min: 1.1, max: 2.4, step: 0.1, value: st.tpLine, 'aria-label': 'Jarak antarbaris', onInput: function () { Store.patchSettings({ tpLine: +lhR.value }); apply(); } });
    var spR = h('input', { type: 'range', min: 0, max: 200, step: 5, value: 40, 'aria-label': 'Kecepatan gulir' });
    var mir = h('input', { type: 'checkbox', checked: st.tpMirror, onChange: function () { Store.patchSettings({ tpMirror: mir.checked }); apply(); } });
    var modeSel = h('select', { 'aria-label': 'Mode', onChange: function () { Store.patchSettings({ tpMode: modeSel.value }); T.key = ''; tp.onTick(S.vm()); } },
      h('option', { value: 'current', selected: st.tpMode === 'current' }, 'Sintaks saat ini'), h('option', { value: 'all', selected: st.tpMode === 'all' }, 'Seluruh naskah'));
    T.scrollBtn = h('button', { class: 'btn sm', type: 'button', onClick: function () { T.scrolling = !T.scrolling; T.last = 0; updateScrollBtn(); if (T.scrolling) loop(); } });
    function updateScrollBtn() { UI.clear(T.scrollBtn).append(icon(T.scrolling ? 'pause' : 'play', 16), T.scrolling ? 'Hentikan gulir' : 'Gulir otomatis'); }
    updateScrollBtn();
    function loop(ts) {
      if (!T.scrolling || !tp.T) return;
      if (ts) { if (T.last) T.body.scrollTop += (ts - T.last) / 1000 * (+spR.value); T.last = ts; }
      T.raf = requestAnimationFrame(loop);
    }
    function go(dir) {
      if (S.isActive()) { dir > 0 ? S.next() : S.prev(); }
      else { var n = S.engine.s.cfg.syntaxes.length; T.preview = Math.max(0, Math.min(n - 1, T.preview + dir)); T.key = ''; tp.onTick(S.vm()); }
    }
    var bar = h('div', { class: 'tp-bar' },
      h('div', { class: 'tp-bar-row' },
        h('button', { class: 'btn sm', onClick: function () { go(-1); } }, icon('prev', 16), 'Sebelumnya'), T.pos,
        h('button', { class: 'btn sm primary', onClick: function () { go(1); } }, 'Berikutnya', icon('next', 16)),
        h('div', { class: 'tp-times' }, 'Sintaks ', T.synTime, '  ·  Total ', T.totalTime),
        h('button', { class: 'btn sm', onClick: function () {
          var s = S.status(); if (s === 'running' || s === 'paused') S.toggle(); else S.begin();
        } }, icon('play', 16), h('span', { id: 'tpToggle' }, 'Mulai/Jeda')),
        h('button', { class: 'btn sm', onClick: function () { if (fsEl()) exitFs(); else reqFs(wrap); } }, icon('maximize', 16), 'Layar penuh')),
      h('div', { class: 'tp-bar-row opts' },
        h('label', null, 'Mode ', modeSel), h('label', null, 'Huruf ', fontR), h('label', null, 'Jarak baris ', lhR),
        h('label', null, 'Kecepatan ', spR), T.scrollBtn, h('label', { class: 'check' }, mir, 'Cermin')));
    wrap.appendChild(bar); wrap.appendChild(T.body); view.appendChild(wrap);
    apply();
    T.keys = function (e) {
      if (typing(e) || onButton(e) || UI.hasModal()) return;
      if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ') { e.preventDefault(); T.scrolling = !T.scrolling; T.last = 0; updateScrollBtn(); if (T.scrolling) loop(); }
    };
    document.addEventListener('keydown', T.keys);
    tp.onTick(S.vm());
  };

  function sectionsFor(d) {
    var out = [];
    var add = function (t, txt, quote) { var a = lines(txt); if (a.length) out.push([t, a, quote]); };
    add('LANGKAH GURU', d.teacherActivity); add('KALIMAT GURU', d.teacherSay, true); add('AKTIVITAS MURID', d.studentActivity);
    add('TUJUAN', d.objective); add('ASESMEN', d.indicator); add('CATATAN', d.notes);
    if (d.media) out.push(['MEDIA / ALAT', [d.media]]);
    return out;
  }
  function drawSyntax(sx, i, isCur) {
    var box = h('section', { class: 'tp-syn' + (isCur ? ' current' : ''), 'data-i': i });
    box.appendChild(h('h2', null, (i + 1) + '. ' + sx.name + ' ', h('small', null, UI.fmtSecs(sx.durationSec))));
    var secs = sectionsFor(sx);
    if (!secs.length) box.appendChild(h('p', { class: 'empty-line' }, '(belum ada panduan — isi di Pengaturan Sintaks)'));
    secs.forEach(function (s) {
      box.appendChild(h('h4', null, s[0]));
      if (s[2]) s[1].forEach(function (x) { box.appendChild(h('p', { class: 'say' }, x)); });
      else box.appendChild(h('ul', null, s[1].map(function (x) { return h('li', null, x); })));
    });
    return box;
  }

  tp.onTick = function (vm) {
    var T = tp.T; if (!T || !vm) return;
    var set = function (el, t) { if (el.textContent !== t) el.textContent = t; };
    var syns = S.engine.s.cfg.syntaxes, mode = Store.settings().tpMode;
    var active = vm.status === 'running' || vm.status === 'paused';
    var idx = active ? vm.index : (vm.status === 'finished' ? vm.index : T.preview);
    var key = mode + ':' + idx + ':' + syns.length + ':' + (mode === 'all' ? vm.index : '');
    if (key !== T.key) {
      T.key = key; UI.clear(T.body);
      if (mode === 'all') {
        syns.forEach(function (sx, i) { T.body.appendChild(drawSyntax(sx, i, i === (active ? vm.index : idx))); });
        var curEl = T.body.querySelector('.tp-syn.current'); if (curEl) T.body.scrollTop = curEl.offsetTop - 12;
      } else {
        T.body.appendChild(drawSyntax(syns[idx], idx, true)); T.body.scrollTop = 0;
      }
    }
    set(T.pos, 'Sintaks ' + (idx + 1) + ' / ' + syns.length);
    set(T.synTime, vm.status === 'idle' ? UI.fmtSecs(syns[idx].durationSec) : UI.fmtRemain(vm.syn.remainingMs));
    T.synTime.className = vm.status === 'idle' ? '' : vm.syn.color;
    set(T.totalTime, UI.fmtRemain(vm.total.remainingMs)); T.totalTime.className = vm.total.color;
    var tg = document.getElementById('tpToggle');
    if (tg) set(tg, vm.status === 'running' ? 'Jeda' : vm.status === 'paused' ? 'Lanjutkan' : 'Mulai');
  };
  tp.destroy = function () {
    var T = tp.T; if (!T) return;
    T.scrolling = false; if (T.raf) cancelAnimationFrame(T.raf);
    document.removeEventListener('keydown', T.keys); exitFs(); tp.T = null;
  };
  App.pages.teleprompter = tp;
})(typeof self !== 'undefined' ? self : this);
