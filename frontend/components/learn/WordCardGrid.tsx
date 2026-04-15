'use client'

import { useState } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { Category, WordItem } from '@/types/content'

// Per-category accent palette
const CAT_PALETTE = [
  { bg: '#1CB0F6', dark: '#0A98DA', light: '#D0F0FF' },
  { bg: '#FF9600', dark: '#E08200', light: '#FFE9B0' },
  { bg: '#58CC02', dark: '#46A302', light: '#D7F5A8' },
  { bg: '#FF86C8', dark: '#E05EA8', light: '#FFD6EE' },
  { bg: '#CE82FF', dark: '#A855D4', light: '#F0D6FF' },
  { bg: '#00C2A0', dark: '#00A082', light: '#B0F0E8' },
]

// Syllable pill colors
const SYL_COLORS = ['#7c3aed', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b']

// Twitter/Twemoji SVG URL using full GitHub raw path
function emojiToTwitterImage(emoji: string): string {
  const codePoints = [...emoji]
    .map(c => c.codePointAt(0)!.toString(16))
    .filter(cp => cp !== 'fe0f')
    .join('-')
  return `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${codePoints}.svg`
}

// ── Play icon ──────────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

// ── Quiz icon ──────────────────────────────────────────────────────────────
function QuizIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3" />
      <path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  )
}

// ── Puzzle icon ────────────────────────────────────────────────────────────
function PuzzleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h7v4a2 2 0 000 4H3V3zM14 3h7v7h-4a2 2 0 000 4h4v7h-7v-4a2 2 0 00-4 0v4H3v-7h4a2 2 0 000-4H3v0" />
    </svg>
  )
}

// ── Chevron icon ───────────────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────
interface WordCardGridProps {
  categories: Category[]
  onCardClick: (item: WordItem) => void
  onLearn?: (words: WordItem[], catName: string, catColor: string) => void
  onQuiz?: (words: WordItem[], catName: string, catColor: string) => void
  onPuzzle?: (words: WordItem[], catName: string, catColor: string) => void
}

// ── Main component ────────────────────────────────────────────────────────
export function WordCardGrid({ categories, onCardClick, onLearn, onQuiz, onPuzzle }: WordCardGridProps) {
  // Each section is open by default
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(categories.map(c => c.id))
  )

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-semibold">
        학습 내용이 없습니다
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {categories.map((cat, idx) => {
        const pal = CAT_PALETTE[idx % CAT_PALETTE.length]
        const isOpen = openSections.has(cat.id)

        return (
          <section
            key={cat.id}
            style={{
              background: 'white',
              borderRadius: '18px',
              border: `2px solid ${pal.bg}33`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
            {/* ── Section header (accordion trigger) ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: isOpen ? `${pal.bg}12` : 'white',
                borderBottom: isOpen ? `2px solid ${pal.bg}22` : 'none',
                transition: 'background 0.2s',
              }}
            >
              {/* Icon + title (clickable to toggle) */}
              <button
                onClick={() => toggle(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', padding: 0,
                }}
                aria-expanded={isOpen}
              >
                <span
                  style={{
                    width: 34, height: 34, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.9rem', fontWeight: 900,
                    background: pal.bg, boxShadow: `0 3px 8px ${pal.bg}55`,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50' }}>{cat.name}</span>
                <span
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                    background: pal.light, color: pal.dark,
                  }}
                >
                  {cat.words.length}개
                </span>
                <span style={{ color: '#aaa', marginLeft: 'auto' }}>
                  <ChevronIcon open={isOpen} />
                </span>
              </button>

              {/* Mode buttons (always visible) */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {onLearn && (
                  <button
                    onClick={() => onLearn(cat.words, cat.name, pal.bg)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '5px 10px', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800,
                      background: '#58CC02', color: 'white',
                    }}
                  >
                    <PlayIcon /> 학습
                  </button>
                )}
                {onQuiz && (
                  <button
                    onClick={() => onQuiz(cat.words, cat.name, pal.bg)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '5px 10px', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800,
                      background: '#FF9600', color: 'white',
                    }}
                  >
                    <QuizIcon /> 퀴즈
                  </button>
                )}
                {onPuzzle && cat.words.length >= 4 && (
                  <button
                    onClick={() => onPuzzle(cat.words, cat.name, pal.bg)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '5px 10px', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800,
                      background: '#7c3aed', color: 'white',
                    }}
                  >
                    <PuzzleIcon /> 퍼즐
                  </button>
                )}
              </div>
            </div>

            {/* ── Card grid (collapses) ── */}
            {isOpen && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px',
                  padding: '14px',
                }}
              >
                {cat.words.map(word => (
                  <WordCard
                    key={word.id}
                    item={word}
                    pal={pal}
                    onClick={() => onCardClick(word)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ── Individual word card ───────────────────────────────────────────────────
interface WordCardProps {
  item: WordItem
  pal: typeof CAT_PALETTE[0]
  onClick: () => void
}

function WordCard({ item, pal, onClick }: WordCardProps) {
  const { speak } = useTTS()
  const twitterImageUrl = emojiToTwitterImage(item.emoji)

  const handleClick = () => {
    onClick()
    speak(item.tts, 'en-US', 0.85)
  }

  return (
    <button
      onClick={handleClick}
      className="ko-word-card w-full text-left focus:outline-none"
      aria-label={item.word}
    >
      {/* Colored image area */}
      <div className="ko-card-img" style={{ backgroundColor: pal.bg }}>
        <div className="ko-card-img-inner">
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 70% 60% at 50% 55%, rgba(255,255,255,0.28) 0%, transparent 75%)` }}
          />
          <img
            src={twitterImageUrl}
            alt={item.word}
            width={48}
            height={48}
            className="relative z-10 object-contain drop-shadow-md select-none"
            style={{ width: 48, height: 48 }}
            onError={e => {
              const parent = e.currentTarget.parentElement!
              e.currentTarget.style.display = 'none'
              const span = document.createElement('span')
              span.textContent = item.emoji
              span.className = 'text-4xl leading-none select-none relative z-10'
              parent.appendChild(span)
            }}
          />
        </div>
      </div>

      {/* Card body */}
      <div className="ko-card-body">
        {item.letter && (
          <div className="flex justify-center mb-1">
            <span
              className="text-[11px] font-black px-2.5 py-0.5 rounded-lg text-white"
              style={{ backgroundColor: pal.bg }}
            >
              {item.letter}
            </span>
          </div>
        )}

        <p className="ko-card-word">{item.word}</p>

        {item.syllables.length > 0 && (
          <div className="ko-card-syllables">
            {item.syllables.map((syl, i) => (
              <span
                key={i}
                className="ko-syllable-pill"
                style={{ backgroundColor: SYL_COLORS[i % SYL_COLORS.length] }}
              >
                {syl}
              </span>
            ))}
          </div>
        )}

        {item.hint && (
          <p className="text-[10px] text-muted-foreground font-semibold leading-tight mt-1 line-clamp-1">
            {item.hint}
          </p>
        )}
      </div>
    </button>
  )
}
