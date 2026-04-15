'use client'

import { useState, useEffect, useMemo } from 'react'
import { GameMascot } from '@/components/mascot/GameMascot'
import { SituationCard } from '@/components/conversation/SituationCard'
import { LearnModal } from '@/components/conversation/LearnModal'
import { QuizModal } from '@/components/conversation/QuizModal'
import type { ConvDialogData, ConvDialogSituation } from '@/types/content'

type ModalState =
  | { kind: 'learn'; situation: ConvDialogSituation }
  | { kind: 'quiz';  situation: ConvDialogSituation }
  | null

const ACCENT       = '#58CC02'
const ACCENT_DARK  = '#46A302'
const ACCENT_LIGHT = '#D7F5A8'

export default function ConversationPage() {
  const [data, setData]         = useState<ConvDialogData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState<ModalState>(null)

  useEffect(() => {
    fetch('/data/conversation/situations.json')
      .then(r => r.json())
      .then((d: ConvDialogData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const situations = data?.situations ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return situations
    return situations.filter(s =>
      s.name.includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.turns.some(t =>
        t.english.toLowerCase().includes(q) || t.korean.includes(q)
      )
    )
  }, [situations, search])

  const openLearn = (situation: ConvDialogSituation) =>
    setModal({ kind: 'learn', situation })

  const goQuiz = () => {
    if (!modal) return
    setModal({ kind: 'quiz', situation: modal.situation })
  }

  const retryQuiz = () => {
    if (!modal) return
    setModal({ kind: 'quiz', situation: modal.situation })
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky sub-header ── */}
      <div className="bg-white border-b-2 border-border sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-base font-black text-foreground">영어 회화</p>
              <p className="text-[11px] text-muted-foreground font-semibold">
                {data ? `${data.meta.situations}개 상황 · ${data.meta.totalTurns}개 대화` : '...'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-black px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Stage 1 학습
              </span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-600 text-white">
                Stage 2 퀴즈
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="pb-3">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="상황 검색 (아침, morning, ...)"
              className="w-full px-4 py-2 rounded-2xl border-2 border-b-4 bg-white text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all"
              style={{ borderColor: ACCENT + '44', borderBottomColor: ACCENT + '88' }}
            />
          </div>
        </div>
      </div>

      {/* ── Hero banner ── */}
      {data && !loading && (
        <div className="overflow-hidden" style={{ backgroundColor: ACCENT_LIGHT }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-5">
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-white mb-3"
                style={{ backgroundColor: ACCENT }}
              >
                💬 실생활 영어 회화
              </div>
              <h1 className="text-xl font-black text-foreground leading-snug">
                {data.title}
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                {data.level} · {data.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {filtered.length}개 상황
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg text-white bg-violet-500">
                  Step 1→2 단계 학습
                </span>
              </div>
            </div>
            <GameMascot mood="speaking" size={80} />
          </div>
        </div>
      )}

      {/* ── How to use ── */}
      {data && !loading && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-1">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4 border-2 border-b-4"
              style={{ background: ACCENT + '10', borderColor: ACCENT + '44', borderBottomColor: ACCENT + '77' }}
            >
              <p className="text-xs font-black" style={{ color: ACCENT_DARK }}>Stage 1 · 학습</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-relaxed">
                대화를 한 턴씩 읽고 TTS로 들으며 영어·한국어를 함께 학습
              </p>
            </div>
            <div className="rounded-2xl p-4 border-2 border-b-4 border-violet-200 border-b-violet-400 bg-violet-50">
              <p className="text-xs font-black text-violet-700">Stage 2 · 퀴즈</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-relaxed">
                영→한 / 한→영 선택 후 정답을 가리고 맞히는 플래시카드 퀴즈
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Situation list ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <GameMascot mood="thinking" size={80} className="animate-bounce" />
            <p className="text-sm font-black text-muted-foreground">회화 데이터 불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <GameMascot mood="wrong" size={80} />
            <p className="text-sm font-black text-muted-foreground">
              &ldquo;{search}&rdquo; 에 대한 결과가 없어요
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-xs font-black hover:underline"
              style={{ color: ACCENT }}
            >
              검색 초기화
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(sit => (
              <SituationCard
                key={sit.id}
                situation={sit}
                onClick={openLearn}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.kind === 'learn' && (
        <LearnModal
          situation={modal.situation}
          onClose={() => setModal(null)}
          onGoQuiz={goQuiz}
        />
      )}

      {modal?.kind === 'quiz' && (
        <QuizModal
          situation={modal.situation}
          onClose={() => setModal(null)}
          onRetry={retryQuiz}
        />
      )}
    </div>
  )
}
