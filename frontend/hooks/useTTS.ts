'use client'

import { useCallback, useRef, useState } from 'react'

export function useTTS() {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, lang = 'en-US', rate = 0.85) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = 1.1

    // Match voice by requested lang — Korean gets Korean voice, English gets English
    const voices = window.speechSynthesis.getVoices()
    const prefix = lang.split('-')[0]
    const preferred =
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(prefix) &&
        /female|samantha|karen|yuna|sora|heami|지원/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith(prefix))
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  const speakChunks = useCallback(async (chunks: string[], lang = 'en-US') => {
    for (const chunk of chunks) {
      await new Promise<void>((resolve) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
        const u = new SpeechSynthesisUtterance(chunk)
        u.lang = lang
        u.rate = 0.8
        u.pitch = 1.1
        u.onend = () => resolve()
        u.onerror = () => resolve()
        window.speechSynthesis.speak(u)
      })
      await new Promise(r => setTimeout(r, 300))
    }
  }, [])

  return { speak, stop, speakChunks, speaking }
}
