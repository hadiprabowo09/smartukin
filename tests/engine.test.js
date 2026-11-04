/* Uji engine dengan jam simulasi. Jalankan: node tests/engine.test.js */
const assert = require('assert');
const { Engine } = require('../js/engine.js');

let passed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok  -', name); }
  catch (e) { console.error('  GAGAL -', name, '\n', e.stack); process.exitCode = 1; }
}

function mk(cfgOver, opts) {
  const clock = { t: 1_700_000_000_000 };
  const events = [];
  const e = new Engine({ now: () => clock.t, onEvent: ev => events.push(ev) });
  const cfg = Object.assign({
    title: 'Uji', totalSec: 600, autoMode: true, gapSec: 0, warnings: [300, 180, 60, 30], warnEnd: true,
    overtimeRemindSec: 60,
    syntaxes: [
      { id: 'a', name: 'A', durationSec: 100 },
      { id: 'b', name: 'B', durationSec: 200 },
      { id: 'c', name: 'C', durationSec: 300 }
    ]
  }, cfgOver || {});
  e.load(cfg);
  return { e, clock, events, adv(sec) { clock.t += sec * 1000; return e.tick(); } };
}
const types = evs => evs.map(x => x.type);

console.log('Engine tests');

t('mulai & hitung waktu berbasis timestamp', () => {
  const { e, clock, adv } = mk();
  assert.strictEqual(e.status(), 'idle');
  assert.ok(e.start());
  adv(10);
  const v = e.snapshot();
  assert.strictEqual(Math.round(v.total.elapsedMs / 1000), 10);
  assert.strictEqual(Math.round(v.syn.remainingMs / 1000), 90);
  assert.strictEqual(v.index, 0);
});

t('tanpa tick selama lama (throttling) tetap akurat', () => {
  const { e, clock } = mk();
  e.start();
  clock.t += 45_000;               // tidak ada tick sama sekali
  const v = e.snapshot();          // snapshot murni dari timestamp
  assert.strictEqual(Math.round(v.total.elapsedMs / 1000), 45);
});

t('auto-advance antar sintaks dengan carry-over', () => {
  const { e, adv, events } = mk();
  e.start();
  adv(100);                         // tepat akhir A
  let v = e.snapshot();
  assert.strictEqual(v.index, 1);
  adv(50);
  v = e.snapshot();
  assert.strictEqual(v.index, 1);
  assert.strictEqual(Math.round(v.syn.elapsedMs / 1000), 50);
  assert.ok(types(events).includes('syntax_end'));
});

t('catch-up setelah background panjang melompati beberapa sintaks', () => {
  const { e, adv } = mk();
  e.start();
  adv(350);                         // A(100)+B(200)=300, lalu 50 di C
  const v = e.snapshot();
  assert.strictEqual(v.index, 2);
  assert.strictEqual(Math.round(v.syn.elapsedMs / 1000), 50);
  assert.strictEqual(v.doneCount, 2);
  assert.strictEqual(Math.round(v.total.elapsedMs / 1000), 350);
});

t('selesai otomatis di akhir sintaks terakhir, total tidak melebihi', () => {
  const { e, adv, events } = mk();
  e.start();
  adv(1000);                        // jauh melewati 600
  assert.strictEqual(e.status(), 'finished');
  const r = e.report();
  assert.strictEqual(Math.round(r.actualMs / 1000), 600);
  assert.strictEqual(r.counts.done, 3);
  assert.ok(types(events).includes('finished'));
});

t('jeda tidak menghitung waktu & lanjut tepat', () => {
  const { e, adv, clock } = mk();
  e.start(); adv(30);
  e.pause();
  clock.t += 5 * 60_000;            // jeda 5 menit
  e.tick();
  assert.strictEqual(Math.round(e.snapshot().total.elapsedMs / 1000), 30);
  e.resume(); adv(20);
  assert.strictEqual(Math.round(e.snapshot().total.elapsedMs / 1000), 50);
});

t('mode manual: lewat durasi -> overtime, tidak pindah sendiri', () => {
  const { e, adv, events } = mk({ autoMode: false });
  e.start(); adv(130);
  const v = e.snapshot();
  assert.strictEqual(v.index, 0);
  assert.ok(v.syn.over);
  assert.strictEqual(Math.round(v.syn.remainingMs / 1000), -30);
  assert.strictEqual(v.syn.color, 'danger');
  assert.strictEqual(types(events).filter(x => x === 'syntax_end').length, 1);
  adv(10);                          // tidak memicu ulang
  assert.strictEqual(types(events).filter(x => x === 'syntax_end').length, 1);
  e.next();
  assert.strictEqual(e.snapshot().index, 1);
  const rec = e.serialize().recs[0];
  assert.strictEqual(rec.status, 'done');
  assert.ok(rec.over);
  assert.strictEqual(Math.round(rec.actualMs / 1000), 140);
});

t('tombol berikutnya / lewati / sebelumnya / ulangi', () => {
  const { e, adv } = mk({ autoMode: false });
  e.start(); adv(10);
  e.next();                          // A done
  adv(5);
  e.skip();                          // B skipped
  let v = e.snapshot();
  assert.strictEqual(v.index, 2);
  e.prev();                          // kembali ke B
  assert.strictEqual(e.snapshot().index, 1);
  adv(7); e.repeat();
  assert.strictEqual(Math.round(e.snapshot().syn.elapsedMs / 1000), 0);
  assert.strictEqual(e.serialize().recs[1].repeats, 1);
  e.jumpTo(0);
  assert.strictEqual(e.snapshot().index, 0);
  const recs = e.serialize().recs;
  assert.strictEqual(recs[0].status, 'done');
});

t('adjustSyntax menambah/mengurangi durasi sintaks aktif', () => {
  const { e, adv } = mk({ autoMode: false });
  e.start(); adv(10);
  e.adjustSyntax(30);
  assert.strictEqual(Math.round(e.snapshot().syn.plannedMs / 1000), 130);
  e.adjustSyntax(-500);              // dibatasi minimal 1 detik
  assert.strictEqual(e.snapshot().syn.plannedMs, 1000);
});

t('adjustSyntax saat overtime mengaktifkan kembali peringatan', () => {
  const { e, adv, events } = mk({ autoMode: false });
  e.start(); adv(110);
  assert.strictEqual(types(events).filter(x => x === 'syntax_end').length, 1);
  e.adjustSyntax(60);                // sekarang masih ada sisa 50 dtk
  assert.ok(!e.snapshot().syn.over);
  adv(60);                           // melewati lagi
  assert.strictEqual(types(events).filter(x => x === 'syntax_end').length, 2);
});

t('peringatan total: 300/180/60/30 s sebelum selesai & waktu habis, masing-masing sekali', () => {
  const { e, adv, events } = mk({ totalSec: 1000, syntaxes: [{ id: 'x', name: 'X', durationSec: 1000 }] });
  e.start();
  adv(700); adv(1);                  // sisa 299 -> 300 terlewati
  adv(120);                          // sisa ~179 -> 180
  adv(120);                          // sisa ~59  -> 60
  adv(30);                           // sisa ~29  -> 30
  const warns = events.filter(x => x.type === 'total_warn').map(x => x.thr);
  assert.deepStrictEqual(warns, [300, 180, 60, 30]);
  adv(100);
  assert.strictEqual(events.filter(x => x.type === 'total_end').length, 1);
  adv(5);
  assert.strictEqual(events.filter(x => x.type === 'total_end').length, 1);
});

t('batas peringatan kustom (mis. 45 dtk)', () => {
  const { e, adv, events } = mk({ totalSec: 300, warnings: [45], syntaxes: [{ id: 'x', name: 'X', durationSec: 300 }] });
  e.start(); adv(240);               // sisa 60 dtk: belum melewati 45
  assert.strictEqual(events.filter(x => x.type === 'total_warn').length, 0);
  adv(16);                           // sisa 44 dtk
  assert.deepStrictEqual(events.filter(x => x.type === 'total_warn').map(x => x.thr), [45]);
});

t('peringatan >= total tidak langsung berbunyi saat mulai', () => {
  const { e, events } = mk({ totalSec: 120, warnings: [300, 60], syntaxes: [{ id: 'x', name: 'X', durationSec: 120 }] });
  e.start(); e.tick();
  assert.strictEqual(events.filter(x => x.type === 'total_warn').length, 0);
});

t('total tetap berjalan jika total target berbeda dari jumlah sintaks', () => {
  // total 1000, sintaks hanya 600 -> manual agar tidak selesai otomatis
  const { e, adv } = mk({ totalSec: 1000, autoMode: false });
  e.start(); adv(400);
  const v = e.snapshot();
  assert.strictEqual(Math.round(v.total.remainingMs / 1000), 600);
});

t('pengingat setelah melewati target (overtime) berkala', () => {
  const { e, adv, events } = mk({ totalSec: 100, autoMode: false, overtimeRemindSec: 30,
    syntaxes: [{ id: 'x', name: 'X', durationSec: 500 }] });
  e.start(); adv(100.5);
  adv(30); adv(30); adv(10);
  const n = events.filter(x => x.type === 'overtime').length;
  assert.ok(n >= 2, 'overtime events: ' + n);
  assert.ok(e.snapshot().total.over);
  assert.strictEqual(e.snapshot().total.color, 'danger');
});

t('jeda antar-sintaks (gap) berjalan lalu masuk sintaks berikut', () => {
  const { e, adv } = mk({ gapSec: 10 });
  e.start(); adv(100);
  let v = e.snapshot();
  assert.strictEqual(v.phase, 'gap');
  assert.strictEqual(v.index, 1);
  adv(10);
  v = e.snapshot();
  assert.strictEqual(v.phase, 'syntax');
  assert.strictEqual(Math.round(v.syn.elapsedMs / 1000), 0);
  adv(5);
  assert.strictEqual(Math.round(e.snapshot().syn.elapsedMs / 1000), 5);
});

t('serialize/restore: timer tidak kembali ke nol setelah refresh', () => {
  const a = mk();
  a.e.start(); a.adv(150);
  const saved = JSON.stringify(a.e.serialize());
  // "refresh": engine baru, jam maju 20 detik saat halaman tertutup
  const clock = { t: a.clock.t + 20_000 };
  const e2 = new Engine({ now: () => clock.t });
  e2.restore(JSON.parse(saved));
  e2.tick();
  const v = e2.snapshot();
  assert.strictEqual(Math.round(v.total.elapsedMs / 1000), 170);
  assert.strictEqual(v.index, 1);
  assert.strictEqual(Math.round(v.syn.elapsedMs / 1000), 70);
});

t('restore pada kondisi jeda mempertahankan waktu', () => {
  const a = mk();
  a.e.start(); a.adv(42); a.e.pause();
  const e2 = new Engine({ now: () => a.clock.t + 3_600_000 });
  e2.restore(a.e.serialize());
  assert.strictEqual(e2.status(), 'paused');
  assert.strictEqual(Math.round(e2.snapshot().total.elapsedMs / 1000), 42);
});

t('selesaikan manual: sintaks sisa ditandai dilewati', () => {
  const { e, adv } = mk({ autoMode: false });
  e.start(); adv(30);
  e.finish();
  const r = e.report();
  assert.strictEqual(e.status(), 'finished');
  assert.strictEqual(r.rows[0].status, 'done');
  assert.strictEqual(r.rows[1].status, 'skipped');
  assert.strictEqual(r.rows[2].status, 'skipped');
  assert.strictEqual(r.counts.skipped, 2);
});

t('rekap: ketepatan, selisih, melebihi waktu', () => {
  const { e, adv } = mk({ autoMode: false, totalSec: 600 });
  e.start();
  adv(120); e.next();               // A: 120 vs 100 (lebih)
  adv(200); e.next();               // B: 200 vs 200 (pas)
  adv(280); e.next();               // C: 280 vs 300 -> selesai
  const r = e.report();
  assert.strictEqual(e.status(), 'finished');
  assert.strictEqual(r.counts.over, 1);
  assert.strictEqual(Math.round(r.actualMs / 1000), 600);
  assert.strictEqual(Math.round(r.diffMs / 1000), 0);
  // deviasi 20 + 0 + 20 = 40 dari 600 -> 93.3%
  assert.ok(Math.abs(r.accuracySyntax - 93.3) < 0.2, String(r.accuracySyntax));
  assert.strictEqual(r.accuracyTotal, 100);
});

t('adjustTotal memperbarui sisa & mengatur ulang peringatan', () => {
  const { e, adv, events } = mk({ totalSec: 100, autoMode: false, warnings: [30],
    syntaxes: [{ id: 'x', name: 'X', durationSec: 500 }] });
  e.start(); adv(80);               // sisa 20 -> peringatan 30 sudah lewat
  assert.strictEqual(events.filter(x => x.type === 'total_warn').length, 1);
  e.adjustTotal(60);                // sisa 80 -> peringatan 30 aktif kembali
  adv(55);                          // sisa 25
  assert.strictEqual(events.filter(x => x.type === 'total_warn').length, 2);
});

t('warna indikator: hijau -> kuning -> merah', () => {
  const { e, adv } = mk({ totalSec: 600, syntaxes: [{ id: 'x', name: 'X', durationSec: 600 }] });
  e.start(); adv(10);
  assert.strictEqual(e.snapshot().syn.color, 'ok');
  adv(530);                          // sisa 60 dtk
  assert.strictEqual(e.snapshot().syn.color, 'warn');
  adv(55);                           // sisa 5
  assert.strictEqual(e.snapshot().syn.color, 'danger');
});

t('mulai ulang setelah selesai & reset', () => {
  const { e, adv } = mk();
  e.start(); adv(900);
  assert.strictEqual(e.status(), 'finished');
  assert.ok(e.start());
  assert.strictEqual(e.status(), 'running');
  adv(10);
  assert.strictEqual(Math.round(e.snapshot().total.elapsedMs / 1000), 10);
  e.reset();
  assert.strictEqual(e.status(), 'idle');
});

t('tanpa sintaks tidak bisa dimulai', () => {
  const { e } = mk({ syntaxes: [] });
  assert.strictEqual(e.start(), false);
});

console.log('\n' + passed + ' uji lulus' + (process.exitCode ? ' — ADA YANG GAGAL' : ''));
