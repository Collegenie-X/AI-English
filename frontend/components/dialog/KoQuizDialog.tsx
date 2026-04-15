'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import type { KoWordItem } from '@/types/content'

const QUIZ_GRADIENT = 'linear-gradient(135deg, #FF9800, #FF5722)'

type QuizMode = 'choice' | 'type'

interface KoQuizDialogProps {
  words: KoWordItem[]
  allWords: KoWordItem[]
  catName: string
  catColor: string
  catIcon?: string
  onClose: () => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildChoices(target: KoWordItem, pool: KoWordItem[]): KoWordItem[] {
  const distractors = pool.filter(w => w.id !== target.id)
  return shuffle([target, ...shuffle(distractors).slice(0, 3)])
}

function SpeakerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="3,8 3,16 7,16 13,21 13,3 7,8" fill="currentColor" />
      <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

export function KoQuizDialog({
  words, allWords, catName, catColor, catIcon = '🎯', onClose
}: KoQuizDialogProps) {
  const [mode, setMode]               = useState<QuizMode>('choice')
  const [qCount, setQCount]           = useState(Math.min(10, words.length))
  const [started, setStarted]         = useState(false)
  const [questions, setQuestions]     = useState<KoWordItem[]>([])
  const [idx, setIdx]                 = useState(0)
  const [score, setScore]             = useState(0)
  const [choices, setChoices]         = useState<KoWordItem[]>([])
  const [selected, setSelected]       = useState<number | null>(null)
  const [typeAnswer, setTypeAnswer]   = useState('')
  const [typeResult, setTypeResult]   = useState<'none' | 'correct' | 'wrong'>('none')
  const [showHint, setShowHint]       = useState(false)
  const [done, setDone]               = useState(false)
  const { speak }                     = useTTS()
  const inputRef                      = useRef<HTMLInputElement>(null)
  const pool                          = allWords.length >= 4 ? allWords : words

  const buildQuestions = useCallback((count: number) => shuffle(words).slice(0, count), [words])

  const startQuiz = useCallback((count = qCount) => {
    const qs = buildQuestions(count)
    setQuestions(qs)
    setIdx(0); setScore(0); setSelected(null)
    setTypeAnswer(''); setTypeResult('none'); setShowHint(false)
    setStarted(true); setDone(false)
    setTimeout(() => speak(qs[0].word, 'ko-KR', 0.9), 350)
  }, [buildQuestions, qCount, speak])

  const refreshQuiz = useCallback((count = qCount) => {
    const qs = buildQuestions(count)
    setQuestions(qs)
    setIdx(0); setScore(0); setSelected(null)
    setTypeAnswer(''); setTypeResult('none'); setShowHint(false); setDone(false)
    setTimeout(() => speak(qs[0].word, 'ko-KR', 0.9), 350)
  }, [buildQuestions, qCount, speak])

  const current = questions[idx]

  useEffect(() => {
    if (!current || mode !== 'choice') return
    setChoices(buildChoices(current, pool))
    setSelected(null)
  }, [idx, current, mode, pool])

  const switchMode = (m: QuizMode) => {
    setMode(m)
    if (started && !done && current) {
      setSelected(null); setTypeAnswer(''); setTypeResult('none'); setShowHint(false)
      if (m === 'choice') setChoices(buildChoices(current, pool))
    }
  }

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

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && mode === 'type' && started && !done && typeResult === 'none') checkType()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, mode, started, done, typeResult, checkType])

  const pct = started && questions.length > 0 ? ((idx + 1) / questions.length) * 100 : 0
  const sylLen = current?.word.length ?? 1

  // ── Shared: header ─────────────────────────────────────────────────────────
  const QuizHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="dialog-header-gradient" style={{ background: QUIZ_GRADIENT }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{catIcon}</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>{title}</span>
        </div>
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.76rem', margin: '2px 0 0', fontWeight: 600 }}>
            {subtitle}
          </p>
        )}
      </div>
      <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
    </div>
  )

  // ── Shared: mode tabs ──────────────────────────────────────────────────────
  const ModeTabs = ({ onSwitch }: { onSwitch: (m: QuizMode) => void }) => (
    <div style={{ display: 'flex', background: '#f0f2f5', borderRadius: '20px', padding: '4px', gap: '4px' }}>
      {(['choice', 'type'] as QuizMode[]).map(m => (
        <button key={m} onClick={() => onSwitch(m)}
          style={{
            flex: 1, padding: '10px 8px', border: 'none', borderRadius: '16px',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700,
            background: mode === m ? 'white' : 'transparent',
            color: mode === m ? '#444' : '#999',
            boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}>
          {m === 'choice' ? '📋 객관식' : '⌨️ 주관식 (타자)'}
        </button>
      ))}
    </div>
  )

  // ── Shared: slider row ─────────────────────────────────────────────────────
  const SliderRow = ({
    label, value, max, onChange,
  }: { label?: string; value: number; max: number; onChange: (n: number) => void }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: '#f5f0ff', borderRadius: '14px', padding: '10px 14px',
      border: '2px solid #e8d5ff',
    }}>
      {label && (
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7E57C2', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {label}
        </span>
      )}
      <input type="range" className="quiz-slider" min={2} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#FF9800', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {value}문제
      </span>
    </div>
  )

  // ── Result screen ──────────────────────────────────────────────────────────
  if (done && started) {
    const total    = questions.length
    const pctScore = Math.round((score / total) * 100)
    const stars    = pctScore >= 90 ? 3 : pctScore >= 70 ? 2 : pctScore >= 50 ? 1 : 0
    const msg      = pctScore >= 90 ? '완벽해요! 🎊' : pctScore >= 70 ? '잘했어요! 👏' : pctScore >= 50 ? '좋아요! 💪' : '다시 해봐요! 🌟'
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog-panel" onClick={e => e.stopPropagation()}>
          <QuizHeader title="퀴즈 결과" />
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>
              {pctScore >= 70 ? '🎉' : pctScore >= 50 ? '🙂' : '💪'}
            </span>
            <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>{msg}</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(s => (
                <svg key={s} width="38" height="38" viewBox="0 0 24 24" aria-hidden>
                  <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3"
                    fill={s <= stars ? '#FFD700' : '#e0e0e0'}
                    stroke={s <= stars ? '#cba800' : '#ccc'} strokeWidth="1" />
                </svg>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>
                {score}
                <span style={{ fontSize: '1.1rem', color: '#aaa' }}>/{total}</span>
              </p>
              <p style={{ color: '#aaa', fontWeight: 600, fontSize: '0.88rem', marginTop: '4px' }}>{pctScore}% 정확도</p>
            </div>
            <div style={{ background: '#FFF9C4', borderRadius: '14px', padding: '8px 24px', border: '2px solid #FFD700' }}>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#9a7000' }}>+{score * 10} XP</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '280px' }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: '14px', background: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                닫기
              </button>
              <button onClick={() => startQuiz()}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', background: QUIZ_GRADIENT, color: 'white', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                다시 🔄
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
          <QuizHeader title={catName + ' 퀴즈'} subtitle={words.length + '단어 풀'} />
          <div style={{ padding: '22px 18px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.78rem', color: '#aaa', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                출제 방식
              </p>
              <ModeTabs onSwitch={m => setMode(m)} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.78rem', color: '#aaa', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                문제 수
              </p>
              <SliderRow value={qCount} max={words.length} onChange={setQCount} />
              <p style={{ fontSize: '0.78rem', color: '#bbb', margin: '6px 0 0', textAlign: 'center' }}>
                전체 {words.length}단어 중 랜덤 출제
              </p>
            </div>
            <button onClick={() => startQuiz()}
              style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '18px', background: QUIZ_GRADIENT, color: 'white', fontFamily: 'inherit', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,152,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="5,3 19,12 5,21" />
              </svg>
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

        {/* Header */}
        <QuizHeader title={catName} />

        <div style={{ padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Mode tabs */}
          <ModeTabs onSwitch={switchMode} />

          {/* Slider */}
          <SliderRow
            label="📝 문제 수"
            value={qCount}
            max={words.length}
            onChange={n => { setQCount(n); refreshQuiz(n) }}
          />

          {/* Score / counter / refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#FFF9C4', border: '2px solid #FDD835', borderRadius: '20px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>⭐</span>
              <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#F57F17' }}>{score}점</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ background: '#f5f5f5', borderRadius: '20px', padding: '5px 14px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#888' }}>{idx + 1} / {questions.length}</span>
            </div>
            <button onClick={() => refreshQuiz()}
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #e0d5ff', background: '#f4f0ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9C27B0', flexShrink: 0 }}
              aria-label="새로고침">
              <RefreshIcon size={15} />
            </button>
          </div>

          {/* Progress */}
          <div>
            <p style={{ textAlign: 'right', fontSize: '0.76rem', color: '#aaa', margin: '0 0 4px' }}>
              {idx + 1} / {questions.length}
            </p>
            <div style={{ height: '5px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg, ${catColor}, ${catColor}99)`, width: `${pct}%`, borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Image */}
          <div
            onClick={() => speak(current.word, 'ko-KR', 0.9)}
            style={{
              background: `linear-gradient(135deg, ${catColor}ee, ${catColor})`,
              borderRadius: '20px', width: '200px', height: '200px',
              margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: `0 8px 28px ${catColor}55`, flexShrink: 0,
            }}>
            <span style={{ fontSize: '90px', lineHeight: 1, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' }}>
              {current.emoji}
            </span>
          </div>

          {/* Question label */}
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: '#444', margin: 0 }}>
            {mode === 'choice'
              ? '이 그림은 무엇일까요?'
              : `이 그림의 단어를 입력하세요! (${sylLen}글자)`}
          </p>

          {/* ── Choice mode ── */}
          {mode === 'choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {choices.map((c, i) => {
                const isCorrect  = c.id === current.id
                const isSelected = selected === i
                let borderCol = '#e0e0e0', bg = 'white', textCol = '#2c3e50'
                if (selected !== null) {
                  if (isCorrect)       { bg = '#E8F5E9'; borderCol = '#4caf50'; textCol = '#2e7d32' }
                  else if (isSelected) { bg = '#FFEBEE'; borderCol = '#ef5350'; textCol = '#c62828' }
                  else                 { bg = '#fafafa'; borderCol = '#ebebeb'; textCol = '#bbb' }
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={selected !== null}
                    style={{ padding: '9px 8px', border: `2px solid ${borderCol}`, borderRadius: '16px', background: bg, cursor: selected !== null ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
                    {/* Number circle */}
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f0f2f5', color: '#888', fontWeight: 900, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {['①', '②', '③', '④'][i]}
                    </span>
                    {/* Word */}
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: textCol, flex: 1, textAlign: 'center' }}>
                      {c.word}
                    </span>
                    {/* Speaker */}
                    <button
                      onClick={e => { e.stopPropagation(); speak(c.word, 'ko-KR', 1.0) }}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid rgba(102,126,234,0.25)', background: 'rgba(102,126,234,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#667eea' }}
                      aria-label={`${c.word} 듣기`}>
                      <SpeakerIcon size={13} />
                    </button>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Type mode ── */}
          {mode === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Blank tiles */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {Array.from({ length: sylLen }, (_, i) => (
                  <div key={i} style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    border: `2px solid ${typeResult === 'correct' ? '#4caf50' : typeResult === 'wrong' ? '#ef5350' : '#ddd'}`,
                    background: typeResult === 'none' ? '#f8f9fa' : typeResult === 'correct' ? '#e8f5e9' : '#fce4ec',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 900,
                    color: typeResult === 'none' ? '#aaa' : typeResult === 'correct' ? '#2e7d32' : '#c62828',
                  }}>
                    {typeAnswer[i] ?? '?'}
                  </div>
                ))}
              </div>

              {/* Input + confirm button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={inputRef} type="text" value={typeAnswer}
                  onChange={e => typeResult === 'none' && setTypeAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkType()}
                  placeholder="−" disabled={typeResult !== 'none'}
                  autoComplete="off" autoFocus
                  style={{
                    flex: 1, padding: '14px 18px',
                    border: `3px solid ${typeResult === 'wrong' ? '#ef5350' : typeResult === 'correct' ? '#4caf50' : '#e0e0e0'}`,
                    borderRadius: '18px', fontFamily: 'inherit', fontSize: '1.4rem',
                    fontWeight: 700, outline: 'none', textAlign: 'center', letterSpacing: '4px',
                    background: typeResult === 'none' ? 'white' : typeResult === 'correct' ? '#e8f5e9' : '#fce4ec',
                    color: '#333', transition: 'border-color 0.2s',
                  }} />
                <button
                  onClick={checkType}
                  disabled={typeResult !== 'none' || typeAnswer.trim() === ''}
                  style={{
                    padding: '14px 20px', border: 'none', borderRadius: '18px',
                    background: 'linear-gradient(135deg, #2196F3, #03A9F4)', color: 'white',
                    fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700,
                    cursor: typeAnswer.trim() ? 'pointer' : 'not-allowed',
                    opacity: typeAnswer.trim() ? 1 : 0.55,
                    whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(33,150,243,0.35)',
                    transition: 'opacity 0.2s',
                  }}>
                  확인 ✓
                </button>
              </div>

              {/* Char count */}
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#aaa', margin: 0 }}>
                {typeAnswer.length} / {sylLen} 글자
              </p>

              {/* Hint revealed */}
              {showHint && (
                <div style={{ padding: '8px 14px', background: '#fff3e0', borderRadius: '10px', fontSize: '0.85rem', color: '#e65100', fontWeight: 700, textAlign: 'center' }}>
                  💡 힌트: {current.word[0]}... ({sylLen}글자)
                </div>
              )}

              {/* Hint button */}
              <button onClick={() => setShowHint(v => !v)}
                style={{ width: '100%', padding: '10px', border: '2px dashed #ddd', borderRadius: '14px', background: 'white', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', color: '#888', transition: 'all 0.15s' }}>
                💡 힌트 보기 (첫 글자 공개)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
