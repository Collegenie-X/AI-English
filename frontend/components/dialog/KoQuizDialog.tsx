'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

const QUIZ_HEADER = 'linear-gradient(135deg, #FF9800, #FF5722)'

interface KoQuizDialogProps {
  words: KoWordItem[]
  allWords: KoWordItem[]
  catName: string
  catColor: string
  onClose: () => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildChoices(target: KoWordItem, pool: KoWordItem[]): KoWordItem[] {
  const distractors = pool.filter(w => w.id !== target.id)
  return shuffle([target, ...shuffle(distractors).slice(0, 3)])
}

function SpeakerIcon({ color = 'white', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="3,8 3,16 7,16 13,21 13,3 7,8" fill={color} />
      <path d="M16 8.5a5 5 0 010 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function KoQuizDialog({ words, allWords, catName, catColor, onClose }: KoQuizDialogProps) {
  type QuizMode = 'choice' | 'type'
  const [mode, setMode] = useState<QuizMode>('choice')
  const [qCount, setQCount] = useState(Math.min(10, words.length))
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<KoWordItem[]>([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [choices, setChoices] = useState<KoWordItem[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [typeAnswer, setTypeAnswer] = useState('')
  const [typeResult, setTypeResult] = useState<'none' | 'correct' | 'wrong'>('none')
  const [showHint, setShowHint] = useState(false)
  const [done, setDone] = useState(false)
  const { speak } = useTTS()
  const inputRef = useRef<HTMLInputElement>(null)
  const pool = allWords.length >= 4 ? allWords : words

  const startQuiz = useCallback(() => {
    const qs = shuffle(words).slice(0, qCount)
    setQuestions(qs)
    setIdx(0); setScore(0); setSelected(null)
    setTypeAnswer(''); setTypeResult('none'); setShowHint(false)
    setStarted(true); setDone(false)
    setTimeout(() => speak(qs[0].word, 'ko-KR', 0.9), 350)
  }, [words, qCount, speak])

  const current = questions[idx]

  useEffect(() => {
    if (!current || mode !== 'choice') return
    setChoices(buildChoices(current, pool))
    setSelected(null)
  }, [idx, current, mode])

  const advance = useCallback((ok: boolean) => {
    const next = idx + 1
    if (next >= questions.length) { setDone(true); return }
    setIdx(next)
    setSelected(null); setTypeAnswer(''); setTypeResult('none'); setShowHint(false)
    setTimeout(() => {
      speak(questions[next].word, 'ko-KR', 0.9)
      inputRef.current?.focus()
    }, 350)
  }, [idx, questions, speak])

  const pick = useCallback((i: number) => {
    if (selected !== null) return
    setSelected(i)
    const ok = choices[i]?.id === current.id
    if (ok) { setScore(s => s + 1); speak('잘했어요!', 'ko-KR') }
    else speak(current.word, 'ko-KR', 0.8)
    setTimeout(() => advance(ok), 1200)
  }, [selected, choices, current, advance, speak])

  const checkType = useCallback(() => {
    if (typeResult !== 'none' || typeAnswer.trim() === '') return
    const ok = typeAnswer.trim() === current.word
    setTypeResult(ok ? 'correct' : 'wrong')
    if (ok) { setScore(s => s + 1); speak('잘했어요!', 'ko-KR') }
    else speak(current.word, 'ko-KR', 0.8)
    setTimeout(() => advance(ok), 1200)
  }, [typeResult, typeAnswer, current, advance, speak])

  const skipQuestion = useCallback(() => {
    const next = idx + 1
    if (next >= questions.length) { setDone(true); return }
    setIdx(next)
    setSelected(null); setTypeAnswer(''); setTypeResult('none'); setShowHint(false)
    setTimeout(() => speak(questions[next].word, 'ko-KR', 0.9), 300)
  }, [idx, questions, speak])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && mode === 'type' && started && !done && typeResult === 'none') checkType()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, mode, started, done, typeResult, checkType])

  const pct = started && questions.length > 0 ? (idx / questions.length) * 100 : 0
  const numColors = ['#FF9800', '#4caf50', '#2196f3', '#e91e63']

  // ── Result screen ──────────────────────────────────────────────────────────
  if (done && started) {
    const total = questions.length
    const pctScore = Math.round((score / total) * 100)
    const stars = pctScore >= 90 ? 3 : pctScore >= 70 ? 2 : pctScore >= 50 ? 1 : 0
    const msg = pctScore >= 90 ? '완벽해요!' : pctScore >= 70 ? '잘했어요!' : pctScore >= 50 ? '좋아요!' : '다시 해봐요!'
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()}>
          <div className="dialog-header-gradient" style={{ background: QUIZ_HEADER }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>퀴즈 결과</span>
            <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
          </div>
          <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>{pctScore >= 70 ? '🎉' : pctScore >= 50 ? '🙂' : '💪'}</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>{msg}</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(s => (
                <svg key={s} width="40" height="40" viewBox="0 0 24 24" aria-hidden>
                  <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3"
                    fill={s <= stars ? '#FFD700' : '#e0e0e0'} stroke={s <= stars ? '#cba800' : '#ccc'} strokeWidth="1" />
                </svg>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>
                {score}<span style={{ fontSize: '1.2rem', color: '#aaa' }}>/{total}</span>
              </p>
              <p style={{ color: '#aaa', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>{pctScore}% 정확도</p>
            </div>
            <div style={{ background: '#FFF9C4', borderRadius: '14px', padding: '8px 24px', border: '2px solid #FFD700' }}>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#9a7000' }}>+{score * 10} XP</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '280px' }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: '14px', background: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                닫기
              </button>
              <button onClick={startQuiz}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', background: QUIZ_HEADER, color: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                다시
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup screen ───────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()}>
          <div className="dialog-header-gradient" style={{ background: QUIZ_HEADER }}>
            <div>
              <p style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{catName} 퀴즈</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0, marginTop: '2px' }}>{words.length}단어 풀</p>
            </div>
            <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
          </div>

          <div style={{ padding: '24px 20px 32px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#aaa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>출제 방식</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {(['choice', 'type'] as QuizMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, background: mode === m ? QUIZ_HEADER : '#f0f2f5', color: mode === m ? 'white' : '#666', boxShadow: mode === m ? '0 4px 14px rgba(255,152,0,0.4)' : 'none', transition: 'all 0.2s' }}>
                  {m === 'choice' ? '🅰 객관식' : '⌨ 주관식'}
                </button>
              ))}
            </div>

            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#aaa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>문제 수</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <input type="range" className="quiz-slider" min={2} max={words.length} value={qCount}
                onChange={e => setQCount(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#FF9800', minWidth: '54px', textAlign: 'right' }}>
                {qCount}문제
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#ccc', marginBottom: '28px' }}>전체 {words.length}단어 중 랜덤 출제</p>

            <button onClick={startQuiz}
              style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '18px', background: QUIZ_HEADER, color: 'white', fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,152,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5,3 19,12 5,21" /></svg>
              퀴즈 시작
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!current) return null

  // ── Active quiz screen ─────────────────────────────────────────────────────
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>
        {/* Orange gradient header */}
        <div className="dialog-header-gradient" style={{ background: QUIZ_HEADER }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: '10px', padding: '3px 12px', fontWeight: 900, fontSize: '0.88rem' }}>
              ⭐ {score * 10}점
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.82rem' }}>
              {idx + 1} / {questions.length}
            </span>
            <button onClick={startQuiz}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '10px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }}>
              새로고침
            </button>
          </div>
          <button className="dialog-close-btn" onClick={onClose} style={{ marginLeft: '8px' }} aria-label="닫기">✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '5px', background: '#ffe0b2', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#FF9800', width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question card — big emoji on colored bg */}
          <div style={{ background: `linear-gradient(135deg, ${catColor}cc, ${catColor})`, borderRadius: '24px', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', boxShadow: `0 6px 24px ${catColor}44` }}>
            <span style={{ fontSize: '80px', lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
              {current.emoji}
            </span>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>
              {mode === 'choice' ? '이 그림은 무엇일까요?' : '이 그림의 한글 단어를 입력하세요!'}
            </p>
            <button onClick={() => speak(current.word, 'ko-KR', 0.9)}
              style={{ position: 'absolute', top: '12px', right: '14px', width: '36px', height: '36px', border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.28)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="듣기">
              <SpeakerIcon color="white" size={18} />
            </button>
          </div>

          {/* ── Choice mode ── */}
          {mode === 'choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {choices.map((c, i) => {
                const isCorrect = c.id === current.id
                const isSelected = selected === i
                let bg = '#fff', borderCol = '#e8e8e8', textCol = '#333'
                if (selected !== null) {
                  if (isCorrect)       { bg = '#e8f5e9'; borderCol = '#4caf50'; textCol = '#2e7d32' }
                  else if (isSelected) { bg = '#fce4ec'; borderCol = '#ef5350'; textCol = '#c62828' }
                  else                 { bg = '#f9f9f9'; borderCol = '#e0e0e0'; textCol = '#bbb' }
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={selected !== null}
                    style={{ padding: '12px 10px', border: `2px solid ${borderCol}`, borderRadius: '14px', background: bg, cursor: selected !== null ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', boxShadow: selected !== null && (isCorrect || isSelected) ? '0 4px 14px rgba(0,0,0,0.1)' : 'none' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: numColors[i % numColors.length], color: 'white', fontWeight: 900, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: textCol, flex: 1, textAlign: 'left' }}>{c.word}</span>
                    <button onClick={e => { e.stopPropagation(); speak(c.word, 'ko-KR', 1.0) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                      aria-label={`${c.word} 듣기`}>
                      <SpeakerIcon color={numColors[i % numColors.length]} size={14} />
                    </button>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Type mode ── */}
          {mode === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from(current.word).map((_, i) => (
                  <div key={i} style={{ width: '46px', height: '46px', borderRadius: '12px', border: `2px solid ${typeResult === 'correct' ? '#4caf50' : typeResult === 'wrong' ? '#ef5350' : '#FF9800'}`, background: typeResult === 'none' ? '#fff9f0' : typeResult === 'correct' ? '#e8f5e9' : '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: typeResult === 'none' ? '#FF9800' : typeResult === 'correct' ? '#2e7d32' : '#c62828' }}>
                    {typeAnswer[i] ?? '?'}
                  </div>
                ))}
              </div>

              <input ref={inputRef} type="text" value={typeAnswer}
                onChange={e => typeResult === 'none' && setTypeAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkType()}
                placeholder="한글로 입력하세요" disabled={typeResult !== 'none'}
                autoComplete="off" autoFocus
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #FFE0B2', borderRadius: '14px', fontFamily: 'inherit', fontSize: '1.05rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box', background: typeResult === 'none' ? 'white' : typeResult === 'correct' ? '#e8f5e9' : '#fce4ec', color: '#333' }} />

              {showHint && (
                <div style={{ padding: '8px 14px', background: '#fff3e0', borderRadius: '10px', fontSize: '0.85rem', color: '#e65100', fontWeight: 700 }}>
                  힌트: {current.word[0]}... ({current.word.length}글자)
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowHint(v => !v)}
                  style={{ padding: '10px 14px', border: '2px solid #FFE0B2', borderRadius: '12px', background: 'white', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#FF9800', transition: 'all 0.15s' }}>
                  힌트
                </button>
                <button onClick={checkType} disabled={typeResult !== 'none' || typeAnswer.trim() === ''}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '12px', background: QUIZ_HEADER, color: 'white', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', opacity: typeAnswer.trim() === '' ? 0.5 : 1, transition: 'all 0.15s' }}>
                  확인
                </button>
                <button onClick={skipQuestion}
                  style={{ padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', background: 'white', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#aaa' }}>
                  건너뛰기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
