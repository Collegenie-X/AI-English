'use client'

import { useState, useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import type { ConvDialogSituation, ConvDialogTurn } from '@/types/content'

type QuizMode = 'en→ko' | 'ko→en'

interface QuizModalProps {
  situation: ConvDialogSituation
  onClose: () => void
  onRetry: () => void
}

interface TurnCardProps {
  turn: ConvDialogTurn
  mode: QuizMode
  index: number
  total: number
}

function TurnCard({ turn, mode, index, total }: TurnCardProps) {
  const { speak } = useTTS()
  const [revealed, setRevealed] = useState(false)
  const isParent = turn.role === 'b'

  const questionText = mode === 'en→ko' ? turn.english : turn.korean
  const answerText   = mode === 'en→ko' ? turn.korean  : turn.english
  const questionLang = mode === 'en→ko' ? 'en-US' : 'ko-KR'
  const answerLang   = mode === 'en→ko' ? 'ko-KR' : 'en-US'

  const accentColor = isParent ? '#f97316' : '#3b82f6'

  return (
    <div
      className="rounded-2xl border-2 border-b-4 overflow-hidden bg-white shadow-sm"
      style={{ borderColor: accentColor + '33', borderBottomColor: accentColor + '66' }}
    >
      {/* Turn header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: accentColor + '12' }}
      >
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: accentColor }}
        >
          {index + 1}/{total}
        </span>
        <span className="text-xs font-black text-foreground">{turn.speaker}</span>
        <span
          className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: accentColor + '20', color: accentColor }}
        >
          {mode === 'en→ko' ? '영어 → 한국어' : '한국어 → 영어'}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Question */}
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {mode === 'en→ko' ? 'English' : '한국어'}
          </p>
          <div className="flex items-start gap-2">
            <p className="text-base font-black text-foreground flex-1 leading-relaxed">
              {questionText}
            </p>
            <button
              onClick={() => speak(questionText, questionLang, 0.85)}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all hover:scale-110"
              style={{
                borderColor: accentColor + '55',
                color: accentColor,
                backgroundColor: accentColor + '10',
              }}
            >
              🔊
            </button>
          </div>
        </div>

        {/* Answer reveal */}
        {!revealed ? (
          <button
            onClick={() => {
              setRevealed(true)
              setTimeout(() => speak(answerText, answerLang, 0.85), 200)
            }}
            className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-black transition-all hover:opacity-80"
            style={{ borderColor: accentColor + '55', color: accentColor, background: accentColor + '08' }}
          >
            정답 보기 👁️
          </button>
        ) : (
          <div
            className="rounded-xl px-4 py-3 space-y-1 border-l-4 animate-in fade-in duration-300"
            style={{ background: accentColor + '10', borderLeftColor: accentColor }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
              {mode === 'en→ko' ? '한국어' : 'English'}
            </p>
            <div className="flex items-start gap-2">
              <p className="text-sm font-black text-foreground flex-1 leading-relaxed">{answerText}</p>
              <button
                onClick={() => speak(answerText, answerLang, 0.85)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                style={{ background: accentColor + '20', color: accentColor }}
              >
                🔊
              </button>
            </div>

            {/* Grammar tip on reveal */}
            {turn.tip && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: accentColor + '22' }}>
                <p className="text-[10px] font-black" style={{ color: accentColor }}>{turn.tip.tag}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{turn.tip.text}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function QuizModal({ situation, onClose, onRetry }: QuizModalProps) {
  const [mode, setMode] = useState<QuizMode>('en→ko')
  const [score, setScore] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [phase, setPhase] = useState<'quiz' | 'done'>('quiz')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const turns = situation.turns
  const currentTurn = turns[currentIdx]
  const isLast = currentIdx === turns.length - 1

  const handleNext = () => {
    if (isLast) {
      setPhase('done')
    } else {
      setCurrentIdx(i => i + 1)
      setRevealedCount(0)
    }
  }

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 text-center">
          <span className="text-6xl">{situation.emoji}</span>
          <h2 className="text-xl font-black text-foreground">완료!</h2>
          <p className="text-sm font-semibold text-muted-foreground">
            {situation.name} — {turns.length}턴 퀴즈 완료
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onRetry}
              className="flex-1 py-3 rounded-2xl border-2 border-b-4 text-sm font-black text-violet-700 border-violet-300 hover:bg-violet-50 transition-all active:translate-y-0.5"
            >
              다시 풀기
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border-b-4 text-white text-sm font-black bg-violet-600 border-violet-800 hover:opacity-90 transition-all active:translate-y-0.5"
            >
              완료 ✓
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ background: situation.color }}
        >
          <span className="text-3xl">{situation.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{situation.name}</p>
            <p className="text-xs text-white/80 font-semibold">{situation.nameEn}</p>
          </div>
          <span className="text-[11px] font-black bg-white/25 text-white px-2.5 py-1 rounded-full">
            퀴즈 Stage 2
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 font-black text-sm"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 flex-shrink-0">
          <div
            className="h-full bg-violet-500 transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / turns.length) * 100}%` }}
          />
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 px-4 pt-3 pb-1 flex-shrink-0">
          {(['en→ko', 'ko→en'] as QuizMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-black border-2 border-b-[3px] transition-all active:translate-y-0.5',
                mode === m
                  ? 'bg-violet-600 text-white border-violet-600 border-b-violet-800'
                  : 'bg-white text-muted-foreground border-gray-200 border-b-gray-300 hover:bg-violet-50'
              )}
            >
              {m === 'en→ko' ? '영어 → 한국어' : '한국어 → 영어'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <TurnCard
            key={`${currentIdx}-${mode}`}
            turn={currentTurn}
            mode={mode}
            index={currentIdx}
            total={turns.length}
          />
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
            <span>{currentIdx + 1} / {turns.length}</span>
          </div>
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl text-white font-black text-sm border-b-[3px] active:translate-y-0.5 active:border-b-[2px] transition-all bg-violet-600"
            style={{ borderBottomColor: '#5b21b6' }}
          >
            {isLast ? '완료 🎉' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
