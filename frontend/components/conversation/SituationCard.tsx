'use client'

import type { ConvDialogSituation } from '@/types/content'

interface SituationCardProps {
  situation: ConvDialogSituation
  onClick: (situation: ConvDialogSituation) => void
}

export function SituationCard({ situation, onClick }: SituationCardProps) {
  return (
    <button
      onClick={() => onClick(situation)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-b-[3px] hover:scale-[1.02] active:scale-[0.99] transition-all text-left shadow-sm"
      style={{ borderColor: '#e5e7eb', borderBottomColor: '#d1d5db' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: situation.color }}
      >
        {situation.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground leading-tight">{situation.name}</p>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{situation.nameEn}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1 font-semibold truncate">
          {situation.turns[0]?.english}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
          {situation.turns.length}턴
        </span>
        <span className="text-muted-foreground text-sm">›</span>
      </div>
    </button>
  )
}
