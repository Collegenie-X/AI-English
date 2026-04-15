'use client'

import { useState, useEffect } from 'react'
import type { VoiceSettings } from '@/hooks/useVoiceSettings'

interface KoVoiceSettingsDialogProps {
  settings: VoiceSettings
  onChange: (patch: Partial<VoiceSettings>) => void
  onClose: () => void
}

const SPEED_PRESETS = [
  { label: '🐢 천천히', value: 0.65 },
  { label: '😊 기본',   value: 0.85 },
  { label: '⚡ 빠름',   value: 1.2  },
]

function SliderRow({
  label, value, min, max, step, display, onChange, markers,
}: {
  label: string; value: number; min: number; max: number; step: number
  display: string; onChange: (v: number) => void; markers?: [string, string, string]
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2d3748' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '1px 9px', borderRadius: '8px' }}>
          {display}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
      />
      {markers && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#aaa', marginTop: '2px' }}>
          <span>{markers[0]}</span><span>{markers[1]}</span><span>{markers[2]}</span>
        </div>
      )}
    </div>
  )
}

export function KoVoiceSettingsDialog({ settings, onChange, onClose }: KoVoiceSettingsDialogProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() ?? [])
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [])

  const korVoices = voices.filter(v => v.lang.startsWith('ko'))

  const preview = () => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance('안녕하세요! 미리 듣기입니다.')
    u.lang = 'ko-KR'
    u.rate = settings.rate
    u.pitch = settings.pitch
    u.volume = settings.volume
    if (settings.voiceURI) {
      const v = voices.find(v => v.voiceURI === settings.voiceURI)
      if (v) u.voice = v
    }
    window.speechSynthesis.speak(u)
  }

  const activePreset = SPEED_PRESETS.find(p => Math.abs(settings.rate - p.value) < 0.05)

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal aria-label="음성 설정">
      <div
        className="dialog-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="dialog-header-gradient"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#9d4edd)', flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem' }}>음성 설정</span>
            <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
              🇰🇷 한국어
            </span>
          </div>
          <button className="dialog-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div style={{ padding: '18px 20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Voice selector */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              🎙️ 음성 선택 (TTS VOICE)
            </p>
            <select
              value={settings.voiceURI}
              onChange={e => onChange({ voiceURI: e.target.value })}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '12px',
                border: '2px solid #e8e0ff', fontSize: '0.88rem', fontFamily: 'inherit',
                background: 'white', color: '#2d3748', cursor: 'pointer',
              }}
            >
              <option value="">🤖 자동 (한국어 기본 (ko-KR))</option>
              {korVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <button
              onClick={preview}
              style={{
                marginTop: '8px', padding: '6px 16px',
                border: '1.5px solid #c4b5fd', borderRadius: '10px',
                background: '#f5f3ff', color: '#7c3aed',
                fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              🎧 미리 듣기
            </button>
          </div>

          {/* Speed */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              🐌 읽기 속도 (SPEED)
            </p>
            <SliderRow
              label="속도"
              value={settings.rate}
              min={0.5} max={1.5} step={0.05}
              display={settings.rate.toFixed(2)}
              onChange={v => onChange({ rate: v })}
              markers={['🐢 Slow', 'Normal', '🚀 Fast']}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {SPEED_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => onChange({ rate: p.value })}
                  style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '12px',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800,
                    background: activePreset?.value === p.value ? '#7c3aed' : '#f0ebff',
                    color:      activePreset?.value === p.value ? 'white'   : '#7c3aed',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pitch */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              🎵 음높이 (PITCH)
            </p>
            <SliderRow
              label="음높이"
              value={settings.pitch}
              min={0.5} max={2.0} step={0.1}
              display={settings.pitch.toFixed(1)}
              onChange={v => onChange({ pitch: v })}
              markers={['▼ 낮게', '기본 (1.0)', '▲ 높게']}
            />
          </div>

          {/* Volume */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              🔔 볼륨
            </p>
            <SliderRow
              label="볼륨"
              value={settings.volume}
              min={0} max={1} step={0.05}
              display={`${Math.round(settings.volume * 100)}%`}
              onChange={v => onChange({ volume: v })}
              markers={['🔇 작게', '보통', '📢 크게']}
            />
          </div>

          {/* Word interval */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              ⏱️ 단어 사이 간격 (자동재생 공통)
            </p>
            <SliderRow
              label="단어 간격"
              value={settings.interval}
              min={500} max={3000} step={100}
              display={`${(settings.interval / 1000).toFixed(1)}초`}
              onChange={v => onChange({ interval: v })}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
