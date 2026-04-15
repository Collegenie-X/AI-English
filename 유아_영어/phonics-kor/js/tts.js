/* ============================================================
   tts.js — TTS 엔진 / 음성 설정
   - 언어 감지 (한국어 / 영어 자동)
   - speak(), speakSentence(), speakCard()
   - voiceSettings 관리
============================================================ */

let koreanVoice = null;
let currentLang = 'ko'; // 'ko' | 'en'
let koVoices    = [];
let enVoices    = [];

let voiceSettings = {
  rate:          0.82,
  pitch:         1.1,
  volume:        1.0,
  voiceIdx:      -1,   // -1 = 자동
  wordGap:       1200,
  readSentences: false
};

/* 현재 언어 음성 목록 반환 */
function getVoices()   { return currentLang === 'en' ? enVoices : koVoices; }
function getLangCode() { return currentLang === 'en' ? 'en-US'  : 'ko-KR'; }

/* JSON 데이터 → 언어 감지 */
function detectLang(data) {
  if (data.lang) return data.lang.toLowerCase().startsWith('en') ? 'en' : 'ko';
  if (data.title && !/[가-힣]/.test(data.title)) return 'en';
  const firstWord = data.categories?.[0]?.words?.[0]?.word || '';
  return /[가-힣]/.test(firstWord) ? 'ko' : 'en';
}

/* 한/영 UI 텍스트 선택 헬퍼 */
function t(ko, en) { return currentLang === 'en' ? en : ko; }

/* 음성 목록 로드 (voiceschanged 이벤트 후 재호출) */
function loadVoicesEnhanced() {
  const all = speechSynthesis.getVoices();
  koVoices = all.filter(v => v.lang.startsWith('ko'));
  enVoices = all.filter(v => v.lang.startsWith('en'));
  koreanVoice = koVoices[0] || all.find(v => v.lang === 'ko-KR') || null;
  refreshVoiceSelect();
}

/* 호환성 유지용 빈 래퍼 */
function loadVoices() { /* loadVoicesEnhanced가 처리 */ }

/* ============================================================
   핵심 TTS 함수
============================================================ */
function speak(text, rateOverride = null) {
  if (!window.speechSynthesis) return Promise.resolve();
  return new Promise(resolve => {
    speechSynthesis.cancel();
    const utt    = new SpeechSynthesisUtterance(text);
    const voices = getVoices();
    const selIdx = voiceSettings.voiceIdx;
    utt.lang   = getLangCode();
    utt.rate   = rateOverride !== null ? rateOverride : voiceSettings.rate;
    utt.pitch  = voiceSettings.pitch;
    utt.volume = voiceSettings.volume;
    if (selIdx >= 0 && voices[selIdx]) {
      utt.voice = voices[selIdx];
    } else if (voices.length > 0) {
      utt.voice = voices[0];
    }
    utt.onend  = resolve;
    utt.onerror = resolve;
    speechSynthesis.speak(utt);
  });
}

/* 카드 클릭 → TTS + 들음 표시 */
function speakCard(id) {
  const w = getAllWords().find(w => w.id === id);
  if (!w) return;
  document.querySelectorAll('.word-card.playing').forEach(el => el.classList.remove('playing'));
  const card = document.getElementById(`wcard-${id}`);
  if (card) {
    card.classList.add('playing');
    speak(w.word).then(() => {
      if (card) card.classList.remove('playing');
      markListened(id);
    });
  }
}

/* 예문 TTS */
async function speakSentence(text, el) {
  if (el) {
    document.querySelectorAll('.card-sentence').forEach(e => e.style.fontWeight = '');
    el.style.fontWeight = '900';
    el.style.background = '#E3F2FD';
  }
  await speak(text, 0.78);
  if (el) { el.style.fontWeight = ''; el.style.background = ''; }
}

/* 퀴즈 선택지 TTS */
async function speakChoiceWord(word, idx) {
  const btn = document.getElementById(`csb-${idx}`);
  if (btn) {
    btn.classList.add('speaking');
    await speak(word, 0.82);
    btn.classList.remove('speaking');
  } else {
    speak(word, 0.82);
  }
}

/* 듣기모드 예문 TTS */
async function speakListenSentence(text, idx) {
  document.querySelectorAll('.listen-sentence-chip').forEach(el => el.classList.remove('playing'));
  const chip = document.getElementById(`lsc-${idx}`);
  if (chip) chip.classList.add('playing');
  await speak(text, 0.78);
  if (chip) chip.classList.remove('playing');
}

/* 퀴즈 정답/오답 음성 피드백 */
function speakQuizFeedback(isCorrect, streak, correctWord) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const isEn = currentLang === 'en';
  setTimeout(() => {
    if (isCorrect) {
      const msgs = isEn
        ? ['Correct! Great job!', 'Excellent! Well done!', 'Amazing! That\'s right!', 'Perfect answer!']
        : ['정답이에요! 잘했어요!', '훌륭해요! 맞았어요!', '대단해요! 정답입니다!', '완벽해요! 정답이에요!'];
      const comboMsgs = isEn
        ? ['Wow! On a roll!', '3 in a row! Fantastic!', 'Keep it up! Incredible!']
        : ['와! 연속 정답이에요! 대단해요!', '세 개 연속 정답! 최고예요!', '계속 정답이에요! 잘하고 있어요!'];
      const msg = (streak && streak >= 3)
        ? comboMsgs[Math.min(streak - 3, comboMsgs.length - 1)]
        : msgs[Math.floor(Math.random() * msgs.length)];
      speak(msg, 0.9);
      showVoiceFeedbackToast('🎉 ' + msg, 'correct-toast');
    } else {
      const wrongMsg   = isEn ? 'Not quite! Try again!' : '틀렸습니다. 다시 한번 들어보세요.';
      const wrongToast = isEn ? '❌ Wrong!' : '❌ 틀렸습니다!';
      speak(wrongMsg, 0.9);
      showVoiceFeedbackToast(wrongToast, 'wrong-toast');
      if (correctWord) {
        const answerMsg = isEn ? `The answer is ${correctWord}` : `정답은 ${correctWord} 입니다`;
        setTimeout(() => speak(answerMsg, 0.85), 1800);
      }
    }
  }, 400);
}

/* 음성 피드백 토스트 */
function showVoiceFeedbackToast(msg, cls) {
  const t = document.getElementById('voice-feedback-toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `voice-feedback-toast ${cls} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ============================================================
   설정 모달
============================================================ */
function openSettings() {
  const ovl = document.getElementById('settings-overlay');
  if (!ovl) return;
  refreshVoiceSelect();
  syncSettingsUI();
  ovl.classList.add('open');
}

function closeSettings() {
  const ovl = document.getElementById('settings-overlay');
  if (ovl) ovl.classList.remove('open');
}

function refreshVoiceSelect() {
  const sel = document.getElementById('vs-voice-select');
  if (!sel) return;
  const prev   = voiceSettings.voiceIdx;
  const voices = getVoices();
  const langLabel = currentLang === 'en' ? '영어 기본 (en-US)' : '한국어 기본 (ko-KR)';
  sel.innerHTML = `<option value="-1">🤖 자동 (${langLabel})</option>` +
    voices.map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`).join('');
  sel.value = (prev >= -1 && prev < voices.length) ? prev : -1;

  const badge = document.getElementById('vs-lang-badge');
  if (badge) {
    badge.textContent = currentLang === 'en' ? '🇺🇸 English' : '🇰🇷 한국어';
    badge.style.background = currentLang === 'en' ? '#1976D2' : '#E53935';
  }
  const previewBtn = document.getElementById('vs-preview-btn');
  if (previewBtn) previewBtn.textContent = currentLang === 'en' ? '🔊 Preview' : '🔊 미리 듣기';
}

function syncSettingsUI() {
  setSliderVal('vs-rate',   voiceSettings.rate,    v => v.toFixed(2) + 'x');
  setSliderVal('vs-pitch',  voiceSettings.pitch,   v => parseFloat(v).toFixed(1));
  setSliderVal('vs-volume', voiceSettings.volume,  v => Math.round(v * 100) + '%');
  setSliderVal('vs-gap',    voiceSettings.wordGap, v => (v / 1000).toFixed(1) + '초');
  const sel = document.getElementById('vs-voice-select');
  if (sel) sel.value = voiceSettings.voiceIdx;
  const tog = document.getElementById('vs-read-sentences');
  if (tog) tog.checked = voiceSettings.readSentences;
  updatePresetBtns();
  _syncSpeedBtns(voiceSettings.wordGap);
  state.listen.speed = voiceSettings.wordGap;
}

function setSliderVal(id, val, fmt) {
  const el = document.getElementById(id);
  if (el) el.value = val;
  const chip = document.getElementById(id + '-val');
  if (chip && fmt) chip.textContent = fmt(val);
}

function onSliderChange(id, setter, fmt) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = parseFloat(el.value);
  setter(v);
  const chip = document.getElementById(id + '-val');
  if (chip) chip.textContent = fmt(v);
  updatePresetBtns();
}

function updatePresetBtns() {
  const presets = [
    { id:'preset-child',  rate:0.65, pitch:1.3 },
    { id:'preset-normal', rate:0.82, pitch:1.1 },
    { id:'preset-fast',   rate:1.1,  pitch:1.0 }
  ];
  presets.forEach(p => {
    const btn = document.getElementById(p.id);
    if (!btn) return;
    const match = Math.abs(voiceSettings.rate - p.rate) < 0.05
               && Math.abs(voiceSettings.pitch - p.pitch) < 0.1;
    btn.classList.toggle('active', match);
  });
}

function applyPreset(rate, pitch, label) {
  voiceSettings.rate  = rate;
  voiceSettings.pitch = pitch;
  syncSettingsUI();
  previewVoice();
}

function onVoiceSelectChange() {
  const sel = document.getElementById('vs-voice-select');
  if (sel) voiceSettings.voiceIdx = parseInt(sel.value);
  previewVoice();
}

function onToggleSentences() {
  const tog = document.getElementById('vs-read-sentences');
  if (tog) voiceSettings.readSentences = tog.checked;
}

function previewVoice() {
  const text = currentLang === 'en' ? 'Hello! Can you hear me clearly?' : '안녕하세요! 잘 들려요?';
  speak(text);
}

function _syncSpeedBtns(gap) {
  document.querySelectorAll('.speed-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.speed) === gap);
  });
}
