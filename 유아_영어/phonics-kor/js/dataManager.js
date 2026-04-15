/* ============================================================
   dataManager.js — JSON 콘텐츠 관리

   핵심 기능:
   1. autoFetch() — 같은 디렉토리의 JSON 자동 로드 (HTTP 환경)
   2. handleJsonFile() — 파일 업로드(드래그앤드롭) 처리
   3. enrichWords() — syllables / imgQuery / hint 자동 생성
   4. onDataLoaded() — 데이터 로드 완료 후 앱 초기화

   ★ JSON 파일만 교체하면 앱 전체가 즉시 반영됩니다.
============================================================ */

/* ──────────────────────────────────────────
   자동 로드 대상 파일 목록
   우선순위: 맨 앞 파일부터 시도
   ────────────────────────────────────────── */
const AUTO_LOAD_CANDIDATES = [
  '한글_단어_유아.json',
  '영어_단어_데이터.json',
  'data.json',
  'words.json'
];

/* ──────────────────────────────────────────
   단어 데이터 보강 (computed fields)

   JSON에 없는 필드를 자동 생성:
   - syllables : 한글 단어를 음절(글자) 단위로 분해
                 "강아지" → ["강","아","지"]
   - imgQuery  : Unsplash 검색어 (영문 meaning 우선)
   - hint      : 첫 번째 예문 또는 meaning 사용
   ────────────────────────────────────────── */
function enrichWords(data) {
  data.categories.forEach(cat => {
    cat.words.forEach(word => {
      /* syllables — 이미 있으면 유지 */
      if (!word.syllables || !word.syllables.length) {
        // 한글/영어 모두 지원: 각 글자를 음절로 처리
        word.syllables = [...word.word];
      }
      /* imgQuery — Unsplash 검색에 쓸 키워드 */
      if (!word.imgQuery) {
        word.imgQuery = word.meaning || word.word;
      }
      /* hint — 카드에 표시되는 힌트 문구 */
      if (word.hint === undefined || word.hint === null) {
        word.hint = word.sentences?.[0] || word.meaning || '';
      }
    });
  });
  return data;
}

/* ──────────────────────────────────────────
   HTTP 환경에서 JSON 자동 로드
   - fetch 실패 시 파일 업로드 UI 표시
   ────────────────────────────────────────── */
async function autoFetch() {
  for (const path of AUTO_LOAD_CANDIDATES) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.categories && data.categories.length) {
        WORD_DATA = enrichWords(data);
        onDataLoaded(path);
        return true;
      }
    } catch (e) { /* 파일 없음 또는 file:// 프로토콜 */ }
  }
  return false;
}

/* ──────────────────────────────────────────
   파일 업로드 / 드래그앤드롭 처리
   ────────────────────────────────────────── */
function handleJsonFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.json')) {
    alert('❌ JSON 파일만 업로드할 수 있어요!\n파일 확장자가 .json 이어야 합니다.');
    return;
  }
  if (file.size === 0) {
    alert('❌ 파일이 비어있어요! (0 bytes)\n올바른 JSON 파일을 선택해 주세요.');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => alert('❌ 파일 읽기 오류가 발생했어요. 다시 시도해 주세요.');
  reader.onload = (e) => {
    const rawText = e.target.result;
    if (!rawText || rawText.trim() === '') {
      alert('❌ 파일 내용이 비어있어요.');
      return;
    }
    try {
      const cleanText = rawText.replace(/^\uFEFF/, ''); // BOM 제거
      const data = JSON.parse(cleanText);
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error('categories 배열이 없습니다.\n올바른 단어 데이터 JSON 형식인지 확인해 주세요.');
      }
      if (data.categories.length === 0) {
        throw new Error('categories 배열이 비어있습니다.');
      }
      WORD_DATA = enrichWords(data);
      _resetAppState();
      stopPlayAll();
      onDataLoaded(file.name);
    } catch (err) {
      alert('❌ JSON 파싱 오류\n\n' + err.message +
            '\n\n파일명: ' + file.name +
            '\n파일크기: ' + file.size.toLocaleString() + ' bytes');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function _resetAppState() {
  const firstId = WORD_DATA.categories[0]?.id || '';
  state.selectedCats      = firstId ? [firstId] : [];
  state.catId             = firstId;
  state.listen.idx        = 0;
  state.quiz.started      = false;
  listenedMap             = {};
}

/* ──────────────────────────────────────────
   데이터 로드 완료 → 앱 초기화
   ────────────────────────────────────────── */
function onDataLoaded(filename) {
  /* 업로드 UI 상태 업데이트 */
  const totalWords = WORD_DATA.categories.reduce((s, c) => s + c.words.length, 0);
  const status     = document.getElementById('json-loaded-status');
  if (status) {
    status.innerHTML = `<span class="json-loaded-badge">✅ ${filename} (${WORD_DATA.categories.length}주제 · ${totalWords}단어)</span>`;
  }
  const dz = document.getElementById('json-dropzone');
  if (dz) { dz.style.display = 'none'; dz.classList.remove('update-mode'); }
  const sec = document.getElementById('json-upload-section');
  if (sec) sec.classList.add('loaded');
  const updateBtn = document.getElementById('json-update-btn');
  if (updateBtn) updateBtn.style.display = 'flex';

  /* 앱 본체 표시 */
  const app = document.getElementById('app');
  if (app) app.classList.remove('not-loaded');

  /* 언어 감지 → 음성 초기화 */
  currentLang = detectLang(WORD_DATA);
  voiceSettings.voiceIdx = -1;

  /* 헤더 뱃지 업데이트 */
  const badges = document.querySelector('.word-count-badges');
  if (badges) {
    const langBadge = currentLang === 'en'
      ? '<span class="badge" style="background:linear-gradient(135deg,#1565C0,#1976D2);color:white">🇺🇸 English</span>'
      : '<span class="badge" style="background:linear-gradient(135deg,#B71C1C,#E53935);color:white">🇰🇷 한국어</span>';
    badges.innerHTML = langBadge +
      `<span class="badge badge-green">📚 ${totalWords}${currentLang === 'en' ? ' words' : '단어'}</span>` +
      `<span class="badge badge-blue">🗂️ ${WORD_DATA.categories.length}${currentLang === 'en' ? ' topics' : '개 주제'}</span>` +
      `<span class="badge badge-purple">🔊 ${currentLang === 'en' ? 'Click → Voice!' : '그림 클릭 → 음성!'}</span>`;
  }
  const appTitle = document.getElementById('app-title');
  if (appTitle && WORD_DATA.title) appTitle.textContent = WORD_DATA.title;
  const settingsTitle = document.getElementById('settings-title');
  if (settingsTitle) settingsTitle.textContent = currentLang === 'en' ? '⚙️ Voice Settings' : '⚙️ 음성 설정';

  /* TTS 초기화 */
  if (window.speechSynthesis) {
    loadVoicesEnhanced();
    speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    speechSynthesis.addEventListener('voiceschanged', loadVoicesEnhanced);
  } else {
    const warn = document.getElementById('tts-warning');
    if (warn) warn.style.display = 'block';
  }

  /* 퍼즐 상태 초기화 */
  if (typeof puzzleState !== 'undefined') {
    puzzleState.catId      = null;
    puzzleState.foundCount = 0;
    puzzleState.difficulty = 'easy';
  }

  /* 카테고리 + 학습모드 렌더링 */
  const firstCat = WORD_DATA.categories[0];
  state.selectedCats = firstCat ? [firstCat.id] : [];
  state.catId        = firstCat ? firstCat.id   : '';
  WORD_DATA.categories.forEach((c, i) => { accordionState[c.id] = (i === 0); });
  renderCategoryNav();
  const learnSec = document.getElementById('learn-mode');
  if (learnSec) learnSec.classList.add('active');
  renderLearnMode();

  /* 설정 오버레이 닫기 이벤트 */
  const ovl = document.getElementById('settings-overlay');
  if (ovl) ovl.addEventListener('click', e => { if (e.target === ovl) closeSettings(); });
}

/* ──────────────────────────────────────────
   업데이트 드롭존 토글 (로드 완료 후 재업로드)
   ────────────────────────────────────────── */
function toggleUpdateDropzone() {
  const dz  = document.getElementById('json-dropzone');
  const btn = document.getElementById('json-update-btn');
  if (!dz) return;
  const isOpen = dz.style.display !== 'none';
  if (isOpen) {
    dz.style.display = 'none';
    dz.classList.remove('update-mode');
    if (btn) btn.textContent = '📂 변경';
  } else {
    dz.style.display = 'block';
    dz.classList.add('update-mode');
    dz.querySelector('.dz-icon').textContent  = '🔄';
    dz.querySelector('.dz-title').textContent = 'JSON 파일을 드래그하거나 클릭하여 업데이트';
    dz.querySelector('.dz-sub').textContent   = '새 파일로 전체 데이터를 교체합니다';
    const inp = document.getElementById('json-file-input');
    if (inp) inp.value = '';
    if (btn) btn.textContent = '✕ 닫기';
    dz.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* ──────────────────────────────────────────
   DOM 준비 → 드래그앤드롭 이벤트 등록 + 자동 로드
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* 드래그앤드롭 */
  const dropzone = document.getElementById('json-dropzone');
  if (dropzone) {
    ['dragenter','dragover'].forEach(ev =>
      dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); })
    );
    ['dragleave','drop'].forEach(ev =>
      dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); })
    );
    dropzone.addEventListener('drop', e => {
      const file = e.dataTransfer.files[0];
      if (file) handleJsonFile(file);
    });
  }

  /* HTTP 환경이면 자동 로드 시도, 실패 시 업로드 UI 유지 */
  if (location.protocol !== 'file:') {
    autoFetch().then(loaded => {
      if (!loaded) {
        const dz = document.getElementById('json-dropzone');
        if (dz) dz.style.display = 'block';
      }
    });
  }
});
