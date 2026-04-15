'use client'

import { useState, useEffect, useCallback } from 'react'

export interface StageProgress {
  completed: number[]      // item ids completed
  stars: number            // 0-3
  quizBestScore: number    // 0-10
  lastStudied?: string     // ISO date
}

export interface ProgressData {
  en: {
    stage1: StageProgress
    stage2: StageProgress
    stage3: StageProgress
    stage4: StageProgress
  }
  streak: number
  lastStudyDate: string
  totalStars: number
  badges: string[]
  studyDates: string[]
}

const defaultStage: StageProgress = { completed: [], stars: 0, quizBestScore: 0 }

const defaultProgress: ProgressData = {
  en: {
    stage1: { ...defaultStage },
    stage2: { ...defaultStage },
    stage3: { ...defaultStage },
    stage4: { ...defaultStage },
  },
  streak: 0,
  lastStudyDate: '',
  totalStars: 0,
  badges: [],
  studyDates: [],
}

const STORAGE_KEY = 'child-english-progress'

function loadProgress(): ProgressData {
  if (typeof window === 'undefined') return defaultProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    return { ...defaultProgress, ...JSON.parse(raw) }
  } catch {
    return defaultProgress
  }
}

function saveProgress(data: ProgressData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(defaultProgress)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    setMounted(true)
  }, [])

  const markItemCompleted = useCallback((stage: 1 | 2 | 3 | 4, itemId: number) => {
    setProgress(prev => {
      const key = `stage${stage}` as keyof ProgressData['en']
      const stageData = prev.en[key]
      if (stageData.completed.includes(itemId)) return prev
      const today = new Date().toISOString().split('T')[0]
      const studyDates = prev.studyDates.includes(today)
        ? prev.studyDates
        : [...prev.studyDates, today]

      // Update streak
      let streak = prev.streak
      if (prev.lastStudyDate) {
        const last = new Date(prev.lastStudyDate)
        const now = new Date(today)
        const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
        if (diff === 1) streak += 1
        else if (diff > 1) streak = 1
      } else {
        streak = 1
      }

      const updated: ProgressData = {
        ...prev,
        streak,
        lastStudyDate: today,
        studyDates,
        en: {
          ...prev.en,
          [key]: {
            ...stageData,
            completed: [...stageData.completed, itemId],
            lastStudied: today,
          },
        },
      }
      saveProgress(updated)
      return updated
    })
  }, [])

  const saveQuizScore = useCallback((stage: 1 | 2 | 3 | 4, score: number, total: number) => {
    setProgress(prev => {
      const key = `stage${stage}` as keyof ProgressData['en']
      const stageData = prev.en[key]
      const stars = score >= total * 0.9 ? 3 : score >= total * 0.7 ? 2 : score >= total * 0.5 ? 1 : 0

      // Check for badges
      const badges = [...prev.badges]
      if (stars === 3 && !badges.includes(`stage${stage}-perfect`)) {
        badges.push(`stage${stage}-perfect`)
      }
      if (score === total && !badges.includes('perfect-score')) {
        badges.push('perfect-score')
      }

      const totalStars = prev.totalStars + Math.max(0, stars - stageData.stars)

      const updated: ProgressData = {
        ...prev,
        totalStars,
        badges,
        en: {
          ...prev.en,
          [key]: {
            ...stageData,
            stars: Math.max(stageData.stars, stars),
            quizBestScore: Math.max(stageData.quizBestScore, score),
          },
        },
      }
      saveProgress(updated)
      return updated
    })
  }, [])

  const getStageProgress = useCallback((stage: 1 | 2 | 3 | 4, totalItems: number) => {
    const key = `stage${stage}` as keyof ProgressData['en']
    const stageData = progress.en[key]
    return {
      completed: stageData.completed.length,
      total: totalItems,
      percent: totalItems > 0 ? Math.round((stageData.completed.length / totalItems) * 100) : 0,
      stars: stageData.stars,
      quizBestScore: stageData.quizBestScore,
    }
  }, [progress])

  return { progress, mounted, markItemCompleted, saveQuizScore, getStageProgress }
}
