'use client'

import { useState, useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { GameMascot } from '@/components/mascot/GameMascot'
import { cn } from '@/lib/utils'
import type { PhonicsContent, Situation, PhrasePair } from '@/types/content'

// ─── TTS speak button (standalone, never nested in another button) ────────────
function SpeakButton({
  text, lang = 'en-US', label, color, size = 'sm',
}: {
  text: string; lang?: string; label: string; color: string; size?: 'sm' | 'md'
}) {
  const { speak, speaking } = useTTS()
  return (
    <button
      onClick={e => { e.stopPropagation(); speak(text, lang, 0.85) }}
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-full border-2 border-b-[3px] transition-all active:translate-y-0.5 active:border-b-[2px]',
        size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
      )}
      style={{
        backgroundColor: speaking ? color : color + '18',
        borderColor: color + (speaking ? 'FF' : '55'),
        borderBottomColor: color + (speaking ? 'CC' : '88'),
      }}
    >
      <svg
        width={size === 'sm' ? 12 : 15} height={size === 'sm' ? 12 : 15}
        viewBox="0 0 24 24" fill="none"
      >
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill={speaking ? 'white' : color} />
        <path d="M15.5 8.5a5 5 0 010 7" stroke={speaking ? 'white' : color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// ─── Single phrase row ────────────────────────────────────────────────────────
function PhraseRow({ pair, color }: { pair: PhrasePair; color: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground leading-snug">{pair.en}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">{pair.ko}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
        <SpeakButton text={pair.en} lang="en-US" label="영어 듣기" color={color} />
        <SpeakButton text={pair.ko} lang="ko-KR" label="한국어 듣기" color="var(--game-pink)" />
      </div>
    </div>
  )
}

// ─── Situation section ────────────────────────────────────────────────────────
function SituationSection({
  sit, color, showPhonics, showKorean,
}: {
  sit: Situation; color: string; showPhonics: boolean; showKorean: boolean
}) {
  const { speak } = useTTS()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-2xl border-2 border-b-4 overflow-hidden bg-white"
      style={{ borderColor: color + '33', borderBottomColor: color + '77' }}
    >
      {/* Header — clickable div, NOT a button (avoids nested button error) */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(v => !v) }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none flex-shrink-0">{sit.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground leading-snug truncate">{sit.titleEn}</p>
            {showKorean && (
              <p className="text-xs font-semibold text-muted-foreground truncate">{sit.titleKo}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Speak button is a standalone element, not inside the div role=button */}
          <SpeakButton text={sit.titleEn} lang="en-US" label="상황 영어명 듣기" color={color} />
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={cn('text-muted-foreground transition-transform', expanded && 'rotate-180')}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-1 space-y-1 border-t border-border/30" style={{ backgroundColor: color + '06' }}>
          {showPhonics && sit.phonicsNote && (
            <div
              className="rounded-xl px-3 py-2 mb-3 border"
              style={{ backgroundColor: color + '12', borderColor: color + '33' }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color }}>
                발음 포인트
              </p>
              <p className="text-xs font-bold text-foreground">{sit.phonicsNote}</p>
              {sit.phonicsNote && (
                <button
                  onClick={() => speak(sit.phonicsNote!, 'en-US', 0.7)}
                  className="mt-1 text-[10px] font-black hover:underline transition-colors"
                  style={{ color }}
                >
                  들어보기 &rarr;
                </button>
              )}
            </div>
          )}
          {sit.phrases.map((pair, i) => (
            <PhraseRow key={i} pair={pair} color={color} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PhonicsPage() {
  const [data, setData] = useState<PhonicsContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPhonics, setShowPhonics] = useState(true)
  const [showKorean, setShowKorean] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/data/en/phonics.json')
      .then(r => r.json())
      .then((d: PhonicsContent) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const situations = data?.situations ?? []
  const filtered = search.trim()
    ? situations.filter(s =>
        s.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        s.titleKo.includes(search) ||
        s.phrases.some(p => p.en.toLowerCase().includes(search.toLowerCase()) || p.ko.includes(search))
      )
    : situations

  const ACCENT = '#58CC02'
  const ACCENT_DARK = '#46A302'
  const ACCENT_LIGHT = '#D7F5A8'

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky page header ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <p className="text-base font-black text-foreground">회화</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowPhonics(v => !v)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-black border-2 border-b-[3px] transition-all active:translate-y-0.5 active:border-b-[2px]',
                  showPhonics ? 'text-white' : 'bg-white text-muted-foreground'
                )}
                style={showPhonics
                  ? { backgroundColor: ACCENT, borderColor: ACCENT, borderBottomColor: ACCENT_DARK }
                  : { borderColor: 'var(--border)', borderBottomColor: 'var(--border)' }
                }
              >
                발음
              </button>
              <button
                onClick={() => setShowKorean(v => !v)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-black border-2 border-b-[3px] transition-all active:translate-y-0.5 active:border-b-[2px]',
                  showKorean ? 'text-white' : 'bg-white text-muted-foreground'
                )}
                style={showKorean
                  ? { backgroundColor: '#FF86C8', borderColor: '#FF86C8', borderBottomColor: '#E05EA8' }
                  : { borderColor: 'var(--border)', borderBottomColor: 'var(--border)' }
                }
              >
                한국어
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="pb-3">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full px-4 py-2 rounded-2xl border-2 border-b-4 bg-white text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all"
              style={{ borderColor: ACCENT + '44', borderBottomColor: ACCENT + '88' }}
            />
          </div>
        </div>
      </div>

      {/* ── Hero banner ── */}
      {data && !loading && (
        <div className="overflow-hidden" style={{ backgroundColor: ACCENT_LIGHT }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-5">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: ACCENT_DARK }}>
                {filtered.length}개 상황 · {filtered.reduce((s, sit) => s + sit.phrases.length, 0)}개 표현
              </p>
              <h1 className="text-xl font-black text-foreground mt-1 text-balance">
                실생활 영어 회화
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                상황별 영어 표현을 듣고 따라 해요
              </p>
            </div>
            <GameMascot mood="speaking" size={80} />
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <GameMascot mood="thinking" size={80} className="animate-bounce" />
            <p className="text-sm font-black text-muted-foreground">회화 패턴 불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <GameMascot mood="wrong" size={80} />
            <p className="text-sm font-black text-muted-foreground">
              &ldquo;{search}&rdquo; 에 대한 결과가 없어요
            </p>
            <button onClick={() => setSearch('')} className="text-xs font-black hover:underline" style={{ color: '#58CC02' }}>
              검색 초기화
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sit => (
              <SituationSection
                key={sit.id}
                sit={sit}
                color={ACCENT}
                showPhonics={showPhonics}
                showKorean={showKorean}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
