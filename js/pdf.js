/* ==========================================================================
   SMART UKIN TIMER — pdf.js
   Pembuat PDF minimal (A4, font Helvetica bawaan PDF) tanpa pustaka luar,
   sehingga ekspor laporan tetap berfungsi offline.
   ========================================================================== */
(function (root) {
  'use strict';

  var W = 595.28, H = 841.89;

  function ascii(s) {
    s = String(s == null ? '' : s)
      .replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/…/g, '...').replace(/[ ]/g, ' ');
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.replace(/[^\x20-\x7E]/g, '?');
  }
  function esc(s) { return ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function num(n) { return (Math.round(n * 100) / 100).toString(); }

  function Doc() { this.pages = []; this.cur = null; this.newPage(); }
  Doc.prototype.newPage = function () { this.cur = []; this.pages.push(this.cur); return this.cur; };
  /* koordinat y dihitung dari ATAS halaman */
  Doc.prototype.text = function (x, y, str, size, bold, rgb) {
    rgb = rgb || [0.05, 0.12, 0.25];
    this.cur.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + num(size) + ' Tf ' +
      num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' rg ' + num(x) + ' ' + num(H - y) + ' Td (' + esc(str) + ') Tj ET');
  };
  Doc.prototype.rect = function (x, y, w, h, rgb) {
    this.cur.push(num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' rg ' +
      num(x) + ' ' + num(H - y - h) + ' ' + num(w) + ' ' + num(h) + ' re f');
  };
  Doc.prototype.line = function (x1, y1, x2, y2, rgb, w) {
    rgb = rgb || [0.8, 0.83, 0.9];
    this.cur.push(num(rgb[0]) + ' ' + num(rgb[1]) + ' ' + num(rgb[2]) + ' RG ' + num(w || 0.5) + ' w ' +
      num(x1) + ' ' + num(H - y1) + ' m ' + num(x2) + ' ' + num(H - y2) + ' l S');
  };
  Doc.prototype.toBlob = function () {
    var objs = [], self = this;
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    var kids = [];
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    var n = 5;
    this.pages.forEach(function (ops) {
      var content = ops.join('\n'), pageNo = n++, contentNo = n++;
      objs[contentNo] = '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream';
      objs[pageNo] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + num(W) + ' ' + num(H) + '] ' +
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + contentNo + ' 0 R >>';
      kids.push(pageNo + ' 0 R');
    });
    objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + kids.length + ' >>';
    var out = '%PDF-1.4\n', offsets = [];
    for (var i = 1; i < objs.length; i++) {
      offsets[i] = out.length;
      out += i + ' 0 obj\n' + objs[i] + '\nendobj\n';
    }
    var xref = out.length;
    out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
    for (i = 1; i < objs.length; i++) out += ('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return new Blob([out], { type: 'application/pdf' });
  };

  function fmt(ms) {
    var neg = ms < 0; ms = Math.abs(Math.round(ms / 1000));
    var h = Math.floor(ms / 3600), m = Math.floor((ms % 3600) / 60), s = ms % 60;
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return (neg ? '-' : '') + (h ? h + ':' + p(m) : m) + ':' + p(s);
  }
  function fmtSec(sec) { return fmt(sec * 1000); }
  function trunc(s, maxChars) { s = ascii(s); return s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 2)) + '..' : s; }
  var STATUS = { done: 'Selesai', skipped: 'Dilewati', pending: 'Belum' };

  /* Laporan rekap -> Blob PDF */
  function buildReport(rep) {
    var d = new Doc(), navy = [0.043, 0.145, 0.27], orange = [1, 0.48, 0.1], grey = [0.4, 0.45, 0.55];
    var y = 0;
    d.rect(0, 0, W, 70, navy);
    d.text(36, 34, 'SMART UKIN TIMER', 20, true, [1, 1, 1]);
    d.text(36, 54, 'Rekap Waktu Kegiatan Pembelajaran', 11, false, [0.85, 0.9, 1]);
    d.rect(0, 70, W, 4, orange);
    y = 98;
    d.text(36, y, rep.title || '-', 15, true); y += 18;
    var meta = [];
    if (rep.subject) meta.push('Mapel: ' + rep.subject);
    if (rep.grade) meta.push('Kelas: ' + rep.grade);
    if (rep.model) meta.push('Model: ' + rep.model);
    if (meta.length) { d.text(36, y, trunc(meta.join('   |   '), 100), 9.5, false, grey); y += 14; }
    if (rep.startedAt) {
      var dt = new Date(rep.startedAt);
      d.text(36, y, 'Tanggal: ' + dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
        '  ' + dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 9.5, false, grey);
      y += 20;
    } else y += 8;

    var cards = [
      ['Direncanakan', fmt(rep.plannedMs)], ['Aktual', fmt(rep.actualMs)],
      ['Selisih', (rep.diffMs > 0 ? '+' : '') + fmt(rep.diffMs)], ['Ketepatan sintaks', rep.accuracySyntax + '%'],
      ['Selesai', rep.counts.done + '/' + rep.counts.total], ['Melebihi waktu', String(rep.counts.over)]
    ];
    var cw = (W - 72 - 10 * 2) / 3;
    cards.forEach(function (c, i) {
      var cx = 36 + (i % 3) * (cw + 10), cy = y + Math.floor(i / 3) * 54;
      d.rect(cx, cy, cw, 46, [0.95, 0.96, 0.98]);
      d.text(cx + 10, cy + 16, c[0], 8.5, false, grey);
      d.text(cx + 10, cy + 36, c[1], 15, true);
    });
    y += 112;
    d.text(36, y, 'Dilewati: ' + rep.counts.skipped + '     Ketepatan total waktu: ' + rep.accuracyTotal + '%', 9.5, false, grey);
    y += 22;

    /* tabel */
    var cols = [36, 62, 270, 330, 390, 450], heads = ['No', 'Sintaks', 'Rencana', 'Aktual', 'Selisih', 'Status'];
    function header() {
      d.rect(36, y - 12, W - 72, 18, navy);
      heads.forEach(function (t, i) { d.text(cols[i] + 4, y, t, 9, true, [1, 1, 1]); });
      y += 20;
    }
    header();
    rep.rows.forEach(function (r, i) {
      if (y > H - 130) { d.newPage(); y = 50; header(); }
      if (i % 2 === 0) d.rect(36, y - 11, W - 72, 17, [0.97, 0.98, 1]);
      var diff = r.status === 'skipped' ? '-' : (r.actualMs - r.plannedSec * 1000 > 0 ? '+' : '') + fmt(r.actualMs - r.plannedSec * 1000);
      var st = (STATUS[r.status] || r.status) + (r.over && r.status !== 'skipped' ? ' (lewat)' : '');
      var col = r.over && r.status !== 'skipped' ? [0.8, 0.15, 0.15] : [0.05, 0.12, 0.25];
      d.text(cols[0] + 4, y, String(i + 1), 9);
      d.text(cols[1] + 4, y, trunc(r.name, 38), 9);
      d.text(cols[2] + 4, y, fmtSec(r.plannedSec), 9);
      d.text(cols[3] + 4, y, r.status === 'skipped' ? '-' : fmt(r.actualMs), 9);
      d.text(cols[4] + 4, y, diff, 9, false, col);
      d.text(cols[5] + 4, y, trunc(st, 20), 9, false, col);
      y += 17;
    });
    d.line(36, y - 8, W - 36, y - 8);
    y += 14;

    /* grafik batang sederhana */
    if (y > H - 220) { d.newPage(); y = 50; }
    d.text(36, y, 'Grafik: rencana (abu-abu) vs aktual (biru/merah)', 10, true); y += 14;
    var maxV = 1;
    rep.rows.forEach(function (r) { maxV = Math.max(maxV, r.plannedSec * 1000, r.actualMs); });
    var barW = W - 72 - 150;
    rep.rows.forEach(function (r, i) {
      if (y > H - 50) { d.newPage(); y = 50; }
      d.text(36, y + 8, trunc((i + 1) + '. ' + r.name, 28), 8, false, grey);
      var pw = Math.max(1, r.plannedSec * 1000 / maxV * barW), aw = Math.max(r.actualMs > 0 ? 1 : 0, r.actualMs / maxV * barW);
      d.rect(190, y, pw, 5, [0.78, 0.8, 0.86]);
      d.rect(190, y + 6, aw, 5, r.over ? [0.9, 0.22, 0.23] : [0.11, 0.31, 0.54]);
      y += 16;
    });
    d.text(36, H - 28, 'Dibuat dengan SMART UKIN TIMER - ' + new Date().toLocaleString('id-ID'), 8, false, grey);
    return d.toBlob();
  }

  root.UkinPDF = { buildReport: buildReport, ascii: ascii };
})(typeof self !== 'undefined' ? self : this);
