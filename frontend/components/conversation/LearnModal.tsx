'use client'

import { useState, useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import type { ConvDialogSituation, ConvDialogTurn } from '@/types/content'

interface LearnModalProps {
  situation: ConvDialogSituation
  onClose: () => void
  onGoQuiz: () => void
}

const CHUNK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FDCB6E', '#A29BFE', '#FD79A8']

function TurnBubble({
  turn, revealed, color,
}: {
  turn: ConvDialogTurn
  revealed: boolean
  color: string
}) {
  const { speak } = useTTS()
  const isParent = turn.role === 'b'

  return (
    <div className={cn('flex flex-col gap-1 animate-in fade-in duration-400', isParent ? 'items-start' : 'items-end')}>
      <span className="text-[10px] text-muted-foreground font-black px-1">{turn.speaker}</span>

      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-3 shadow-sm',
          isParent
            ? 'bg-orange-50 border-2 border-orange-200 rounded-tl-sm'
            : 'bg-blue-50 border-2 border-blue-200 rounded-tr-sm'
        )}
      >
        <p className="text-sm font-black text-foreground leading-relaxed">{turn.english}</p>

        {/* Chunks */}
        <div className="flex flex-wrap gap-1 mt-2">
          {turn.chunks.map((chunk, ci) => (
            <button
              key={ci}
              onClick={() => speak(chunk, 'en-US', 0.75)}
              className="text-[11px] font-black px-2.5 py-1 rounded-full text-white transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: CHUNK_COLORS[ci % CHUNK_COLORS.length] }}
            >
              {chunk}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground font-semibold mt-2 leading-snug">{turn.korean}</p>

        {/* Grammar tip */}
        {turn.tip && (
          <div
            className="mt-2 px-3 py-2 rounded-xl text-[11px] leading-relaxed border-l-4"
            style={{
              background: isParent ? '#fff7ed' : '#eff6ff',
              borderLeftColor: isParent ? '#f97316' : '#3b82f6',
            }}
          >
            <span className="font-black block mb-0.5">{turn.tip.tag}</span>
            <span className="text-muted-foreground">{turn.tip.text}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => speak(turn.english, 'en-US', 0.85)}
        className="text-[11px] font-black px-2 hover:underline"
        style={{ color }}
      >
        🔊 듣기
      </button>
    </div>
  )
}

export function LearnModal({ situation, onClose, onGoQuiz }: LearnModalProps) {
  const { speak } = useTTS()
  const [revealed, setRevealed] = useState(1)

  const ACCENT = '#58CC02'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const t = setTimeout(() => {
      if (situation.turns[0]) speak(situation.turns[0].english, 'en-US', 0.85)
    }, 400)
    return () => clearTimeout(t)
  }, [situation, speak])

  const showNext = () => {
    const next = revealed
    setRevealed(v => v + 1)
    const turn = situation.turns[next]
    if (turn) setTimeout(() => speak(turn.english, 'en-US', 0.85), 300)
  }

  const allDone = revealed >= situation.turns.length

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
            <p className="text-sm font-black text-white leading-tight">{situation.name}</p>
            <p className="text-xs text-white/80 font-semibold">{situation.nameEn}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black bg-white/25 text-white px-2.5 py-1 rounded-full">
              학습 Stage 1
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 text-sm font-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 flex-shrink-0">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(revealed / situation.turns.length) * 100}%`,
              background: ACCENT,
            }}
          />
        </div>

        {/* Turn bubbles */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {situation.turns.slice(0, revealed).map(turn => (
            <TurnBubble key={turn.turn} turn={turn} revealed color={ACCENT} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>{revealed}/{situation.turns.length} 턴</span>
            {allDone && <span className="text-green-600 font-black">완료!</span>}
          </div>

          {!allDone ? (
            <button
              onClick={showNext}
              className="w-full py-3 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90 border-b-[3px] active:translate-y-0.5 active:border-b-[2px]"
              style={{ backgroundColor: ACCENT, borderBottomColor: '#46A302' }}
            >
              다음 대화 → ({revealed}/{situation.turns.length})
            </button>
          ) : (
            <button
              onClick={onGoQuiz}
              className="w-full py-3 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90 border-b-[3px] active:translate-y-0.5 active:border-b-[2px] bg-violet-600"
              style={{ borderBottomColor: '#5b21b6' }}
            >
              🎯 Stage 2 퀴즈 풀기!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
