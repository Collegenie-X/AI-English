'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

// ── Config ────────────────────────────────────────────────────────────────────
const PUZZLE_CONFIG = {
  easy:   { label: '초급', grid: 4, targetCount: 3, totalRounds: 3, color: '#4caf50', badge: '🟢', dirs: ['h'] as Dir[] },
  medium: { label: '중급', grid: 5, targetCount: 3, totalRounds: 3, color: '#FF9800', badge: '🟡', dirs: ['h', 'v'] as Dir[] },
  hard:   { label: '고급', grid: 6, targetCount: 3, totalRounds: 3, color: '#e91e63', badge: '🔴', dirs: ['h', 'v'] as Dir[] },
}

type DiffId = keyof typeof PUZZLE_CONFIG
type Dir = 'h' | 'v'

interface Placement { word: string; startR: number; startC: number; dir: Dir }

const FILL_CHARS = '가나다라마바사아자차카타파하강산물바람구름하늘빛꽃별눈비해달'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── Grid builder ──────────────────────────────────────────────────────────────
function buildGrid(size: number, words: string[], dirs: Dir[]): { grid: string[][]; placements: Placement[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))
  const placements: Placement[] = []
  const rand = () => FILL_CHARS[Math.floor(Math.random() * FILL_CHARS.length)]

  for (const word of words) {
    const syls = Array.from(word)
    if (syls.length > size) continue
    let placed = false

    for (let attempt = 0; attempt < 100; attempt++) {
      const dir: Dir = dirs[Math.floor(Math.random() * dirs.length)]
      const maxR = dir === 'h' ? size - 1 : size - syls.length
      const maxC = dir === 'h' ? size - syls.length : size - 1
      if (maxR < 0 || maxC < 0) continue
      const r = Math.floor(Math.random() * (maxR + 1))
      const c = Math.floor(Math.random() * (maxC + 1))

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

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === '') grid[r][c] = rand()

  return { grid, placements }
}

function getCells(p: Placement): [number, number][] {
  const syls = Array.from(p.word)
  return syls.map((_, i) => [
    p.dir === 'h' ? p.startR : p.startR + i,
    p.dir === 'h' ? p.startC + i : p.startC,
  ])
}

function isValidLine(cells: [number, number][]): boolean {
  if (cells.length < 2) return true
  const rows = cells.map(([r]) => r)
  const cols = cells.map(([, c]) => c)
  const allSameRow = rows.every(r => r === rows[0])
  const allSameCol = cols.every(c => c === cols[0])
  if (!allSameRow && !allSameCol) return false
  if (allSameRow) {
    const sorted = [...cols].sort((a, b) => a - b)
    return sorted.every((c, i) => i === 0 || c === sorted[i - 1] + 1)
  }
  const sorted = [...rows].sort((a, b) => a - b)
  return sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1)
}

// ── Correct-answer flash effect ───────────────────────────────────────────────
function showCorrectFlash(word: string) {
  if (typeof document === 'undefined') return
  const el = document.createElement('div')
  el.textContent = `🎉 ${word}`
  el.style.cssText = [
    'position:fixed', 'left:50%', 'top:38%',
    'transform:translate(-50%,-50%)',
    'font-size:2rem', 'font-weight:900',
    'color:#7E57C2', 'z-index:99999',
    'pointer-events:none', 'white-space:nowrap',
    'animation:correctFlash 0.85s ease forwards',
  ].join(';')
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 900)

  for (let i = 0; i < 6; i++) {
    const star = document.createElement('div')
    star.textContent = ['⭐', '✨', '🌟', '💫'][i % 4]
    const angle = (i / 6) * 360
    const dist = 70 + Math.random() * 40
    star.style.cssText = [
      'position:fixed',
      `left:calc(50% + ${Math.cos((angle * Math.PI) / 180) * dist}px)`,
      `top:calc(38% + ${Math.sin((angle * Math.PI) / 180) * dist}px)`,
      'font-size:1.4rem', 'z-index:99998',
      'pointer-events:none',
      'animation:starPop 0.7s ease forwards',
    ].join(';')
    document.body.appendChild(star)
    setTimeout(() => star.remove(), 750)
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface KoPuzzleDialogProps {
  words: KoWordItem[]
  catName: string
  catColor: string
  onClose: () => void
}

// ── Main component ────────────────────────────────────────────────────────────
export function KoPuzzleDialog({ words, onClose }: KoPuzzleDialogProps) {
  const { speak } = useTTS()
  const [diff, setDiff] = useState<DiffId>('easy')
  const [round, setRound] = useState(1)
  const [targets, setTargets] = useState<KoWordItem[]>([])
  const [grid, setGrid] = useState<string[][]>([])
  const [placements, setPlacements] = useState<Placement[]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [totalFound, setTotalFound] = useState(0)
  const [selected, setSelected] = useState<[number, number][]>([])
  const [wrongCells, setWrongCells] = useState<[number, number][]>([])
  const [correctCells, setCorrectCells] = useState<[number, number][]>([])
  const [isDone, setIsDone] = useState(false)
  const usedIdsRef = useRef<Set<string>>(new Set())
  const dragActiveRef = useRef(false)
  const dragCellsRef = useRef<[number, number][]>([])
  const gridRef = useRef<HTMLDivElement>(null)

  const cfg = PUZZLE_CONFIG[diff]

  const startRound = useCallback((diffId: DiffId, roundNum: number, usedIds: Set<string>) => {
    const config = PUZZLE_CONFIG[diffId]
    const pool = words.filter(w => Array.from(w.word).length <= config.grid)
    const unused = pool.filter(w => !usedIds.has(w.id))
    const usePool = unused.length >= config.targetCount ? unused : pool
    const chosen = shuffle(usePool).slice(0, config.targetCount)
    chosen.forEach(w => usedIds.add(w.id))

    const { grid: g, placements: ps } = buildGrid(config.grid, chosen.map(w => w.word), config.dirs)
    setTargets(chosen)
    setGrid(g)
    setPlacements(ps)
    setFoundWords(new Set())
    setSelected([])
    setWrongCells([])
    setCorrectCells([])
    setRound(roundNum)
    setIsDone(false)
  }, [words])

  const initGame = useCallback((diffId: DiffId) => {
    usedIdsRef.current = new Set()
    setTotalFound(0)
    startRound(diffId, 1, usedIdsRef.current)
  }, [startRound])

  useEffect(() => { initGame('easy') }, [initGame])

  const changeDiff = (d: DiffId) => {
    setDiff(d)
    initGame(d)
  }

  const handleFoundWord = useCallback((word: string, cells: [number, number][]) => {
    setCorrectCells(prev => [...prev, ...cells])
    setSelected([])
    speak(word, 'ko-KR', 0.9)
    showCorrectFlash(word)

    setFoundWords(prev => {
      const next = new Set(prev)
      next.add(word)

      setTotalFound(t => {
        const newTotal = t + 1
        if (next.size >= cfg.targetCount) {
          setTimeout(() => {
            if (round < cfg.totalRounds) {
              startRound(diff, round + 1, usedIdsRef.current)
            } else {
              setIsDone(true)
            }
          }, 900)
        }
        return newTotal
      })
      return next
    })
  }, [cfg, diff, round, speak, startRound])

  // ── Click interaction ─────────────────────────────────────────────────────
  const tapCell = useCallback((r: number, c: number) => {
    if (correctCells.some(([cr, cc]) => cr === r && cc === c)) return

    const alreadySel = selected.some(([sr, sc]) => sr === r && sc === c)
    if (alreadySel) {
      setSelected(prev => prev.slice(0, -1))
      return
    }

    const newSel: [number, number][] = [...selected, [r, c]]
    if (!isValidLine(newSel)) {
      setWrongCells(newSel)
      setTimeout(() => setWrongCells([]), 500)
      setSelected([])
      return
    }
    setSelected(newSel)

    const match = placements.find(p => {
      const cells = getCells(p)
      return cells.length === newSel.length &&
        cells.every(([pr, pc], i) => pr === newSel[i][0] && pc === newSel[i][1])
    })
    if (match && !foundWords.has(match.word)) {
      handleFoundWord(match.word, newSel)
    }
  }, [selected, correctCells, placements, foundWords, handleFoundWord])

  // ── Drag interaction ──────────────────────────────────────────────────────
  const getCellFromPoint = (x: number, y: number): [number, number] | null => {
    if (!gridRef.current) return null
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    if (!el) return null
    const r = parseInt(el.dataset.r ?? '')
    const c = parseInt(el.dataset.c ?? '')
    if (isNaN(r) || isNaN(c)) return null
    return [r, c]
  }

  const onGridMouseDown = (e: React.MouseEvent) => {
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    dragActiveRef.current = true
    dragCellsRef.current = [cell]
    setSelected([cell])
  }

  const onGridMouseMove = (e: React.MouseEvent) => {
    if (!dragActiveRef.current) return
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    const last = dragCellsRef.current[dragCellsRef.current.length - 1]
    if (last && last[0] === r && last[1] === c) return
    const newCells: [number, number][] = [...dragCellsRef.current, [r, c]]
    if (!isValidLine(newCells)) return
    dragCellsRef.current = newCells
    setSelected(newCells)
  }

  const onGridMouseUp = () => {
    if (!dragActiveRef.current) return
    dragActiveRef.current = false
    const cells = dragCellsRef.current
    if (cells.length < 2) return
    const selWord = cells.map(([r, c]) => grid[r]?.[c] ?? '').join('')
    const match = placements.find(p => {
      const pc = getCells(p)
      return pc.length === cells.length &&
        pc.every(([pr, pcc], i) => pr === cells[i][0] && pcc === cells[i][1])
    })
    if (match && !foundWords.has(match.word)) {
      handleFoundWord(match.word, cells)
    } else {
      setWrongCells(cells)
      setTimeout(() => { setWrongCells([]); setSelected([]) }, 450)
    }
  }

  const onGridTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const cell = getCellFromPoint(t.clientX, t.clientY)
    if (!cell) return
    const [r, c] = cell
    const last = dragCellsRef.current[dragCellsRef.current.length - 1]
    if (last && last[0] === r && last[1] === c) return
    const newCells: [number, number][] = [...dragCellsRef.current, [r, c]]
    if (!isValidLine(newCells)) return
    dragCellsRef.current = newCells
    setSelected(newCells)
  }

  const onGridTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    const cell = getCellFromPoint(t.clientX, t.clientY)
    if (!cell) return
    dragActiveRef.current = true
    dragCellsRef.current = [cell]
    setSelected([cell])
  }

  const onGridTouchEnd = () => { onGridMouseUp() }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isSel = (r: number, c: number) => selected.some(([sr, sc]) => sr === r && sc === c)
  const isWrong = (r: number, c: number) => wrongCells.some(([wr, wc]) => wr === r && wc === c)
  const isCorrect = (r: number, c: number) => correctCells.some(([cr, cc]) => cr === r && cc === c)

  const cellPx = Math.min(62, Math.floor(320 / cfg.grid))

  // ── Done screen ────────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <div style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '18px 20px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>🧩 낱말 퍼즐 완성!</span>
            <button className="dialog-close-btn" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>🎉</span>
            <p style={{ fontSize: '1.7rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>
              {cfg.totalRounds}라운드 모두 완료!
            </p>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>총 {totalFound}단어를 찾았어요</p>
            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: 280, marginTop: 8 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: 14, background: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', color: '#555' }}>
                닫기
              </button>
              <button onClick={() => { setDiff('easy'); initGame('easy') }}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', color: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
                다시 하기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  const roundDots = Array.from({ length: cfg.totalRounds }, (_, i) => {
    const active = i + 1 === round
    const done = i + 1 < round
    return (
      <span key={i} style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '0.85rem',
        background: active ? '#7c3aed' : done ? '#c8b8f8' : '#e8e0f8',
        color: active || done ? 'white' : '#aaa',
        border: active ? '2px solid #5c1ac8' : '2px solid transparent',
      }}>{i + 1}</span>
    )
  })

  const diffTabs = (['easy', 'medium', 'hard'] as DiffId[]).map(d => {
    const c = PUZZLE_CONFIG[d]
    const active = d === diff
    return (
      <button key={d} onClick={() => changeDiff(d)} style={{
        flex: 1, padding: '8px 4px',
        borderRadius: 20,
        border: active ? `2px solid ${c.color}` : '2px solid transparent',
        background: active ? `${c.color}18` : 'white',
        color: active ? c.color : '#999',
        fontFamily: 'inherit', fontWeight: 900, fontSize: '0.82rem',
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {c.badge} {c.label} ({c.grid}×{c.grid})
      </button>
    )
  })

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '14px 16px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.3rem' }}>🧩</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>낱말 퍼즐</span>
          <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: 10, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {cfg.badge} {cfg.label}
          </span>
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 900 }}>
            {foundWords.size}/{cfg.targetCount}
          </span>
          <button onClick={() => startRound(diff, round, usedIdsRef.current)}
            style={{ background: 'rgba(255,255,255,0.22)', border: 'none', color: 'white', borderRadius: 12, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700 }}>
            새로고침
          </button>
          <button className="dialog-close-btn" onClick={onClose} style={{ marginLeft: 0 }}>✕</button>
        </div>

        {/* ── Difficulty tabs ── */}
        <div style={{ padding: '10px 12px 0', display: 'flex', gap: 6, background: 'white' }}>
          {diffTabs}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '14px 16px 20px', background: 'white', borderRadius: '0 0 20px 20px' }}>

          {/* Section label + round dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>찾아야 할 단어</span>
            <div style={{ display: 'flex', gap: 4 }}>{roundDots}</div>
          </div>

          {/* Word chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {targets.map(t => {
              const found = foundWords.has(t.word)
              const syls = Array.from(t.word)
              return (
                <button key={t.id} onClick={() => speak(t.word, 'ko-KR', 0.9)}
                  style={{
                    flex: 1, padding: '10px 6px 8px', borderRadius: 16,
                    background: found ? 'linear-gradient(135deg,#E8F5E9,#C8E6C9)' : '#ede7f6',
                    border: `2.5px solid ${found ? '#4CAF50' : '#d1c4e9'}`,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: '2.2rem', lineHeight: 1, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: found ? '#2E7D32' : '#2c3e50', marginBottom: 6 }}>{t.word}</div>
                  <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                    {syls.map((s, i) => (
                      <span key={i} style={{
                        width: 22, height: 22, borderRadius: 6, fontSize: '0.75rem', fontWeight: 900,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: found
                          ? ['#66BB6A', '#42A5F5', '#FFA726'][i % 3]
                          : 'rgba(255,255,255,0.6)',
                        color: found ? 'white' : '#999',
                        border: `1.5px solid ${found ? 'transparent' : '#ddd'}`,
                      }}>{found ? s : '?'}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Instruction */}
          <p style={{ fontSize: '0.78rem', color: '#9c27b0', fontWeight: 700, textAlign: 'center', margin: '0 0 10px' }}>
            {cfg.dirs.includes('v')
              ? '격자에서 단어를 드래그하거나 글자를 순서대로 탭하세요'
              : '격자에서 단어를 가로로 드래그하거나 글자를 순서대로 탭하세요'}
          </p>

          {/* Grid */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              ref={gridRef}
              onMouseDown={onGridMouseDown}
              onMouseMove={onGridMouseMove}
              onMouseUp={onGridMouseUp}
              onMouseLeave={onGridMouseUp}
              onTouchStart={onGridTouchStart}
              onTouchMove={onGridTouchMove}
              onTouchEnd={onGridTouchEnd}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cfg.grid}, ${cellPx}px)`,
                gap: 6, padding: 12,
                background: '#d4b8f0', borderRadius: 18,
                userSelect: 'none', touchAction: 'none',
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const sel = isSel(r, c)
                  const wrong = isWrong(r, c)
                  const correct = isCorrect(r, c)
                  let bg = 'white', border = '#e8e0f0', color = '#333'
                  if (correct)    { bg = '#4caf50'; border = '#388e3c'; color = 'white' }
                  else if (wrong) { bg = '#ef5350'; border = '#c62828'; color = 'white' }
                  else if (sel)   { bg = '#ede7f6'; border = '#7c3aed'; color = '#7c3aed' }
                  return (
                    <div
                      key={`${r}-${c}`}
                      data-r={r} data-c={c}
                      onClick={() => !correct && tapCell(r, c)}
                      style={{
                        width: cellPx, height: cellPx,
                        borderRadius: 10, border: `2px solid ${border}`,
                        background: bg, color,
                        fontWeight: 900, fontSize: Math.max(14, cellPx * 0.44),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: correct ? 'default' : 'pointer',
                        transition: 'background 0.1s, border-color 0.1s, color 0.1s',
                        transform: sel ? 'scale(1.08)' : 'scale(1)',
                        boxShadow: sel ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      {cell}
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
