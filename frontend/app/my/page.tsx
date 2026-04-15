'use client'

import { useState, useEffect } from 'react'
import { GameMascot } from '@/components/mascot/GameMascot'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Progress {
  streak: number
  xp: number
  hearts: number
  quizzesCompleted: number
  wordsLearned: number
  lastActive: string
  league: 'bronze' | 'silver' | 'gold' | 'diamond'
  badges: string[]
}

const LEAGUE_CONFIG = {
  bronze:  { label: '브론즈',   color: '#CD7F32', glow: '#CD7F3255', next: 'silver',  xpNeeded: 100  },
  silver:  { label: '실버',     color: '#C0C0C0', glow: '#C0C0C055', next: 'gold',    xpNeeded: 300  },
  gold:    { label: '골드',     color: '#FFD700', glow: '#FFD70055', next: 'diamond', xpNeeded: 700  },
  diamond: { label: '다이아',   color: '#74F5FF', glow: '#74F5FF55', next: null,      xpNeeded: null },
}

const BADGE_DEFS = [
  { id: 'first_quiz',     emoji: '🎯', label: '첫 퀴즈',     desc: '처음으로 퀴즈를 완료했어요' },
  { id: 'streak_3',       emoji: '🔥', label: '3일 연속',    desc: '3일 연속 학습 달성!' },
  { id: 'streak_7',       emoji: '⚡', label: '7일 연속',    desc: '7일 연속 학습 달성!' },
  { id: 'words_10',       emoji: '📚', label: '10단어',      desc: '10개 단어 학습 완료' },
  { id: 'words_50',       emoji: '🦉', label: '50단어',      desc: '50개 단어 학습 완료' },
  { id: 'perfect_quiz',   emoji: '⭐', label: '만점 퀴즈',   desc: '퀴즈에서 만점 달성!' },
  { id: 'ko_master',      emoji: '🇰🇷', label: '한글 마스터', desc: '한글 카테고리 전체 학습' },
  { id: 'en_master',      emoji: '🌍', label: '영어 마스터', desc: '영어 Stage 1~4 완료' },
]

const DEFAULT_PROGRESS: Progress = {
  streak: 0,
  xp: 0,
  hearts: 5,
  quizzesCompleted: 0,
  wordsLearned: 0,
  lastActive: new Date().toISOString(),
  league: 'bronze',
  badges: [],
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white border-2 border-b-4"
      style={{ borderColor: color + '44', borderBottomColor: color + '99' }}>
      <span className="text-2xl font-black" style={{ color }}>{value}</span>
      <span className="text-xs font-black text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Badge card ──────────────────────────────────────────────────────────────
function BadgeCard({ earned, badge }: { earned: boolean; badge: typeof BADGE_DEFS[0] }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border-2 border-b-4 transition-all min-h-[60px]',
      earned
        ? 'bg-white border-yellow-300 border-b-yellow-400'
        : 'bg-muted/20 border-border border-b-border/50 opacity-40'
    )}>
      <span className={cn('text-[10px] font-black text-center leading-tight', earned ? 'text-foreground' : 'text-muted-foreground')}>
        {badge.label}
      </span>
    </div>
  )
}

// ─── Hearts display ──────────────────────────────────────────────────────────
function HeartsRow({ hearts }: { hearts: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: i < hearts ? '#EF4444' : '#e5e7eb' }} />
      ))}
      <span className="text-xs font-bold text-muted-foreground ml-1">{hearts}/5</span>
    </div>
  )
}

// ─── League badge ────────────────────────────────────────────────────────────
function LeagueBadge({ league, xp }: { league: Progress['league']; xp: number }) {
  const cfg = LEAGUE_CONFIG[league]
  const nextCfg = cfg.next ? LEAGUE_CONFIG[cfg.next as keyof typeof LEAGUE_CONFIG] : null
  const pct = nextCfg ? Math.min(100, Math.round((xp / nextCfg.xpNeeded!) * 100)) : 100

  return (
    <div className="rounded-2xl border-2 border-b-4 p-4 bg-white"
      style={{ borderColor: cfg.color + '44', borderBottomColor: cfg.color + 'AA' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"
          style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
          {xp}
        </div>
        <div>
          <p className="text-base font-black" style={{ color: cfg.color }}>{cfg.label} 리그</p>
          <p className="text-xs font-semibold text-muted-foreground">{xp} XP</p>
        </div>
      </div>
      {nextCfg && (
        <>
          <div className="flex justify-between text-[10px] font-black text-muted-foreground mb-1.5">
            <span>현재</span>
            <span>{nextCfg.label} 승급까지 {nextCfg.xpNeeded! - xp} XP</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
          </div>
        </>
      )}
      {!nextCfg && (
        <p className="text-xs font-black text-center" style={{ color: cfg.color }}>최고 리그 달성!</p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyPage() {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS)
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'correct'>('idle')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('child-english-progress') || '{}')
      setProgress({ ...DEFAULT_PROGRESS, ...saved })
    } catch { /* noop */ }
    // Greeting mascot
    const t = setTimeout(() => setMascotMood('happy'), 400)
    return () => clearTimeout(t)
  }, [])

  const cfg = LEAGUE_CONFIG[progress.league]
  const earnedBadgeIds = new Set(progress.badges)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <h1 className="text-base font-black text-foreground">내 기록</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Profile hero ── */}
        <div
          className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-3xl border-2 border-b-4 bg-white"
          style={{ borderColor: cfg.color + '44', borderBottomColor: cfg.color + 'AA', boxShadow: `0 6px 24px ${cfg.glow}` }}
        >
          <div className="relative">
            <GameMascot mood={mascotMood} size={100} />
            {/* Streak badge on mascot */}
            {progress.streak > 0 && (
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300">
                <span className="text-[10px] font-black text-orange-600">{progress.streak}일</span>
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xl font-black text-foreground">학습자</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              {progress.streak > 0 ? `${progress.streak}일 연속 학습 중!` : '오늘 학습을 시작해보세요!'}
            </p>
            <HeartsRow hearts={progress.hearts} />
          </div>
          {/* League chip */}
          <div className="px-4 py-2 rounded-2xl border-2 border-b-4"
            style={{ backgroundColor: cfg.color + '15', borderColor: cfg.color + '44', borderBottomColor: cfg.color + 'AA' }}>
            <span className="text-sm font-black" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <section>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">학습 통계</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="연속 학습" value={`${progress.streak}일`} color="var(--game-orange)" />
            <StatCard label="XP" value={progress.xp} color="var(--game-yellow)" />
            <StatCard label="퀴즈" value={progress.quizzesCompleted} color="var(--game-blue)" />
            <StatCard label="단어" value={progress.wordsLearned} color="var(--game-green)" />
          </div>
        </section>

        {/* ── League progress ── */}
        <section>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">리그</p>
          <LeagueBadge league={progress.league} xp={progress.xp} />
        </section>

        {/* ── Badges ── */}
        <section>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
            배지 — {progress.badges.length}/{BADGE_DEFS.length}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {BADGE_DEFS.map(b => (
              <BadgeCard key={b.id} badge={b} earned={earnedBadgeIds.has(b.id)} />
            ))}
          </div>
        </section>

        {/* ── Recent activity placeholder ── */}
        <section>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">최근 활동</p>
          <div className="rounded-2xl border-2 border-b-4 border-border bg-white p-5 flex flex-col items-center gap-3 text-center">
            <GameMascot mood="thinking" size={70} />
            <p className="text-sm font-black text-muted-foreground">
              활동 기록이 쌓이면 여기에 표시돼요
            </p>
            <a
              href="/ko"
              className="px-5 py-2.5 rounded-2xl text-white text-xs font-black border-b-4 transition-all active:translate-y-0.5 active:border-b-[2px] bg-game-green"
              style={{ borderBottomColor: 'oklch(0.50 0.20 145)' }}
            >
              지금 학습 시작하기
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
