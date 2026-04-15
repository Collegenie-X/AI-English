'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type ResourceType = 'pdf' | 'video'
type Category = 'all' | 'english-edu' | 'english-reading' | 'korean-reading'

interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  category: Category
  level: '초급' | '중급' | '고급'
  duration?: string   // video
  pages?: number      // pdf
  thumbnail: string   // emoji used as large icon
  color: string
  colorLight: string
  url: string         // placeholder
  tags: string[]
}

// ── Sample data ───────────────────────────────────────────────────────────────
const RESOURCES: Resource[] = [
  // English Education
  {
    id: 'ee-1',
    title: '파닉스 기초 완전 정복',
    description: '알파벳 소리부터 단어 읽기까지, 파닉스 학습의 핵심을 단계별로 안내합니다.',
    type: 'pdf',
    category: 'english-edu',
    level: '초급',
    pages: 24,
    thumbnail: '📗',
    color: '#1CB0F6',
    colorLight: '#D0F0FF',
    url: '#',
    tags: ['파닉스', '알파벳', '소리'],
  },
  {
    id: 'ee-2',
    title: '사이트워드 200 마스터',
    description: '자주 쓰이는 영어 단어 200개를 게임처럼 익히는 학습 가이드입니다.',
    type: 'pdf',
    category: 'english-edu',
    level: '초급',
    pages: 36,
    thumbnail: '📘',
    color: '#1CB0F6',
    colorLight: '#D0F0FF',
    url: '#',
    tags: ['사이트워드', '단어', '암기'],
  },
  {
    id: 'ee-3',
    title: '영어 말하기 패턴 50',
    description: '일상생활에서 바로 쓸 수 있는 핵심 영어 회화 패턴 50가지를 영상으로 배워요.',
    type: 'video',
    category: 'english-edu',
    level: '중급',
    duration: '18분',
    thumbnail: '🎬',
    color: '#1CB0F6',
    colorLight: '#D0F0FF',
    url: '#',
    tags: ['회화', '패턴', '말하기'],
  },
  {
    id: 'ee-4',
    title: '영어 교육법 — TPR 전신반응법',
    description: '신체 동작을 활용해 영어를 자연스럽게 익히는 TPR 교수법을 소개합니다.',
    type: 'video',
    category: 'english-edu',
    level: '초급',
    duration: '22분',
    thumbnail: '🎥',
    color: '#1CB0F6',
    colorLight: '#D0F0FF',
    url: '#',
    tags: ['TPR', '교수법', '교육'],
  },
  // English Reading
  {
    id: 'er-1',
    title: '영어 독해 Level 1 — 동물 이야기',
    description: '귀여운 동물 캐릭터가 등장하는 쉬운 영어 단문 독해 연습 자료입니다.',
    type: 'pdf',
    category: 'english-reading',
    level: '초급',
    pages: 20,
    thumbnail: '🐾',
    color: '#58CC02',
    colorLight: '#D7F5A8',
    url: '#',
    tags: ['독해', '동물', '단문'],
  },
  {
    id: 'er-2',
    title: '영어 독해 Level 2 — 일상생활',
    description: '학교, 가족, 음식 등 일상 주제의 짧은 영어 지문으로 독해력을 키워요.',
    type: 'pdf',
    category: 'english-reading',
    level: '중급',
    pages: 28,
    thumbnail: '🏡',
    color: '#58CC02',
    colorLight: '#D7F5A8',
    url: '#',
    tags: ['독해', '일상', '이해력'],
  },
  {
    id: 'er-3',
    title: '독해 전략 강의 — 주제문 찾기',
    description: '영어 지문에서 주제문과 핵심 내용을 빠르게 파악하는 전략을 배웁니다.',
    type: 'video',
    category: 'english-reading',
    level: '중급',
    duration: '15분',
    thumbnail: '🔍',
    color: '#58CC02',
    colorLight: '#D7F5A8',
    url: '#',
    tags: ['독해전략', '주제문', '요약'],
  },
  // Korean Reading
  {
    id: 'kr-1',
    title: '한글 낱말 독해 — 기초편',
    description: '받침 없는 낱말부터 시작하는 한글 독해 기초 학습 자료입니다.',
    type: 'pdf',
    category: 'korean-reading',
    level: '초급',
    pages: 18,
    thumbnail: '가',
    color: '#FF86C8',
    colorLight: '#FFD6EE',
    url: '#',
    tags: ['한글', '낱말', '기초'],
  },
  {
    id: 'kr-2',
    title: '한글 문장 이해 — 동화 읽기',
    description: '짧은 동화를 읽고 내용을 이해하며 한글 독해 능력을 키우는 자료입니다.',
    type: 'pdf',
    category: 'korean-reading',
    level: '중급',
    pages: 32,
    thumbnail: '📖',
    color: '#FF86C8',
    colorLight: '#FFD6EE',
    url: '#',
    tags: ['동화', '문장', '이해'],
  },
  {
    id: 'kr-3',
    title: '한글 독해 지도법 — 학부모 가이드',
    description: '가정에서 부모님이 직접 한글 독해 지도를 할 수 있는 실용 가이드 영상입니다.',
    type: 'video',
    category: 'korean-reading',
    level: '초급',
    duration: '20분',
    thumbnail: '👨‍👩‍👧',
    color: '#FF86C8',
    colorLight: '#FFD6EE',
    url: '#',
    tags: ['지도법', '학부모', '가이드'],
  },
]

const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'all',             label: '전체',        color: '#5c6278' },
  { id: 'english-edu',     label: '영어 교육법',  color: '#1CB0F6' },
  { id: 'english-reading', label: '영어 독해',    color: '#58CC02' },
  { id: 'korean-reading',  label: '한글 독해',    color: '#FF86C8' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconPDF() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" fill="currentColor" opacity=".15" />
      <path d="M4 2h10l6 6v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M7 14h2a1 1 0 000-2H7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13 12h1.5a1.5 1.5 0 010 3H13v-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M17 12v4M17 12h2M17 14h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconVideo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="2" y="5" width="15" height="14" rx="2" fill="currentColor" opacity=".2" />
      <path d="M2 7a2 2 0 012-2h11a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M17 9l5-3v12l-5-3V9z" fill="currentColor" />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v12M8 12l4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [activeType, setActiveType] = useState<'all' | ResourceType>('all')

  const filtered = RESOURCES.filter(r => {
    const catMatch = activeCategory === 'all' || r.category === activeCategory
    const typeMatch = activeType === 'all' || r.type === activeType
    return catMatch && typeMatch
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f8fa' }}>

      {/* ── Hero band ── */}
      <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2744 60%, #0d2b3e 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* dot texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'radial-gradient(circle, #00C2A055 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ padding: '48px 24px 44px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <span
              style={{
                width: 48, height: 48, borderRadius: '14px', background: '#00C2A0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', boxShadow: '0 4px 16px #00C2A055', flexShrink: 0,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden>
                <rect x="2"  y="3" width="4" height="18" rx="1.5" />
                <rect x="8"  y="3" width="4" height="18" rx="1.5" opacity=".75" />
                <rect x="14" y="3" width="8" height="5"  rx="1.5" opacity=".5" />
                <rect x="14" y="10" width="8" height="5" rx="1.5" opacity=".65" />
                <rect x="14" y="17" width="8" height="4" rx="1.5" opacity=".45" />
              </svg>
            </span>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.5px' }}>자료실</h1>
              <p style={{ fontSize: '0.82rem', color: '#8ba3b8', fontWeight: 600, marginTop: 3 }}>영어 교육법 · 영어 독해 · 한글 독해 — PDF &amp; 영상 자료</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: `${RESOURCES.length}개 자료`, color: '#00C2A0' },
              { label: `${RESOURCES.filter(r => r.type === 'pdf').length}개 PDF`, color: '#1CB0F6' },
              { label: `${RESOURCES.filter(r => r.type === 'video').length}개 영상`, color: '#FF86C8' },
            ].map(b => (
              <span key={b.label} style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, background: `${b.color}22`, color: b.color, border: `1px solid ${b.color}44` }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'white', borderBottom: '2px solid #eee', position: 'sticky', top: 80, zIndex: 20 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
            {/* Category filters */}
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 16px', border: '2px solid',
                  borderColor: activeCategory === cat.id ? cat.color : '#e8e8e8',
                  borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
                  background: activeCategory === cat.id ? cat.color : 'white',
                  color: activeCategory === cat.id ? 'white' : '#666',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}

            <div style={{ width: 1, background: '#eee', margin: '4px 6px', flexShrink: 0 }} />

            {/* Type filters */}
            {[
              { id: 'all' as const,   label: '전체 유형' },
              { id: 'pdf' as const,   label: 'PDF' },
              { id: 'video' as const, label: '영상' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                style={{
                  padding: '6px 14px', border: '2px solid',
                  borderColor: activeType === t.id ? '#5c6278' : '#e8e8e8',
                  borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
                  background: activeType === t.id ? '#1a1d27' : 'white',
                  color: activeType === t.id ? 'white' : '#666',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Resource grid ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📭</p>
            <p style={{ fontWeight: 800, fontSize: '1rem' }}>해당 자료가 없습니다</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {filtered.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upload CTA ── */}
      <div style={{ background: 'white', borderTop: '2px solid #eee' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '16px', background: '#00C2A0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #00C2A044' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 20V8M8 12l4-4 4 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1a1d27' }}>자료를 공유하고 싶으신가요?</h2>
          <p style={{ fontSize: '0.82rem', color: '#888', fontWeight: 600, maxWidth: 360 }}>
            영어 또는 한글 교육 자료 (PDF, 영상 링크)를 제출하시면 검토 후 자료실에 게재됩니다.
          </p>
          <a
            href="mailto:hello@lingobaby.kr"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: '14px',
              background: '#00C2A0', color: 'white',
              fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none',
              boxShadow: '0 4px 14px #00C2A044',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="white" strokeWidth="2" fill="none" />
              <path d="M22 6l-10 7L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            자료 제출하기
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Resource card ─────────────────────────────────────────────────────────────
function ResourceCard({ resource }: { resource: Resource }) {
  const isVideo = resource.type === 'video'

  return (
    <article
      style={{
        background: 'white',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `2px solid ${resource.color}22`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 28px ${resource.color}30`
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          backgroundColor: resource.colorLight,
          padding: '28px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 60, height: 60, borderRadius: '16px',
            background: resource.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: resource.thumbnail.length === 1 && resource.thumbnail.charCodeAt(0) < 256 ? '1.4rem' : '2rem',
            boxShadow: `0 4px 16px ${resource.color}55`,
            flexShrink: 0,
            color: 'white', fontWeight: 900,
          }}
        >
          {resource.thumbnail}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge */}
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 10px', borderRadius: '10px', marginBottom: 6,
              fontSize: '0.7rem', fontWeight: 800,
              background: isVideo ? '#1a1d2720' : '#1a1d2720',
              color: isVideo ? '#e05ea8' : '#0a98da',
              border: `1px solid ${isVideo ? '#FF86C844' : '#1CB0F644'}`,
            }}
          >
            {isVideo ? <IconVideo /> : <IconPDF />}
            {isVideo ? '영상' : 'PDF'}
            {isVideo ? ` · ${resource.duration}` : ` · ${resource.pages}p`}
          </span>
          {/* Level */}
          <span
            style={{
              display: 'inline-flex', marginLeft: 6,
              padding: '2px 8px', borderRadius: '10px',
              fontSize: '0.7rem', fontWeight: 800,
              background: resource.color + '20', color: resource.color,
            }}
          >
            {resource.level}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1a1d27', lineHeight: 1.35, margin: 0 }}>
          {resource.title}
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600, lineHeight: 1.55, margin: 0, flex: 1 }}>
          {resource.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {resource.tags.map(tag => (
            <span key={tag} style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, background: '#f3f4f6', color: '#666' }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* CTA button */}
        <a
          href={resource.url}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: '12px', width: '100%',
            background: resource.color, color: 'white',
            fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none',
            boxShadow: `0 3px 10px ${resource.color}44`,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {isVideo ? <IconPlay /> : <IconDownload />}
          {isVideo ? '영상 보기' : 'PDF 다운로드'}
        </a>
      </div>
    </article>
  )
}
