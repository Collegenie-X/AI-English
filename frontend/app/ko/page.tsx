'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import type { KoWordContent, KoWordItem, KoCategory, KoSentenceContent, KoSituationGroup, KoSentenceItem } from '@/types/content'
import { KoLearnDialog, type DialogCat } from '@/components/dialog/KoLearnDialog'
import { KoQuizDialog }          from '@/components/dialog/KoQuizDialog'
import { KoPuzzleDialog }        from '@/components/dialog/KoPuzzleDialog'
import { KoVoiceSettingsDialog } from '@/components/dialog/KoVoiceSettingsDialog'
import { KoAutoPlayDialog }      from '@/components/dialog/KoAutoPlayDialog'

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGES = [
  { id: 1, label: '1단계', subtitle: '기초 단어',  catIds: ['animals', 'fruits', 'veggies'],                                                   color: '#FF4B4B', dark: '#C72626', light: '#FFD0D0', icon: '🐾', type: 'word'     },
  { id: 2, label: '2단계', subtitle: '생활 단어',  catIds: ['foods', 'colors', 'vehicles', 'nature', 'body', 'family', 'school', 'clothes', 'home', 'emotions'], color: '#FF9600', dark: '#C86E00', light: '#FFE9B0', icon: '🍎', type: 'word'     },
  { id: 3, label: '3단계', subtitle: '생활 문장',  catIds: null,                                                                                color: '#1CB0F6', dark: '#0080C8', light: '#D6F0FF', icon: '💬', type: 'sentence' },
  { id: 4, label: '4단계', subtitle: '전체 복습',  catIds: null,                                                                                color: '#CE82FF', dark: '#8B3DB8', light: '#F0D6FF', icon: '🌈', type: 'review'   },
]

const SYL_COLORS = [
  { bg: 'linear-gradient(135deg,#667eea,#764ba2)', text: 'white' },
  { bg: 'linear-gradient(135deg,#f093fb,#f5576c)', text: 'white' },
  { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', text: '#0d4a7a' },
  { bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', text: '#0d4a1a' },
  { bg: 'linear-gradient(135deg,#fa709a,#fee140)', text: '#5c2a00' },
]

const CAT_COLORS = ['#FF4B4B', '#FF9600', '#58CC02', '#1CB0F6', '#CE82FF', '#00C2A0']

// ── Word card ─────────────────────────────────────────────────────────────────
function KoWordCard({ item, bgColor, onClick }: {
  item: KoWordItem; bgColor: string; onClick: () => void
}) {
  const { speak } = useTTS()
  const syllables = Array.from(item.word)
  return (
    <button className="ko-word-card w-full text-left" onClick={() => { speak(item.word, 'ko-KR', 0.9); onClick() }} aria-label={item.word}>
      <div className="ko-card-img" style={{ background: bgColor }}>
        <div className="ko-card-img-inner">
          <span style={{ fontSize: '62px', lineHeight: 1, filter: 'drop-shadow(0 3px 12px rgba(255,255,255,0.6))' }}>
            {item.emoji}
          </span>
        </div>
      </div>
      <div className="ko-card-body">
        <div className="ko-card-word">{item.word}</div>
        <div className="ko-card-syllables">
          {syllables.map((s, i) => (
            <span key={i} className="ko-syllable-pill" style={{ background: SYL_COLORS[i % SYL_COLORS.length].bg, color: SYL_COLORS[i % SYL_COLORS.length].text }}>
              {s}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.78em', color: '#e67e22', fontWeight: 700, minHeight: '16px' }}>{item.meaning}</div>
      </div>
    </button>
  )
}

// ── Sentence card ─────────────────────────────────────────────────────────────
function KoSentenceCard({ item, accentColor, listened, onListen }: {
  item: KoSentenceItem; accentColor: string; listened: boolean; onListen: () => void
}) {
  const { speak } = useTTS()
  const [flipped, setFlipped] = useState(false)

  const handleClick = () => {
    speak(item.english, 'en-US', 0.85)
    onListen()
    setFlipped(v => !v)
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left',
        background: listened ? `${accentColor}10` : 'white',
        border: `2px solid ${listened ? accentColor : '#efefef'}`,
        borderRadius: '14px', padding: '12px 14px', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a202c', lineHeight: 1.4, flex: 1 }}>
          {item.english}
        </span>
        <span style={{ fontSize: '0.7rem', background: accentColor, color: 'white', borderRadius: '8px', padding: '2px 7px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
          {listened ? '✓ 들음' : '🔊'}
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#e67e22', fontWeight: 700 }}>{item.answer}</div>
      {flipped && (
        <>
          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, background: '#f5f0ff', borderRadius: '8px', padding: '5px 9px', letterSpacing: '0.03em' }}>
            {item.phonics}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: '5px' }}>
            💡 {item.tips}
          </div>
        </>
      )}
    </button>
  )
}

// ── Stage hero illustration ───────────────────────────────────────────────────
function StageIllustration({ id }: { id: number }) {
  if (id === 1) return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <ellipse cx="32" cy="40" rx="14" ry="10" fill="rgba(255,255,255,0.4)" />
      <circle cx="22" cy="28" r="7" fill="white" opacity=".9" /><circle cx="42" cy="28" r="7" fill="white" opacity=".9" />
      <circle cx="22" cy="28" r="3" fill="#333" /><circle cx="42" cy="28" r="3" fill="#333" />
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
      <rect x="12" y="18" width="30" height="20" rx="8" fill="rgba(255,255,255,0.5)" />
      <path d="M18 38 L14 46 L26 40" fill="rgba(255,255,255,0.5)" />
      <rect x="16" y="24" width="16" height="3" rx="1.5" fill="white" opacity=".9" />
      <rect x="16" y="30" width="10" height="3" rx="1.5" fill="white" opacity=".7" />
      <circle cx="44" cy="42" r="10" fill="rgba(255,255,255,0.35)" />
      <rect x="39" y="40" width="10" height="2.5" rx="1.25" fill="white" opacity=".9" />
      <rect x="39" y="44" width="7" height="2.5" rx="1.25" fill="white" opacity=".7" />
    </svg>
  )
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)" />
      <path d="M20 32 Q32 16 44 32 Q32 48 20 32Z" fill="rgba(255,255,255,0.5)" />
      <circle cx="32" cy="32" r="6" fill="white" opacity=".9" />
    </svg>
  )
}

// ── Grouped horizontal button ─────────────────────────────────────────────────
function GrpBtn({ label, icon, color, textColor, onClick, disabled = false, first = false, last = false, separator = false }: {
  label: string; icon: string; color: string; textColor?: string
  onClick: () => void; disabled?: boolean; first?: boolean; last?: boolean; separator?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        padding: '8px 6px', border: 'none',
        borderLeft:  first     ? 'none' : '1px solid #e8e8e8',
        borderRight: separator ? '2.5px solid #d0d0d0' : 'none',
        borderRadius: first ? '8px 0 0 8px' : last ? '0 8px 8px 0' : '0',
        background: 'white', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontWeight: 800, fontSize: '0.72rem',
        color: textColor ?? color, whiteSpace: 'nowrap',
        opacity: disabled ? 0.4 : 1, transition: 'background 0.12s', flex: 1,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = color + '15' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
    >
      <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{icon}</span>
      {label}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function KoreanPage() {
  const [wordContent, setWordContent]         = useState<KoWordContent | null>(null)
  const [sentenceContent, setSentenceContent] = useState<KoSentenceContent | null>(null)
  const [activeStage, setActiveStage]         = useState(1)
  const [filterOpen, setFilterOpen]           = useState(true)
  const [openCatIds, setOpenCatIds]           = useState<Set<string>>(new Set())
  const [selectedCatIds, setSelectedCatIds]   = useState<Set<string>>(new Set())
  const [listenedIds, setListenedIds]         = useState<Set<string>>(new Set())
  const [actionBarOpen, setActionBarOpen]     = useState(true)

  // Sentence stage: selected situation ids
  const [selectedSitIds, setSelectedSitIds]   = useState<Set<number>>(new Set())
  const [openSitIds, setOpenSitIds]           = useState<Set<number>>(new Set())

  // Dialog states
  const [learnOpen, setLearnOpen]       = useState(false)
  const [quizOpen, setQuizOpen]         = useState(false)
  const [puzzleOpen, setPuzzleOpen]     = useState(false)
  const [voiceOpen, setVoiceOpen]       = useState(false)
  const [autoPlayOpen, setAutoPlayOpen] = useState(false)

  const [selectedWord, setSelectedWord]         = useState<KoWordItem | null>(null)
  const [selectedCatWords, setSelectedCatWords] = useState<KoWordItem[]>([])
  const [selectedCatName, setSelectedCatName]   = useState('')
  const [selectedCatColor, setSelectedCatColor] = useState('#FF4B4B')
  const [selectedCatIcon, setSelectedCatIcon]   = useState('🎯')
  const [learnCats, setLearnCats]               = useState<DialogCat[]>([])
  const [learnInitialCatId, setLearnInitialCatId] = useState('')

  const { settings, update: updateVoice } = useVoiceSettings()

  // ── Random words state ────────────────────────────────────────────────────

  // Load word data
  useEffect(() => {
    fetch('/data/ko/words.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: KoWordContent) => {
        setWordContent(d)
        const ids = STAGES[0].catIds as string[]
        setSelectedCatIds(new Set(ids))
        setOpenCatIds(new Set(ids))
      })
      .catch(err => console.error('words.json 로드 실패:', err))
  }, [])

  // Load sentence data (stage 3 + 4)
  useEffect(() => {
    if (activeStage < 3 || sentenceContent) return
    fetch('/data/ko/sentences.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: KoSentenceContent) => {
        setSentenceContent(d)
        const allIds = new Set(d.situations.map(s => s.id))
        setSelectedSitIds(allIds)
        setOpenSitIds(new Set([d.situations[0]?.id]))
      })
      .catch(err => console.error('sentences.json 로드 실패:', err))
  }, [activeStage, sentenceContent])

  // ── Derived values ────────────────────────────────────────────────────────
  const stageDef   = STAGES.find(s => s.id === activeStage)!
  const cats       = wordContent?.categories ?? []
  const stageCats: KoCategory[] = stageDef.catIds
    ? cats.filter(c => (stageDef.catIds as string[]).includes(c.id))
    : cats
  const displayCats = stageCats.filter(c => selectedCatIds.has(c.id))
  const quizWords   = displayCats.length > 0 ? displayCats.flatMap(c => c.words) : stageCats.flatMap(c => c.words)

  const allSituations: KoSituationGroup[] = sentenceContent?.situations ?? []
  const displaySituations = allSituations.filter(s => selectedSitIds.has(s.id))

  const listenedCount = activeStage === 3
    ? [...listenedIds].length
    : quizWords.filter(w => listenedIds.has(w.id)).length
  const totalCount = activeStage === 3
    ? displaySituations.reduce((acc, s) => acc + s.sentences.length, 0)
    : quizWords.length

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleCat = (catId: string) =>
    setSelectedCatIds(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })

  const selectAll = () =>
    setSelectedCatIds(selectedCatIds.size === stageCats.length ? new Set() : new Set(stageCats.map(c => c.id)))

  const toggleSit = (id: number) =>
    setSelectedSitIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectAllSit = () =>
    setSelectedSitIds(selectedSitIds.size === allSituations.length ? new Set() : new Set(allSituations.map(s => s.id)))

  const resetListened = () => setListenedIds(new Set())

  const toggleCatOpen  = (id: string) => setOpenCatIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSitOpen  = (id: number) => setOpenSitIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const expandAll      = () => setOpenCatIds(new Set(displayCats.map(c => c.id)))
  const collapseAll    = () => setOpenCatIds(new Set())
  const expandAllSit   = () => setOpenSitIds(new Set(displaySituations.map(s => s.id)))
  const collapseAllSit = () => setOpenSitIds(new Set())

  const buildDialogCats = (): DialogCat[] =>
    displayCats.map(c => ({
      id: c.id, name: c.name, icon: c.icon,
      color: CAT_COLORS[stageCats.indexOf(c) % CAT_COLORS.length],
      words: c.words,
    }))

  const openLearnAt = (item: KoWordItem | null, catId: string) => {
    setSelectedWord(item); setLearnInitialCatId(catId); setLearnCats(buildDialogCats()); setLearnOpen(true)
  }
  const openQuiz = (catWords: KoWordItem[], catName: string, catColor: string, catIcon = '🎯') => {
    setSelectedCatWords(catWords); setSelectedCatName(catName)
    setSelectedCatColor(catColor); setSelectedCatIcon(catIcon); setQuizOpen(true)
  }
  const openPuzzle = (catWords: KoWordItem[], catName: string, catColor: string) => {
    setSelectedCatWords(catWords); setSelectedCatName(catName); setSelectedCatColor(catColor); setPuzzleOpen(true)
  }

  const handleStageChange = (stageId: number) => {
    setActiveStage(stageId)
    setListenedIds(new Set())
    const stage = STAGES.find(s => s.id === stageId)!
    if (stage.type === 'word' || stage.type === 'review') {
      const ids = stage.catIds ? (stage.catIds as string[]) : cats.map(c => c.id)
      setSelectedCatIds(new Set(ids))
      setOpenCatIds(new Set(ids))
    }
    if (stage.type === 'sentence') {
      if (sentenceContent) {
        setSelectedSitIds(new Set(sentenceContent.situations.map(s => s.id)))
        setOpenSitIds(new Set([sentenceContent.situations[0]?.id]))
      }
    }
  }

  const WordActionBar = () => (
    <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '10px', overflow: 'hidden' }}>
      <button onClick={() => setActionBarOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '10px 16px', border: 'none', cursor: 'pointer' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>📚 학습모드</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {listenedCount} / {totalCount} 들음
          </span>
          <span style={{ color: 'white', fontSize: '0.8rem', transition: 'transform 0.3s', transform: actionBarOpen ? 'rotate(0deg)' : 'rotate(180deg)', display: 'inline-block' }}>▲</span>
        </div>
      </button>
      {actionBarOpen && (
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <button onClick={expandAll}   style={{ padding: '3px 9px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#666', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>펼치기</button>
            <button onClick={collapseAll} style={{ padding: '3px 9px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#666', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>접기</button>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#bbb', fontWeight: 600 }}>💡 그림 클릭 → 발음 &nbsp;·&nbsp; 카드 클릭 → 학습</span>
          </div>
          <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e0e0e0' }}>
            <GrpBtn label="전체 듣기" icon="▶" color="#58CC02" first disabled={quizWords.length === 0}
              onClick={() => { setSelectedCatWords(quizWords); setSelectedCatName(stageDef.subtitle); setSelectedCatColor(stageDef.color); setAutoPlayOpen(true) }} />
            <GrpBtn label="초기화" icon="↺" color="#888" textColor="#666" onClick={resetListened} />
            <GrpBtn label="음성 설정" icon="⚙" color="#7c3aed" separator onClick={() => setVoiceOpen(true)} />
            <GrpBtn label="학습 모드" icon="📖" color="#1CB0F6" disabled={quizWords.length === 0}
              onClick={() => openLearnAt(null, displayCats[0]?.id ?? '')} />
            <GrpBtn label="퀴즈 모드" icon="❓" color="#FF9600" disabled={quizWords.length === 0}
              onClick={() => openQuiz(quizWords, stageDef.subtitle, stageDef.color, stageDef.icon)} />
            <GrpBtn label="낱말 퀴즈" icon="🔤" color="#e91e63" last disabled={quizWords.length < 4}
              onClick={() => openPuzzle(quizWords, stageDef.subtitle, stageDef.color)} />
          </div>
        </div>
      )}
    </div>
  )

  const WordCategoryList = () => (
    <>
      {!wordContent ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
          <p style={{ fontWeight: 700 }}>불러오는 중...</p>
        </div>
      ) : displayCats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#aaa', background: 'white', borderRadius: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📂</p>
          <p style={{ fontWeight: 800, color: '#888', fontSize: '0.95rem' }}>주제를 선택해 주세요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayCats.map((cat, ci) => {
            const catColor = CAT_COLORS[stageCats.indexOf(cat) % CAT_COLORS.length]
            const isOpen = openCatIds.has(cat.id)
            return (
              <section key={cat.id} style={{ background: 'white', borderRadius: '18px', border: `2px solid ${catColor}33`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: isOpen ? `${catColor}12` : 'white', borderBottom: isOpen ? `2px solid ${catColor}22` : 'none', transition: 'background 0.2s' }}>
                  <button onClick={() => toggleCatOpen(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }} aria-expanded={isOpen}>
                    <span style={{ width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', background: catColor, boxShadow: `0 3px 8px ${catColor}55`, flexShrink: 0 }}>{cat.icon}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${catColor}20`, color: catColor }}>{cat.words.length}단어</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', color: '#aaa', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button onClick={() => openLearnAt(cat.words[0], cat.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '5px 9px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, background: '#58CC02', color: 'white' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>학습
                    </button>
                    <button onClick={() => openQuiz(cat.words, cat.name, catColor, cat.icon)} style={{ padding: '5px 9px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, background: '#FF9600', color: 'white' }}>퀴즈</button>
                    <button onClick={() => openPuzzle(cat.words, cat.name, catColor)} disabled={cat.words.length < 4} style={{ padding: '5px 9px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, background: '#7c3aed', color: 'white', opacity: cat.words.length < 4 ? 0.5 : 1 }}>낱말</button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', padding: '14px' }}>
                    {cat.words.map(item => (
                      <KoWordCard key={item.id} item={item} bgColor={catColor}
                        onClick={() => { openLearnAt(item, cat.id); setListenedIds(prev => new Set([...prev, item.id])) }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </>
  )

  // ── Sentence stage content (stage 3) ─────────────────────────────────────
  const SentenceFilterPanel = () => (
    <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setFilterOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#0080C8,#1CB0F6)', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>상황 필터</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {selectedSitIds.size}개 선택
          </span>
          <span style={{ color: 'white', fontSize: '0.8rem', transition: 'transform 0.3s', transform: filterOpen ? 'rotate(0deg)' : 'rotate(180deg)', display: 'inline-block' }}>▲</span>
        </div>
      </button>
      {filterOpen && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button onClick={selectAllSit} style={{ padding: '5px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, background: selectedSitIds.size === allSituations.length ? 'linear-gradient(135deg,#ef5350,#e91e63)' : 'linear-gradient(135deg,#4caf50,#66bb6a)', color: 'white' }}>
              {selectedSitIds.size === allSituations.length ? '전체 해제' : '전체 선택'}
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#e91e63', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {displaySituations.reduce((a, s) => a + s.sentences.length, 0)}문장
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {allSituations.map((sit, ci) => {
              const isActive = selectedSitIds.has(sit.id)
              const color = CAT_COLORS[ci % CAT_COLORS.length]
              return (
                <button key={sit.id} onClick={() => toggleSit(sit.id)} style={{ padding: '6px 14px', border: `2px solid ${isActive ? 'transparent' : '#e0e0e0'}`, borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, background: isActive ? color : 'white', color: isActive ? 'white' : '#555', boxShadow: isActive ? `0 3px 10px ${color}44` : 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {isActive && <span>✓ </span>}
                  {sit.emoji} {sit.name}
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>({sit.sentences.length})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const SentenceActionBar = () => (
    <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '10px', overflow: 'hidden' }}>
      <button onClick={() => setActionBarOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#0080C8,#1CB0F6)', padding: '10px 16px', border: 'none', cursor: 'pointer' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>💬 문장 학습</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {listenedCount} / {totalCount} 완료
          </span>
          <span style={{ color: 'white', fontSize: '0.8rem', transition: 'transform 0.3s', transform: actionBarOpen ? 'rotate(0deg)' : 'rotate(180deg)', display: 'inline-block' }}>▲</span>
        </div>
      </button>
      {actionBarOpen && (
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <button onClick={expandAllSit}   style={{ padding: '3px 9px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#666', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>펼치기</button>
            <button onClick={collapseAllSit} style={{ padding: '3px 9px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#666', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>접기</button>
            <button onClick={resetListened}  style={{ padding: '3px 9px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', color: '#666', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>↺ 초기화</button>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#bbb', fontWeight: 600 }}>💡 카드 클릭 → 발음 듣기 + 발음기호</span>
          </div>
        </div>
      )}
    </div>
  )

  const SentenceSituationList = () => (
    <>
      {!sentenceContent ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
          <p style={{ fontWeight: 700 }}>불러오는 중...</p>
        </div>
      ) : displaySituations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#aaa', background: 'white', borderRadius: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💬</p>
          <p style={{ fontWeight: 800, color: '#888', fontSize: '0.95rem' }}>상황을 선택해 주세요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displaySituations.map((sit, ci) => {
            const sitColor = CAT_COLORS[ci % CAT_COLORS.length]
            const isOpen = openSitIds.has(sit.id)
            const sitListened = sit.sentences.filter(s => listenedIds.has(`sent-${s.id}`)).length
            return (
              <section key={sit.id} style={{ background: 'white', borderRadius: '18px', border: `2px solid ${sitColor}33`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSitOpen(sit.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: isOpen ? `${sitColor}12` : 'white', borderBottom: isOpen ? `2px solid ${sitColor}22` : 'none', transition: 'background 0.2s', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  aria-expanded={isOpen}
                >
                  <span style={{ width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', background: sitColor, boxShadow: `0 3px 8px ${sitColor}55`, flexShrink: 0 }}>{sit.emoji}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50', flex: 1 }}>{sit.name}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${sitColor}20`, color: sitColor }}>{sit.sentences.length}문장</span>
                  {sitListened > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#d4edda', color: '#155724' }}>{sitListened}완료</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#aaa', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                    {sit.sentences.map(item => (
                      <KoSentenceCard
                        key={item.id}
                        item={item}
                        accentColor={sitColor}
                        listened={listenedIds.has(`sent-${item.id}`)}
                        onListen={() => setListenedIds(prev => new Set([...prev, `sent-${item.id}`]))}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </>
  )

  // ── Hero band subtitle per stage ─────────────────────────────────────────
  const heroTitle = activeStage === 3 ? '생활 문장 학습' : `${stageDef.subtitle} 단어 학습`
  const heroDesc  = activeStage === 3
    ? '카드를 클릭하면 발음을 듣고 발음기호를 확인할 수 있어요'
    : '그림을 클릭하면 발음을 들을 수 있어요'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f8fa' }}>

      {/* ── Sticky sub-header ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '12px' }}>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#2c3e50', lineHeight: 1 }}>한글 배우기</h1>
              <p style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600, marginTop: '3px' }}>
                {stageDef.label} &middot; {stageDef.subtitle}
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: stageDef.color, background: stageDef.light, borderRadius: '12px', padding: '4px 12px' }}>
              {listenedCount} / {totalCount} {activeStage === 3 ? '완료' : '들음'}
            </span>
          </div>

          {/* Stage tab row */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }} className="scrollbar-hide">
            {STAGES.map(s => (
              <button key={s.id} onClick={() => handleStageChange(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', border: '2px solid', borderColor: activeStage === s.id ? s.color : '#e8e8e8', borderRadius: '22px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0, background: activeStage === s.id ? s.color : 'white', color: activeStage === s.id ? 'white' : '#555', boxShadow: activeStage === s.id ? `0 4px 12px ${s.color}44` : 'none', transition: 'all 0.2s' }}>
                <span style={{ width: 22, height: 22, borderRadius: '7px', flexShrink: 0, background: activeStage === s.id ? 'rgba(0,0,0,0.18)' : s.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
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
        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, backgroundImage: `radial-gradient(circle, ${stageDef.color}33 1px, transparent 1px)`, backgroundSize: '22px 22px' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ padding: '28px 24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '12px', background: stageDef.color, color: 'white', fontSize: '0.75rem', fontWeight: 800, marginBottom: '8px', boxShadow: `0 3px 10px ${stageDef.color}55` }}>
              <span style={{ width: 18, height: 18, borderRadius: '5px', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>{stageDef.id}</span>
              {stageDef.label} &middot; {stageDef.subtitle}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2c3e50', marginBottom: '6px', lineHeight: 1.25 }}>{heroTitle}</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginBottom: '10px' }}>{heroDesc}</p>
            {activeStage === 3 ? (
              sentenceContent && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '4px 12px', borderRadius: '10px', background: stageDef.color, color: 'white' }}>
                    {sentenceContent.situations.reduce((a, s) => a + s.sentences.length, 0)}개 문장
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>
                    {sentenceContent.situations.length}가지 상황
                  </span>
                </div>
              )
            ) : (
              wordContent && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '4px 12px', borderRadius: '10px', background: stageDef.color, color: 'white' }}>{quizWords.length}개 단어</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>+{quizWords.length * 5} XP</span>
                </div>
              )
            )}
          </div>
          <StageIllustration id={activeStage} />
        </div>
      </div>

      {/* ── Category multi-select chips (word stages) ── */}
      {activeStage !== 3 && wordContent && (
        <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: '152px', zIndex: 20 }}>
          <div className="max-w-5xl mx-auto px-3 sm:px-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '10px 0' }} className="scrollbar-hide">
              {/* 전체 선택 토글 */}
              <button
                onClick={selectAll}
                style={{
                  flexShrink: 0, padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800,
                  background: selectedCatIds.size === stageCats.length
                    ? 'linear-gradient(135deg,#ef5350,#e91e63)' : 'linear-gradient(135deg,#4caf50,#66bb6a)',
                  color: 'white', whiteSpace: 'nowrap',
                }}
              >
                {selectedCatIds.size === stageCats.length ? '전체 해제' : '전체'}
              </button>
              <div style={{ width: '1.5px', height: '22px', background: '#e8e8e8', flexShrink: 0 }} />
              {stageCats.map((cat, ci) => {
                const isActive = selectedCatIds.has(cat.id)
                const color = CAT_COLORS[ci % CAT_COLORS.length]
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px',
                      border: `2px solid ${isActive ? 'transparent' : '#e8e8e8'}`,
                      borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap',
                      background: isActive ? color : 'white',
                      color: isActive ? 'white' : '#666',
                      boxShadow: isActive ? `0 3px 10px ${color}44` : 'none',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    {isActive && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                    {cat.icon} {cat.name}
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({cat.words.length})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Situation multi-select chips (sentence stage) ── */}
      {activeStage === 3 && sentenceContent && (
        <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: '152px', zIndex: 20 }}>
          <div className="max-w-5xl mx-auto px-3 sm:px-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '10px 0' }} className="scrollbar-hide">
              <button
                onClick={selectAllSit}
                style={{
                  flexShrink: 0, padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap',
                  background: selectedSitIds.size === allSituations.length
                    ? 'linear-gradient(135deg,#ef5350,#e91e63)' : 'linear-gradient(135deg,#4caf50,#66bb6a)',
                  color: 'white',
                }}
              >
                {selectedSitIds.size === allSituations.length ? '전체 해제' : '전체'}
              </button>
              <div style={{ width: '1.5px', height: '22px', background: '#e8e8e8', flexShrink: 0 }} />
              {allSituations.map((sit, ci) => {
                const isActive = selectedSitIds.has(sit.id)
                const color = CAT_COLORS[ci % CAT_COLORS.length]
                return (
                  <button
                    key={sit.id}
                    onClick={() => toggleSit(sit.id)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '6px 14px',
                      border: `2px solid ${isActive ? 'transparent' : '#e8e8e8'}`,
                      borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap',
                      background: isActive ? color : 'white', color: isActive ? 'white' : '#666',
                      boxShadow: isActive ? `0 3px 10px ${color}44` : 'none',
                      transform: isActive ? 'translateY(-1px)' : 'none', transition: 'all 0.18s',
                    }}
                  >
                    {isActive && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                    {sit.emoji} {sit.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4" style={{ paddingTop: '16px' }}>

        {activeStage === 3 ? (
          /* ── 3단계: 생활 문장 ── */
          <>
            {sentenceContent && <SentenceFilterPanel />}
            {sentenceContent && <SentenceActionBar />}
            <SentenceSituationList />
          </>
        ) : activeStage === 4 ? (
          /* ── 4단계: 전체 복습 (단어 + 문장) ── */
          <>
            {wordContent && <WordActionBar />}
            <WordCategoryList />
            {sentenceContent && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, height: '2px', background: '#e8e8e8', borderRadius: '1px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1CB0F6', padding: '4px 14px', background: '#D6F0FF', borderRadius: '12px' }}>💬 생활 문장 복습</span>
                  <div style={{ flex: 1, height: '2px', background: '#e8e8e8', borderRadius: '1px' }} />
                </div>
                <SentenceFilterPanel />
                <SentenceSituationList />
              </div>
            )}
          </>
        ) : (
          /* ── 1단계 / 2단계: 단어 ── */
          <>
            {wordContent && <WordActionBar />}
            <WordCategoryList />
          </>
        )}
      </div>

      {/* ── Dialogs ── */}
      {learnOpen && (
        <KoLearnDialog cats={learnCats} initialCatId={learnInitialCatId} initialWord={selectedWord ?? undefined}
          onClose={() => { setLearnOpen(false); setSelectedWord(null) }} />
      )}
      {quizOpen && (
        <KoQuizDialog words={selectedCatWords} allWords={cats.flatMap(c => c.words)}
          catName={selectedCatName} catColor={selectedCatColor} catIcon={selectedCatIcon}
          onClose={() => setQuizOpen(false)} />
      )}
      {puzzleOpen && (
        <KoPuzzleDialog words={selectedCatWords} catName={selectedCatName} catColor={selectedCatColor}
          onClose={() => setPuzzleOpen(false)} />
      )}
      {voiceOpen && (
        <KoVoiceSettingsDialog settings={settings} onChange={updateVoice} onClose={() => setVoiceOpen(false)} />
      )}
      {autoPlayOpen && (
        <KoAutoPlayDialog words={selectedCatWords} catName={selectedCatName} catColor={selectedCatColor}
          settings={settings} listenedIds={listenedIds}
          onListened={id => setListenedIds(prev => new Set([...prev, id]))}
          onClose={() => setAutoPlayOpen(false)} />
      )}
    </div>
  )
}
