'use client'

interface KoResultDialogProps {
  score: number
  total: number
  onClose: () => void
  onRetry: () => void
}

export function KoResultDialog({ score, total, onClose, onRetry }: KoResultDialogProps) {
  const pct = Math.round((score / total) * 100)
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1
  const xp = score * 10
  const grade = pct >= 90 ? '완벽해요!' : pct >= 60 ? '잘했어요!' : '다시 도전!'
  const gradeColor = pct >= 90 ? 'text-game-green' : pct >= 60 ? 'text-game-yellow' : 'text-game-orange'
  const glowColor = pct >= 90 ? 'var(--game-green)' : pct >= 60 ? 'var(--game-yellow)' : 'var(--game-orange)'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/75 backdrop-blur-md" />
      <div
        className="relative w-full max-w-sm bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: `0 0 40px ${glowColor}30` }}
      >
        {/* Hero */}
        <div
          className="pt-8 pb-6 flex flex-col items-center gap-3"
          style={{ background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)` }}
        >
          <p className={`text-2xl font-black ${gradeColor}`}>{grade}</p>

          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="text-3xl transition-all"
                style={{
                  color: i < stars ? 'var(--game-yellow)' : 'var(--muted-foreground)',
                  filter: i < stars ? `drop-shadow(0 0 6px var(--game-yellow))` : 'none',
                  opacity: i < stars ? 1 : 0.3,
                }}
              >
                &#9733;
              </span>
            ))}
          </div>

          <div className="text-center">
            <p className="text-5xl font-black text-foreground">{score}<span className="text-2xl text-muted-foreground font-semibold"> / {total}</span></p>
            <p className="text-sm text-muted-foreground font-semibold mt-1">{pct}% 정답</p>
          </div>

          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border"
            style={{ backgroundColor: 'var(--game-yellow)' + '20', borderColor: 'var(--game-yellow)' + '40' }}
          >
            <span className="text-game-yellow text-xs font-black">+{xp} XP</span>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-muted/80 border border-border/60 text-foreground font-black text-sm hover:bg-muted transition-colors"
          >
            학습으로
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-2xl text-background font-black text-sm hover:opacity-90 transition-all active:scale-95"
            style={{ backgroundColor: glowColor, boxShadow: `0 0 14px ${glowColor}50` }}
          >
            다시 풀기
          </button>
        </div>
      </div>
    </div>
  )
}
