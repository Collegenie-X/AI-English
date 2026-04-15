'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

// ── Config (HTML 파일과 동일) ─────────────────────────────────────────────────
const PUZZLE_CONFIG = {
  easy:   { label: '초급', grid: 4, targetCount: 3, totalRounds: 3, cellPx: 88, fontSize: '1.65em', dirs: ['h'] as Dir[], showEasyHint: true  },
  medium: { label: '중급', grid: 5, targetCount: 3, totalRounds: 3, cellPx: 72, fontSize: '1.45em', dirs: ['h','v'] as Dir[], showEasyHint: false },
  hard:   { label: '고급', grid: 6, targetCount: 3, totalRounds: 3, cellPx: 58, fontSize: '1.25em', dirs: ['h','v'] as Dir[], showEasyHint: false },
}
type DiffId = keyof typeof PUZZLE_CONFIG
type Dir = 'h' | 'v'

// 셀 색상 (HTML 파일과 동일)
const FOUND_GRADIENTS = [
  { bg: 'linear-gradient(135deg,#A5D6A7,#66BB6A)', border: '#2E7D32', syl: 'linear-gradient(135deg,#A5D6A7,#66BB6A)' },
  { bg: 'linear-gradient(135deg,#90CAF9,#42A5F5)', border: '#1565C0', syl: 'linear-gradient(135deg,#90CAF9,#42A5F5)' },
  { bg: 'linear-gradient(135deg,#FFCC80,#FFA726)', border: '#E65100', syl: 'linear-gradient(135deg,#FFCC80,#FFA726)' },
  { bg: 'linear-gradient(135deg,#CE93D8,#AB47BC)', border: '#6A1B9A', syl: 'linear-gradient(135deg,#CE93D8,#AB47BC)' },
  { bg: 'linear-gradient(135deg,#80DEEA,#26C6DA)', border: '#006064', syl: 'linear-gradient(135deg,#80DEEA,#26C6DA)' },
]
const EASY_HINT_STYLES = [
  { border: '#43A047', bg: '#F1FFF3' },
  { border: '#1976D2', bg: '#EAF4FF' },
  { border: '#E64A19', bg: '#FFF5EE' },
  { border: '#7B1FA2', bg: '#F8F0FF' },
  { border: '#00695C', bg: '#E0F7FA' },
]

interface Placement { word: string; cells: [number,number][] }

const FILL_CHARS = '가나다라마바사아자차카타파하강산물바람구름하늘빛꽃별눈비해달'
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

// ── 그리드 빌더 ───────────────────────────────────────────────────────────────
function buildGrid(size: number, words: string[], dirs: Dir[]): { grid: string[][], placements: Placement[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))
  const placements: Placement[] = []
  const rand = () => FILL_CHARS[Math.floor(Math.random() * FILL_CHARS.length)]

  for (const word of words) {
    const syls = Array.from(word)
    if (syls.length > size) continue
    let placed = false
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
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
      const cells: [number,number][] = []
      for (let i = 0; i < syls.length; i++) {
        const rr = dir === 'h' ? r : r + i
        const cc = dir === 'h' ? c + i : c
        grid[rr][cc] = syls[i]; cells.push([rr, cc])
      }
      placements.push({ word, cells }); placed = true
    }
    if (!placed) {
      const cells: [number,number][] = []
      outer: for (let r = 0; r < size; r++)
        for (let c = 0; c <= size - syls.length; c++) {
          if (syls.every((s, i) => grid[r][c+i] === '' || grid[r][c+i] === s)) {
            syls.forEach((s, i) => { grid[r][c+i] = s; cells.push([r, c+i]) })
            placements.push({ word, cells }); placed = true; break outer
          }
        }
    }
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === '') grid[r][c] = rand()
  return { grid, placements }
}

// ── starburst 이펙트 (HTML 파일과 동일) ──────────────────────────────────────
function fireStarburst() {
  if (typeof document === 'undefined') return
  const emojis = ['⭐','✨','🌟','💥','🎉','🎊']
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'ko-starburst'
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      const vw = window.innerWidth, vh = window.innerHeight
      el.style.left = (vw * 0.2 + Math.random() * vw * 0.6) + 'px'
      el.style.top  = (vh * 0.2 + Math.random() * vh * 0.5) + 'px'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 900)
    }, i * 110)
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface KoPuzzleDialogProps {
  words: KoWordItem[]
  catName: string
  catColor: string
  onClose: () => void
}

// ── State ─────────────────────────────────────────────────────────────────────
interface RoundState {
  targets: KoWordItem[]
  grid: string[][]
  placements: Placement[]
  foundWords: Set<string>
  correctCells: [number,number][]   // cells belonging to found words (colored)
  wordProgress: Record<string,number>              // tapped syllable count per word
  inProgressCells: Record<string,[number,number][]> // cells tapped so far per word
}

function buildRound(words: KoWordItem[], diff: DiffId, usedIds: Set<string>): RoundState {
  const cfg = PUZZLE_CONFIG[diff]
  const pool = words.filter(w => Array.from(w.word).length <= cfg.grid)
  const unused = pool.filter(w => !usedIds.has(w.id))
  const usePool = unused.length >= cfg.targetCount ? unused : pool
  const chosen = shuffle(usePool).slice(0, cfg.targetCount)
  chosen.forEach(w => usedIds.add(w.id))
  const { grid, placements } = buildGrid(cfg.grid, chosen.map(w => w.word), cfg.dirs)
  return { targets: chosen, grid, placements, foundWords: new Set(), correctCells: [], wordProgress: {}, inProgressCells: {} }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function KoPuzzleDialog({ words, catName, onClose }: KoPuzzleDialogProps) {
  const { speak } = useTTS()
  const [diff, setDiff]       = useState<DiffId>('easy')
  const [round, setRound]     = useState(1)
  const [rs, setRs]           = useState<RoundState>(() => buildRound(words, 'easy', new Set()))
  const [totalFound, setTotalFound] = useState(0)
  const [isDone, setIsDone]   = useState(false)
  const [hintCell, setHintCell]   = useState<[number,number]|null>(null)
  const [dragCells, setDragCells] = useState<[number,number][]>([])
  const [wrongCells, setWrongCells] = useState<[number,number][]>([])

  const usedIdsRef = useRef(new Set<string>())
  const dragRef    = useRef<{ active:boolean; startR:number; startC:number; dir:'H'|'V'|null; cells:[number,number][] }>
                         ({ active:false, startR:-1, startC:-1, dir:null, cells:[] })
  const cfg = PUZZLE_CONFIG[diff]

  // ── Init / next round ───────────────────────────────────────────────────────
  const initGame = useCallback((d: DiffId) => {
    usedIdsRef.current = new Set()
    setRound(1); setTotalFound(0); setIsDone(false)
    setDragCells([]); setWrongCells([]); setHintCell(null)
    setRs(buildRound(words, d, usedIdsRef.current))
  }, [words])

  const nextRound = useCallback((d: DiffId, n: number) => {
    setRound(n); setDragCells([]); setWrongCells([]); setHintCell(null)
    setRs(buildRound(words, d, usedIdsRef.current))
  }, [words])

  useEffect(() => { initGame('easy') }, [initGame])

  const changeDiff = (d: DiffId) => { setDiff(d); initGame(d) }

  // ── Mark word found ─────────────────────────────────────────────────────────
  const markWordFound = useCallback((targetId: string, cells: [number,number][]) => {
    setRs(prev => {
      const target = prev.targets.find(t => t.id === targetId)
      if (!target) return prev
      const newFound = new Set(prev.foundWords)
      newFound.add(target.word)

      // TTS: word → "잘 했습니다!"
      speak(target.word, 'ko-KR', 0.9)
      setTimeout(() => speak('잘 했습니다!', 'ko-KR', 1.0), 650)

      // Chip animate
      setTimeout(() => {
        const el = document.getElementById(`ko-chip-${targetId}`)
        if (el) { el.classList.add('ko-chip-explode'); setTimeout(() => el.classList.remove('ko-chip-explode'), 750) }
      }, 60)
      fireStarburst()

      // Round complete?
      if (newFound.size >= PUZZLE_CONFIG[diff].targetCount) {
        setTotalFound(t => t + newFound.size)
        setTimeout(() => {
          setRound(r => {
            if (r < PUZZLE_CONFIG[diff].totalRounds) { nextRound(diff, r + 1); return r + 1 }
            setIsDone(true); return r
          })
        }, 1100)
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

  // ── Chip click: speak + blink hint ─────────────────────────────────────────
  const onChipClick = useCallback((t: KoWordItem) => {
    speak(t.word, 'ko-KR', 0.9)
    if (rs.foundWords.has(t.word)) return
    const prog = rs.wordProgress[t.id] ?? 0
    const pl = rs.placements.find(p => p.word === t.word)
    if (!pl || prog >= pl.cells.length) return
    setHintCell(pl.cells[prog])
    setTimeout(() => setHintCell(null), 1100)
  }, [rs.foundWords, rs.wordProgress, rs.placements, speak])

  // ── Tap cell: char matching ─────────────────────────────────────────────────
  const tapCell = useCallback((r: number, c: number) => {
    if (rs.correctCells.some(([cr,cc]) => cr===r && cc===c)) return
    const char = rs.grid[r]?.[c]; if (!char) return

    // in-progress first, then unstarted
    let matchId: string|null = null, matchProg = 0
    for (const t of rs.targets) {
      if (rs.foundWords.has(t.word)) continue
      const prog = rs.wordProgress[t.id] ?? 0
      if (prog > 0 && Array.from(t.word)[prog] === char) { matchId = t.id; matchProg = prog; break }
    }
    if (!matchId) {
      for (const t of rs.targets) {
        if (rs.foundWords.has(t.word)) continue
        const prog = rs.wordProgress[t.id] ?? 0
        if (prog === 0 && Array.from(t.word)[0] === char) { matchId = t.id; matchProg = 0; break }
      }
    }
    if (!matchId) {
      setWrongCells([[r,c]]); setTimeout(() => setWrongCells([]), 420)
      return
    }
    const target = rs.targets.find(t => t.id === matchId)!
    const syls = Array.from(target.word)
    const newProg = matchProg + 1
    speak(char, 'ko-KR', 0.9)
    const prevCells = rs.inProgressCells[matchId] ?? []
    const newCell: [number,number] = [r,c]

    if (newProg >= syls.length) {
      setRs(prev => ({ ...prev,
        wordProgress: { ...prev.wordProgress, [matchId!]: newProg },
        inProgressCells: { ...prev.inProgressCells, [matchId!]: [] },
      }))
      markWordFound(matchId, [...prevCells, newCell])
    } else {
      setRs(prev => ({ ...prev,
        wordProgress: { ...prev.wordProgress, [matchId!]: newProg },
        inProgressCells: { ...prev.inProgressCells, [matchId!]: [...(prev.inProgressCells[matchId!]??[]), newCell] },
      }))
    }
  }, [rs, speak, markWordFound])

  // ── Drag ────────────────────────────────────────────────────────────────────
  const getCellAt = (x:number, y:number):[number,number]|null => {
    const el = document.elementFromPoint(x,y) as HTMLElement|null
    if (!el) return null
    const r = parseInt(el.dataset.r??''), c = parseInt(el.dataset.c??'')
    return isNaN(r)||isNaN(c) ? null : [r,c]
  }
  const buildDragLine = (sr:number,sc:number,er:number,ec:number,dir:'H'|'V'):[number,number][] => {
    if (dir==='H') { const lo=Math.min(sc,ec),hi=Math.max(sc,ec); return Array.from({length:hi-lo+1},(_,i)=>[sr,lo+i] as [number,number]) }
    const lo=Math.min(sr,er),hi=Math.max(sr,er); return Array.from({length:hi-lo+1},(_,i)=>[lo+i,sc] as [number,number])
  }

  const onMouseDown = (e:React.MouseEvent) => {
    const cell = getCellAt(e.clientX, e.clientY); if (!cell) return
    dragRef.current = { active:true, startR:cell[0], startC:cell[1], dir:null, cells:[cell] }
    setDragCells([])
  }
  const onMouseMove = (e:React.MouseEvent) => {
    if (!dragRef.current.active) return
    const cell = getCellAt(e.clientX,e.clientY); if (!cell) return
    const [r,c]=cell, {startR,startC}=dragRef.current
    if (r===startR&&c===startC) return
    if (!dragRef.current.dir) {
      if (r===startR) dragRef.current.dir='H'
      else if (c===startC) dragRef.current.dir='V'
      else return
    }
    const dir=dragRef.current.dir
    if (dir==='H'&&r!==startR) return
    if (dir==='V'&&c!==startC) return
    const cells=buildDragLine(startR,startC,r,c,dir)
    dragRef.current.cells=cells; setDragCells(cells)
  }
  const onMouseUp = () => {
    if (!dragRef.current.active) return
    dragRef.current.active=false
    const {cells,startR,startC}=dragRef.current
    setDragCells([])
    if (cells.length<=1) { tapCell(startR,startC); return }
    // drag check
    const wordText=cells.map(([r,c])=>rs.grid[r]?.[c]??'').join('')
    const match=rs.placements.find(p=>{
      if (p.word!==wordText) return false
      const fc=p.cells[0], lc=p.cells[p.cells.length-1]
      return (fc[0]===cells[0][0]&&fc[1]===cells[0][1]) || (lc[0]===cells[0][0]&&lc[1]===cells[0][1])
    })
    const target=match?rs.targets.find(t=>t.word===match.word):null
    if (target&&!rs.foundWords.has(target.word)) {
      markWordFound(target.id, cells)
    } else {
      setWrongCells(cells); setTimeout(()=>setWrongCells([]),420)
    }
  }
  const onTouchStart=(e:React.TouchEvent)=>{ const t=e.touches[0]; const cell=getCellAt(t.clientX,t.clientY); if(!cell)return; dragRef.current={active:true,startR:cell[0],startC:cell[1],dir:null,cells:[cell]}; setDragCells([]) }
  const onTouchMove=(e:React.TouchEvent)=>{ e.preventDefault(); const t=e.touches[0]; const cell=getCellAt(t.clientX,t.clientY); if(!cell)return; const[r,c]=cell,{startR,startC}=dragRef.current; if(r===startR&&c===startC)return; if(!dragRef.current.dir){if(r===startR)dragRef.current.dir='H';else if(c===startC)dragRef.current.dir='V';else return}; const dir=dragRef.current.dir; if(dir==='H'&&r!==startR)return; if(dir==='V'&&c!==startC)return; const cells=buildDragLine(startR,startC,r,c,dir); dragRef.current.cells=cells; setDragCells(cells) }
  const onTouchEnd=(e:React.TouchEvent)=>{ e.preventDefault(); onMouseUp() }

  useEffect(() => {
    const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)
  },[onClose])

  // ── Cell helpers ─────────────────────────────────────────────────────────────
  const isCorrect    = (r:number,c:number) => rs.correctCells.some(([cr,cc])=>cr===r&&cc===c)
  const isDragCell   = (r:number,c:number) => dragCells.some(([dr,dc])=>dr===r&&dc===c)
  const isWrong      = (r:number,c:number) => wrongCells.some(([wr,wc])=>wr===r&&wc===c)
  const isHintCell   = (r:number,c:number) => hintCell?.[0]===r && hintCell?.[1]===c
  const isInProgress = (r:number,c:number) => Object.values(rs.inProgressCells).some(cells=>cells.some(([cr,cc])=>cr===r&&cc===c))
  const isDragStart  = dragCells.length>0 && dragCells[0]

  // word color index via placement
  const wordColorIdx = (r:number,c:number):number => {
    for (let i=0;i<rs.targets.length;i++) {
      const pl=rs.placements.find(p=>p.word===rs.targets[i].word)
      if (pl&&pl.cells.some(([pr,pc])=>pr===r&&pc===c)) return i
    }
    return 0
  }
  // easy-hint: first cell of each unfound, unstarted word
  const easyHints: Map<string,[number,number]> = new Map()
  if (cfg.showEasyHint) {
    rs.targets.forEach((t,i) => {
      if (rs.foundWords.has(t.word)) return
      if ((rs.wordProgress[t.id]??0)>0) return
      const pl=rs.placements.find(p=>p.word===t.word)
      if (pl) easyHints.set(`${pl.cells[0][0]}-${pl.cells[0][1]}`, pl.cells[0])
    })
  }

  const getCellClass = (r:number,c:number):string => {
    if (isCorrect(r,c))    return `pzl-cell-found-${wordColorIdx(r,c)}`
    if (isWrong(r,c))      return 'pzl-cell-wrong'
    if (isDragStart&&isDragStart[0]===r&&isDragStart[1]===c) return 'pzl-cell-start'
    if (isDragCell(r,c))   return 'pzl-cell-path'
    if (isHintCell(r,c))   return 'pzl-cell-hint'
    if (isInProgress(r,c)) return `pzl-cell-prog-${wordColorIdx(r,c)}`
    if (easyHints.has(`${r}-${c}`)) return `pzl-cell-easy-${wordColorIdx(r,c)}`
    return ''
  }

  // ── Round dots ──────────────────────────────────────────────────────────────
  const roundDots = Array.from({length:cfg.totalRounds},(_,i)=>{
    const n=i+1,active=n===round,done=n<round
    return <span key={i} style={{width:28,height:28,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.85rem',background:active?'#7c3aed':done?'#c8b8f8':'#e8e0f8',color:(active||done)?'white':'#bbb',border:active?'2px solid #5c1ac8':'2px solid transparent'}}>{n}</span>
  })

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (isDone) return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div style={{background:'linear-gradient(135deg,#7E57C2,#9C27B0)',padding:'18px 20px',borderRadius:'20px 20px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'white',fontWeight:900,fontSize:'1.1rem'}}>🧩 낱말 퍼즐 완성!</span>
          <button className="dialog-close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:'36px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          <span style={{fontSize:'4rem'}}>🎉</span>
          <p style={{fontSize:'1.6rem',fontWeight:900,color:'#1a1a2e',margin:0}}>{cfg.totalRounds}라운드 완료!</p>
          <p style={{color:'#888',fontSize:'0.9rem',margin:0}}>총 {totalFound}단어를 찾았어요</p>
          <div style={{display:'flex',gap:10,width:'100%',maxWidth:280,marginTop:8}}>
            <button onClick={onClose} style={{flex:1,padding:'12px',border:'2px solid #e0e0e0',borderRadius:14,background:'white',fontFamily:'inherit',fontWeight:700,cursor:'pointer',color:'#555'}}>닫기</button>
            <button onClick={()=>{setDiff('easy');initGame('easy')}} style={{flex:1,padding:'12px',border:'none',borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#9d4edd)',color:'white',fontFamily:'inherit',fontWeight:700,cursor:'pointer'}}>다시 하기</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>

        {/* ── 헤더 ── */}
        <div style={{background:'linear-gradient(135deg,#7E57C2,#9C27B0)',padding:'16px 20px',borderRadius:'20px 20px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:'1.3rem'}}>🧩</span>
            <span style={{color:'white',fontWeight:900,fontSize:'1.1rem'}}>낱말 퍼즐</span>
            <span style={{background:'rgba(255,255,255,0.25)',color:'white',borderRadius:10,padding:'3px 10px',fontSize:'0.78rem',fontWeight:700}}>
              {cfg.label}
            </span>
          </div>
          <button className="dialog-close-btn" onClick={onClose} style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.28)',border:'2px solid rgba(255,255,255,0.55)',cursor:'pointer',fontSize:'1.1rem',color:'white',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* ── 난이도 탭 ── */}
        <div style={{display:'flex',gap:6,padding:'14px 16px 0',background:'white'}}>
          {(['easy','medium','hard'] as DiffId[]).map(d=>{
            const c=PUZZLE_CONFIG[d], active=d===diff
            const activeStyle = d==='easy'
              ? {background:'linear-gradient(135deg,#43e97b,#38f9d7)',color:'#1a5c3a',boxShadow:'0 3px 12px rgba(67,233,123,0.4)',border:'2.5px solid transparent'}
              : d==='medium'
              ? {background:'linear-gradient(135deg,#FDD835,#FB8C00)',color:'#3e2000',boxShadow:'0 3px 12px rgba(251,140,0,0.4)',border:'2.5px solid transparent'}
              : {background:'linear-gradient(135deg,#ef5350,#e91e63)',color:'white',boxShadow:'0 3px 12px rgba(239,83,80,0.4)',border:'2.5px solid transparent'}
            return (
              <button key={d} onClick={()=>changeDiff(d)} style={{flex:1,padding:'10px 8px',borderRadius:16,fontFamily:'inherit',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',transition:'all 0.25s',textAlign:'center',...(active?activeStyle:{background:'white',color:'#666',border:'2.5px solid #e0e0e0',boxShadow:'none'})}}>
                {d==='easy'?'🟢':d==='medium'?'🟡':'🔴'} {c.label} ({c.grid}×{c.grid})
              </button>
            )
          })}
        </div>

        {/* ── 단어 풀 정보 + 카운터 + 새로고침 ── */}
        <div style={{padding:'8px 16px 0',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:'0.8rem',color:'#888',background:'white'}}>
          <span style={{color:'#9C27B0',fontWeight:900}}>총 {words.length}단어 풀</span>
          {catName&&<span style={{color:'#aaa'}}>· {catName}</span>}
          <span style={{background:'#fdf4ff',border:'1.5px solid #ce93d8',borderRadius:12,padding:'2px 8px',fontSize:'0.88rem',color:'#7E57C2',fontWeight:900}}>{rs.foundWords.size}/{cfg.targetCount}</span>
          <button
            onClick={()=>nextRound(diff,round)}
            title="새로고침"
            style={{width:32,height:32,borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#7E57C2,#9C27B0)',cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0,boxShadow:'0 2px 8px rgba(126,87,194,0.35)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z" fill="white"/>
            </svg>
          </button>
        </div>

        {/* ── 바디 ── */}
        <div style={{padding:'14px 10px 22px',background:'white',borderRadius:'0 0 20px 20px'}}>

          {/* 라운드 도트 + 타겟 카드 헤더 */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'0 4px'}}>
            <span style={{fontSize:'0.76rem',fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.08em'}}>찾아야 할 단어</span>
            <div style={{display:'flex',gap:4}}>{roundDots}</div>
          </div>

          {/* ── 타겟 카드 (HTML 파일과 동일 스타일) ── */}
          <div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:14,height:140,alignItems:'stretch'}}>
            {rs.targets.map((t,idx)=>{
              const found=rs.foundWords.has(t.word)
              const prog=rs.wordProgress[t.id]??0
              const syls=Array.from(t.word)
              const pal=FOUND_GRADIENTS[idx%FOUND_GRADIENTS.length]
              return (
                <button key={t.id} id={`ko-chip-${t.id}`} onClick={()=>onChipClick(t)}
                  style={{flex:1,maxWidth:130,padding:'10px 6px',borderRadius:12,
                    background:found?'linear-gradient(135deg,#E8F5E9,#C8E6C9)':'#f5f0ff',
                    border:`2.5px solid ${found?'#4CAF50':'#d1c4e9'}`,
                    textAlign:'center',position:'relative',cursor:'pointer',fontFamily:'inherit',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.09)',transition:'all 0.25s',
                  }}>
                  {found&&<span style={{position:'absolute',top:-10,right:-8,fontSize:'1.2rem'}}>✅</span>}
                  <div style={{fontSize:'3.6rem',lineHeight:1,marginBottom:4}}>{t.emoji}</div>
                  <div style={{fontSize:'0.78rem',color:found?'#2E7D32':'#2c3e50',fontWeight:700}}>{t.word}</div>
                  {/* 음절 박스 */}
                  <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:4,flexWrap:'nowrap'}}>
                    {syls.map((s,i)=>{
                      const done=found||(i<prog)
                      return (
                        <span key={i} style={{
                          display:'inline-flex',alignItems:'center',justifyContent:'center',
                          width:22,height:22,borderRadius:6,fontSize:'0.68rem',fontWeight:900,
                          background:done?pal.syl:'white',
                          color:done?'white':'#ccc',
                          border:done?'none':'2px dashed #d0c4f0',
                          transition:'all 0.25s',
                        }}>{done?s:'?'}</span>
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── 그리드 ── */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <div
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
              style={{display:'grid',gridTemplateColumns:`repeat(${cfg.grid},${cfg.cellPx}px)`,gap:4,background:'#EDE7F6',padding:8,borderRadius:18,boxShadow:'0 4px 16px rgba(126,87,194,0.18)',userSelect:'none',touchAction:'none'}}
            >
              {rs.grid.map((row,r)=>row.map((cell,c)=>{
                const cls=getCellClass(r,c)
                return (
                  <div key={`${r}-${c}`} data-r={r} data-c={c}
                    className={`ko-pzl-cell${cls?' '+cls:''}`}
                    style={{width:cfg.cellPx,height:cfg.cellPx,fontSize:cfg.fontSize,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,cursor:'pointer',userSelect:'none',position:'relative',fontFamily:'inherit'}}>
                    {cell}
                  </div>
                )
              }))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
