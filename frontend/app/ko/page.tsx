'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import type { KoWordContent, KoWordItem, KoCategory } from '@/types/content'
import { KoLearnDialog } from '@/components/dialog/KoLearnDialog'
import { KoQuizDialog } from '@/components/dialog/KoQuizDialog'
import { KoPuzzleDialog } from '@/components/dialog/KoPuzzleDialog'

// ── Stage definitions (4 stages from words.json categories) ──────────────────
const STAGES = [
  { id: 1, label: '1단계', subtitle: '기초 단어', catIds: ['animals', 'fruits'],  color: '#FF4B4B', dark: '#C72626', light: '#FFD0D0', icon: '🐾' },
  { id: 2, label: '2단계', subtitle: '생활 단어', catIds: ['foods', 'colors'],    color: '#FF9600', dark: '#C86E00', light: '#FFE9B0', icon: '🍎' },
  { id: 3, label: '3단계', subtitle: '몸과 가족', catIds: ['body', 'family'],     color: '#58CC02', dark: '#3A8A00', light: '#D7F5A8', icon: '👶' },
  { id: 4, label: '4단계', subtitle: '전체 복습', catIds: null,                   color: '#CE82FF', dark: '#8B3DB8', light: '#F0D6FF', icon: '🌈' },
]

// ── Syllable color sets ───────────────────────────────────────────────────────
const SYL_COLORS = [
  { bg: 'linear-gradient(135deg,#667eea,#764ba2)', text: 'white' },
  { bg: 'linear-gradient(135deg,#f093fb,#f5576c)', text: 'white' },
  { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', text: '#0d4a7a' },
  { bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', text: '#0d4a1a' },
  { bg: 'linear-gradient(135deg,#fa709a,#fee140)', text: '#5c2a00' },
]

// ── Category color palette per-stage ─────────────────────────────────────────
const CAT_COLORS = [
  '#FF4B4B', '#FF9600', '#58CC02', '#1CB0F6', '#CE82FF', '#00C2A0',
]

// ── Word card for grid ────────────────────────────────────────────────────────
function KoWordCard({ item, bgColor, onClick }: {
  item: KoWordItem
  bgColor: string
  onClick: () => void
}) {
  const { speak } = useTTS()
  const syllables = Array.from(item.word)

  const handleClick = () => {
    speak(item.word, 'ko-KR', 0.9)
    onClick()
  }

  return (
    <button className="ko-word-card w-full text-left" onClick={handleClick} aria-label={item.word}>
      {/* Colored top: emoji on colored bg like reference image 9 */}
      <div className="ko-card-img" style={{ background: bgColor }}>
        <div className="ko-card-img-inner">
          <span
            style={{ fontSize: '62px', lineHeight: 1, filter: 'drop-shadow(0 3px 12px rgba(255,255,255,0.6)) drop-shadow(0 2px 5px rgba(0,0,0,0.1))' }}
          >
            {item.emoji}
          </span>
        </div>
      </div>
      {/* White bottom: word + syllable blocks */}
      <div className="ko-card-body">
        <div className="ko-card-word">{item.word}</div>
        <div className="ko-card-syllables">
          {syllables.map((s, i) => (
            <span key={i} className="ko-syllable-pill" style={{ background: SYL_COLORS[i % SYL_COLORS.length].bg, color: SYL_COLORS[i % SYL_COLORS.length].text }}>
              {s}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.78em', color: '#e67e22', fontWeight: 700, minHeight: '16px' }}>
          {item.meaning}
        </div>
      </div>
    </button>
  )
}

// ── Inline SVG icons for stage visual flair ───────────────────────────────────
function StageIllustration({ id }: { id: number }) {
  if (id === 1) return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <ellipse cx="32" cy="40" rx="14" ry="10" fill="rgba(255,255,255,0.4)" />
      <circle cx="22" cy="28" r="7" fill="white" opacity=".9" />
      <circle cx="42" cy="28" r="7" fill="white" opacity=".9" />
      <circle cx="22" cy="28" r="3" fill="#333" />
      <circle cx="42" cy="28" r="3" fill="#333" />
      <path d="M24 40 Q32 46 40 40" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
  if (id === 2) return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <rect x="16" y="20" width="32" height="26" rx="6" fill="rgba(255,255,255,0.5)" />
      <circle cx="24" cy="30" r="6" fill="white" opacity=".9" />
      <rect x="33" y="25" width="10" height="3" rx="1.5" fill="white" opacity=".8" />
      <rect x="33" y="32" width="7" height="3" rx="1.5" fill="white" opacity=".6" />
    </svg>
  )
  if (id === 3) return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <circle cx="32" cy="26" r="10" fill="rgba(255,255,255,0.5)" />
      <circle cx="32" cy="24" r="6" fill="white" opacity=".9" />
      <path d="M20 48 Q32 38 44 48" fill="rgba(255,255,255,0.5)" />
    </svg>
  )
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <polygon points="32,10 38,26 55,26 42,36 47,52 32,42 17,52 22,36 9,26 26,26" fill="rgba(255,255,255,0.6)" />
    </svg>
  )
}

// ── Main page component ───────────────────────────────────────────────────────
export default function KoreanPage() {
  const [content, setContent] = useState<KoWordContent | null>(null)
  const [activeStage, setActiveStage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(true)
  const [openCatIds, setOpenCatIds] = useState<Set<string>>(new Set())
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set())
  const [learnOpen, setLearnOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [puzzleOpen, setPuzzleOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<KoWordItem | null>(null)
  const [selectedCatWords, setSelectedCatWords] = useState<KoWordItem[]>([])
  const [selectedCatName, setSelectedCatName] = useState('')
  const [selectedCatColor, setSelectedCatColor] = useState('#FF4B4B')
  const [selectedCatId, setSelectedCatId] = useState('')

  useEffect(() => {
    fetch('/data/ko/words.json')
      .then(r => r.json())
      .then((d: KoWordContent) => {
        setContent(d)
        // Default: select all cats in stage 1 and open them all
        const stage = STAGES[0]
        const catIds = stage.catIds ?? d.categories.map((c: KoCategory) => c.id)
        setSelectedCatIds(new Set(catIds))
        setOpenCatIds(new Set(catIds))
      })
  }, [])

  const cats = content?.categories ?? []
  const allWords = cats.flatMap(c => c.words)

  // Get categories for active stage
  const stageDef = STAGES.find(s => s.id === activeStage)!
  const stageCats: KoCategory[] = stageDef.catIds
    ? cats.filter(c => stageDef.catIds!.includes(c.id))
    : cats

  // Selected cats for quiz/puzzle
  const selectedCats = stageCats.filter(c => selectedCatIds.has(c.id))
  const quizWords = selectedCats.length > 0
    ? selectedCats.flatMap(c => c.words)
    : stageCats.flatMap(c => c.words)

  // Sentence count preview for filter
  const sentenceCount = quizWords.reduce((acc, w) => acc + (w.sentences?.length ?? 0), 0)

  const toggleCat = (catId: string) => {
    setSelectedCatIds(prev => {
      const next = new Set(prev)
      if (next.has(catId)) { next.delete(catId) } else { next.add(catId) }
      return next
    })
  }

  const selectAll = () => {
    if (selectedCatIds.size === stageCats.length) {
      setSelectedCatIds(new Set())
    } else {
      setSelectedCatIds(new Set(stageCats.map(c => c.id)))
    }
  }

  const resetFilter = () => setSelectedCatIds(new Set())

  const toggleCatOpen = (catId: string) => {
    setOpenCatIds(prev => {
      const next = new Set(prev)
      if (next.has(catId)) { next.delete(catId) } else { next.add(catId) }
      return next
    })
  }

  const openLearnAt = (item: KoWordItem, catWords: KoWordItem[], catName: string, catColor: string, catId?: string) => {
    setSelectedWord(item)
    setSelectedCatWords(catWords)
    setSelectedCatName(catName)
    setSelectedCatColor(catColor)
    setSelectedCatId(catId ?? stageCats.find(c => c.words.some(w => w.id === item.id))?.id ?? stageCats[0]?.id ?? '')
    setLearnOpen(true)
  }

  const openQuiz = (catWords: KoWordItem[], catName: string, catColor: string) => {
    setSelectedCatWords(catWords)
    setSelectedCatName(catName)
    setSelectedCatColor(catColor)
    setQuizOpen(true)
  }

  const openPuzzle = (catWords: KoWordItem[], catName: string, catColor: string) => {
    setSelectedCatWords(catWords)
    setSelectedCatName(catName)
    setSelectedCatColor(catColor)
    setPuzzleOpen(true)
  }

  const handleStageChange = (stageId: number) => {
    setActiveStage(stageId)
    const stage = STAGES.find(s => s.id === stageId)!
    const ids = stage.catIds ?? cats.map(c => c.id)
    setSelectedCatIds(new Set(ids))
    setOpenCatIds(new Set(ids))
  }



  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f8fa' }}>

      {/* ── Sticky sub-header: title + stage tabs (matches English layout) ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '12px' }}>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50', lineHeight: 1 }}>한글 배우기</h1>
              <p style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600, marginTop: '3px' }}>
                {stageDef.label} &middot; {stageDef.subtitle}
              </p>
            </div>
            {/* Stage-level mode buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => openLearnAt(quizWords[0] ?? stageCats[0]?.words[0], quizWords, stageDef.subtitle, stageDef.color)}
                disabled={quizWords.length === 0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 14px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, background: '#58CC02', color: 'white', opacity: quizWords.length === 0 ? 0.5 : 1 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>
                학습
              </button>
              <button
                onClick={() => openQuiz(quizWords, stageDef.subtitle, stageDef.color)}
                disabled={quizWords.length === 0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 14px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, background: '#FF9600', color: 'white', opacity: quizWords.length === 0 ? 0.5 : 1 }}
              >
                퀴즈
              </button>
              <button
                onClick={() => openPuzzle(quizWords, stageDef.subtitle, stageDef.color)}
                disabled={quizWords.length < 4}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 14px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, background: '#7c3aed', color: 'white', opacity: quizWords.length < 4 ? 0.5 : 1 }}
              >
                퍼즐
              </button>
            </div>
          </div>

          {/* Stage tab row */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }} className="scrollbar-hide">
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => handleStageChange(s.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', border: '2px solid',
                  borderColor: activeStage === s.id ? s.color : '#e8e8e8',
                  borderRadius: '22px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
                  background: activeStage === s.id ? s.color : 'white',
                  color: activeStage === s.id ? 'white' : '#555',
                  boxShadow: activeStage === s.id ? `0 4px 12px ${s.color}44` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    width: 22, height: 22, borderRadius: '7px', flexShrink: 0,
                    background: activeStage === s.id ? 'rgba(0,0,0,0.18)' : s.color,
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 900,
                  }}
                >
                  {s.id}
                </span>
                {s.label}
                <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>&middot; {s.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stage hero band ── */}
      <div style={{ backgroundColor: stageDef.light, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.25,
            backgroundImage: `radial-gradient(circle, ${stageDef.color}33 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ padding: '32px 24px 32px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
                borderRadius: '12px', background: stageDef.color, color: 'white',
                fontSize: '0.75rem', fontWeight: 800, marginBottom: '10px',
                boxShadow: `0 3px 10px ${stageDef.color}55`,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: '5px', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                {stageDef.id}
              </span>
              {stageDef.label} &middot; {stageDef.subtitle}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2c3e50', marginBottom: '6px', lineHeight: 1.25 }}>
              {stageDef.subtitle} 단어 학습
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginBottom: '12px' }}>
              그림을 클릭하면 발음을 들을 수 있어요
            </p>
            {content && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '4px 12px', borderRadius: '10px', background: stageDef.color, color: 'white' }}>
                  {quizWords.length}개 단어
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>
                  +{quizWords.length * 5} XP
                </span>
              </div>
            )}
          </div>
          <StageIllustration id={activeStage} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4" style={{ paddingTop: '16px' }}>

        {/* ── Purple filter accordion ── */}
        {content && (
          <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '12px', overflow: 'hidden' }}>
            {/* accordion header */}
            <button
              onClick={() => setFilterOpen(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>주제 필터</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {selectedCatIds.size > 0 ? `${selectedCatIds.size}개 선택` : '전체'}
                </span>
                <span style={{ color: 'white', fontSize: '0.8rem', transition: 'transform 0.3s', transform: filterOpen ? 'rotate(0deg)' : 'rotate(180deg)', display: 'inline-block' }}>▲</span>
              </div>
            </button>

            {filterOpen && (
              <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f0f0' }}>
                {/* Controls row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={selectAll}
                    style={{ padding: '5px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, background: selectedCatIds.size === stageCats.length ? 'linear-gradient(135deg,#ef5350,#e91e63)' : 'linear-gradient(135deg,#4caf50,#66bb6a)', color: 'white', transition: 'all 0.2s' }}
                  >
                    {selectedCatIds.size === stageCats.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    onClick={resetFilter}
                    style={{ padding: '5px 14px', border: '1.5px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, background: 'white', color: '#666', transition: 'all 0.2s' }}
                  >
                    초기화
                  </button>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#e91e63', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {sentenceCount}문장 재생 예정
                  </span>
                </div>

                {/* Category pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {stageCats.map((cat, ci) => {
                    const isActive = selectedCatIds.has(cat.id)
                    const color = CAT_COLORS[ci % CAT_COLORS.length]
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCat(cat.id)}
                        style={{
                          padding: '6px 14px',
                          border: `2px solid ${isActive ? 'transparent' : '#e0e0e0'}`,
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: isActive ? color : 'white',
                          color: isActive ? 'white' : '#555',
                          boxShadow: isActive ? `0 3px 10px ${color}44` : 'none',
                          transform: isActive ? 'translateY(-1px)' : 'none',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isActive && <span style={{ fontWeight: 900 }}>✓ </span>}
                        {cat.icon} {cat.name}
                        <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>Lv.{STAGES.findIndex(s => s.id === activeStage) + 1} {cat.words.length}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Stage content ── */}
        {!content ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <p style={{ fontWeight: 700 }}>불러오는 중...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stageCats.map((cat, ci) => {
              const catColor = CAT_COLORS[ci % CAT_COLORS.length]
              const isOpen = openCatIds.has(cat.id)
              return (
                <section
                  key={cat.id}
                  style={{
                    background: 'white',
                    borderRadius: '18px',
                    border: `2px solid ${catColor}33`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px',
                      background: isOpen ? `${catColor}12` : 'white',
                      borderBottom: isOpen ? `2px solid ${catColor}22` : 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Icon + title — toggle accordion */}
                    <button
                      onClick={() => toggleCatOpen(cat.id)}
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
                          fontSize: '1.1rem', background: catColor,
                          boxShadow: `0 3px 8px ${catColor}55`, flexShrink: 0,
                        }}
                      >
                        {cat.icon}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50' }}>{cat.name}</span>
                      <span
                        style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                          background: `${catColor}20`, color: catColor,
                        }}
                      >
                        {cat.words.length}단어
                      </span>
                      {/* Chevron */}
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        style={{ marginLeft: 'auto', color: '#aaa', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* Mode buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => openLearnAt(cat.words[0], cat.words, cat.name, catColor, cat.id)}
                        disabled={cat.words.length === 0}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800, background: '#58CC02', color: 'white' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>
                        학습
                      </button>
                      <button
                        onClick={() => openQuiz(cat.words, cat.name, catColor)}
                        disabled={cat.words.length === 0}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800, background: '#FF9600', color: 'white' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3" /><path d="M9 9a3 3 0 016 0c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /><circle cx="12" cy="17" r="1.2" fill="currentColor" /></svg>
                        퀴즈
                      </button>
                      <button
                        onClick={() => openPuzzle(cat.words, cat.name, catColor)}
                        disabled={cat.words.length < 4}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800, background: '#7c3aed', color: 'white', opacity: cat.words.length < 4 ? 0.5 : 1 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 3h7v4a2 2 0 000 4H3V3zM14 3h7v7h-4a2 2 0 000 4h4v7h-7v-4a2 2 0 00-4 0v4H3v-7h4a2 2 0 000-4H3v0" /></svg>
                        퍼즐
                      </button>
                    </div>
                  </div>

                  {/* Card grid (accordion body) */}
                  {isOpen && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', padding: '14px' }}>
                      {cat.words.map(item => (
                        <KoWordCard
                          key={item.id}
                          item={item}
                          bgColor={catColor}
                          onClick={() => openLearnAt(item, cat.words, cat.name, catColor, cat.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      {learnOpen && selectedWord && (
        <KoLearnDialog
          allCategories={stageCats}
          initialCatId={selectedCatId}
          initialWord={selectedWord}
          onClose={() => setLearnOpen(false)}
        />
      )}
      {quizOpen && (
        <KoQuizDialog
          words={selectedCatWords}
          allWords={allWords}
          catName={selectedCatName}
          catColor={selectedCatColor}
          onClose={() => setQuizOpen(false)}
        />
      )}
      {puzzleOpen && (
        <KoPuzzleDialog
          words={selectedCatWords}
          catName={selectedCatName}
          catColor={selectedCatColor}
          onClose={() => setPuzzleOpen(false)}
        />
      )}
    </div>
  )
}
