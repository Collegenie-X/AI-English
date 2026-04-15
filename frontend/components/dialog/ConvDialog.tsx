'use client'

import { useState, useEffect } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils'
import type { ConversationItem } from '@/types/content'

interface ConvDialogProps {
  item: ConversationItem
  onClose: () => void
}

export function ConvDialog({ item, onClose }: ConvDialogProps) {
  const { speak, speaking } = useTTS()
  const [visibleTurns, setVisibleTurns] = useState(1)
  const [quizMode, setQuizMode] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [activeChunk, setActiveChunk] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Auto-read first turn
  useEffect(() => {
    const t = setTimeout(() => {
      if (item.turns[0]) speak(item.turns[0].english, 'en-US', 0.8)
    }, 500)
    return () => clearTimeout(t)
  }, [item, speak])

  const handleChunkClick = (chunk: string) => {
    setActiveChunk(chunk)
    speak(chunk, 'en-US', 0.75)
    setTimeout(() => setActiveChunk(null), 1500)
  }

  const showNext = () => {
    if (visibleTurns < item.turns.length) {
      const next = visibleTurns
      setVisibleTurns(v => v + 1)
      setTimeout(() => {
        if (item.turns[next]) speak(item.turns[next].english, 'en-US', 0.85)
      }, 300)
    } else {
      setQuizMode(true)
    }
  }

  const handleAnswer = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === item.answer
    speak(correct ? 'Correct! Well done!' : item.quizChoices[item.answer], 'en-US')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: item.color || '#e5e7eb' }}
          >
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground">{item.name || item.situation}</p>
            <p className="text-xs text-muted-foreground font-semibold">{item.turns.length}번 대화</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border"
          >
            ✕
          </button>
        </div>

        {/* Conversation turns */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {item.turns.slice(0, visibleTurns).map((turn, i) => {
            const isChild = turn.role === 'child'
            return (
              <div
                key={i}
                className={cn('flex flex-col gap-1 animate-in fade-in duration-300', isChild ? 'items-end' : 'items-start')}
              >
                <span className="text-xs text-muted-foreground font-semibold px-1">{turn.speaker}</span>

                {/* Speech bubble */}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3',
                    isChild ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                  )}
                >
                  <p className="text-sm font-bold leading-relaxed">{turn.english}</p>

                  {/* Chunks */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {turn.chunks.map((chunk, ci) => (
                      <button
                        key={ci}
                        onClick={() => handleChunkClick(chunk)}
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-full transition-all',
                          isChild
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-border hover:bg-accent text-foreground',
                          activeChunk === chunk && 'scale-110 ring-2 ring-primary'
                        )}
                      >
                        {chunk}
                      </button>
                    ))}
                  </div>

                  {/* Korean */}
                  <p className={cn('text-xs mt-1 opacity-70 font-semibold', isChild ? 'text-white' : 'text-muted-foreground')}>
                    {turn.korean}
                  </p>
                </div>

                <button
                  onClick={() => speak(turn.english, 'en-US', 0.85)}
                  className="text-xs text-primary font-bold hover:underline px-1"
                >
                  🔊 듣기
                </button>
              </div>
            )
          })}
        </div>

        {/* Quiz or Next Turn */}
        <div className="px-4 pb-4 pt-2 border-t border-border flex-shrink-0">
          {!quizMode ? (
            <button
              onClick={showNext}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:opacity-90 transition-opacity"
            >
              {visibleTurns < item.turns.length ? `다음 대화 → (${visibleTurns}/${item.turns.length})` : '퀴즈 풀기!'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-black text-muted-foreground text-center uppercase tracking-wider">
                다음에 올 표현은?
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {item.quizChoices.map((choice, idx) => {
                  const isAnswer = idx === item.answer
                  const isSelected = selected === idx
                  let bg = 'bg-muted hover:bg-accent/30 border-border'
                  if (isSelected && isAnswer) bg = 'bg-green-100 border-green-400 text-green-800'
                  else if (isSelected && !isAnswer) bg = 'bg-red-100 border-red-400 text-red-800'
                  else if (selected !== null && isAnswer) bg = 'bg-green-100 border-green-400 text-green-800'

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selected !== null}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-2xl border text-sm font-bold transition-all',
                        bg,
                        selected === null && 'active:scale-[0.98]'
                      )}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
              {selected !== null && (
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm font-black text-primary hover:underline"
                >
                  완료 &#10003;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
