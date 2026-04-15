/* ============================================================
   app.js — 앱 진입점 + 전역 상태 + 모드 전환

   핵심 기능:
   1. switchMode(mode)     — 모드 탭 전환 (learn / quiz / puzzle)
   2. startPlayAll()       — 전체 듣기 다이얼로그 열기
   3. puzzleState 선언     — 퍼즐 전역 상태
   4. DOMContentLoaded     — 키보드 단축키 등록
============================================================ */

/* ── 퍼즐 전역 상태 ── */
let puzzleState = {
  catId:         null,
  difficulty:    'easy',
  targetWords:   [],
  allPlaced:     [],
  gridSize:      4,
  grid:          [],
  selectedStart: null,
  foundCount:    0,
  hintTimeout:   null,
  scatteredMode: false,
  wordProgress:  {},
  cellOwner:     {},
  currentRound:  1,
  totalRounds:   5,
  usedWordIds:   new Set(),
  allFoundWords: [],
  roundTimer:    null
};

/* ── 모드 전환 ── */
function switchMode(mode) {
  stopPlayAll();
  stopAutoPlay();
  if (window.speechSynthesis) speechSynthesis.cancel();
  closePhonicsModal();
  if (state.quiz.countdownTimer) {
    clearInterval(state.quiz.countdownTimer);
    state.quiz.countdownTimer = null;
  }

  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mode-section').forEach(s => s.classList.remove('active'));

  const btn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
  const sec = document.getElementById(`${mode}-mode`);
  if (btn) btn.classList.add('active');
  if (sec) sec.classList.add('active');

  state.mode = mode;
  if (mode === 'learn') renderLearnMode();
  if (mode === 'quiz')  { state.quiz.started = false; renderQuizMode(); }
}

/* 전체 듣기 다이얼로그 열기 (Space / Enter 단축키용) */
function startPlayAll() {
  if (!WORD_DATA || !state.selectedCats.length) return;
  state.listen.idx = 0;
  const cat  = getCat(state.catId);
  const info = document.getElementById('wv-dialog-cat-info');
  if (info && cat) {
    info.textContent = `${cat.icon} ${cat.name}  ·  ${getSelectedWords().length}단어`;
    info.style.color = cat.color;
  }
  document.getElementById('wv-overlay').classList.add('open');
  updateListenDisplay();
  startAutoPlay();
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  /* 키보드 단축키 */
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.getElementById('settings-overlay')?.classList.contains('open')) return;
    if (document.getElementById('phonics-overlay')?.classList.contains('open')) return;

    const wvOpen = document.getElementById('wv-overlay')?.classList.contains('open');

    /* 다이얼로그 열려있을 때 */
    if (wvOpen) {
      if (e.key === 'Escape') {
        e.preventDefault(); closeWvDialog();
      } else if (e.key === ' ') {
        e.preventDefault(); toggleAutoPlay();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault(); stopAutoPlay(); listenNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); stopAutoPlay(); listenPrev();
      }
      return;
    }

    /* 학습모드 + 다이얼로그 닫혀있을 때 */
    const learnSec = document.getElementById('learn-mode');
    if (!learnSec || !learnSec.classList.contains('active')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); startPlayAll();
    }
  });
});
