'use client'

import { useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { GameMascot, type MascotMood } from '@/components/mascot/GameMascot'

interface ResultDialogProps {
  score: number
  total: number
  stage: number
  color?: string
  onClose: () => void
  onRetry: () => void
}

export function ResultDialog({ score, total, stage, color, onClose, onRetry }: ResultDialogProps) {
  const { speak } = useTTS()
  const pct = Math.round((score / total) * 100)
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0
  const xp = score * 10

  const stageColors: Record<number, string> = {
    1: 'var(--game-blue)',
    2: 'var(--game-orange)',
    3: 'var(--game-green)',
    4: 'var(--game-pink)',
  }
  const stageColor = color ?? stageColors[stage] ?? 'var(--game-blue)'
  const mascotMood: MascotMood = pct >= 80 ? 'correct' : pct >= 50 ? 'happy' : 'wrong'

  const gradeText = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 50 ? '좋은 시도!' : '다시 도전!'

  useEffect(() => {
    const msg = stars === 3 ? 'Amazing! Perfect score!' : stars >= 2 ? 'Great job! Well done!' : 'Keep trying!'
    const t = setTimeout(() => speak(msg, 'en-US'), 400)
    return () => clearTimeout(t)
  }, [stars, speak])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-bounce-in border-2 border-b-4"
        style={{ borderColor: stageColor + '44', borderBottomColor: stageColor }}>

        {/* Color top bar */}
        <div className="h-2" style={{ backgroundColor: stageColor }} />

        {/* Hero */}
        <div className="px-5 pt-6 pb-4 flex flex-col items-center gap-3 text-center">
          <GameMascot mood={mascotMood} size={100} />
          <p className="text-2xl font-black text-foreground">{gradeText}</p>
          <p className="text-sm font-bold text-muted-foreground">Stage {stage} 퀴즈 완료</p>

          {/* Stars */}
          <div className="flex gap-2">
            {[1,2,3].map(s => (
              <svg key={s} width="38" height="38" viewBox="0 0 24 24"
                className={s <= stars ? 'animate-bounce-in' : 'opacity-20'}
                style={{ animationDelay: `${(s - 1) * 0.12}s` }}>
                <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3"
                  fill={s <= stars ? '#FFD700' : '#e5e7eb'} stroke={s <= stars ? '#E6A800' : '#d1d5db'} strokeWidth="1" />
              </svg>
            ))}
          </div>
        </div>

        {/* Score body */}
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center justify-between bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
            <span className="text-sm font-black text-muted-foreground">정확도</span>
            <span className="text-3xl font-black" style={{ color: stageColor }}>{pct}%</span>
            <span className="text-sm text-muted-foreground font-semibold">{score}/{total}</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl px-4 py-2.5 border-2 bg-yellow-50 border-yellow-200">
            <span className="text-xs font-black text-muted-foreground">획득 XP</span>
            <span className="text-lg font-black text-yellow-600">+{xp} XP</span>
          </div>

          <div className="bg-muted/60 rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: stageColor }} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onRetry}
              className="flex-1 py-3 bg-white border-2 border-border border-b-4 text-foreground rounded-2xl font-black text-sm hover:bg-muted/40 transition-all active:translate-y-0.5 active:border-b-[2px]">
              다시 풀기
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-white font-black text-sm border-b-4 transition-all active:translate-y-0.5 active:border-b-[2px]"
              style={{ backgroundColor: stageColor, borderBottomColor: stageColor + 'AA' }}>
              계속 학습
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
