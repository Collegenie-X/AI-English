import Link from 'next/link'
import { GameMascot } from '@/components/mascot/GameMascot'
import { getHomeConfig, type QuizData, type PuzzleData, type FlashcardData, type Stage } from '@/app/config/home.config'

/* ── Flashcard preview (Stage 1 visual) ─────────────────── */
function FlashcardPreview({ data }: { data: FlashcardData }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `2px solid ${data.color}33`,
      boxShadow: `0 8px 32px ${data.color}20, 0 6px 0 ${data.color}22`,
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)`,
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'white' }}>
          {data.chipLabel}
        </span>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.62rem', color: 'white', fontWeight: 900,
        }}>✕</div>
      </div>

      {/* Top thin progress bar */}
      <div style={{ height: 4, background: '#f0f0f0' }}>
        <div style={{ width: `${data.progressPct}%`, height: '100%', background: data.color }} />
      </div>

      {/* Nav + emoji card */}
      <div style={{
        background: `linear-gradient(160deg, ${data.color}18 0%, ${data.color}08 100%)`,
        padding: '16px 12px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          border: '2px solid #e0e0e0', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.55rem', color: '#aaa', flexShrink: 0,
        }}>◀</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: 92, height: 92, borderRadius: '22px',
            background: data.cardBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '54px', lineHeight: 1,
            boxShadow: `0 6px 24px ${data.cardBg}77`,
          }}>
            {data.emoji}
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a1a2e', margin: 0, letterSpacing: '-1px' }}>
            {data.word}
          </p>
        </div>

        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: data.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.55rem', color: 'white', flexShrink: 0,
          boxShadow: `0 3px 10px ${data.color}55`,
        }}>▶</div>
      </div>

      {/* Syllable blocks */}
      <div style={{ padding: '2px 14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {data.syllables.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 700 }}>+</span>
              )}
              <span style={{
                background: s.color, color: 'white',
                borderRadius: '12px', padding: '8px 14px',
                fontSize: '1.25rem', fontWeight: 900,
                boxShadow: `0 3px 10px ${s.color}55`,
                display: 'inline-block',
              }}>
                {s.text}
              </span>
            </span>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FF9800' }}>
          {data.sylLabel}
        </span>
      </div>

      {/* Example sentences */}
      <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {data.sentences.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '6px',
            background: `${data.color}0f`, border: `1.5px solid ${data.color}22`,
            borderRadius: '10px', padding: '8px 10px',
          }}>
            <span style={{ fontSize: '13px', flexShrink: 0 }}>💬</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#333' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: '7px' }}>
        <div style={{
          flex: 1, padding: '9px 6px', borderRadius: '12px',
          background: '#58CC02', color: 'white',
          fontSize: '0.75rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          boxShadow: '0 3px 0 #46A302',
        }}>
          ▶ 자동재생
        </div>
        <div style={{
          flex: 1, padding: '9px 6px', borderRadius: '12px',
          background: '#FFD900', color: '#7A6000',
          fontSize: '0.75rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          boxShadow: '0 3px 0 #DEB800',
        }}>
          ↺ 다시 듣기
        </div>
      </div>

      {/* Progress counter */}
      <div style={{ padding: '0 12px 10px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#888' }}>{data.progress}</span>
      </div>

      {/* Bottom progress bar */}
      <div style={{ height: 4, background: '#f0f0f0' }}>
        <div style={{ width: `${data.progressPct}%`, height: '100%', background: data.color }} />
      </div>

    </div>
  )
}

/* ── Quiz preview (Stage 2 visual) ──────────────────────── */
function QuizPreview({ data }: { data: QuizData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px',
        background: '#f0f0f0', borderRadius: '14px', padding: '3px',
      }}>
        {data.tabs.map((tab, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: '11px',
            fontSize: '0.62rem', fontWeight: 900,
            background: i === data.activeTab ? 'white' : 'transparent',
            color: i === data.activeTab ? '#333' : '#aaa',
            boxShadow: i === data.activeTab ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Slider row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#F3E8FF', borderRadius: '12px', padding: '8px 12px',
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#555', whiteSpace: 'nowrap' }}>✏️ 문제 수</span>
        <div style={{ flex: 1, position: 'relative', height: 6 }}>
          <div style={{ height: 6, borderRadius: 3, background: '#E0C8F8' }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '60%', height: 6,
            borderRadius: 3, background: 'linear-gradient(90deg, #9C27B0, #CE82FF)',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '60%',
            transform: 'translate(-50%, -50%)',
            width: 14, height: 14, borderRadius: '50%',
            background: 'linear-gradient(135deg, #9C27B0, #CE82FF)',
            boxShadow: '0 2px 6px rgba(156,39,176,0.5)',
          }} />
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#9C27B0', whiteSpace: 'nowrap' }}>
          {data.questionCount}
        </span>
      </div>

      {/* Score + counter row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '20px',
          background: '#FFFDE7', border: '2px solid #FFD900',
          fontSize: '0.7rem', fontWeight: 900, color: '#9A7000',
        }}>
          ⭐ {data.score}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '20px',
            background: '#f0f0f0', fontSize: '0.65rem', fontWeight: 900, color: '#555',
          }}>
            {data.progress}
          </span>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem',
          }}>↺</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 3, background: '#eee', overflow: 'hidden' }}>
        <div style={{ width: '10%', height: '100%', background: '#FF5252', borderRadius: 3 }} />
      </div>

      {/* Image card */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '16px',
          background: `linear-gradient(135deg, ${data.imageBg}, ${data.imageBg}CC)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.4rem',
          boxShadow: `0 4px 16px ${data.imageBg}66`,
        }}>
          {data.imageEmoji}
        </div>
      </div>

      {/* Question */}
      <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#333', margin: 0 }}>
        {data.question}
      </p>

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        {data.choices.map(c => (
          <div key={c.num} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 10px', borderRadius: '12px',
            background: 'white', border: '2px solid #e8e8e8',
            boxShadow: '0 2px 0 #ddd',
          }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#aaa', flexShrink: 0 }}>{c.num}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#333', flex: 1 }}>{c.text}</span>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', flexShrink: 0,
            }}>🔊</span>
          </div>
        ))}
      </div>

    </div>
  )
}

/* ── Puzzle preview (Stage 3 visual) ─────────────────────── */
function PuzzlePreview({ data }: { data: PuzzleData }) {
  const foundASet  = new Set(data.foundA.map(([r, c]) => `${r}-${c}`))
  const foundBSet  = new Set(data.foundB.map(([r, c]) => `${r}-${c}`))
  const currentSet = new Set(data.current.map(([r, c]) => `${r}-${c}`))

  function cellStyle(ri: number, ci: number): React.CSSProperties {
    const key = `${ri}-${ci}`
    if (foundASet.has(key))  return { background: '#FF9800', color: 'white', borderColor: '#E65100', boxShadow: '0 3px 0 #E65100' }
    if (foundBSet.has(key))  return { background: '#1CB0F6', color: 'white', borderColor: '#0A98DA', boxShadow: '0 3px 0 #0A98DA' }
    if (currentSet.has(key)) return { background: '#58CC02', color: 'white', borderColor: '#46A302', boxShadow: '0 3px 0 #46A302' }
    return { background: 'white', color: '#333', borderColor: '#e0d8f0', boxShadow: '0 2px 0 #d8ceea' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Difficulty buttons */}
      <div style={{ display: 'flex', gap: '5px' }}>
        {data.difficulties.map(d => (
          <div key={d.label} style={{
            flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: '12px',
            fontSize: '0.65rem', fontWeight: 900,
            background: d.active ? d.color : 'white',
            color: d.active ? 'white' : '#888',
            border: `2px solid ${d.active ? d.color : '#ddd'}`,
            boxShadow: d.active ? `0 3px 0 ${d.color}CC` : '0 2px 0 #ddd',
          }}>
            {d.label} {d.size}
          </div>
        ))}
      </div>

      {/* Total words chip */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
        background: '#EDE7F6', color: '#6A1B9A',
        border: '1.5px solid #CE93D8', alignSelf: 'flex-start',
      }}>
        🐾 {data.totalWords}
      </div>

      {/* Word cards */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {data.words.map(w => (
          <div key={w.text} style={{
            flex: 1, textAlign: 'center', padding: '8px 6px', borderRadius: '12px',
            background: w.found ? '#E8F5E9' : '#F3E8FF',
            border: `2px solid ${w.found ? '#A5D6A7' : '#CE93D8'}`,
            position: 'relative',
          }}>
            {w.found && (
              <div style={{
                position: 'absolute', top: -8, right: -5,
                width: 18, height: 18, borderRadius: '50%',
                background: '#58CC02', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 900, border: '2px solid white',
              }}>✓</div>
            )}
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#333', marginBottom: '5px' }}>
              {w.text}
            </div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
              {w.syllables.map((s, si) => (
                <span key={si} style={{
                  padding: '2px 5px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 900,
                  background: w.found
                    ? ['#66BB6A','#29B6F6','#FFA726'][si % 3]
                    : ['#9C27B0','#E91E63','#2196F3'][si % 3],
                  color: 'white',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        padding: '8px',
        background: '#F3E8FF',
        borderRadius: '12px',
        border: '2px solid #CE93D8',
      }}>
        {data.grid.map((row, ri) =>
          row.map((letter, ci) => (
            <div key={`${ri}-${ci}`} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', fontWeight: 900, fontSize: '1rem',
              border: '2px solid',
              transition: 'background 0.2s',
              ...cellStyle(ri, ci),
            }}>
              {letter}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── Default card visual (Stages 1, 2, 4) ────────────────── */
function StageCards({ stage }: { stage: Stage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {(stage.cards ?? []).map((c, ci) => (
        <div key={ci} style={{
          background: c.bg, border: `2px solid ${c.color}33`,
          borderRadius: '14px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: `0 3px 0 ${c.color}33`,
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: '12px',
            background: `${c.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
          }}>
            {c.emoji}
          </span>
          <span style={{ fontWeight: 900, fontSize: '1rem', color: '#1a1d27' }}>
            {c.word}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: c.color }}>🔊</span>
        </div>
      ))}
    </div>
  )
}

/* ── Page (Server Component) ─────────────────────────────── */
export default function HomePage() {
  const {
    hero, stagesSection, stages,
    reasonsSection, reasons,
    banner, subjectsSection, subjects,
  } = getHomeConfig()

  return (
    <div style={{ backgroundColor: '#f4f5f9', minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1d3a 0%, #2d3278 55%, #1a3a5c 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07,
          backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 18px)',
        }} />
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, #1CB0F650 0%, transparent 70%)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-40px',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, #FF86C840 0%, transparent 70%)', pointerEvents: 'none',
        }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{
          position: 'relative', paddingTop: '72px', paddingBottom: '80px',
          display: 'flex', alignItems: 'center', gap: '48px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '5px 14px', borderRadius: '20px',
              background: 'rgba(88,204,2,0.18)', border: '1.5px solid rgba(88,204,2,0.4)',
              marginBottom: '20px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#58CC02', display: 'inline-block' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8fdd2e' }}>{hero.badge}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5.5vw, 3.2rem)', fontWeight: 900,
              color: '#fff', lineHeight: 1.12, marginBottom: '18px', letterSpacing: '-0.5px',
            }}>
              {hero.title}<br />
              <span style={{ color: '#1CB0F6' }}>{hero.titleKo}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '70%', margin: '0 8px' }}>{hero.titleSep}</span>
              <span style={{ color: '#58CC02' }}>{hero.titleEn}</span>
            </h1>

            <p style={{
              fontSize: '1.05rem', color: 'rgba(255,255,255,0.72)',
              fontWeight: 600, lineHeight: 1.65, marginBottom: '32px', maxWidth: 460,
            }}>
              {hero.subtitle} <strong style={{ color: 'white' }}>{hero.subtitleStrong}</strong>{hero.subtitleSuffix}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href={hero.ctaKoHref} className="home-hero-cta-ko" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 30px', borderRadius: '16px',
                background: '#FF86C8', color: 'white',
                fontSize: '0.98rem', fontWeight: 900, textDecoration: 'none',
              }}>
                {hero.ctaKo}
              </Link>
              <Link href={hero.ctaEnHref} className="home-hero-cta-en" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 30px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.12)', color: 'white',
                fontSize: '0.98rem', fontWeight: 900, textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 5px 0 rgba(0,0,0,0.25)',
              }}>
                {hero.ctaEn}
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
              {hero.stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{s.num}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex" style={{
            flexShrink: 0, flexDirection: 'column', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: '-16px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(28,176,246,0.18) 0%, transparent 70%)',
              }} />
              <GameMascot mood="speaking" size={130} />
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
              borderRadius: '16px', padding: '10px 18px',
              fontSize: '0.82rem', fontWeight: 800, color: 'white',
              border: '1.5px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap',
            }}>
              {hero.mascotCaption}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LEARNING STAGES
      ══════════════════════════════════════════ */}
      <section style={{ paddingTop: '72px', paddingBottom: '16px' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '5px 14px', borderRadius: '20px',
              background: '#1CB0F618', border: '1.5px solid #1CB0F644', marginBottom: '14px',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A98DA' }}>{stagesSection.badge}</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#1a1d27',
              lineHeight: 1.2, marginBottom: '10px', letterSpacing: '-0.3px',
            }}>
              {stagesSection.title}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#777', fontWeight: 600, maxWidth: 480, margin: '0 auto' }}>
              {stagesSection.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {stages.map((stage, si) => (
              <div key={stage.num} style={{
                display: 'flex', alignItems: 'flex-start', gap: '40px',
                flexDirection: si % 2 === 1 ? 'row-reverse' : 'row',
              }} className="flex-col sm:flex-row">

                {/* Text side */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: stage.numBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', fontWeight: 900, color: 'white',
                      boxShadow: `0 4px 0 ${stage.dark}`, flexShrink: 0,
                    }}>
                      {stage.num}
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '8px',
                      background: `${stage.color}18`, color: stage.color,
                    }}>
                      {stage.label}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: 'clamp(1.2rem, 2.8vw, 1.65rem)', fontWeight: 900, color: '#1a1d27',
                    lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-0.3px',
                  }}>
                    {stage.headline}
                  </h3>

                  <div style={{
                    background: `${stage.color}10`, border: `1.5px solid ${stage.color}30`,
                    borderRadius: '14px', padding: '14px 18px', marginBottom: '22px',
                  }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 800, color: stage.color,
                      marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      ✦ 왜 효과적인가요?
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#555', fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
                      {stage.why}
                    </p>
                  </div>

                  <Link
                    href={stage.href}
                    className="home-lift-btn"
                    style={{
                      '--sh-base': `0 4px 0 ${stage.dark}`,
                      '--sh-hover': `0 6px 0 ${stage.dark}`,
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '11px 24px', borderRadius: '14px',
                      background: stage.color, color: 'white',
                      fontSize: '0.88rem', fontWeight: 900, textDecoration: 'none',
                    } as React.CSSProperties}
                  >
                    {stage.cta} →
                  </Link>
                </div>

                {/* Visual side */}
                <div style={{
                  flexShrink: 0, width: '100%', maxWidth: 340,
                  ...(stage.flashcardData
                    ? { /* FlashcardPreview has its own card styling */ }
                    : {
                      background: stage.bg, borderRadius: '24px', padding: '20px 18px',
                      border: `2px solid ${stage.color}33`,
                      boxShadow: `0 8px 32px ${stage.color}20, 0 6px 0 ${stage.color}22`,
                    }
                  ),
                }}>
                  {stage.flashcardData
                    ? <FlashcardPreview data={stage.flashcardData} />
                    : stage.quizData
                      ? <QuizPreview data={stage.quizData} />
                      : stage.puzzleData
                        ? <PuzzlePreview data={stage.puzzleData} />
                        : <StageCards stage={stage} />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY LINGOBABY
      ══════════════════════════════════════════ */}
      <section style={{
        marginTop: '80px',
        background: 'linear-gradient(135deg, #1a1d3a 0%, #2d3278 100%)',
        padding: '72px 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
          backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 18px)',
        }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 900, color: '#fff',
              lineHeight: 1.2, marginBottom: '10px', letterSpacing: '-0.3px',
            }}>
              {reasonsSection.title}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {reasonsSection.subtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
            {reasons.map(r => (
              <div key={r.title} className="home-lift-card" style={{
                background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)',
                borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.12)',
                padding: '28px 22px',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '16px',
                  background: `${r.color}25`, border: `1.5px solid ${r.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', marginBottom: '16px',
                }}>
                  {r.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)', fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FREE PLATFORM BANNER
      ══════════════════════════════════════════ */}
      <section style={{ paddingTop: '72px' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2a1a 100%)',
            borderRadius: '28px', padding: '40px 36px',
            display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
              backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px)',
            }} />
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px', width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, #58CC0230 0%, transparent 70%)', pointerEvents: 'none',
            }} />

            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(88,204,2,0.2)', border: '1.5px solid rgba(88,204,2,0.35)',
                marginBottom: '12px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#58CC02', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#8fdd2e' }}>{banner.badge}</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(1.2rem, 2.8vw, 1.7rem)', fontWeight: 900, color: '#fff',
                lineHeight: 1.25, marginBottom: '10px', letterSpacing: '-0.3px',
              }}>
                {banner.title}<br />
                <span style={{ color: '#58CC02' }}>{banner.titleHighlight}</span>{banner.titleSuffix}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 18px' }}>
                {banner.desc}
              </p>

              {/* 광고 운영 & 업데이트 callout */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '8px 14px', borderRadius: '12px',
                  background: 'rgba(255,215,0,0.12)', border: '1.5px solid rgba(255,215,0,0.3)',
                }}>
                  <span style={{ fontSize: '1rem' }}>📢</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFD700' }}>광고 수익으로 무료 운영 — 결제 없음</span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '8px 14px', borderRadius: '12px',
                  background: 'rgba(88,204,2,0.12)', border: '1.5px solid rgba(88,204,2,0.3)',
                }}>
                  <span style={{ fontSize: '1rem' }}>🔄</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8fdd2e' }}>회원 가입없이 무료로 사용 가능 </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', flexShrink: 0 }}>
              {banner.chips.map(chip => (
                <div key={chip.text} style={{
                  background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)',
                  borderRadius: '14px', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{chip.icon}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{chip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SUBJECT START CARDS
      ══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6" style={{ padding: '48px 0 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#1a1d27',
            lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px',
          }}>
            {subjectsSection.title}
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#888', fontWeight: 600 }}>
            {subjectsSection.subtitle}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
          {subjects.map(s => (
            <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
              <div
                className="home-subject-card"
                style={{
                  '--sh-base': `0 4px 0 ${s.color}44, 0 2px 12px rgba(0,0,0,0.07)`,
                  '--sh-hover': `0 8px 0 ${s.color}44, 0 6px 24px rgba(0,0,0,0.12)`,
                  background: 'white', borderRadius: '20px',
                  border: `2px solid ${s.color}33`, padding: '28px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                } as React.CSSProperties}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>{s.emoji}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1a1d27', marginBottom: '4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', marginBottom: '4px' }}>
                  {s.desc}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, marginBottom: '18px' }}>
                  {s.words}
                </div>
                <div style={{
                  marginTop: 'auto', display: 'inline-block',
                  padding: '9px 22px', borderRadius: '12px',
                  background: s.color, color: 'white',
                  fontSize: '0.82rem', fontWeight: 900, boxShadow: `0 3px 0 ${s.dark}`,
                }}>
                  {s.href === '/resources' ? '보러 가기 →' : '시작하기 →'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
