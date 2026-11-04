/* ==========================================================================
   SMART UKIN TIMER — app.js
   Kerangka aplikasi: shell, router, kontrol sesi timer, alarm/umpan balik,
   wake lock, status online/offline, registrasi Service Worker.
   ========================================================================== */
(function (root) {
  'use strict';

  var UI = root.UkinUI, Store = root.UkinStore, Audio = root.UkinAudio;
  var h = UI.h, $ = UI.$;

  var App = root.App = {
    pages: {}, current: null, currentName: null,
    offline: { state: 'checking', info: null }, installPrompt: null
  };

  var NAV = [
    ['dashboard', 'Dashboard', 'home'],
    ['new', 'Buat Proyek Baru', 'plus'],
    ['templates', 'Template Pembelajaran', 'layout'],
    ['syntax', 'Pengaturan Sintaks', 'list'],
    ['live', 'Live Timer', 'play'],
    ['teleprompter', 'Teleprompter', 'type'],
    ['history', 'Riwayat Kegiatan', 'history'],
    ['report', 'Rekap Waktu', 'chart'],
    ['backup', 'Backup dan Restore', 'download'],
    ['settings', 'Pengaturan Aplikasi', 'settings']
  ];
  App.NAV = NAV;

  /* ======================================================================
     Pengaturan tampilan
     ====================================================================== */
  App.applySettings = function () {
    var s = Store.settings(), d = document.documentElement;
    d.setAttribute('data-theme', s.theme);
    d.setAttribute('data-guide', s.guideSize);
    d.style.setProperty('--guide-lh', String(s.lineHeight));
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', s.theme === 'dark' ? '#0a1730' : s.theme === 'contrast' ? '#000000' : '#0b2545');
  };

  /* ======================================================================
     Konfigurasi sesi dari proyek
     ====================================================================== */
  function cfgFromProject(p) {
    var st = Store.settings();
    return {
      projectId: p.id, title: p.title, subject: p.subject, grade: p.grade, model: p.model,
      totalSec: p.totalSec, autoMode: p.autoMode, gapSec: p.gapSec,
      warnings: p.warnings.slice(), warnEnd: p.warnEnd, overtimeRemindSec: st.overtimeRemindSec,
      startTime: p.startTime, endTime: p.endTime,
      syntaxes: p.syntaxes.map(function (s) { return JSON.parse(JSON.stringify(s)); })
    };
  }
  App.cfgFromProject = cfgFromProject;

  /* ======================================================================
     Alarm, banner & umpan balik
     ====================================================================== */
  var bannerEl = null, bannerTimer = null, flashTimer = null;
  function banner(text, kind) {
    if (!bannerEl) { bannerEl = h('div', { class: 'banner', role: 'alert' }); document.body.appendChild(bannerEl); }
    bannerEl.className = 'banner show ' + (kind || '');
    bannerEl.textContent = text;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { bannerEl.className = 'banner'; }, 4500);
  }
  function flash(kind) {
    if (!Store.settings().flash) return;
    var b = document.body;
    b.classList.remove('flash-ok', 'flash-warn', 'flash-danger');
    void b.offsetWidth;
    b.classList.add('flash-' + kind);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { b.classList.remove('flash-ok', 'flash-warn', 'flash-danger'); }, 1600);
  }
  function warnLabel(sec) {
    if (sec >= 60 && sec % 60 === 0) return (sec / 60) + ' menit';
    if (sec > 60) return Math.floor(sec / 60) + ' menit ' + (sec % 60) + ' detik';
    return sec + ' detik';
  }
  App.warnLabel = warnLabel;

  function notify(sound, text, kind) {
    var st = Store.settings();
    banner(text, kind); flash(kind);
    if (sound) Audio.playEvent(sound, st);
    if (st.vibrate && !st.silent) Audio.vibrate(kind === 'danger' ? [200, 100, 200, 100, 200] : [150]);
  }

  function handleEvent(ev) {
    var vm = null;
    switch (ev.type) {
      case 'syntax_end':
        var nm = (S.engine.s.cfg.syntaxes[ev.index] || {}).name || '';
        notify('syntax_end', 'Waktu sintaks habis: ' + nm, 'ok'); break;
      case 'total_warn':
        notify('total_warn', 'Sisa waktu total ' + warnLabel(ev.thr), 'warn'); break;
      case 'total_end':
        if (ev.alert) notify('total_end', 'Waktu total telah habis', 'danger');
        else { banner('Waktu total telah habis', 'danger'); flash('danger'); }
        break;
      case 'overtime':
        notify('overtime', 'Melewati target waktu: +' + UI.fmtSecs(Math.floor(ev.overMs / 1000)), 'danger'); break;
      case 'gap_start':
        banner('Jeda sebentar sebelum sintaks berikutnya', 'ok'); break;
      case 'finished':
        S.recordHistory(); releaseWake();
        notify('syntax_end', 'Kegiatan selesai', 'ok'); break;
      default: break;
    }
    S.dirty = true;
  }

  /* ======================================================================
     Wake Lock (layar tetap menyala saat timer berjalan)
     ====================================================================== */
  var wake = null;
  function requestWake() {
    if (!Store.settings().wakeLock || !navigator.wakeLock || wake) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wake = l; l.addEventListener('release', function () { wake = null; });
    }).catch(function () {});
  }
  function releaseWake() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }

  /* ======================================================================
     Sesi timer
     ====================================================================== */
  var S = App.session = {
    engine: new root.UkinEngine.Engine({ onEvent: handleEvent }),
    projectId: null, stamp: null, checks: {}, recorded: false, reportId: null, dirty: false, lastSave: 0
  };

  S.save = function () {
    var e = S.engine;
    if (!e.hasSession()) { Store.clearSession(); return; }
    Store.saveSession({
      projectId: S.projectId, stamp: S.stamp, checks: S.checks, recorded: S.recorded, reportId: S.reportId,
      engine: e.serialize(), savedAt: Date.now()
    });
    S.dirty = false; S.lastSave = Date.now();
  };
  S.load = function () {
    var d = Store.session();
    if (!d || !d.engine) return false;
    S.engine.restore(d.engine);
    S.projectId = d.projectId || null; S.stamp = d.stamp || null; S.checks = d.checks || {};
    S.recorded = !!d.recorded; S.reportId = d.reportId || null;
    // sesi berjalan yang ditinggalkan sangat lama (> 3 jam): jeda agar tidak "melompat"
    var rs = S.engine.s && S.engine.s.runSince;
    if (S.engine.status() === 'running' && rs && Date.now() - rs > 3 * 3600 * 1000) {
      S.engine.forcePause(); S.save();
      setTimeout(function () { UI.toast('Sesi lama dijeda otomatis karena aplikasi lama tertutup.', 'warn', 5000); }, 600);
    }
    return true;
  };
  S.status = function () { return S.engine.status(); };
  S.isActive = function () { var s = S.status(); return s === 'running' || s === 'paused'; };
  S.vm = function () { return S.engine.hasSession() ? S.engine.snapshot() : null; };

  function loadIdle(p) {
    S.engine.load(cfgFromProject(p));
    S.projectId = p.id; S.stamp = p.updatedAt; S.checks = {}; S.recorded = false; S.reportId = null;
    S.save();
  }
  /* sinkronkan sesi (saat idle) dengan proyek aktif */
  S.syncIdle = function () {
    var p = Store.activeProject(), st = S.status();
    if (st === 'running' || st === 'paused') return;
    if (!p) { if (st !== 'finished') { S.engine.s = null; S.projectId = null; } return; }
    if (st === 'finished') { if (S.projectId !== p.id) loadIdle(p); return; }
    if (st === 'none' || S.projectId !== p.id || S.stamp !== p.updatedAt) loadIdle(p);
  };
  S.hasProject = function () { return !!Store.activeProject() || S.engine.hasSession(); };

  function act(fn) {
    return function () {
      var r = fn.apply(null, arguments);
      S.save(); App.refresh();
      return r;
    };
  }
  S.begin = act(function () {
    Audio.unlock();
    var p = Store.activeProject();
    if (S.status() === 'finished') { if (p) loadIdle(p); }
    else if (S.status() === 'none' && p) loadIdle(p);
    else S.syncIdle();
    if (!S.engine.hasSession()) return false;
    S.checks = {}; S.recorded = false; S.reportId = null;
    var ok = S.engine.start();
    if (ok) requestWake();
    return ok;
  });
  S.toggle = act(function () {
    Audio.unlock();
    var st = S.status();
    if (st === 'running') { S.engine.pause(); releaseWake(); return true; }
    if (st === 'paused') { S.engine.resume(); requestWake(); return true; }
    return false;
  });
  S.pause = act(function () { var r = S.engine.pause(); releaseWake(); return r; });
  S.resume = act(function () { Audio.unlock(); var r = S.engine.resume(); requestWake(); return r; });
  S.next = act(function () { return S.engine.next(); });
  S.prev = act(function () { return S.engine.prev(); });
  S.skip = act(function () { return S.engine.skip(); });
  S.repeat = act(function () { return S.engine.repeat(); });
  S.jump = act(function (i) { return S.engine.jumpTo(i); });
  S.finish = act(function () { var r = S.engine.finish(); releaseWake(); return r; });
  S.adjustSyntax = act(function (sec) { return S.engine.adjustSyntax(sec); });
  S.adjustTotal = act(function (sec) { return S.engine.adjustTotal(sec); });
  S.setAuto = act(function (v) { S.engine.setAuto(v); });
  S.discard = act(function () {
    releaseWake(); S.engine.s = null; S.projectId = null; S.checks = {}; S.recorded = false; S.reportId = null;
    Store.clearSession(); S.syncIdle();
  });
  S.restart = act(function () {
    var p = Store.activeProject(); if (p) loadIdle(p); else S.engine.reset();
  });
  S.toggleCheck = function (key) {
    S.checks[key] = !S.checks[key]; S.dirty = true; S.save();
  };
  S.recordHistory = function () {
    if (S.recorded || !S.engine.hasSession()) return null;
    var rep = S.engine.report(); rep.projectId = S.projectId;
    var saved = Store.addHistory(rep);
    S.recorded = true; S.reportId = saved.id; S.save();
    UI.toast('Rekap waktu tersimpan di Riwayat Kegiatan.', 'ok');
    return saved;
  };

  /* aktifkan proyek (hentikan sesi yang sedang berjalan bila perlu) */
  App.activateProject = function (id) {
    function go() { Store.setActive(id); S.syncIdle(); }
    if (S.isActive() && S.projectId !== id) {
      return UI.confirm('Sesi timer sedang berjalan/dijeda untuk proyek lain. Hentikan sesi tersebut dan pindah ke proyek ini?',
        { title: 'Pindah proyek', ok: 'Hentikan & pindah', danger: true }).then(function (ok) {
        if (ok) { S.discard(); go(); } return ok;
      });
    }
    go(); return Promise.resolve(true);
  };

  /* ======================================================================
     Ticker
     ====================================================================== */
  var chipEl = null, lastChip = '';
  function updateChip(vm) {
    if (!chipEl) return;
    var txt = '', cls = 'session-chip';
    if (vm && (vm.status === 'running' || vm.status === 'paused')) {
      txt = (vm.status === 'paused' ? '❚❚ ' : '● ') + UI.fmtRemain(vm.total.remainingMs) + ' · ' + (vm.index + 1) + '/' + vm.count;
      cls += ' on ' + vm.total.color;
    }
    var key = txt + cls;
    if (key === lastChip) return; lastChip = key;
    chipEl.className = cls; chipEl.textContent = txt; chipEl.hidden = !txt;
  }
  App.tick = function () {
    var e = S.engine;
    if (e.hasSession()) e.tick();
    var vm = e.hasSession() ? e.snapshot() : null;
    updateChip(vm);
    if (App.current && App.current.onTick) { try { App.current.onTick(vm); } catch (err) { console.error(err); } }
    if (S.status() === 'running' && Date.now() - S.lastSave > 4000) S.save();
    else if (S.dirty) S.save();
  };
  App.refresh = function () { App.tick(); };

  /* ======================================================================
     Shell & router
     ====================================================================== */
  var viewEl, titleEl, sidebarEl, navLinks = {};
  function buildShell() {
    var app = $('#app'); UI.clear(app);
    var brand = h('div', { class: 'brand' },
      h('div', { class: 'brand-mark', 'aria-hidden': 'true' }, UI.icon('clock', 22)),
      h('div', null, h('div', { class: 'brand-name' }, 'SMART UKIN'), h('div', { class: 'brand-sub' }, 'TIMER & Teaching Guide')));
    var nav = h('nav', { 'aria-label': 'Menu utama' });
    NAV.forEach(function (n, i) {
      var a = h('a', { href: '#/' + n[0], class: 'nav-link', 'data-route': n[0] },
        UI.icon(n[2], 20), h('span', null, n[1]));
      navLinks[n[0]] = a; nav.appendChild(a);
    });
    var net = h('div', { class: 'net-box' },
      h('div', { class: 'net-chip', id: 'netChip' }),
      h('div', { class: 'net-ready', id: 'netReady' }));
    sidebarEl = h('aside', { id: 'sidebar', class: 'sidebar' }, brand, nav, net);
    var scrim = h('div', { class: 'scrim', onClick: closeSidebar });
    chipEl = h('a', { href: '#/live', class: 'session-chip', hidden: true, 'aria-label': 'Sesi timer berjalan' });
    titleEl = h('h1', { class: 'page-title' }, '');
    var top = h('header', { class: 'topbar', id: 'topbar' },
      h('button', { class: 'icon-btn menu-btn', 'aria-label': 'Buka menu', onClick: openSidebar }, UI.icon('menu', 24)),
      titleEl, chipEl,
      h('span', { class: 'top-net', id: 'topNet' }));
    viewEl = h('main', { id: 'view', class: 'view', tabindex: '-1' });
    app.appendChild(sidebarEl); app.appendChild(scrim);
    app.appendChild(h('div', { class: 'main-wrap' }, top, viewEl));
    updateNet();
  }
  function openSidebar() { sidebarEl.classList.add('open'); document.body.classList.add('side-open'); }
  function closeSidebar() { sidebarEl.classList.remove('open'); document.body.classList.remove('side-open'); }
  App.closeSidebar = closeSidebar;

  function parseHash() {
    var hsh = (location.hash || '').replace(/^#\/?/, '');
    var qi = hsh.indexOf('?'), name = qi >= 0 ? hsh.slice(0, qi) : hsh, params = {};
    if (qi >= 0) hsh.slice(qi + 1).split('&').forEach(function (kv) {
      var p = kv.split('='); if (p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { name: name || 'dashboard', params: params };
  }
  App.go = function (name, params) {
    var q = '';
    if (params) q = '?' + Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    var target = '#/' + name + q;
    if (location.hash === target) route(); else location.hash = target;
  };

  function route() {
    var r = parseHash(), page = App.pages[r.name];
    if (!page) { r = { name: 'dashboard', params: {} }; page = App.pages.dashboard; }
    if (App.current && App.current.destroy) { try { App.current.destroy(); } catch (e) {} }
    App.current = null; App.currentName = r.name;
    document.body.className = document.body.className.replace(/\bpage-\S+/g, '').trim() +
      ' page-' + r.name;
    document.body.classList.remove('present');
    UI.clear(viewEl);
    Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.toggle('active', k === r.name); });
    var nv = NAV.filter(function (n) { return n[0] === r.name; })[0];
    titleEl.textContent = nv ? nv[1] : '';
    document.title = (nv ? nv[1] + ' · ' : '') + 'SMART UKIN TIMER';
    closeSidebar();
    S.syncIdle();
    App.current = page;
    try { page.render(viewEl, r.params); } catch (e) {
      console.error(e);
      viewEl.appendChild(h('div', { class: 'card error' }, 'Terjadi kesalahan saat membuka halaman: ' + e.message));
    }
    viewEl.scrollTop = 0; window.scrollTo(0, 0);
    App.tick();
  }

  /* ======================================================================
     Online / offline
     ====================================================================== */
  function updateNet() {
    var on = navigator.onLine;
    var c = $('#netChip'), t = $('#topNet'), r = $('#netReady');
    if (c) { c.className = 'net-chip ' + (on ? 'online' : 'offline'); UI.clear(c).append(UI.icon(on ? 'wifi' : 'wifiOff', 16), on ? 'ONLINE' : 'OFFLINE'); }
    if (t) { t.className = 'top-net ' + (on ? 'online' : 'offline'); t.textContent = on ? 'ONLINE' : 'OFFLINE'; }
    if (r) {
      var st = App.offline.state;
      r.className = 'net-ready ' + st;
      r.textContent = st === 'ready' ? '✓ Siap dipakai offline' : st === 'installing' ? 'Menyiapkan mode offline…' :
        st === 'unsupported' ? 'Offline tidak didukung browser ini' : st === 'error' ? 'Mode offline belum siap' : 'Memeriksa mode offline…';
    }
    if (App.current && App.current.onNet) App.current.onNet();
  }
  App.updateNet = updateNet;

  /* ======================================================================
     Service Worker
     ====================================================================== */
  function swStatus(worker) {
    return new Promise(function (resolve) {
      if (!worker) return resolve(null);
      var ch = new MessageChannel(), done = false;
      ch.port1.onmessage = function (e) { done = true; resolve(e.data); };
      try { worker.postMessage({ type: 'STATUS' }, [ch.port2]); } catch (e) { return resolve(null); }
      setTimeout(function () { if (!done) resolve(null); }, 4000);
    });
  }
  App.checkOffline = function () {
    if (!('serviceWorker' in navigator) || !('caches' in root)) {
      App.offline = { state: 'unsupported', info: null }; updateNet(); return Promise.resolve(App.offline);
    }
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg || !reg.active) { App.offline = { state: reg ? 'installing' : 'checking', info: null }; updateNet(); return App.offline; }
      return swStatus(reg.active).then(function (info) {
        if (!info) { App.offline = { state: 'error', info: null }; }
        else App.offline = { state: info.cached >= info.total ? 'ready' : 'installing', info: info };
        updateNet(); return App.offline;
      });
    }).catch(function () { App.offline = { state: 'error', info: null }; updateNet(); return App.offline; });
  };

  function registerSW() {
    if (!('serviceWorker' in navigator)) { App.offline = { state: 'unsupported', info: null }; updateNet(); return; }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      App.offline = { state: 'unsupported', info: null }; updateNet(); return;
    }
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            UI.toast('Versi baru aplikasi siap. Buka Pengaturan Aplikasi untuk menerapkan.', 'ok', 6000);
            App.updateReady = true;
          }
          if (nw.state === 'activated') App.checkOffline();
        });
      });
      navigator.serviceWorker.ready.then(function () { setTimeout(App.checkOffline, 400); });
    }).catch(function () { App.offline = { state: 'error', info: null }; updateNet(); });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'PRECACHED') App.checkOffline();
    });
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (App.updateApplied && !reloading) { reloading = true; location.reload(); }
    });
  }
  App.applyUpdate = function () {
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      if (reg && reg.waiting) { App.updateApplied = true; reg.waiting.postMessage({ type: 'SKIP_WAITING' }); return true; }
      return false;
    });
  };
  App.checkUpdate = function () {
    return navigator.serviceWorker.getRegistration().then(function (reg) { return reg ? reg.update().then(function () { return reg; }) : null; });
  };

  /* ======================================================================
     Seed contoh & start
     ====================================================================== */
  function seedIfEmpty() {
    if (Store.get('seeded', false)) return;
    if (!Store.projects().length) {
      var tpl = root.UkinTemplates.get('tpl-ukin');
      var p = Store.projectFromTemplate(tpl, { title: 'Contoh UKIN PPG (ubah sesuai RPP Anda)' });
      if (p) Store.setActive(p.id);
    }
    Store.set('seeded', true);
  }

  App.start = function () {
    App.applySettings();
    seedIfEmpty();
    buildShell();
    S.load();
    window.addEventListener('hashchange', route);
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); App.installPrompt = e; if (App.current && App.current.onNet) App.current.onNet(); });
    window.addEventListener('appinstalled', function () { App.installPrompt = null; UI.toast('Aplikasi berhasil dipasang.', 'ok'); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { if (S.status() === 'running') requestWake(); App.tick(); }
      else S.save();
    });
    window.addEventListener('pagehide', function () { S.save(); });
    // buka audio pada interaksi pertama
    document.addEventListener('pointerdown', function once() { Audio.unlock(); document.removeEventListener('pointerdown', once); });
    route();
    setInterval(App.tick, 250);
    registerSW();
    if (S.status() === 'running') requestWake();
  };

  document.addEventListener('DOMContentLoaded', App.start);
})(typeof self !== 'undefined' ? self : this);
