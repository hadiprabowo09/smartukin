/* ==========================================================================
   SMART UKIN TIMER — storage.js
   Penyimpanan lokal (localStorage) untuk proyek, template pribadi, riwayat,
   pengaturan, dan sesi timer. Tanpa server. Aman bila localStorage diblokir
   (jatuh ke memori, dengan peringatan).
   ========================================================================== */
(function (root) {
  'use strict';

  var PREFIX = 'ukin.';
  var mem = {};
  var persistent = (function () {
    try { localStorage.setItem(PREFIX + '__t', '1'); localStorage.removeItem(PREFIX + '__t'); return true; }
    catch (e) { return false; }
  })();
  var lastError = null;

  function get(key, def) {
    try {
      var raw = persistent ? localStorage.getItem(PREFIX + key) : mem[key];
      return raw == null ? def : JSON.parse(raw);
    } catch (e) { return def; }
  }
  function set(key, val) {
    var raw = JSON.stringify(val);
    try {
      if (persistent) localStorage.setItem(PREFIX + key, raw); else mem[key] = raw;
      lastError = null; return true;
    } catch (e) { lastError = e; return false; }
  }
  function del(key) { try { if (persistent) localStorage.removeItem(PREFIX + key); else delete mem[key]; } catch (e) {} }

  function uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var DEFAULT_SETTINGS = {
    theme: 'light',            // light | dark | contrast
    guideSize: 'large',        // normal | large | xl
    lineHeight: 1.5,
    silent: false,             // mode senyap: tanpa suara
    alarmSound: 'bell',        // bell | chime | beep | digital
    volume: 0.6,
    vibrate: false,
    wakeLock: true,
    flash: true,
    overtimeRemindSec: 60,
    autoMode: true,
    tpFont: 56, tpLine: 1.5, tpMirror: false, tpMode: 'current'
  };

  var DEFAULT_WARN = [300, 180, 60, 30];

  /* ---------- normalisasi ---------- */
  function normSyntax(x) {
    x = x || {};
    var cl = Array.isArray(x.checklist) ? x.checklist : [];
    return {
      id: x.id || uid('s'),
      phase: typeof x.phase === 'string' ? x.phase : '',
      name: String(x.name || 'Sintaks baru'),
      durationSec: Math.max(1, Math.round(Number(x.durationSec) || 60)),
      description: String(x.description || ''), objective: String(x.objective || ''),
      teacherActivity: String(x.teacherActivity || ''), studentActivity: String(x.studentActivity || ''),
      teacherSay: String(x.teacherSay || ''), media: String(x.media || ''),
      indicator: String(x.indicator || ''), notes: String(x.notes || ''),
      checklist: cl.map(function (c) { return { text: String(typeof c === 'string' ? c : (c && c.text) || '') }; })
        .filter(function (c) { return c.text.trim(); })
    };
  }
  function normProject(p) {
    p = p || {};
    var warn = Array.isArray(p.warnings) ? p.warnings.map(Number).filter(function (n) { return n > 0; }) : DEFAULT_WARN.slice();
    var sy = (Array.isArray(p.syntaxes) ? p.syntaxes : []).map(normSyntax);
    var sum = sy.reduce(function (a, s) { return a + s.durationSec; }, 0);
    return {
      id: p.id || uid('p'),
      title: String(p.title || 'Proyek tanpa judul'),
      subject: String(p.subject || ''), grade: String(p.grade || ''), model: String(p.model || ''),
      totalSec: Math.max(1, Math.round(Number(p.totalSec) || sum || 600)),
      startTime: /^\d{2}:\d{2}$/.test(p.startTime || '') ? p.startTime : '',
      endTime: /^\d{2}:\d{2}$/.test(p.endTime || '') ? p.endTime : '',
      autoStartAtSchedule: !!p.autoStartAtSchedule,
      autoMode: p.autoMode !== false,
      gapSec: Math.max(0, Math.round(Number(p.gapSec) || 0)),
      warnings: Array.from(new Set(warn)).sort(function (a, b) { return b - a; }),
      warnEnd: p.warnEnd !== false,
      syntaxes: sy,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString()
    };
  }

  /* ---------- proyek ---------- */
  function projects() { return get('projects', []); }
  function saveProjects(arr) { return set('projects', arr); }
  function getProject(id) {
    var a = projects(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null;
  }
  function saveProject(p) {
    p = normProject(p); p.updatedAt = new Date().toISOString();
    var a = projects(), found = false;
    for (var i = 0; i < a.length; i++) if (a[i].id === p.id) { a[i] = p; found = true; break; }
    if (!found) a.unshift(p);
    var ok = saveProjects(a);
    return ok ? p : null;
  }
  function deleteProject(id) {
    saveProjects(projects().filter(function (p) { return p.id !== id; }));
    if (activeId() === id) {
      var rest = projects(); set('activeId', rest.length ? rest[0].id : null);
    }
  }
  function duplicateProject(id) {
    var p = getProject(id); if (!p) return null;
    var c = JSON.parse(JSON.stringify(p));
    c.id = uid('p'); c.title = p.title + ' (salinan)';
    c.syntaxes.forEach(function (s) { s.id = uid('s'); });
    c.createdAt = new Date().toISOString();
    return saveProject(c);
  }
  function activeId() {
    var id = get('activeId', null);
    if (id && getProject(id)) return id;
    var a = projects(); return a.length ? a[0].id : null;
  }
  function setActive(id) { set('activeId', id); }
  function activeProject() { var id = activeId(); return id ? getProject(id) : null; }

  /* ---------- template pribadi ---------- */
  function userTemplates() { return get('templates', []); }
  function saveUserTemplate(t) {
    var a = userTemplates();
    t.id = t.id || uid('tpl');
    var sy = (t.syntaxes || []).map(normSyntax);
    var rec = { id: t.id, name: t.name || 'Template saya', model: t.model || '', desc: t.desc || '', builtin: false,
      syntaxes: sy, totalSec: sy.reduce(function (s, x) { return s + x.durationSec; }, 0), savedAt: new Date().toISOString() };
    a.unshift(rec); set('templates', a); return rec;
  }
  function deleteUserTemplate(id) { set('templates', userTemplates().filter(function (t) { return t.id !== id; })); }

  /* membuat proyek baru dari data template */
  function projectFromTemplate(tpl, meta) {
    meta = meta || {};
    var sy = tpl.syntaxes.map(function (s) { var c = normSyntax(s); c.id = uid('s'); return c; });
    var sum = sy.reduce(function (a, s) { return a + s.durationSec; }, 0);
    return saveProject({
      title: meta.title || tpl.name.replace(/^Template\s+/, ''), subject: meta.subject || '', grade: meta.grade || '',
      model: meta.model || tpl.model || '', totalSec: meta.totalSec || sum, syntaxes: sy,
      startTime: meta.startTime || '', endTime: meta.endTime || '',
      autoMode: settings().autoMode, warnings: DEFAULT_WARN.slice(), warnEnd: true, gapSec: 0
    });
  }

  /* ---------- riwayat ---------- */
  function history() { return get('history', []); }
  function addHistory(rep) {
    var a = history(); rep.id = rep.id || uid('h'); rep.savedAt = new Date().toISOString();
    a.unshift(rep); if (a.length > 200) a.length = 200; set('history', a); return rep;
  }
  function getHistory(id) { var a = history(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function deleteHistory(id) { set('history', history().filter(function (h) { return h.id !== id; })); }
  function clearHistory() { set('history', []); }

  /* ---------- pengaturan ---------- */
  function settings() {
    var s = get('settings', {}), out = {};
    for (var k in DEFAULT_SETTINGS) out[k] = s[k] === undefined ? DEFAULT_SETTINGS[k] : s[k];
    return out;
  }
  function saveSettings(s) { return set('settings', s); }
  function patchSettings(patch) { var s = settings(); for (var k in patch) s[k] = patch[k]; saveSettings(s); return s; }

  /* ---------- sesi timer ---------- */
  function session() { return get('session', null); }
  function saveSession(s) { return set('session', s); }
  function clearSession() { del('session'); }

  /* ---------- backup ---------- */
  function exportAll() {
    return {
      app: 'SMART UKIN TIMER', kind: 'backup', version: 1, exportedAt: new Date().toISOString(),
      projects: projects(), templates: userTemplates(), history: history(), settings: settings(), activeId: activeId()
    };
  }
  function exportProject(id) {
    var p = getProject(id); if (!p) return null;
    return { app: 'SMART UKIN TIMER', kind: 'project', version: 1, exportedAt: new Date().toISOString(), project: p };
  }
  function mergeById(oldArr, newArr) {
    var map = {}; oldArr.forEach(function (x) { map[x.id] = x; });
    newArr.forEach(function (x) { map[x.id] = x; });
    var seen = {}, out = [];
    newArr.concat(oldArr).forEach(function (x) { if (!seen[x.id]) { seen[x.id] = 1; out.push(map[x.id]); } });
    return out;
  }
  /* mode: 'merge' | 'replace'. Kembalikan ringkasan jumlah atau lempar Error. */
  function importData(data, mode) {
    if (!data || typeof data !== 'object') throw new Error('File bukan JSON yang valid.');
    if (data.kind === 'project' || (data.project && data.project.syntaxes) || (Array.isArray(data.syntaxes) && !data.projects)) {
      var src = data.project || data;
      var p = normProject(src); p.id = uid('p');
      p.title = p.title + ' (impor)';
      p.syntaxes.forEach(function (s) { s.id = uid('s'); });
      var saved = saveProject(p); if (!saved) throw new Error('Gagal menyimpan (penyimpanan penuh?).');
      return { projects: 1, templates: 0, history: 0, single: saved.id };
    }
    if (!Array.isArray(data.projects) && !Array.isArray(data.templates) && !Array.isArray(data.history))
      throw new Error('Format file tidak dikenali sebagai cadangan SMART UKIN TIMER.');
    var np = (data.projects || []).map(normProject);
    var nt = (data.templates || []).map(function (t) {
      var sy = (t.syntaxes || []).map(normSyntax);
      return { id: t.id || uid('tpl'), name: t.name || 'Template', model: t.model || '', desc: t.desc || '', builtin: false,
        syntaxes: sy, totalSec: sy.reduce(function (a, s) { return a + s.durationSec; }, 0), savedAt: t.savedAt };
    });
    var nh = Array.isArray(data.history) ? data.history : [];
    var ok;
    if (mode === 'replace') {
      ok = saveProjects(np) && set('templates', nt) && set('history', nh);
      if (data.settings) { var cur = {}; for (var k in DEFAULT_SETTINGS) cur[k] = data.settings[k] === undefined ? DEFAULT_SETTINGS[k] : data.settings[k]; saveSettings(cur); }
      set('activeId', data.activeId && np.some(function (x) { return x.id === data.activeId; }) ? data.activeId : (np[0] && np[0].id) || null);
      clearSession();
    } else {
      ok = saveProjects(mergeById(projects(), np)) && set('templates', mergeById(userTemplates(), nt)) &&
        set('history', mergeById(history(), nh).slice(0, 200));
    }
    if (!ok) throw new Error('Gagal menyimpan (penyimpanan penuh?).');
    return { projects: np.length, templates: nt.length, history: nh.length };
  }
  function resetAll() {
    ['projects', 'templates', 'history', 'settings', 'session', 'activeId', 'seeded'].forEach(del);
  }
  function usageBytes() {
    var n = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) n += k.length + localStorage.getItem(k).length; } } catch (e) {}
    return n * 2;
  }

  root.UkinStore = {
    persistent: persistent, uid: uid, lastError: function () { return lastError; },
    DEFAULT_SETTINGS: DEFAULT_SETTINGS, DEFAULT_WARN: DEFAULT_WARN,
    normSyntax: normSyntax, normProject: normProject,
    projects: projects, getProject: getProject, saveProject: saveProject, deleteProject: deleteProject,
    duplicateProject: duplicateProject, activeId: activeId, setActive: setActive, activeProject: activeProject,
    userTemplates: userTemplates, saveUserTemplate: saveUserTemplate, deleteUserTemplate: deleteUserTemplate,
    projectFromTemplate: projectFromTemplate,
    history: history, addHistory: addHistory, getHistory: getHistory, deleteHistory: deleteHistory, clearHistory: clearHistory,
    settings: settings, saveSettings: saveSettings, patchSettings: patchSettings,
    session: session, saveSession: saveSession, clearSession: clearSession,
    exportAll: exportAll, exportProject: exportProject, importData: importData, resetAll: resetAll, usageBytes: usageBytes,
    get: get, set: set
  };
})(typeof self !== 'undefined' ? self : this);
