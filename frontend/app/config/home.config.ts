import fs from 'fs'
import path from 'path'

/* ── Types ───────────────────────────────────────────────── */

export type HeroStat = {
  num:   string
  label: string
}

export type Hero = {
  badge:          string
  title:          string
  titleKo:        string
  titleSep:       string
  titleEn:        string
  subtitle:       string
  subtitleStrong: string
  subtitleSuffix: string
  ctaKo:          string
  ctaKoHref:      string
  ctaEn:          string
  ctaEnHref:      string
  mascotCaption:  string
  stats:          HeroStat[]
}

export type SectionHeader = {
  badge?:   string
  title:    string
  subtitle: string
}

export type StageCard = {
  emoji: string
  word:  string
  color: string
  bg:    string
}

export type PuzzleDifficulty = {
  label:  string
  size:   string
  color:  string
  active: boolean
}

export type PuzzleWord = {
  text:      string
  syllables: string[]
  found:     boolean
}

export type QuizChoice = {
  num:  string
  text: string
}

export type QuizData = {
  tabs:          string[]
  activeTab:     number
  questionCount: string
  score:         string
  progress:      string
  imageEmoji:    string
  imageBg:       string
  question:      string
  choices:       QuizChoice[]
}

export type PuzzleData = {
  headerColor:  string
  difficulties: PuzzleDifficulty[]
  totalWords:   string
  words:        PuzzleWord[]
  grid:         string[][]
  foundA:       number[][]
  foundB:       number[][]
  current:      number[][]
}

export type FlashcardSyllable = {
  text:  string
  color: string
}

export type FlashcardData = {
  chipLabel:   string
  cardBg:      string
  emoji:       string
  word:        string
  syllables:   FlashcardSyllable[]
  sylLabel:    string
  sentences:   string[]
  progress:    string
  progressPct: number
  color:       string
}

export type Stage = {
  num:             number
  label:           string
  headline:        string
  why:             string
  cards?:          StageCard[]
  flashcardData?:  FlashcardData
  quizData?:       QuizData
  puzzleData?:     PuzzleData
  color:           string
  dark:            string
  bg:              string
  numBg:           string
  href:            string
  cta:             string
}

export type Reason = {
  icon:  string
  title: string
  desc:  string
  color: string
}

export type BannerChip = {
  icon: string
  text: string
}

export type Banner = {
  badge:          string
  title:          string
  titleHighlight: string
  titleSuffix:    string
  desc:           string
  chips:          BannerChip[]
}

export type Subject = {
  href:  string
  emoji: string
  label: string
  desc:  string
  words: string
  color: string
  dark:  string
}

export type HomeConfig = {
  hero:            Hero
  stagesSection:   SectionHeader
  stages:          Stage[]
  reasonsSection:  SectionHeader
  reasons:         Reason[]
  banner:          Banner
  subjectsSection: SectionHeader
  subjects:        Subject[]
}

/* ── Load from public/config/home.json (server-side only) ── */

export function getHomeConfig(): HomeConfig {
  const filePath = path.join(process.cwd(), 'public', 'config', 'home.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as HomeConfig
}
