/* ============================================================
   categoryFilter.js — 카테고리 선택 필터 UI

   핵심 기능:
   1. renderCategoryNav()        — 카테고리 pill 버튼 렌더링
   2. toggleCategory(catId)      — 단일 카테고리 선택/해제
   3. toggleAllCategories()      — 전체 선택 / 전체 해제
   4. resetCategorySelection()   — 첫 번째 카테고리로 초기화
   5. toggleFilterSection()      — 필터 패널 접기/펼치기
============================================================ */

/* 카테고리 알약 버튼 + 헤더 뱃지 렌더링 */
function renderCategoryNav() {
  if (!WORD_DATA) return;
  const allSelected = WORD_DATA.categories.every(c => state.selectedCats.includes(c.id));
  const selCount    = state.selectedCats.length;

  /* 선택된 카테고리의 총 문장 수 계산 */
  const totalSent = getSelectedCats().reduce((acc, cat) =>
    acc + cat.words.reduce((a, w) => a + (w.sentences ? w.sentences.length : 0), 0), 0);

  /* 헤더 뱃지 업데이트 */
  const badge = document.getElementById('filter-sel-badge');
  if (badge) badge.textContent = selCount + '개 선택';

  /* 문장 예정 텍스트 업데이트 */
  const sentPrev = document.getElementById('filter-sent-preview');
  if (sentPrev) sentPrev.textContent = totalSent + '문장 재생 예정';

  /* 전체선택 버튼 상태 업데이트 */
  const allBtn = document.getElementById('filter-all-btn');
  if (allBtn) {
    allBtn.classList.toggle('all-selected', allSelected);
    allBtn.textContent = allSelected ? '❎ 전체 해제' : '✅ 전체 선택';
  }

  /* 카테고리 pill 버튼 렌더링 */
  const nav = document.getElementById('category-nav');
  if (!nav) return;
  nav.innerHTML = WORD_DATA.categories.map(c => {
    const isActive = state.selectedCats.includes(c.id);
    const lMap     = listenedMap[c.id] || new Set();
    const pct      = c.words.length ? Math.round((lMap.size / c.words.length) * 100) : 0;
    return `
    <button class="cat-btn ${isActive ? 'active' : ''}"
            style="${isActive ? `background:${c.gradient};border-color:transparent;color:white` : ''}"
            onclick="toggleCategory('${c.id}')"
            title="${c.name} — ${c.words.length}단어 | Lv.${c.level || 1}">
      ${c.icon} ${c.name}
      <span class="cat-level-badge" style="${isActive ? 'background:rgba(255,255,255,0.25);color:white' : ''}">Lv.${c.level || 1}</span>
      <span class="cat-count-pip"   style="${isActive ? 'background:rgba(255,255,255,0.2);color:white'  : ''}">
        ${pct > 0 ? pct + '%' : c.words.length}
      </span>
    </button>`;
  }).join('');
}

/* 필터 섹션 접기/펼치기 */
function toggleFilterSection() {
  const sec = document.getElementById('filter-section');
  if (sec) sec.classList.toggle('collapsed');
}

/* 초기화: 첫 번째 카테고리만 선택 */
function resetCategorySelection() {
  if (!WORD_DATA) return;
  const first = WORD_DATA.categories[0];
  state.selectedCats = first ? [first.id] : [];
  state.catId        = first ? first.id   : '';
  WORD_DATA.categories.forEach((c, i) => { accordionState[c.id] = (i === 0); });
  state.listen.idx = 0;
  renderCategoryNav();
  if (state.mode === 'learn') renderLearnMode();
  if (state.mode === 'quiz')  { state.quiz.started = false; renderQuizMode(); }
}

/* 전체 주제 선택/해제 토글 */
function toggleAllCategories() {
  if (!WORD_DATA) return;
  const allSelected = WORD_DATA.categories.every(c => state.selectedCats.includes(c.id));
  if (allSelected) {
    /* 전체 해제 → 첫 번째 카테고리만 */
    const first = WORD_DATA.categories[0];
    state.selectedCats = first ? [first.id] : [];
    state.catId        = first ? first.id   : '';
    WORD_DATA.categories.forEach((c, i) => { accordionState[c.id] = (i === 0); });
  } else {
    /* 전체 선택 → 아코디언 모두 열기 */
    state.selectedCats = WORD_DATA.categories.map(c => c.id);
    state.catId        = WORD_DATA.categories[WORD_DATA.categories.length - 1].id;
    WORD_DATA.categories.forEach(c => { accordionState[c.id] = true; });
  }
  state.listen.idx = 0;
  renderCategoryNav();
  if (state.mode === 'learn') renderLearnMode();
  if (state.mode === 'quiz')  { state.quiz.started = false; renderQuizMode(); }
}

/* 단일 카테고리 토글 */
function toggleCategory(catId) {
  const idx = state.selectedCats.indexOf(catId);
  if (idx !== -1) {
    state.selectedCats.splice(idx, 1);
    accordionState[catId] = false;
  } else {
    state.selectedCats.push(catId);
    accordionState[catId] = true;
  }
  /* catId를 마지막 선택된 것으로 업데이트 */
  state.catId = state.selectedCats.length > 0
    ? state.selectedCats[state.selectedCats.length - 1]
    : catId;
  state.listen.idx = 0;
  renderCategoryNav();
  if (state.mode === 'learn') renderLearnMode();
  if (state.mode === 'quiz')  { state.quiz.started = false; renderQuizMode(); }
}
