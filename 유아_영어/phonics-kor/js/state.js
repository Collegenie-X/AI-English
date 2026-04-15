/* ============================================================
   state.js — 앱 전역 상태 + 공통 헬퍼
============================================================ */

/* ── 콘텐츠 데이터 (JSON에서 로드) ── */
let WORD_DATA = null;

/* ── 앱 상태 ── */
let state = {
  mode: 'learn',
  catId: '',
  selectedCats: [],
  listen: {
    idx: 0,
    playing: false,
    speed: 1200,
    timer: null
  },
  quiz: {
    words: [], idx: 0, score: 0, answered: false, started: false,
    streak: 0, maxStreak: 0, countdownTimer: null,
    quizType: 'multiple',   // 'multiple' | 'typing'
    hintUsed: false,
    pool: [],
    totalCount: 10
  }
};

/* ── 들음 추적 맵 (catId → Set<wordId>) ── */
let listenedMap = {};

/* ── 아코디언 상태 (catId → bool) ── */
let accordionState = {};

/* ============================================================
   공통 데이터 헬퍼
============================================================ */

/* 카테고리 ID로 찾기 */
function getCat(id) {
  return WORD_DATA.categories.find(c => c.id === (id || state.catId));
}

/* 전체 단어 배열 */
function getAllWords() {
  return WORD_DATA.categories.flatMap(c => c.words);
}

/* 선택된 카테고리 배열 */
function getSelectedCats() {
  if (!state.selectedCats.length) return [];
  return state.selectedCats
    .map(id => WORD_DATA.categories.find(c => c.id === id))
    .filter(Boolean);
}

/* 선택 카테고리의 단어 합집합 */
function getSelectedWords() {
  const cats = getSelectedCats();
  return cats.length ? cats.flatMap(c => c.words) : (getCat() ? getCat().words : []);
}

/* 단어 ID로 소속 카테고리 찾기 */
function findCatByWordId(wordId) {
  return WORD_DATA.categories.find(c => c.words.some(w => w.id === wordId));
}

/* ============================================================
   학습 진도 추적
============================================================ */

function markListened(wordId) {
  const cat   = findCatByWordId(wordId);
  const catId = cat ? cat.id : state.catId;
  if (!listenedMap[catId]) listenedMap[catId] = new Set();
  if (!listenedMap[catId].has(wordId)) {
    listenedMap[catId].add(wordId);
    const card = document.getElementById(`wcard-${wordId}`);
    if (card) card.classList.add('listened');
    updateLearnProgress();
    renderCategoryNav();
  }
}

function resetListened() {
  listenedMap[state.catId] = new Set();
  renderLearnMode();
  renderCategoryNav();
}

function updateLearnProgress() {
  const cats  = getSelectedCats();
  let total = 0, done = 0;
  cats.forEach(cat => {
    total += cat.words.length;
    const lMap = listenedMap[cat.id] || new Set();
    done  += lMap.size;
  });
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const label = document.getElementById('learn-progress-label');
  const fill  = document.getElementById('learn-progress-fill');
  if (label) label.textContent = `${done} / ${total} 들음`;
  const cat = getCat();
  if (fill) {
    fill.style.width      = pct + '%';
    fill.style.background = cat ? cat.gradient : '#4CAF50';
  }
}

/* ============================================================
   범용 유틸
============================================================ */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escStr(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
