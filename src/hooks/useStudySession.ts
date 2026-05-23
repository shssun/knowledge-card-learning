import { useState, useCallback } from 'react'
import { useStudyStore } from '../store/studyStore'
import { useReviewStore } from '../store/reviewStore'
import { useArchiveStore } from '../store/archiveStore'
import { StudyStep, SessionStatus, CardType } from '../types/study.types'
import { generateCard, CardGenerationResult } from '../services/cardService'
import { getOpenAIClient, hasApiKey } from '../services/openai'
import { v4 as uuidv4 } from 'uuid'
import { KnowledgeCard } from '../types/study.types'

export interface UseStudySessionReturn {
  sessionId: string | null
  currentStep: StudyStep
  isLoading: boolean
  error: string | null
  startSession: (materialId: string, terms: string[]) => string
  goToStep: (step: StudyStep) => void
  nextStep: () => void
  prevStep: () => void
  generateCards: (terms: string[], context: string) => Promise<CardGenerationResult[]>
  completeSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  resetSession: () => void
}

export function useStudySession(): UseStudySessionReturn {
  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    getCurrentSession,
    updateSession,
    completeSession: completeSessionStore,
    setCurrentStep: setStep,
  } = useStudyStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentSession = getCurrentSession()
  const currentStep = currentSession?.currentStep ?? StudyStep.SELECT_CONTENT
  
  const startSession = useCallback(
    (materialId: string, terms: string[]): string => {
      setError(null)
      const sessionId = createSession(materialId, terms)
      return sessionId
    },
    [createSession]
  )
  
  const goToStep = useCallback(
    (step: StudyStep): void => {
      if (currentSessionId) {
        setStep(currentSessionId, step)
      }
    },
    [currentSessionId, setStep]
  )
  
  const nextStep = useCallback((): void => {
    if (currentStep < StudyStep.OUTPUT_SCORE) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, goToStep])
  
  const prevStep = useCallback((): void => {
    if (currentStep > StudyStep.SELECT_CONTENT) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])
  
  const generateCards = useCallback(
    async (terms: string[], context: string): Promise<CardGenerationResult[]> => {
      if (!currentSessionId) {
        return [{ success: false, error: 'No active session' }]
      }
      
      setIsLoading(true)
      setError(null)
      
      const results: CardGenerationResult[] = []
      
      try {
        for (let i = 0; i < terms.length; i++) {
          const result = await generateCard(terms[i], context, currentSessionId)
          
          if (result.success && result.card) {
            // Add card to session
            const session = sessions.find((s) => s.id === currentSessionId)
            if (session) {
              const newCard: KnowledgeCard = {
                ...result.card,
                id: uuidv4(),
                studySessionId: currentSessionId,
                type: CardType.STANDARD,
                createdAt: new Date().toISOString(),
              }
              updateSession(currentSessionId, {
                generatedCards: [...session.generatedCards, newCard],
              })
            }
          }
          
          results.push(result)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成失败')
      } finally {
        setIsLoading(false)
      }
      
      return results
    },
    [currentSessionId, sessions, updateSession]
  )
  
  const completeSession = useCallback((): void => {
    if (currentSessionId) {
      completeSessionStore(currentSessionId)
      
      // Schedule reviews for all generated cards
      const session = sessions.find((s) => s.id === currentSessionId)
      if (session) {
        session.generatedCards.forEach((card) => {
          // This would be implemented with reviewStore.scheduleReview
        })
        
        // Create archive record
        const { addRecord } = useArchiveStore.getState()
        const avgScore =
          session.outputRecords.length > 0
            ? session.outputRecords.reduce((sum, r) => sum + r.scoreResult.totalScore, 0) /
              session.outputRecords.length
            : 0
        
        addRecord({
          studySessionId: currentSessionId,
          title: `学习 ${new Date().toLocaleDateString('zh-CN')}`,
          terms: session.selectedTerms,
          averageScore: avgScore,
          domain: session.generatedCards[0]?.domain || '通用',
          studiedAt: new Date().toISOString(),
        })
      }
    }
  }, [currentSessionId, sessions, completeSessionStore])
  
  const pauseSession = useCallback((): void => {
    if (currentSessionId) {
      updateSession(currentSessionId, { status: SessionStatus.PAUSED })
    }
  }, [currentSessionId, updateSession])
  
  const resumeSession = useCallback((): void => {
    if (currentSessionId) {
      updateSession(currentSessionId, { status: SessionStatus.ACTIVE })
    }
  }, [currentSessionId, updateSession])
  
  const resetSession = useCallback((): void => {
    setCurrentSession(null)
    setError(null)
  }, [setCurrentSession])
  
  return {
    sessionId: currentSessionId,
    currentStep,
    isLoading,
    error,
    startSession,
    goToStep,
    nextStep,
    prevStep,
    generateCards,
    completeSession,
    pauseSession,
    resumeSession,
    resetSession,
  }
}
