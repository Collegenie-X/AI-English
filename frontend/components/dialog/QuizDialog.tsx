'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import { GameMascot, type MascotMood } from '@/components/mascot/GameMascot'
import type { WordItem } from '@/types/content'

interface QuizDialogProps {
  item: WordItem
  allWords: WordItem[]
  questionIndex: number
  totalQuestions: number
  score: number
  color?: string
  onAnswer: (correct: boolean) => void
  onClose: () => void
}

export function QuizDialog({
  item, allWords, questionIndex, totalQuestions, score, color = 'var(--game-blue)', onAnswer, onClose
}: QuizDialogProps) {
  const { speak } = useTTS()
  const [choices, setChoices] = useState<WordItem[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wrong = allWords
      .filter(w => w.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    setChoices([item, ...wrong].sort(() => Math.random() - 0.5))
    setSelected(null)
    setTimeLeft(15)
    setMascotMood('speaking')
    const t = setTimeout(() => { speak(item.tts, 'en-US', 0.8); setMascotMood('idle') }, 400)
    return () => clearTimeout(t)
  }, [item, allWords, speak])

  useEffect(() => {
    if (selected !== null) return
    if (timeLeft <= 0) { handleSelect(-1); return }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selected])

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = idx !== -1 && choices[idx]?.id === item.id
    setMascotMood(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) speak('Correct!', 'en-US')
    else speak(item.tts, 'en-US', 0.7)
    setTimeout(() => { onAnswer(isCorrect); setMascotMood('idle') }, 1200)
  }, [selected, choices, item, onAnswer, speak])

  const progressPct = (questionIndex / totalQuestions) * 100
  const timerColor = timeLeft > 8 ? 'var(--game-green)' : timeLeft > 4 ? 'var(--game-yellow)' : 'var(--game-red)'

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="퀴즈 종료">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1 progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-yellow-50 border border-yellow-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" /></svg>
          <span className="text-xs font-black text-yellow-600">{score * 10} XP</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-4 py-6 max-w-md mx-auto w-full">
        {/* Mascot + question */}
        <div className="flex flex-col items-center gap-3">
          <GameMascot mood={mascotMood} size={80} />
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            이 그림에 맞는 단어를 고르세요
          </p>
          <span className="text-8xl leading-none select-none">{item.emoji}</span>
          <button
            onClick={() => speak(item.tts, 'en-US', 0.85)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-b-4 text-xs font-black transition-all active:translate-y-0.5 active:border-b-[2px]"
            style={{ backgroundColor: color + '10', borderColor: color + '44', borderBottomColor: color + '88', color }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
              <path d="M15.5 8.5a5 5 0 010 7" />
            </svg>
            다시 듣기
          </button>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 my-2">
          <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center text-sm font-black transition-colors"
            style={{ borderColor: timerColor, color: timerColor }}>
            {timeLeft}
          </div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-36">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 15) * 100}%`, backgroundColor: timerColor }} />
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {choices.map((choice, idx) => {
            const isCorrect = choice.id === item.id
            const isSelected = selected === idx
            let extraCls = 'bg-white border-border hover:bg-muted/20'
            if (selected !== null) {
              if (isCorrect) extraCls = 'choice-correct animate-bounce-in'
              else if (isSelected) extraCls = 'choice-wrong animate-shake'
              else extraCls = 'bg-muted/30 border-border/40 opacity-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-b-4 text-sm font-black transition-all active:translate-y-0.5 active:border-b-[2px]', extraCls)}
              >
                <span className="text-4xl leading-none">{choice.emoji}</span>
                <span className="text-sm font-black">{choice.letter || choice.word}</span>
                {choice.hint && <span className="text-[10px] text-muted-foreground">{choice.hint}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
