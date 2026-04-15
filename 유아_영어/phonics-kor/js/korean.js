/* ============================================================
   korean.js — 한국어 음운 분석 유틸리티
   - 초성 / 중성 / 종성 상수
   - 음절 분해 (decompose)
   - 자모 발음 / HTML 빌더
============================================================ */

const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG  = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const CHO_NAME  = {ㄱ:'기역',ㄲ:'쌍기역',ㄴ:'니은',ㄷ:'디귿',ㄸ:'쌍디귿',ㄹ:'리을',ㅁ:'미음',ㅂ:'비읍',ㅃ:'쌍비읍',ㅅ:'시옷',ㅆ:'쌍시옷',ㅇ:'이응',ㅈ:'지읒',ㅉ:'쌍지읒',ㅊ:'치읓',ㅋ:'키읔',ㅌ:'티읕',ㅍ:'피읖',ㅎ:'히읗'};
const JUNG_NAME = {ㅏ:'아',ㅐ:'애',ㅑ:'야',ㅒ:'얘',ㅓ:'어',ㅔ:'에',ㅕ:'여',ㅖ:'예',ㅗ:'오',ㅘ:'와',ㅙ:'왜',ㅚ:'외',ㅛ:'요',ㅜ:'우',ㅝ:'워',ㅞ:'웨',ㅟ:'위',ㅠ:'유',ㅡ:'으',ㅢ:'의',ㅣ:'이'};

/* 한글 음절 → 초/중/종성 분해 */
function decompose(char) {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  const cho  = Math.floor(code / (21 * 28));
  const jung = Math.floor((code % (21 * 28)) / 28);
  const jong = code % 28;
  return { cho: CHO[cho], jung: JUNG[jung], jong: JONG[jong] };
}

/* 음절 인덱스 → 색상 클래스 (sp-0 ~ sp-4 순환) */
function getSyllableClass(idx) { return `sp-${idx % 5}`; }

/* 자모 하나 TTS 발음 */
function speakJamo(jamo, type) {
  if (!jamo) return;
  const name = (type === 'jung')
    ? (JUNG_NAME[jamo] || jamo)
    : (CHO_NAME[jamo]  || jamo);
  speak(name);
}

/* 음절 배열 → 자모 분해 행 HTML */
function buildJamoRowHTML(syllables) {
  if (!syllables || !syllables.length) return '';
  const groups = syllables.map(syl => {
    const d = decompose(syl);
    if (!d) {
      return `<button class="jamo-btn jamo-cho"
                style="background:#f0f0f0;color:#555"
                onclick="event.stopPropagation();speak('${escStr(syl)}')"
                title="클릭하면 발음해요">
                ${syl}
              </button>`;
    }
    const parts = [];
    const addBtn = (char, type, name) => {
      if (parts.length > 0) parts.push('<span class="jamo-plus">+</span>');
      parts.push(`<button class="jamo-btn jamo-${type}"
                          onclick="event.stopPropagation();speakJamo('${char}','${type}')"
                          title="${name} (${type==='cho'?'초성':type==='jung'?'중성':'종성'}) — 클릭하면 발음">
                   ${char}
                   <span class="jamo-name-badge">${name}</span>
                 </button>`);
    };
    addBtn(d.cho,  'cho',  CHO_NAME[d.cho]  || d.cho);
    addBtn(d.jung, 'jung', JUNG_NAME[d.jung] || d.jung);
    if (d.jong) addBtn(d.jong, 'jong', CHO_NAME[d.jong] || d.jong);
    return parts.join('');
  });
  const html = groups.reduce((acc, g, i) => {
    if (i > 0) acc += '<span class="jamo-syl-sep"></span>';
    acc += g;
    return acc;
  }, '');
  return `<div class="jamo-row">${html}</div>`;
}

/* 음절 버튼 행 (고 · 양 · 이) HTML */
function buildSyllableButtonsHTML(syllables) {
  if (!syllables || !syllables.length) return '';
  const colors = ['syl-c0','syl-c1','syl-c2','syl-c3','syl-c4'];
  return syllables.map((syl, i) => {
    const cls = colors[i % 5];
    const safe = escStr(syl);
    return `${i > 0 ? '<span class="syl-plus">+</span>' : ''}
      <button class="syl-btn ${cls}" id="syl-btn-${i}"
              onclick="speakSyllableBtn('${safe}', ${i})"
              title="${syl} — 클릭하면 발음해요">
        ${syl}
      </button>`;
  }).join('');
}

/* 음절 버튼 클릭 → TTS + 애니메이션 */
async function speakSyllableBtn(syl, idx) {
  const btn = document.getElementById(`syl-btn-${idx}`);
  if (btn) {
    btn.classList.add('playing');
    await speak(syl);
    btn.classList.remove('playing');
  } else {
    speak(syl);
  }
}

/* 같은 음절 / 같은 초성을 가진 단어 검색 */
function getRelatedWords(syllable, excludeId) {
  const same = [], sameCho = [];
  const decomp = decompose(syllable);
  getAllWords().forEach(w => {
    if (w.id === excludeId) return;
    const cat = WORD_DATA.categories.find(c => c.words.some(x => x.id === w.id));
    if (w.syllables.includes(syllable)) {
      same.push({ w, cat });
    } else if (decomp && w.syllables.some(s => {
      const d = decompose(s);
      return d && d.cho === decomp.cho;
    })) {
      sameCho.push({ w, cat });
    }
  });
  return { same, sameCho };
}
