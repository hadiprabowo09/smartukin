/* ==========================================================================
   SMART UKIN TIMER — ui.js
   Helper antarmuka: pembuat elemen aman (tanpa innerHTML untuk teks
   pengguna), ikon SVG inline, format waktu, toast, modal, unduh file.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------- pembuat elemen ---------- */
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    if (c instanceof Node) el.appendChild(c); else el.appendChild(document.createTextNode(String(c)));
  }
  function h(tag, attrs) {
    var el = document.createElement(tag), later = null;
    if (attrs) for (var k in attrs) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') later = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
      else if (k === 'html') el.innerHTML = v;       // hanya untuk string tepercaya (ikon)
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    if (later !== null) el.value = later;
    return el;
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* ---------- ikon ---------- */
  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
    prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
    repeat: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    skip: '<polygon points="5 4 13 12 5 20 5 4"/><polygon points="13 4 21 12 13 20 13 4"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    bellOff: '<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    history: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><polyline points="12 7 12 12 15 14"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    up: '<polyline points="18 15 12 9 6 15"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    wifiOff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'
  };
  function icon(name, size) {
    var s = document.createElement('span');
    s.className = 'ico'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
    return s;
  }

  /* ---------- format waktu ---------- */
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtSecs(totalSec) {
    totalSec = Math.max(0, Math.round(totalSec));
    var hh = Math.floor(totalSec / 3600), mm = Math.floor((totalSec % 3600) / 60), ss = totalSec % 60;
    return hh ? hh + ':' + p2(mm) + ':' + p2(ss) : p2(mm) + ':' + p2(ss);
  }
  /* sisa waktu (dibulatkan ke atas); negatif => "+mm:ss" */
  function fmtRemain(ms) {
    if (ms >= 0) return fmtSecs(Math.ceil(ms / 1000));
    return '+' + fmtSecs(Math.floor(-ms / 1000));
  }
  function fmtElapsed(ms) { return fmtSecs(Math.floor(Math.max(0, ms) / 1000)); }
  function fmtSigned(ms) {
    var s = Math.round(ms / 1000);
    return (s > 0 ? '+' : s < 0 ? '-' : '') + fmtSecs(Math.abs(s));
  }
  function fmtMin(sec) {
    var m = Math.floor(sec / 60), s = Math.round(sec % 60);
    if (!m) return s + ' dtk';
    return s ? m + ' mnt ' + s + ' dtk' : m + ' mnt';
  }
  function fmtClockTime(ts) {
    var d = new Date(ts); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  }
  function fmtDateTime(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function hmToMin(hm) { var m = /^(\d{2}):(\d{2})$/.exec(hm || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function minToHm(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return p2(Math.floor(min / 60)) + ':' + p2(min % 60); }

  /* ---------- toast ---------- */
  var toastBox = null;
  function toast(msg, type, ms) {
    if (!toastBox) { toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(toastBox); }
    var t = h('div', { class: 'toast ' + (type || '') }, msg);
    toastBox.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, ms || 3200);
  }

  /* ---------- modal ---------- */
  var openModals = [];
  function modal(o) {
    var overlay = h('div', { class: 'modal-overlay' });
    var box = h('div', { class: 'modal' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || '' });
    var head = h('div', { class: 'modal-head' }, h('h3', null, o.title || ''),
      h('button', { class: 'icon-btn', 'aria-label': 'Tutup', onClick: function () { api.close(); } }, icon('x')));
    var body = h('div', { class: 'modal-body' });
    append(body, o.body);
    var foot = h('div', { class: 'modal-foot' });
    (o.buttons || []).forEach(function (b) {
      foot.appendChild(h('button', {
        class: 'btn ' + (b.cls || ''), type: 'button',
        onClick: function () { var r = b.onClick ? b.onClick(api) : undefined; if (r !== false && b.close !== false) api.close(); }
      }, b.label));
    });
    box.appendChild(head); box.appendChild(body); if ((o.buttons || []).length) box.appendChild(foot);
    overlay.appendChild(box);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay && o.dismissable !== false) api.close(); });
    var api = {
      el: box, body: body,
      close: function () {
        if (!overlay.parentNode) return;
        overlay.parentNode.removeChild(overlay);
        openModals = openModals.filter(function (m) { return m !== api; });
        if (o.onClose) o.onClose();
      }
    };
    document.body.appendChild(overlay); openModals.push(api);
    var first = box.querySelector('input,textarea,select,.btn.primary');
    setTimeout(function () { if (first) first.focus(); }, 30);
    return api;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModals.length) { openModals[openModals.length - 1].close(); e.stopPropagation(); }
  }, true);
  function hasModal() { return openModals.length > 0; }

  function confirmBox(msg, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var done = false;
      modal({
        title: opts.title || 'Konfirmasi', body: h('p', { class: 'confirm-msg' }, msg),
        buttons: [
          { label: opts.cancel || 'Batal', cls: 'ghost', onClick: function () { done = true; resolve(false); } },
          { label: opts.ok || 'Ya', cls: opts.danger ? 'danger' : 'primary', onClick: function () { done = true; resolve(true); } }
        ],
        onClose: function () { if (!done) resolve(false); }
      });
    });
  }

  /* ---------- unduh ---------- */
  function download(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: filename, style: { display: 'none' } });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
  }
  function safeName(s) { return String(s || 'berkas').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50) || 'berkas'; }

  /* ---------- komponen form kecil ---------- */
  /* input durasi menit + detik; onChange(totalSec) */
  function durField(totalSec, onChange, opt) {
    opt = opt || {};
    var m = Math.floor(totalSec / 60), s = totalSec % 60;
    var im = h('input', { type: 'number', min: 0, max: 999, value: m, 'aria-label': 'Menit', inputmode: 'numeric' });
    var is = h('input', { type: 'number', min: 0, max: 59, value: s, 'aria-label': 'Detik', inputmode: 'numeric' });
    function emit() {
      var mm = Math.max(0, parseInt(im.value, 10) || 0), ss = Math.max(0, Math.min(59, parseInt(is.value, 10) || 0));
      var total = mm * 60 + ss;
      if (total < (opt.min == null ? 1 : opt.min)) total = opt.min == null ? 1 : opt.min;
      onChange(total);
    }
    im.addEventListener('change', emit); is.addEventListener('change', emit);
    var w = h('div', { class: 'dur-field' }, im, h('span', null, 'm'), is, h('span', null, 'd'));
    w.set = function (t) { im.value = Math.floor(t / 60); is.value = t % 60; };
    return w;
  }
  /* h:m:d total */
  function hmsField(totalSec, onChange) {
    var hh = Math.floor(totalSec / 3600), mm = Math.floor((totalSec % 3600) / 60), ss = totalSec % 60;
    var ih = h('input', { type: 'number', min: 0, max: 99, value: hh, 'aria-label': 'Jam', inputmode: 'numeric' });
    var im = h('input', { type: 'number', min: 0, max: 59, value: mm, 'aria-label': 'Menit', inputmode: 'numeric' });
    var is = h('input', { type: 'number', min: 0, max: 59, value: ss, 'aria-label': 'Detik', inputmode: 'numeric' });
    function emit() {
      var t = Math.max(0, parseInt(ih.value, 10) || 0) * 3600 + Math.max(0, Math.min(59, parseInt(im.value, 10) || 0)) * 60 +
        Math.max(0, Math.min(59, parseInt(is.value, 10) || 0));
      if (t < 1) t = 1;
      onChange(t);
    }
    [ih, im, is].forEach(function (i) { i.addEventListener('change', emit); });
    var w = h('div', { class: 'dur-field hms' }, ih, h('span', null, 'jam'), im, h('span', null, 'mnt'), is, h('span', null, 'dtk'));
    w.set = function (t) { ih.value = Math.floor(t / 3600); im.value = Math.floor((t % 3600) / 60); is.value = t % 60; };
    return w;
  }
  function field(label, control, hint) {
    return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control,
      hint ? h('small', { class: 'hint' }, hint) : null);
  }

  root.UkinUI = {
    h: h, $: $, $$: $$, clear: clear, icon: icon, p2: p2,
    fmtSecs: fmtSecs, fmtRemain: fmtRemain, fmtElapsed: fmtElapsed, fmtSigned: fmtSigned, fmtMin: fmtMin,
    fmtClockTime: fmtClockTime, fmtDateTime: fmtDateTime, hmToMin: hmToMin, minToHm: minToHm,
    toast: toast, modal: modal, confirm: confirmBox, hasModal: hasModal,
    download: download, safeName: safeName, durField: durField, hmsField: hmsField, field: field
  };
})(typeof self !== 'undefined' ? self : this);
