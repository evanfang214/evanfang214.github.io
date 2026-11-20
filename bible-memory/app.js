/**
 * Selah — Random Bible Verse Memorization App
 * Default translation: ESV, with ESV & NIV support via Bolls Bible API (https://bolls.life/api/).
 * Strictly displays only genuine text for the selected translation.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    prefs: 'selah_prefs_v4',
    progress: 'selah_progress_v1',
    customVerses: 'selah_custom_verses_v2',
    verseCache: 'selah_bolls_cache_v1'
  };

  const TRANSLATION_NAMES = {
    ESV: 'English Standard Version (ESV)',
    NIV: 'New International Version (NIV)'
  };

  // Candidate translation slugs on bolls.life
  const BOLLS_SLUGS = {
    ESV: ['ESV'],
    NIV: ['NIV', 'NIV2011']
  };

  /* ------------------------------------------------------------------------
   * State
   * ---------------------------------------------------------------------- */
  const state = {
    translation: 'ESV',
    category: 'All',
    theme: 'light',
    showBlanks: true,
    autoConfirm: true,
    sessionCompleted: 0,

    verseCache: {}, // { [verseId]: { ESV?: Segment[], NIV?: Segment[] } }
    chapterCache: {}, // in-memory: { "ESV:19:23": Array<{ verse, text }> }
    customVerses: [],
    progress: {}, // { [verseId]: { bestAccuracy: number, completions: number } }

    shuffleBag: [],
    currentVerse: null,
    currentLoadId: 0,
    isLoading: false,
    isMissingTranslation: false,
    tokens: [],
    currentIndex: 0,
    hintsUsed: 0,
    recalledCount: 0,
    completed: false,
    lastConfirmTime: 0,
    lastConfirmedPunct: ''
  };

  /* ------------------------------------------------------------------------
   * DOM Elements
   * ---------------------------------------------------------------------- */
  const els = {
    segBtns: document.querySelectorAll('.seg-btn'),
    categoryPills: document.querySelectorAll('#category-pills .pill'),
    streakCount: document.getElementById('streak-count'),
    progressFill: document.getElementById('progress-fill'),
    verseReference: document.getElementById('verse-reference'),
    verseCategory: document.getElementById('verse-category'),
    verseTranslationLabel: document.getElementById('verse-translation-label'),
    wordCounter: document.getElementById('word-counter'),
    hintCounter: document.getElementById('hint-counter'),

    loadingPanel: document.getElementById('loading-panel'),
    loadingText: document.getElementById('loading-text'),

    missingTransPanel: document.getElementById('missing-trans-panel'),
    missingTransTitle: document.getElementById('missing-trans-title'),
    missingTransDesc: document.getElementById('missing-trans-desc'),
    missingRetryBtn: document.getElementById('missing-retry-btn'),
    missingBgLink: document.getElementById('missing-bg-link'),
    missingBgLinkLabel: document.getElementById('missing-bg-link-label'),
    missingSwitchEsvBtn: document.getElementById('missing-switch-esv-btn'),
    inlinePasteForm: document.getElementById('inline-paste-form'),
    inlinePasteInput: document.getElementById('inline-paste-input'),
    inlinePasteError: document.getElementById('inline-paste-error'),
    missingSkipBtn: document.getElementById('missing-skip-btn'),

    verseCanvas: document.getElementById('verse-canvas'),
    verseFlow: document.getElementById('verse-flow'),
    srStatus: document.getElementById('sr-status'),

    practiceControls: document.getElementById('practice-controls'),
    hintBtn: document.getElementById('hint-btn'),
    typingHint: document.getElementById('typing-hint'),
    blanksToggleBtn: document.getElementById('blanks-toggle-btn'),
    confirmModeBtn: document.getElementById('confirm-mode-btn'),
    restartBtn: document.getElementById('restart-btn'),
    nextRandomBtn: document.getElementById('next-random-btn'),

    completionPanel: document.getElementById('completion-panel'),
    completionHeading: document.getElementById('completion-heading'),
    completionSub: document.getElementById('completion-sub'),
    statRecalled: document.getElementById('stat-recalled'),
    statHints: document.getElementById('stat-hints'),
    statAccuracy: document.getElementById('stat-accuracy'),
    sourceRefText: document.getElementById('source-ref-text'),
    sourceVerseLink: document.getElementById('source-verse-link'),
    sourceVerseLinkLabel: document.getElementById('source-verse-link-label'),
    sourceChapterLink: document.getElementById('source-chapter-link'),
    sourceChapterLinkLabel: document.getElementById('source-chapter-link-label'),
    practiceAgainBtn: document.getElementById('practice-again-btn'),
    nextAfterCompleteBtn: document.getElementById('next-after-complete-btn'),

    themeToggleBtn: document.getElementById('theme-toggle-btn'),

    // Library drawer
    openLibraryBtn: document.getElementById('open-library-btn'),
    closeLibraryBtn: document.getElementById('close-library-btn'),
    libraryBackdrop: document.getElementById('library-backdrop'),
    libraryDrawer: document.getElementById('library-drawer'),
    librarySummary: document.getElementById('library-summary'),
    librarySearch: document.getElementById('library-search'),
    libraryList: document.getElementById('library-list'),

    // Look Up / Paste modal
    openCustomBtn: document.getElementById('open-custom-btn'),
    closeCustomBtn: document.getElementById('close-custom-btn'),
    customModalBackdrop: document.getElementById('custom-modal-backdrop'),
    modalTabs: document.querySelectorAll('.modal-tab'),
    lookupForm: document.getElementById('lookup-form'),
    lookupRefInput: document.getElementById('lookup-ref-input'),
    lookupTransHint: document.getElementById('lookup-trans-hint'),
    lookupError: document.getElementById('lookup-error'),
    lookupSubmitBtn: document.getElementById('lookup-submit-btn'),
    cancelLookupBtn: document.getElementById('cancel-lookup-btn'),

    pasteForm: document.getElementById('paste-form'),
    pasteRefInput: document.getElementById('paste-ref-input'),
    pasteTransSelect: document.getElementById('paste-trans-select'),
    pasteTextInput: document.getElementById('paste-text-input'),
    pasteBgHelper: document.getElementById('paste-bg-helper'),
    pasteError: document.getElementById('paste-error'),
    cancelPasteBtn: document.getElementById('cancel-paste-btn')
  };

  let activeInputWrap = null;
  let wordInput = null;
  const htmlDecoder = document.createElement('textarea');

  /* ------------------------------------------------------------------------
   * Utilities
   * ---------------------------------------------------------------------- */
  function normalizeWord(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]/g, '');
  }

  function extractTrailingPunct(display) {
    const match = display.match(/[^a-zA-Z0-9]+$/);
    return match ? match[0] : '';
  }

  function cleanBollsHtml(rawHtml) {
    if (!rawHtml) return '';
    const stripped = String(rawHtml)
      .replace(/<S>[\s\S]*?<\/S>/gi, '')
      .replace(/<sup>[\s\S]*?<\/sup>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '');

    htmlDecoder.innerHTML = stripped;
    return htmlDecoder.value
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isRestrictionNotice(text) {
    const lower = (text || '').toLowerCase();
    return (
      lower.includes('bolls.life') ||
      lower.includes('biblica') ||
      lower.includes('copyright restrictions') ||
      lower.includes('not available due to') ||
      lower.includes('publisher request')
    );
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function resolveBookId(bookName) {
    const clean = (bookName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (BOOK_ALIASES[clean]) return BOOK_ALIASES[clean];
    for (let i = 1; i < BIBLE_BOOKS.length; i++) {
      const candidate = BIBLE_BOOKS[i].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (candidate === clean || candidate.startsWith(clean)) {
        return i;
      }
    }
    return null;
  }

  function parseReference(reference) {
    // Matches "Psalm 23:4", "1 Cor 13:4-7", "Romans 8:28", "Psalm 23:1, 4"
    const m = reference.trim().match(/^(.+?)\s+(\d+):([\d\s,\-–]+)$/);
    if (!m) return null;

    const bookId = resolveBookId(m[1].trim());
    if (!bookId) return null;

    const chapter = parseInt(m[2], 10);
    const verseSpec = m[3].trim();
    const verseSet = new Set();

    verseSpec.split(',').forEach((part) => {
      const range = part.trim().split(/[-–]/);
      if (range.length === 1) {
        const n = parseInt(range[0], 10);
        if (!Number.isNaN(n) && n > 0) verseSet.add(n);
      } else if (range.length === 2) {
        const start = parseInt(range[0], 10);
        const end = parseInt(range[1], 10);
        if (!Number.isNaN(start) && !Number.isNaN(end) && start > 0 && end >= start) {
          const capEnd = Math.min(end, start + 19); // cap at 20 verses per passage
          for (let v = start; v <= capEnd; v++) verseSet.add(v);
        }
      }
    });

    const verses = Array.from(verseSet).sort((a, b) => a - b);
    if (verses.length === 0) return null;

    const book = BIBLE_BOOKS[bookId];
    const displayRange = verses.length === 1
      ? String(verses[0])
      : `${verses[0]}-${verses[verses.length - 1]}`;

    return {
      bookId,
      book,
      chapter,
      verses,
      reference: `${book} ${chapter}:${displayRange}`,
      isMultiVerse: verses.length > 1
    };
  }

  function parseBookAndChapter(reference) {
    const match = reference.trim().match(/^(.+?)\s+(\d+)(?::[\d\s,\-–]+)?$/);
    if (!match) {
      return { book: reference.trim(), chapter: null };
    }
    return { book: match[1].trim(), chapter: match[2] };
  }

  function buildSourceLinks(verse, translation) {
    const versionParam = `&version=${encodeURIComponent(translation)}`;
    const verseUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.reference)}${versionParam}`;

    let chapterRef = '';
    if (verse.book && verse.chapter) {
      chapterRef = `${verse.book} ${verse.chapter}`;
    } else {
      const parsed = parseBookAndChapter(verse.reference);
      chapterRef = parsed.chapter ? `${parsed.book} ${parsed.chapter}` : verse.reference;
    }

    const chapterUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(chapterRef)}${versionParam}`;
    return { verseUrl, chapterUrl, chapterRef };
  }

  function parsePastedPassage(rawText) {
    const cleaned = rawText
      .replace(/\[[a-zA-Z]\]/g, '')
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (/\[\d+\]/.test(cleaned)) {
      const parts = cleaned.split(/\[(\d+)\]\s*/);
      const segments = [];
      for (let i = 1; i < parts.length; i += 2) {
        const num = parseInt(parts[i], 10);
        const text = (parts[i + 1] || '').trim();
        if (text) segments.push({ num: Number.isNaN(num) ? null : num, text });
      }
      if (segments.length > 0) return segments;
    }

    const leadingMatch = cleaned.match(/^(\d+)\s+(.+)$/);
    if (leadingMatch) {
      const firstNum = parseInt(leadingMatch[1], 10);
      const segments = [];
      const regex = /(?:^|\s)(\d{1,3})\s+/g;
      const hits = [];
      let m;
      let expectedNext = firstNum;
      while ((m = regex.exec(cleaned)) !== null) {
        const num = parseInt(m[1], 10);
        if (num === expectedNext) {
          hits.push({ num, start: m.index, textStart: m.index + m[0].length });
          expectedNext += 1;
        }
      }
      if (hits.length > 0) {
        for (let i = 0; i < hits.length; i++) {
          const end = i + 1 < hits.length ? hits[i + 1].start : cleaned.length;
          const text = cleaned.slice(hits[i].textStart, end).trim();
          if (text) segments.push({ num: hits[i].num, text });
        }
        if (segments.length > 0) return segments;
      }
    }

    return [{ num: null, text: cleaned }];
  }

  function announce(message) {
    if (els.srStatus) {
      els.srStatus.textContent = message;
    }
  }

  /* ------------------------------------------------------------------------
   * Persistence
   * ---------------------------------------------------------------------- */
  function loadStorage() {
    try {
      const rawPrefs = localStorage.getItem(STORAGE_KEYS.prefs);
      if (rawPrefs) {
        const p = JSON.parse(rawPrefs);
        if (p.translation === 'ESV' || p.translation === 'NIV') state.translation = p.translation;
        if (p.theme === 'light' || p.theme === 'dark') state.theme = p.theme;
        if (typeof p.showBlanks === 'boolean') state.showBlanks = p.showBlanks;
        if (typeof p.autoConfirm === 'boolean') state.autoConfirm = p.autoConfirm;
        if (typeof p.sessionCompleted === 'number') state.sessionCompleted = p.sessionCompleted;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.theme = 'dark';
      }

      const rawProgress = localStorage.getItem(STORAGE_KEYS.progress);
      if (rawProgress) {
        state.progress = JSON.parse(rawProgress) || {};
      }

      const rawCustom = localStorage.getItem(STORAGE_KEYS.customVerses);
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom);
        if (Array.isArray(parsed)) state.customVerses = parsed;
      }

      const rawCache = localStorage.getItem(STORAGE_KEYS.verseCache);
      if (rawCache) {
        const parsedCache = JSON.parse(rawCache);
        if (parsedCache && typeof parsedCache === 'object') {
          state.verseCache = parsedCache;
        }
      }
    } catch (_) {}
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify({
        translation: state.translation,
        theme: state.theme,
        showBlanks: state.showBlanks,
        autoConfirm: state.autoConfirm,
        sessionCompleted: state.sessionCompleted
      }));
    } catch (_) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state.progress));
    } catch (_) {}
  }

  function saveCustomVerses() {
    try {
      localStorage.setItem(STORAGE_KEYS.customVerses, JSON.stringify(state.customVerses));
    } catch (_) {}
  }

  function saveVerseCache() {
    try {
      localStorage.setItem(STORAGE_KEYS.verseCache, JSON.stringify(state.verseCache));
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
   * Bolls Bible API (https://bolls.life/api/)
   * ---------------------------------------------------------------------- */
  async function fetchChapterFromBolls(translation, bookId, chapter) {
    const slugs = BOLLS_SLUGS[translation] || [translation];
    let lastError = null;

    for (const slug of slugs) {
      const cacheKey = `${slug}:${bookId}:${chapter}`;
      if (state.chapterCache[cacheKey]) {
        return state.chapterCache[cacheKey];
      }

      try {
        const url = `https://bolls.life/get-chapter/${encodeURIComponent(slug)}/${bookId}/${chapter}/`;
        const res = await fetch(url);
        if (!res.ok) {
          lastError = new Error(`${translation} returned HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          lastError = new Error(`No ${translation} verses returned for that chapter.`);
          continue;
        }
        const firstClean = cleanBollsHtml(data[0].text);
        if (!firstClean || isRestrictionNotice(firstClean)) {
          lastError = new Error(`${translation} is restricted on Bolls Bible API.`);
          continue;
        }
        state.chapterCache[cacheKey] = data;
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Could not fetch ${translation} from Bolls Bible API.`);
  }

  async function fetchPassageFromBolls(verse, translation) {
    if (!verse.bookId || !verse.chapter || !Array.isArray(verse.verses)) {
      throw new Error('Passage metadata missing for online lookup.');
    }

    const chapterData = await fetchChapterFromBolls(translation, verse.bookId, verse.chapter);
    const byNum = new Map(chapterData.map((v) => [Number(v.verse), v.text]));
    const segments = [];

    for (const vNum of verse.verses) {
      const raw = byNum.get(Number(vNum));
      if (!raw) continue;
      const text = cleanBollsHtml(raw);
      if (text && !isRestrictionNotice(text)) {
        segments.push({ num: vNum, text });
      }
    }

    if (segments.length === 0) {
      throw new Error(`Could not find ${verse.reference} in ${translation}.`);
    }

    return segments;
  }

  async function fetchRandomVerseFromBolls(translation) {
    const slugs = BOLLS_SLUGS[translation] || [translation];
    let lastError = null;

    for (const slug of slugs) {
      try {
        const res = await fetch(`https://bolls.life/get-random-verse/${encodeURIComponent(slug)}/`);
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        const text = cleanBollsHtml(data && data.text);
        if (!data || !text || isRestrictionNotice(text)) {
          lastError = new Error(`${translation} random verse is unavailable.`);
          continue;
        }
        const bookId = Number(data.book);
        const book = BIBLE_BOOKS[bookId] || `Book ${bookId}`;
        const chapter = Number(data.chapter);
        const vNum = Number(data.verse);
        const reference = `${book} ${chapter}:${vNum}`;
        const id = `bolls-${bookId}-${chapter}-${vNum}`;

        const verseObj = {
          id,
          reference,
          book,
          bookId,
          chapter,
          verses: [vNum],
          category: 'Entire Bible',
          isMultiVerse: false
        };

        if (!state.verseCache[id]) state.verseCache[id] = {};
        state.verseCache[id][translation] = [{ num: vNum, text }];
        saveVerseCache();

        return verseObj;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Unable to fetch a random ${translation} verse.`);
  }

  /* ------------------------------------------------------------------------
   * Verse Deck & Selection
   * ---------------------------------------------------------------------- */
  function getAllVerses() {
    return [...state.customVerses, ...BIBLE_VERSES];
  }

  function getCachedSegments(verse, translation) {
    const cached = state.verseCache[verse.id];
    if (cached && Array.isArray(cached[translation]) && cached[translation].length > 0) {
      return cached[translation];
    }
    if (verse.translations && Array.isArray(verse.translations[translation]) && verse.translations[translation].length > 0) {
      return verse.translations[translation];
    }
    return null;
  }

  function getFilteredVerses() {
    const all = getAllVerses();
    if (state.category === 'All') return all;
    if (state.category === 'Multi-Verse') return all.filter((v) => v.isMultiVerse);
    return all.filter((v) => v.category === state.category);
  }

  function refillShuffleBag(excludeId) {
    const pool = getFilteredVerses();
    let ids = shuffleArray(pool.map((v) => v.id));
    if (excludeId && ids.length > 1 && ids[0] === excludeId) {
      const first = ids.shift();
      ids.push(first);
    }
    state.shuffleBag = ids;
  }

  async function pickNextRandomVerse() {
    if (state.category === 'Entire Bible') {
      const loadId = ++state.currentLoadId;
      showLoadingState('Random Verse', 'Entire Bible');
      try {
        const verseObj = await fetchRandomVerseFromBolls(state.translation);
        if (state.currentLoadId !== loadId) return;
        loadVerse(verseObj);
      } catch (err) {
        if (state.currentLoadId !== loadId) return;
        // Fallback to picking a curated reference so the missing panel has a concrete Bible Gateway link
        const fallback = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
        state.currentVerse = fallback;
        showMissingTranslationPanel(fallback, err.message);
      }
      return;
    }

    const excludeId = state.currentVerse ? state.currentVerse.id : null;
    if (state.shuffleBag.length === 0) {
      refillShuffleBag(excludeId);
    }

    const poolMap = new Map(getFilteredVerses().map((v) => [v.id, v]));
    while (state.shuffleBag.length > 0) {
      const nextId = state.shuffleBag.shift();
      if (poolMap.has(nextId) && (nextId !== excludeId || poolMap.size === 1)) {
        loadVerse(poolMap.get(nextId));
        return;
      }
    }

    refillShuffleBag(excludeId);
    if (state.shuffleBag.length > 0) {
      const fallback = poolMap.get(state.shuffleBag.shift());
      if (fallback) loadVerse(fallback);
    }
  }

  /* ------------------------------------------------------------------------
   * Tokenization & Verse Loading
   * ---------------------------------------------------------------------- */
  function tokenizePassage(segments) {
    const tokens = [];
    const showVerseNums = segments.length > 1;

    segments.forEach((seg) => {
      // Split words joined by em-dashes (e.g. "salvation—whom" -> "salvation—", "whom") for smoother typing
      const prepared = seg.text
        .replace(/([A-Za-z0-9])—([A-Za-z0-9])/g, '$1— $2')
        .trim();
      const words = prepared.split(/\s+/).filter(Boolean);

      words.forEach((word, idx) => {
        const canonical = normalizeWord(word);
        if (!canonical && tokens.length > 0) {
          tokens[tokens.length - 1].display += ' ' + word;
          tokens[tokens.length - 1].trailingPunct = extractTrailingPunct(tokens[tokens.length - 1].display);
          return;
        }
        tokens.push({
          display: word,
          canonical: canonical || word.toLowerCase(),
          trailingPunct: extractTrailingPunct(word),
          verseNum: showVerseNums && idx === 0 && seg.num != null ? seg.num : null,
          status: 'pending'
        });
      });
    });

    return tokens;
  }

  function showLoadingState(reference, category) {
    state.isLoading = true;
    state.isMissingTranslation = false;

    els.verseReference.textContent = reference;
    els.verseCategory.textContent = category;
    els.verseTranslationLabel.textContent = TRANSLATION_NAMES[state.translation];
    els.wordCounter.textContent = 'Loading...';
    els.hintCounter.hidden = true;
    els.progressFill.style.width = '0%';

    els.loadingText.textContent = `Fetching ${reference} (${state.translation}) from Bolls Bible API...`;
    els.loadingPanel.hidden = false;
    els.missingTransPanel.hidden = true;
    els.verseCanvas.hidden = true;
    els.practiceControls.hidden = true;
    els.completionPanel.hidden = true;
  }

  async function loadVerse(verse, forceRefetch) {
    state.currentVerse = verse;
    const loadId = ++state.currentLoadId;
    const categoryText = verse.isMultiVerse ? `${verse.category} · Multi-Verse` : verse.category;

    if (!forceRefetch) {
      const cached = getCachedSegments(verse, state.translation);
      if (cached) {
        startPracticeWithSegments(verse, cached);
        return;
      }
    }

    showLoadingState(verse.reference, categoryText);

    try {
      const segments = await fetchPassageFromBolls(verse, state.translation);
      if (state.currentLoadId !== loadId) return;

      if (!state.verseCache[verse.id]) state.verseCache[verse.id] = {};
      state.verseCache[verse.id][state.translation] = segments;
      saveVerseCache();

      startPracticeWithSegments(verse, segments);
    } catch (err) {
      if (state.currentLoadId !== loadId) return;
      showMissingTranslationPanel(verse, err.message);
    }
  }

  function startPracticeWithSegments(verse, segments) {
    state.isLoading = false;
    state.isMissingTranslation = false;
    state.tokens = tokenizePassage(segments);
    state.hintsUsed = 0;
    state.recalledCount = 0;
    state.completed = false;
    state.lastConfirmTime = 0;
    state.lastConfirmedPunct = '';

    if (state.tokens.length > 0) {
      state.tokens[0].status = 'given';
      state.currentIndex = 1;
    } else {
      state.currentIndex = 0;
    }

    els.verseReference.textContent = verse.reference;
    els.verseCategory.textContent = verse.isMultiVerse
      ? `${verse.category} · Multi-Verse`
      : verse.category;
    els.verseTranslationLabel.textContent = TRANSLATION_NAMES[state.translation];

    els.loadingPanel.hidden = true;
    els.missingTransPanel.hidden = true;
    els.verseCanvas.hidden = false;
    els.practiceControls.hidden = false;
    els.completionPanel.hidden = true;

    renderFullVerseFlow();
    updateCounters();

    if (state.currentIndex >= state.tokens.length) {
      finishVerse();
    } else {
      focusInput();
    }
  }

  function showMissingTranslationPanel(verse, errorReason) {
    state.isLoading = false;
    state.isMissingTranslation = true;

    const trans = state.translation;
    const { verseUrl } = buildSourceLinks(verse, trans);

    els.verseReference.textContent = verse.reference;
    els.verseCategory.textContent = verse.isMultiVerse
      ? `${verse.category} · Multi-Verse`
      : verse.category;
    els.verseTranslationLabel.textContent = TRANSLATION_NAMES[trans];

    els.progressFill.style.width = '0%';
    els.wordCounter.textContent = `${trans} unavailable`;
    els.hintCounter.hidden = true;

    els.loadingPanel.hidden = true;
    els.verseCanvas.hidden = true;
    els.practiceControls.hidden = true;
    els.completionPanel.hidden = true;

    els.missingTransTitle.textContent = `Could not auto-load ${verse.reference} (${trans})`;
    els.missingTransDesc.textContent = errorReason
      ? `${errorReason} You can retry, switch to ESV, or paste the exact ${trans} text from Bible Gateway below (saved locally in your browser).`
      : `Open ${verse.reference} (${trans}) on Bible Gateway and paste it below to save it for offline practice.`;

    els.missingBgLink.href = verseUrl;
    els.missingBgLinkLabel.textContent = `Open ${verse.reference} (${trans}) on Bible Gateway`;
    els.missingSwitchEsvBtn.hidden = trans === 'ESV';

    els.inlinePasteInput.value = '';
    els.inlinePasteInput.placeholder = `Paste ${verse.reference} (${trans}) text here...`;
    els.inlinePasteError.hidden = true;

    els.missingTransPanel.hidden = false;
  }

  /* ------------------------------------------------------------------------
   * Rendering the Inline Scripture Flow
   * ---------------------------------------------------------------------- */
  function createWordFragment(token) {
    const frag = document.createDocumentFragment();

    if (token.verseNum !== null) {
      const sup = document.createElement('span');
      sup.className = 'verse-num';
      sup.textContent = String(token.verseNum);
      frag.appendChild(sup);
    }

    const span = document.createElement('span');
    span.className = `word-token word-${token.status}`;
    span.textContent = token.display;

    if (token.status === 'given') {
      span.title = 'Starting word';
    } else if (token.status === 'hinted') {
      span.title = 'Revealed with Tab';
    }

    frag.appendChild(span);
    return frag;
  }

  function createActiveInputElement() {
    const wrap = document.createElement('span');
    wrap.className = 'active-input-wrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'word-input';
    input.className = 'word-input';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.autocorrect = 'off';
    input.spellcheck = false;
    input.placeholder = 'type...';
    input.setAttribute('aria-label', 'Type the next word of the verse');

    input.addEventListener('input', handleWordInput);
    input.addEventListener('keydown', handleInputKeydown);

    wrap.appendChild(input);
    activeInputWrap = wrap;
    wordInput = input;
    return wrap;
  }

  function updateInputWidth() {
    if (!wordInput) return;
    const len = Math.max(wordInput.value.length + 1.5, 4.5);
    wordInput.style.width = `${Math.min(len, 24)}ch`;
  }

  function renderFullVerseFlow() {
    els.verseFlow.innerHTML = '';

    for (let i = 0; i < state.currentIndex; i++) {
      els.verseFlow.appendChild(createWordFragment(state.tokens[i]));
    }

    if (!state.completed && state.currentIndex < state.tokens.length) {
      const activeToken = state.tokens[state.currentIndex];
      if (activeToken.verseNum !== null) {
        const sup = document.createElement('span');
        sup.className = 'verse-num active-verse-num';
        sup.textContent = String(activeToken.verseNum);
        els.verseFlow.appendChild(sup);
      }

      els.verseFlow.appendChild(createActiveInputElement());
      updateInputWidth();

      if (state.showBlanks) {
        renderRemainingBlanks();
      }
    }
  }

  function renderRemainingBlanks() {
    els.verseFlow.querySelectorAll('.word-blank').forEach((b) => b.remove());
    if (!state.showBlanks || state.completed || state.isMissingTranslation || state.isLoading) return;

    const remaining = state.tokens.length - state.currentIndex - 1;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < remaining; i++) {
      const blank = document.createElement('span');
      blank.className = 'word-blank';
      blank.setAttribute('aria-hidden', 'true');
      frag.appendChild(blank);
    }
    els.verseFlow.appendChild(frag);
  }

  function commitCurrentToken(status) {
    const token = state.tokens[state.currentIndex];
    token.status = status;

    if (status === 'recalled') {
      state.recalledCount += 1;
      state.lastConfirmTime = Date.now();
      state.lastConfirmedPunct = token.trailingPunct;
    } else if (status === 'hinted') {
      state.hintsUsed += 1;
      state.lastConfirmTime = Date.now();
      state.lastConfirmedPunct = '';
    }

    const prevActiveNum = els.verseFlow.querySelector('.active-verse-num');
    if (prevActiveNum) prevActiveNum.remove();

    const wordFrag = createWordFragment(token);
    if (activeInputWrap && activeInputWrap.parentNode === els.verseFlow) {
      els.verseFlow.insertBefore(wordFrag, activeInputWrap);
    } else {
      els.verseFlow.appendChild(wordFrag);
    }

    const firstBlank = els.verseFlow.querySelector('.word-blank');
    if (firstBlank) firstBlank.remove();

    state.currentIndex += 1;

    if (wordInput) {
      wordInput.value = '';
      wordInput.placeholder = '';
      updateInputWidth();
    }
    if (activeInputWrap) {
      activeInputWrap.classList.remove('is-error', 'is-shake');
    }

    updateCounters();

    if (state.currentIndex >= state.tokens.length) {
      finishVerse();
    } else {
      const nextToken = state.tokens[state.currentIndex];
      if (nextToken.verseNum !== null && activeInputWrap) {
        const sup = document.createElement('span');
        sup.className = 'verse-num active-verse-num';
        sup.textContent = String(nextToken.verseNum);
        els.verseFlow.insertBefore(sup, activeInputWrap);
      }
      focusInput();
    }
  }

  function updateCounters() {
    const total = state.tokens.length;
    const done = Math.min(state.currentIndex, total);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    els.progressFill.style.width = `${pct}%`;
    els.wordCounter.textContent = `${done} / ${total} words`;

    if (state.hintsUsed > 0) {
      els.hintCounter.hidden = false;
      els.hintCounter.textContent = `${state.hintsUsed} ${state.hintsUsed === 1 ? 'hint' : 'hints'}`;
    } else {
      els.hintCounter.hidden = true;
    }
  }

  function triggerShake() {
    if (!activeInputWrap) return;
    activeInputWrap.classList.remove('is-shake');
    void activeInputWrap.offsetWidth;
    activeInputWrap.classList.add('is-shake');
  }

  function focusInput() {
    if (wordInput && !state.completed && !state.isMissingTranslation && !state.isLoading && !isOverlayOpen()) {
      wordInput.focus({ preventScroll: false });
    }
  }

  /* ------------------------------------------------------------------------
   * Typing & Tab-Hint Logic
   * ---------------------------------------------------------------------- */
  function handleWordInput() {
    if (state.completed || state.isMissingTranslation || state.isLoading || !wordInput) return;

    const raw = wordInput.value;

    if (raw.trim() === '') {
      if (raw.length > 0) {
        wordInput.value = '';
        updateInputWidth();
      }
      activeInputWrap.classList.remove('is-error');
      return;
    }

    const normalized = normalizeWord(raw);
    if (
      normalized === '' &&
      Date.now() - state.lastConfirmTime < 750 &&
      state.lastConfirmedPunct &&
      state.lastConfirmedPunct.includes(raw.trim()[0])
    ) {
      wordInput.value = '';
      updateInputWidth();
      activeInputWrap.classList.remove('is-error');
      return;
    }

    updateInputWidth();

    const target = state.tokens[state.currentIndex].canonical;

    if (
      normalized.length > 0 &&
      normalized === target &&
      (state.autoConfirm || /\s$/.test(raw))
    ) {
      commitCurrentToken('recalled');
      return;
    }

    if (normalized.length > 0 && !target.startsWith(normalized)) {
      activeInputWrap.classList.add('is-error');
    } else {
      activeInputWrap.classList.remove('is-error');
    }
  }

  function handleInputKeydown(e) {
    if (state.completed || state.isMissingTranslation || state.isLoading) return;

    if (e.key === ' ' || e.key === 'Enter') {
      const raw = wordInput.value;
      const normalized = normalizeWord(raw);
      const target = state.tokens[state.currentIndex].canonical;

      if (normalized === '') {
        e.preventDefault();
        e.stopPropagation();
        wordInput.value = '';
        updateInputWidth();
        return;
      }

      if (normalized === target) {
        e.preventDefault();
        e.stopPropagation();
        commitCurrentToken('recalled');
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      activeInputWrap.classList.add('is-error');
      triggerShake();
    }
  }

  function revealNextWord() {
    if (state.completed || state.isMissingTranslation || state.isLoading || state.currentIndex >= state.tokens.length) return;
    const word = state.tokens[state.currentIndex].display;
    commitCurrentToken('hinted');
    announce(`Revealed: ${word}`);
  }

  /* ------------------------------------------------------------------------
   * Completion & Source Link
   * ---------------------------------------------------------------------- */
  function finishVerse() {
    state.completed = true;

    if (activeInputWrap && activeInputWrap.parentNode) {
      activeInputWrap.remove();
    }
    els.verseFlow.querySelectorAll('.word-blank, .active-verse-num').forEach((n) => n.remove());

    const practiceWords = Math.max(state.tokens.length - 1, 1);
    const accuracy = Math.round((state.recalledCount / practiceWords) * 100);

    state.sessionCompleted += 1;
    els.streakCount.textContent = String(state.sessionCompleted);
    savePrefs();

    const vid = state.currentVerse.id;
    const prev = state.progress[vid] || { bestAccuracy: 0, completions: 0 };
    state.progress[vid] = {
      bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
      completions: prev.completions + 1
    };
    saveProgress();

    const isMulti = state.currentVerse.isMultiVerse;
    els.completionHeading.textContent = isMulti ? 'Passage Complete' : 'Verse Complete';

    if (state.hintsUsed === 0) {
      els.completionSub.textContent = 'Flawless recall — every proceeding word from memory.';
    } else if (accuracy >= 80) {
      els.completionSub.textContent = 'Strong recall! Practice once more to lock in the hinted words.';
    } else {
      els.completionSub.textContent = 'Good progress! Repetition builds lasting recall.';
    }

    els.statRecalled.textContent = String(state.recalledCount);
    els.statHints.textContent = String(state.hintsUsed);
    els.statAccuracy.textContent = `${accuracy}%`;

    const { verseUrl, chapterUrl, chapterRef } = buildSourceLinks(state.currentVerse, state.translation);
    const transFullName = TRANSLATION_NAMES[state.translation] || state.translation;

    els.sourceRefText.textContent = `${state.currentVerse.reference} — ${transFullName}`;
    els.sourceVerseLink.href = verseUrl;
    els.sourceVerseLinkLabel.textContent = `Read ${state.currentVerse.reference} (${state.translation})`;
    els.sourceChapterLink.href = chapterUrl;
    els.sourceChapterLinkLabel.textContent = `Full Chapter (${chapterRef})`;

    els.practiceControls.hidden = true;
    els.completionPanel.hidden = false;

    announce(`Completed ${state.currentVerse.reference} with ${accuracy} percent accuracy.`);
  }

  /* ------------------------------------------------------------------------
   * UI Sync (Theme, Translation, Controls)
   * ---------------------------------------------------------------------- */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
  }

  function applyControlStates() {
    els.segBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.translation === state.translation);
    });
    els.lookupTransHint.textContent = state.translation;
    els.streakCount.textContent = String(state.sessionCompleted);
    els.pasteTransSelect.value = state.translation;

    els.blanksToggleBtn.setAttribute('aria-pressed', String(state.showBlanks));
    els.confirmModeBtn.setAttribute('aria-pressed', String(state.autoConfirm));
    els.confirmModeBtn.querySelector('span').textContent = state.autoConfirm ? 'Auto-confirm' : 'Space to confirm';
    els.typingHint.textContent = state.autoConfirm
      ? 'Type each word — confirmed automatically'
      : 'Type each word and press Space to confirm';
  }

  /* ------------------------------------------------------------------------
   * Library Drawer
   * ---------------------------------------------------------------------- */
  function isOverlayOpen() {
    return !els.customModalBackdrop.hidden || els.libraryDrawer.classList.contains('open');
  }

  function openLibrary() {
    renderLibraryList();
    els.libraryBackdrop.hidden = false;
    els.libraryDrawer.classList.add('open');
    els.libraryDrawer.setAttribute('aria-hidden', 'false');
    els.librarySearch.focus();
  }

  function closeLibrary() {
    els.libraryBackdrop.hidden = true;
    els.libraryDrawer.classList.remove('open');
    els.libraryDrawer.setAttribute('aria-hidden', 'true');
    focusInput();
  }

  function renderLibraryList() {
    const query = (els.librarySearch.value || '').trim().toLowerCase();
    const all = getAllVerses();
    const masteredCount = all.filter((v) => state.progress[v.id]?.bestAccuracy === 100).length;
    els.librarySummary.textContent = `${all.length} curated passages · ${masteredCount} mastered at 100%`;

    const filtered = all.filter((v) => {
      if (!query) return true;
      const segs = getCachedSegments(v, state.translation);
      const preview = segs ? segs.map((s) => s.text).join(' ').toLowerCase() : '';
      return (
        v.reference.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query) ||
        preview.includes(query)
      );
    });

    els.libraryList.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'field-help';
      empty.style.padding = '16px';
      empty.textContent = 'No matching verses found. Use "+ Look Up" to load any verse from the Bible.';
      els.libraryList.appendChild(empty);
      return;
    }

    filtered.forEach((verse) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'library-item';
      if (state.currentVerse && state.currentVerse.id === verse.id) {
        btn.classList.add('is-active');
      }

      const segs = getCachedSegments(verse, state.translation);
      const previewText = segs
        ? segs.map((s) => s.text).join(' ')
        : `Click to fetch ${verse.reference} (${state.translation})`;
      const prog = state.progress[verse.id];

      const top = document.createElement('div');
      top.className = 'library-item-top';

      const refSpan = document.createElement('span');
      refSpan.className = 'library-ref';
      refSpan.textContent = verse.reference;
      top.appendChild(refSpan);

      if (prog) {
        const badge = document.createElement('span');
        badge.className = 'library-badge';
        badge.textContent = `${prog.bestAccuracy}% best`;
        top.appendChild(badge);
      }

      const preview = document.createElement('span');
      preview.className = 'library-preview';
      preview.textContent = previewText;

      const meta = document.createElement('div');
      meta.className = 'library-meta-row';
      const cat = document.createElement('span');
      const cachedTag = segs ? ' · cached' : '';
      cat.textContent = `${verse.isMultiVerse ? `${verse.category} · Multi-Verse` : verse.category}${cachedTag}`;
      meta.appendChild(cat);

      if (verse.isCustom) {
        const del = document.createElement('span');
        del.className = 'library-delete-btn';
        del.textContent = 'Remove';
        del.setAttribute('role', 'button');
        del.addEventListener('click', (ev) => {
          ev.stopPropagation();
          state.customVerses = state.customVerses.filter((c) => c.id !== verse.id);
          saveCustomVerses();
          renderLibraryList();
        });
        meta.appendChild(del);
      }

      btn.appendChild(top);
      btn.appendChild(preview);
      btn.appendChild(meta);

      btn.addEventListener('click', () => {
        loadVerse(verse);
        closeLibrary();
      });

      els.libraryList.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------------------
   * Look Up / Paste Modal & Inline Paste
   * ---------------------------------------------------------------------- */
  function updatePasteHelperLink() {
    const ref = els.pasteRefInput.value.trim() || (state.currentVerse ? state.currentVerse.reference : 'Psalm 23:4');
    const trans = els.pasteTransSelect.value || state.translation;
    els.pasteBgHelper.href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${encodeURIComponent(trans)}`;
    els.pasteBgHelper.textContent = `Open ${ref} (${trans}) on Bible Gateway ↗`;
  }

  function openCustomModal(defaultTab) {
    els.customModalBackdrop.hidden = false;
    els.lookupError.hidden = true;
    els.pasteError.hidden = true;
    els.lookupTransHint.textContent = state.translation;
    els.pasteTransSelect.value = state.translation;
    updatePasteHelperLink();
    switchModalTab(defaultTab || 'lookup');
  }

  function closeCustomModal() {
    els.customModalBackdrop.hidden = true;
    focusInput();
  }

  function switchModalTab(tabName) {
    els.modalTabs.forEach((tab) => {
      const active = tab.dataset.tab === tabName;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    if (tabName === 'lookup') {
      els.lookupForm.hidden = false;
      els.pasteForm.hidden = true;
      els.lookupRefInput.focus();
    } else {
      els.lookupForm.hidden = true;
      els.pasteForm.hidden = false;
      els.pasteRefInput.focus();
    }
  }

  async function handleLookupSubmit(e) {
    e.preventDefault();
    const rawRef = els.lookupRefInput.value.trim();
    if (!rawRef) return;

    els.lookupError.hidden = true;
    const parsed = parseReference(rawRef);
    if (!parsed) {
      els.lookupError.textContent = 'Enter a reference with book, chapter, and verse (e.g. Psalm 23:4 or 1 Cor 13:4-7).';
      els.lookupError.hidden = false;
      return;
    }

    els.lookupSubmitBtn.disabled = true;
    els.lookupSubmitBtn.textContent = 'Loading...';

    try {
      const tempVerse = {
        id: `custom-bolls-${parsed.bookId}-${parsed.chapter}-${parsed.verses.join('-')}`,
        reference: parsed.reference,
        book: parsed.book,
        bookId: parsed.bookId,
        chapter: parsed.chapter,
        verses: parsed.verses,
        category: 'Custom',
        isMultiVerse: parsed.isMultiVerse,
        isCustom: true
      };

      const segments = await fetchPassageFromBolls(tempVerse, state.translation);

      const existing = getAllVerses().find(
        (v) => v.reference.toLowerCase() === parsed.reference.toLowerCase()
      );
      const targetVerse = existing || tempVerse;

      if (!state.verseCache[targetVerse.id]) state.verseCache[targetVerse.id] = {};
      state.verseCache[targetVerse.id][state.translation] = segments;
      saveVerseCache();

      if (!existing) {
        state.customVerses.unshift(targetVerse);
        saveCustomVerses();
      }

      els.lookupRefInput.value = '';
      closeCustomModal();
      startPracticeWithSegments(targetVerse, segments);
    } catch (err) {
      els.lookupError.textContent = `${err.message || 'Lookup failed.'} You can also paste the text in the "Paste Text" tab.`;
      els.lookupError.hidden = false;
    } finally {
      els.lookupSubmitBtn.disabled = false;
      els.lookupSubmitBtn.textContent = 'Load Passage';
    }
  }

  function handleInlinePasteSubmit(e) {
    e.preventDefault();
    if (!state.currentVerse) return;

    const rawText = els.inlinePasteInput.value.trim();
    const segments = parsePastedPassage(rawText);
    const wordCount = segments.map((s) => s.text).join(' ').split(/\s+/).filter(Boolean).length;

    if (wordCount < 2) {
      els.inlinePasteError.textContent = 'Please paste at least two words of verse text.';
      els.inlinePasteError.hidden = false;
      return;
    }

    if (!state.verseCache[state.currentVerse.id]) {
      state.verseCache[state.currentVerse.id] = {};
    }
    state.verseCache[state.currentVerse.id][state.translation] = segments;
    saveVerseCache();
    startPracticeWithSegments(state.currentVerse, segments);
  }

  function handlePasteSubmit(e) {
    e.preventDefault();
    const ref = els.pasteRefInput.value.trim();
    const trans = els.pasteTransSelect.value || state.translation;
    const rawText = els.pasteTextInput.value.trim();
    const segments = parsePastedPassage(rawText);
    const wordCount = segments.map((s) => s.text).join(' ').split(/\s+/).filter(Boolean).length;

    if (!ref || wordCount < 2) {
      els.pasteError.textContent = 'Please enter a reference and at least two words of verse text.';
      els.pasteError.hidden = false;
      return;
    }

    state.translation = trans;
    savePrefs();
    applyControlStates();

    const existing = getAllVerses().find(
      (v) => v.reference.toLowerCase() === ref.toLowerCase()
    );

    if (existing) {
      if (!state.verseCache[existing.id]) state.verseCache[existing.id] = {};
      state.verseCache[existing.id][trans] = segments;
      saveVerseCache();
      els.pasteRefInput.value = '';
      els.pasteTextInput.value = '';
      closeCustomModal();
      startPracticeWithSegments(existing, segments);
      return;
    }

    const parsedFull = parseReference(ref);
    const parsedBC = parseBookAndChapter(ref);
    const versePart = ref.includes(':') ? ref.split(':')[1] : '';
    const newVerse = {
      id: `custom-paste-${Date.now()}`,
      reference: parsedFull ? parsedFull.reference : ref,
      book: parsedFull ? parsedFull.book : parsedBC.book,
      bookId: parsedFull ? parsedFull.bookId : null,
      chapter: parsedFull ? parsedFull.chapter : parsedBC.chapter,
      verses: parsedFull ? parsedFull.verses : null,
      category: 'Custom',
      isMultiVerse: segments.length > 1 || /[-–,]/.test(versePart),
      isCustom: true
    };

    state.verseCache[newVerse.id] = { [trans]: segments };
    saveVerseCache();
    state.customVerses.unshift(newVerse);
    saveCustomVerses();
    els.pasteRefInput.value = '';
    els.pasteTextInput.value = '';
    closeCustomModal();
    startPracticeWithSegments(newVerse, segments);
  }

  /* ------------------------------------------------------------------------
   * Event Listeners
   * ---------------------------------------------------------------------- */
  function bindEvents() {
    els.segBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTrans = btn.dataset.translation;
        if (nextTrans === state.translation) return;
        state.translation = nextTrans;
        savePrefs();
        applyControlStates();
        if (state.currentVerse) {
          loadVerse(state.currentVerse);
        }
      });
    });

    els.categoryPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const nextCat = pill.dataset.category;
        if (nextCat === state.category) return;
        state.category = nextCat;
        els.categoryPills.forEach((p) => p.classList.toggle('active', p === pill));
        state.shuffleBag = [];
        pickNextRandomVerse();
      });
    });

    els.themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      savePrefs();
    });

    // Missing / Retry fallback panel
    els.missingRetryBtn.addEventListener('click', () => {
      if (state.currentVerse) loadVerse(state.currentVerse, true);
    });
    els.inlinePasteForm.addEventListener('submit', handleInlinePasteSubmit);
    els.missingSkipBtn.addEventListener('click', () => pickNextRandomVerse());
    els.missingSwitchEsvBtn.addEventListener('click', () => {
      state.translation = 'ESV';
      savePrefs();
      applyControlStates();
      if (state.currentVerse) loadVerse(state.currentVerse);
    });

    els.verseCanvas.addEventListener('click', () => {
      focusInput();
    });

    els.hintBtn.addEventListener('click', () => {
      revealNextWord();
      focusInput();
    });

    els.blanksToggleBtn.addEventListener('click', () => {
      state.showBlanks = !state.showBlanks;
      savePrefs();
      applyControlStates();
      renderRemainingBlanks();
      focusInput();
    });

    els.confirmModeBtn.addEventListener('click', () => {
      state.autoConfirm = !state.autoConfirm;
      savePrefs();
      applyControlStates();
      focusInput();
    });

    els.restartBtn.addEventListener('click', () => {
      if (state.currentVerse) loadVerse(state.currentVerse);
    });

    els.nextRandomBtn.addEventListener('click', () => {
      pickNextRandomVerse();
    });

    els.practiceAgainBtn.addEventListener('click', () => {
      if (state.currentVerse) loadVerse(state.currentVerse);
    });

    els.nextAfterCompleteBtn.addEventListener('click', () => {
      pickNextRandomVerse();
    });

    // Library drawer
    els.openLibraryBtn.addEventListener('click', openLibrary);
    els.closeLibraryBtn.addEventListener('click', closeLibrary);
    els.libraryBackdrop.addEventListener('click', closeLibrary);
    els.librarySearch.addEventListener('input', renderLibraryList);

    // Look Up / Paste modal
    els.openCustomBtn.addEventListener('click', () => openCustomModal('lookup'));
    els.closeCustomBtn.addEventListener('click', closeCustomModal);
    els.cancelLookupBtn.addEventListener('click', closeCustomModal);
    els.cancelPasteBtn.addEventListener('click', closeCustomModal);
    els.customModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.customModalBackdrop) closeCustomModal();
    });
    els.modalTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
    });
    els.lookupForm.addEventListener('submit', handleLookupSubmit);
    els.pasteForm.addEventListener('submit', handlePasteSubmit);
    els.pasteRefInput.addEventListener('input', updatePasteHelperLink);
    els.pasteTransSelect.addEventListener('change', updatePasteHelperLink);

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!els.customModalBackdrop.hidden) {
          closeCustomModal();
          return;
        }
        if (els.libraryDrawer.classList.contains('open')) {
          closeLibrary();
          return;
        }
      }

      if (isOverlayOpen() || state.isMissingTranslation || state.isLoading) return;

      if (e.key === 'Tab' && !state.completed) {
        e.preventDefault();
        revealNextWord();
        return;
      }

      if (state.completed) {
        if (e.key === 'Enter' && document.activeElement?.tagName !== 'A') {
          e.preventDefault();
          pickNextRandomVerse();
        } else if (
          (e.key === 'r' || e.key === 'R') &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey
        ) {
          e.preventDefault();
          if (state.currentVerse) loadVerse(state.currentVerse);
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
   * Initialize
   * ---------------------------------------------------------------------- */
  function init() {
    loadStorage();
    applyTheme();
    applyControlStates();
    bindEvents();
    pickNextRandomVerse();
  }

  init();
})();
