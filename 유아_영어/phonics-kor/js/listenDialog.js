/* ============================================================
   listenDialog.js — 단어 듣기 다이얼로그 (wv-overlay)

   핵심 기능:
   1. openWvDialog(wordId, catId)  — 카드 클릭으로 다이얼로그 열기
   2. openListenDialog()           — 듣기 탭에서 직접 열기
   3. closeWvDialog()              — 닫기 (선택된 카테고리 복원)
   4. updateListenDisplay()        — 현재 단어 화면 업데이트 + TTS
   5. listenNext/Prev/Repeat()     — 이동 컨트롤
   6. toggleAutoPlay()             — 자동재생 토글
   7. startAutoPlay/stopAutoPlay() — 자동재생 ON/OFF
   8. setSpeed(s)                  — 단어 간격(ms) 설정
============================================================ */

/* 카드 클릭 → 해당 카테고리 단어들로 다이얼로그 열기 */
function openWvDialog(wordId, catId) {
  stopAllPlayback();
  const cat = WORD_DATA.categories.find(c => c.id === catId);
  if (!cat) return;

  /* 복원용 저장 후 해당 카테고리로 임시 전환 */
  state._prevSelectedCats = [...state.selectedCats];
  state.selectedCats      = [catId];
  state.catId             = catId;

  const wordIdx = cat.words.findIndex(w => w.id === wordId);
  state.listen.idx = wordIdx >= 0 ? wordIdx : 0;

  const info = document.getElementById('wv-dialog-cat-info');
  if (info) {
    info.textContent = `${cat.icon} ${cat.name}  ·  ${cat.words.length}단어`;
    info.style.color = cat.color;
  }

  document.getElementById('wv-overlay').classList.add('open');
  stopAutoPlay();
  updateListenDisplay();
}

/* 듣기 탭에서 직접 열기 */
function openListenDialog() {
  if (!WORD_DATA || !state.selectedCats.length) return;
  state.listen.idx = 0;
  const cat  = getCat(state.catId);
  const info = document.getElementById('wv-dialog-cat-info');
  if (info && cat) {
    info.textContent = `${cat.icon} ${cat.name}  ·  ${getSelectedWords().length}단어`;
    info.style.color = cat.color;
  }
  document.getElementById('wv-overlay').classList.add('open');
  stopAutoPlay();
  updateListenDisplay();
}

/* 다이얼로그 닫기 */
function closeWvDialog() {
  document.getElementById('wv-overlay').classList.remove('open');
  stopAutoPlay();
  if (window.speechSynthesis) speechSynthesis.cancel();
  /* 카드 클릭으로 열었을 때 selectedCats 복원 */
  if (state._prevSelectedCats) {
    state.selectedCats = state._prevSelectedCats;
    delete state._prevSelectedCats;
    renderCategoryNav();
  }
}

function wvOverlayClick(e) {
  if (e.target === document.getElementById('wv-overlay')) closeWvDialog();
}

/* ── 현재 단어 화면 업데이트 ── */
function updateListenDisplay() {
  const words = getSelectedWords();
  if (!words.length) return;
  const idx = state.listen.idx % words.length;
  const w   = words[idx];
  const cat = findCatByWordId(w.id) || getCat();

  document.getElementById('listen-img-wrap').style.background = cat.gradient;

  const emojiEl = document.getElementById('listen-emoji');
  emojiEl.innerHTML = w.emoji;
  emojiEl.style.opacity = '1';
  applyTwemoji(emojiEl);

  const photoEl = document.getElementById('listen-photo');
  photoEl.className = 'listen-photo';
  loadCoverPhoto(photoEl, emojiEl, w.imgQuery);

  document.getElementById('listen-word').textContent    = w.word;
  document.getElementById('listen-hint').textContent    = w.hint;

  /* 음절 버튼 행 */
  document.getElementById('listen-syllables').innerHTML =
    buildSyllableButtonsHTML(w.syllables);

  /* 예문 */
  document.getElementById('listen-sentences').innerHTML =
    (w.sentences || []).map((s, i) => `
      <div class="listen-sentence-chip" id="lsc-${i}"
           onclick="speakListenSentence('${escStr(s)}',${i})">
        <span class="s-icon">💬</span>${s}
      </div>`).join('');

  /* 진행 바 */
  const total = words.length, cur = idx + 1;
  document.getElementById('listen-progress-text').textContent = `${cur} / ${total}`;
  const bar = document.getElementById('listen-progress-bar');
  if (bar) {
    bar.style.width      = `${(cur / total) * 100}%`;
    bar.style.background = cat.gradient;
  }

  speak(w.word).then(showAudioWave);
  showAudioWave();
}

/* 오디오 웨이브 표시 */
function showAudioWave() {
  const wave = document.getElementById('audio-wave');
  if (!wave) return;
  wave.classList.remove('hidden');
  clearTimeout(wave._t);
  wave._t = setTimeout(() => wave.classList.add('hidden'), 2400);
}

/* ── 이동 컨트롤 ── */
function listenNext() {
  const ws = getSelectedWords();
  state.listen.idx = (state.listen.idx + 1) % ws.length;
  updateListenDisplay();
}

function listenPrev() {
  const ws = getSelectedWords();
  state.listen.idx = (state.listen.idx - 1 + ws.length) % ws.length;
  updateListenDisplay();
}

function listenRepeat() {
  const ws = getSelectedWords();
  const w  = ws[state.listen.idx % ws.length];
  speak(w.word);
  showAudioWave();
}

/* ── 자동재생 ── */
function toggleAutoPlay() {
  state.listen.playing ? stopAutoPlay() : startAutoPlay();
}

function startAutoPlay() {
  state.listen.playing = true;
  const btn = document.getElementById('autoplay-btn');
  if (btn) { btn.textContent = '⏸️ 일시정지'; btn.className = 'btn btn-red'; }
  function go() {
    if (!state.listen.playing) return;
    const gap = voiceSettings.wordGap || 1200;
    listenNext();
    state.listen.timer = setTimeout(go, gap);
  }
  const initGap = voiceSettings.wordGap || 1200;
  state.listen.timer = setTimeout(go, initGap);
}

function stopAutoPlay() {
  state.listen.playing = false;
  clearTimeout(state.listen.timer);
  const btn = document.getElementById('autoplay-btn');
  if (btn) { btn.textContent = '▶️ 자동재생'; btn.className = 'btn btn-green'; }
}

/* ── 재생 속도 설정 ── */
function setSpeed(s) {
  state.listen.speed    = s;
  voiceSettings.wordGap = s;
  const sl   = document.getElementById('vs-gap');
  const chip = document.getElementById('vs-gap-val');
  if (sl)   sl.value     = s;
  if (chip) chip.textContent = (s / 1000).toFixed(1) + '초';
  _syncSpeedBtns(s);
}
