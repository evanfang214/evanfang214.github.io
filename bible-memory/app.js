/**
 * Selah — Random Bible Verse Memorization App
 * Default translation: ESV, with ESV & NIV support.
 * Pure vanilla JS, zero dependencies, works offline & online.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    prefs: 'selah_prefs_v2',
    progress: 'selah_progress_v1',
    customVerses: 'selah_custom_verses_v1',
    esvToken: 'selah_esv_token_v1',
    translationCache: 'selah_translation_cache_v1'
  };

  const TRANSLATION_NAMES = {
    ESV: 'English Standard Version (ESV)',
    NIV: 'New International Version (NIV)'
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

    esvToken: '',
    translationCache: {}, // { [verseId]: { ESV?: Segment[], NIV?: Segment[] } }
    customVerses: [],
    progress: {}, // { [verseId]: { bestAccuracy: number, completions: number } }

    shuffleBag: [],
    currentVerse: null,
    currentLoadId: 0,
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

    translationBanner: document.getElementById('translation-banner'),
    translationBannerText: document.getElementById('translation-banner-text'),
    bannerApiBtn: document.getElementById('banner-api-btn'),
    bannerBgLink: document.getElementById('banner-bg-link'),
    bannerPasteBtn: document.getElementById('banner-paste-btn'),

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

    // Custom / ESV API modal
    openCustomBtn: document.getElementById('open-custom-btn'),
    closeCustomBtn: document.getElementById('close-custom-btn'),
    customModalBackdrop: document.getElementById('custom-modal-backdrop'),
    modalTabs: document.querySelectorAll('.modal-tab'),
    lookupForm: document.getElementById('lookup-form'),
    esvTokenInput: document.getElementById('esv-token-input'),
    saveTokenBtn: document.getElementById('save-token-btn'),
    lookupRefInput: document.getElementById('lookup-ref-input'),
    lookupSuccess: document.getElementById('lookup-success'),
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

  // Persistent inline input elements inside verseFlow
  let activeInputWrap = null;
  let wordInput = null;

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

  function parseBracketedVerses(rawText) {
    // Parses ESV API output like "[1] The Lord is my shepherd... [2] He makes me..."
    const cleaned = rawText.replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(/\[(\d+)\]\s*/);

    if (parts.length <= 1) {
      return [{ num: null, text: cleaned }];
    }

    const segments = [];
    for (let i = 1; i < parts.length; i += 2) {
      const num = parseInt(parts[i], 10);
      const text = (parts[i + 1] || '').trim();
      if (text) {
        segments.push({ num: Number.isNaN(num) ? null : num, text });
      }
    }
    return segments.length > 0 ? segments : [{ num: null, text: cleaned }];
  }

  function parsePastedPassage(rawText) {
    // Supports either plain text or text with leading/inline verse numbers like "5 Trust... 6 In all..."
    const normalized = rawText.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^\[\d+\]/.test(normalized)) {
      return parseBracketedVerses(normalized);
    }
    return [{ num: null, text: normalized }];
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

      const savedToken = localStorage.getItem(STORAGE_KEYS.esvToken);
      if (savedToken) state.esvToken = savedToken;

      const rawCache = localStorage.getItem(STORAGE_KEYS.translationCache);
      if (rawCache) {
        const parsedCache = JSON.parse(rawCache);
        if (parsedCache && typeof parsedCache === 'object') {
          state.translationCache = parsedCache;
        }
      }
    } catch (_) {
      // Ignore storage errors in private browsing / restricted file contexts
    }
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

  function saveEsvToken() {
    try {
      if (state.esvToken) {
        localStorage.setItem(STORAGE_KEYS.esvToken, state.esvToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.esvToken);
      }
    } catch (_) {}
  }

  function saveTranslationCache() {
    try {
      localStorage.setItem(STORAGE_KEYS.translationCache, JSON.stringify(state.translationCache));
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
   * Official Crossway ESV API
   * ---------------------------------------------------------------------- */
  async function fetchEsvPassage(reference, token) {
    const params = new URLSearchParams({
      q: reference,
      'include-passage-references': 'false',
      'include-verse-numbers': 'true',
      'include-first-verse-numbers': 'true',
      'include-footnotes': 'false',
      'include-footnote-body': 'false',
      'include-headings': 'false',
      'include-short-copyright': 'false',
      'include-passage-horizontal-lines': 'false',
      'include-heading-horizontal-lines': 'false'
    });

    const res = await fetch(`https://api.esv.org/v3/passage/text/?${params.toString()}`, {
      headers: {
        Authorization: `Token ${token}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('ESV API key was rejected. Double-check your token from api.esv.org.');
    }
    if (!res.ok) {
      throw new Error(`ESV API request failed (${res.status}). Check the reference and try again.`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.passages) || !data.passages[0] || !data.passages[0].trim()) {
      throw new Error('No ESV passage found for that reference.');
    }

    return {
      canonical: data.canonical || reference,
      segments: parseBracketedVerses(data.passages[0])
    };
  }

  /* ------------------------------------------------------------------------
   * Verse Deck & Selection
   * ---------------------------------------------------------------------- */
  function getAllVerses() {
    return [...state.customVerses, ...BIBLE_VERSES];
  }

  function getFilteredVerses() {
    const all = getAllVerses();
    if (state.category === 'All') return all;
    if (state.category === 'Multi-Verse') return all.filter((v) => v.isMultiVerse);
    return all.filter((v) => v.category === state.category);
  }

  function refillShuffleBag(excludeId) {
    const pool = getFilteredVerses();
    let ids = pool.map((v) => v.id);
    ids = shuffleArray(ids);
    if (excludeId && ids.length > 1 && ids[0] === excludeId) {
      const first = ids.shift();
      ids.push(first);
    }
    state.shuffleBag = ids;
  }

  function pickNextRandomVerse() {
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
   * Translation Resolution & Tokenization
   * ---------------------------------------------------------------------- */
  function getCachedSegments(verse, translation) {
    if (verse.translations && Array.isArray(verse.translations[translation]) && verse.translations[translation].length > 0) {
      return verse.translations[translation];
    }
    const cached = state.translationCache[verse.id];
    if (cached && Array.isArray(cached[translation]) && cached[translation].length > 0) {
      return cached[translation];
    }
    return null;
  }

  function getPassageSegments(verse) {
    const exact = getCachedSegments(verse, state.translation);
    if (exact) {
      return {
        segments: exact,
        translationLabel: TRANSLATION_NAMES[state.translation],
        isExactTranslation: true
      };
    }

    if (verse.customSegments && verse.customSegments.length > 0) {
      return {
        segments: verse.customSegments,
        translationLabel: verse.customTranslation || TRANSLATION_NAMES[state.translation],
        isExactTranslation: true
      };
    }

    // Fallback to built-in public-domain preview (WEB) until ESV API is connected or ESV/NIV text is pasted
    const fallbackSegments = (verse.translations && (verse.translations.WEB || verse.translations.KJV)) || [];
    return {
      segments: fallbackSegments,
      translationLabel: `${state.translation} (preview — public-domain text)`,
      isExactTranslation: false
    };
  }

  function tokenizePassage(segments) {
    const tokens = [];
    const showVerseNums = segments.length > 1;

    segments.forEach((seg) => {
      const words = seg.text.trim().split(/\s+/).filter(Boolean);
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

  function updateTranslationBanner(verse, isExactTranslation, statusMessage) {
    if (isExactTranslation) {
      els.translationBanner.hidden = true;
      return;
    }

    const { verseUrl } = buildSourceLinks(verse, state.translation);
    els.bannerBgLink.href = verseUrl;
    els.bannerBgLink.textContent = `Open ${state.translation} on Bible Gateway ↗`;
    els.bannerPasteBtn.textContent = `Paste ${state.translation}`;
    els.bannerApiBtn.hidden = state.translation !== 'ESV';

    if (statusMessage) {
      els.translationBannerText.textContent = statusMessage;
    } else if (state.translation === 'ESV') {
      els.translationBannerText.textContent =
        'Using public-domain preview text. Connect your free ESV API key (api.esv.org) to auto-load exact ESV, or paste the ESV verse.';
    } else {
      els.translationBannerText.textContent =
        'Using public-domain preview text. Open NIV on Bible Gateway and paste it once to save exact NIV wording for this verse.';
    }

    els.translationBanner.hidden = false;
  }

  function loadVerse(verse) {
    state.currentVerse = verse;
    const loadId = ++state.currentLoadId;

    const { segments, translationLabel, isExactTranslation } = getPassageSegments(verse);
    applyLoadedSegments(verse, segments, translationLabel, isExactTranslation);

    // If ESV is active, not yet cached, and user has saved an ESV API key, auto-fetch exact ESV
    if (!isExactTranslation && state.translation === 'ESV' && state.esvToken) {
      updateTranslationBanner(verse, false, `Loading ${verse.reference} (ESV) from api.esv.org...`);
      fetchEsvPassage(verse.reference, state.esvToken)
        .then((result) => {
          if (state.currentLoadId !== loadId) return;
          if (!state.translationCache[verse.id]) state.translationCache[verse.id] = {};
          state.translationCache[verse.id].ESV = result.segments;
          saveTranslationCache();
          applyLoadedSegments(verse, result.segments, TRANSLATION_NAMES.ESV, true);
        })
        .catch((err) => {
          if (state.currentLoadId !== loadId) return;
          updateTranslationBanner(
            verse,
            false,
            `${err.message || 'Could not reach api.esv.org.'} Showing public-domain preview.`
          );
        });
    }
  }

  function applyLoadedSegments(verse, segments, translationLabel, isExactTranslation) {
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
    els.verseTranslationLabel.textContent = translationLabel;

    updateTranslationBanner(verse, isExactTranslation);

    els.completionPanel.hidden = true;
    els.practiceControls.hidden = false;

    renderFullVerseFlow();
    updateCounters();

    if (state.currentIndex >= state.tokens.length) {
      finishVerse();
    } else {
      focusInput();
    }
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
    if (!state.showBlanks || state.completed) return;

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
    if (wordInput && !state.completed && !isOverlayOpen()) {
      wordInput.focus({ preventScroll: false });
    }
  }

  /* ------------------------------------------------------------------------
   * Typing & Tab-Hint Logic
   * ---------------------------------------------------------------------- */
  function handleWordInput() {
    if (state.completed || !wordInput) return;

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
    if (state.completed) return;

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
    if (state.completed || state.currentIndex >= state.tokens.length) return;
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
    els.streakCount.textContent = String(state.sessionCompleted);
    els.esvTokenInput.value = state.esvToken;
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
    els.librarySummary.textContent = `${all.length} passages · ${masteredCount} mastered at 100%`;

    const filtered = all.filter((v) => {
      if (!query) return true;
      const { segments } = getPassageSegments(v);
      const preview = segments.map((s) => s.text).join(' ').toLowerCase();
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
      empty.textContent = 'No matching verses found. Use "+ Add / ESV API" to load or paste any passage.';
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

      const { segments, isExactTranslation } = getPassageSegments(verse);
      const previewText = segments.map((s) => s.text).join(' ');
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
      const savedTag = isExactTranslation ? ` · ${state.translation} saved` : '';
      cat.textContent = `${verse.isMultiVerse ? `${verse.category} · Multi-Verse` : verse.category}${savedTag}`;
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
   * Custom / ESV API Modal
   * ---------------------------------------------------------------------- */
  function updatePasteHelperLink() {
    const ref = els.pasteRefInput.value.trim() || (state.currentVerse ? state.currentVerse.reference : 'Psalm 23:4');
    const trans = els.pasteTransSelect.value || state.translation;
    els.pasteBgHelper.href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${encodeURIComponent(trans)}`;
    els.pasteBgHelper.textContent = `Open ${ref} (${trans}) on Bible Gateway ↗`;
  }

  function openCustomModal(defaultTab, prefillCurrent) {
    els.customModalBackdrop.hidden = false;
    els.lookupError.hidden = true;
    els.lookupSuccess.hidden = true;
    els.pasteError.hidden = true;
    els.esvTokenInput.value = state.esvToken;
    els.pasteTransSelect.value = state.translation;

    if (prefillCurrent && state.currentVerse) {
      els.pasteRefInput.value = state.currentVerse.reference;
    } else if (!els.pasteRefInput.value) {
      els.pasteRefInput.value = '';
    }
    updatePasteHelperLink();

    switchModalTab(defaultTab || (state.translation === 'ESV' ? 'esv-api' : 'paste'));
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

    if (tabName === 'esv-api') {
      els.lookupForm.hidden = false;
      els.pasteForm.hidden = true;
      if (!state.esvToken) {
        els.esvTokenInput.focus();
      } else {
        els.lookupRefInput.focus();
      }
    } else {
      els.lookupForm.hidden = true;
      els.pasteForm.hidden = false;
      if (els.pasteRefInput.value) {
        els.pasteTextInput.focus();
      } else {
        els.pasteRefInput.focus();
      }
    }
  }

  function handleSaveToken() {
    const token = els.esvTokenInput.value.trim();
    state.esvToken = token;
    saveEsvToken();

    els.lookupError.hidden = true;
    els.lookupSuccess.textContent = token
      ? 'ESV API key saved! ESV passages will now load automatically.'
      : 'ESV API key cleared.';
    els.lookupSuccess.hidden = false;

    if (token && state.translation === 'ESV' && state.currentVerse) {
      loadVerse(state.currentVerse);
    }
  }

  async function handleLookupSubmit(e) {
    e.preventDefault();
    const token = els.esvTokenInput.value.trim();
    const ref = els.lookupRefInput.value.trim();

    els.lookupError.hidden = true;
    els.lookupSuccess.hidden = true;

    if (!token) {
      els.lookupError.textContent = 'Enter your free ESV API token from api.esv.org first, or use the "Paste ESV / NIV" tab.';
      els.lookupError.hidden = false;
      return;
    }

    // Save token if changed
    if (token !== state.esvToken) {
      state.esvToken = token;
      saveEsvToken();
    }

    // If user didn't enter a specific reference, refresh the current verse in ESV and close
    if (!ref) {
      state.translation = 'ESV';
      savePrefs();
      applyControlStates();
      closeCustomModal();
      if (state.currentVerse) loadVerse(state.currentVerse);
      return;
    }

    els.lookupSubmitBtn.disabled = true;
    els.lookupSubmitBtn.textContent = 'Loading ESV...';

    try {
      const result = await fetchEsvPassage(ref, token);
      const parsed = parseBookAndChapter(result.canonical);

      // Check if it matches an existing curated verse
      const existing = getAllVerses().find(
        (v) => v.reference.toLowerCase() === result.canonical.toLowerCase()
      );

      state.translation = 'ESV';
      savePrefs();
      applyControlStates();

      if (existing) {
        if (!state.translationCache[existing.id]) state.translationCache[existing.id] = {};
        state.translationCache[existing.id].ESV = result.segments;
        saveTranslationCache();
        els.lookupRefInput.value = '';
        closeCustomModal();
        loadVerse(existing);
      } else {
        const newVerse = {
          id: `custom-esv-${Date.now()}`,
          reference: result.canonical,
          book: parsed.book,
          chapter: parsed.chapter,
          category: 'Custom',
          isMultiVerse: result.segments.length > 1,
          isCustom: true,
          translations: {
            ESV: result.segments
          }
        };
        state.customVerses.unshift(newVerse);
        saveCustomVerses();
        els.lookupRefInput.value = '';
        closeCustomModal();
        loadVerse(newVerse);
      }
    } catch (err) {
      els.lookupError.textContent = err.message && err.message !== 'Failed to fetch'
        ? err.message
        : 'Unable to reach api.esv.org (check your internet connection or API key).';
      els.lookupError.hidden = false;
    } finally {
      els.lookupSubmitBtn.disabled = false;
      els.lookupSubmitBtn.textContent = 'Load ESV Passage';
    }
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

    // Switch active translation to the one they just pasted
    state.translation = trans;
    savePrefs();
    applyControlStates();

    // If this reference matches an existing verse in our deck, attach this ESV/NIV text to it
    const existing = getAllVerses().find(
      (v) => v.reference.toLowerCase() === ref.toLowerCase()
    );

    if (existing) {
      if (!state.translationCache[existing.id]) state.translationCache[existing.id] = {};
      state.translationCache[existing.id][trans] = segments;
      saveTranslationCache();
      els.pasteRefInput.value = '';
      els.pasteTextInput.value = '';
      closeCustomModal();
      loadVerse(existing);
      return;
    }

    const parsed = parseBookAndChapter(ref);
    const versePart = ref.includes(':') ? ref.split(':')[1] : '';
    const newVerse = {
      id: `custom-paste-${Date.now()}`,
      reference: ref,
      book: parsed.book,
      chapter: parsed.chapter,
      category: 'Custom',
      isMultiVerse: segments.length > 1 || /[-–,]/.test(versePart),
      isCustom: true,
      translations: {
        [trans]: segments
      }
    };

    state.customVerses.unshift(newVerse);
    saveCustomVerses();
    els.pasteRefInput.value = '';
    els.pasteTextInput.value = '';
    closeCustomModal();
    loadVerse(newVerse);
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

    // Translation banner buttons
    els.bannerApiBtn.addEventListener('click', () => openCustomModal('esv-api', false));
    els.bannerPasteBtn.addEventListener('click', () => openCustomModal('paste', true));

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

    // Custom / ESV API modal
    els.openCustomBtn.addEventListener('click', () => openCustomModal(null, false));
    els.closeCustomBtn.addEventListener('click', closeCustomModal);
    els.cancelLookupBtn.addEventListener('click', closeCustomModal);
    els.cancelPasteBtn.addEventListener('click', closeCustomModal);
    els.customModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.customModalBackdrop) closeCustomModal();
    });
    els.modalTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
    });
    els.saveTokenBtn.addEventListener('click', handleSaveToken);
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

      if (isOverlayOpen()) return;

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
