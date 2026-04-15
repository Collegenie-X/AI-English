/* ============================================================
   quizMode.js — 퀴즈 다이얼로그 (객관식 + 주관식)

   핵심 기능:
   1. openQuizDialog()             — 퀴즈 다이얼로그 열기 + 시작
   2. closeQuizDialog()            — 닫기
   3. setQuizType(type)            — 'multiple' | 'typing' 전환
   4. renderCurrentQuizQuestion()  — 현재 타입에 맞게 렌더링
   5. qdlgChoiceClicked()          — 객관식 선택 처리
   6. typingSubmit()               — 주관식 답안 확인
   7. renderQuizDialogResult()     — 결과 화면
   8. quizApplyCorrectEffects()    — 정답 이펙트 (공통)
   9. quizApplyWrongEffects()      — 오답 이펙트 (공통)
============================================================ */

/* ── 열기 ── */
function openQuizDialog() {
  if (!WORD_DATA) return;

  /* 모든 재생 완전 중단 */
  stopAutoPlay();
  if (window.speechSynthesis) speechSynthesis.cancel();
  const wvOv = document.getElementById('wv-overlay');
  if (wvOv && wvOv.classList.contains('open')) {
    wvOv.classList.remove('open');
    if (state._prevSelectedCats) {
      state.selectedCats = state._prevSelectedCats;
      delete state._prevSelectedCats;
    }
  }
  if (state.quiz.countdownTimer) {
    clearInterval(state.quiz.countdownTimer);
    state.quiz.countdownTimer = null;
  }
  document.querySelectorAll('.word-card.playing,.word-card.focused,.word-card.reading-highlight')
    .forEach(el => el.classList.remove('playing', 'focused', 'reading-highlight'));

  const cats = getSelectedCats();
  const pool = cats.length ? cats.flatMap(c => c.words) : getAllWords();
  if (!pool.length) { alert('단어가 없어요! 주제를 선택해주세요.'); return; }

  const catNames = cats.length ? cats.map(c => c.icon + ' ' + c.name).join(', ') : '전체';
  document.getElementById('qdlg-title').textContent = `🎯 ${catNames}`;

  state.quiz.pool       = shuffle([...pool]);
  state.quiz.totalCount = Math.min(state.quiz.totalCount || 10, pool.length);
  state.quiz.words      = state.quiz.pool.slice(0, state.quiz.totalCount);
  state.quiz.idx        = 0;
  state.quiz.score      = 0;
  state.quiz.answered   = false;
  state.quiz.started    = true;
  state.quiz.streak     = 0;
  state.quiz.maxStreak  = 0;

  document.querySelectorAll('.quiz-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === state.quiz.quizType);
  });

  document.getElementById('quiz-dialog-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  _initQuizCountSlider(pool.length);
  renderCurrentQuizQuestion();
}

/* ── 닫기 ── */
function closeQuizDialog() {
  document.getElementById('quiz-dialog-overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (state.quiz.countdownTimer) {
    clearInterval(state.quiz.countdownTimer);
    state.quiz.countdownTimer = null;
  }
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const learnBtn = document.querySelector('.mode-btn[data-mode="learn"]');
  if (state.mode === 'learn' && learnBtn) learnBtn.classList.add('active');
}

function quizOverlayClick(e) {
  if (e.target === document.getElementById('quiz-dialog-overlay')) closeQuizDialog();
}

/* ── 문제 수 슬라이더 ── */
function _initQuizCountSlider(poolSize) {
  const slider = document.getElementById('qdlg-count-slider');
  const valEl  = document.getElementById('qdlg-count-value');
  if (!slider) return;
  const maxQ = Math.min(poolSize, 50);
  slider.max   = maxQ;
  slider.min   = Math.min(3, maxQ);
  slider.value = Math.min(state.quiz.totalCount, maxQ);
  _updateSliderStyle(slider);
  if (valEl) valEl.textContent = slider.value + '문제';
}

function onQuizCountSliderInput(val) {
  const slider = document.getElementById('qdlg-count-slider');
  const valEl  = document.getElementById('qdlg-count-value');
  if (valEl) {
    valEl.textContent = val + '문제';
    valEl.classList.remove('pop');
    void valEl.offsetWidth;
    valEl.classList.add('pop');
    setTimeout(() => valEl.classList.remove('pop'), 320);
  }
  if (slider) _updateSliderStyle(slider);
}

function onQuizCountSliderChange(val) {
  const n = parseInt(val);
  if (!state.quiz.pool || !state.quiz.pool.length) return;
  state.quiz.totalCount = n;
  const newWords = shuffle([...state.quiz.pool]).slice(0, n);
  state.quiz.words    = newWords;
  state.quiz.idx      = 0;
  state.quiz.score    = 0;
  state.quiz.answered = false;
  state.quiz.streak   = 0;
  state.quiz.maxStreak= 0;
  if (state.quiz.countdownTimer) { clearInterval(state.quiz.countdownTimer); state.quiz.countdownTimer = null; }
  const counterChip = document.getElementById('qdlg-counter-chip');
  if (counterChip) counterChip.textContent = `1 / ${n}`;
  renderCurrentQuizQuestion();
}

function _updateSliderStyle(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min) * 100).toFixed(1) + '%';
  slider.style.background = `linear-gradient(90deg,#9C27B0 ${pct},#e0d0f5 ${pct})`;
}

/* ── 퀴즈 타입 전환 ── */
function setQuizType(type) {
  state.quiz.quizType = type;
  document.querySelectorAll('.quiz-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  if (state.quiz.started && state.quiz.words.length) {
    if (state.quiz.countdownTimer) { clearInterval(state.quiz.countdownTimer); state.quiz.countdownTimer = null; }
    state.quiz.answered = false;
    state.quiz.hintUsed = false;
    renderCurrentQuizQuestion();
  }
}

function renderCurrentQuizQuestion() {
  if (state.quiz.quizType === 'typing') renderQuizTypingQuestion();
  else renderQuizDialogQuestion();
}

/* ── 새로고침 ── */
function qdlgRefreshQuiz(btn) {
  if (!state.quiz.pool || !state.quiz.pool.length) return;
  if (btn) {
    btn.classList.remove('spinning');
    void btn.offsetWidth;
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 480);
  }
  if (state.quiz.countdownTimer) { clearInterval(state.quiz.countdownTimer); state.quiz.countdownTimer = null; }
  state.quiz.words    = shuffle([...state.quiz.pool]).slice(0, state.quiz.totalCount);
  state.quiz.idx      = 0;
  state.quiz.score    = 0;
  state.quiz.answered = false;
  state.quiz.streak   = 0;
  state.quiz.maxStreak= 0;
  renderCurrentQuizQuestion();
}

/* ── 객관식 선택지 생성 ── */
function generateChoicesDialog(correct) {
  const selWords = getSelectedWords();
  const pool = shuffle([
    ...selWords.filter(w => w.id !== correct.id),
    ...getAllWords().filter(w => w.id !== correct.id && !selWords.find(x => x.id === w.id))
  ]);
  return shuffle([correct, ...pool.slice(0, 3)]);
}

/* ── 객관식 문제 렌더링 ── */
function renderQuizDialogQuestion() {
  const words = state.quiz.words;
  if (state.quiz.idx >= words.length) { renderQuizDialogResult(); return; }

  const correct = words[state.quiz.idx];
  const cat     = findCatByWordId(correct.id) || getCat();
  const choices = generateChoicesDialog(correct);
  const cur     = state.quiz.idx + 1;
  const total   = words.length;

  const streakHtml = state.quiz.streak >= 2
    ? `<div class="streak-badge combo-pop">🔥 ${state.quiz.streak}연속!</div>`
    : `<div style="width:60px"></div>`;

  document.getElementById('qdlg-quiz-content').innerHTML = `
    <div class="quiz-header-bar">
      <div class="quiz-score-chip" id="qdlg-score-chip">⭐ ${state.quiz.score}점</div>
      <div id="qdlg-streak-wrap">${streakHtml}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="quiz-counter-chip" id="qdlg-counter-chip">${cur} / ${total}</div>
        <button class="quiz-refresh-btn" id="qdlg-refresh-btn" title="🔄 새로고침"
                onclick="qdlgRefreshQuiz(this)">🔄</button>
      </div>
    </div>
    <div class="quiz-progress-label">${cur} / ${total}</div>
    <div class="progress-bar-wrap" style="margin-bottom:14px">
      <div class="progress-bar-fill" style="width:${(cur/total)*100}%;background:${cat.gradient||'#667eea'}"></div>
    </div>
    <div class="quiz-img-wrap" style="background:${cat.gradient||'#667eea'}"
         onclick="speak('${escStr(correct.word)}')" title="🔊 클릭하면 음성이 나와요!">
      <div class="quiz-emoji-wrap" id="qdlg-emoji">${correct.emoji}</div>
      <img class="quiz-photo" id="qdlg-photo" src="${unsplashUrl(correct.imgQuery||correct.word)}" alt="?">
      <div class="quiz-img-overlay">🔊</div>
    </div>
    <div class="quiz-question-label" style="font-size:1.1em;margin:10px 0 12px">이 그림은 무엇일까요?</div>
    <div class="quiz-choices" id="qdlg-choices">
      ${choices.map((w, i) => `
        <button class="choice-btn" id="qdlg-choice-${i}"
                data-correct="${w.id === correct.id}"
                onclick="qdlgChoiceClicked(${i},${w.id},${correct.id},'${escStr(w.word)}')">
          <span class="choice-num">${['①','②','③','④'][i]}</span>
          <span class="choice-word">${w.word}</span>
          <span class="choice-speaker-btn"
                onclick="event.stopPropagation();speak('${escStr(w.word)}')">🔊</span>
        </button>`).join('')}
    </div>
    <div class="quiz-feedback" id="qdlg-feedback"></div>
    <div id="qdlg-next-wrap" style="display:none"></div>`;

  const qEmoji = document.getElementById('qdlg-emoji');
  const qPhoto = document.getElementById('qdlg-photo');
  if (qEmoji) applyTwemoji(qEmoji);
  if (qPhoto) {
    qPhoto.onload  = () => { qPhoto.classList.add('loaded'); if (qEmoji) qEmoji.style.opacity = '0.2'; };
    qPhoto.onerror = () => { qPhoto.style.display = 'none'; };
  }
  setTimeout(() => speak(correct.word), 600);
}

/* ── 객관식 클릭 처리 ── */
function qdlgChoiceClicked(btnIdx, wordId, correctId, wordText) {
  if (state.quiz.answered) return;
  if (!document.getElementById(`qdlg-choice-${btnIdx}`)) return;

  speak(wordText);
  state.quiz.answered = true;
  const isCorrect = (wordId === correctId);

  document.querySelectorAll('#qdlg-choices .choice-btn').forEach((b, i) => {
    b.disabled = true;
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
      b.querySelector('.choice-word').innerHTML += '<span class="choice-icon">✅</span>';
    } else if (i === btnIdx && !isCorrect) {
      b.classList.add('wrong');
      b.querySelector('.choice-word').innerHTML += '<span class="choice-icon">❌</span>';
    } else {
      b.classList.add('faded');
    }
  });

  const fb = document.getElementById('qdlg-feedback');
  if (isCorrect) {
    state.quiz.score++;
    state.quiz.streak = (state.quiz.streak || 0) + 1;
    if (state.quiz.streak > (state.quiz.maxStreak || 0)) state.quiz.maxStreak = state.quiz.streak;
    fb.className = 'quiz-feedback correct bounce-in';
    fb.textContent = '🎉 정답이에요!' + (state.quiz.streak >= 3 ? ` 🔥 ${state.quiz.streak}연속!` : '');
    playCorrectSound();
    quizApplyCorrectEffects(state.quiz.streak);
    speakQuizFeedback(true, state.quiz.streak);
  } else {
    state.quiz.streak = 0;
    fb.className = 'quiz-feedback wrong';
    fb.innerHTML = `❌ 아쉬워요! 정답은 <strong>${state.quiz.words[state.quiz.idx].word}</strong> 이에요.`;
    playWrongSound();
    quizApplyWrongEffects();
    speakQuizFeedback(false, 0, state.quiz.words[state.quiz.idx].word);
  }

  _startQuizCountdown('qdlg-countdown', qdlgNextQuestion);
}

function qdlgNextQuestion() {
  if (state.quiz.countdownTimer) { clearInterval(state.quiz.countdownTimer); state.quiz.countdownTimer = null; }
  state.quiz.idx++;
  state.quiz.answered = false;
  state.quiz.hintUsed = false;
  renderCurrentQuizQuestion();
}

/* ── 주관식 문제 렌더링 ── */
function renderQuizTypingQuestion() {
  const words = state.quiz.words;
  if (state.quiz.idx >= words.length) { renderQuizDialogResult(); return; }

  const correct = words[state.quiz.idx];
  const cat     = findCatByWordId(correct.id) || getCat();
  const cur     = state.quiz.idx + 1;
  const total   = words.length;
  const sylLen  = correct.syllables ? correct.syllables.length : correct.word.length;

  const streakHtml = state.quiz.streak >= 2
    ? `<div class="streak-badge combo-pop">🔥 ${state.quiz.streak}연속!</div>`
    : `<div style="width:60px"></div>`;

  const blanksHtml = Array.from({length: sylLen}, (_, i) =>
    `<div class="typing-blank" id="tblank-${i}">?</div>`
  ).join('');

  document.getElementById('qdlg-quiz-content').innerHTML = `
    <div class="quiz-header-bar">
      <div class="quiz-score-chip" id="qdlg-score-chip">⭐ ${state.quiz.score}점</div>
      <div id="qdlg-streak-wrap">${streakHtml}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="quiz-counter-chip" id="qdlg-counter-chip">${cur} / ${total}</div>
        <button class="quiz-refresh-btn" id="qdlg-refresh-btn" title="🔄 새로고침"
                onclick="qdlgRefreshQuiz(this)">🔄</button>
      </div>
    </div>
    <div class="quiz-progress-label">${cur} / ${total}</div>
    <div class="progress-bar-wrap" style="margin-bottom:14px">
      <div class="progress-bar-fill" style="width:${(cur/total)*100}%;background:${cat.gradient||'#667eea'}"></div>
    </div>
    <div class="quiz-img-wrap" style="background:${cat.gradient||'#667eea'}"
         onclick="speak('${escStr(correct.word)}')" title="🔊 클릭하면 음성이 나와요!">
      <div class="quiz-emoji-wrap" id="qdlg-emoji">${correct.emoji}</div>
      <img class="quiz-photo" id="qdlg-photo" src="${unsplashUrl(correct.imgQuery||correct.word)}" alt="?">
      <div class="quiz-img-overlay">🔊</div>
    </div>
    <div class="quiz-question-label" style="font-size:1.05em;margin:10px 0 12px">
      이 그림의 단어를 입력하세요! (${sylLen}글자)
    </div>
    <div class="typing-quiz-area">
      <div class="typing-hint-row" id="typing-hint-row">${blanksHtml}</div>
      <div class="typing-input-wrap">
        <input type="text" class="typing-input" id="typing-input"
               maxlength="${sylLen}" placeholder="${'_'.repeat(sylLen)}"
               oninput="typingInputChange()"
               onkeydown="typingKeyDown(event)"
               autocomplete="off" autocorrect="off" spellcheck="false">
        <button class="typing-submit-btn" id="typing-submit-btn"
                onclick="typingSubmit()">확인 ✓</button>
      </div>
      <div class="typing-char-count" id="typing-char-count">0 / ${sylLen} 글자</div>
      <button class="typing-hint-btn" id="typing-hint-btn"
              onclick="showTypingHint()">💡 힌트 보기 (첫 글자 공개)</button>
    </div>
    <div class="quiz-feedback" id="qdlg-feedback"></div>
    <div id="qdlg-next-wrap" style="display:none"></div>`;

  const qEmoji = document.getElementById('qdlg-emoji');
  const qPhoto = document.getElementById('qdlg-photo');
  if (qEmoji) applyTwemoji(qEmoji);
  if (qPhoto) {
    qPhoto.onload  = () => { qPhoto.classList.add('loaded'); if (qEmoji) qEmoji.style.opacity = '0.2'; };
    qPhoto.onerror = () => { qPhoto.style.display = 'none'; };
  }
  setTimeout(() => {
    speak(correct.word);
    const inp = document.getElementById('typing-input');
    if (inp) inp.focus();
  }, 600);
}

/* 입력창 변경 → 빈칸 박스 업데이트 */
function typingInputChange() {
  const inp = document.getElementById('typing-input');
  if (!inp) return;
  const val    = inp.value;
  const correct= state.quiz.words[state.quiz.idx];
  const sylLen = correct.syllables ? correct.syllables.length : correct.word.length;
  const cc     = document.getElementById('typing-char-count');
  if (cc) cc.textContent = `${val.length} / ${sylLen} 글자`;
  for (let i = 0; i < sylLen; i++) {
    const blank = document.getElementById(`tblank-${i}`);
    if (!blank) continue;
    blank.textContent = i < val.length ? val[i] : '?';
    blank.className   = 'typing-blank' + (i < val.length ? ' filled' : '');
  }
}

function typingKeyDown(e) { if (e.key === 'Enter') typingSubmit(); }

function typingSubmit() {
  if (state.quiz.answered) return;
  const inp = document.getElementById('typing-input');
  if (!inp) return;
  const answer = inp.value.trim();
  if (!answer) return;

  const correct  = state.quiz.words[state.quiz.idx];
  const isCorrect= (answer === correct.word);
  const sylLen   = correct.syllables ? correct.syllables.length : correct.word.length;

  state.quiz.answered = true;
  inp.disabled = true;
  const submitBtn = document.getElementById('typing-submit-btn');
  if (submitBtn) submitBtn.disabled = true;
  const hintBtn = document.getElementById('typing-hint-btn');
  if (hintBtn) hintBtn.style.display = 'none';

  for (let i = 0; i < sylLen; i++) {
    const blank = document.getElementById(`tblank-${i}`);
    if (!blank) continue;
    if (isCorrect) {
      blank.textContent = correct.word[i] || correct.syllables[i];
      blank.className   = 'typing-blank correct';
    } else {
      const typed       = answer[i] || '';
      const correctChar = correct.word[i] || correct.syllables[i] || '';
      blank.textContent = typed === correctChar ? typed : correctChar;
      blank.className   = 'typing-blank ' + (typed === correctChar ? 'correct' : 'wrong');
    }
  }
  inp.className = 'typing-input ' + (isCorrect ? 'correct-input' : 'wrong-input');

  const fb = document.getElementById('qdlg-feedback');
  if (isCorrect) {
    state.quiz.score++;
    state.quiz.streak = (state.quiz.streak || 0) + 1;
    if (state.quiz.streak > (state.quiz.maxStreak || 0)) state.quiz.maxStreak = state.quiz.streak;
    fb.className = 'quiz-feedback correct bounce-in';
    fb.textContent = '🎉 정답이에요!' + (state.quiz.streak >= 3 ? ` 🔥 ${state.quiz.streak}연속!` : '');
    playCorrectSound();
    quizApplyCorrectEffects(state.quiz.streak);
    speakQuizFeedback(true, state.quiz.streak);
  } else {
    state.quiz.streak = 0;
    fb.className = 'quiz-feedback wrong';
    fb.innerHTML = `❌ 아쉬워요! 정답은 <strong>${correct.word}</strong> 이에요.`;
    playWrongSound();
    quizApplyWrongEffects();
    setTimeout(() => speak(correct.word), 800);
    speakQuizFeedback(false, 0, correct.word);
  }

  _startQuizCountdown('qdlg-countdown', qdlgNextQuestion);
}

function showTypingHint() {
  const correct = state.quiz.words[state.quiz.idx];
  if (!correct || state.quiz.answered) return;
  const firstChar = correct.syllables ? correct.syllables[0] : correct.word[0];
  const inp = document.getElementById('typing-input');
  if (inp && !inp.value) {
    inp.value = firstChar;
    typingInputChange();
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  const hintBtn = document.getElementById('typing-hint-btn');
  if (hintBtn) hintBtn.style.opacity = '0.4';
  speak(firstChar);
  state.quiz.hintUsed = true;
}

function toggleQuizTypeFromResult() {
  const newType = state.quiz.quizType === 'multiple' ? 'typing' : 'multiple';
  setQuizType(newType);
  restartQuizDialog();
}

/* ── 카운트다운 헬퍼 ── */
function _startQuizCountdown(countdownId, onDone) {
  let secs = 5;
  const nw = document.getElementById('qdlg-next-wrap');
  if (nw) {
    nw.style.display = 'block';
    nw.innerHTML = `
      <div style="font-size:0.9em;color:#888;margin-top:8px">
        ⏳ <span id="${countdownId}">${secs}</span>초 후 다음 문제!
        <button class="btn btn-sm btn-purple" style="margin-left:10px"
                onclick="${onDone.name}()">▶ 바로 다음</button>
      </div>
      <div style="margin-top:8px;height:7px;background:#f0f2f5;border-radius:6px;overflow:hidden">
        <div id="qdlg-countdown-bar" style="height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:100%;transition:width 4.85s linear"></div>
      </div>`;
    setTimeout(() => {
      const bar = document.getElementById('qdlg-countdown-bar');
      if (bar) bar.style.width = '0%';
    }, 60);
  }
  if (state.quiz.countdownTimer) clearInterval(state.quiz.countdownTimer);
  state.quiz.countdownTimer = setInterval(() => {
    secs--;
    const cd = document.getElementById(countdownId);
    if (cd) cd.textContent = secs;
    if (secs <= 0) {
      clearInterval(state.quiz.countdownTimer);
      state.quiz.countdownTimer = null;
      onDone();
    }
  }, 1000);
}

/* ── 결과 화면 ── */
function renderQuizDialogResult() {
  const score = state.quiz.score, total = state.quiz.words.length;
  const pct   = Math.round((score / total) * 100);
  const isEn  = currentLang === 'en';
  let emoji, msg, voiceMsg;
  if (pct === 100) {
    emoji    = '🏆';
    msg      = isEn ? 'Perfect! Amazing job! 🎊'       : '완벽해요! 정말 최고에요! 🎊';
    voiceMsg = isEn ? `Perfect score! All ${total} correct!` : `만점입니다! ${total}문제 모두 맞았어요!`;
    showConfetti(60);
  } else if (pct >= 80) {
    emoji    = '🥇';
    msg      = isEn ? 'Great job!'     : '정말 잘했어요!';
    voiceMsg = isEn ? `${score} out of ${total} correct!` : `${total}문제 중 ${score}개 맞았어요!`;
    showConfetti(30);
  } else if (pct >= 60) {
    emoji    = '🥈';
    msg      = isEn ? 'Good try! Keep practicing!' : '잘했어요! 조금 더 연습해요!';
    voiceMsg = isEn ? `${score} out of ${total}!` : `${total}문제 중 ${score}개 맞았어요!`;
  } else {
    emoji    = '🌟';
    msg      = isEn ? 'Try again! You can do it!' : '다시 도전해봐요! 화이팅!';
    voiceMsg = isEn ? `${score} out of ${total}. Try again!` : `${total}문제 중 ${score}개 맞았어요. 다시 도전!`;
  }

  document.getElementById('qdlg-title').textContent = isEn ? '🏆 Quiz Result' : '🏆 퀴즈 결과';
  document.getElementById('qdlg-quiz-content').innerHTML = `
    <div class="quiz-result-screen">
      <div class="big-icon">${emoji}</div>
      <h2 style="font-size:1.8em;color:#2c3e50;margin-bottom:6px">${isEn ? 'Quiz Done!' : '퀴즈 완료!'}</h2>
      <div class="result-score">${score} / ${total}</div>
      <div class="result-message">${msg}</div>
      <div class="result-analysis">
        <label>${isEn ? '📊 Accuracy' : '📊 정답률'}</label>
        <div class="progress-bar-wrap" style="margin-bottom:8px">
          <div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(135deg,#667eea,#764ba2)"></div>
        </div>
        <div style="font-size:.88em;color:#666;margin-bottom:8px">${pct}% — ${score}${isEn ? ' correct' : '개 정답'}</div>
        ${(state.quiz.maxStreak || 0) >= 2
          ? `<div style="font-size:.88em;color:#F57F17">🔥 최고 연속 정답: <strong>${state.quiz.maxStreak}연속!</strong></div>` : ''}
      </div>
      <div class="result-buttons">
        <button class="btn btn-orange" onclick="restartQuizDialog()">🔄 다시 도전</button>
        <button class="btn btn-blue"   onclick="toggleQuizTypeFromResult()">⌨️ 모드 전환</button>
        <button class="btn btn-gray"   onclick="closeQuizDialog()">✕ 닫기</button>
      </div>
    </div>`;

  setTimeout(() => speak(voiceMsg, 0.85), 600);
}

function restartQuizDialog() {
  const cats = getSelectedCats();
  const pool = cats.length ? cats.flatMap(c => c.words) : getAllWords();
  if (!pool.length) { closeQuizDialog(); return; }
  state.quiz.words    = shuffle([...pool]);
  state.quiz.idx      = 0;
  state.quiz.score    = 0;
  state.quiz.answered = false;
  state.quiz.streak   = 0;
  state.quiz.maxStreak= 0;
  state.quiz.hintUsed = false;
  renderCurrentQuizQuestion();
}

/* ── 공통 이펙트 ── */
function _quizGetImgWrap() {
  return document.querySelector('#qdlg-quiz-content .quiz-img-wrap');
}

function quizApplyCorrectEffects(streak) {
  const imgWrap = _quizGetImgWrap();
  if (imgWrap) {
    imgWrap.classList.remove('img-wrong');
    imgWrap.classList.add('img-correct');
    setTimeout(() => imgWrap.classList.remove('img-correct'), 850);
  }
  const scoreChip = document.getElementById('qdlg-score-chip');
  if (scoreChip) {
    scoreChip.textContent = `⭐ ${state.quiz.score}점`;
    scoreChip.classList.remove('score-pop-anim');
    void scoreChip.offsetWidth;
    scoreChip.classList.add('score-pop-anim');
    setTimeout(() => scoreChip.classList.remove('score-pop-anim'), 500);
  }
  const streakWrap = document.getElementById('qdlg-streak-wrap');
  if (streakWrap) {
    streakWrap.innerHTML = streak >= 2
      ? `<div class="streak-badge combo-pop">🔥 ${streak}연속!</div>`
      : `<div style="width:60px"></div>`;
  }
  showConfetti(streak >= 3 ? 40 : 22);
  _quizSpawnScorePopup(streak, imgWrap);
  _quizSpawnStarbursts(streak, imgWrap);
}

function quizApplyWrongEffects() {
  const imgWrap = _quizGetImgWrap();
  if (imgWrap) {
    imgWrap.classList.remove('img-correct');
    imgWrap.classList.add('img-wrong');
    setTimeout(() => imgWrap.classList.remove('img-wrong'), 600);
  }
}

function _quizSpawnScorePopup(streak, imgWrap) {
  const wrap = imgWrap || _quizGetImgWrap();
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const el   = document.createElement('div');
  el.className   = 'score-popup';
  el.textContent = streak >= 3 ? `+${streak}🔥` : '+1⭐';
  el.style.left  = (rect.left + rect.width / 2) + 'px';
  el.style.top   = (rect.top + 20) + 'px';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function _quizSpawnStarbursts(streak, imgWrap) {
  const wrap   = imgWrap || _quizGetImgWrap();
  const emojis = streak >= 5 ? ['🌟','💥','✨','🎊','🎉','🏆']
               : streak >= 3 ? ['⭐','✨','🎉','💫','🔥']
               :               ['⭐','✨','💫'];
  const count  = streak >= 5 ? 7 : streak >= 3 ? 5 : 3;
  const rect   = wrap
    ? wrap.getBoundingClientRect()
    : { left: window.innerWidth/2-95, top: window.innerHeight/2-95, width: 190, height: 190 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  if (streak >= 3) {
    const ring = document.createElement('div');
    ring.className  = 'combo-ring';
    ring.style.left = cx + 'px';
    ring.style.top  = cy + 'px';
    ring.style.borderColor = ['#FFD700','#FF6B6B','#4ECDC4','#A29BFE'][(streak-3) % 4];
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 750);
  }

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const angle = (360 / count) * i + Math.random() * 30;
      const dist  = 60 + Math.random() * 80;
      const rad   = angle * Math.PI / 180;
      const ov    = document.createElement('div');
      ov.className   = 'starburst-overlay';
      ov.textContent = emojis[i % emojis.length];
      ov.style.left  = (cx + Math.cos(rad) * dist) + 'px';
      ov.style.top   = (cy + Math.sin(rad) * dist) + 'px';
      document.body.appendChild(ov);
      setTimeout(() => ov.remove(), 900);
    }, i * 60);
  }
}

/* 퀴즈 모드 엔트리포인트 (switchMode에서 호출) */
function renderQuizMode() { openQuizDialog(); }
