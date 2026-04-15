'use client'

import { useState, useEffect } from 'react'
import { StageNav } from '@/components/learn/StageNav'
import { WordCardGrid } from '@/components/learn/WordCardGrid'
import { LearnDialog } from '@/components/dialog/LearnDialog'
import { QuizDialog } from '@/components/dialog/QuizDialog'
import { ResultDialog } from '@/components/dialog/ResultDialog'
import { ConversationList } from '@/components/learn/ConversationList'
import type { StageContent, WordItem } from '@/types/content'

// Per-stage accent palette
const STAGE = {
  1: { color: '#1CB0F6', dark: '#0A98DA', light: '#D0F0FF', label: '알파벳',  icon: 'A'  },
  2: { color: '#FF9600', dark: '#E08200', light: '#FFE9B0', label: '파닉스',  icon: 'Ph' },
  3: { color: '#58CC02', dark: '#46A302', light: '#D7F5A8', label: '회화패턴', icon: '>>' },
  4: { color: '#FF86C8', dark: '#E05EA8', light: '#FFD6EE', label: '청크대화', icon: '[]' },
} as const

type StageKey = keyof typeof STAGE

// Stage hero SVG illustrations (inline, lightweight)
function StageHeroIllustration({ stage, color }: { stage: StageKey; color: string }) {
  if (stage === 1) return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Book */}
      <rect x="18" y="28" width="74" height="58" rx="8" fill={color} opacity="0.18" />
      <rect x="18" y="28" width="36" height="58" rx="8" fill={color} opacity="0.30" />
      <rect x="54" y="28" width="38" height="58" rx="0 8 8 0" fill={color} opacity="0.22" />
      <line x1="54" y1="29" x2="54" y2="85" stroke={color} strokeWidth="2.5" />
      {/* "A" letter */}
      <text x="36" y="68" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="26" fill={color}>A</text>
      {/* "B" letter */}
      <text x="72" y="68" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="26" fill={color}>B</text>
      {/* Stars */}
      <circle cx="22" cy="22" r="4" fill="#FFD900" opacity="0.8" />
      <circle cx="90" cy="18" r="3" fill="#FFD900" opacity="0.7" />
      <circle cx="96" cy="34" r="2.5" fill="#FFD900" opacity="0.5" />
    </svg>
  )
  if (stage === 2) return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Sound waves */}
      <circle cx="55" cy="55" r="38" stroke={color} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.3" />
      <circle cx="55" cy="55" r="26" stroke={color} strokeWidth="2.5" strokeDasharray="5 3" opacity="0.45" />
      <circle cx="55" cy="55" r="14" fill={color} opacity="0.18" />
      {/* Speaker */}
      <polygon points="47,46 47,64 55,64 64,72 64,38 55,46" fill={color} opacity="0.8" />
      <path d="M70 44 a16 16 0 0 1 0 22" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Ph label */}
      <rect x="28" y="82" width="54" height="20" rx="10" fill={color} opacity="0.18" />
      <text x="55" y="97" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="13" fill={color}>Phonics</text>
    </svg>
  )
  if (stage === 3) return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Chat bubble 1 */}
      <rect x="14" y="18" width="60" height="36" rx="14" fill={color} opacity="0.22" />
      <polygon points="30,54 22,66 42,54" fill={color} opacity="0.22" />
      {/* Dots in bubble */}
      <circle cx="34" cy="36" r="4" fill={color} opacity="0.7" />
      <circle cx="44" cy="36" r="4" fill={color} opacity="0.7" />
      <circle cx="54" cy="36" r="4" fill={color} opacity="0.7" />
      {/* Chat bubble 2 */}
      <rect x="36" y="60" width="60" height="34" rx="14" fill={color} opacity="0.35" />
      <polygon points="70,94 62,106 82,94" fill={color} opacity="0.35" />
      <text x="66" y="83" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="13" fill="white">Hello!</text>
    </svg>
  )
  // stage === 4
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Brackets like code chunks */}
      <rect x="14" y="22" width="82" height="66" rx="14" fill={color} opacity="0.12" />
      <text x="26" y="50" fontFamily="monospace" fontWeight="900" fontSize="22" fill={color} opacity="0.8">{"["}</text>
      <text x="74" y="50" fontFamily="monospace" fontWeight="900" fontSize="22" fill={color} opacity="0.8">{"]"}</text>
      <text x="55" y="52" textAnchor="middle" fontFamily="system-ui" fontWeight="900" fontSize="16" fill={color}>Nice!</text>
      <text x="55" y="72" textAnchor="middle" fontFamily="system-ui" fontWeight="700" fontSize="11" fill={color} opacity="0.7">chunk talk</text>
      <circle cx="86" cy="24" r="5" fill="#FFD900" opacity="0.8" />
      <circle cx="94" cy="36" r="3.5" fill="#FFD900" opacity="0.6" />
    </svg>
  )
}

type QuizState = { items: WordItem[]; index: number; score: number }
type CatDialogState = { words: WordItem[]; name: string; color: string } | null

export default function EnglishPage() {
  const [stage, setStage] = useState<StageKey>(1)
  const [content, setContent] = useState<StageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [learnItem, setLearnItem] = useState<WordItem | null>(null)
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [resultData, setResultData] = useState<{ score: number; total: number } | null>(null)
  // Per-category learn/quiz entry points
  const [catLearn, setCatLearn] = useState<CatDialogState>(null)
  const [catQuiz, setCatQuiz] = useState<CatDialogState>(null)

  useEffect(() => {
    setLoading(true)
    setContent(null)
    fetch(`/data/en/stage${stage}.json`)
      .then(r => r.json())
      .then((d: StageContent) => { setContent(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [stage])

  const cfg = STAGE[stage]
  const allWords: WordItem[] = content?.categories.flatMap(c => c.words) ?? []
  const isConvStage = stage === 3 || stage === 4

  const startQuiz = (words?: WordItem[]) => {
    const pool = words ?? allWords
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
    setQuiz({ items: shuffled, index: 0, score: 0 })
  }

  const handleCatLearn = (words: WordItem[], name: string, color: string) => {
    setCatLearn({ words, name, color })
    setLearnItem(words[0] ?? null)
  }

  const handleCatQuiz = (words: WordItem[], name: string, color: string) => {
    setCatQuiz({ words, name, color })
    startQuiz(words)
  }

  const handleCatPuzzle = (_words: WordItem[], _name: string, _color: string) => {
    // English puzzle not yet wired — fall back to quiz
    startQuiz(_words)
  }

  const handleQuizAnswer = (correct: boolean) => {
    if (!quiz) return
    const newScore = correct ? quiz.score + 1 : quiz.score
    const nextIndex = quiz.index + 1
    if (nextIndex >= quiz.items.length) {
      setQuiz(null)
      setCatQuiz(null)
      setResultData({ score: newScore, total: quiz.items.length })
    } else {
      setQuiz({ ...quiz, index: nextIndex, score: newScore })
    }
  }

  const currentQuizItem = quiz ? quiz.items[quiz.index] : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f8fa' }}>

      {/* ── Sticky sub-header: title + stage tabs ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between pt-5 pb-3">
            <div>
              <h1 className="text-base font-black text-foreground leading-none">영어 배우기</h1>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Stage {stage}: {content?.title ?? '...'}
              </p>
            </div>
            {!isConvStage && allWords.length > 0 && (
              <button
                onClick={startQuiz}
                className="px-4 py-2 rounded-2xl text-white text-xs font-black border-b-4 active:translate-y-0.5 active:border-b-[2px] transition-all"
                style={{ backgroundColor: cfg.color, borderBottomColor: cfg.dark }}
              >
                퀴즈
              </button>
            )}
          </div>
          <div className="pb-3">
            <StageNav current={stage} onChange={s => setStage(s as StageKey)} />
          </div>
        </div>
      </div>

      {/* ── Stage hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: cfg.light }}
      >
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, ${cfg.color}33 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 flex items-center gap-5">
          <div className="flex-1 min-w-0">
            {/* Stage badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-white mb-3"
              style={{ backgroundColor: cfg.color, boxShadow: `0 3px 10px ${cfg.color}55` }}
            >
              <span
                className="w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
              >
                {cfg.icon}
              </span>
              Stage {stage} &middot; {cfg.label}
            </div>

            <h1 className="text-xl font-black text-foreground text-balance leading-snug">
              {content?.title ?? `Stage ${stage}`}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1.5 line-clamp-2">
              {content?.description ?? ''}
            </p>

            {/* Stats row */}
            {allWords.length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: cfg.color, color: 'white' }}
                >
                  {allWords.length}개 단어
                </span>
                <span className="text-xs font-black text-yellow-600">
                  +{allWords.length * 5} XP
                </span>
              </div>
            )}
          </div>

          {/* SVG illustration */}
          <div className="flex-shrink-0">
            <StageHeroIllustration stage={stage} color={cfg.color} />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl animate-bounce"
              style={{ backgroundColor: cfg.light }}
            >
              {cfg.icon}
            </div>
            <p className="text-sm font-black text-muted-foreground">단어 불러오는 중...</p>
          </div>
        ) : isConvStage ? (
          <ConversationList stage={stage} content={content} />
        ) : (
          <WordCardGrid
            categories={content?.categories ?? []}
            onCardClick={item => setLearnItem(item)}
            onLearn={handleCatLearn}
            onQuiz={handleCatQuiz}
            onPuzzle={handleCatPuzzle}
          />
        )}
      </div>

      {/* ── Overlays ── */}
      {learnItem && (
        <LearnDialog
          item={learnItem}
          color={cfg.color}
          onClose={() => setLearnItem(null)}
          onQuiz={() => { setLearnItem(null); startQuiz() }}
        />
      )}

      {currentQuizItem && quiz && (
        <QuizDialog
          item={currentQuizItem}
          allWords={allWords}
          questionIndex={quiz.index}
          totalQuestions={quiz.items.length}
          score={quiz.score}
          color={cfg.color}
          onAnswer={handleQuizAnswer}
          onClose={() => setQuiz(null)}
        />
      )}

      {resultData && (
        <ResultDialog
          score={resultData.score}
          total={resultData.total}
          stage={stage}
          color={cfg.color}
          onClose={() => { setResultData(null) }}
          onRetry={() => { setResultData(null); startQuiz() }}
        />
      )}
    </div>
  )
}
