/* ============================================================
   learnMode.js — 학습 모드 카드 그리드 + 아코디언

   핵심 기능:
   1. renderLearnMode()            — 카드 그리드 전체 렌더링
   2. toggleCatAccordion(catId)    — 개별 카테고리 접기/펼치기
   3. expandAllAccordion()         — 전체 펼치기
   4. collapseAllAccordion()       — 전체 접기
   5. toggleAllAccordion()         — 한 번에 토글
   6. updateMasterAccordionBtn()   — 마스터 버튼 텍스트 동기화
   7. catPlayStart(catId)          — 섹션 "▶ 전체 듣기" 진입점
============================================================ */

function renderLearnMode() {
  stopPlayAll();
  const grid = document.getElementById('learn-grid');
  if (!WORD_DATA || !grid) return;

  const cats = getSelectedCats();

  if (!cats.length) {
    grid.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#888;font-size:1.1em;">
      <div style="font-size:2.5em;margin-bottom:12px;">📚</div>
      <div>상단에서 주제를 선택하면 단어가 표시됩니다.</div>
    </div>`;
    return;
  }

  grid.innerHTML = cats.map(cat => {
    const lMap     = listenedMap[cat.id] || new Set();
    const heard    = lMap.size;
    const total    = cat.words.length;
    const pct      = total ? Math.round((heard / total) * 100) : 0;
    const isOpen   = accordionState[cat.id] !== false; // 기본값: 열림
    const totalSent= cat.words.reduce((acc, w) => acc + (w.sentences ? w.sentences.length : 0), 0);

    const cardsHtml = cat.words.map(w => {
      const isHeard = lMap.has(w.id);
      return `
      <div class="word-card ${isHeard ? 'listened' : ''}" id="wcard-${w.id}"
           style="border-top:5px solid ${cat.color}; cursor:pointer;"
           onclick="openWvDialog(${w.id},'${cat.id}')"
           title="${w.word} — 클릭하면 상세보기">
        <div class="card-img-area" style="background:${cat.gradient}">
          <div class="card-emoji-wrap" id="ce-${w.id}">${w.emoji}</div>
          <img class="card-photo" id="cp-${w.id}"
               src="${unsplashUrl(w.imgQuery)}" alt="${w.word}" loading="lazy">
          <div class="card-img-speaker">🔊</div>
          <div class="card-cat-tag" style="background:${cat.color}cc">${cat.icon} ${cat.name}</div>
          ${!isHeard ? `<div class="card-level-coin" style="background:${cat.color}">Lv.${cat.level || 1}</div>` : ''}
        </div>
        <div class="card-body">
          <div class="card-word">${w.word}</div>
          <div class="card-syllables">
            ${w.syllables.map((s, i) =>
              `<span class="syllable-pill ${getSyllableClass(i)}"
                     onclick="event.stopPropagation();openPhonicsModal('${escStr(s)}',${i},${w.id})"
                     title="음운 확장">${s}</span>`
            ).join('')}
          </div>
          <div class="card-hint">${w.hint}</div>
          <div class="card-sentences">
            ${(w.sentences || []).map(s =>
              `<div class="card-sentence"
                    onclick="event.stopPropagation();speakSentence('${escStr(s)}',this)">
                <span class="s-icon">💬</span>${s}
              </div>`
            ).join('')}
          </div>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="cat-group ${isOpen ? 'open' : ''}" id="acc-group-${cat.id}">
      <div class="accordion-header" style="background:${cat.gradient}"
           onclick="toggleCatAccordion('${cat.id}')">
        <div class="acc-icon-wrap">${cat.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="acc-name">${cat.name}</span>
            <span class="acc-lv-pill">Lv.${cat.level || 1}</span>
            <span class="acc-cnt-pill">단어 ${heard}/${total}개</span>
            <span class="acc-sent-pill">문장 ${totalSent}개</span>
            ${pct > 0 ? `<span class="acc-progress-text">${pct}%</span>` : ''}
          </div>
          <div class="acc-progress-bar-wrap">
            <div class="acc-progress-bar-fill" id="acc-pbar-${cat.id}" style="width:${pct}%"></div>
          </div>
        </div>
        <span class="acc-toggle-icon" id="acc-icon-${cat.id}">▼</span>
      </div>
      <!-- 섹션별 재생 컨트롤 바 -->
      <div class="cat-play-bar">
        <button class="cat-play-btn cpb-play"
                onclick="event.stopPropagation();catPlayStart('${cat.id}')">
          ▶ 전체 듣기
        </button>
        <span class="cat-play-count">${total}단어</span>
      </div>
      <div class="cat-words-body" id="acc-body-${cat.id}">
        <div class="word-cards-grid">${cardsHtml}</div>
      </div>
    </div>`;
  }).join('');

  /* 이미지 & Twemoji 처리 */
  cats.forEach(cat => {
    cat.words.forEach(w => {
      const ew = document.getElementById('ce-' + w.id);
      const ph = document.getElementById('cp-' + w.id);
      if (ew) applyTwemoji(ew);
      if (ph) {
        ph.onload  = () => { ph.classList.add('loaded'); if (ew) ew.style.opacity = '0.2'; };
        ph.onerror = () => { ph.style.display = 'none'; };
      }
    });
  });

  updateMasterAccordionBtn();
  updateLearnProgress();
}

/* ── 아코디언 토글 ── */
function toggleCatAccordion(catId) {
  const group = document.getElementById('acc-group-' + catId);
  if (!group) return;
  const isOpen = group.classList.contains('open');
  accordionState[catId] = !isOpen;
  group.classList.toggle('open', !isOpen);
  updateMasterAccordionBtn();
}

function expandAllAccordion() {
  if (!WORD_DATA) return;
  WORD_DATA.categories.forEach(c => {
    accordionState[c.id] = true;
    const g = document.getElementById('acc-group-' + c.id);
    if (g) g.classList.add('open');
  });
  updateMasterAccordionBtn();
}

function collapseAllAccordion() {
  if (!WORD_DATA) return;
  WORD_DATA.categories.forEach(c => {
    accordionState[c.id] = false;
    const g = document.getElementById('acc-group-' + c.id);
    if (g) g.classList.remove('open');
  });
  updateMasterAccordionBtn();
}

function toggleAllAccordion() {
  if (!WORD_DATA) return;
  const allOpen = WORD_DATA.categories.every(c => accordionState[c.id] !== false);
  if (allOpen) collapseAllAccordion();
  else expandAllAccordion();
}

function updateMasterAccordionBtn() {
  const btn = document.getElementById('master-accordion-btn');
  if (!btn || !WORD_DATA) return;
  const allOpen = WORD_DATA.categories.every(c => {
    const g = document.getElementById('acc-group-' + c.id);
    return g ? g.classList.contains('open') : false;
  });
  btn.textContent = allOpen ? '📁 전체 접기' : '📂 전체 펼치기';
  btn.classList.toggle('all-open', allOpen);
}

/* ── 섹션 "▶ 전체 듣기" — wv-overlay 다이얼로그로 위임 ── */
function catPlayStart(catId) {
  const cat = WORD_DATA && WORD_DATA.categories.find(c => c.id === catId);
  if (!cat) return;
  stopAllPlayback();
  state._prevSelectedCats = [...state.selectedCats];
  state.selectedCats = [catId];
  state.catId        = catId;
  state.listen.idx   = 0;
  const info = document.getElementById('wv-dialog-cat-info');
  if (info) {
    info.textContent = `${cat.icon} ${cat.name}  ·  ${cat.words.length}단어`;
    info.style.color = cat.color;
  }
  document.getElementById('wv-overlay').classList.add('open');
  updateListenDisplay();
  startAutoPlay();
}

/* 모든 재생을 중단하는 마스터 함수 */
function stopAllPlayback() {
  stopAutoPlay();
  if (window.speechSynthesis) speechSynthesis.cancel();
}

/* 전체 재생 중단 (레거시 alias) */
function stopPlayAll() {
  stopAllPlayback();
}
