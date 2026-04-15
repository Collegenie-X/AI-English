export interface WordItem {
  id: number
  word: string
  letter?: string
  emoji: string
  hint: string
  syllables: string[]
  tts: string
  sentences: string[]
  level?: number
  tags?: string[]
}

export interface Category {
  id: string
  name: string
  icon: string
  level: number
  color: string
  words: WordItem[]
}

export interface StageWordContent {
  stage: number
  language: string
  title: string
  description: string
  totalItems: number
  categories: Category[]
}

export interface ConvTurn {
  turn: number
  role: 'child' | 'teacher' | 'friend' | string
  speaker: string
  english: string
  korean: string
  chunks: string[]
  tip?: string
}

export interface ConversationItem {
  id: number
  situation?: string
  name?: string
  emoji: string
  color: string
  turns: ConvTurn[]
  quizChoices: string[]
  answer: number
  difficulty: 1 | 2 | 3
  tags?: string[]
}

export interface StageConvContent {
  stage: number
  language: string
  title: string
  description?: string
  totalItems: number
  situations: ConversationItem[]
}

export type StageContent = StageWordContent | StageConvContent

export function isConvContent(c: StageContent): c is StageConvContent {
  return 'situations' in c
}

export type LearningMode = 'learn' | 'quiz' | 'conversation'
export type Language = 'en'
export type StageId = 1 | 2 | 3 | 4

// ── English phonics / conversation sentence types ──
export interface PhonicsSentence {
  id: number
  english: string
  korean: string
  phonics: string
  chunks: string[]
  tips: string
}

export interface PhonicsSituation {
  id: number
  emoji: string
  name: string
  nameEn: string
  color: string
  sentences: PhonicsSentence[]
}

export interface PhonicsContent {
  title: string
  description: string
  version: string
  situations: PhonicsSituation[]
}

// ── Conversation Dialog types (50 situations × 10 turns) ──

export interface ConvTipObj {
  tag: string
  text: string
}

export interface ConvDialogTurn {
  turn: number
  role: 'b' | 'c' | string
  speaker: string
  english: string
  korean: string
  chunks: string[]
  tip?: ConvTipObj
}

export interface ConvDialogSituation {
  id: number
  emoji: string
  name: string
  nameEn: string
  color: string
  turns: ConvDialogTurn[]
}

export interface ConvDialogData {
  title: string
  description: string
  version: string
  level: string
  total_sentences: number
  meta: { target: string; totalTurns: number; situations: number }
  situations: ConvDialogSituation[]
}

// ── Korean word learning types ──
export interface KoWordItem {
  id: string
  word: string
  meaning: string
  emoji: string
  sentences: string[]
}

export interface KoCategory {
  id: string
  name: string
  icon: string
  color: string
  words: KoWordItem[]
}

export interface KoWordContent {
  lang: string
  title: string
  description: string
  categories: KoCategory[]
}
