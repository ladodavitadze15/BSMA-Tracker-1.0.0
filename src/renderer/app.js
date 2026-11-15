const THEME_PRESETS = [
  {
    id: 'midnight',
    nameEn: 'Midnight Aurora',
    nameKa: 'შუაღამის ავრორა',
    bg: '#080c14',
    surfaceRgb: '17, 24, 39',
    surface2Rgb: '26, 35, 54',
    primary: '#3b82f6',
    aura1: '#1d4ed8',
    aura2: '#6d28d9',
    aura3: '#047857',
  },
  {
    id: 'ocean',
    nameEn: 'Deep Ocean',
    nameKa: 'ღრმა ოკეანე',
    bg: '#041019',
    surfaceRgb: '9, 25, 38',
    surface2Rgb: '14, 37, 56',
    primary: '#06b6d4',
    aura1: '#0284c7',
    aura2: '#0d9488',
    aura3: '#1e40af',
  },
  {
    id: 'cyber',
    nameEn: 'Cyber Nebula',
    nameKa: 'კიბერ ნებულა',
    bg: '#0d0718',
    surfaceRgb: '24, 15, 42',
    surface2Rgb: '36, 22, 62',
    primary: '#a855f7',
    aura1: '#9333ea',
    aura2: '#ec4899',
    aura3: '#3b82f6',
  },
  {
    id: 'emerald',
    nameEn: 'Emerald Matrix',
    nameKa: 'ზურმუხტის მატრიცა',
    bg: '#06120e',
    surfaceRgb: '11, 29, 23',
    surface2Rgb: '17, 42, 34',
    primary: '#10b981',
    aura1: '#059669',
    aura2: '#0284c7',
    aura3: '#15803d',
  },
  {
    id: 'sunset',
    nameEn: 'Sunset Horizon',
    nameKa: 'მზის ჩასვლა',
    bg: '#160b12',
    surfaceRgb: '32, 17, 26',
    surface2Rgb: '48, 25, 38',
    primary: '#f43f5e',
    aura1: '#e11d48',
    aura2: '#f59e0b',
    aura3: '#7c3aed',
  },
  {
    id: 'obsidian',
    nameEn: 'Minimal Obsidian',
    nameKa: 'მინიმალისტური შავი',
    bg: '#09090b',
    surfaceRgb: '20, 20, 24',
    surface2Rgb: '30, 30, 36',
    primary: '#6366f1',
    aura1: '#27272a',
    aura2: '#18181b',
    aura3: '#3f3f46',
  },
  {
    id: 'arctic',
    nameEn: 'Arctic Horizon',
    nameKa: 'არქტიკული ჰორიზონტი',
    bg: '#07131e',
    surfaceRgb: '14, 29, 44',
    surface2Rgb: '22, 43, 64',
    primary: '#38bdf8',
    aura1: '#0284c7',
    aura2: '#6366f1',
    aura3: '#0ea5e9',
  },
  {
    id: 'bioluminescent',
    nameEn: 'Bioluminescent Sea',
    nameKa: 'ბიოლუმინესცენტური ზღვა',
    bg: '#031214',
    surfaceRgb: '8, 28, 32',
    surface2Rgb: '13, 42, 48',
    primary: '#14b8a6',
    aura1: '#0d9488',
    aura2: '#2563eb',
    aura3: '#06b6d4',
  },
];

const ACCENT_SWATCHES = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b'];

const GOAL_GRADES = [
  { letter: 'A', min: 91 },
  { letter: 'B', min: 81 },
  { letter: 'C', min: 71 },
  { letter: 'D', min: 61 },
  { letter: 'E', min: 51 },
];

function getGoalsStorageKey(username) {
  const clean = String(username || '').trim();
  return clean ? `bsma_goals_${clean}` : 'bsma_goals';
}

function loadSavedGoals(username = '') {
  try {
    const key = getGoalsStorageKey(username);
    let raw = localStorage.getItem(key);
    if (!raw && username && localStorage.getItem('bsma_goals_migrated') !== '1') {
      const legacy = localStorage.getItem('bsma_goals');
      if (legacy) {
        localStorage.setItem(key, legacy);
        localStorage.setItem('bsma_goals_migrated', '1');
        raw = legacy;
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const defaultTheme = {
  presetId: 'midnight',
  primary: '#3b82f6',
  wallpaper: '',
  blur: 16,
  dim: 45,
  cardOpacity: 78,
  animations: true,
  auraEnabled: true,
  particlesEnabled: true,
};

function loadSavedTheme() {
  try {
    const raw = localStorage.getItem('bsma_theme');
    return raw ? { ...defaultTheme, ...JSON.parse(raw) } : { ...defaultTheme };
  } catch {
    return { ...defaultTheme };
  }
}

const state = {
  lang: localStorage.getItem('bsma_lang') || 'en',
  theme: loadSavedTheme(),
  goals: {},
  username: '',
  savedAccounts: [],
  sessionEpoch: 0,
  data: null,
  analyzedCache: new Map(),
  dirtyTabs: new Set(['overview', 'marks', 'analytics', 'study', 'tests', 'attendance', 'goals', 'program', 'exams', 'customize']),
  previousScores: {},
  selectedSemester: null,
  programSemester: 'ALL',
  programSearch: '',
  testsFilter: 'UPCOMING',
  selectedWeek: 'AUTO',
  detectedWeek: 6,
  syllabusesByBookId: {},
  scanningSyllabuses: false,
  activeTab: 'overview',
  syncTimer: null,
  activeSyllabusBook: null,
  appVersion: '',
  updateInfo: null,
  updateDismissed: false,
  updateDownloading: false,
  updateProgressPct: 0,
};

// DOM refs
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const loginStatus = document.getElementById('login-status');
const savedAccountsSection = document.getElementById('saved-accounts-section');
const savedAccountsList = document.getElementById('saved-accounts-list');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const smsField = document.getElementById('sms-field');
const cancelSmsBtn = document.getElementById('cancel-sms-btn');
const syncBtn = document.getElementById('sync-btn');
const syncError = document.getElementById('sync-error');
const toastBanner = document.getElementById('toast-banner');
const semesterSelect = document.getElementById('semester-select');
const autoSyncCheckbox = document.getElementById('auto-sync');
const switchAccountBtn = document.getElementById('switch-account-btn');
const logoutBtn = document.getElementById('logout-btn');
const subjectModal = document.getElementById('subject-modal');
const modalClose = document.getElementById('modal-close');
const syllabusModal = document.getElementById('syllabus-modal');
const sylModalClose = document.getElementById('syl-modal-close');
const sylDownloadBtn = document.getElementById('syl-download-btn');
const sylOpenBtn = document.getElementById('syl-open-btn');
const programSearchInput = document.getElementById('program-search');
const weekSelectStudy = document.getElementById('week-select-study');
const scanBtn = document.getElementById('scan-syllabuses-btn');
const loginVersionPill = document.getElementById('login-version-pill');
const loginUpdateSlot = document.getElementById('login-update-slot');
const appVersionLabel = document.getElementById('app-version-label');
const checkUpdateBtn = document.getElementById('check-update-btn');
const updateStatusMsg = document.getElementById('update-status-msg');
const updateBanner = document.getElementById('update-banner');
const updateBannerTitle = document.getElementById('update-banner-title');
const updateBannerVersions = document.getElementById('update-banner-versions');
const updateBannerNotes = document.getElementById('update-banner-notes');
const updateProgressWrap = document.getElementById('update-progress-wrap');
const updateProgressFill = document.getElementById('update-progress-fill');
const updateProgressText = document.getElementById('update-progress-text');
const updateNowBtn = document.getElementById('update-now-btn');
const updateNotesBtn = document.getElementById('update-notes-btn');
const updateLaterBtn = document.getElementById('update-later-btn');

function t(key, vars = {}) {
  const dict = window.I18N[state.lang] || window.I18N.en;
  let str = dict[key] ?? window.I18N.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return str;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  toastBanner.textContent = msg;
  toastBanner.classList.remove('hidden');
  setTimeout(() => toastBanner.classList.add('hidden'), 4500);
}

function applyTheme() {
  const th = state.theme;
  const preset = THEME_PRESETS.find((p) => p.id === th.presetId) || THEME_PRESETS[0];
  const root = document.documentElement.style;

  root.setProperty('--bg', preset.bg);
  root.setProperty('--surface-rgb', preset.surfaceRgb);
  root.setProperty('--surface-2-rgb', preset.surface2Rgb);
  root.setProperty('--primary', th.primary || preset.primary);
  root.setProperty('--aura-1', preset.aura1);
  root.setProperty('--aura-2', preset.aura2);
  root.setProperty('--aura-3', preset.aura3);
  root.setProperty('--glass-blur', `${th.blur}px`);
  root.setProperty('--bg-dim', (th.dim / 100).toFixed(2));
  root.setProperty('--card-alpha', (th.cardOpacity / 100).toFixed(2));

  const wp = document.getElementById('bg-wallpaper');
  if (th.wallpaper) {
    wp.style.backgroundImage = `url("${th.wallpaper}")`;
    wp.style.opacity = '1';
  } else {
    wp.style.backgroundImage = 'none';
    wp.style.opacity = '0';
  }

  const aura = document.getElementById('bg-aura');
  aura.classList.toggle('hidden', !th.auraEnabled);
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    bgCanvas.classList.toggle('hidden', !(th.particlesEnabled && th.animations));
  }
  document.body.classList.toggle('anim-enabled', Boolean(th.animations));
  if (typeof window.__bsmaUpdateVfx === 'function') {
    window.__bsmaUpdateVfx();
  }

  try {
    localStorage.setItem('bsma_theme', JSON.stringify(th));
  } catch {
    // Ignore quota errors if huge wallpaper
  }
}

function getComponentDisplayName(comp) {
  const kaName = (comp?.name || '').trim();
  if (state.lang === 'ka') {
    return kaName || comp?.altName || 'კომპონენტი';
  }
  if (window.COMPONENT_NAME_EN && window.COMPONENT_NAME_EN[kaName]) {
    return window.COMPONENT_NAME_EN[kaName];
  }
  return comp?.altName || kaName || 'Component';
}

function parseWeekNumber(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\s*კვირ/i) || String(str).match(/week\s*(\d{1,2})/i);
  return m ? Number(m[1]) : null;
}

/**
 * Splits a component into its exact syllabus sub-items (by week/task)
 * so e.g. a 20-pt Case Study held in Week 5 (10 pts) and Week 11 (10 pts)
 * shows Week 5 = 10/10 (100%) and Week 11 = —/10 (Upcoming) instead of 10/20!
 */
function roundScore(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

function getEffectiveBookScore(book, analyzed = null) {
  const an = analyzed || analyzeSubjectMarks(book);
  const rawBookScore = Number(book?.score);
  const bookScore = Number.isFinite(rawBookScore) ? rawBookScore : 0;
  const earned = Number(an?.earnedSoFar || 0);
  const summaryScore = Number(an?.summaryTotalScore || 0);
  return roundScore(Math.max(bookScore, earned, summaryScore));
}

function splitComponentBySyllabus(comp) {
  const subDefs = Array.isArray(comp?.data?.items) ? comp.data.items : [];
  const gradeEntries = Array.isArray(comp?.items) ? comp.items : [];
  const totalMax = Number(comp?.data?.maxScore || comp?.data?.weight || 0);
  const compCode = comp?.data?.component?.code || '';

  const entryByKey = new Map();
  gradeEntries.forEach((it, idx) => {
    if (it.key !== undefined && it.key !== null && it.key !== '') {
      const numKey = Number(it.key);
      if (Number.isFinite(numKey)) entryByKey.set(numKey, it);
      entryByKey.set(String(it.key), it);
    } else {
      entryByKey.set(idx, it);
    }
  });

  const subItems = [];

  if (subDefs.length > 0) {
    subDefs.forEach((def, idx) => {
      const maxVal = Number(def.maxValue ?? def.weight ?? totalMax ?? 0);
      const weekNum = parseWeekNumber(def.name);
      const entry =
        (def.key !== undefined && def.key !== null ? entryByKey.get(String(def.key)) : undefined) ||
        (def.id !== undefined && def.id !== null ? entryByKey.get(String(def.id)) : undefined) ||
        entryByKey.get(idx) ||
        gradeEntries[idx];
      let hasGrade = entry !== undefined && entry.value !== '' && entry.value !== null && entry.value !== undefined && Number.isFinite(Number(entry.value));
      let scoreVal = hasGrade ? Number(entry.value) : null;

      // Fallback if only 1 subDef and score is stored on comp.result
      if (!hasGrade && subDefs.length === 1 && comp.result !== '' && comp.result !== null && comp.result !== undefined && Number.isFinite(Number(comp.result))) {
        hasGrade = true;
        scoreVal = Number(comp.result);
      }

      let label = def.name || '';
      if (weekNum) {
        label = t('weekLabel', { w: weekNum });
      } else if (!label) {
        label = getComponentDisplayName(comp);
      }

      subItems.push({
        index: idx,
        weekNum,
        rawName: def.name || '',
        label,
        maxValue: maxVal,
        minLimit: Number(def.minLimit || 0),
        graded: hasGrade,
        score: scoreVal,
      });
    });
  } else if (totalMax > 0) {
    const hasGrade = comp.result !== '' && comp.result !== null && comp.result !== undefined && Number.isFinite(Number(comp.result));
    subItems.push({
      index: 0,
      weekNum: null,
      rawName: '',
      label: getComponentDisplayName(comp),
      maxValue: totalMax,
      minLimit: Number(comp?.data?.minLimit || 0),
      graded: hasGrade,
      score: hasGrade ? Number(comp.result) : null,
    });
  }

  const effectiveTotalMax = totalMax > 0
    ? totalMax
    : subItems.reduce((s, it) => s + Number(it.maxValue || 0), 0);
  const earnedSum = roundScore(subItems.reduce((s, it) => s + (it.graded ? Number(it.score || 0) : 0), 0));
  const gradedMaxSum = roundScore(subItems.reduce((s, it) => s + (it.graded ? Number(it.maxValue || 0) : 0), 0));

  return {
    title: getComponentDisplayName(comp),
    code: compCode,
    totalMax: effectiveTotalMax,
    earnedSum,
    gradedMaxSum,
    subItems,
  };
}

function isSummaryComponent(comp) {
  const code = comp?.data?.component?.code || '';
  return [
    'total',
    'total_before_the_final_exam_retake',
    'final_assessment',
    'result2',
    'final_exam_retake',
  ].includes(code);
}

function isAttendanceComponent(comp) {
  return comp?.componentType === 5 || comp?.altName === 'Attendance' || comp?.name === 'დასწრება';
}

function analyzeSubjectMarks(book) {
  const cacheKey = `${book.id}:${state.lang}`;
  if (state.analyzedCache.has(cacheKey)) {
    return state.analyzedCache.get(cacheKey);
  }

  const comps = state.data?.detailsByBookId?.[book.id] || [];
  const ratingComps = [];
  let midtermComp = null;
  let finalComp = null;

  let earnedSoFar = 0;
  let gradedMaxSoFar = 0;
  let summaryTotalScore = 0;
  const allSubTasks = [];

  for (const comp of comps) {
    if (isAttendanceComponent(comp)) continue;
    if (isSummaryComponent(comp)) {
      const resVal = Number(comp?.result);
      if (Number.isFinite(resVal) && resVal > summaryTotalScore) {
        summaryTotalScore = resVal;
      }
      continue;
    }
    const split = splitComponentBySyllabus(comp);
    if (split.totalMax <= 0) continue;

    earnedSoFar = roundScore(earnedSoFar + split.earnedSum);
    gradedMaxSoFar = roundScore(gradedMaxSoFar + split.gradedMaxSum);

    for (const sub of split.subItems) {
      allSubTasks.push({
        ...sub,
        bookId: book.id,
        subjectName: book.name,
        componentTitle: split.title,
        code: split.code,
      });
    }

    if (split.code === 'midterm' || comp.name === 'შუალედური გამოცდა') {
      midtermComp = split;
    } else if (split.code === 'final_examination' || comp.name === 'დასკვნითი გამოცდა') {
      finalComp = split;
    } else {
      ratingComps.push(split);
    }
  }

  // Fallback if details aren't loaded yet for older semester courses
  if (comps.length === 0 && Number(book.score || 0) > 0) {
    earnedSoFar = Number(book.score);
    gradedMaxSoFar = 100;
  }

  const accuracyPct = gradedMaxSoFar > 0 ? Math.round((earnedSoFar / gradedMaxSoFar) * 100) : null;
  const upcomingSubTasks = allSubTasks
    .filter((x) => !x.graded && x.weekNum !== null)
    .sort((a, b) => a.weekNum - b.weekNum);

  const result = {
    earnedSoFar,
    gradedMaxSoFar,
    summaryTotalScore,
    accuracyPct,
    ratingComps,
    midtermComp,
    finalComp,
    allSubTasks,
    nextTask: upcomingSubTasks[0] || null,
  };
  state.analyzedCache.set(cacheKey, result);
  return result;
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const langLabel = state.lang === 'en' ? '🇬🇧 EN → ქარ' : '🇬🇪 ქარ → EN';
  document.getElementById('login-lang-btn').textContent = langLabel;
  document.getElementById('app-lang-btn').textContent = langLabel;

  if (togglePasswordBtn) {
    togglePasswordBtn.title = t('togglePasswordLabel');
    togglePasswordBtn.setAttribute('aria-label', t('togglePasswordLabel'));
  }

  const activeNav = document.querySelector(`.nav-item[data-tab="${state.activeTab}"]`);
  if (activeNav) {
    const labelSpan = activeNav.querySelector('[data-i18n]');
    document.getElementById('page-title').textContent = labelSpan ? labelSpan.textContent.trim() : activeNav.textContent.trim();
  }
}

function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'ka' : 'en';
  localStorage.setItem('bsma_lang', state.lang);
  state.analyzedCache.clear();
  applyTranslations();
  renderSavedAccounts();
  renderUpdateUI();
  if (state.data) {
    renderAll();
  }
}

function getFilteredBooks() {
  const books = state.data?.card?.books || [];
  if (state.selectedSemester === 'ALL' || state.selectedSemester === null) return books;
  return books.filter((b) => String(b.semester) === String(state.selectedSemester));
}

function getCurrentSemesterBooks() {
  const books = state.data?.card?.books || [];
  if (state.data?.latestSemester !== null && state.data?.latestSemester !== undefined) {
    return books.filter((b) => b.semester === state.data.latestSemester);
  }
  return books;
}

function getGradeBadgeClass(result) {
  if (result === 'A' || result === 'B') return 'badge-green';
  if (result === 'C' || result === 'D') return 'badge-blue';
  if (result === 'E') return 'badge-amber';
  return 'badge-red';
}

function computeDetectedWeek(books) {
  let heldSum = 0;
  let plannedSum = 0;
  for (const book of books) {
    for (const k of book?.attendance?.kinds || []) {
      if (k.planned > 0) {
        heldSum += Number(k.held || 0);
        plannedSum += Number(k.planned || 0);
      }
    }
  }
  const pct = plannedSum > 0 ? Math.round((heldSum / plannedSum) * 100) : 0;
  const week = plannedSum > 0 ? Math.min(15, Math.max(1, Math.round((heldSum / plannedSum) * 15))) : 1;
  return { week, pct };
}

function getActiveCheckWeek() {
  if (state.selectedWeek === 'AUTO') return state.detectedWeek;
  return Number(state.selectedWeek) || state.detectedWeek;
}

function populateWeekSelectors() {
  const options = [
    `<option value="AUTO" ${state.selectedWeek === 'AUTO' ? 'selected' : ''}>${escapeHtml(t('useDetectedWeek', { w: state.detectedWeek }))}</option>`,
  ];
  for (let w = 1; w <= 15; w++) {
    options.push(
      `<option value="${w}" ${String(state.selectedWeek) === String(w) ? 'selected' : ''}>${escapeHtml(t('weekLabel', { w }))}</option>`
    );
  }
  weekSelectStudy.innerHTML = options.join('');
}

function populateSemesters() {
  const card = state.data?.card;
  if (!card) return;

  const semesters = card.semesters || [];
  const years = card.year || [];
  const options = [];

  semesters.forEach((sem, idx) => {
    const yearLabel = state.lang === 'en'
      ? (years[idx]?.nameEng || years[idx]?.name || `${t('semesterPrefix')} ${sem}`)
      : (years[idx]?.name || years[idx]?.nameEng || `${t('semesterPrefix')} ${sem}`);
    options.push({ value: String(sem), label: yearLabel });
  });
  options.push({ value: 'ALL', label: t('allSemesters') });

  if (state.selectedSemester === null) {
    state.selectedSemester = state.data.latestSemester !== null
      ? String(state.data.latestSemester)
      : 'ALL';
  }

  semesterSelect.innerHTML = options
    .map((o) => `<option value="${escapeHtml(o.value)}" ${o.value === String(state.selectedSemester) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
    .join('');
}

function getNameInitials(fullName, fallback = 'S') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return String(fallback || 'S').slice(0, 2).toUpperCase();
}

function renderSidebarStudent() {
  const student = state.data?.student?.student;
  const program = state.data?.student?.program;
  const edu = state.data?.card?.edu;

  const fullName = student
    ? `${student.firstName || student.name || ''} ${student.lastName || ''}`.trim()
    : '';
  const displayName = fullName || (student?.id ? `Student #${student.id}` : (state.username || 'Student'));

  document.getElementById('student-avatar').textContent = getNameInitials(fullName, student?.id || state.username);
  document.getElementById('student-name').textContent = displayName;
  document.getElementById('student-id-label').textContent = `ID: ${student?.id || state.username || '—'}`;
  document.getElementById('student-program').textContent =
    (state.lang === 'en' ? edu?.altSchoolName : null) || edu?.programName || program?.name || 'BSMA';
}

// ============================================================================
// TAB 1: OVERVIEW (Focused Executive Summary)
// ============================================================================
function renderOverview() {
  const books = getFilteredBooks();
  let totalEarned = 0;
  let totalGradedMax = 0;
  let minCanMiss = null;
  let atRiskCount = 0;

  const analyzedByBook = new Map();
  for (const book of books) {
    const an = analyzeSubjectMarks(book);
    analyzedByBook.set(book.id, an);
    totalEarned += an.earnedSoFar;
    totalGradedMax += an.gradedMaxSoFar;

    for (const k of book?.attendance?.kinds || []) {
      const isMet = k.status === 'done' || Number(k.needMore || 0) <= 0 || Number(k.attended || 0) >= Number(k.required || 0);
      const safeSkips = isMet ? Number(k.remaining || 0) : Math.max(0, Number(k.remaining || 0) - Number(k.needMore || 0));
      if (!isMet && Number(k.needMore || 0) > Number(k.remaining || 0)) {
        atRiskCount++;
      }
      if (!isMet) {
        minCanMiss = minCanMiss === null ? safeSkips : Math.min(minCanMiss, safeSkips);
      }
    }
  }

  const overallAccuracy = totalGradedMax > 0 ? Math.round((totalEarned / totalGradedMax) * 100) : 0;
  const avgScore = books.length
    ? (books.reduce((sum, b) => sum + Number(b.score || 0), 0) / books.length).toFixed(1)
    : '0.0';
  const { week: approxWeek, pct: weekPct } = computeDetectedWeek(books.length ? books : getCurrentSemesterBooks());

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('kpiGradedAccuracy'))}</div>
      <div class="kpi-value" style="color:var(--green);">${overallAccuracy}%</div>
      <div class="kpi-sub">${escapeHtml(t('kpiGradedSub', { earned: totalEarned, max: totalGradedMax }))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('kpiAvgScore'))}</div>
      <div class="kpi-value">${avgScore} <span class="muted small">/ 100</span></div>
      <div class="kpi-sub">${escapeHtml(t('kpiAcrossSubjects', { n: books.length }))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('kpiCurrentWeek'))}</div>
      <div class="kpi-value">${escapeHtml(t('kpiWeekNumber', { w: approxWeek }))}</div>
      <div class="kpi-sub">${escapeHtml(t('kpiClassesHeld', { p: weekPct }))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('kpiAttendanceMargin'))}</div>
      <div class="kpi-value">${minCanMiss !== null ? escapeHtml(t('kpiLeft', { n: minCanMiss })) : '—'}</div>
      <div class="kpi-sub">${escapeHtml(atRiskCount === 0 ? t('kpiAllOnTrack') : t('kpiWarnings', { n: atRiskCount }))}</div>
    </div>
  `;

  const grid = document.getElementById('overview-subjects-grid');
  if (books.length === 0) {
    grid.innerHTML = `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
    return;
  }

  grid.innerHTML = books.map((book) => {
    const an = analyzedByBook.get(book.id);
    const acc = an.accuracyPct !== null ? `${an.accuracyPct}%` : '—';
    const accBarColor = (an.accuracyPct ?? 0) >= 80 ? 'green' : (an.accuracyPct ?? 0) >= 51 ? 'amber' : 'red';
    const nextHint = an.nextTask
      ? t('upcomingInSubject', { w: an.nextTask.weekNum, pts: an.nextTask.maxValue })
      : t('allTasksDone');

    return `
      <div class="subject-card" data-book-id="${book.id}">
        <div class="subject-top">
          <div>
            <div class="subject-name">${escapeHtml(book.name)}</div>
            <div class="row-sub">${escapeHtml(book.altProf || book.prof || t('lecturerTba'))} • ${book.credit} ${escapeHtml(t('ects'))}</div>
          </div>
          <span class="badge ${an.accuracyPct >= 80 ? 'badge-green' : getGradeBadgeClass(book.result)}">
            ${an.gradedMaxSoFar > 0 ? `${an.earnedSoFar}/${an.gradedMaxSoFar}` : escapeHtml(book.result)}
          </span>
        </div>

        <div class="dual-metric-row">
          <div class="metric-box">
            <div class="m-label">${escapeHtml(t('gradedSoFar'))}</div>
            <div class="m-val" style="color:var(--green);">${an.earnedSoFar} / ${an.gradedMaxSoFar || '—'} <span class="small muted">(${acc})</span></div>
            <div class="progress-track">
              <div class="progress-fill ${accBarColor}" style="width:${Math.min(100, an.accuracyPct || 0)}%"></div>
            </div>
          </div>
          <div class="metric-box">
            <div class="m-label">${escapeHtml(t('semesterTotal'))}</div>
            <div class="m-val">${getEffectiveBookScore(book, an)} / 100</div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${Math.min(100, getEffectiveBookScore(book, an))}%"></div>
            </div>
          </div>
        </div>

        <div class="row-sub" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
          <span>${escapeHtml(nextHint)}</span>
          <span class="badge badge-purple">🎯 ${escapeHtml(getSubjectGoalLetter(book.id))}</span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-book-id]').forEach((el) => {
    el.addEventListener('click', () => openSubjectModal(Number(el.dataset.bookId)));
  });
}

// ============================================================================
// TAB 2: MARKS BY SYLLABUS (Divided per Weekly Task — e.g. Week 5: 10/10!)
// ============================================================================
function renderComponentBoxHtml(compSplit) {
  const pillsHtml = compSplit.subItems.map((sub) => {
    if (sub.graded) {
      const isFull = sub.score >= sub.maxValue && sub.maxValue > 0;
      const isZero = sub.score === 0;
      const cls = isFull ? 'graded-full' : isZero ? 'graded-zero' : 'graded-partial';
      return `
        <div class="subitem-pill ${cls}">
          <span>${escapeHtml(sub.label)}:</span>
          <strong>${sub.score} / ${sub.maxValue}</strong>
          ${isFull ? `<span>★</span>` : ''}
        </div>
      `;
    }
    return `
      <div class="subitem-pill upcoming">
        <span>${escapeHtml(sub.label)}:</span>
        <span>— / ${sub.maxValue}</span>
      </div>
    `;
  }).join('');

  const statusBadge = compSplit.gradedMaxSum > 0
    ? `<span class="badge ${compSplit.earnedSum === compSplit.gradedMaxSum ? 'badge-green' : 'badge-blue'}">${compSplit.earnedSum} / ${compSplit.gradedMaxSum} ${escapeHtml(t('gradedBadge'))}</span>`
    : `<span class="badge badge-muted">0 / ${compSplit.totalMax}</span>`;

  return `
    <div class="comp-box">
      <div class="comp-box-head">
        <div class="row-title">${escapeHtml(compSplit.title)}</div>
        ${statusBadge}
      </div>
      <div class="subitems-list">${pillsHtml}</div>
    </div>
  `;
}

function renderMarksBySyllabus() {
  const books = getFilteredBooks();
  const container = document.getElementById('marks-syllabus-container');

  if (books.length === 0) {
    container.innerHTML = `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
    return;
  }

  container.innerHTML = books.map((book) => {
    const an = analyzeSubjectMarks(book);
    const allSplits = [
      ...an.ratingComps,
      ...(an.midtermComp ? [an.midtermComp] : []),
      ...(an.finalComp ? [an.finalComp] : []),
    ];

    const currentScore = getEffectiveBookScore(book, an);
    const targets = [
      { grade: t('gradeE'), min: 51 },
      { grade: t('gradeC'), min: 71 },
      { grade: t('gradeB'), min: 81 },
      { grade: t('gradeA'), min: 91 },
    ];

    const targetsHtml = targets.map((tg) => {
      const need = Math.max(0, tg.min - currentScore);
      return `<span class="badge badge-muted">${escapeHtml(tg.grade)}: <strong>${need === 0 ? escapeHtml(t('reached')) : `+${need}`}</strong></span>`;
    }).join(' ');

    return `
      <div class="marks-subject-card">
        <div class="marks-subject-header">
          <div>
            <div class="subject-name" style="font-size:16px;">${escapeHtml(book.name)}</div>
            <div class="row-sub">${escapeHtml(book.altProf || book.prof || t('lecturerTba'))} • ${book.credit} ${escapeHtml(t('ects'))}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="badge badge-green" style="font-size:12.5px;padding:5px 12px;">
              ${escapeHtml(t('gradedSoFar'))}: ${an.earnedSoFar} / ${an.gradedMaxSoFar || 0} (${an.accuracyPct ?? 0}%)
            </span>
            <span class="badge badge-blue" style="font-size:12.5px;padding:5px 12px;">
              ${escapeHtml(t('semesterTotal'))}: ${currentScore} / 100
            </span>
          </div>
        </div>

        ${allSplits.length > 0 ? `
          <div class="syllabus-components-grid">
            ${allSplits.map(renderComponentBoxHtml).join('')}
          </div>
        ` : `<div class="muted small">${escapeHtml(t('loadingDetails'))}</div>`}

        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <span class="muted small">${escapeHtml(t('pointsNeededTitle'))}:</span>
          ${targetsHtml}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// TAB 3: CHARTS & ANALYTICS (Animated SVG Diagrams)
// ============================================================================
function buildSvgDonut(segments, totalLabel, subLabel) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 64;
  const circum = 2 * Math.PI * radius;
  let offset = 0;

  const circles = segments.map((seg) => {
    const frac = seg.value / total;
    const len = frac * circum;
    const dashArray = `${len.toFixed(2)} ${(circum - len).toFixed(2)}`;
    const dashOffset = (-offset).toFixed(2);
    offset += len;
    return `<circle cx="85" cy="85" r="${radius}" fill="transparent" stroke="${seg.color}" stroke-width="18" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 85 85)" />`;
  }).join('');

  return `
    <svg class="donut-svg" width="170" height="170" viewBox="0 0 170 170">
      <circle cx="85" cy="85" r="${radius}" fill="transparent" stroke="rgba(148,163,184,0.12)" stroke-width="18" />
      ${circles}
      <text x="85" y="82" text-anchor="middle" fill="#fff" font-size="22" font-weight="700">${escapeHtml(totalLabel)}</text>
      <text x="85" y="102" text-anchor="middle" fill="#94a3b8" font-size="11">${escapeHtml(subLabel)}</text>
    </svg>
  `;
}

function renderAnalytics() {
  const container = document.getElementById('analytics-container');
  const currentBooks = getCurrentSemesterBooks();
  if (!currentBooks.length) {
    container.innerHTML = `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
    return;
  }

  let totalEarned = 0;
  let totalGradedMax = 0;
  let totalRemainingRating = 0;
  let totalMidterm = 0;
  let totalFinal = 0;
  const weekLoad = Array(16).fill(0);

  const subjectRowsHtml = currentBooks.map((book) => {
    const an = analyzeSubjectMarks(book);
    totalEarned += an.earnedSoFar;
    totalGradedMax += an.gradedMaxSoFar;

    for (const task of an.allSubTasks) {
      if (task.weekNum && task.weekNum >= 1 && task.weekNum <= 15) {
        weekLoad[task.weekNum] += task.maxValue;
      }
      if (!task.graded) {
        if (task.code === 'midterm') totalMidterm += task.maxValue;
        else if (task.code === 'final_examination') totalFinal += task.maxValue;
        else totalRemainingRating += task.maxValue;
      }
    }

    const acc = an.accuracyPct ?? 0;
    const effectiveScore = getEffectiveBookScore(book, an);
    return `
      <div>
        <div class="bar-row-label">
          <strong>${escapeHtml(book.name)}</strong>
          <span><span style="color:var(--green);font-weight:700;">${an.earnedSoFar}/${an.gradedMaxSoFar} (${acc}%)</span> • <span style="color:#93c5fd;">${effectiveScore}/100</span></span>
        </div>
        <div class="dual-bars">
          <div class="progress-track" style="margin-top:0;height:8px;">
            <div class="progress-fill green" style="width:${Math.min(100, acc)}%"></div>
          </div>
          <div class="progress-track" style="margin-top:0;height:6px;">
            <div class="progress-fill" style="width:${Math.min(100, effectiveScore)}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const subjCount = currentBooks.length;
  const totalSemesterPts = subjCount * 100;
  const totalLost = Math.max(0, totalGradedMax - totalEarned);
  const segments = [
    { label: t('donutEarned'), value: totalEarned, color: '#10b981' },
    { label: t('donutLost'), value: totalLost, color: '#ef4444' },
    { label: t('donutRemainingRating'), value: totalRemainingRating, color: '#3b82f6' },
    { label: t('donutMidterm', { n: subjCount }), value: totalMidterm, color: '#f59e0b' },
    { label: t('donutFinal', { n: subjCount }), value: totalFinal, color: '#8b5cf6' },
  ];

  const donutSvg = buildSvgDonut(segments, `${totalEarned}`, `/ ${totalSemesterPts} pts`);
  const legendHtml = segments.map((s) => `
    <div class="legend-item">
      <div><span class="legend-dot" style="background:${s.color}"></span>${escapeHtml(s.label)}</div>
      <strong>${s.value} pts</strong>
    </div>
  `).join('');

  // Weekly load bar chart (Weeks 1..15)
  const maxWeekPts = Math.max(10, ...weekLoad.slice(1));
  const activeWeek = getActiveCheckWeek();
  const weekColsHtml = [];
  for (let w = 1; w <= 15; w++) {
    const pts = weekLoad[w];
    const hPct = Math.max(6, Math.round((pts / maxWeekPts) * 100));
    const isNow = w === activeWeek;
    weekColsHtml.push(`
      <div class="week-col" title="${escapeHtml(t('weekLabel', { w }))}: ${pts} pts">
        <div class="muted small" style="font-size:10px;">${pts || ''}</div>
        <div class="week-bar ${isNow ? 'is-now' : ''}" style="height:${hPct}%"></div>
        <div class="small" style="font-size:11px;font-weight:${isNow ? '700' : '400'};color:${isNow ? 'var(--amber)' : 'var(--muted)'};">W${w}</div>
      </div>
    `);
  }

  // Academic History across all semesters available for this student
  const allBooks = state.data?.card?.books || [];
  const rawSems = [
    ...(state.data?.card?.semesters || []),
    ...allBooks.map((b) => b.semester),
  ].filter((s) => typeof s === 'number' && !Number.isNaN(s));
  const semNums = Array.from(new Set(rawSems)).sort((a, b) => a - b);
  const semHistoryHtml = semNums.map((s) => {
    const sBooks = allBooks.filter((b) => b.semester === s);
    const avg = sBooks.length
      ? (sBooks.reduce((sum, b) => sum + Number(b.score || 0), 0) / sBooks.length).toFixed(1)
      : '0.0';
    const passedCredits = sBooks.filter((b) => b.result !== 'F').reduce((sum, b) => sum + Number(b.credit || 0), 0);
    const totalCredits = sBooks.reduce((sum, b) => sum + Number(b.credit || 0), 0);
    return `
      <div class="list-row">
        <div>
          <div class="row-title">${escapeHtml(t('semesterPrefix'))} ${s} ${s === state.data?.latestSemester ? `(${escapeHtml(t('currentBadge'))})` : ''}</div>
          <div class="row-sub">${sBooks.length} courses • ${passedCredits}/${totalCredits} ${escapeHtml(t('ects'))}</div>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:16px;">${avg}</strong> <span class="muted small">avg</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="chart-card">
      <h3>${escapeHtml(t('chartAccuracyTitle'))}</h3>
      <div class="muted small">${escapeHtml(t('chartAccuracySub'))}</div>
      <div class="bar-chart-stack">${subjectRowsHtml}</div>
    </div>

    <div class="chart-card">
      <h3>${escapeHtml(t('chartDonutTitle', { total: totalSemesterPts }))}</h3>
      <div class="muted small">${escapeHtml(t('chartDonutSub', { n: subjCount }))}</div>
      <div class="donut-wrap">
        ${donutSvg}
        <div class="donut-legend">${legendHtml}</div>
      </div>
    </div>

    <div class="chart-card">
      <h3>${escapeHtml(t('chartWeeklyLoadTitle'))}</h3>
      <div class="muted small">${escapeHtml(t('chartWeeklyLoadSub'))}</div>
      <div class="weekly-bars-grid">${weekColsHtml.join('')}</div>
    </div>

    <div class="chart-card">
      <h3>${escapeHtml(t('chartSemHistoryTitle'))}</h3>
      <div class="muted small">${escapeHtml(t('chartSemHistorySub'))}</div>
      <div class="list-stack" style="margin-top:14px;">${semHistoryHtml}</div>
    </div>
  `;
}

// ============================================================================
// TAB 4: WEEKLY STUDY MATERIAL (Dedicated to Topics & Literature)
// ============================================================================
function renderStudyMaterial() {
  const w = getActiveCheckWeek();
  const wNext = Math.min(15, w + 1);
  document.getElementById('study-tab-sub').textContent = t('studyTabSub', { w, wNext });

  const container = document.getElementById('study-materials-grid');
  const currentBooks = getCurrentSemesterBooks();
  const anyScanned = currentBooks.some((b) => b.catalogBookId && state.syllabusesByBookId[b.catalogBookId]);

  if (!anyScanned) {
    container.innerHTML = `<div class="muted">${escapeHtml(t('noWeekInsights'))}</div>`;
    return;
  }

  container.innerHTML = currentBooks.map((book) => {
    const cId = book.catalogBookId;
    const syl = cId ? state.syllabusesByBookId[cId] : null;
    if (!syl) return '';

    const currW = (syl.weeks || []).find((x) => x.week === w);
    const nextW = (syl.weeks || []).find((x) => x.week === wNext);
    const mainLit = syl.mainLiterature || [];
    const extraLit = syl.extraLiterature || [];

    return `
      <div class="insight-card">
        <div class="subject-top">
          <div>
            <div class="row-title">${escapeHtml(book.name)}</div>
            <div class="row-sub">${escapeHtml(book.altProf || book.prof || '')}</div>
          </div>
          <span class="badge badge-blue">${escapeHtml(t('weekLabel', { w }))}</span>
        </div>

        <div class="week-topic-box">
          <strong>${escapeHtml(t('weekLabel', { w }))} (${currW?.roman || w}):</strong><br/>
          ${currW ? escapeHtml(currW.content) : escapeHtml(t('noSyllabusText'))}
        </div>

        ${nextW && w !== wNext ? `
          <div class="row-sub" style="background:rgba(8,12,20,0.4);padding:9px;border-radius:8px;">
            <strong>${escapeHtml(t('weekLabel', { w: wNext }))} (${nextW.roman}):</strong>
            ${escapeHtml(nextW.content.slice(0, 180))}${nextW.content.length > 180 ? '…' : ''}
          </div>
        ` : ''}

        ${mainLit.length ? `
          <div class="lit-box" style="padding:10px 12px;">
            <div class="row-title" style="font-size:12px;">📚 ${escapeHtml(t('literatureLabel'))}</div>
            <ul style="font-size:12px;margin-top:4px;">
              ${mainLit.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
            </ul>
            ${extraLit.length ? `<div class="muted small" style="margin-top:4px;">${escapeHtml(t('extraLitCount', { n: extraLit.length }))}</div>` : ''}
          </div>
        ` : ''}

        <div class="program-book-actions">
          <button class="btn-primary btn-sm" data-open-syl="${cId}" data-syl-title="${escapeHtml(book.name)}">${escapeHtml(t('viewSyllabus'))}</button>
          <button class="btn-ghost btn-sm" data-dl-syl="${cId}" data-syl-title="${escapeHtml(book.name)}">${escapeHtml(t('downloadSyllabus'))}</button>
          <button class="btn-ghost btn-sm" data-pdf-syl="${cId}">${escapeHtml(t('openPdfExternal'))}</button>
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  bindSyllabusActionButtons(container);
}

// ============================================================================
// TAB 5: INCOMING TESTS (Dedicated Timeline by Week & Exact Points)
// ============================================================================
function renderIncomingTests() {
  const activeWeek = getActiveCheckWeek();
  const nextWeek = Math.min(15, activeWeek + 1);
  const pillsEl = document.getElementById('tests-filter-pills');
  const container = document.getElementById('incoming-tests-container');

  const filters = [
    { id: 'SOON', label: t('filterThisAndNext', { w: activeWeek, wNext: nextWeek }) },
    { id: 'UPCOMING', label: t('filterAllWeeks') },
    { id: 'GRADED', label: t('filterCompleted') },
  ];

  pillsEl.innerHTML = filters.map((f) => `
    <button class="sem-pill ${state.testsFilter === f.id ? 'active' : ''}" data-test-filter="${f.id}">
      ${escapeHtml(f.label)}
    </button>
  `).join('');

  pillsEl.querySelectorAll('[data-test-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.testsFilter = btn.dataset.testFilter;
      renderIncomingTests();
    });
  });

  const currentBooks = getCurrentSemesterBooks();
  const allItems = [];
  for (const book of currentBooks) {
    const an = analyzeSubjectMarks(book);
    for (const task of an.allSubTasks) {
      allItems.push(task);
    }
  }

  const filtered = allItems.filter((item) => {
    if (state.testsFilter === 'GRADED') return item.graded;
    if (item.graded) return false;
    if (state.testsFilter === 'SOON') {
      return item.weekNum !== null && item.weekNum >= activeWeek && item.weekNum <= activeWeek + 2;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card"><div class="muted">${escapeHtml(t('noPending'))}</div></div>`;
    return;
  }

  // Group by weekNum (or 'EXAMS' for midterm/final without weekNum)
  const groups = new Map();
  for (const it of filtered) {
    const key = it.weekNum ? `W:${it.weekNum}` : `EXAM:${it.code || 'other'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        weekNum: it.weekNum,
        title: it.weekNum ? t('weekLabel', { w: it.weekNum }) : it.componentTitle,
        items: [],
      });
    }
    groups.get(key).items.push(it);
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (a.weekNum && b.weekNum) return a.weekNum - b.weekNum;
    if (a.weekNum) return -1;
    if (b.weekNum) return 1;
    return 0;
  });

  container.innerHTML = sortedGroups.map((grp) => {
    const isNow = grp.weekNum === activeWeek;
    const isNext = grp.weekNum === nextWeek;
    const totalPts = grp.items.reduce((s, x) => s + x.maxValue, 0);

    let timeBadge = '';
    if (grp.weekNum) {
      if (isNow) timeBadge = `<span class="badge badge-red">${escapeHtml(t('testStatusNow'))}</span>`;
      else if (isNext) timeBadge = `<span class="badge badge-amber">${escapeHtml(t('testStatusNext'))}</span>`;
      else if (grp.weekNum > activeWeek) timeBadge = `<span class="badge badge-blue">${escapeHtml(t('testStatusSoon', { d: grp.weekNum - activeWeek }))}</span>`;
    }

    const cardsHtml = grp.items.map((it) => {
      const scoreBadge = it.graded
        ? `<span class="badge ${it.score >= it.maxValue ? 'badge-green' : 'badge-blue'}">${escapeHtml(t('testStatusGraded', { s: it.score, m: it.maxValue }))}</span>`
        : `<span class="badge badge-purple">${escapeHtml(t('testCardPts', { n: it.maxValue }))}</span>`;

      return `
        <div class="test-item-card">
          <div class="subject-top">
            <div class="row-title">${escapeHtml(it.componentTitle)}</div>
            ${scoreBadge}
          </div>
          <div class="row-sub">${escapeHtml(it.subjectName)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="tests-week-group ${isNow ? 'is-current-week' : ''}">
        <div class="subject-top">
          <div style="display:flex;align-items:center;gap:10px;">
            <h3>${escapeHtml(grp.title)}</h3>
            ${timeBadge}
          </div>
          <span class="muted small">${grp.items.length} item(s) • ${totalPts} pts</span>
        </div>
        <div class="tests-cards-grid">${cardsHtml}</div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// TAB 6: ATTENDANCE (Fixed Threshold, Met Status & Miss Budget)
// ============================================================================
function renderAttendance() {
  const books = getFilteredBooks();
  const summaryEl = document.getElementById('attendance-summary');
  const grid = document.getElementById('attendance-grid');

  const withAtt = books.filter((b) => (b?.attendance?.kinds || []).length > 0);
  if (withAtt.length === 0) {
    summaryEl.innerHTML = '';
    grid.innerHTML = `<div class="muted">${escapeHtml(t('noAttendance'))}</div>`;
    return;
  }

  let totalKinds = 0;
  let metCount = 0;
  let totalAttended = 0;
  let totalHeld = 0;
  let minLecSkips = null;
  let minSemSkips = null;

  for (const book of withAtt) {
    for (const k of book.attendance.kinds) {
      totalKinds++;
      const planned = Number(k.planned || 0);
      const held = Number(k.held || 0);
      const attended = Number(k.attended || 0);
      const remaining = Number(k.remaining ?? Math.max(0, planned - held));
      const required = Number(k.required || 0);
      const needMore = Math.max(0, required - attended);
      const isMet = k.status === 'done' || needMore === 0;
      const safeSkips = isMet ? remaining : Math.max(0, remaining - needMore);

      totalAttended += attended;
      totalHeld += held;
      if (isMet) metCount++;

      if (!isMet) {
        if (k.kind === 'lecture') {
          minLecSkips = minLecSkips === null ? safeSkips : Math.min(minLecSkips, safeSkips);
        } else {
          minSemSkips = minSemSkips === null ? safeSkips : Math.min(minSemSkips, safeSkips);
        }
      }
    }
  }

  const avgRate = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 100;

  summaryEl.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('attended'))}</div>
      <div class="kpi-value" style="color:var(--green);">${avgRate}%</div>
      <div class="kpi-sub">${totalAttended} / ${totalHeld} ${escapeHtml(t('held'))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('attSummaryDone'))}</div>
      <div class="kpi-value">${metCount} / ${totalKinds}</div>
      <div class="kpi-sub">${escapeHtml(t('kpiAllOnTrack'))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('attSummaryLecturesSafe'))}</div>
      <div class="kpi-value">${minLecSkips !== null ? minLecSkips : '∞'}</div>
      <div class="kpi-sub">${minLecSkips !== null ? escapeHtml(t('canMiss', { n: minLecSkips })) : escapeHtml(t('attMetBadge'))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('attSummarySeminarsSafe'))}</div>
      <div class="kpi-value">${minSemSkips !== null ? minSemSkips : '∞'}</div>
      <div class="kpi-sub">${minSemSkips !== null ? escapeHtml(t('canMiss', { n: minSemSkips })) : escapeHtml(t('attMetBadge'))}</div>
    </div>
  `;

  grid.innerHTML = withAtt.map((book) => {
    const kindsHtml = book.attendance.kinds.map((k) => {
      const planned = Number(k.planned || 0);
      const held = Number(k.held || 0);
      const attended = Number(k.attended || 0);
      const missed = Number(k.missed || 0);
      const remaining = Number(k.remaining ?? Math.max(0, planned - held));
      const required = Number(k.required || 0);
      const minPct = Number(k.minPercent || (k.kind === 'lecture' ? 50 : 70));
      const needMore = Math.max(0, required - attended);
      const maxMissTotal = Math.max(0, planned - required);
      const isMet = k.status === 'done' || needMore === 0;
      const isImpossible = !isMet && needMore > remaining;
      const safeSkips = isMet ? remaining : Math.max(0, remaining - needMore);

      const pctAttendedOfPlanned = planned > 0 ? Math.min(100, Math.round((attended / planned) * 100)) : 0;
      const reqLinePct = planned > 0 ? Math.min(100, Math.round((required / planned) * 100)) : minPct;
      const heldRate = held > 0 ? Math.round((attended / held) * 100) : 100;

      const label = k.kind === 'lecture'
        ? t('lectures')
        : k.kind === 'seminar'
          ? t('seminars')
          : k.kind === 'laboratory'
            ? t('labs')
            : k.name;

      let badgeHtml;
      let fillClass = '';
      if (isMet) {
        badgeHtml = `<span class="badge badge-green">${escapeHtml(t('attMetBadge'))} (${attended}/${required})</span>`;
        fillClass = 'green';
      } else if (isImpossible) {
        badgeHtml = `<span class="badge badge-red">${escapeHtml(t('attFailedBadge'))}</span>`;
        fillClass = 'red';
      } else {
        const cls = safeSkips <= 1 ? 'badge-red' : safeSkips <= 3 ? 'badge-amber' : 'badge-green';
        badgeHtml = `<span class="badge ${cls}">${escapeHtml(t('canMiss', { n: safeSkips }))}</span>`;
        fillClass = safeSkips <= 1 ? 'red' : safeSkips <= 3 ? 'amber' : '';
      }

      return `
        <div class="att-kind">
          <div class="att-kind-top">
            <span>${escapeHtml(label)} • ${attended}/${planned} <span class="muted small">(${held} ${escapeHtml(t('held'))})</span></span>
            ${badgeHtml}
          </div>
          <div class="att-track-wrap">
            <div class="progress-track" style="margin-top:0;height:9px;">
              <div class="progress-fill ${fillClass}" style="width:${pctAttendedOfPlanned}%"></div>
            </div>
            <div class="att-threshold-marker" style="left:${reqLinePct}%;" title="${escapeHtml(t('attRequiredLabel', { req: required, plan: planned, m: minPct }))}"></div>
          </div>
          <div class="att-stats">
            <span>${escapeHtml(t('attRateLabel', { rate: heldRate }))} • ${escapeHtml(t('attMissBudget', { missed, maxMiss: maxMissTotal }))}</span>
            <span>${isMet ? `${escapeHtml(t('remaining'))}: ${remaining}` : escapeHtml(t('needMore', { n: needMore, r: remaining, m: minPct }))}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="row-title">${escapeHtml(book.name)}</div>
        <div class="row-sub">${escapeHtml(book.altProf || book.prof || '')}</div>
        ${kindsHtml}
      </div>
    `;
  }).join('');
}

// ============================================================================
// TAB 7: GRADE GOALS (Target A / B / C Planner)
// ============================================================================
function getSubjectGoalLetter(bookId) {
  return state.goals[String(bookId)] || 'A';
}

function setSubjectGoal(bookId, letter) {
  state.goals[String(bookId)] = letter;
  localStorage.setItem(getGoalsStorageKey(state.username), JSON.stringify(state.goals));
}

function computeGoalSuccessRate({ currentScore, earnedSoFar, gradedMaxSoFar, totalOpen, needed, reachable }) {
  if (needed <= 0) {
    return { pacePct: 100, successRate: 100 };
  }
  if (!reachable || totalOpen <= 0) {
    const pacePct = gradedMaxSoFar > 0 ? Math.round((earnedSoFar / gradedMaxSoFar) * 100) : Math.round(currentScore);
    return { pacePct, successRate: 0 };
  }

  // Historical performance pace from gained marks vs graded potential so far
  const paceRate = gradedMaxSoFar > 0
    ? Math.max(0, Math.min(1, earnedSoFar / gradedMaxSoFar))
    : (currentScore > 0 ? Math.max(0.4, Math.min(1, currentScore / 100)) : 0.75);
  const pacePct = Math.round(paceRate * 100);

  // Required scoring rate on remaining open potential
  const reqRate = Math.max(0, Math.min(1.5, needed / totalOpen));
  const margin = paceRate - reqRate;

  // Confidence/steepness increases as more of the 100-point semester is already graded
  const gradedShare = Math.max(0, Math.min(1, gradedMaxSoFar / 100));
  const steepness = 7 + gradedShare * 6;
  const logisticProb = 1 / (1 + Math.exp(-steepness * margin));

  const successRate = Math.max(1, Math.min(99, Math.round(logisticProb * 100)));
  return { pacePct, successRate };
}

function computeSubjectGoalPlan(book, goalLetter) {
  const an = analyzeSubjectMarks(book);
  const currentScore = getEffectiveBookScore(book, an);
  const goalObj = GOAL_GRADES.find((g) => g.letter === goalLetter) || GOAL_GRADES[0];

  let openRating = 0;
  let openMidterm = 0;
  let openFinal = 0;
  let preFinalEarned = 0;

  for (const task of an.allSubTasks) {
    const isMid = task.code === 'midterm';
    const isFin = task.code === 'final_examination';
    if (task.graded) {
      if (!isFin) preFinalEarned += Number(task.score || 0);
    } else {
      if (isFin) openFinal += task.maxValue;
      else if (isMid) openMidterm += task.maxValue;
      else openRating += task.maxValue;
    }
  }

  if (an.allSubTasks.length === 0 && currentScore > 0) {
    preFinalEarned = currentScore;
  }

  openRating = roundScore(openRating);
  openMidterm = roundScore(openMidterm);
  openFinal = roundScore(openFinal);
  preFinalEarned = roundScore(preFinalEarned);

  const totalOpen = roundScore(openRating + openMidterm + openFinal);
  const maxPossible = roundScore(currentScore + totalOpen);
  const maxPreFinal = roundScore(preFinalEarned + openRating + openMidterm);
  const needed = Math.max(0, roundScore(goalObj.min - currentScore));
  const reqPct = totalOpen > 0 ? Math.round((needed / totalOpen) * 100) : 0;

  const reachable = maxPossible >= goalObj.min && (an.allSubTasks.length === 0 || maxPreFinal >= 31);
  const bestReachable = GOAL_GRADES.find((g) => maxPossible >= g.min)?.letter || 'F';

  // Pre-final 31+ admission rule check
  const needForPreFinal = Math.max(0, roundScore(31 - preFinalEarned));
  const openPreFinal = roundScore(openRating + openMidterm);

  // Smart proportional split across remaining buckets (keeping final >= 20 if final is open & needed >= 20)
  let planRating = 0;
  let planMidterm = 0;
  let planFinal = 0;
  if (needed > 0 && totalOpen > 0 && reachable) {
    const ratio = Math.min(1, needed / totalOpen);
    planFinal = openFinal > 0 ? Math.min(openFinal, Math.max(Math.min(20, openFinal), Math.round(openFinal * ratio))) : 0;
    const remAfterFinal = Math.max(0, needed - planFinal);
    if (openPreFinal > 0) {
      const preRatio = Math.min(1, remAfterFinal / openPreFinal);
      planMidterm = Math.min(openMidterm, Math.round(openMidterm * preRatio));
      planRating = Math.min(openRating, Math.max(0, remAfterFinal - planMidterm));
      // Adjust rounding drift
      const diff = needed - (planRating + planMidterm + planFinal);
      if (diff > 0) {
        const addR = Math.min(diff, openRating - planRating);
        planRating += addR;
        const left = diff - addR;
        const addM = Math.min(left, openMidterm - planMidterm);
        planMidterm += addM;
        planFinal += Math.min(left - addM, openFinal - planFinal);
      }
    }
  }

  const { pacePct, successRate } = computeGoalSuccessRate({
    currentScore,
    earnedSoFar: an.earnedSoFar,
    gradedMaxSoFar: an.gradedMaxSoFar,
    totalOpen,
    needed,
    reachable,
  });

  return {
    goalObj,
    currentScore,
    openRating,
    openMidterm,
    openFinal,
    totalOpen,
    maxPossible,
    maxPreFinal,
    preFinalEarned,
    needForPreFinal,
    openPreFinal,
    needed,
    reqPct,
    pacePct,
    successRate,
    reachable,
    bestReachable,
    planRating,
    planMidterm,
    planFinal,
  };
}

function renderGoals() {
  const books = getCurrentSemesterBooks();
  const summaryEl = document.getElementById('goals-summary');
  const grid = document.getElementById('goals-grid');

  if (!books.length) {
    summaryEl.innerHTML = '';
    grid.innerHTML = `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
    return;
  }

  const plans = books.map((b) => ({ book: b, letter: getSubjectGoalLetter(b.id), plan: computeSubjectGoalPlan(b, getSubjectGoalLetter(b.id)) }));
  const targetAvg = (plans.reduce((s, p) => s + p.plan.goalObj.min, 0) / plans.length).toFixed(1);
  const reachableCount = plans.filter((p) => p.plan.reachable).length;
  const totalNeeded = plans.reduce((s, p) => s + p.plan.needed, 0);
  const totalOpen = plans.reduce((s, p) => s + p.plan.totalOpen, 0);
  const overallReqPct = totalOpen > 0 ? Math.round((totalNeeded / totalOpen) * 100) : 0;
  const avgSuccessRate = Math.round(plans.reduce((s, p) => s + p.plan.successRate, 0) / plans.length);
  const jointSuccessRate = Math.round(plans.reduce((prod, p) => prod * (p.plan.successRate / 100), 1) * 100);
  const overallSuccessColor = avgSuccessRate >= 75 ? 'var(--green)' : avgSuccessRate >= 50 ? 'var(--primary)' : avgSuccessRate >= 25 ? 'var(--amber)' : 'var(--red)';

  summaryEl.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('targetAvgLabel'))}</div>
      <div class="kpi-value" style="color:var(--purple);">${targetAvg}+</div>
      <div class="kpi-sub">${escapeHtml(t('kpiAcrossSubjects', { n: books.length }))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('achievableCountLabel'))}</div>
      <div class="kpi-value" style="color:var(--green);">${reachableCount} / ${books.length}</div>
      <div class="kpi-sub">${escapeHtml(t('kpiAllOnTrack'))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('goalSuccessRateLabel'))}</div>
      <div class="kpi-value" style="color:${overallSuccessColor};">${avgSuccessRate}%</div>
      <div class="kpi-sub">${escapeHtml(t('goalJointChance', { n: books.length, pct: jointSuccessRate }))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(t('goalLabel'))}</div>
      <div class="kpi-value">${overallReqPct}%</div>
      <div class="kpi-sub">+${totalNeeded} / ${totalOpen} pts</div>
    </div>
  `;

  grid.innerHTML = plans.map(({ book, letter, plan }) => {
    const pillsHtml = GOAL_GRADES.map((g) => `
      <button class="goal-grade-btn ${letter === g.letter ? 'active' : ''}" data-goal-book="${book.id}" data-goal-letter="${g.letter}">
        ${g.letter} (${g.min}+)
      </button>
    `).join('');

    let statusBadge;
    let barColor = '';
    if (plan.needed === 0) {
      statusBadge = `<span class="badge badge-green">${escapeHtml(t('goalReached'))}</span>`;
      barColor = 'green';
    } else if (!plan.reachable) {
      statusBadge = `<span class="badge badge-red">${escapeHtml(t('goalStatusBlocked'))}</span>`;
      barColor = 'red';
    } else if (plan.reqPct <= 70) {
      statusBadge = `<span class="badge badge-green">${escapeHtml(t('goalStatusEasy'))} (${plan.reqPct}%)</span>`;
      barColor = 'green';
    } else if (plan.reqPct <= 88) {
      statusBadge = `<span class="badge badge-blue">${escapeHtml(t('goalStatusMedium'))} (${plan.reqPct}%)</span>`;
    } else {
      statusBadge = `<span class="badge badge-amber">${escapeHtml(t('goalStatusHard'))} (${plan.reqPct}%)</span>`;
      barColor = 'amber';
    }

    const progressPct = Math.min(100, Math.round((plan.currentScore / plan.goalObj.min) * 100));
    const sr = plan.successRate;
    const srBadgeClass = sr >= 75 ? 'badge-green' : sr >= 50 ? 'badge-blue' : sr >= 25 ? 'badge-amber' : 'badge-red';

    let preFinalMsg = '';
    if (plan.maxPreFinal < 31) {
      preFinalMsg = `<div style="color:#fca5a5;">⚠ ${escapeHtml(t('goalPreFinalRisk', { max: plan.maxPreFinal }))}</div>`;
    } else if (plan.needForPreFinal === 0) {
      preFinalMsg = `<div style="color:#6ee7b7;">✓ ${escapeHtml(t('goalPreFinalMet'))}</div>`;
    } else {
      preFinalMsg = `<div class="muted">${escapeHtml(t('goalPreFinalSafe', { n: plan.needForPreFinal, open: plan.openPreFinal }))}</div>`;
    }

    return `
      <div class="goal-card">
        <div class="subject-top">
          <div>
            <div class="row-title">${escapeHtml(book.name)}</div>
            <div class="row-sub">${plan.currentScore} / 100 • ${escapeHtml(t('goalMaxPossible', { max: plan.maxPossible }))}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <span class="badge ${srBadgeClass}">${escapeHtml(t('goalSuccessChance', { pct: sr }))}</span>
            ${statusBadge}
          </div>
        </div>

        <div class="goal-pill-group">${pillsHtml}</div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span>${plan.needed === 0 ? escapeHtml(t('goalReached')) : escapeHtml(t('goalNeedPts', { n: plan.needed, rem: plan.totalOpen, pct: plan.reqPct }))}</span>
            <strong>${plan.currentScore} / ${plan.goalObj.min}</strong>
          </div>
          <div class="muted" style="font-size:11px;margin-top:2px;">${escapeHtml(t('goalPaceSummary', { pace: plan.pacePct, req: plan.reqPct }))}</div>
          <div class="progress-track">
            <div class="progress-fill ${barColor}" style="width:${progressPct}%"></div>
          </div>
        </div>

        <div class="goal-plan-box">
          ${!plan.reachable
            ? `<div style="color:#fca5a5;">${escapeHtml(t('goalImpossible', { max: plan.maxPossible, best: plan.bestReachable }))}</div>`
            : plan.needed > 0
              ? `
                <div class="row-title" style="font-size:12px;">${escapeHtml(t('goalPlanTitle', { grade: letter, min: plan.goalObj.min }))}</div>
                <div class="goal-split-pills">
                  ${plan.openRating > 0 ? `<span class="badge badge-blue">${escapeHtml(t('goalPlanRating', { need: plan.planRating, avail: plan.openRating }))}</span>` : ''}
                  ${plan.openMidterm > 0 ? `<span class="badge badge-amber">${escapeHtml(t('goalPlanMidterm', { need: plan.planMidterm, avail: plan.openMidterm }))}</span>` : ''}
                  ${plan.openFinal > 0 ? `<span class="badge badge-purple">${escapeHtml(t('goalPlanFinal', { need: plan.planFinal, avail: plan.openFinal }))}</span>` : ''}
                </div>
              `
              : `<div style="color:#6ee7b7;">${escapeHtml(t('goalReached'))}</div>`
          }
          ${preFinalMsg}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-goal-book]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setSubjectGoal(btn.dataset.goalBook, btn.dataset.goalLetter);
      markTabsDirty(['goals', 'overview']);
      renderActiveTab();
    });
  });
}

// ============================================================================
// TAB 7: EDUCATIONAL PROGRAM (8 Semesters & Syllabuses)
// ============================================================================
function renderProgram() {
  const prog = state.data?.program;
  const contentEl = document.getElementById('program-content');
  const pillsEl = document.getElementById('program-sem-pills');

  if (!prog || !Array.isArray(prog.modules)) {
    document.getElementById('program-header-title').textContent = t('programTitle');
    document.getElementById('program-header-sub').textContent = '';
    contentEl.innerHTML = `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
    return;
  }

  const maxSem = prog?.special?.maxSemester || 8;
  const myBooksByCatalogId = new Map();
  const myBooksByName = new Map();
  for (const b of state.data?.card?.books || []) {
    if (b.catalogBookId) myBooksByCatalogId.set(Number(b.catalogBookId), b);
    if (b.name) myBooksByName.set(b.name.trim().toLowerCase(), b);
  }

  const bySemester = new Map();
  for (let s = 1; s <= maxSem; s++) bySemester.set(String(s), []);
  const seenPerSem = new Set();
  let totalUniqueBooks = 0;
  const seenGlobal = new Set();

  for (const mod of prog.modules) {
    const modName = state.lang === 'en' ? (mod.nameEng || mod.name) : (mod.name || mod.nameEng);
    for (const grp of mod.groups || []) {
      for (const pb of grp.books || []) {
        const bInfo = pb.book || {};
        const bookId = pb.bookId || bInfo.id;
        if (!seenGlobal.has(bookId)) {
          seenGlobal.add(bookId);
          totalUniqueBooks++;
        }
        const sems = Array.isArray(pb.semesters) && pb.semesters.length ? pb.semesters : ['?'];
        for (const sem of sems) {
          const semKey = String(sem);
          const dedupKey = `${semKey}:${bookId}`;
          if (seenPerSem.has(dedupKey)) continue;
          seenPerSem.add(dedupKey);
          if (!bySemester.has(semKey)) bySemester.set(semKey, []);
          bySemester.get(semKey).push({
            bookId,
            name: bInfo.name || bInfo.altName || 'Subject',
            credit: bInfo.credit || 0,
            syllabuses: bInfo.syllabuses || 0,
            moduleName: modName,
            conditions: prog.conditionsData?.[String(bookId)] || [],
            myRecord: myBooksByCatalogId.get(Number(bookId)) || myBooksByName.get((bInfo.name || '').trim().toLowerCase()) || null,
          });
        }
      }
    }
  }

  const progTitle = prog?.program?.name || t('programTitle');
  document.getElementById('program-header-title').textContent = `${progTitle} — ${t('programTitle')}`;
  document.getElementById('program-header-sub').textContent = t('programTotalBooks', { n: totalUniqueBooks, s: maxSem });

  const semKeys = Array.from(bySemester.keys()).sort((a, b) => Number(a) - Number(b));
  pillsEl.innerHTML = [
    `<button class="sem-pill ${state.programSemester === 'ALL' ? 'active' : ''}" data-prog-sem="ALL">${escapeHtml(t('allSemestersFilter'))}</button>`,
    ...semKeys.map((s) => {
      const isCurr = String(state.data?.latestSemester) === String(s);
      return `<button class="sem-pill ${state.programSemester === s ? 'active' : ''}" data-prog-sem="${escapeHtml(s)}">${escapeHtml(t('semesterPrefix'))} ${escapeHtml(s)}${isCurr ? ' ★' : ''}</button>`;
    }),
  ].join('');

  pillsEl.querySelectorAll('[data-prog-sem]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.programSemester = btn.dataset.progSem;
      renderProgram();
    });
  });

  const query = state.programSearch.trim().toLowerCase();
  const semsToShow = state.programSemester === 'ALL' ? semKeys : [state.programSemester];

  const sectionsHtml = semsToShow.map((sem) => {
    const items = (bySemester.get(sem) || []).filter((it) => {
      if (!query) return true;
      return (it.name || '').toLowerCase().includes(query) || (it.moduleName || '').toLowerCase().includes(query);
    });
    if (items.length === 0) return '';

    const isCurr = String(state.data?.latestSemester) === String(sem);
    const totalCredits = items.reduce((sum, it) => sum + Number(it.credit || 0), 0);

    const cardsHtml = items.map((it) => {
      const condText = it.conditions.length
        ? it.conditions.map((c) => `${c.type}: ${c.name}`).join(' • ')
        : '';

      const myBadge = it.myRecord
        ? `<span class="badge ${getGradeBadgeClass(it.myRecord.result)}">${it.myRecord.score} (${escapeHtml(it.myRecord.result)})</span>`
        : '';

      const hasSyl = it.syllabuses > 0;

      return `
        <div class="program-book-card">
          <div>
            <div class="subject-top">
              <div class="row-title">${escapeHtml(it.name)}</div>
              <div style="display:flex;gap:6px;align-items:center;">
                ${myBadge}
                <span class="badge badge-blue">${it.credit} ${escapeHtml(t('ects'))}</span>
              </div>
            </div>
            <div class="row-sub" style="margin-top:6px;">${escapeHtml(it.moduleName)}</div>
            ${condText ? `<div class="row-sub" style="margin-top:4px;color:#fcd34d;">${escapeHtml(condText)}</div>` : ''}
          </div>
          <div class="program-book-actions">
            ${hasSyl ? `
              <button class="btn-primary btn-sm" data-open-syl="${it.bookId}" data-syl-title="${escapeHtml(it.name)}">${escapeHtml(t('viewSyllabus'))}</button>
              <button class="btn-ghost btn-sm" data-dl-syl="${it.bookId}" data-syl-title="${escapeHtml(it.name)}">${escapeHtml(t('downloadSyllabus'))}</button>
              <button class="btn-ghost btn-sm" data-pdf-syl="${it.bookId}">${escapeHtml(t('openPdfExternal'))}</button>
            ` : `<span class="badge badge-muted">${escapeHtml(t('noSyllabus'))}</span>`}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="semester-section">
        <div class="semester-section-title">
          <span>${escapeHtml(t('semesterPrefix'))} ${escapeHtml(sem)}</span>
          ${isCurr ? `<span class="badge badge-green">${escapeHtml(t('currentBadge'))}</span>` : ''}
          <span class="muted small">(${items.length} / ${totalCredits} ${escapeHtml(t('ects'))})</span>
        </div>
        <div class="program-grid">${cardsHtml}</div>
      </div>
    `;
  }).filter(Boolean).join('');

  contentEl.innerHTML = sectionsHtml || `<div class="muted">${escapeHtml(t('noSubjectsInSem'))}</div>`;
  bindSyllabusActionButtons(contentEl);
}

// ============================================================================
// TAB 8: EXAMS
// ============================================================================
function renderExams() {
  const exams = state.data?.exams || { selectionOpen: false, subjects: [], slotsByListId: {} };
  const banner = document.getElementById('exams-banner');
  const listEl = document.getElementById('exams-list');

  banner.textContent = exams.selectionOpen ? t('examsOpen') : t('examsClosed');

  if (!exams.subjects.length) {
    listEl.innerHTML = `<div class="muted">${escapeHtml(t('noExams'))}</div>`;
    return;
  }

  listEl.innerHTML = exams.subjects.map((subj) => {
    const slots = exams.slotsByListId?.[subj.listId] || [];
    const pickText = subj.pick ? `${t('selectedSlot')}: ${JSON.stringify(subj.pick)}` : t('noSlotSelected');
    const slotsText = slots.length > 0 ? t('openSlotsAvailable', { n: slots.length }) : t('noOpenSlots');

    return `
      <div class="card">
        <div class="subject-top">
          <div class="row-title">${escapeHtml(subj.name)}</div>
          <span class="badge ${subj.admitted ? 'badge-green' : 'badge-red'}">
            ${escapeHtml(subj.admitted ? t('admitted') : t('notAdmitted'))}
          </span>
        </div>
        <div class="row-sub" style="margin-top:10px;">${escapeHtml(pickText)}</div>
        <div class="row-sub" style="margin-top:4px;">${escapeHtml(slotsText)}</div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// TAB 9: CUSTOMIZE & THEME STUDIO
// ============================================================================
function renderCustomize() {
  const studio = document.getElementById('customize-studio');
  const th = state.theme;

  const presetsHtml = THEME_PRESETS.map((p) => {
    const label = state.lang === 'ka' ? p.nameKa : p.nameEn;
    const isAct = th.presetId === p.id;
    return `
      <button class="preset-btn ${isAct ? 'active' : ''}" data-preset-id="${p.id}" style="background:linear-gradient(135deg, ${p.bg} 30%, ${p.aura1} 100%);">
        <span>${escapeHtml(label)}</span>
        <span style="width:14px;height:14px;border-radius:50%;background:${p.primary};display:inline-block;"></span>
      </button>
    `;
  }).join('');

  const swatchesHtml = ACCENT_SWATCHES.map((col) => `
    <button class="color-swatch ${th.primary === col ? 'active' : ''}" data-accent-col="${col}" style="background:${col};"></button>
  `).join('');

  studio.innerHTML = `
    <div class="card">
      <h3>${escapeHtml(t('presetThemesTitle'))}</h3>
      <div class="preset-grid">${presetsHtml}</div>

      <h3 style="margin-top:20px;">${escapeHtml(t('accentColorTitle'))}</h3>
      <div class="swatch-row">${swatchesHtml}</div>

      <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
        <label class="checkbox-row" style="margin-bottom:0;">
          <input id="toggle-anim" type="checkbox" ${th.animations ? 'checked' : ''} />
          <span>${escapeHtml(t('animationsToggle'))}</span>
        </label>
        <label class="checkbox-row" style="margin-bottom:0;">
          <input id="toggle-aura" type="checkbox" ${th.auraEnabled ? 'checked' : ''} />
          <span>${escapeHtml(t('bgMeshToggle'))}</span>
        </label>
        <label class="checkbox-row" style="margin-bottom:0;">
          <input id="toggle-particles" type="checkbox" ${th.particlesEnabled ? 'checked' : ''} />
          <span>${escapeHtml(t('bgParticlesToggle'))}</span>
        </label>
      </div>
    </div>

    <div class="card">
      <h3>${escapeHtml(t('customBgTitle'))}</h3>
      <div class="muted small">${escapeHtml(t('customBgSub'))}</div>

      <div class="program-book-actions" style="margin-top:12px;">
        <button id="pick-bg-btn" class="btn-primary btn-sm">${escapeHtml(t('chooseImageBtn'))}</button>
        <button id="clear-bg-btn" class="btn-ghost btn-sm">${escapeHtml(t('clearImageBtn'))}</button>
      </div>

      <div style="display:flex;gap:8px;margin-top:10px;">
        <input id="bg-url-input" type="url" class="search-input" style="flex:1;min-width:0;" placeholder="${escapeHtml(t('bgUrlPlaceholder'))}" value="${th.wallpaper.startsWith('http') ? escapeHtml(th.wallpaper) : ''}" />
        <button id="apply-bg-url-btn" class="btn-ghost btn-sm">${escapeHtml(t('applyUrlBtn'))}</button>
      </div>

      <div class="slider-row">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
          <span>${escapeHtml(t('blurLabel'))}</span>
          <strong id="blur-val">${th.blur}px</strong>
        </div>
        <input id="blur-slider" type="range" min="0" max="32" value="${th.blur}" />
      </div>

      <div class="slider-row">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
          <span>${escapeHtml(t('dimLabel'))}</span>
          <strong id="dim-val">${th.dim}%</strong>
        </div>
        <input id="dim-slider" type="range" min="10" max="90" value="${th.dim}" />
      </div>

      <div class="slider-row">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;">
          <span>${escapeHtml(t('cardOpacityLabel'))}</span>
          <strong id="opacity-val">${th.cardOpacity}%</strong>
        </div>
        <input id="opacity-slider" type="range" min="40" max="98" value="${th.cardOpacity}" />
      </div>

      <div style="margin-top:18px;">
        <button id="reset-theme-btn" class="btn-ghost full-width">${escapeHtml(t('resetThemeBtn'))}</button>
      </div>
    </div>
  `;

  studio.querySelectorAll('[data-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = THEME_PRESETS.find((x) => x.id === btn.dataset.presetId);
      if (p) {
        state.theme.presetId = p.id;
        state.theme.primary = p.primary;
        applyTheme();
        renderCustomize();
      }
    });
  });

  studio.querySelectorAll('[data-accent-col]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.theme.primary = btn.dataset.accentCol;
      applyTheme();
      renderCustomize();
    });
  });

  document.getElementById('toggle-anim').addEventListener('change', (e) => {
    state.theme.animations = e.target.checked;
    applyTheme();
  });

  document.getElementById('toggle-aura').addEventListener('change', (e) => {
    state.theme.auraEnabled = e.target.checked;
    applyTheme();
  });

  document.getElementById('toggle-particles').addEventListener('change', (e) => {
    state.theme.particlesEnabled = e.target.checked;
    applyTheme();
  });

  document.getElementById('pick-bg-btn').addEventListener('click', async () => {
    const res = await window.bsma.pickBackgroundImage();
    if (res?.selected && res.dataUrl) {
      state.theme.wallpaper = res.dataUrl;
      applyTheme();
      renderCustomize();
    }
  });

  document.getElementById('clear-bg-btn').addEventListener('click', () => {
    state.theme.wallpaper = '';
    applyTheme();
    renderCustomize();
  });

  document.getElementById('apply-bg-url-btn').addEventListener('click', () => {
    const url = document.getElementById('bg-url-input').value.trim();
    state.theme.wallpaper = url;
    applyTheme();
  });

  document.getElementById('blur-slider').addEventListener('input', (e) => {
    state.theme.blur = Number(e.target.value);
    document.getElementById('blur-val').textContent = `${state.theme.blur}px`;
    applyTheme();
  });

  document.getElementById('dim-slider').addEventListener('input', (e) => {
    state.theme.dim = Number(e.target.value);
    document.getElementById('dim-val').textContent = `${state.theme.dim}%`;
    applyTheme();
  });

  document.getElementById('opacity-slider').addEventListener('input', (e) => {
    state.theme.cardOpacity = Number(e.target.value);
    document.getElementById('opacity-val').textContent = `${state.theme.cardOpacity}%`;
    applyTheme();
  });

  document.getElementById('reset-theme-btn').addEventListener('click', () => {
    state.theme = { ...defaultTheme };
    applyTheme();
    renderCustomize();
  });
}

// ============================================================================
// MODALS & SYLLABUS ACTIONS
// ============================================================================
function bindSyllabusActionButtons(rootEl) {
  rootEl.querySelectorAll('[data-open-syl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openSyllabusModal(Number(btn.dataset.openSyl), btn.dataset.sylTitle);
    });
  });
  rootEl.querySelectorAll('[data-dl-syl]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('downloading');
      try {
        const res = await window.bsma.downloadSyllabus(Number(btn.dataset.dlSyl), btn.dataset.sylTitle);
        if (res?.saved) showToast(t('downloadedTo', { path: res.filePath }));
      } catch (err) {
        syncError.textContent = err.message;
        syncError.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  });
  rootEl.querySelectorAll('[data-pdf-syl]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await window.bsma.openSyllabusPdf(Number(btn.dataset.pdfSyl));
      } catch (err) {
        syncError.textContent = err.message;
        syncError.classList.remove('hidden');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function openSyllabusModal(bookId, subjectTitle) {
  state.activeSyllabusBook = { bookId, title: subjectTitle };
  document.getElementById('syl-modal-title').textContent = subjectTitle || 'Syllabus';
  document.getElementById('syl-modal-meta').textContent = t('weekPlanTitle');
  const bodyEl = document.getElementById('syl-modal-body');
  bodyEl.innerHTML = `<div class="muted">${escapeHtml(t('loadingDetails'))}</div>`;
  syllabusModal.classList.remove('hidden');

  try {
    let syl = state.syllabusesByBookId[bookId];
    if (!syl) {
      syl = await window.bsma.getSyllabus(bookId, false);
      state.syllabusesByBookId[bookId] = syl;
    }

    const activeWeek = getActiveCheckWeek();
    const nextWeek = Math.min(15, activeWeek + 1);

    const litHtml = (syl.mainLiterature?.length || syl.extraLiterature?.length) ? `
      <div class="lit-box">
        <div class="row-title">${escapeHtml(t('literatureLabel'))}</div>
        <ul>
          ${(syl.mainLiterature || []).map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
        </ul>
        ${syl.extraLiterature?.length ? `
          <div class="row-sub" style="margin-top:10px;font-weight:600;">${escapeHtml(t('extraLitCount', { n: syl.extraLiterature.length }))}</div>
        ` : ''}
      </div>
    ` : '';

    const weeksHtml = (syl.weeks && syl.weeks.length > 0)
      ? syl.weeks.map((w) => {
          const isCurr = w.week === activeWeek;
          const isNext = w.week === nextWeek && nextWeek !== activeWeek;
          return `
            <div class="syl-week-row ${isCurr ? 'is-current' : isNext ? 'is-next' : ''}">
              <div class="syl-week-head">
                <div style="display:flex;align-items:center;gap:8px;">
                  <strong>${escapeHtml(t('weekLabel', { w: w.week }))} (${escapeHtml(w.roman)})</strong>
                  ${isCurr ? `<span class="badge badge-blue">${escapeHtml(t('currentBadge'))}</span>` : ''}
                  ${isNext ? `<span class="badge badge-muted">${escapeHtml(t('nextBadge'))}</span>` : ''}
                </div>
                ${w.hasTest ? `<span class="badge badge-amber">${escapeHtml(t('incomingTestBadge'))}: ${escapeHtml(w.assessmentHits.join(', '))}</span>` : ''}
              </div>
              <div class="row-sub" style="color:var(--text);">${escapeHtml(w.content)}</div>
            </div>
          `;
        }).join('')
      : `<div class="info-banner">${escapeHtml(t('noSyllabusText'))}</div>`;

    bodyEl.innerHTML = `${litHtml}<div class="list-stack">${weeksHtml}</div>`;
  } catch (err) {
    bodyEl.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
  }
}

async function openSubjectModal(bookId) {
  const epoch = state.sessionEpoch;
  const books = state.data?.card?.books || [];
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  document.getElementById('modal-subject-title').textContent = book.name;
  document.getElementById('modal-subject-meta').textContent =
    `${book.altProf || book.prof || t('lecturerTba')} ${book.profMail ? `(${book.profMail})` : ''} • ${book.credit} ${t('credits')}`;

  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `<div class="muted">${escapeHtml(t('loadingDetails'))}</div>`;
  subjectModal.classList.remove('hidden');

  if (!state.data?.detailsByBookId?.[bookId]) {
    try {
      const comps = await window.bsma.fetchSubjectDetails(bookId);
      if (epoch !== state.sessionEpoch || !state.data) return;
      state.data.detailsByBookId[bookId] = comps;
      state.analyzedCache.delete(`${bookId}:${state.lang}`);
      markTabsDirty();
    } catch (err) {
      if (epoch !== state.sessionEpoch) return;
      modalBody.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
      return;
    }
  }

  const an = analyzeSubjectMarks(book);
  const currentScore = Number(book.score || 0);
  const targets = [
    { grade: t('gradeE'), min: 51 },
    { grade: t('gradeC'), min: 71 },
    { grade: t('gradeB'), min: 81 },
    { grade: t('gradeA'), min: 91 },
  ];

  const targetsHtml = `
    <div>
      <div class="row-title" style="margin-bottom:8px;">${escapeHtml(t('pointsNeededTitle'))}</div>
      <div class="targets-box">
        ${targets.map((tg) => {
          const need = Math.max(0, tg.min - currentScore);
          return `
            <div class="target-pill">
              <div class="grade">${escapeHtml(tg.grade)}</div>
              <div class="pts">${escapeHtml(need === 0 ? t('reached') : `+${need}`)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const allSplits = [
    ...an.ratingComps,
    ...(an.midtermComp ? [an.midtermComp] : []),
    ...(an.finalComp ? [an.finalComp] : []),
  ];

  modalBody.innerHTML = `
    ${targetsHtml}
    <div class="syllabus-components-grid">
      ${allSplits.map(renderComponentBoxHtml).join('')}
    </div>
  `;
}

async function scanCurrentSemesterSyllabuses() {
  if (state.scanningSyllabuses || !state.data) return;
  const bookIds = getCurrentSemesterBooks().map((b) => b.catalogBookId).filter(Boolean);
  if (bookIds.length === 0) return;

  const epoch = state.sessionEpoch;
  state.scanningSyllabuses = true;
  scanBtn.disabled = true;
  scanBtn.textContent = t('scanningSyllabuses');

  try {
    const map = await window.bsma.scanSyllabuses(bookIds);
    if (epoch !== state.sessionEpoch) return;
    Object.assign(state.syllabusesByBookId, map);
    markTabsDirty(['study', 'tests']);
    renderActiveTab();
  } catch (err) {
    if (epoch !== state.sessionEpoch) return;
    if (err.message.includes('Session expired') || err.message.includes('Not authenticated')) {
      resetSessionUiState();
      showLogin({ errorMessage: t('sessionExpiredMsg') });
      return;
    }
    syncError.textContent = err.message;
    syncError.classList.remove('hidden');
  } finally {
    if (epoch === state.sessionEpoch) {
      state.scanningSyllabuses = false;
    }
    scanBtn.disabled = false;
    scanBtn.textContent = t('scanAllSyllabuses');
  }
}

const TAB_RENDERERS = {
  overview: renderOverview,
  marks: renderMarksBySyllabus,
  analytics: renderAnalytics,
  study: renderStudyMaterial,
  tests: renderIncomingTests,
  attendance: renderAttendance,
  goals: renderGoals,
  program: renderProgram,
  exams: renderExams,
  customize: renderCustomize,
};

function markTabsDirty(tabs) {
  const list = tabs || Object.keys(TAB_RENDERERS);
  for (const name of list) {
    state.dirtyTabs.add(name);
  }
}

function renderActiveTab() {
  const tab = state.activeTab || 'overview';
  if (!state.data && tab !== 'customize') return;
  if (state.dirtyTabs.has(tab)) {
    state.dirtyTabs.delete(tab);
    const fn = TAB_RENDERERS[tab];
    if (fn) fn();
  }
}

function renderAll() {
  if (!state.data) return;
  const { week } = computeDetectedWeek(getCurrentSemesterBooks());
  state.detectedWeek = week;

  populateSemesters();
  populateWeekSelectors();
  renderSidebarStudent();
  markTabsDirty();
  renderActiveTab();

  const syncedDate = new Date(state.data.fetchedAt);
  document.getElementById('last-synced').textContent = `${t('lastSynced')}: ${syncedDate.toLocaleTimeString()}`;
}

function checkForScoreChanges(newData) {
  const books = newData?.card?.books || [];
  const changes = [];
  for (const b of books) {
    const prev = state.previousScores[b.id];
    if (prev !== undefined && Number(prev) !== Number(b.score)) {
      changes.push(`${b.name}: ${prev} → ${b.score}`);
    }
    state.previousScores[b.id] = b.score;
  }
  if (changes.length > 0) {
    window.bsma.notify('BSMA New Marks Posted', changes.join('\n'));
  }
}

async function syncPortal() {
  const epoch = state.sessionEpoch;
  syncBtn.disabled = true;
  syncBtn.textContent = t('syncing');
  syncError.classList.add('hidden');

  try {
    const data = await window.bsma.fetchAll();
    if (epoch !== state.sessionEpoch) return;

    state.data = data;
    if (data.authUsername && data.authUsername !== state.username) {
      state.username = data.authUsername;
      state.goals = loadSavedGoals(state.username);
    }
    if (Array.isArray(data.savedAccounts)) {
      state.savedAccounts = data.savedAccounts;
      renderSavedAccounts();
    }
    state.analyzedCache.clear();
    checkForScoreChanges(data);
    renderAll();

    const currentIds = getCurrentSemesterBooks().map((b) => b.catalogBookId).filter(Boolean);
    const missingAny = currentIds.some((id) => !state.syllabusesByBookId[id]);
    if (missingAny) {
      scanCurrentSemesterSyllabuses();
    }
  } catch (err) {
    if (epoch !== state.sessionEpoch) return;
    if (err.message.includes('Session expired') || err.message.includes('Not authenticated')) {
      resetSessionUiState();
      showLogin({ errorMessage: t('sessionExpiredMsg') });
      return;
    }
    syncError.textContent = err.message;
    syncError.classList.remove('hidden');
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = t('syncNow');
  }
}

function setupAutoSync() {
  if (state.syncTimer) {
    clearInterval(state.syncTimer);
    state.syncTimer = null;
  }
  if (autoSyncCheckbox.checked) {
    state.syncTimer = setInterval(syncPortal, 15 * 60 * 1000);
  }
}

function resetSessionUiState() {
  state.sessionEpoch += 1;
  if (state.syncTimer) {
    clearInterval(state.syncTimer);
    state.syncTimer = null;
  }

  subjectModal.classList.add('hidden');
  syllabusModal.classList.add('hidden');
  syncError.classList.add('hidden');
  toastBanner.classList.add('hidden');
  syncBtn.disabled = false;
  syncBtn.textContent = t('syncNow');
  scanBtn.disabled = false;
  scanBtn.textContent = t('scanAllSyllabuses');

  state.data = null;
  state.username = '';
  state.goals = {};
  state.analyzedCache.clear();
  state.previousScores = {};
  state.selectedSemester = null;
  state.programSemester = 'ALL';
  state.programSearch = '';
  state.testsFilter = 'UPCOMING';
  state.selectedWeek = 'AUTO';
  state.syllabusesByBookId = {};
  state.scanningSyllabuses = false;
  state.activeSyllabusBook = null;
  state.activeTab = 'overview';

  if (programSearchInput) programSearchInput.value = '';
  document.getElementById('last-synced').textContent = t('notSynced');
  document.getElementById('student-avatar').textContent = 'S';
  document.getElementById('student-name').textContent = 'Student';
  document.getElementById('student-id-label').textContent = 'ID: —';
  document.getElementById('student-program').textContent = 'BSMA';

  const clearIds = [
    'kpi-grid',
    'overview-subjects-grid',
    'marks-syllabus-container',
    'analytics-container',
    'study-materials-grid',
    'incoming-tests-container',
    'attendance-summary',
    'attendance-grid',
    'goals-summary',
    'goals-grid',
    'program-sem-pills',
    'program-content',
    'exams-banner',
    'exams-list',
    'semester-select',
  ];
  for (const id of clearIds) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  }

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === 'overview');
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('hidden', p.id !== 'tab-overview');
  });
  applyTranslations();
  markTabsDirty();
}

function renderSavedAccounts() {
  if (!savedAccountsSection || !savedAccountsList) return;
  const list = state.savedAccounts || [];
  if (list.length === 0) {
    savedAccountsSection.classList.add('hidden');
    savedAccountsList.innerHTML = '';
    return;
  }

  savedAccountsSection.classList.remove('hidden');
  savedAccountsList.innerHTML = list.map((acc) => {
    const title = acc.fullName || `ID: ${acc.studentId || acc.username}`;
    const subParts = [];
    if (acc.programName) subParts.push(acc.programName);
    subParts.push(`ID: ${acc.studentId || acc.username}`);
    const initials = getNameInitials(acc.fullName, acc.studentId || acc.username);
    return `
      <div class="saved-account-card">
        <button type="button" class="saved-account-main" data-switch-user="${escapeHtml(acc.username)}">
          <div class="saved-account-avatar">${escapeHtml(initials)}</div>
          <div class="saved-account-meta">
            <div class="saved-account-name">${escapeHtml(title)}</div>
            <div class="saved-account-sub">${escapeHtml(subParts.join(' • '))}</div>
          </div>
          <span class="saved-account-go">${escapeHtml(t('quickSignIn'))} →</span>
        </button>
        <button type="button" class="saved-account-remove" data-forget-user="${escapeHtml(acc.username)}" title="${escapeHtml(t('forgetAccountTitle'))}" aria-label="${escapeHtml(t('forgetAccountTitle'))}">&times;</button>
      </div>
    `;
  }).join('');

  savedAccountsList.querySelectorAll('[data-switch-user]').forEach((btn) => {
    btn.addEventListener('click', () => handleAccountSwitch(btn.dataset.switchUser));
  });

  savedAccountsList.querySelectorAll('[data-forget-user]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const uname = btn.dataset.forgetUser;
      const res = await window.bsma.forgetAccount(uname);
      state.savedAccounts = res?.accounts || [];
      renderSavedAccounts();
    });
  });
}

async function handleAccountSwitch(username) {
  loginError.classList.add('hidden');
  loginStatus.classList.add('hidden');

  const buttons = savedAccountsList.querySelectorAll('[data-switch-user]');
  buttons.forEach((b) => { b.disabled = true; });
  loginBtn.disabled = true;

  try {
    const res = await window.bsma.switchAccount(username);
    if (res.ok) {
      state.username = res.username || username;
      state.goals = loadSavedGoals(state.username);
      if (Array.isArray(res.accounts)) {
        state.savedAccounts = res.accounts;
      }
      passwordInput.value = '';
      passwordInput.type = 'password';
      document.getElementById('smsCode').value = '';
      smsField.classList.add('hidden');
      showApp();
      return;
    }

    document.getElementById('username').value = res.username || username;
    if (res.result === 'sms') {
      smsField.classList.remove('hidden');
      document.getElementById('smsCode').value = '';
      document.getElementById('smsCode').focus();
      loginError.textContent = t('smsPrompt');
      loginError.classList.remove('hidden');
    } else {
      passwordInput.value = '';
      passwordInput.focus();
      loginError.textContent = res.message || t('reauthPasswordMsg', { user: username });
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
    loginBtn.disabled = false;
  }
}

async function handleLogout(mode = 'signout') {
  if (switchAccountBtn) switchAccountBtn.disabled = true;
  logoutBtn.disabled = true;
  try {
    const res = await window.bsma.logout(mode);
    resetSessionUiState();
    state.savedAccounts = res?.accounts || [];
    document.getElementById('username').value = '';
    passwordInput.value = '';
    passwordInput.type = 'password';
    if (togglePasswordBtn) togglePasswordBtn.textContent = '👁';
    document.getElementById('smsCode').value = '';
    smsField.classList.add('hidden');
    showLogin({
      statusMessage: mode === 'switch' ? t('switchedAccountMsg') : t('signedOutMsg'),
    });
  } finally {
    if (switchAccountBtn) switchAccountBtn.disabled = false;
    logoutBtn.disabled = false;
  }
}

function showApp() {
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
  loginError.classList.add('hidden');
  loginStatus.classList.add('hidden');
  setupAutoSync();
  syncPortal();
}

function showLogin({ statusMessage = '', errorMessage = '' } = {}) {
  if (state.syncTimer) {
    clearInterval(state.syncTimer);
    state.syncTimer = null;
  }
  appView.classList.add('hidden');
  loginView.classList.remove('hidden');
  renderSavedAccounts();

  if (statusMessage) {
    loginStatus.textContent = statusMessage;
    loginStatus.classList.remove('hidden');
  } else {
    loginStatus.classList.add('hidden');
  }

  if (errorMessage) {
    loginError.textContent = errorMessage;
    loginError.classList.remove('hidden');
  } else {
    loginError.classList.add('hidden');
  }
}

// Event listeners
document.getElementById('login-lang-btn').addEventListener('click', toggleLanguage);
document.getElementById('app-lang-btn').addEventListener('click', toggleLanguage);

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    state.activeTab = tab;
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    const labelSpan = btn.querySelector('[data-i18n]');
    document.getElementById('page-title').textContent = labelSpan ? labelSpan.textContent.trim() : btn.textContent.trim();
    renderActiveTab();
  });
});

semesterSelect.addEventListener('change', () => {
  state.selectedSemester = semesterSelect.value;
  markTabsDirty(['overview', 'marks', 'attendance']);
  renderActiveTab();
});

weekSelectStudy.addEventListener('change', (e) => {
  state.selectedWeek = e.target.value;
  populateWeekSelectors();
  markTabsDirty(['study', 'tests', 'analytics']);
  renderActiveTab();
});

scanBtn.addEventListener('click', scanCurrentSemesterSyllabuses);

document.querySelectorAll('[data-set-all-goal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const letter = btn.dataset.setAllGoal;
    for (const b of getCurrentSemesterBooks()) {
      setSubjectGoal(b.id, letter);
    }
    markTabsDirty(['goals', 'overview']);
    renderActiveTab();
  });
});

programSearchInput.addEventListener('input', (e) => {
  state.programSearch = e.target.value;
  renderProgram();
});

autoSyncCheckbox.addEventListener('change', setupAutoSync);
syncBtn.addEventListener('click', syncPortal);

if (switchAccountBtn) {
  switchAccountBtn.addEventListener('click', () => handleLogout('switch'));
}

logoutBtn.addEventListener('click', () => handleLogout('signout'));

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePasswordBtn.textContent = isHidden ? '🙈' : '👁';
  });
}

if (cancelSmsBtn) {
  cancelSmsBtn.addEventListener('click', () => {
    smsField.classList.add('hidden');
    document.getElementById('smsCode').value = '';
    passwordInput.value = '';
    loginError.classList.add('hidden');
    loginStatus.classList.add('hidden');
    document.getElementById('username').focus();
  });
}

modalClose.addEventListener('click', () => subjectModal.classList.add('hidden'));
subjectModal.addEventListener('click', (e) => {
  if (e.target === subjectModal) subjectModal.classList.add('hidden');
});

sylModalClose.addEventListener('click', () => syllabusModal.classList.add('hidden'));
syllabusModal.addEventListener('click', (e) => {
  if (e.target === syllabusModal) syllabusModal.classList.add('hidden');
});

sylDownloadBtn.addEventListener('click', async () => {
  if (!state.activeSyllabusBook) return;
  sylDownloadBtn.disabled = true;
  sylDownloadBtn.textContent = t('downloading');
  try {
    const res = await window.bsma.downloadSyllabus(state.activeSyllabusBook.bookId, state.activeSyllabusBook.title);
    if (res?.saved) showToast(t('downloadedTo', { path: res.filePath }));
  } catch (err) {
    syncError.textContent = err.message;
    syncError.classList.remove('hidden');
  } finally {
    sylDownloadBtn.disabled = false;
    sylDownloadBtn.textContent = t('downloadSyllabus');
  }
});

sylOpenBtn.addEventListener('click', async () => {
  if (!state.activeSyllabusBook) return;
  sylOpenBtn.disabled = true;
  try {
    await window.bsma.openSyllabusPdf(state.activeSyllabusBook.bookId);
  } catch (err) {
    syncError.textContent = err.message;
    syncError.classList.remove('hidden');
  } finally {
    sylOpenBtn.disabled = false;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginStatus.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.textContent = t('signingIn');

  const rawUsername = document.getElementById('username').value.trim();

  try {
    const res = await window.bsma.login({
      username: rawUsername,
      password: passwordInput.value,
      smsCode: document.getElementById('smsCode').value || null,
      remember: document.getElementById('remember').checked,
    });

    if (res.ok) {
      state.username = res.username || rawUsername;
      state.goals = loadSavedGoals(state.username);
      if (Array.isArray(res.accounts)) {
        state.savedAccounts = res.accounts;
      }
      passwordInput.value = '';
      passwordInput.type = 'password';
      if (togglePasswordBtn) togglePasswordBtn.textContent = '👁';
      document.getElementById('smsCode').value = '';
      smsField.classList.add('hidden');
      showApp();
    } else if (res.result === 'sms') {
      smsField.classList.remove('hidden');
      document.getElementById('smsCode').focus();
      loginError.textContent = t('smsPrompt');
      loginError.classList.remove('hidden');
    } else {
      loginError.textContent = res.message || t('loginFailed');
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = t('signIn');
  }
});

function parseColorToRgb(colorStr) {
  if (!colorStr) return { r: 59, g: 130, b: 246 };
  const s = colorStr.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      if (!Number.isNaN(num)) {
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }
    }
  }
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }
  return { r: 59, g: 130, b: 246 };
}

function initBackgroundVfx() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const auraEl = document.getElementById('bg-aura');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let width = window.innerWidth || 1280;
  let height = window.innerHeight || 800;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let accentRgb = parseColorToRgb(state.theme.primary);
  let rafId = null;
  let lastTime = performance.now();

  let pointerActive = false;
  let pointerX = width * 0.5;
  let pointerY = height * 0.5;
  let parallaxX = 0;
  let parallaxY = 0;
  let resizeTimer = null;

  function createParticles() {
    const targetCount = Math.min(46, Math.max(22, Math.floor((width * height) / 36000)));
    const next = [];
    for (let i = 0; i < targetCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 9 + Math.random() * 15;
      next.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.1 + Math.random() * 1.8,
        baseAlpha: 0.22 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2,
        useAccent: i % 2 === 0,
      });
    }
    particles = next;
  }

  function resizeCanvas() {
    width = window.innerWidth || 1280;
    height = window.innerHeight || 800;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function shouldRun() {
    return (
      !document.hidden &&
      !reducedMotionQuery.matches &&
      Boolean(state.theme.animations) &&
      Boolean(state.theme.particlesEnabled)
    );
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (!(state.theme.animations && state.theme.particlesEnabled)) {
      ctx.clearRect(0, 0, width, height);
    }
    if (auraEl && (!state.theme.animations || !state.theme.auraEnabled)) {
      auraEl.style.transform = '';
    }
  }

  function drawFrame(now) {
    rafId = null;
    if (!shouldRun()) {
      stopLoop();
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    const { r, g, b } = accentRgb;
    const count = particles.length;
    const linkDist = 128;
    const linkDistSq = linkDist * linkDist;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += dt * 1.4;

      if (p.x < -16) p.x = width + 16;
      else if (p.x > width + 16) p.x = -16;
      if (p.y < -16) p.y = height + 16;
      else if (p.y > height + 16) p.y = -16;

      const twinkle = 0.72 + 0.28 * Math.sin(p.phase);
      const alpha = p.baseAlpha * twinkle;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.useAccent
        ? `rgba(${r}, ${g}, ${b}, ${(alpha * 1.05).toFixed(3)})`
        : `rgba(226, 232, 240, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    ctx.lineWidth = 0.85;
    for (let i = 0; i < count; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < count; j += 1) {
        const c = particles[j];
        const dx = a.x - c.x;
        const dy = a.y - c.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < linkDistSq) {
          const dist = Math.sqrt(dSq);
          const lineAlpha = (1 - dist / linkDist) * 0.14;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha.toFixed(3)})`;
          ctx.stroke();
        }
      }

      if (pointerActive) {
        const mdx = a.x - pointerX;
        const mdy = a.y - pointerY;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < 22500) {
          const mDist = Math.sqrt(mDistSq);
          const mAlpha = (1 - mDist / 150) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointerX, pointerY);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${mAlpha.toFixed(3)})`;
          ctx.stroke();
        }
      }
    }

    if (auraEl && state.theme.auraEnabled) {
      const targetPx = pointerActive ? ((pointerX / width) - 0.5) * -22 : 0;
      const targetPy = pointerActive ? ((pointerY / height) - 0.5) * -22 : 0;
      parallaxX += (targetPx - parallaxX) * 0.08;
      parallaxY += (targetPy - parallaxY) * 0.08;
      auraEl.style.transform = `translate3d(${parallaxX.toFixed(1)}px, ${parallaxY.toFixed(1)}px, 0)`;
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  function syncVfxState() {
    accentRgb = parseColorToRgb(state.theme.primary);
    if (shouldRun()) {
      if (rafId === null) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(drawFrame);
      }
    } else {
      stopLoop();
    }
  }

  window.addEventListener('pointermove', (e) => {
    pointerActive = true;
    pointerX = e.clientX;
    pointerY = e.clientY;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointerActive = false;
  });

  window.addEventListener('blur', () => {
    pointerActive = false;
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 120);
  });

  document.addEventListener('visibilitychange', syncVfxState);
  reducedMotionQuery.addEventListener('change', syncVfxState);
  window.__bsmaUpdateVfx = syncVfxState;

  resizeCanvas();
  syncVfxState();
}

function initCardSpotlight() {
  const main = document.querySelector('.main-content');
  if (!main) return;
  let pendingEvent = null;
  let rafScheduled = false;

  main.addEventListener('pointermove', (e) => {
    if (!state.theme.animations) return;
    pendingEvent = e;
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      const ev = pendingEvent;
      if (!ev) return;
      const card = ev.target && ev.target.closest
        ? ev.target.closest('.kpi-card, .subject-card, .goal-card, .chart-card')
        : null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${Math.round(ev.clientX - rect.left)}px`);
      card.style.setProperty('--my', `${Math.round(ev.clientY - rect.top)}px`);
    });
  }, { passive: true });
}

async function loadAppVersion() {
  try {
    const v = await window.bsma.getVersion();
    state.appVersion = v || '';
    renderVersionPills();
  } catch {
    // ignore
  }
}

function renderVersionPills() {
  const text = state.appVersion ? `${t('versionLabel')} v${state.appVersion}` : 'v—';
  if (loginVersionPill) loginVersionPill.textContent = text;
  if (appVersionLabel) appVersionLabel.textContent = text;
}

function renderUpdateUI() {
  renderVersionPills();
  const info = state.updateInfo;
  const hasUpdate = Boolean(info && info.status === 'available');

  if (loginUpdateSlot) {
    if (hasUpdate) {
      loginUpdateSlot.textContent = t('updateAvailableTitle', { latest: info.latestVersion });
      loginUpdateSlot.classList.remove('hidden');
    } else {
      loginUpdateSlot.classList.add('hidden');
    }
  }

  if (!updateBanner) return;
  if (!hasUpdate || state.updateDismissed) {
    updateBanner.classList.add('hidden');
    return;
  }

  updateBanner.classList.remove('hidden');
  if (updateBannerTitle) {
    updateBannerTitle.textContent = t('updateAvailableTitle', { latest: info.latestVersion });
  }
  if (updateBannerVersions) {
    updateBannerVersions.textContent = t('updateVersionSub', {
      current: info.currentVersion || state.appVersion,
      latest: info.latestVersion,
    });
  }
  if (updateBannerNotes) {
    const firstLine = String(info.notes || '').split(/\r?\n/).find((l) => l.trim()) || '';
    updateBannerNotes.textContent = firstLine;
    updateBannerNotes.classList.toggle('hidden', !firstLine);
  }
  if (updateProgressWrap) {
    updateProgressWrap.classList.toggle('hidden', !state.updateDownloading);
  }
  if (updateProgressFill) {
    updateProgressFill.style.width = `${state.updateProgressPct}%`;
  }
  if (updateProgressText) {
    updateProgressText.textContent = `${state.updateProgressPct}%`;
  }
  if (updateNowBtn) {
    updateNowBtn.disabled = state.updateDownloading;
    updateNowBtn.textContent = state.updateDownloading
      ? t('updateDownloading', { pct: state.updateProgressPct })
      : t('updateNowBtn');
  }
}

async function runUpdateCheck({ manual = false } = {}) {
  if (checkUpdateBtn) {
    checkUpdateBtn.disabled = true;
    checkUpdateBtn.textContent = t('checkingUpdates');
  }
  if (updateStatusMsg && manual) {
    updateStatusMsg.textContent = t('checkingUpdates');
    updateStatusMsg.classList.remove('hidden');
  }

  try {
    const res = await window.bsma.checkForUpdates();
    if (res && res.currentVersion) {
      state.appVersion = res.currentVersion;
    }
    if (res && res.status === 'available') {
      state.updateInfo = res;
      state.updateDismissed = false;
      if (updateStatusMsg) {
        updateStatusMsg.textContent = t('updateAvailableTitle', { latest: res.latestVersion });
        updateStatusMsg.classList.remove('hidden');
      }
    } else {
      state.updateInfo = res || null;
      if (updateStatusMsg && manual) {
        updateStatusMsg.textContent = t('upToDateMsg', { v: state.appVersion || '1.0.1' });
        updateStatusMsg.classList.remove('hidden');
      }
    }
    renderUpdateUI();
  } catch {
    if (updateStatusMsg && manual) {
      updateStatusMsg.textContent = t('updateFailed');
      updateStatusMsg.classList.remove('hidden');
    }
  } finally {
    if (checkUpdateBtn) {
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.textContent = t('checkUpdatesBtn');
    }
  }
}

async function startUpdateInstall() {
  const info = state.updateInfo;
  if (!info || state.updateDownloading) return;
  if (!info.downloadUrl) {
    showToast(t('noInstallerAsset'));
    if (info.releaseUrl) {
      await window.bsma.openReleasePage(info.releaseUrl);
    }
    return;
  }

  state.updateDownloading = true;
  state.updateProgressPct = 0;
  renderUpdateUI();

  try {
    const res = await window.bsma.installUpdate({
      downloadUrl: info.downloadUrl,
      assetName: info.assetName,
    });
    if (!res || !res.ok) {
      throw new Error(res?.error || 'Install failed');
    }
    if (updateNowBtn) updateNowBtn.textContent = t('updateLaunching');
  } catch (err) {
    state.updateDownloading = false;
    renderUpdateUI();
    showToast(`${t('updateInstallFailed')}: ${err?.message || ''}`.trim());
  }
}

// Boot
(async function init() {
  applyTheme();
  initBackgroundVfx();
  initCardSpotlight();
  applyTranslations();
  await loadAppVersion();

  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => runUpdateCheck({ manual: true }));
  }
  if (updateNowBtn) {
    updateNowBtn.addEventListener('click', startUpdateInstall);
  }
  if (updateNotesBtn) {
    updateNotesBtn.addEventListener('click', () => {
      if (state.updateInfo?.releaseUrl) {
        window.bsma.openReleasePage(state.updateInfo.releaseUrl);
      }
    });
  }
  if (updateLaterBtn) {
    updateLaterBtn.addEventListener('click', () => {
      state.updateDismissed = true;
      renderUpdateUI();
    });
  }
  if (loginUpdateSlot) {
    loginUpdateSlot.addEventListener('click', () => {
      if (state.updateInfo?.releaseUrl) {
        window.bsma.openReleasePage(state.updateInfo.releaseUrl);
      }
    });
  }
  if (typeof window.bsma.onUpdateProgress === 'function') {
    window.bsma.onUpdateProgress((payload) => {
      state.updateDownloading = true;
      state.updateProgressPct = Number(payload?.percent) || 0;
      renderUpdateUI();
    });
  }

  const session = await window.bsma.getSession();
  state.savedAccounts = session.accounts || [];

  if (session.authenticated) {
    state.username = session.username || '';
    state.goals = loadSavedGoals(state.username);
    showApp();
  } else {
    showLogin();
  }

  setTimeout(() => {
    runUpdateCheck({ manual: false });
  }, 2500);
})();
