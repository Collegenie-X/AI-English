'use client'

import { cn } from '@/lib/utils'
import type { LearningMode } from '@/types/content'

interface ModeSelectorProps {
  mode: LearningMode
  onChange: (mode: LearningMode) => void
  isConvStage: boolean
  onStartQuiz: () => void
  hasWords: boolean
}

export function ModeSelector({ mode, onChange, isConvStage, onStartQuiz, hasWords }: ModeSelectorProps) {
  const modes = isConvStage
    ? [
        { id: 'learn' as LearningMode, label: '학습하기', emoji: '📖' },
        { id: 'conversation' as LearningMode, label: '대화 목록', emoji: '💬' },
      ]
    : [
        { id: 'learn' as LearningMode, label: '학습하기', emoji: '📖' },
        { id: 'quiz' as LearningMode, label: '퀴즈', emoji: '🎯' },
      ]

  return (
    <div className="flex items-center gap-2">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => {
            if (m.id === 'quiz') { onStartQuiz(); return }
            onChange(m.id)
          }}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-black transition-all',
            mode === m.id
              ? 'bg-foreground text-background shadow-md'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          <span>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
      {!isConvStage && hasWords && (
        <button
          onClick={onStartQuiz}
          className="ml-auto flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-2xl text-xs font-black hover:opacity-90 transition-opacity"
        >
          <span>&#9889;</span>
          <span>빠른 퀴즈</span>
        </button>
      )}
    </div>
  )
}
