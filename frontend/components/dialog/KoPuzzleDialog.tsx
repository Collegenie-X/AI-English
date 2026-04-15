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

interface Placement { word: string; startR: number; startC: number; dir: Dir; cells: [number, number][] }

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
      const cells: [number, number][] = []
      for (let i = 0; i < syls.length; i++) {
        const rr = dir === 'h' ? r : r + i
        const cc = dir === 'h' ? c + i : c
        grid[rr][cc] = syls[i]
        cells.push([rr, cc])
      }
      placements.push({ word, startR: r, startC: c, dir, cells })
      placed = true
      break
    }

    if (!placed) {
      const cells: [number, number][] = []
      for (let r = 0; r < size && !placed; r++) {
        for (let c = 0; c <= size - syls.length && !placed; c++) {
          if (syls.every((s, i) => grid[r][c + i] === '' || grid[r][c + i] === s)) {
            syls.forEach((s, i) => { grid[r][c + i] = s; cells.push([r, c + i]) })
            placements.push({ word, startR: r, startC: c, dir: 'h', cells })
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

// ── Special effects ───────────────────────────────────────────────────────────
function fireCorrectFlash(word: string) {
  if (typeof document === 'undefined') return
  const el = document.createElement('div')
  el.textContent = `🎉 ${word}`
  el.style.cssText = `
    position:fixed; left:50%; top:38%; z-index:99999;
    font-size:2rem; font-weight:900; color:#7E57C2;
    pointer-events:none; white-space:nowrap;
    animation:correctFlash 0.85s ease forwards;
  `
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 900)

  for (let i = 0; i < 6; i++) {
    const star = document.createElement('div')
    star.textContent = ['⭐', '✨', '🌟', '💫'][i % 4]
    const angle = (i / 6) * 360
    const dist = 80 + Math.random() * 40
    star.style.cssText = `
      position:fixed;
      left:calc(50% + ${Math.cos((angle * Math.PI) / 180) * dist}px);
      top:calc(38% + ${Math.sin((angle * Math.PI) / 180) * dist}px);
      font-size:1.5rem; z-index:99998; pointer-events:none;
      animation:starPop 0.7s ease ${i * 60}ms forwards;
    `
    document.body.appendChild(star)
    setTimeout(() => star.remove(), 800)
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface KoPuzzleDialogProps {
  words: KoWordItem[]
  catName: string
  catColor: string
  onClose: () => void
}

// ── Round state ───────────────────────────────────────────────────────────────
interface RoundState {
  targets: KoWordItem[]
  grid: string[][]
  placements: Placement[]
  foundWords: Set<string>
  correctCells: [number, number][]
  wordProgress: Record<string, number>   // syllable index progress per word id
  inProgressCells: Record<string, [number, number][]>  // cells tapped per word
}

function buildRound(words: KoWordItem[], diff: DiffId, usedIds: Set<string>): RoundState {
  const cfg = PUZZLE_CONFIG[diff]
  const pool = words.filter(w => Array.from(w.word).length <= cfg.grid)
  const unused = pool.filter(w => !usedIds.has(w.id))
  const usePool = unused.length >= cfg.targetCount ? unused : pool
  const chosen = shuffle(usePool).slice(0, cfg.targetCount)
  chosen.forEach(w => usedIds.add(w.id))
  const { grid, placements } = buildGrid(cfg.grid, chosen.map(w => w.word), cfg.dirs)
  return {
    targets: chosen, grid, placements,
    foundWords: new Set(), correctCells: [], wordProgress: {}, inProgressCells: {},
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export function KoPuzzleDialog({ words, onClose }: KoPuzzleDialogProps) {
  const { speak } = useTTS()
  const [diff, setDiff] = useState<DiffId>('easy')
  const [round, setRound] = useState(1)
  const [rs, setRs] = useState<RoundState>(() => buildRound(words, 'easy', new Set()))
  const [totalFound, setTotalFound] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [hintCells, setHintCells] = useState<[number, number][]>([])
  const [dragCells, setDragCells] = useState<[number, number][]>([])
  const [wrongCells, setWrongCells] = useState<[number, number][]>([])

  const usedIdsRef = useRef<Set<string>>(new Set())
  const dragRef = useRef<{ active: boolean; startR: number; startC: number; dir: 'H'|'V'|null; cells: [number,number][] }>({
    active: false, startR: -1, startC: -1, dir: null, cells: [],
  })
  const gridRef = useRef<HTMLDivElement>(null)

  const cfg = PUZZLE_CONFIG[diff]

  // ── Start fresh game ────────────────────────────────────────────────────────
  const initGame = useCallback((d: DiffId) => {
    usedIdsRef.current = new Set()
    setRound(1)
    setTotalFound(0)
    setIsDone(false)
    setDragCells([])
    setWrongCells([])
    setHintCells([])
    setRs(buildRound(words, d, usedIdsRef.current))
  }, [words])

  const nextRound = useCallback((d: DiffId, nextRoundNum: number) => {
    setRound(nextRoundNum)
    setDragCells([])
    setWrongCells([])
    setHintCells([])
    setRs(buildRound(words, d, usedIdsRef.current))
  }, [words])

  useEffect(() => { initGame('easy') }, [initGame])

  const changeDiff = (d: DiffId) => { setDiff(d); initGame(d) }

  // ── Mark word as found ──────────────────────────────────────────────────────
  const markWordFound = useCallback((targetId: string, cells: [number, number][]) => {
    setRs(prev => {
      const target = prev.targets.find(t => t.id === targetId)
      if (!target) return prev
      const newFound = new Set(prev.foundWords)
      newFound.add(target.word)
      const newFoundCount = newFound.size

      // Fire effects (outside render)
      speak(target.word, 'ko-KR', 0.9)
      fireCorrectFlash(target.word)
      setTimeout(() => {
        const chipEl = document.getElementById(`ko-pzl-chip-${targetId}`)
        if (chipEl) {
          chipEl.classList.add('puzzle-chip-explode')
          setTimeout(() => chipEl.classList.remove('puzzle-chip-explode'), 750)
        }
      }, 50)

      if (newFoundCount >= PUZZLE_CONFIG[diff].targetCount) {
        setTotalFound(t => t + newFoundCount)
        setTimeout(() => {
          setRound(r => {
            const nextR = r + 1
            if (r < PUZZLE_CONFIG[diff].totalRounds) {
              nextRound(diff, nextR)
            } else {
              setIsDone(true)
            }
            return nextR
          })
        }, 1000)
      }

      return {
        ...prev,
        foundWords: newFound,
        correctCells: [...prev.correctCells, ...cells],
        wordProgress: { ...prev.wordProgress, [targetId]: Array.from(target.word).length },
        inProgressCells: { ...prev.inProgressCells, [targetId]: [] },
      }
    })
  }, [diff, nextRound, speak])

  // ── Chip click: speak + hint ────────────────────────────────────────────────
  const onChipClick = useCallback((target: KoWordItem) => {
    speak(target.word, 'ko-KR', 0.9)
    if (rs.foundWords.has(target.word)) return
    const prog = rs.wordProgress[target.id] ?? 0
    const syls = Array.from(target.word)
    const nextSyl = syls[prog]
    const pl = rs.placements.find(p => p.word === target.word)
    if (!pl || prog >= pl.cells.length) return
    const hintCell = pl.cells[prog]
    setHintCells([hintCell])
    setTimeout(() => setHintCells([]), 1200)
  }, [rs.foundWords, rs.wordProgress, rs.placements, speak])

  // ── Single-tap: character matching ─────────────────────────────────────────
  const tapCell = useCallback((r: number, c: number) => {
    const correct = rs.correctCells.some(([cr, cc]) => cr === r && cc === c)
    if (correct) return
    const char = rs.grid[r]?.[c]
    if (!char) return

    // Find matching target — in-progress words first, then unstarted
    let matchedId: string | null = null
    let matchedProg = 0

    for (const t of rs.targets) {
      if (rs.foundWords.has(t.word)) continue
      const prog = rs.wordProgress[t.id] ?? 0
      const syls = Array.from(t.word)
      if (prog > 0 && syls[prog] === char) {
        matchedId = t.id; matchedProg = prog; break
      }
    }
    if (!matchedId) {
      for (const t of rs.targets) {
        if (rs.foundWords.has(t.word)) continue
        const prog = rs.wordProgress[t.id] ?? 0
        const syls = Array.from(t.word)
        if (prog === 0 && syls[0] === char) {
          matchedId = t.id; matchedProg = 0; break
        }
      }
    }

    if (!matchedId) {
      setWrongCells([[r, c]])
      setTimeout(() => setWrongCells([]), 450)
      return
    }

    const target = rs.targets.find(t => t.id === matchedId)!
    const syls = Array.from(target.word)
    const newProg = matchedProg + 1
    speak(char, 'ko-KR', 0.9)

    // Update progress + in-progress cells
    const prevCells = rs.inProgressCells[matchedId] ?? []
    const newCell: [number, number] = [r, c]

    if (newProg >= syls.length) {
      // Word complete via tapping!
      const allCells = [...prevCells, newCell]
      setRs(prev => ({
        ...prev,
        wordProgress: { ...prev.wordProgress, [matchedId!]: newProg },
        inProgressCells: { ...prev.inProgressCells, [matchedId!]: [] },
      }))
      markWordFound(matchedId, allCells)
    } else {
      setRs(prev => ({
        ...prev,
        wordProgress: { ...prev.wordProgress, [matchedId!]: newProg },
        inProgressCells: { ...prev.inProgressCells, [matchedId!]: [...(prev.inProgressCells[matchedId!] ?? []), newCell] },
      }))
    }
  }, [rs, speak, markWordFound])

  // ── Drag helpers ────────────────────────────────────────────────────────────
  const getCellAt = (x: number, y: number): [number, number] | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    if (!el) return null
    const r = parseInt(el.dataset.r ?? '')
    const c = parseInt(el.dataset.c ?? '')
    return (isNaN(r) || isNaN(c)) ? null : [r, c]
  }

  const buildDragCells = (sr: number, sc: number, er: number, ec: number, dir: 'H'|'V'): [number,number][] => {
    const cells: [number,number][] = []
    if (dir === 'H') {
      const lo = Math.min(sc, ec), hi = Math.max(sc, ec)
      for (let col = lo; col <= hi; col++) cells.push([sr, col])
    } else {
      const lo = Math.min(sr, er), hi = Math.max(sr, er)
      for (let row = lo; row <= hi; row++) cells.push([row, sc])
    }
    return cells
  }

  const onGridMouseDown = (e: React.MouseEvent) => {
    const cell = getCellAt(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    dragRef.current = { active: true, startR: r, startC: c, dir: null, cells: [[r, c]] }
    setDragCells([])
  }

  const onGridMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    const cell = getCellAt(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    const { startR, startC } = dragRef.current
    if (r === startR && c === startC) return

    if (!dragRef.current.dir) {
      if (r === startR) dragRef.current.dir = 'H'
      else if (c === startC) dragRef.current.dir = 'V'
      else return
    }
    const dir = dragRef.current.dir
    if (dir === 'H' && r !== startR) return
    if (dir === 'V' && c !== startC) return

    const cells = buildDragCells(startR, startC, r, c, dir)
    dragRef.current.cells = cells
    setDragCells(cells)
  }

  const onGridMouseUp = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const { cells, startR, startC } = dragRef.current

    if (cells.length <= 1) {
      // Single tap — route to char matching
      setDragCells([])
      tapCell(startR, startC)
      return
    }

    // Drag complete — check word match
    setDragCells([])
    const wordText = cells.map(([r, c]) => rs.grid[r]?.[c] ?? '').join('')
    const match = rs.placements.find(p => {
      if (p.word !== wordText) return false
      const pl = p.cells
      return pl.length === cells.length &&
        ((pl[0][0] === cells[0][0] && pl[0][1] === cells[0][1]) ||
         (pl[pl.length-1][0] === cells[0][0] && pl[pl.length-1][1] === cells[0][1]))
    })

    const target = match ? rs.targets.find(t => t.word === match.word) : null
    if (target && !rs.foundWords.has(target.word)) {
      markWordFound(target.id, cells)
    } else {
      setWrongCells(cells)
      setTimeout(() => setWrongCells([]), 450)
    }
  }

  const onGridTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    const cell = getCellAt(t.clientX, t.clientY)
    if (!cell) return
    const [r, c] = cell
    dragRef.current = { active: true, startR: r, startC: c, dir: null, cells: [[r, c]] }
    setDragCells([])
  }

  const onGridTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const cell = getCellAt(t.clientX, t.clientY)
    if (!cell) return
    const [r, c] = cell
    const { startR, startC } = dragRef.current
    if (r === startR && c === startC) return
    if (!dragRef.current.dir) {
      if (r === startR) dragRef.current.dir = 'H'
      else if (c === startC) dragRef.current.dir = 'V'
      else return
    }
    const cells = buildDragCells(startR, startC, r, c, dragRef.current.dir!)
    dragRef.current.cells = cells
    setDragCells(cells)
  }

  const onGridTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    onGridMouseUp(e as unknown as React.MouseEvent)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Cell state helpers ──────────────────────────────────────────────────────
  const isCellCorrect = (r: number, c: number) => rs.correctCells.some(([cr, cc]) => cr === r && cc === c)
  const isCellDrag    = (r: number, c: number) => dragCells.some(([dr, dc]) => dr === r && dc === c)
  const isCellWrong   = (r: number, c: number) => wrongCells.some(([wr, wc]) => wr === r && wc === c)
  const isCellHint    = (r: number, c: number) => hintCells.some(([hr, hc]) => hr === r && hc === c)
  const isCellInProgress = (r: number, c: number) =>
    Object.values(rs.inProgressCells).some(cells => cells.some(([cr, cc]) => cr === r && cc === c))

  // Color index per word for correct cells
  const cellColorIdx = (r: number, c: number): number => {
    for (let i = 0; i < rs.targets.length; i++) {
      const t = rs.targets[i]
      const cells = rs.inProgressCells[t.id] ?? []
      if (cells.some(([cr, cc]) => cr === r && cc === c)) return i
    }
    // Check correctCells ownership via placement
    for (let i = 0; i < rs.targets.length; i++) {
      const pl = rs.placements.find(p => p.word === rs.targets[i].word)
      if (pl && pl.cells.some(([pr, pc]) => pr === r && pc === c)) return i
    }
    return 0
  }

  const CORRECT_COLORS = ['#4caf50', '#42a5f5', '#ff9800', '#e91e63', '#9c27b0']

  const getCellStyle = (r: number, c: number): React.CSSProperties => {
    if (isCellHint(r, c))    return { background: '#FFF9C4', border: '2px solid #F9A825' }
    if (isCellCorrect(r, c)) { const col = CORRECT_COLORS[cellColorIdx(r, c) % CORRECT_COLORS.length]; return { background: col, border: `2px solid ${col}`, color: 'white' } }
    if (isCellWrong(r, c))   return { background: '#ef5350', border: '2px solid #c62828', color: 'white', animation: 'shake 0.35s ease' }
    if (isCellDrag(r, c))    return { background: '#ede7f6', border: '2px solid #7c3aed', color: '#7c3aed', transform: 'scale(1.08)' }
    if (isCellInProgress(r, c)) { const col = CORRECT_COLORS[cellColorIdx(r, c) % CORRECT_COLORS.length]; return { background: `${col}30`, border: `2px solid ${col}`, color: col } }
    return { background: 'white', border: '2px solid #e8e0f0', color: '#333' }
  }

  const cellPx = Math.min(64, Math.floor(316 / cfg.grid))

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <div style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '16px 20px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>🧩 낱말 퍼즐 완성!</span>
            <button className="dialog-close-btn" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '4rem' }}>🎉</span>
            <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>{cfg.totalRounds}라운드 완료!</p>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>총 {totalFound}단어를 찾았어요</p>
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280, marginTop: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: 14, background: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', color: '#555' }}>닫기</button>
              <button onClick={() => { setDiff('easy'); initGame('easy') }} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', color: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>다시 하기</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Round dots ──────────────────────────────────────────────────────────────
  const roundDots = Array.from({ length: cfg.totalRounds }, (_, i) => {
    const n = i + 1
    const active = n === round, done = n < round
    return (
      <span key={i} style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '0.85rem',
        background: active ? '#7c3aed' : done ? '#c8b8f8' : '#e8e0f8',
        color: active || done ? 'white' : '#aaa',
        border: active ? '2px solid #5c1ac8' : '2px solid transparent',
      }}>{n}</span>
    )
  })

  // ── Difficulty tabs ──────────────────────────────────────────────────────────
  const diffTabs = (['easy', 'medium', 'hard'] as DiffId[]).map(d => {
    const c = PUZZLE_CONFIG[d]
    const active = d === diff
    return (
      <button key={d} onClick={() => changeDiff(d)} style={{
        flex: 1, padding: '8px 4px', borderRadius: 20,
        border: active ? `2px solid ${c.color}` : '2px solid transparent',
        background: active ? `${c.color}18` : 'white',
        color: active ? c.color : '#999',
        fontFamily: 'inherit', fontWeight: 900, fontSize: '0.78rem',
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
        {c.badge} {c.label} ({c.grid}×{c.grid})
      </button>
    )
  })

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', padding: '14px 16px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>🧩</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>낱말 퍼즐</span>
          <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: 10, padding: '2px 9px', fontSize: '0.76rem', fontWeight: 700 }}>
            {cfg.badge} {cfg.label}
          </span>
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 900 }}>
            {rs.foundWords.size}/{cfg.targetCount}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setDiff(d => d); nextRound(diff, round) }}
            style={{ background: 'rgba(255,255,255,0.22)', border: 'none', color: 'white', borderRadius: 12, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }}>
            새로고침
          </button>
          <button className="dialog-close-btn" onClick={onClose} style={{ marginLeft: 0 }}>✕</button>
        </div>

        {/* Difficulty tabs */}
        <div style={{ padding: '10px 12px 0', display: 'flex', gap: 6, background: 'white' }}>
          {diffTabs}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 22px', background: 'white', borderRadius: '0 0 20px 20px' }}>

          {/* Section label + round dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>찾아야 할 단어</span>
            <div style={{ display: 'flex', gap: 4 }}>{roundDots}</div>
          </div>

          {/* Word chips — click to hear + hint */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {rs.targets.map((t, idx) => {
              const found = rs.foundWords.has(t.word)
              const prog = rs.wordProgress[t.id] ?? 0
              const syls = Array.from(t.word)
              const colIdx = idx % CORRECT_COLORS.length
              return (
                <button
                  key={t.id}
                  id={`ko-pzl-chip-${t.id}`}
                  onClick={() => onChipClick(t)}
                  style={{
                    flex: 1, padding: '10px 6px 8px', borderRadius: 16,
                    background: found ? 'linear-gradient(135deg,#E8F5E9,#C8E6C9)' : '#ede7f6',
                    border: `2.5px solid ${found ? '#4CAF50' : '#d1c4e9'}`,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    transition: 'transform 0.15s',
                  }}>
                  <div style={{ fontSize: '2rem', lineHeight: 1, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: found ? '#2E7D32' : '#2c3e50', marginBottom: 5 }}>{t.word}</div>
                  <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                    {syls.map((s, i) => (
                      <span key={i} style={{
                        width: 22, height: 22, borderRadius: 6, fontSize: '0.72rem', fontWeight: 900,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: (found || i < prog) ? CORRECT_COLORS[colIdx] : 'rgba(255,255,255,0.7)',
                        color: (found || i < prog) ? 'white' : '#bbb',
                        border: `1.5px solid ${(found || i < prog) ? 'transparent' : '#ddd'}`,
                        transition: 'all 0.2s',
                      }}>
                        {(found || i < prog) ? s : '?'}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Instruction */}
          <p style={{ fontSize: '0.77rem', color: '#9c27b0', fontWeight: 700, textAlign: 'center', margin: '0 0 10px' }}>
            {cfg.dirs.length > 1
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
                gap: 5, padding: 12,
                background: '#d4b8f0', borderRadius: 18,
                userSelect: 'none', touchAction: 'none',
              }}
            >
              {rs.grid.map((row, r) =>
                row.map((cell, c) => {
                  const correct = isCellCorrect(r, c)
                  const hint    = isCellHint(r, c)
                  const style   = getCellStyle(r, c)
                  return (
                    <div
                      key={`${r}-${c}`}
                      data-r={r} data-c={c}
                      className={hint ? 'puzzle-cell-hint' : ''}
                      style={{
                        width: cellPx, height: cellPx,
                        borderRadius: 10,
                        fontWeight: 900, fontSize: Math.max(13, cellPx * 0.42),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: correct ? 'default' : 'pointer',
                        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
                        fontFamily: 'inherit',
                        ...style,
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
