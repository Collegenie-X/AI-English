'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { KoWordItem } from '@/types/content'
import { KoPhonicsDialog, type WordWithCat } from '@/components/dialog/KoPhonicsDialog'

const SYL_COLORS = [
  { bg: '#7c3aed', text: 'white' },
  { bg: '#ec4899', text: 'white' },
  { bg: '#0ea5e9', text: 'white' },
  { bg: '#10b981', text: 'white' },
  { bg: '#f97316', text: 'white' },
]

export interface DialogCat {
  id: string
  name: string
  icon: string
  color: string
  words: KoWordItem[]
}

interface KoLearnDialogProps {
  cats: DialogCat[]
  initialCatId?: string
  initialWord?: KoWordItem
  onClose: () => void
}

function speakSentence(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang  = 'ko-KR'
  u.rate  = 0.72
  u.pitch = 1.05
  window.speechSynthesis.speak(u)
}

function speakSyllable(s: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(s + '.')
  u.lang  = 'ko-KR'
  u.rate  = 0.65
  u.pitch = 1.1
  window.speechSynthesis.speak(u)
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ── 단어 + 어떤 카테고리 색인지 함께 보관 ──
interface PoolItem {
  word: KoWordItem
  catColor: string
  catName: string
}

export function KoLearnDialog({ cats, initialCatId, initialWord, onClose }: KoLearnDialogProps) {
  // 멀티 선택 상태 — 초기값: initialCatId 가 있으면 그 카테고리만, 없으면 전체
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(
    () => new Set(initialCatId ? [initialCatId] : cats.map(c => c.id))
  )

  // 현재 보여줄 단어 풀 (선택된 카테고리 합산 후 셔플)
  const [pool, setPool] = useState<PoolItem[]>([])
  const [idx, setIdx]   = useState(0)

  const [autoPlay, setAutoPlay]     = useState(false)
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [speaking, setSpeaking]     = useState(false)
  const [phonicsSyl, setPhonics]    = useState<{ syllable: string; sylIdx: number } | null>(null)
  const [shuffleAnim, setShuffleAnim] = useState(false)
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allWordsWithCat: WordWithCat[] = cats.flatMap(c =>
    c.words.map(w => ({ word: w, catColor: c.color }))
  )

  // ── 풀 빌드 ──
  const buildPool = useCallback((ids: Set<string>, startWord?: KoWordItem): PoolItem[] => {
    const raw = cats
      .filter(c => ids.has(c.id))
      .flatMap(c => c.words.map(w => ({ word: w, catColor: c.color, catName: c.name })))
    const shuffled = shuffleArray(raw)
    if (startWord) {
      const si = shuffled.findIndex(p => p.word.id === startWord.id)
      if (si > 0) { const [el] = shuffled.splice(si, 1); shuffled.unshift(el) }
    }
    return shuffled
  }, [cats])

  // 초기 풀 생성
  useEffect(() => {
    const initial = buildPool(selectedCatIds, initialWord)
    setPool(initial)
    setIdx(0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPool = () => {
    window.speechSynthesis?.cancel()
    setAutoPlay(false)
    setSpeaking(false)
    setShuffleAnim(true)
    setTimeout(() => setShuffleAnim(false), 400)
    const newPool = buildPool(selectedCatIds)
    setPool(newPool)
    setIdx(0)
  }

  // 카테고리 토글
  const toggleCat = (catId: string) => {
    setSelectedCatIds(prev => {
      const next = new Set(prev)
      if (next.has(catId) && next.size === 1) return prev  // 마지막 하나는 해제 불가
      next.has(catId) ? next.delete(catId) : next.add(catId)
      // 선택 변경 시 즉시 새 풀 빌드
      const newPool = buildPool(next)
      setPool(newPool)
      setIdx(0)
      window.speechSynthesis?.cancel()
      setAutoPlay(false)
      return next
    })
  }

  const item      = pool[idx]?.word
  const catColor  = pool[idx]?.catColor ?? cats[0]?.color ?? '#58CC02'
  const catName   = pool[idx]?.catName  ?? ''
  const syllables = item ? Array.from(item.word) : []

  const playWord = useCallback(() => {
    if (!item) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(item.word)
    u.lang    = 'ko-KR'
    u.rate    = 0.82
    u.pitch   = 1.1
    u.onstart = () => setSpeaking(true)
    u.onend   = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [item])

  // 단어 바뀔 때 자동 발음
  useEffect(() => {
    if (!item) return
    const t = setTimeout(playWord, 280)
    return () => clearTimeout(t)
  }, [idx, pool]) // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 재생
  useEffect(() => {
    if (!autoPlay) return
    autoRef.current = setTimeout(() => {
      if (idx < pool.length - 1) setIdx(i => i + 1)
      else setAutoPlay(false)
    }, 2600)
    return () => { if (autoRef.current) clearTimeout(autoRef.current) }
  }, [autoPlay, idx, pool.length])

  // 키보드 네비게이션
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { onClose(); return }
      if (e.key === 'ArrowLeft')  { setAutoPlay(false); setIdx(i => Math.max(0, i - 1)) }
      if (e.key === 'ArrowRight') { setAutoPlay(false); setIdx(i => Math.min(pool.length - 1, i + 1)) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, pool.length])

  const handlePrev = () => { setAutoPlay(false); setIdx(i => Math.max(0, i - 1)) }
  const handleNext = () => { setAutoPlay(false); setIdx(i => Math.min(pool.length - 1, i + 1)) }

  const pct = pool.length > 0 ? ((idx + 1) / pool.length) * 100 : 0

  // 선택된 카테고리 수
  const selectedCount = selectedCatIds.size

  if (!item) return null

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal aria-label={`${item.word} 학습`}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()} style={{ overflow: 'hidden' }}>

        {/* ── Gradient header ── */}
        <div
          className="dialog-header-gradient"
          style={{ background: `linear-gradient(135deg, ${currentCatColor}, ${currentCatColor}bb)` }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>{catName}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600 }}>
              {item.word} · {item.meaning}
            </span>
          </div>
          <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* ── Multi-select category tabs ── */}
        {cats.length > 1 && (
          <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
            <div
              style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 12px 8px' }}
              className="scrollbar-hide"
            >
              {/* 전체 선택/해제 버튼 */}
              <button
                onClick={() => {
                  const allIds = new Set(cats.map(c => c.id))
                  const isAll  = selectedCatIds.size === cats.length
                  const next   = isAll ? new Set([cats[0].id]) : allIds
                  setSelectedCatIds(next)
                  const newPool = buildPool(next)
                  setPool(newPool); setIdx(0)
                  window.speechSynthesis?.cancel(); setAutoPlay(false)
                }}
                style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '20px', border: 'none',
                  background: selectedCatIds.size === cats.length
                    ? 'linear-gradient(135deg,#7c3aed,#9d4edd)' : '#f0f0f0',
                  color: selectedCatIds.size === cats.length ? 'white' : '#888',
                  fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                }}
              >
                {selectedCatIds.size === cats.length ? '✓ 전체' : '전체'}
              </button>

              <div style={{ width: '1px', height: '24px', background: '#e0e0e0', flexShrink: 0, alignSelf: 'center' }} />

              {cats.map(cat => {
                const isActive = selectedCatIds.has(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '5px 12px', borderRadius: '20px',
                      border: `2px solid ${isActive ? cat.color : '#e0e0e0'}`,
                      background: isActive ? cat.color : 'white',
                      color: isActive ? 'white' : '#666',
                      fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800,
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: isActive ? `0 3px 8px ${cat.color}44` : 'none',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                      opacity: selectedCatIds.size === 1 && isActive ? 1 : 1,
                    }}
                    title={selectedCatIds.size === 1 && isActive ? '최소 1개 선택 필요' : ''}
                  >
                    {isActive && <span style={{ fontSize: '0.65rem' }}>✓</span>}
                    <span style={{ fontSize: '0.9rem' }}>{cat.icon}</span>
                    {cat.name}
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({cat.words.length})</span>
                  </button>
                )
              })}
            </div>

            {/* 선택 요약 + 새로고침 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>
                {selectedCount}개 선택 · 총 {pool.length}단어
              </span>
              <button
                onClick={refreshPool}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 13px', borderRadius: '14px',
                  border: `1.5px solid ${catColor}55`,
                  background: `${catColor}10`, color: catColor,
                  fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = catColor + '22')}
                onMouseLeave={e => (e.currentTarget.style.background = catColor + '10')}
                aria-label="단어 순서 새로고침"
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform 0.4s', transform: shuffleAnim ? 'rotate(360deg)' : 'none' }}
                >
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                새로고침
              </button>
            </div>
          </div>
        )}

        {/* ── Progress bar ── */}
        <div style={{ height: '5px', background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: currentCatColor, width: `${pct}%`, transition: 'width 0.45s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>

        {/* ── Hero: left-nav · emoji · right-nav ── */}
        <div style={{
          background: `linear-gradient(160deg, ${catColor}22 0%, ${catColor}0a 100%)`,
          padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 0,
        }}>
          {/* ← Prev */}
          <button
            onClick={handlePrev} disabled={idx === 0} aria-label="이전"
            style={{
              width: 44, height: 44, flexShrink: 0,
              border: '2px solid', borderColor: idx === 0 ? '#e0e0e0' : catColor + '88',
              borderRadius: '50%',
              background: idx === 0 ? '#f5f5f5' : 'white',
              color: idx === 0 ? '#ccc' : catColor,
              cursor: idx === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 900, fontFamily: 'inherit',
              boxShadow: idx === 0 ? 'none' : `0 2px 10px ${catColor}33`,
              margin: '0 10px 0 14px', transition: 'all 0.15s',
            }}
          >◀</button>

          {/* Center */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div
              onClick={playWord} role="button" aria-label={`${item.word} 듣기`}
              style={{
                background: catColor, borderRadius: '28px', width: '138px', height: '138px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: speaking
                  ? `0 8px 40px ${catColor}88, 0 0 0 8px ${catColor}33`
                  : `0 6px 24px ${catColor}55`,
                cursor: 'pointer', userSelect: 'none', transition: 'box-shadow 0.2s',
                animation: speaking ? 'talkPulse 0.55s ease-in-out infinite alternate' : 'none',
              }}
            >
              <span style={{ fontSize: '76px', lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.15))', display: 'block' }}>
                {item.emoji}
              </span>
            </div>

            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-1px', margin: 0 }}>
              {item.word}
            </p>

            <div className={`audio-wave ${speaking ? '' : 'paused'}`} style={{ height: '28px' }}>
              {[10, 18, 26, 20, 14, 20, 26].map((h, i) => (
                <div key={i} className="wave-bar" style={{ background: catColor, height: `${h}px` }} />
              ))}
            </div>

            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#aaa' }}>
              {idx + 1} / {pool.length}
            </span>
          </div>

          {/* → Next */}
          <button
            onClick={handleNext} disabled={idx === pool.length - 1} aria-label="다음"
            style={{
              width: 44, height: 44, flexShrink: 0,
              border: 'none', borderRadius: '50%',
              background: idx === pool.length - 1 ? '#f5f5f5' : catColor,
              color: idx === pool.length - 1 ? '#ccc' : 'white',
              cursor: idx === pool.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 900, fontFamily: 'inherit',
              boxShadow: idx === pool.length - 1 ? 'none' : `0 4px 16px ${catColor}55`,
              margin: '0 14px 0 10px', transition: 'all 0.15s',
            }}
          >▶</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Syllable blocks */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {syllables.map((s, i) => {
              const sc = SYL_COLORS[i % SYL_COLORS.length]
              const isPlaying = playingIdx === i
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPlayingIdx(i); speakSyllable(s)
                    setTimeout(() => setPlayingIdx(null), 900)
                    setPhonics({ syllable: s, sylIdx: i })
                  }}
                  style={{
                    background: sc.bg, color: sc.text,
                    minWidth: '56px', borderRadius: '16px', border: 'none',
                    fontFamily: 'inherit', cursor: 'pointer',
                    padding: '12px 16px', fontSize: '1.65rem', fontWeight: 900,
                    boxShadow: `0 4px 16px rgba(0,0,0,0.18)`,
                    transition: 'transform 0.15s, filter 0.15s',
                    transform: isPlaying ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={`${s} 음운 분석`}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {/* 영어 표현 chip */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 16px', borderRadius: '20px',
              background: catColor + '18', color: catColor,
              fontWeight: 800, fontSize: '0.9rem',
              border: `1.5px solid ${catColor}33`,
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>영어</span>
              {item.meaning}
            </span>
          </div>

          {/* Example sentences */}
          {item.sentences?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>예문</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {item.sentences.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => speakSentence(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: `${catColor}0f`, border: `1.5px solid ${catColor}22`,
                      borderRadius: '14px', padding: '10px 14px',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', width: '100%', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${currentCatColor}22`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${currentCatColor}0f`)}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0, color: catColor }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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

          {/* Auto-play + Re-listen */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAutoPlay(v => !v)}
              style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '14px',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                background: autoPlay ? `linear-gradient(135deg,${catColor},${catColor}bb)` : '#f0f2f5',
                color: autoPlay ? 'white' : '#666',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s', boxShadow: autoPlay ? `0 4px 16px ${catColor}44` : 'none',
              }}
            >
              {autoPlay ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>자동재생 중</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>자동재생</>
              )}
            </button>
            <button
              onClick={playWord}
              style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '14px',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                background: '#e8f5e9', color: '#2e7d32',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="3,8 3,16 7,16 13,21 13,3 7,8" />
                <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              다시듣기
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes talkPulse {
          from { transform: scale(1.0); }
          to   { transform: scale(1.07); }
        }
      `}</style>

      {phonicsSyl && (
        <KoPhonicsDialog
          syllable={phonicsSyl.syllable}
          sylIdx={phonicsSyl.sylIdx}
          excludeId={item.id}
          allWords={allWordsWithCat}
          onClose={() => setPhonics(null)}
        />
      )}
    </div>
  )
}
