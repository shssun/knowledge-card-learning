export enum MaterialCategory {
  SCHOOL_SUBJECT = 'SCHOOL_SUBJECT',
  INDUSTRY_TRACK = 'INDUSTRY_TRACK',
  FREE_RESEARCH = 'FREE_RESEARCH',
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum BankType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface WordEntry {
  id: string
  term: string
  english?: string
  definition: string
  difficulty: DifficultyLevel
  domain: string
  levelContent?: {
    definition: string
    boundary: string
    similarTerms: string
    examples: string
    applicationScenario: string
    misconceptions: string
    relations: string
    transferTest: string
    teachingOutput: string
  }
}

export interface WordBank {
  id: string
  name: string
  type: BankType
  category: MaterialCategory
  words: WordEntry[]
  createdAt: string
}

export interface Material {
  id: string
  title: string
  content: string
  category: MaterialCategory
  difficulty: DifficultyLevel
  keywords: string[]
  createdAt: string
  source: string
}
