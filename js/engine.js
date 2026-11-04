/* ==========================================================================
   SMART UKIN TIMER — engine.js
   Inti timer. Tidak menyentuh DOM. Semua perhitungan waktu memakai timestamp
   (Date.now) sehingga tetap akurat walau tab di background, di-refresh, atau
   browser melakukan throttling. State dapat diserialisasi lalu dipulihkan.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UkinEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function Engine(opts) {
    opts = opts || {};
    this.now = opts.now || Date.now;
    this.onEvent = opts.onEvent || function () {};
    this.s = null;
  }

  /* ---------- pemuatan konfigurasi ---------- */
  Engine.prototype.load = function (cfg, keepAuto) {
    var c = clone(cfg);
    c.syntaxes = (c.syntaxes || []).map(function (x) {
      x.durationSec = Math.max(1, Math.round(Number(x.durationSec) || 60));
      return x;
    });
    c.totalSec = Math.max(1, Math.round(Number(c.totalSec) || 60));
    c.gapSec = Math.max(0, Math.round(Number(c.gapSec) || 0));
    c.warnings = (c.warnings || []).map(Number).filter(function (x) { return x > 0; })
      .sort(function (a, b) { return b - a; });
    c.warnEnd = c.warnEnd !== false;
    c.overtimeRemindSec = c.overtimeRemindSec == null ? 60 : Number(c.overtimeRemindSec);
    var auto = c.autoMode !== false;
    if (keepAuto && this.s) auto = this.s.auto;
    this.s = {
      v: 1, status: 'idle', cfg: c, auto: auto,
      index: 0, phase: 'syntax',          // phase: 'syntax' | 'gap'
      phaseBase: 0, totalBase: 0,          // ms terkumpul (tanpa periode berjalan saat ini)
      runSince: null,                      // epoch ms saat terakhir "dilipat"; null bila tidak berjalan
      extraMs: 0,                          // penyesuaian durasi sintaks aktif
      recs: c.syntaxes.map(function (sx) {
        return { plannedSec: sx.durationSec, actualMs: 0, status: 'pending', repeats: 0, over: false };
      }),
      fired: { warn: {}, end: false, synEnd: false, overN: 0 },
      startedAt: null, endedAt: null
    };
  };

  Engine.prototype.serialize = function () { return this.s ? clone(this.s) : null; };
  Engine.prototype.restore = function (obj) { this.s = obj ? clone(obj) : null; };
  Engine.prototype.hasSession = function () { return !!this.s; };
  Engine.prototype.status = function () { return this.s ? this.s.status : 'none'; };

  /* ---------- util internal ---------- */
  Engine.prototype._emit = function (list) {
    for (var i = 0; i < list.length; i++) {
      try { this.onEvent(list[i]); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    }
  };
  Engine.prototype._baseDurMs = function () {
    var s = this.s;
    return s.phase === 'gap' ? s.cfg.gapSec * 1000 : s.cfg.syntaxes[s.index].durationSec * 1000;
  };
  Engine.prototype._dur = function () {
    var s = this.s;
    if (s.phase === 'gap') return s.cfg.gapSec * 1000;
    return Math.max(1000, this._baseDurMs() + s.extraMs);
  };
  Engine.prototype._fold = function (now) {
    var s = this.s;
    if (s.status === 'running') {
      var d = now - s.runSince; if (d < 0) d = 0;
      s.totalBase += d; s.phaseBase += d; s.runSince = now;
    }
  };
  /* simpan waktu sintaks aktif ke catatan; status null = pertahankan */
  Engine.prototype._leave = function (status, elapsedMs) {
    var s = this.s, r = s.recs[s.index];
    var el = elapsedMs == null ? s.phaseBase : elapsedMs;
    r.actualMs += el;
    r.plannedSec = this._dur() / 1000;
    if (status) r.status = status;
    r.over = r.actualMs > r.plannedSec * 1000 + 1500;
  };
  Engine.prototype._resetPhase = function (phase, carry) {
    var s = this.s;
    s.phase = phase; s.phaseBase = carry || 0; s.extraMs = 0; s.fired.synEnd = false;
  };
  Engine.prototype._markRemaining = function () {
    this.s.recs.forEach(function (r) {
      if (r.status === 'pending') r.status = r.actualMs > 0 ? 'done' : 'skipped';
    });
  };
  Engine.prototype._finish = function (now, totalMs) {
    var s = this.s;
    this._markRemaining();
    s.status = 'finished'; s.runSince = null; s.endedAt = now;
    s.totalBase = totalMs; s.phaseBase = 0;
  };

  /* ---------- aksi pengguna ---------- */
  Engine.prototype.start = function () {
    var s = this.s;
    if (!s || !s.cfg.syntaxes.length) return false;
    if (s.status === 'finished') { var a = s.auto; this.load(s.cfg); this.s.auto = a; s = this.s; }
    if (s.status !== 'idle') return false;
    var now = this.now();
    s.status = 'running'; s.runSince = now; s.startedAt = now;
    this._emit([{ type: 'started' }, { type: 'syntax_start', index: 0 }]);
    return true;
  };
  Engine.prototype.pause = function () {
    var s = this.s; if (!s || s.status !== 'running') return false;
    var now = this.now(); this._fold(now);
    s.status = 'paused'; s.runSince = null;
    this._emit([{ type: 'paused' }]); return true;
  };
  Engine.prototype.resume = function () {
    var s = this.s; if (!s || s.status !== 'paused') return false;
    s.status = 'running'; s.runSince = this.now();
    this._emit([{ type: 'resumed' }]); return true;
  };
  Engine.prototype.toggle = function () {
    var st = this.status();
    if (st === 'running') return this.pause();
    if (st === 'paused') return this.resume();
    return this.start();
  };
  Engine.prototype._active = function () {
    var s = this.s; return !!s && (s.status === 'running' || s.status === 'paused');
  };
  Engine.prototype._moveOn = function (status) {
    var s = this.s, now = this.now(); this._fold(now);
    if (s.phase === 'gap') { this._resetPhase('syntax', 0); this._emit([{ type: 'syntax_start', index: s.index }]); return true; }
    this._leave(status);
    if (s.index >= s.cfg.syntaxes.length - 1) {
      this._finish(now, s.totalBase);
      this._emit([{ type: 'finished', by: 'last' }]); return true;
    }
    s.index++; this._resetPhase('syntax', 0);
    this._emit([{ type: 'syntax_start', index: s.index }]); return true;
  };
  Engine.prototype.next = function () { return this._active() ? this._moveOn('done') : false; };
  Engine.prototype.skip = function () { return this._active() ? this._moveOn('skipped') : false; };
  Engine.prototype.prev = function () {
    var s = this.s; if (!this._active()) return false;
    var now = this.now(); this._fold(now);
    if (s.phase === 'gap') {
      s.index = Math.max(0, s.index - 1);
    } else {
      this._leave(null);
      if (s.index > 0) s.index--;
    }
    this._resetPhase('syntax', 0);
    this._emit([{ type: 'syntax_start', index: s.index }]); return true;
  };
  Engine.prototype.repeat = function () {
    var s = this.s; if (!this._active() || s.phase === 'gap') return false;
    var now = this.now(); this._fold(now);
    this._leave(null); s.recs[s.index].repeats++;
    this._resetPhase('syntax', 0);
    this._emit([{ type: 'syntax_start', index: s.index, repeat: true }]); return true;
  };
  Engine.prototype.jumpTo = function (i) {
    var s = this.s; if (!this._active()) return false;
    i = Math.round(i); if (i < 0 || i >= s.cfg.syntaxes.length) return false;
    var now = this.now(); this._fold(now);
    if (s.phase === 'syntax') this._leave(null);
    s.index = i; this._resetPhase('syntax', 0);
    this._emit([{ type: 'syntax_start', index: i, jump: true }]); return true;
  };
  Engine.prototype.adjustSyntax = function (sec) {
    var s = this.s; if (!this._active() || s.phase === 'gap') return false;
    var now = this.now(); this._fold(now);
    s.extraMs += Math.round(sec * 1000);
    var base = this._baseDurMs();
    if (base + s.extraMs < 1000) s.extraMs = 1000 - base;
    if (s.phaseBase < this._dur()) s.fired.synEnd = false;
    return true;
  };
  Engine.prototype.adjustTotal = function (sec) {
    var s = this.s; if (!this.s || s.status === 'idle' || s.status === 'finished') return false;
    var now = this.now(); this._fold(now);
    s.cfg.totalSec = Math.max(10, s.cfg.totalSec + Math.round(sec));
    var rem = s.cfg.totalSec * 1000 - s.totalBase;
    if (rem > 0) { s.fired.end = false; s.fired.overN = 0; }
    Object.keys(s.fired.warn).forEach(function (k) { if (rem > Number(k) * 1000) delete s.fired.warn[k]; });
    return true;
  };
  Engine.prototype.setAuto = function (v) { if (this.s) this.s.auto = !!v; };
  Engine.prototype.finish = function () {
    var s = this.s; if (!this._active()) return false;
    var now = this.now(); this._fold(now);
    if (s.phase === 'syntax') this._leave('done');
    this._finish(now, s.totalBase);
    this._emit([{ type: 'finished', by: 'user' }]); return true;
  };
  Engine.prototype.reset = function () {
    if (!this.s) return;
    var a = this.s.auto; this.load(this.s.cfg); this.s.auto = a;
  };
  /* sesi lama yang terlalu usang: jeda tanpa menghitung waktu menganggur */
  Engine.prototype.forcePause = function () {
    var s = this.s; if (!s || s.status !== 'running') return false;
    s.status = 'paused'; s.runSince = null; return true;
  };

  /* ---------- tick: dipanggil berkala; menangani pindah otomatis & peringatan ---------- */
  Engine.prototype.tick = function () {
    var s = this.s; if (!s || s.status !== 'running') return [];
    var now = this.now(), ev = [];
    this._advance(now, ev);
    if (this.s.status === 'running') {
      this._checkSyntaxEnd(ev);
      this._checkTotal(ev);
    } else {
      // selesai otomatis: tetap periksa peringatan total (mis. waktu habis)
      this._checkTotal(ev);
    }
    this._emit(ev);
    return ev;
  };

  Engine.prototype._advance = function (now, ev) {
    var s = this.s;
    var delta = now - s.runSince; if (delta < 0) delta = 0;
    var tot = s.totalBase + delta, ph = s.phaseBase + delta, guard = 0;
    var n = s.cfg.syntaxes.length;
    while (guard++ < 1000) {
      var dur = this._dur();
      if (s.phase === 'gap') {
        if (ph >= dur) {
          ph -= dur; this._resetPhase('syntax', 0);
          ev.push({ type: 'syntax_start', index: s.index }); continue;
        }
        break;
      }
      if (s.auto && ph >= dur) {
        var carry = ph - dur;
        this._leave('done', dur);
        ev.push({ type: 'syntax_end', index: s.index, auto: true });
        if (s.index >= n - 1) {
          this._finish(now, tot - carry);
          ev.push({ type: 'finished', by: 'auto' });
          return;
        }
        s.index++;
        if (s.cfg.gapSec > 0) { this._resetPhase('gap', 0); ev.push({ type: 'gap_start', index: s.index }); }
        else { this._resetPhase('syntax', 0); ev.push({ type: 'syntax_start', index: s.index }); }
        ph = carry; continue;
      }
      break;
    }
    s.totalBase = tot; s.phaseBase = ph; s.runSince = now;
  };

  Engine.prototype._checkSyntaxEnd = function (ev) {
    var s = this.s;
    if (s.phase === 'syntax' && !s.auto && !s.fired.synEnd && s.phaseBase >= this._dur()) {
      s.fired.synEnd = true;
      ev.push({ type: 'syntax_end', index: s.index, auto: false });
    }
  };

  Engine.prototype._checkTotal = function (ev) {
    var s = this.s, planned = s.cfg.totalSec * 1000, rem = planned - s.totalBase, passed = [], i;
    for (i = 0; i < s.cfg.warnings.length; i++) {
      var thr = s.cfg.warnings[i];
      if (thr * 1000 < planned && !s.fired.warn[thr] && rem <= thr * 1000) {
        s.fired.warn[thr] = true;
        if (rem > 0) passed.push(thr);
      }
    }
    if (passed.length) ev.push({ type: 'total_warn', thr: Math.min.apply(null, passed) });
    if (rem <= 0 && !s.fired.end) {
      s.fired.end = true;
      ev.push({ type: 'total_end', alert: s.cfg.warnEnd });
    }
    if (rem < 0 && s.cfg.overtimeRemindSec > 0 && s.status === 'running') {
      var k = Math.floor(-rem / (s.cfg.overtimeRemindSec * 1000));
      if (k > s.fired.overN) { s.fired.overN = k; ev.push({ type: 'overtime', overMs: -rem }); }
    }
  };

  /* ---------- tampilan (tanpa mengubah state) ---------- */
  function synColor(remMs, plannedMs) {
    var plannedSec = plannedMs / 1000, rem = remMs / 1000;
    if (rem <= 0) return 'danger';
    var yt = Math.min(60, Math.max(10, plannedSec * 0.2));
    var rt = Math.min(10, plannedSec * 0.1);
    if (rem <= rt) return 'danger';
    if (rem <= yt) return 'warn';
    return 'ok';
  }
  function totalColor(remMs, plannedMs, warnings) {
    var plannedSec = plannedMs / 1000, rem = remMs / 1000;
    if (rem <= 0) return 'danger';
    var maxThr = (warnings && warnings.length) ? warnings[0] : 60;
    var yt = Math.min(maxThr, plannedSec * 0.25);
    var rt = Math.min(60, plannedSec * 0.1);
    if (rem <= rt) return 'danger';
    if (rem <= yt) return 'warn';
    return 'ok';
  }

  Engine.prototype.snapshot = function (nowArg) {
    var s = this.s; if (!s) return null;
    var now = nowArg == null ? this.now() : nowArg;
    var delta = s.status === 'running' ? Math.max(0, now - s.runSince) : 0;
    var tot = s.totalBase + delta, ph = s.phaseBase + delta;
    var n = s.cfg.syntaxes.length, idx = Math.min(s.index, n - 1);
    var cur = s.cfg.syntaxes[idx] || null;
    var finished = s.status === 'finished';
    var dur = finished ? 0 : this._dur();
    var plannedTotal = s.cfg.totalSec * 1000;
    var remTotal = plannedTotal - tot;
    var synRem = dur - ph;
    var vm = {
      status: s.status, phase: s.phase, auto: s.auto, index: idx, count: n,
      syn: cur ? {
        id: cur.id, name: cur.name, plannedMs: dur, elapsedMs: ph, remainingMs: synRem,
        over: synRem < 0, pct: finished ? 100 : Math.max(0, Math.min(100, dur ? ph / dur * 100 : 0)),
        color: finished ? 'ok' : synColor(synRem, dur), data: cur
      } : null,
      total: {
        plannedMs: plannedTotal, elapsedMs: tot, remainingMs: remTotal, over: remTotal < 0,
        pct: Math.max(0, Math.min(100, plannedTotal ? tot / plannedTotal * 100 : 0)),
        color: finished ? 'ok' : totalColor(remTotal, plannedTotal, s.cfg.warnings)
      },
      doneCount: s.recs.filter(function (r) { return r.status === 'done'; }).length,
      skippedCount: s.recs.filter(function (r) { return r.status === 'skipped'; }).length,
      next: null, startedAt: s.startedAt, endedAt: s.endedAt
    };
    if (s.phase === 'gap' && !finished) {
      vm.gap = { plannedMs: dur, elapsedMs: ph, remainingMs: dur - ph };
      vm.next = cur;
    } else if (idx < n - 1 && !finished) {
      vm.next = s.cfg.syntaxes[idx + 1];
    }
    vm.estimatedEnd = (s.status === 'running' || s.status === 'paused') ? now + Math.max(0, remTotal) : null;
    return vm;
  };

  /* ---------- rekap ---------- */
  Engine.prototype.report = function () {
    var s = this.s; if (!s) return null;
    var vm = this.snapshot();
    var rows = s.cfg.syntaxes.map(function (sx, i) {
      var r = s.recs[i];
      return {
        id: sx.id, name: sx.name, phase: sx.phase || '',
        plannedSec: r.plannedSec != null ? r.plannedSec : sx.durationSec,
        actualMs: r.actualMs, status: r.status, over: !!r.over, repeats: r.repeats
      };
    });
    var plannedMs = s.cfg.totalSec * 1000;
    var actualMs = vm.total.elapsedMs;
    var done = rows.filter(function (r) { return r.status === 'done'; });
    var sumPlanned = 0, sumDev = 0;
    done.forEach(function (r) { sumPlanned += r.plannedSec * 1000; sumDev += Math.abs(r.actualMs - r.plannedSec * 1000); });
    var accSyn = sumPlanned ? Math.max(0, 1 - sumDev / sumPlanned) * 100 : 0;
    var accTot = plannedMs ? Math.max(0, 1 - Math.abs(actualMs - plannedMs) / plannedMs) * 100 : 0;
    var syntaxSum = rows.reduce(function (a, r) { return a + r.actualMs; }, 0);
    return {
      title: s.cfg.title || '', subject: s.cfg.subject || '', grade: s.cfg.grade || '', model: s.cfg.model || '',
      startedAt: s.startedAt, endedAt: s.endedAt,
      wallMs: (s.endedAt && s.startedAt) ? s.endedAt - s.startedAt : 0,
      plannedMs: plannedMs, actualMs: actualMs, diffMs: actualMs - plannedMs,
      gapMs: Math.max(0, actualMs - syntaxSum),
      rows: rows,
      counts: {
        total: rows.length,
        done: done.length,
        skipped: rows.filter(function (r) { return r.status === 'skipped'; }).length,
        over: rows.filter(function (r) { return r.over && r.status !== 'skipped'; }).length
      },
      accuracySyntax: Math.round(accSyn * 10) / 10,
      accuracyTotal: Math.round(accTot * 10) / 10
    };
  };

  return { Engine: Engine, synColor: synColor, totalColor: totalColor };
});
