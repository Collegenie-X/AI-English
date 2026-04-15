'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

// ── Syllable color sets ───────────────────────────────────────────────────────
const SYL_COLORS = [
  { bg: '#7c3aed', text: 'white' },
  { bg: '#ec4899', text: 'white' },
  { bg: '#0ea5e9', text: 'white' },
  { bg: '#10b981', text: 'white' },
  { bg: '#f97316', text: 'white' },
]

interface KoLearnDialogProps {
  words: KoWordItem[]
  initialWord?: KoWordItem
  catName: string
  catColor: string
  onClose: () => void
}

export function KoLearnDialog({ words, initialWord, catName, catColor, onClose }: KoLearnDialogProps) {
  const initialIdx = initialWord ? Math.max(0, words.findIndex(w => w.id === initialWord.id)) : 0
  const [idx, setIdx] = useState(initialIdx)
  const [autoPlay, setAutoPlay] = useState(false)
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { speak, speaking } = useTTS()

  const item = words[idx] ?? words[0]
  if (!item) return null

  const syllables = Array.from(item.word)

  const playWord = useCallback(() => {
    speak(item.word, 'ko-KR', 0.85)
  }, [item, speak])

  // Auto-play on idx change
  useEffect(() => {
    const t = setTimeout(playWord, 280)
    return () => clearTimeout(t)
  }, [idx])

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay) return
    // Wait for TTS to finish + pause, then advance
    autoRef.current = setTimeout(() => {
      if (idx < words.length - 1) {
        setIdx(i => i + 1)
      } else {
        setAutoPlay(false)
      }
    }, 2400)
    return () => { if (autoRef.current) clearTimeout(autoRef.current) }
  }, [autoPlay, idx, words.length])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(words.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, words.length])

  const playSyllable = (s: string, i: number) => {
    setPlayingIdx(i)
    speak(s, 'ko-KR', 1.0)
    setTimeout(() => setPlayingIdx(null), 700)
  }

  const handlePrev = () => { setAutoPlay(false); setIdx(i => Math.max(0, i - 1)) }
  const handleNext = () => { setAutoPlay(false); setIdx(i => Math.min(words.length - 1, i + 1)) }

  const pct = ((idx + 1) / words.length) * 100

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal aria-label={`${item.word} 학습`}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>

        {/* ── Colored gradient header ── */}
        <div
          className="dialog-header-gradient"
          style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}bb)` }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>
              {catName}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600 }}>
              {item.word} · {item.meaning}
            </span>
          </div>
          <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ height: '5px', background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: catColor, width: `${pct}%`, transition: 'width 0.45s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>

        {/* ── Big emoji hero ── */}
        <div
          style={{
            background: `linear-gradient(160deg, ${catColor}22 0%, ${catColor}11 100%)`,
            padding: '32px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Emoji on colored card */}
          <div
            style={{
              background: catColor,
              borderRadius: '28px',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px ${catColor}55`,
              cursor: 'pointer',
              transition: 'transform 0.15s',
              userSelect: 'none',
            }}
            onClick={playWord}
            role="button"
            aria-label={`${item.word} 듣기`}
          >
            <span style={{ fontSize: '76px', lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.15))' }}>
              {item.emoji}
            </span>
          </div>

          {/* Word */}
          <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-1px', margin: 0 }}>
            {item.word}
          </p>

          {/* Audio wave */}
          <div className={`audio-wave ${speaking ? '' : 'paused'}`} style={{ height: '28px' }}>
            {[10, 18, 26, 20, 14, 20, 26].map((h, i) => (
              <div key={i} className="wave-bar" style={{ background: catColor, height: `${h}px` }} />
            ))}
          </div>
        </div>

        {/* ── Syllable blocks ── */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {syllables.map((s, i) => {
              const sc = SYL_COLORS[i % SYL_COLORS.length]
              const isPlaying = playingIdx === i
              return (
                <button
                  key={i}
                  onClick={() => playSyllable(s, i)}
                  className={`syl-block${isPlaying ? ' playing' : ''}`}
                  style={{ background: sc.bg, color: sc.text, minWidth: '56px', borderRadius: '16px', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '12px 16px', fontSize: '1.65rem', fontWeight: 900, boxShadow: `0 4px 16px rgba(0,0,0,0.18)`, transition: 'transform 0.15s, filter 0.15s' }}
                  aria-label={`${s} 발음`}
                >
                  {s}
                  <span className="syl-block-label" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', display: 'block' }}>
                    {i === 0 ? '초성' : i === syllables.length - 1 ? '종성' : '중성'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Meaning chip */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 16px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: '0.88rem' }}>
              뜻: {item.meaning}
            </span>
          </div>

          {/* ── Example sentences ── */}
          {item.sentences?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>예문</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {item.sentences.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => speak(s, 'ko-KR', 0.85)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: `${catColor}0f`,
                      border: `1.5px solid ${catColor}22`,
                      borderRadius: '14px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      width: '100%',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${catColor}22`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${catColor}0f`)}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0, color: catColor }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <polygon points="3,8 3,16 7,16 13,21 13,3 7,8" />
                        <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', flex: 1 }}>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Auto-play + Re-listen ── */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAutoPlay(v => !v)}
              style={{
                flex: 1,
                padding: '11px',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: autoPlay ? `linear-gradient(135deg,${catColor},${catColor}bb)` : '#f0f2f5',
                color: autoPlay ? 'white' : '#666',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: autoPlay ? `0 4px 16px ${catColor}44` : 'none',
              }}
            >
              {autoPlay ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  자동재생 중
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>
                  자동재생
                </>
              )}
            </button>
            <button
              onClick={playWord}
              style={{
                flex: 1,
                padding: '11px',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: '#e8f5e9',
                color: '#2e7d32',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="3,8 3,16 7,16 13,21 13,3 7,8" />
                <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              다시듣기
            </button>
          </div>

          {/* ── Prev / Next nav ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={handlePrev}
              disabled={idx === 0}
              style={{
                width: '44px', height: '44px',
                border: '2px solid #e0e0e0',
                borderRadius: '50%',
                background: idx === 0 ? '#f5f5f5' : 'white',
                color: idx === 0 ? '#ccc' : '#333',
                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', transition: 'all 0.15s',
                boxShadow: idx === 0 ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
              }}
              aria-label="이전"
            >
              ◀
            </button>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#888', minWidth: '60px', textAlign: 'center' }}>
              {idx + 1} / {words.length}
            </span>
            <button
              onClick={handleNext}
              disabled={idx === words.length - 1}
              style={{
                width: '44px', height: '44px',
                border: 'none',
                borderRadius: '50%',
                background: idx === words.length - 1 ? '#f5f5f5' : catColor,
                color: idx === words.length - 1 ? '#ccc' : 'white',
                cursor: idx === words.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', transition: 'all 0.15s',
                boxShadow: idx === words.length - 1 ? 'none' : `0 4px 14px ${catColor}55`,
              }}
              aria-label="다음"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
