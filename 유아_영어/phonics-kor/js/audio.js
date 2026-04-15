/* ============================================================
   audio.js — 효과음 / 컨페티 / 이미지 헬퍼
============================================================ */

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTones(freqs, dur = 0.35) {
  try {
    const ctx = getAudioCtx();
    freqs.forEach(({ f, t }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.22, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });
  } catch(e) {}
}

function playCorrectSound() { playTones([{f:523,t:0},{f:659,t:0.12},{f:784,t:0.24}]); }
function playWrongSound()   { playTones([{f:350,t:0},{f:250,t:0.2}], 0.3); }

/* 컨페티 애니메이션 */
function showConfetti(count = 40) {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  const colors = ['#FF6B6B','#FFE66D','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#DDA0DD','#90EE90'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left:${Math.random()*100}vw;top:-10px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;
      border-radius:${Math.random()>.5?'50%':'3px'};
      animation-duration:${Math.random()*2+2}s;
      animation-delay:${Math.random()*.8}s;`;
    container.appendChild(p);
  }
  setTimeout(() => { if (container) container.innerHTML = ''; }, 5000);
}

/* 이모지 Twemoji SVG 변환 */
function applyTwemoji(el) {
  if (window.twemoji) twemoji.parse(el, { folder:'svg', ext:'.svg' });
}

/* Unsplash 이미지 URL 생성 */
function unsplashUrl(q) { return `https://source.unsplash.com/400x400/?${encodeURIComponent(q)}`; }

/* 커버 사진 로딩 — 실패 시 이모지 fallback */
function loadCoverPhoto(photoEl, emojiWrapEl, query) {
  if (!photoEl || !query) return;
  photoEl.src = unsplashUrl(query);
  photoEl.onload  = () => { photoEl.classList.add('loaded'); if (emojiWrapEl) emojiWrapEl.style.opacity='0.2'; };
  photoEl.onerror = () => { photoEl.style.display='none'; if (emojiWrapEl) emojiWrapEl.style.opacity='1'; };
}
