import { useMemo, useCallback } from 'react'
import { useReviewStore } from '../store/reviewStore'
import { ReviewTask, EbbinghausStage, ReviewMode } from '../types/review.types'
import { needsReview, getNextReviewDate } from '../utils/ebbinghaus'

export interface UseReviewScheduleReturn {
  pendingTasks: ReviewTask[]
  todayTasks: ReviewTask[]
  overdueTasks: ReviewTask[]
  getTasksByStage: (stage: EbbinghausStage) => ReviewTask[]
  getTasksByMode: (mode: ReviewMode) => ReviewTask[]
  scheduleNewReview: (cardId: string, term: string, mode: ReviewMode) => void
  completeReview: (taskId: string) => void
  snoozeTask: (taskId: string, days?: number) => void
}

export function useReviewSchedule(): UseReviewScheduleReturn {
  const {
    tasks,
    addTask,
    completeTask,
    updateTask,
    getPendingTasks,
  } = useReviewStore()
  
  const pendingTasks = useMemo(() => {
    return getPendingTasks().sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  }, [tasks, getPendingTasks])
  
  const todayTasks = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    
    return pendingTasks.filter((task) => {
      const scheduled = new Date(task.scheduledAt)
      return scheduled >= startOfDay && scheduled <= endOfDay
    })
  }, [pendingTasks])
  
  const overdueTasks = useMemo(() => {
    return pendingTasks.filter((task) => needsReview(task.scheduledAt))
  }, [pendingTasks])
  
  const getTasksByStage = useCallback(
    (stage: EbbinghausStage): ReviewTask[] => {
      return pendingTasks.filter((task) => task.stage === stage)
    },
    [pendingTasks]
  )
  
  const getTasksByMode = useCallback(
    (mode: ReviewMode): ReviewTask[] => {
      return pendingTasks.filter((task) => task.mode === mode)
    },
    [pendingTasks]
  )
  
  const scheduleNewReview = useCallback(
    (cardId: string, term: string, mode: ReviewMode): void => {
      const task: Omit<ReviewTask, 'id'> = {
        cardId,
        term,
        mode,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }
      addTask(task)
    },
    [addTask]
  )
  
  const completeReview = useCallback(
    (taskId: string): void => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      
      // Calculate next review date based on current stage
      const nextStage = getNextStageFromCurrent(task.stage)
      const nextDate = getNextReviewDate(nextStage)
      
      updateTask(taskId, {
        isCompleted: true,
        completedAt: new Date().toISOString(),
        stage: nextStage,
        scheduledAt: nextDate.toISOString(),
        reviewCount: task.reviewCount + 1,
      })
    },
    [tasks, updateTask]
  )
  
  const snoozeTask = useCallback(
    (taskId: string, days: number = 1): void => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + days)
      
      updateTask(taskId, {
        scheduledAt: newDate.toISOString(),
      })
    },
    [tasks, updateTask]
  )
  
  return {
    pendingTasks,
    todayTasks,
    overdueTasks,
    getTasksByStage,
    getTasksByMode,
    scheduleNewReview,
    completeReview,
    snoozeTask,
  }
}

function getNextStageFromCurrent(stage: EbbinghausStage): EbbinghausStage {
  switch (stage) {
    case EbbinghausStage.DAY_1:
      return EbbinghausStage.DAY_3
    case EbbinghausStage.DAY_3:
      return EbbinghausStage.DAY_7
    case EbbinghausStage.DAY_7:
      return EbbinghausStage.DAY_15
    case EbbinghausStage.DAY_15:
      return EbbinghausStage.DAY_15
    default:
      return EbbinghausStage.DAY_1
  }
}
