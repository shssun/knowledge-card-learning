import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ReviewTask, ReviewMode, EbbinghausStage, MistakeEntry } from '../types/review.types'
import { v4 as uuidv4 } from 'uuid'

interface ReviewState {
  tasks: ReviewTask[]
  mistakeBook: MistakeEntry[]
  
  // Task operations
  addTask: (task: Omit<ReviewTask, 'id'>) => void
  updateTask: (id: string, updates: Partial<ReviewTask>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  getTaskById: (id: string) => ReviewTask | undefined
  getPendingTasks: () => ReviewTask[]
  getTasksByMode: (mode: ReviewMode) => ReviewTask[]
  
  // Mistake book operations
  addMistake: (entry: Omit<MistakeEntry, 'id' | 'recordedAt'>) => void
  updateMistake: (id: string, updates: Partial<MistakeEntry>) => void
  deleteMistake: (id: string) => void
  getMistakesByCardId: (cardId: string) => MistakeEntry[]
  
  // Scheduling
  scheduleReview: (cardId: string, term: string, mode: ReviewMode) => void
  getNextReviewDate: (stage: EbbinghausStage) => Date
  advanceStage: (taskId: string) => void
  snoozeTask: (taskId: string, days?: number) => void
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      tasks: [],
      mistakeBook: [],
      
      addTask: (task) => {
        const newTask: ReviewTask = {
          ...task,
          id: uuidv4(),
        }
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }))
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      },
      
      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (task) {
          // 使用 advanceStage 的逻辑来正确推进阶段
          const stages: EbbinghausStage[] = [
            EbbinghausStage.DAY_1,
            EbbinghausStage.DAY_3,
            EbbinghausStage.DAY_7,
            EbbinghausStage.DAY_15,
          ]
          const currentIndex = stages.indexOf(task.stage)
          const nextStage =
            currentIndex < stages.length - 1
              ? stages[currentIndex + 1]
              : EbbinghausStage.DAY_15

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    isCompleted: true,
                    completedAt: new Date().toISOString(),
                    stage: nextStage,
                    reviewCount: t.reviewCount + 1,
                  }
                : t
            ),
          }))
        }
      },
      
      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id)
      },
      
      getPendingTasks: () => {
        return get().tasks.filter((t) => !t.isCompleted)
      },
      
      getTasksByMode: (mode) => {
        return get().tasks.filter((t) => t.mode === mode)
      },
      
      addMistake: (entry) => {
        const newEntry: MistakeEntry = {
          ...entry,
          id: uuidv4(),
          recordedAt: new Date().toISOString(),
        }
        set((state) => ({
          mistakeBook: [newEntry, ...state.mistakeBook],
        }))
      },
      
      updateMistake: (id, updates) => {
        set((state) => ({
          mistakeBook: state.mistakeBook.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }))
      },
      
      deleteMistake: (id) => {
        set((state) => ({
          mistakeBook: state.mistakeBook.filter((m) => m.id !== id),
        }))
      },
      
      getMistakesByCardId: (cardId) => {
        return get().mistakeBook.filter((m) => m.cardId === cardId)
      },
      
      scheduleReview: (cardId, term, mode) => {
        const now = new Date()
        const task: Omit<ReviewTask, 'id'> = {
          cardId,
          term,
          mode,
          scheduledAt: now.toISOString(),
          isCompleted: false,
          reviewCount: 0,
          stage: EbbinghausStage.DAY_1,
        }
        get().addTask(task)
      },
      
      getNextReviewDate: (stage) => {
        const now = new Date()
        const daysToAdd = stage === EbbinghausStage.DAY_1 ? 1 : stage
        return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      },
      
      advanceStage: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId)
        if (task) {
          const stages: EbbinghausStage[] = [
            EbbinghausStage.DAY_1,
            EbbinghausStage.DAY_3,
            EbbinghausStage.DAY_7,
            EbbinghausStage.DAY_15,
          ]
          const currentIndex = stages.indexOf(task.stage)
          const nextStage =
            currentIndex < stages.length - 1
              ? stages[currentIndex + 1]
              : EbbinghausStage.DAY_15
          
          get().updateTask(taskId, {
            stage: nextStage,
            scheduledAt: get().getNextReviewDate(nextStage).toISOString(),
            isCompleted: false,
          })
        }
      },

      snoozeTask: (taskId, days = 1) => {
        const newDate = new Date()
        newDate.setDate(newDate.getDate() + days)
        get().updateTask(taskId, {
          scheduledAt: newDate.toISOString(),
        })
      },
    }),
    {
      name: 'zhika-review-store',
    }
  )
)
