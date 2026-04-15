'use client'

import type { KoWordItem } from '@/types/content'

// ── Hangul decomposition tables ───────────────────────────────────────────────
const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const CHO_NAME:  Record<string,string> = {ㄱ:'기역',ㄲ:'쌍기역',ㄴ:'니은',ㄷ:'디귿',ㄸ:'쌍디귿',ㄹ:'리을',ㅁ:'미음',ㅂ:'비읍',ㅃ:'쌍비읍',ㅅ:'시옷',ㅆ:'쌍시옷',ㅇ:'이응',ㅈ:'지읒',ㅉ:'쌍지읒',ㅊ:'치읓',ㅋ:'키읔',ㅌ:'티읕',ㅍ:'피읖',ㅎ:'히읗'}
const JUNG_NAME: Record<string,string> = {ㅏ:'아',ㅐ:'애',ㅑ:'야',ㅒ:'얘',ㅓ:'어',ㅔ:'에',ㅕ:'여',ㅖ:'예',ㅗ:'오',ㅘ:'와',ㅙ:'왜',ㅚ:'외',ㅛ:'요',ㅜ:'우',ㅝ:'워',ㅞ:'웨',ㅟ:'위',ㅠ:'유',ㅡ:'으',ㅢ:'의',ㅣ:'이'}

// ── Syllable gradient styles (matches SYL_COLORS in LearnDialog) ──────────────
const SYL_GRAD = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
]

function decompose(char: string) {
  const code = char.charCodeAt(0) - 0xAC00
  if (code < 0 || code > 11171) return null
  const cho  = Math.floor(code / (21 * 28))
  const jung = Math.floor((code % (21 * 28)) / 28)
  const jong = code % 28
  return { cho: CHO[cho], jung: JUNG[jung], jong: JONG[jong] }
}

function speakSyl(s: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(s + '.')
  u.lang = 'ko-KR'; u.rate = 0.65; u.pitch = 1.1
  window.speechSynthesis.speak(u)
}

export interface WordWithCat {
  word: KoWordItem
  catColor: string
}

interface KoPhonicsDialogProps {
  syllable:  string
  sylIdx:    number
  excludeId: string    // current word id — exclude from "same syllable" list
  allWords:  WordWithCat[]
  onClose:   () => void
}

export function KoPhonicsDialog({ syllable, sylIdx, excludeId, allWords, onClose }: KoPhonicsDialogProps) {
  const grad   = SYL_GRAD[sylIdx % SYL_GRAD.length]
  const decomp = decompose(syllable)

  // Find words containing this syllable (excluding the current word)
  const same = allWords.filter(wc =>
    wc.word.id !== excludeId && Array.from(wc.word.word).includes(syllable)
  )

  // Find words starting with same 초성 (excluding already shown + current)
  const shownIds = new Set([excludeId, ...same.map(wc => wc.word.id)])
  const sameCho = decomp
    ? allWords.filter(wc => {
        if (shownIds.has(wc.word.id)) return false
        const first = wc.word.word[0]
        const d = decompose(first)
        return d?.cho === decomp.cho
      })
    : []

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={`'${syllable}' 음운 분석`}
      style={{ zIndex: 1100 }}
    >
      <div
        className="dialog-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#EDE7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>abc</div>
            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#2d3748' }}>
              &apos;{syllable}&apos; 음운 분석
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666' }}
            aria-label="닫기"
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Hero syllable */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '5rem', fontWeight: 900, lineHeight: 1.1,
              background: grad,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
            }}>
              {syllable}
            </div>
            <button
              onClick={() => speakSyl(syllable)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
              aria-label="발음 듣기"
            >🔊</button>
          </div>

          {/* Decomposition: 초성 + 중성 (+ 종성) */}
          {decomp && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* 초성 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', marginBottom: '5px' }}>초성</div>
                <button
                  onClick={() => speakSyl(CHO_NAME[decomp.cho] ?? decomp.cho)}
                  style={{ width: 70, height: 70, borderRadius: '16px', background: '#EDE7F6', border: '2px solid #d1c4e9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.1s, box-shadow 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px #d1c4e9' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                  aria-label={`초성 ${CHO_NAME[decomp.cho] ?? decomp.cho} 발음 듣기`}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5e35b1' }}>{decomp.cho}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9575cd' }}>{CHO_NAME[decomp.cho] ?? decomp.cho}</span>
                </button>
              </div>

              <span style={{ fontSize: '1.5rem', color: '#ccc', fontWeight: 300, marginTop: '16px' }}>+</span>

              {/* 중성 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', marginBottom: '5px' }}>중성</div>
                <button
                  onClick={() => speakSyl(JUNG_NAME[decomp.jung] ?? decomp.jung)}
                  style={{ width: 70, height: 70, borderRadius: '16px', background: '#E8F5E9', border: '2px solid #c8e6c9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.1s, box-shadow 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px #c8e6c9' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                  aria-label={`중성 ${JUNG_NAME[decomp.jung] ?? decomp.jung} 발음 듣기`}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2e7d32' }}>{decomp.jung}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#43a047' }}>{JUNG_NAME[decomp.jung] ?? decomp.jung}</span>
                </button>
              </div>

              {/* 종성 (if present) */}
              {decomp.jong && (
                <>
                  <span style={{ fontSize: '1.5rem', color: '#ccc', fontWeight: 300, marginTop: '16px' }}>+</span>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', marginBottom: '5px' }}>종성</div>
                    <button
                      onClick={() => speakSyl(CHO_NAME[decomp.jong] ?? decomp.jong)}
                      style={{ width: 70, height: 70, borderRadius: '16px', background: '#FFF3E0', border: '2px solid #ffe0b2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.1s, box-shadow 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px #ffe0b2' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                      aria-label={`종성 ${CHO_NAME[decomp.jong] ?? decomp.jong} 발음 듣기`}
                    >
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e65100' }}>{decomp.jong}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fb8c00' }}>{CHO_NAME[decomp.jong] ?? decomp.jong}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Same syllable words */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#4527A0' }}>🔍 같은 음절</span>
              <span style={{ background: '#EDE7F6', color: '#4527A0', borderRadius: '10px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                &apos;{syllable}&apos; 포함 단어
              </span>
            </div>
            {same.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {same.map(wc => (
                  <WordChip key={wc.word.id} wc={wc} />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 600, padding: '8px 0' }}>같은 음절 단어가 없어요</p>
            )}
          </div>

          {/* Same 초성 words */}
          {decomp && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1B5E20' }}>🅰️ 같은 초성</span>
                <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: '10px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  &apos;{decomp.cho}&apos; 으로 시작하는 단어
                </span>
              </div>
              {sameCho.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {sameCho.map(wc => (
                    <WordChip key={wc.word.id} wc={wc} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 600, padding: '8px 0' }}>같은 초성 단어가 없어요</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WordChip({ wc }: { wc: WordWithCat }) {
  const speakWord = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(wc.word.word)
    u.lang = 'ko-KR'; u.rate = 0.82
    window.speechSynthesis.speak(u)
  }
  return (
    <button
      onClick={speakWord}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '6px 12px', borderRadius: '20px',
        background: wc.catColor + '18', border: `1.5px solid ${wc.catColor}55`,
        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, color: '#333',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = wc.catColor + '30')}
      onMouseLeave={e => (e.currentTarget.style.background = wc.catColor + '18')}
    >
      <span style={{ fontSize: '1.1rem' }}>{wc.word.emoji}</span>
      {wc.word.word}
    </button>
  )
}
