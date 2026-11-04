/* ==========================================================================
   SMART UKIN TIMER — audio.js
   Alarm lokal dengan Web Audio API (tanpa file suara, tanpa internet).
   Nada dibuat lembut agar tidak mengganggu rekaman video. Mode senyap
   mematikan semua suara.
   ========================================================================== */
(function (root) {
  'use strict';

  var ctx = null;

  function ensure() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }
  /* harus dipanggil dari gestur pengguna (klik/tap) agar diizinkan browser */
  function unlock() {
    var c = ensure(); if (!c) return false;
    if (c.state === 'suspended') c.resume();
    return true;
  }

  function tone(c, t0, freq, dur, type, vol, harmonics) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(c.destination);
    (harmonics || [1]).forEach(function (h, i) {
      var o = c.createOscillator();
      o.type = type; o.frequency.value = freq * h;
      var hg = c.createGain(); hg.gain.value = i === 0 ? 1 : 0.35 / (i + 1);
      o.connect(hg); hg.connect(g);
      o.start(t0); o.stop(t0 + dur + 0.05);
    });
  }

  var SOUNDS = {
    bell:    function (c, t, v, f) { tone(c, t, f, 1.3, 'sine', v, [1, 2.76, 5.4]); },
    chime:   function (c, t, v, f) { tone(c, t, f, 0.7, 'sine', v); tone(c, t + 0.16, f * 1.25, 0.9, 'sine', v); },
    beep:    function (c, t, v, f) { tone(c, t, f, 0.22, 'sine', v * 0.8); },
    digital: function (c, t, v, f) { tone(c, t, f, 0.12, 'triangle', v * 0.7); tone(c, t + 0.16, f * 1.5, 0.12, 'triangle', v * 0.7); }
  };
  var SOUND_LABELS = { bell: 'Lonceng lembut', chime: 'Denting', beep: 'Bip', digital: 'Digital' };

  /* count: jumlah ulangan; base: frekuensi dasar */
  function play(kind, count, base, volume) {
    var c = ensure(); if (!c) return false;
    if (c.state === 'suspended') c.resume();
    var fn = SOUNDS[kind] || SOUNDS.bell;
    var v = Math.max(0.02, Math.min(1, volume == null ? 0.6 : volume)) * 0.5;
    var t = c.currentTime + 0.03, gap = kind === 'bell' ? 0.9 : 0.38;
    for (var i = 0; i < (count || 1); i++) fn(c, t + i * gap, v, base || 880);
    return true;
  }

  /* pola per jenis peristiwa */
  var PATTERNS = {
    syntax_end: { count: 1, base: 880 },
    total_warn: { count: 2, base: 784 },
    total_end:  { count: 3, base: 660 },
    overtime:   { count: 1, base: 523 }
  };
  function playEvent(name, settings) {
    if (!settings || settings.silent) return false;
    var p = PATTERNS[name] || PATTERNS.syntax_end;
    return play(settings.alarmSound, p.count, p.base, settings.volume);
  }
  function vibrate(pattern) { try { if (root.navigator && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }

  root.UkinAudio = { unlock: unlock, play: play, playEvent: playEvent, vibrate: vibrate, SOUND_LABELS: SOUND_LABELS };
})(typeof self !== 'undefined' ? self : this);
