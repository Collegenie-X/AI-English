'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { KoWordItem } from '@/types/content'
import type { VoiceSettings } from '@/hooks/useVoiceSettings'

const SYL_COLORS = [
  { bg: '#7c3aed', text: 'white' },
  { bg: '#ec4899', text: 'white' },
  { bg: '#0ea5e9', text: 'white' },
  { bg: '#10b981', text: 'white' },
  { bg: '#f97316', text: 'white' },
]

interface KoAutoPlayDialogProps {
  words: KoWordItem[]
  catName: string
  catColor: string
  settings: VoiceSettings
  listenedIds: Set<string>
  onListened: (id: string) => void
  onClose: () => void
}

export function KoAutoPlayDialog({
  words, catName, catColor, settings, listenedIds, onListened, onClose,
}: KoAutoPlayDialogProps) {
  const [idx, setIdx]         = useState(0)
  const [playing, setPlaying] = useState(true)
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const item                  = words[idx]

  const speakWord = useCallback((word: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang   = 'ko-KR'
    u.rate   = settings.rate
    u.pitch  = settings.pitch
    u.volume = settings.volume
    if (settings.voiceURI) {
      const v = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI)
      if (v) u.voice = v
    }
    window.speechSynthesis.speak(u)
  }, [settings])

  // Speak on idx change
  useEffect(() => {
    if (!item) return
    speakWord(item.word)
    onListened(item.id)
  }, [idx])

  // Auto-advance
  useEffect(() => {
    if (!playing) return
    timerRef.current = setTimeout(() => {
      if (idx < words.length - 1) {
        setIdx(i => i + 1)
      } else {
        setPlaying(false)
      }
    }, settings.interval + 1200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, idx, words.length, settings.interval])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ')      setPlaying(v => !v)
      if (e.key === 'ArrowLeft')  { clearTimer(); setIdx(i => Math.max(0, i - 1)) }
      if (e.key === 'ArrowRight') { clearTimer(); setIdx(i => Math.min(words.length - 1, i + 1)) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, words.length])

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const handlePrev = () => { clearTimer(); setPlaying(false); setIdx(i => Math.max(0, i - 1)) }
  const handleNext = () => {
    clearTimer()
    if (idx < words.length - 1) setIdx(i => i + 1)
    else setPlaying(false)
  }
  const togglePlay = () => setPlaying(v => !v)

  if (!item) return null

  const syllables = Array.from(item.word)
  const pct = ((idx + 1) / words.length) * 100
  const listenedCount = words.filter(w => listenedIds.has(w.id)).length
  const allDone = idx === words.length - 1 && !playing

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal aria-label="전체 듣기">
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div
          className="dialog-header-gradient"
          style={{ background: `linear-gradient(135deg,${catColor},${catColor}bb)` }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>
              전체 듣기 — {catName}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: 600 }}>
              {listenedCount} / {words.length} 들음
            </span>
          </div>
          <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '5px', background: '#f0f0f0' }}>
          <div style={{ height: '100%', background: catColor, width: `${pct}%`, transition: 'width 0.45s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>

        {/* Current word hero */}
        <div
          style={{
            background: `linear-gradient(160deg,${catColor}22 0%,${catColor}0a 100%)`,
            padding: '28px 24px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          }}
        >
          {/* Playing indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {playing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: catColor, color: 'white', borderRadius: '12px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 800 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                자동재생 중
              </span>
            ) : allDone ? (
              <span style={{ background: '#4caf50', color: 'white', borderRadius: '12px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 800 }}>
                완료 ✓
              </span>
            ) : (
              <span style={{ background: '#f5f5f5', color: '#888', borderRadius: '12px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                일시정지
              </span>
            )}
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888' }}>
              {idx + 1} / {words.length}
            </span>
          </div>

          {/* Emoji card */}
          <div
            onClick={() => { speakWord(item.word); onListened(item.id) }}
            role="button"
            style={{
              background: catColor, borderRadius: '28px',
              width: 130, height: 130,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 32px ${catColor}55`, cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
          >
            <span style={{ fontSize: '72px', lineHeight: 1 }}>{item.emoji}</span>
          </div>

          {/* Word + syllables */}
          <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a1a2e', margin: 0, letterSpacing: '-1px' }}>
            {item.word}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {syllables.map((s, i) => (
              <span
                key={i}
                onClick={() => {
                  window.speechSynthesis.cancel()
                  const u = new SpeechSynthesisUtterance(s)
                  u.lang = 'ko-KR'; u.rate = 0.7; u.pitch = settings.pitch; u.volume = settings.volume
                  window.speechSynthesis.speak(u)
                }}
                style={{
                  background: SYL_COLORS[i % SYL_COLORS.length].bg,
                  color: SYL_COLORS[i % SYL_COLORS.length].text,
                  padding: '8px 14px', borderRadius: '14px',
                  fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#777', background: '#f3f4f6', borderRadius: '10px', padding: '4px 12px' }}>
            {item.meaning}
          </span>
        </div>

        {/* Controls */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Play/pause + nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={handlePrev} disabled={idx === 0}
              style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid #e0e0e0', background: idx === 0 ? '#f5f5f5' : 'white', color: idx === 0 ? '#ccc' : '#333', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: idx === 0 ? 'none' : '0 2px 8px rgba(0,0,0,0.08)' }}
              aria-label="이전"
            >◀</button>

            <button
              onClick={togglePlay}
              style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', background: catColor, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${catColor}66`, transition: 'transform 0.15s' }}
              aria-label={playing ? '일시정지' : '재생'}
            >
              {playing ? '⏸' : '▶'}
            </button>

            <button
              onClick={handleNext} disabled={idx === words.length - 1}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: idx === words.length - 1 ? '#f5f5f5' : catColor, color: idx === words.length - 1 ? '#ccc' : 'white', cursor: idx === words.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: idx === words.length - 1 ? 'none' : `0 4px 14px ${catColor}55` }}
              aria-label="다음"
            >▶</button>
          </div>

          {/* Word list (mini) */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', maxHeight: '96px', overflowY: 'auto', padding: '4px 0' }}>
            {words.map((w, i) => (
              <button
                key={w.id}
                onClick={() => { clearTimer(); setPlaying(false); setIdx(i) }}
                style={{
                  padding: '3px 10px', borderRadius: '14px', border: '1.5px solid',
                  borderColor: i === idx ? catColor : listenedIds.has(w.id) ? catColor + '66' : '#e0e0e0',
                  background: i === idx ? catColor : listenedIds.has(w.id) ? catColor + '18' : 'white',
                  color: i === idx ? 'white' : listenedIds.has(w.id) ? catColor : '#888',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {w.word}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
