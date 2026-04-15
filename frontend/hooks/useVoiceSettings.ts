'use client'

import { useState, useCallback, useEffect } from 'react'

export interface VoiceSettings {
  voiceURI: string
  rate: number
  pitch: number
  volume: number
  interval: number
}

export const VOICE_DEFAULTS: VoiceSettings = {
  voiceURI: '',
  rate: 0.85,
  pitch: 1.1,
  volume: 1.0,
  interval: 1200,
}

const STORAGE_KEY = 'ko-voice-settings'

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(VOICE_DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSettings({ ...VOICE_DEFAULTS, ...JSON.parse(saved) })
    } catch { /* noop */ }
  }, [])

  const update = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }, [])

  const speakWith = useCallback((text: string, lang = 'ko-KR') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = settings.rate
    u.pitch = settings.pitch
    u.volume = settings.volume
    if (settings.voiceURI) {
      const v = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI)
      if (v) u.voice = v
    }
    window.speechSynthesis.speak(u)
  }, [settings])

  return { settings, update, speakWith }
}
