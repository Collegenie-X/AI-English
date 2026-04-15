'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { KoCategory, KoWordItem } from '@/types/content'

interface KoWordCardGridProps {
  categories: KoCategory[]
  onCardClick: (item: KoWordItem, categoryColor: string) => void
}

export function KoWordCardGrid({ categories, onCardClick }: KoWordCardGridProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(categories[0]?.id ?? null)

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-semibold">
        학습 내용이 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <div key={cat.id} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          {/* Category header */}
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
            onClick={() => setExpandedCat(prev => prev === cat.id ? null : cat.id)}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{ backgroundColor: cat.color + '22', color: cat.color }}
              >
                {cat.icon}
              </span>
              <span className="text-sm font-black text-foreground">{cat.name}</span>
              <span className="text-xs text-muted-foreground font-semibold">
                {cat.words.length}개
              </span>
            </div>
            <span className={cn(
              'text-muted-foreground transition-transform text-sm',
              expandedCat === cat.id ? 'rotate-180' : ''
            )}>▼</span>
          </button>

          {/* Word cards */}
          {expandedCat === cat.id && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-3 pt-0">
              {cat.words.map(word => (
                <KoWordCard
                  key={word.id}
                  item={word}
                  color={cat.color}
                  onClick={() => onCardClick(word, cat.color)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface KoWordCardProps {
  item: KoWordItem
  color: string
  onClick: () => void
}

function KoWordCard({ item, color, onClick }: KoWordCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted hover:bg-accent/30 border border-transparent hover:border-border transition-all active:scale-95 group"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform">{item.emoji}</span>
      <span className="text-xs font-black text-foreground text-center leading-tight">{item.word}</span>
      <span
        className="text-[10px] font-semibold leading-tight px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: color + '22', color }}
      >
        {item.meaning}
      </span>
    </button>
  )
}
