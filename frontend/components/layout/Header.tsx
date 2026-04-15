'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GameMascot } from '@/components/mascot/GameMascot'
import { cn } from '@/lib/utils'

// ── Inline SVG icons for nav tabs (no external dep) ──────────────────────────
function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="7" height="18" rx="1.5" fill="currentColor" opacity=".9" />
      <rect x="13" y="3" width="7" height="18" rx="1.5" fill="currentColor" opacity=".6" />
      <rect x="2" y="3" width="2" height="18" rx="1" fill="currentColor" opacity=".4" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="12,2 14.9,8.5 22,9.3 16.9,14.2 18.4,21 12,17.6 5.6,21 7.1,14.2 2,9.3 9.1,8.5" />
    </svg>
  )
}
function IconBubble() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 3V6a2 2 0 012-2z" />
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 2h8v8a4 4 0 01-8 0V2zM6 2H3v4a3 3 0 003 3M18 2h3v4a3 3 0 01-3 3M12 14v4M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M8 2h8v8a4 4 0 01-8 0V2z" fill="currentColor" />
    </svg>
  )
}
function IconLibrary() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="2"  y="3" width="4" height="18" rx="1.5" />
      <rect x="8"  y="3" width="4" height="18" rx="1.5" opacity=".75" />
      <rect x="14" y="3" width="8" height="5"  rx="1.5" opacity=".5" />
      <rect x="14" y="10" width="8" height="5" rx="1.5" opacity=".65" />
      <rect x="14" y="17" width="8" height="4" rx="1.5" opacity=".45" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/ko',         label: '한글',   color: '#FF86C8', bg: '#FFD6EE', Icon: IconBook    },
  { href: '/en',         label: '영어',   color: '#1CB0F6', bg: '#D0F0FF', Icon: IconStar    },
  { href: '/conversation', label: '회화',   color: '#58CC02', bg: '#D7F5A8', Icon: IconBubble  },
  { href: '/resources',  label: '자료실', color: '#00C2A0', bg: '#B0F0E8', Icon: IconLibrary },
  { href: '/my',         label: '기록',   color: '#FFD900', bg: '#FFF5B0', Icon: IconTrophy  },
]

export function Header() {
  const pathname = usePathname()
  const [streak, setStreak] = useState(0)
  const [mascotMood, setMascotMood] = useState<'idle' | 'speaking'>('idle')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('child-english-progress') || '{}')
      setStreak(saved.streak ?? 0)
    } catch { /* noop */ }
  }, [])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo + mascot */}
          <Link
            href="/"
            className="flex items-center gap-2"
            onMouseEnter={() => setMascotMood('speaking')}
            onMouseLeave={() => setMascotMood('idle')}
            aria-label="홈"
          >
            <GameMascot mood={mascotMood} size={44} />
            <span className="font-black text-base text-foreground hidden sm:block">
              Lingo<span style={{ color: '#58CC02' }}>Baby</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="메뉴">
            {NAV_ITEMS.map(({ href, label, color, bg, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black transition-all border-b-[3px]',
                    active ? 'text-white' : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  style={active
                    ? { backgroundColor: color, borderBottomColor: color + 'CC', color: 'white' }
                    : { borderColor: 'transparent' }
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  <span style={{ color: active ? 'white' : color }}><Icon /></span>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Streak pill */}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl border-2 border-b-[3px] text-xs font-black"
              style={{ backgroundColor: '#FFF5B0', borderColor: '#FFD900', borderBottomColor: '#DEB800', color: '#9A7000' }}>
              {streak}일
            </div>
          )}
        </div>
      </header>

    </>
  )
}
