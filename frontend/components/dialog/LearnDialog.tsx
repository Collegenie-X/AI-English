'use client'

import { useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import type { WordItem } from '@/types/content'

const SYL_CLASSES = ['syl-c0', 'syl-c1', 'syl-c2', 'syl-c3', 'syl-c4']
const SYL_COLORS  = ['#7c3aed', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b']

function emojiToTwitterImage(emoji: string): string {
  const codePoints = [...emoji]
    .map(c => c.codePointAt(0)!.toString(16))
    .filter(cp => cp !== 'fe0f') // strip variation selector
    .join('-')
  return `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${codePoints}.svg`
}

interface LearnDialogProps {
  item: WordItem
  color?: string
  onClose: () => void
  onQuiz: () => void
}

export function LearnDialog({ item, color = '#1CB0F6', onClose, onQuiz }: LearnDialogProps) {
  const { speak, speakChunks, speaking } = useTTS()
  const twitterImageUrl = emojiToTwitterImage(item.emoji)

  // Auto-play on open
  useEffect(() => {
    const t = setTimeout(() => speak(item.tts, 'en-US', 0.8), 350)
    return () => clearTimeout(t)
  }, [item, speak])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Darken color for header bottom border
  const darken = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const r = Math.max(0, ((n >> 16) & 0xff) - 40)
    const g = Math.max(0, ((n >> 8) & 0xff) - 40)
    const b = Math.max(0, (n & 0xff) - 40)
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>

        {/* ── Gradient header ── */}
        <div
          className="dialog-header-gradient"
          style={{ background: `linear-gradient(135deg, ${color}, ${darken(color)})` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🇬🇧</span>
            <div className="min-w-0">
              <p className="text-white font-black text-base leading-tight truncate">{item.word}</p>
              {item.hint && (
                <p className="text-white/75 text-xs font-semibold truncate">{item.hint}</p>
              )}
            </div>
          </div>
          <button
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* ── Emoji hero on colored bg ── */}
        <div
          className="relative flex flex-col items-center justify-center pt-6 pb-5"
          style={{ backgroundColor: color + '14' }}
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 65% 65% at 50% 55%, ${color}30 0%, transparent 70%)` }}
          />

          {/* Big Twitter emoji */}
          <div
            className="relative z-10 flex items-center justify-center rounded-3xl mb-4 cursor-pointer"
            style={{
              width: 150, height: 150,
              backgroundColor: color,
              boxShadow: `0 8px 32px ${color}66`,
            }}
            onClick={() => speak(item.tts, 'en-US', 0.8)}
          >
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ background: 'radial-gradient(ellipse 70% 65% at 50% 55%, rgba(255,255,255,0.30) 0%, transparent 72%)' }}
            />
            <img
              src={twitterImageUrl}
              alt={item.word}
              width={100}
              height={100}
              className="relative z-10 object-contain drop-shadow-lg select-none"
              style={{ width: 100, height: 100 }}
              onError={e => {
                e.currentTarget.style.display = 'none'
                const span = document.createElement('span')
                span.textContent = item.emoji
                span.style.fontSize = '72px'
                span.style.lineHeight = '1'
                e.currentTarget.parentElement!.appendChild(span)
              }}
            />
          </div>

          {/* TTS word button */}
          <button
            onClick={() => speak(item.tts, 'en-US', 0.8)}
            className={cn(
              'relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-2xl text-white text-lg font-black border-b-4 transition-all active:translate-y-0.5 active:border-b-[2px]',
            )}
            style={{
              backgroundColor: color,
              borderBottomColor: darken(color),
              boxShadow: speaking ? `0 0 0 4px ${color}44` : undefined,
            }}
          >
            {/* Speaker icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
              <path d="M15.5 8.5a5 5 0 010 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            {item.word}
          </button>

          {/* Audio wave when speaking */}
          {speaking && (
            <div className="audio-wave mt-3 relative z-10">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-5 space-y-5">

          {/* Letter badge for Stage 1 */}
          {item.letter && (
            <div className="flex justify-center">
              <span
                className="text-5xl font-black"
                style={{ color }}
              >
                {item.letter}
              </span>
            </div>
          )}

          {/* Syllable blocks */}
          {item.syllables.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 text-center">
                음절 나눠 따라하기
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center items-center">
                {item.syllables.map((syl, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="syl-plus">+</span>}
                    <button
                      onClick={() => speak(syl, 'en-US', 0.7)}
                      className={`syl-block ${SYL_CLASSES[i % SYL_CLASSES.length]}`}
                    >
                      {syl}
                    </button>
                  </span>
                ))}
              </div>
              {item.syllables.length > 1 && (
                <button
                  onClick={() => speakChunks(item.syllables, 'en-US')}
                  className="mt-3 w-full text-xs font-bold text-center transition-colors hover:underline"
                  style={{ color }}
                >
                  전체 음절 순서대로 듣기 &rarr;
                </button>
              )}
            </div>
          )}

          {/* Example sentences */}
          {item.sentences && item.sentences.length > 0 && (
            <div
              className="rounded-2xl p-4 space-y-2.5"
              style={{ backgroundColor: color + '0D', border: `1.5px solid ${color}33` }}
            >
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                예문
              </p>
              {item.sentences.slice(0, 2).map((s, i) => (
                <button
                  key={i}
                  onClick={() => speak(s, 'en-US', 0.8)}
                  className="flex items-start gap-2 w-full text-left group"
                >
                  <span className="text-sm mt-0.5 flex-shrink-0" style={{ color: color + 'AA' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                      <path d="M15.5 8.5a4 4 0 010 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-foreground leading-relaxed group-hover:underline">
                    {s}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border-2 border-b-4 text-sm font-black text-muted-foreground bg-white hover:bg-muted/30 transition-all active:translate-y-0.5 active:border-b-[2px]"
              style={{ borderColor: 'var(--border)', borderBottomColor: 'var(--border)' }}
            >
              다음 카드
            </button>
            <button
              onClick={onQuiz}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-black border-b-4 transition-all active:translate-y-0.5 active:border-b-[2px]"
              style={{ backgroundColor: color, borderBottomColor: darken(color) }}
            >
              퀴즈 도전
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
