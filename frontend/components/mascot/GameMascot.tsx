'use client'

import { cn } from '@/lib/utils'

export type MascotMood = 'idle' | 'happy' | 'correct' | 'wrong' | 'thinking' | 'speaking'

interface GameMascotProps {
  mood?: MascotMood
  size?: number
  className?: string
}

/**
 * LangQuest Owl mascot SVG — Duolingo-inspired.
 * Mood variants change eyes / mouth / body color.
 */
export function GameMascot({ mood = 'idle', size = 80, className }: GameMascotProps) {
  const isHappy = mood === 'happy' || mood === 'correct'
  const isWrong = mood === 'wrong'
  const isSpeaking = mood === 'speaking'

  // Eye shape based on mood
  const eyeLeft  = isHappy ? 'M 36 55 Q 40 50 44 55' : isWrong ? 'M36 55 Q40 60 44 55' : 'M36 54 Q40 50 44 54'
  const eyeRight = isHappy ? 'M 56 55 Q 60 50 64 55' : isWrong ? 'M56 55 Q60 60 64 55' : 'M56 54 Q60 50 64 54'

  // Mouth
  const mouth = isHappy
    ? 'M 42 68 Q 50 76 58 68'
    : isWrong
      ? 'M 42 72 Q 50 66 58 72'
      : isSpeaking
        ? 'M 43 68 Q 50 74 57 68 Q 50 72 43 68 Z'
        : 'M 44 69 Q 50 73 56 69'

  const bodyColor = isWrong ? '#FF4B4B' : '#58CC02'
  const bellyColor = isWrong ? '#FFB3B3' : '#A3E635'
  const wingColor = isWrong ? '#FF6B6B' : '#46A302'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        isHappy && 'animate-bounce-in',
        isWrong && 'animate-shake',
        isSpeaking && 'animate-wiggle',
        className
      )}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="50" cy="116" rx="24" ry="5" fill="oklch(0 0 0 / 0.08)" />

      {/* Body */}
      <ellipse cx="50" cy="80" rx="32" ry="34" fill={bodyColor} />

      {/* Belly */}
      <ellipse cx="50" cy="88" rx="20" ry="22" fill={bellyColor} />

      {/* Head */}
      <circle cx="50" cy="44" r="28" fill={bodyColor} />

      {/* Ear tufts */}
      <polygon points="28,20 22,6 34,16" fill={wingColor} />
      <polygon points="72,20 78,6 66,16" fill={wingColor} />

      {/* Face plate */}
      <ellipse cx="50" cy="52" rx="18" ry="16" fill="#FFF5E0" />

      {/* Eyes - whites */}
      <circle cx="40" cy="46" r="9" fill="white" />
      <circle cx="60" cy="46" r="9" fill="white" />

      {/* Eyes - pupils */}
      <circle cx="41" cy="47" r="5" fill="#1A1A2E" />
      <circle cx="61" cy="47" r="5" fill="#1A1A2E" />

      {/* Eye shine */}
      <circle cx="43" cy="45" r="1.8" fill="white" />
      <circle cx="63" cy="45" r="1.8" fill="white" />

      {/* Eyebrows */}
      {isWrong ? (
        <>
          <path d="M33 35 Q40 39 45 36" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M55 36 Q60 39 67 35" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M33 37 Q40 32 45 35" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M55 35 Q60 32 67 37" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Beak */}
      <polygon points="44,58 50,65 56,58" fill="#FF9600" />
      <polygon points="46,58 50,62 54,58 50,58" fill="#E87B00" />

      {/* Mouth expression */}
      <path d={mouth} stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" fill={isSpeaking ? '#E87B00' : 'none'} />

      {/* Wings */}
      <ellipse cx="20" cy="84" rx="11" ry="18" fill={wingColor} transform="rotate(-20 20 84)" />
      <ellipse cx="80" cy="84" rx="11" ry="18" fill={wingColor} transform="rotate(20 80 84)" />

      {/* Feet */}
      <path d="M38 112 L34 118 M38 112 L38 118 M38 112 L42 118" stroke={wingColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M62 112 L58 118 M62 112 L62 118 M62 112 L66 118" stroke={wingColor} strokeWidth="3" strokeLinecap="round" />

      {/* Speaking sound waves */}
      {isSpeaking && (
        <>
          <path d="M76 40 Q82 44 76 48" stroke="#58CC02" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M80 35 Q90 44 80 53" stroke="#58CC02" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </>
      )}

      {/* Correct sparkles */}
      {mood === 'correct' && (
        <>
          <path d="M12 30 L14 24 L16 30 L22 32 L16 34 L14 40 L12 34 L6 32 Z" fill="#FFD700" opacity="0.9" />
          <path d="M80 18 L81.5 14 L83 18 L87 19.5 L83 21 L81.5 25 L80 21 L76 19.5 Z" fill="#FFD700" opacity="0.8" />
          <circle cx="88" cy="60" r="3" fill="#FF9600" opacity="0.7" />
        </>
      )}
    </svg>
  )
}
