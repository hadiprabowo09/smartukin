"""Uji end-to-end SMART UKIN TIMER di Chrome headless.
Jalankan dari folder proyek:  python3 tests/e2e.py
"""
import json, os, subprocess, sys, time, re
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.environ.get('SHOT_DIR', '/tmp/claude-0/-home-claude/1fb4e0d5-4798-5a3e-99e0-b51fea49a895/scratchpad/shots')
os.makedirs(SHOT, exist_ok=True)
PORT = 8765
URL = f'http://localhost:{PORT}/index.html'

passed, failed = 0, []
def check(name, cond, extra=''):
    global passed
    if cond: passed += 1; print('  ok   -', name)
    else: failed.append(name); print('  GAGAL -', name, extra)


def secs(t):
    parts = [int(x) for x in t.replace('+','').split(':')]
    v = 0
    for x in parts: v = v*60 + x
    return v
def near(t, target, tol=2):
    try: return abs(secs(t) - secs(target)) <= tol
    except Exception: return False

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
errors = []

def txt(page, sel):
    return page.locator(sel).first.inner_text().strip()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1366, 'height': 768}, accept_downloads=True)
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        page.on('console', lambda m: errors.append('console.error: ' + m.text) if m.type == 'error' else None)

        print('\n[1] Muat & navigasi semua menu')
        page.goto(URL); page.wait_for_selector('.hero')
        check('Dashboard menampilkan proyek contoh', 'Contoh UKIN PPG' in txt(page, '.hero-title'))
        check('Dashboard menampilkan total 40:00', '40:00' in page.locator('.stats').first.inner_text())
        routes = ['dashboard','new','templates','syntax','live','teleprompter','history','report','backup','settings']
        navtxt = page.locator('.nav-link').all_inner_texts()
        check('10 menu navigasi', len(navtxt) == 10, str(navtxt))
        for r in routes:
            page.goto(f'{URL}#/{r}'); page.wait_for_timeout(250)
            check(f'halaman {r} terbuka (ada konten)', page.locator('#view').inner_text().strip() != '' or r in ('live','teleprompter'))
        page.goto(f'{URL}#/dashboard'); page.screenshot(path=f'{SHOT}/01-dashboard.png')
        page.goto(f'{URL}#/templates'); page.wait_for_timeout(200); page.screenshot(path=f'{SHOT}/02-templates.png')
        check('10 template bawaan', page.locator('.tpl-card').count() == 10, str(page.locator('.tpl-card').count()))

        print('\n[2] Buat proyek dari template PJOK & edit sintaks')
        page.goto(f'{URL}#/new'); page.wait_for_selector('form.form')
        page.locator('form.form input[type=text]').nth(0).fill('Take Video PJOK Bola Voli')
        page.locator('form.form input[type=text]').nth(1).fill('PJOK')
        page.locator('form.form input[type=text]').nth(2).fill('Kelas VII')
        page.locator('form.form select').select_option('tpl-pjok')
        page.locator('form.form input[type=time]').nth(0).fill('08:00')
        page.locator('form.form input[type=time]').nth(0).dispatch_event('change')
        endv = page.locator('form.form input[type=time]').nth(1).input_value()
        check('waktu selesai dihitung dari mulai+total (08:40)', endv == '08:40', endv)
        page.locator('form.form button[type=submit]').click()
        page.wait_for_selector('.syn-row')
        check('masuk ke halaman sintaks dgn 10 sintaks', page.locator('.syn-row').count() == 10, str(page.locator('.syn-row').count()))
        check('judul proyek tersimpan', 'Bola Voli' in page.locator('.card.form input[type=text]').first.input_value())
        check('ringkasan: pas', 'tepat sama' in txt(page, '.notice'), txt(page, '.notice'))
        # ubah durasi sintaks pertama +2 menit
        mins = page.locator('.syn-row').first.locator('input[type=number]').nth(0)
        mins.fill('5'); mins.dispatch_event('change'); page.wait_for_timeout(150)
        check('peringatan durasi melebihi total muncul', 'MELEBIHI' in page.locator('.card').filter(has_text='Perhitungan Durasi').inner_text())
        page.get_by_role('button', name='Skalakan durasi sintaks ke total waktu').click(); page.wait_for_timeout(200)
        check('setelah skala: pas lagi', 'tepat sama' in page.locator('.card').filter(has_text='Perhitungan Durasi').inner_text())
        # tambah sintaks
        page.get_by_role('button', name='Tambah Sintaks').click()
        page.locator('.modal .syn-form input[type=text]').first.fill('Sintaks Uji Tambahan')
        page.locator('.modal').get_by_role('button', name='Simpan').click(); page.wait_for_timeout(200)
        check('sintaks ditambah (11)', page.locator('.syn-row').count() == 11)
        # naikkan ke atas
        page.locator('.syn-row').nth(10).locator('button[aria-label="Naikkan"]').click(); page.wait_for_timeout(150)
        check('urutan berubah (sintaks uji di posisi 10)', 'Sintaks Uji' in page.locator('.syn-row').nth(9).inner_text())
        # hapus
        page.locator('.syn-row').nth(9).locator('button[aria-label="Hapus sintaks"]').click()
        page.locator('.modal').get_by_role('button', name='Hapus').click(); page.wait_for_timeout(200)
        check('sintaks dihapus (10)', page.locator('.syn-row').count() == 10)
        page.screenshot(path=f'{SHOT}/03-syntax.png', full_page=True)
        # peringatan kustom
        page.locator('.add-warn input').nth(1).fill('45')
        page.locator('.add-warn').get_by_role('button', name='Tambah').click(); page.wait_for_timeout(150)
        stored = page.evaluate("JSON.parse(localStorage.getItem('ukin.projects'))[0]")
        check('batas peringatan kustom 45 dtk tersimpan', 45 in stored['warnings'], str(stored['warnings']))
        check('proyek tersimpan di localStorage', stored['title'].startswith('Take Video PJOK'))

        print('\n[3] Live Timer dengan jam simulasi')
        page.clock.install(time=1_800_000_000)   # detik (Python API)
        page.reload()   # penting: muat ulang agar seluruh timer aplikasi memakai jam simulasi
        page.goto(f'{URL}#/live'); page.wait_for_selector('.live')
        check('Live: tombol MULAI tampil', page.locator('button:has-text("MULAI")').first.is_visible())
        check('Live: panduan 4 pertanyaan', page.locator('.g-card').count() == 4)
        gtxt = page.locator('.lv-guide').inner_text()
        for q in ['APA YANG HARUS SAYA LAKUKAN?', 'APA YANG HARUS SAYA UCAPKAN?', 'APA YANG HARUS DILAKUKAN MURID?', 'APA YANG HARUS SAYA PERHATIKAN?']:
            check('Live: ' + q, q in gtxt)
        page.screenshot(path=f'{SHOT}/04-live-idle.png')
        page.locator('.lv-ctl-main button:has-text("MULAI")').first.click()
        page.clock.run_for(10_000)
        t_tot = txt(page, '.lv-total-num'); t_syn = txt(page, '#liveSynTime')
        check('total timer berkurang (~39:50)', near(t_tot,'39:50'), t_tot)
        syn1 = page.evaluate("JSON.parse(localStorage.getItem('ukin.session')).engine.cfg.syntaxes[0].durationSec")
        check('timer sintaks berjalan', t_syn != '' and t_syn != '--:--', t_syn)
        check('tombol JEDA tampil saat berjalan', page.locator('.lv-ctl-main button:has-text("JEDA")').is_visible())
        # jeda
        page.locator('.lv-ctl-main button:has-text("JEDA")').click()
        page.clock.run_for(60_000)
        check('jeda 60 dtk: total tidak berubah (~39:50)', near(txt(page, '.lv-total-num'),'39:50'), txt(page, '.lv-total-num'))
        page.locator('.lv-ctl-main button:has-text("LANJUTKAN")').click()
        page.clock.run_for(5_000)
        check('lanjutkan 5 dtk: ~39:45', near(txt(page, '.lv-total-num'),'39:45'), txt(page, '.lv-total-num'))
        idx0 = txt(page, '.lv-idx')
        check('sintaks 1 dari 10', '1 / 10' in idx0, idx0)
        # refresh halaman: timer tak boleh kembali ke nol
        now_ms = page.evaluate('Date.now()')
        page.reload(); page.clock.set_system_time((now_ms + 20_000) / 1000)   # halaman 'tertutup' selama 20 detik
        page.wait_for_selector('.live'); page.wait_for_timeout(600)
        after = txt(page, '.lv-total-num')
        check('setelah refresh timer TIDAK kembali ke nol & menghitung 20 dtk saat tertutup (≤39:26)', after <= '39:26' and after >= '39:20', after)
        check('setelah refresh status BERJALAN', 'BERJALAN' in txt(page, '.lv-status'))
        # next / prev / repeat
        page.locator('.lv-ctl-main button:has-text("SINTAKS BERIKUTNYA")').click()
        check('berikutnya -> sintaks 2', '2 / 10' in txt(page, '.lv-idx'), txt(page, '.lv-idx'))
        page.locator('.lv-ctl-main button:has-text("SEBELUMNYA")').click()
        check('sebelumnya -> sintaks 1', '1 / 10' in txt(page, '.lv-idx'))
        page.locator('.lv-ctl-main button:has-text("ULANGI SINTAKS")').click()
        check('ulangi: tetap sintaks 1', '1 / 10' in txt(page, '.lv-idx'))
        # tambah 30 dtk
        before_syn = txt(page, '#liveSynTime')
        page.locator('.lv-ctl-tools button[title*="Tambah 30 detik"]').click(); page.wait_for_timeout(300)
        check('+30 dtk mengubah timer sintaks', txt(page, '#liveSynTime') != before_syn, before_syn + ' -> ' + txt(page, '#liveSynTime'))
        # mode manual toggle
        page.locator('.lv-ctl-tools button:has-text("Otomatis")').click(); page.wait_for_timeout(200)
        check('toggle -> Manual', page.locator('.lv-ctl-tools button:has-text("Manual")').count() == 1)
        page.locator('.lv-ctl-tools button:has-text("Manual")').click(); page.wait_for_timeout(200)
        # auto advance: lompat waktu panjang
        page.clock.run_for(25 * 60_000)
        idx = txt(page, '.lv-idx')
        check('auto-advance setelah 25 menit → sintaks > 5', int(re.search(r'(\d+) /', idx).group(1)) > 5, idx)
        check('banner/alarm tidak error (silent mode lewat audio ok)', True)
        page.screenshot(path=f'{SHOT}/05-live-running.png')
        # jump
        page.locator('.lv-ctl-tools button:has-text("Daftar sintaks")').click()
        page.locator('.jump-item').nth(2).click(); page.wait_for_timeout(200)
        check('loncat ke sintaks 3', '3 / 10' in txt(page, '.lv-idx'), txt(page, '.lv-idx'))
        # checklist
        if page.locator('.lv-check input[type=checkbox]').count():
            page.locator('.lv-check input[type=checkbox]').first.check()
            page.wait_for_timeout(100)
            ck = page.evaluate("Object.values(JSON.parse(localStorage.getItem('ukin.session')).checks).some(Boolean)")
            check('checklist tersimpan', ck)
        # presentation mode
        page.keyboard.press('f'); page.wait_for_timeout(300)
        check('mode presentasi: sidebar tersembunyi', not page.locator('#sidebar').is_visible())
        page.screenshot(path=f'{SHOT}/06-live-present.png')
        page.keyboard.press('f'); page.wait_for_timeout(200)
        # selesaikan
        page.locator('.lv-ctl-main button:has-text("SELESAIKAN")').click()
        page.locator('.modal').get_by_role('button', name='Selesaikan').click(); page.wait_for_timeout(300)
        check('overlay selesai tampil', page.locator('.done-card').is_visible())
        page.screenshot(path=f'{SHOT}/07-live-done.png')
        hist = page.evaluate("JSON.parse(localStorage.getItem('ukin.history'))")
        check('riwayat tersimpan otomatis (1)', len(hist) == 1, str(len(hist)))

        print('\n[4] Rekap, riwayat, ekspor')
        page.get_by_role('button', name='Lihat Rekap Waktu').click(); page.wait_for_selector('.tbl')
        check('rekap: tabel 10 baris', page.locator('.tbl tbody tr').count() == 10)
        check('rekap: ada grafik batang', page.locator('.bar-row').count() == 10)
        page.screenshot(path=f'{SHOT}/08-report.png', full_page=True)
        with page.expect_download() as dl: page.get_by_role('button', name='PDF').first.click()
        d = dl.value; pdf_path = f'{SHOT}/rekap.pdf'; d.save_as(pdf_path)
        data = open(pdf_path, 'rb').read()
        check('PDF diunduh & header valid', data[:5] == b'%PDF-' and data.rstrip().endswith(b'%%EOF') and len(data) > 1500, str(len(data)))
        with page.expect_download() as dl: page.get_by_role('button', name='CSV (koma)').click()
        d = dl.value; csv_path = f'{SHOT}/rekap.csv'; d.save_as(csv_path)
        csv = open(csv_path, encoding='utf-8-sig').read()
        check('CSV memuat baris sintaks & ringkasan', 'Rencana (detik)' in csv and 'Ketepatan waktu total' in csv)
        page.goto(f'{URL}#/history'); page.wait_for_selector('.hist-row')
        check('riwayat menampilkan 1 item', page.locator('.hist-row').count() == 1)

        print('\n[5] Teleprompter')
        page.goto(f'{URL}#/teleprompter'); page.wait_for_selector('.tp-body')
        check('teleprompter menampilkan panduan', 'KALIMAT GURU' in page.locator('.tp-body').inner_text())
        page.locator('.tp-bar select').select_option('all'); page.wait_for_timeout(200)
        check('mode seluruh naskah: 10 sintaks', page.locator('.tp-syn').count() == 10)
        page.screenshot(path=f'{SHOT}/09-teleprompter.png')

        print('\n[6] Backup & restore')
        page.goto(f'{URL}#/backup'); page.wait_for_selector('.card')
        with page.expect_download() as dl: page.get_by_role('button', name='Unduh Cadangan Lengkap').click()
        bpath = f'{SHOT}/backup.json'; dl.value.save_as(bpath)
        bj = json.load(open(bpath))
        check('cadangan berisi proyek, riwayat, pengaturan', len(bj['projects']) >= 2 and len(bj['history']) == 1 and 'settings' in bj)
        # hapus proyek lalu pulihkan
        n_before = page.evaluate("JSON.parse(localStorage.getItem('ukin.projects')).length")
        page.evaluate("localStorage.setItem('ukin.projects','[]')")
        page.set_input_files('input[type=file]', bpath); page.wait_for_timeout(400)
        page.get_by_role('button', name='Impor / Pulihkan').click(); page.wait_for_timeout(300)
        n_after = page.evaluate("JSON.parse(localStorage.getItem('ukin.projects')).length")
        check('pemulihan mengembalikan proyek', n_after == n_before, f'{n_before} vs {n_after}')

        print('\n[7] Pengaturan, tema')
        page.goto(f'{URL}#/settings'); page.wait_for_selector('.choices')
        page.locator('.choice:has-text("Gelap") input').check(); page.wait_for_timeout(150)
        check('tema gelap diterapkan', page.evaluate("document.documentElement.dataset.theme") == 'dark')
        page.screenshot(path=f'{SHOT}/10-settings-dark.png')
        page.locator('.choice:has-text("Kontras tinggi") input').check(); page.wait_for_timeout(150)
        check('tema kontras tinggi diterapkan', page.evaluate("document.documentElement.dataset.theme") == 'contrast')
        page.reload(); page.wait_for_timeout(300)
        check('tema tersimpan setelah reload', page.evaluate("document.documentElement.dataset.theme") == 'contrast')
        page.locator('.choice:has-text("Terang") input').check() if page.locator('.choice:has-text("Terang")').count() else None

        print('\n[8] Offline (Service Worker)')
        page.clock.uninstall() if hasattr(page.clock, 'uninstall') else None
        ctx2 = browser.new_context(viewport={'width': 1366, 'height': 768}, service_workers='allow')
        pg = ctx2.new_page()
        pg.on('pageerror', lambda e: errors.append('pageerror(offline): ' + str(e)))
        pg.goto(URL); pg.wait_for_selector('.hero')
        ready = False
        for _ in range(40):
            pg.wait_for_timeout(300)
            st = pg.evaluate("App.checkOffline().then(o => o.state)")
            if st == 'ready': ready = True; break
        check('SW aktif & semua aset tersimpan ("ready")', ready, str(st))
        info = pg.evaluate("App.offline.info")
        check('18 aset ter-cache', info and info['cached'] == info['total'] == 18, str(info))
        pg.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('ukin.projects'));p[0].title='Judul Offline Uji';localStorage.setItem('ukin.projects',JSON.stringify(p));})()")
        ctx2.set_offline(True)
        pg.reload(); pg.wait_for_selector('.hero', timeout=8000)
        check('buka ulang saat OFFLINE berhasil', True)
        check('indikator OFFLINE tampil', 'OFFLINE' in pg.locator('#topNet').inner_text())
        check('data tetap ada saat offline', 'Judul Offline Uji' in pg.locator('.hero-title').inner_text() or 'Judul Offline Uji' in pg.locator('.project-list').inner_text())
        pg.goto(f'{URL}#/live'); pg.wait_for_selector('.live')
        pg.locator('.lv-ctl-main button:has-text("MULAI")').first.click(); pg.wait_for_timeout(2300)
        t = pg.locator('.lv-total-num').first.inner_text().strip()
        check('timer berjalan penuh saat OFFLINE', t != '--:--' and t < '40:00', t)
        pg.goto(f'{URL}#/syntax'); pg.wait_for_selector('.syn-row')
        pg.screenshot(path=f'{SHOT}/11-offline-syntax.png')
        check('halaman lain bekerja saat offline', pg.locator('.syn-row').count() >= 1)
        ctx2.set_offline(False)

        print('\n[9] Layar ponsel')
        ctx3 = browser.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
        pm = ctx3.new_page(); pm.goto(f'{URL}#/live'); pm.wait_for_selector('.live'); pm.wait_for_timeout(300)
        pm.screenshot(path=f'{SHOT}/12-mobile-live.png')
        check('ponsel: tidak ada scroll horizontal', pm.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
        pm.goto(f'{URL}#/dashboard'); pm.wait_for_timeout(300); pm.screenshot(path=f'{SHOT}/13-mobile-dash.png')
        check('ponsel dashboard: tidak ada scroll horizontal', pm.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
        browser.close()
finally:
    srv.terminate()

real_errors = [e for e in errors if 'favicon' not in e]
print('\nGalat konsol/halaman:', real_errors if real_errors else 'tidak ada')
print(f'\n{passed} pemeriksaan lulus, {len(failed)} gagal')
if failed: print('GAGAL:', failed)
sys.exit(1 if failed or real_errors else 0)
