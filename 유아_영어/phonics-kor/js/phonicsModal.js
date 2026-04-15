/* ============================================================
   phonicsModal.js — 음운 분석 모달 (phonics-overlay)

   핵심 기능:
   1. openPhonicsModal(syllable, sylIdx, excludeId) — 열기 + 내용 렌더
   2. closePhonicsModal()                           — 닫기
   3. overlayClickClose(e)                          — 배경 클릭 닫기
   4. showChipPlaying(el)                           — 칩 클릭 피드백
============================================================ */

function openPhonicsModal(syllable, sylIdx, excludeId) {
  speak(syllable);

  const colorStyles = [
    { bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
    { bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
    { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
    { bg: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
    { bg: 'linear-gradient(135deg,#fa709a,#fee140)' },
  ];
  const cs     = colorStyles[sylIdx % 5];
  const decomp = decompose(syllable);

  /* 자모 분해 HTML */
  let decompHTML = '';
  if (decomp) {
    const parts = [
      { char: decomp.cho,  name: CHO_NAME[decomp.cho]  || decomp.cho,  cls: 'jaso-cho',  label: '초성' },
      { char: decomp.jung, name: JUNG_NAME[decomp.jung] || decomp.jung, cls: 'jaso-jung', label: '중성' },
    ];
    if (decomp.jong) {
      parts.push({ char: decomp.jong, name: decomp.jong, cls: 'jaso-jong', label: '종성' });
    }
    decompHTML = parts.map((p, i) => `
      ${i > 0 ? '<span class="phonics-plus">+</span>' : ''}
      <div>
        <div class="phonics-decomp-label">${p.label}</div>
        <div class="phonics-jaso-box ${p.cls}">
          <span class="jaso-char">${p.char}</span>
          <span class="jaso-name">${p.name}</span>
        </div>
      </div>`).join('');
  }

  const { same, sameCho } = getRelatedWords(syllable, excludeId);

  function chipHTML(item) {
    return `<div class="phonics-word-chip"
      style="background:${item.cat.color}18;border-color:${item.cat.color}55;color:#333"
      onclick="speak('${escStr(item.w.word)}');showChipPlaying(this)">
      <span class="chip-emoji">${item.w.emoji}</span>
      <span>${item.w.word}</span>
    </div>`;
  }

  document.getElementById('phonics-content').innerHTML = `
    <div style="text-align:center">
      <div class="phonics-hero-syl"
           style="background:${cs.bg};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
        ${syllable}
      </div>
      <button onclick="speak('${syllable}')"
              style="background:none;border:none;font-size:1.6em;cursor:pointer;margin-bottom:14px"
              title="발음 듣기">🔊</button>
    </div>
    ${decomp ? `<div class="phonics-decomp">${decompHTML}</div>` : ''}
    <div class="phonics-section-title">🔍 같은 음절
      <span style="background:#EDE7F6;color:#4527A0">'${syllable}' 포함 단어</span>
    </div>
    <div class="phonics-related-grid">
      ${same.length ? same.map(chipHTML).join('') : '<span class="phonics-empty">같은 음절 단어가 없어요</span>'}
    </div>
    ${decomp ? `
    <div class="phonics-section-title">🅰️ 같은 초성
      <span style="background:#E8F5E9;color:#1B5E20">'${decomp.cho}' 으로 시작하는 단어</span>
    </div>
    <div class="phonics-related-grid">
      ${sameCho.length ? sameCho.map(chipHTML).join('') : '<span class="phonics-empty">같은 초성 단어가 없어요</span>'}
    </div>` : ''}
  `;

  const hl = document.getElementById('phonics-header-label');
  if (hl) hl.textContent = `'${syllable}' 음운 분석`;

  document.getElementById('phonics-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePhonicsModal() {
  document.getElementById('phonics-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function overlayClickClose(e) {
  if (e.target === document.getElementById('phonics-overlay')) closePhonicsModal();
}

function showChipPlaying(el) {
  el.style.transform = 'scale(1.12)';
  el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
  setTimeout(() => { el.style.transform = ''; el.style.boxShadow = ''; }, 800);
}
