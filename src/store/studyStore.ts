import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { StudyStep, SessionStatus, OutputType, CardType, KnowledgeCard, FusionCard, DiscussionRecord, OutputRecord, ScoreResult } from '../types/study.types'

interface StudySession {
  id: string
  materialId: string
  entryMode: 'focused' | 'full'
  selectedTerms: string[]
  currentStep: StudyStep
  generatedCards: KnowledgeCard[]
  fusionCards: FusionCard[]
  discussions: DiscussionRecord[]
  outputRecords: OutputRecord[]
  startedAt: string
  completedAt?: string
  status: SessionStatus
}

interface StudyState {
  sessions: StudySession[]
  currentSessionId: string | null
  
  createSession: (materialId: string, terms: string[], entryMode?: 'focused' | 'full') => string
  setCurrentSession: (sessionId: string | null) => void
  getCurrentSession: () => StudySession | undefined
  updateSession: (sessionId: string, updates: Partial<StudySession>) => void
  completeSession: (sessionId: string) => void
  addGeneratedCard: (sessionId: string, card: Omit<KnowledgeCard, 'id' | 'createdAt' | 'studySessionId'>) => void
  addFusionCard: (sessionId: string, card: Omit<FusionCard, 'id' | 'createdAt'>) => void
  addDiscussion: (sessionId: string, record: Omit<DiscussionRecord, 'id' | 'createdAt'>) => void
  addOutputRecord: (sessionId: string, record: Omit<OutputRecord, 'id' | 'createdAt'>) => void
  setCurrentStep: (sessionId: string, step: StudyStep) => void
  deleteSession: (sessionId: string) => void
  getSessionById: (id: string) => StudySession | undefined
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      
      createSession: (materialId, terms, entryMode = 'full') => {
        const sessionId = uuidv4()
        const newSession: StudySession = {
          id: sessionId,
          materialId,
          entryMode,
          selectedTerms: terms,
          currentStep: StudyStep.SELECT_CONTENT,
          generatedCards: [],
          fusionCards: [],
          discussions: [],
          outputRecords: [],
          startedAt: new Date().toISOString(),
          status: SessionStatus.ACTIVE,
        }
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId,
        }))
        return sessionId
      },
      
      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId })
      },
      
      getCurrentSession: () => {
        const { sessions, currentSessionId } = get()
        return sessions.find((s) => s.id === currentSessionId)
      },
      
      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        }))
      },
      
      completeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, status: SessionStatus.COMPLETED, completedAt: new Date().toISOString() }
              : s
          ),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
        }))
      },
      
      addGeneratedCard: (sessionId, card) => {
        const newCard: KnowledgeCard = {
          ...card,
          id: uuidv4(),
          studySessionId: sessionId,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, generatedCards: [...s.generatedCards, newCard] }
              : s
          ),
        }))
      },
      
      addFusionCard: (sessionId, card) => {
        const newCard: FusionCard = {
          ...card,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, fusionCards: [...s.fusionCards, newCard] }
              : s
          ),
        }))
      },
      
      addDiscussion: (sessionId, record) => {
        const newRecord: DiscussionRecord = {
          ...record,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, discussions: [...s.discussions, newRecord] }
              : s
          ),
        }))
      },
      
      addOutputRecord: (sessionId, record) => {
        const newRecord: OutputRecord = {
          ...record,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, outputRecords: [...s.outputRecords, newRecord] }
              : s
          ),
        }))
      },
      
      setCurrentStep: (sessionId, step) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, currentStep: step } : s
          ),
        }))
      },
      
      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
        }))
      },
      
      getSessionById: (id) => {
        return get().sessions.find((s) => s.id === id)
      },
    }),
    {
      name: 'zhika-study-store',
    }
  )
)
