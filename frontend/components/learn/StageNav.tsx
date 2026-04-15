'use client'

import { cn } from '@/lib/utils'

const STAGES = [
  { id: 1, label: '알파벳',   icon: 'A',   color: '#1CB0F6', border: '#0A98DA' },
  { id: 2, label: '파닉스',   icon: 'Ph',  color: '#FF9600', border: '#E08200' },
  { id: 3, label: '회화패턴', icon: '>>',  color: '#58CC02', border: '#46A302' },
  { id: 4, label: '청크대화', icon: '[]',  color: '#FF86C8', border: '#E05EA8' },
]

interface StageNavProps {
  current: number
  onChange: (stage: number) => void
}

export function StageNav({ current, onChange }: StageNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {STAGES.map(s => {
        const active = current === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap flex-shrink-0 border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-[2px]',
              active ? 'text-white' : 'bg-white text-muted-foreground hover:text-foreground'
            )}
            style={active
              ? { backgroundColor: s.color, borderColor: s.color, borderBottomColor: s.border }
              : { borderColor: 'var(--border)', borderBottomColor: 'var(--border)' }
            }
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
              style={active
                ? { backgroundColor: 'rgba(0,0,0,0.18)', color: 'white' }
                : { backgroundColor: 'var(--muted)', color: s.color }
              }
            >
              {s.icon}
            </span>
            <span>Stage {s.id}</span>
            <span className="hidden sm:inline opacity-75">&middot; {s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
