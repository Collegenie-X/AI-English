'use client'

import type { ConversationItem } from '@/types/content'

interface ConversationListProps {
  items: ConversationItem[]
  onItemClick: (item: ConversationItem) => void
}

export function ConversationList({ items, onItemClick }: ConversationListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-semibold">
        대화 내용이 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onItemClick(item)}
          className="w-full flex items-center gap-4 bg-card rounded-3xl p-4 border border-border hover:bg-muted text-left transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
        >
          {/* Color + emoji */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: item.color || '#e5e7eb' }}
          >
            {item.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground">{item.name || item.situation}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">
              {item.turns[0]?.english}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {Array.from({ length: item.difficulty }).map((_, i) => (
                <span key={i} className="text-[10px]">⭐</span>
              ))}
              <span className="text-[10px] text-muted-foreground font-semibold">
                {item.turns.length}번 대화
              </span>
            </div>
          </div>

          <span className="text-muted-foreground text-lg flex-shrink-0">›</span>
        </button>
      ))}
    </div>
  )
}
