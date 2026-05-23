/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useReviewStore } from '../../store/reviewStore'
import { ReviewMode, EbbinghausStage } from '../../types/review.types'

describe('ReviewStore', () => {
  beforeEach(() => {
    useReviewStore.setState({
      tasks: [],
      mistakeBook: [],
    })
  })

  describe('addTask', () => {
    it('应添加复习任务', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)

      const tasks = useReviewStore.getState().tasks
      expect(tasks.length).toBe(1)
      expect(tasks[0].cardId).toBe('card-1')
      expect(tasks[0].term).toBe('测试术语')
      expect(tasks[0].id).toBeDefined()
    })
  })

  describe('updateTask', () => {
    it('应更新任务信息', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().updateTask(taskId, {
        term: '更新后的术语',
        reviewCount: 5,
      })

      const updatedTask = useReviewStore.getState().getTaskById(taskId)
      expect(updatedTask?.term).toBe('更新后的术语')
      expect(updatedTask?.reviewCount).toBe(5)
    })
  })

  describe('completeTask', () => {
    it('应完成任务并推进复习阶段', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().completeTask(taskId)

      const completedTask = useReviewStore.getState().getTaskById(taskId)
      expect(completedTask?.isCompleted).toBe(true)
      expect(completedTask?.completedAt).toBeDefined()
      expect(completedTask?.stage).toBe(EbbinghausStage.DAY_3)
      expect(completedTask?.reviewCount).toBe(1)
    })

    it('应限制最大阶段为 DAY_15', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_15,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().completeTask(taskId)

      const completedTask = useReviewStore.getState().getTaskById(taskId)
      expect(completedTask?.stage).toBe(EbbinghausStage.DAY_15)
    })
  })

  describe('deleteTask', () => {
    it('应删除指定任务', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().deleteTask(taskId)

      expect(useReviewStore.getState().getTaskById(taskId)).toBeUndefined()
      expect(useReviewStore.getState().tasks.length).toBe(0)
    })
  })

  describe('getPendingTasks', () => {
    it('应返回未完成的任务', () => {
      const task1 = {
        cardId: 'card-1',
        term: '术语1',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      const task2 = {
        cardId: 'card-2',
        term: '术语2',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: true,
        reviewCount: 1,
        stage: EbbinghausStage.DAY_3,
      }

      useReviewStore.getState().addTask(task1)
      useReviewStore.getState().addTask(task2)

      const pendingTasks = useReviewStore.getState().getPendingTasks()
      expect(pendingTasks.length).toBe(1)
      expect(pendingTasks[0].cardId).toBe('card-1')
    })
  })

  describe('getTasksByMode', () => {
    it('应按模式筛选任务', () => {
      const reciteTask = {
        cardId: 'card-1',
        term: '术语1',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      const speedTask = {
        cardId: 'card-2',
        term: '术语2',
        mode: ReviewMode.SPEED_REVIEW,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(reciteTask)
      useReviewStore.getState().addTask(speedTask)

      const reciteTasks = useReviewStore.getState().getTasksByMode(ReviewMode.RECITE_MODE)
      const speedTasks = useReviewStore.getState().getTasksByMode(ReviewMode.SPEED_REVIEW)

      expect(reciteTasks.length).toBe(1)
      expect(reciteTasks[0].cardId).toBe('card-1')
      expect(speedTasks.length).toBe(1)
      expect(speedTasks[0].cardId).toBe('card-2')
    })
  })

  describe('MistakeBook', () => {
    it('应添加错题记录', () => {
      const mistake = {
        cardId: 'card-1',
        term: '测试术语',
        issueType: '概念混淆',
        description: '错误描述',
        correction: '正确答案',
      }

      useReviewStore.getState().addMistake(mistake)

      const mistakes = useReviewStore.getState().mistakeBook
      expect(mistakes.length).toBe(1)
      expect(mistakes[0].cardId).toBe('card-1')
      expect(mistakes[0].id).toBeDefined()
    })

    it('应按卡片ID获取错题', () => {
      useReviewStore.getState().addMistake({
        cardId: 'card-1',
        term: '术语1',
        issueType: '概念混淆',
        description: '错误',
        correction: '正确',
      })

      useReviewStore.getState().addMistake({
        cardId: 'card-2',
        term: '术语2',
        issueType: '记忆模糊',
        description: '错误',
        correction: '正确',
      })

      const card1Mistakes = useReviewStore.getState().getMistakesByCardId('card-1')
      expect(card1Mistakes.length).toBe(1)
      expect(card1Mistakes[0].cardId).toBe('card-1')
    })

    it('应更新错题', () => {
      useReviewStore.getState().addMistake({
        cardId: 'card-1',
        term: '术语1',
        issueType: '概念混淆',
        description: '原描述',
        correction: '正确',
      })

      const mistakeId = useReviewStore.getState().mistakeBook[0].id

      useReviewStore.getState().updateMistake(mistakeId, {
        description: '更新后的描述',
      })

      const updatedMistake = useReviewStore.getState().mistakeBook[0]
      expect(updatedMistake.description).toBe('更新后的描述')
    })

    it('应删除错题', () => {
      useReviewStore.getState().addMistake({
        cardId: 'card-1',
        term: '术语1',
        issueType: '概念混淆',
        description: '描述',
        correction: '正确',
      })

      const mistakeId = useReviewStore.getState().mistakeBook[0].id

      useReviewStore.getState().deleteMistake(mistakeId)

      expect(useReviewStore.getState().mistakeBook.length).toBe(0)
    })
  })

  describe('scheduleReview', () => {
    it('应创建并调度复习任务', () => {
      useReviewStore.getState().scheduleReview('card-1', '测试术语', ReviewMode.RECITE_MODE)

      const tasks = useReviewStore.getState().tasks
      expect(tasks.length).toBe(1)
      expect(tasks[0].cardId).toBe('card-1')
      expect(tasks[0].term).toBe('测试术语')
      expect(tasks[0].mode).toBe(ReviewMode.RECITE_MODE)
      expect(tasks[0].stage).toBe(EbbinghausStage.DAY_1)
    })
  })

  describe('advanceStage', () => {
    it('应推进复习阶段', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().advanceStage(taskId)

      const advancedTask = useReviewStore.getState().getTaskById(taskId)
      expect(advancedTask?.stage).toBe(EbbinghausStage.DAY_3)
      expect(advancedTask?.isCompleted).toBe(false)
    })

    it('应从 DAY_7 推进到 DAY_15', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_7,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().advanceStage(taskId)

      const advancedTask = useReviewStore.getState().getTaskById(taskId)
      expect(advancedTask?.stage).toBe(EbbinghausStage.DAY_15)
    })
  })

  describe('snoozeTask', () => {
    it('应推迟任务', () => {
      const task = {
        cardId: 'card-1',
        term: '测试术语',
        mode: ReviewMode.RECITE_MODE,
        scheduledAt: new Date().toISOString(),
        isCompleted: false,
        reviewCount: 0,
        stage: EbbinghausStage.DAY_1,
      }

      useReviewStore.getState().addTask(task)
      const taskId = useReviewStore.getState().tasks[0].id

      useReviewStore.getState().snoozeTask(taskId, 2)

      const snoozedTask = useReviewStore.getState().getTaskById(taskId)
      const originalDate = new Date(task.scheduledAt)
      const newDate = new Date(snoozedTask!.scheduledAt)
      expect(newDate.getDate()).toBe(originalDate.getDate() + 2)
    })
  })
})
