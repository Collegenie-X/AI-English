'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFFICULTIES = [
  { id: 'easy',   label: '초급', grid: 4, targetCount: 3, color: '#4caf50', badge: '🟢' },
  { id: 'medium', label: '중급', grid: 5, targetCount: 5, color: '#FF9800', badge: '🟡' },
  { id: 'hard',   label: '고급', grid: 6, targetCount: 7, color: '#e91e63', badge: '🔴' },
]

type DiffId = 'easy' | 'medium' | 'hard'
type Dir = 'h' | 'v'

interface Placement { word: string; startR: number; startC: number; dir: Dir }

// ── Shuffle ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── Build letter grid with hidden words ───────────────────────────────────────
function buildGrid(size: number, words: string[]): { grid: string[][]; placements: Placement[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))
  const placements: Placement[] = []
  const KOREAN_COMMON = '가나다라마바사아자차카타파하강산물바람구름하늘빛꽃별눈비해달'
  const rand = () => KOREAN_COMMON[Math.floor(Math.random() * KOREAN_COMMON.length)]

  for (const word of words) {
    const syls = Array.from(word)
    if (syls.length > size) continue
    let placed = false
    for (let attempt = 0; attempt < 80; attempt++) {
      const dir: Dir = Math.random() < 0.5 ? 'h' : 'v'
      const maxR = dir === 'h' ? size - 1 : size - syls.length
      const maxC = dir === 'h' ? size - syls.length : size - 1
      if (maxR < 0 || maxC < 0) continue
      const r = Math.floor(Math.random() * (maxR + 1))
      const c = Math.floor(Math.random() * (maxC + 1))
      // Check no conflict
      let ok = true
      for (let i = 0; i < syls.length; i++) {
        const rr = dir === 'h' ? r : r + i
        const cc = dir === 'h' ? c + i : c
        if (grid[rr][cc] !== '' && grid[rr][cc] !== syls[i]) { ok = false; break }
      }
      if (!ok) continue
      for (let i = 0; i < syls.length; i++) {
        const rr = dir === 'h' ? r : r + i
        const cc = dir === 'h' ? c + i : c
        grid[rr][cc] = syls[i]
      }
      placements.push({ word, startR: r, startC: c, dir })
      placed = true
      break
    }
    if (!placed) {
      // Force place in first available row gap (simplified fallback)
      for (let r = 0; r < size && !placed; r++) {
        for (let c = 0; c <= size - syls.length && !placed; c++) {
          if (syls.every((s, i) => grid[r][c + i] === '' || grid[r][c + i] === s)) {
            syls.forEach((s, i) => { grid[r][c + i] = s })
            placements.push({ word, startR: r, startC: c, dir: 'h' })
            placed = true
          }
        }
      }
    }
  }

  // Fill empty cells with random syllables
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') grid[r][c] = rand()
    }
  }
  return { grid, placements }
}

// ── Get cells for a placement ─────────────────────────────────────────────────
function getCells(p: Placement): [number, number][] {
  const syls = Array.from(p.word)
  return syls.map((_, i) => [
    p.dir === 'h' ? p.startR : p.startR + i,
    p.dir === 'h' ? p.startC + i : p.startC,
  ])
}

interface KoPuzzleDialogProps {
  words: KoWordItem[]
  catName: string
  catColor: string
  onClose: () => void
}

export function KoPuzzleDialog({ words, catName, catColor, onClose }: KoPuzzleDialogProps) {
  const [diff, setDiff] = useState<DiffId>('easy')
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'done'>('setup')
  const [grid, setGrid] = useState<string[][]>([])
  const [placements, setPlacements] = useState<Placement[]>([])
  const [targets, setTargets] = useState<KoWordItem[]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<[number, number][]>([])
  const [wrongCells, setWrongCells] = useState<[number, number][]>([])
  const [correctCells, setCorrectCells] = useState<[number, number][]>([])
  const { speak } = useTTS()

  const diffCfg = DIFFICULTIES.find(d => d.id === diff)!

  const startGame = useCallback(() => {
    const wordPool = words.filter(w => Array.from(w.word).length <= diffCfg.grid)
    const chosen = shuffle(wordPool).slice(0, diffCfg.targetCount)
    const wordStrings = chosen.map(w => w.word)
    const { grid: g, placements: ps } = buildGrid(diffCfg.grid, wordStrings)
    setGrid(g)
    setPlacements(ps)
    setTargets(chosen)
    setFoundWords(new Set())
    setSelected([])
    setWrongCells([])
    setCorrectCells([])
    setGameState('playing')
  }, [words, diffCfg])

  const isCellSelected = (r: number, c: number) =>
    selected.some(([sr, sc]) => sr === r && sc === c)
  const isCellWrong = (r: number, c: number) =>
    wrongCells.some(([wr, wc]) => wr === r && wc === c)
  const isCellCorrect = (r: number, c: number) =>
    correctCells.some(([cr, cc]) => cr === r && cc === c)

  // Check if selected cells form a valid straight line sequence
  const isValidLine = (cells: [number, number][]): boolean => {
    if (cells.length < 2) return true
    const rows = cells.map(([r]) => r)
    const cols = cells.map(([, c]) => c)
    const allSameRow = rows.every(r => r === rows[0])
    const allSameCol = cols.every(c => c === cols[0])
    if (!allSameRow && !allSameCol) return false
    // Check contiguous
    if (allSameRow) {
      const sorted = [...cols].sort((a, b) => a - b)
      return sorted.every((c, i) => i === 0 || c === sorted[i - 1] + 1)
    } else {
      const sorted = [...rows].sort((a, b) => a - b)
      return sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1)
    }
  }

  const tapCell = (r: number, c: number) => {
    if (isCellCorrect(r, c)) return

    const alreadySel = isCellSelected(r, c)
    if (alreadySel) {
      // deselect last
      setSelected(prev => prev.slice(0, -1))
      return
    }

    const newSel: [number, number][] = [...selected, [r, c]]
    if (!isValidLine(newSel)) {
      // Flash wrong and reset
      setWrongCells(newSel)
      setTimeout(() => setWrongCells([]), 500)
      setSelected([])
      return
    }

    setSelected(newSel)

    // Check if selected cells match any placement
    const selWord = newSel.map(([sr, sc]) => grid[sr][sc]).join('')
    const matchPlacement = placements.find(p => {
      const cells = getCells(p)
      if (cells.length !== newSel.length) return false
      return cells.every(([pr, pc], i) => pr === newSel[i][0] && pc === newSel[i][1])
    })

    if (matchPlacement && !foundWords.has(matchPlacement.word)) {
      const newFound = new Set(foundWords)
      newFound.add(matchPlacement.word)
      setFoundWords(newFound)
      setCorrectCells(prev => [...prev, ...newSel])
      setSelected([])
      speak(matchPlacement.word, 'ko-KR', 0.9)
      speak('잘했어요!', 'ko-KR')
      if (newFound.size >= targets.length) {
        setTimeout(() => setGameState('done'), 800)
      }
    }
  }

  // Keyboard esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const progress = targets.length > 0 ? (foundWords.size / targets.length) * 100 : 0

  // ── Done screen ────────────────────────────────────────────────────────────
  if (gameState === 'done') {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()}>
          <div className="dialog-header-gradient" style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>퍼즐 완성!</span>
            <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
          </div>
          <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '4.5rem', lineHeight: 1 }}>🎉</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>모두 찾았어요!</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {targets.map(t => (
                <button key={t.id} onClick={() => speak(t.word, 'ko-KR', 0.9)}
                  style={{ padding: '6px 16px', background: '#f3e5f5', border: '2px solid #e0c8f8', borderRadius: '14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', color: '#6a1b9a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {t.emoji} {t.word}
                </button>
              ))}
            </div>
            <div style={{ background: '#FFF9C4', borderRadius: '14px', padding: '8px 24px', border: '2px solid #FFD700' }}>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#9a7000' }}>+{targets.length * 15} XP</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '280px' }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: '14px', background: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                닫기
              </button>
              <button onClick={startGame}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', color: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                다시
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup screen ───────────────────────────────────────────────────────────
  if (gameState === 'setup') {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()}>
          <div className="dialog-header-gradient" style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)' }}>
            <div>
              <p style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>🧩 낱말 퍼즐</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0, marginTop: '2px' }}>{catName} · {words.length}단어 풀</p>
            </div>
            <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
          </div>

          <div style={{ padding: '24px 20px 32px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#aaa', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>난이도 선택</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {DIFFICULTIES.map(d => (
                <button key={d.id} onClick={() => setDiff(d.id as DiffId)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: `2px solid ${diff === d.id ? d.color : '#e8e0f0'}`, borderRadius: '16px', background: diff === d.id ? `${d.color}12` : 'white', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: diff === d.id ? `0 4px 14px ${d.color}30` : 'none' }}>
                  <span style={{ fontSize: '1.4rem' }}>{d.badge}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: diff === d.id ? d.color : '#333' }}>{d.label}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa', fontWeight: 600 }}>{d.grid}×{d.grid} 격자 · {d.targetCount}단어 찾기</p>
                  </div>
                  {diff === d.id && (
                    <span style={{ marginLeft: 'auto', color: d.color, fontWeight: 900, fontSize: '1.1rem' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <button onClick={startGame}
              style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '18px', background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', color: 'white', fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>
              퍼즐 시작
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  const gridSize = diffCfg.grid
  const cellSize = Math.min(48, Math.floor((Math.min(320, window.innerWidth - 80)) / gridSize))

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>
        {/* Purple gradient header */}
        <div className="dialog-header-gradient" style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem' }}>🧩 낱말 퍼즐</span>
            <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: '10px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{diffCfg.badge} {diffCfg.label}</span>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600 }}>{foundWords.size}/{targets.length}</span>
            <button onClick={startGame}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '10px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }}>
              새로고침
            </button>
          </div>
          <button className="dialog-close-btn" onClick={onClose} style={{ marginLeft: '8px' }} aria-label="닫기">✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '5px', background: '#ede7f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: diffCfg.color, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Target words row */}
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>찾아야 할 단어</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {targets.map(t => {
                const found = foundWords.has(t.word)
                return (
                  <button key={t.id} onClick={() => speak(t.word, 'ko-KR', 0.9)}
                    className="puzzle-target-card"
                    style={{ minWidth: '72px', background: found ? '#e8f5e9' : '#f3e5f5', border: `2px solid ${found ? '#a5d6a7' : '#e0c8f8'}` }}
                    aria-label={`${t.word} 듣기`}>
                    <div style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: '3px', filter: found ? 'none' : 'grayscale(0.3)' }}>{t.emoji}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: found ? '#2e7d32' : '#6a1b9a', textDecoration: found ? 'line-through' : 'none' }}>{t.word}</div>
                    {found && <div style={{ fontSize: '0.7rem', color: '#4caf50', fontWeight: 700 }}>찾음!</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <p style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, textAlign: 'center', margin: 0 }}>
            격자에서 단어의 글자들을 순서대로 탭하세요
          </p>

          {/* Letter grid */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="puzzle-letter-grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)` }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isSelected = isCellSelected(r, c)
                  const isWrong    = isCellWrong(r, c)
                  const isCorrect  = isCellCorrect(r, c)
                  let bg = 'white', borderCol = '#e8e0f0', textCol = '#333'
                  if (isCorrect) { bg = '#4caf50'; borderCol = '#388e3c'; textCol = 'white' }
                  else if (isWrong)   { bg = '#ef5350'; borderCol = '#c62828'; textCol = 'white' }
                  else if (isSelected){ bg = '#ede7f6'; borderCol = '#7c3aed'; textCol = '#7c3aed' }
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => !isCorrect && tapCell(r, c)}
                      style={{
                        width: `${cellSize}px`, height: `${cellSize}px`,
                        borderRadius: '10px', border: `2px solid ${borderCol}`,
                        background: bg, color: textCol,
                        fontFamily: 'inherit', fontWeight: 900, fontSize: `${Math.max(14, cellSize * 0.42)}px`,
                        cursor: isCorrect ? 'default' : 'pointer',
                        transition: 'all 0.12s',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      aria-label={cell}
                    >
                      {cell}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Clear selection button */}
          {selected.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setSelected([])}
                style={{ padding: '7px 20px', border: '2px solid #e0e0e0', borderRadius: '14px', background: 'white', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#aaa' }}>
                선택 취소 ({selected.map(([r, c]) => grid[r]?.[c]).join('')})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
