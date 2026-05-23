/**
 * 有效用户等级 Hook
 *
 * 基于元概念掌握进度自动判定用户等级：
 * - 小白: Layer1+2 掌握 < 80% (30/37)
 * - 初级: Layer1+2 掌握 >= 80%，Layer3-5 掌握 < 80%
 * - 中级: Layer3-5 掌握 >= 80%，Layer6-7 掌握 < 80%
 * - 高级: Layer6-7 掌握 >= 80%，Layer8 < 80%
 * - 大师: Layer8 >= 80%
 *
 * 升级门禁：当前等级核心层 80% 掌握 → 自动解锁下一级
 */

import { useMemo } from 'react'
import { useMetaProgressStore } from '../store/metaProgressStore'
import { type UserLevel } from '../types/level.types'

/** 每个等级对应的核心学习 Layer */
const LEVEL_CORE_LAYERS: Record<UserLevel, number[]> = {
  小白: [1, 2],
  初级: [3, 4, 5],
  中级: [6, 7],
  高级: [8],
  大师: [],
}

/** 升级所需百分比阈值 */
const ADVANCE_THRESHOLD = 0.8

/**
 * 元概念在各层的分布（与 public/meta-concepts/manifest.json 严格同步）
 * 总计 130 个概念，8 层递进
 */
const LAYER_CONCEPTS: Record<number, string[]> = {
  1: ['存在','虚无','时间','空间','运动','静止','能量','物质','因果','对立','统一','变化','恒定','整体','局部'],
  2: ['本质','现象','主观','客观','确定','不确定','归纳','演绎','前提','结论','条件','结果','共性','差异','范围','边界','顺序','结构','维度','概率','必然','偶然'],
  3: ['需求','欲望','动机','情绪','理智','认知','偏见','执念','恐惧','贪婪','懒惰','自尊','自卑','认同','排斥','取舍','得失','舍得','共情','冷漠'],
  4: ['利益','价值','交换','信任','猜忌','立场','身份','话语权','圈层','距离','规则','人情','博弈','妥协','制衡','依附','独立'],
  5: ['目标','路径','执行','拖延','专注','分心','反馈','修正','试错','复盘','积累','消耗','效率','成本','代价','机会','风险','预判','布局','顺势','逆势'],
  6: ['定价','利润','现金流','杠杆','稀缺','竞争','差异化','护城河','网络效应','周期','融资','品牌','增长','估值'],
  7: ['模型','框架','系统','抽象','逻辑','批判性思维','第一性原理','元认知'],
  8: ['创新','迭代','创造','设计','问题定义','解决方案','原型','MVP','反馈循环','敏捷','设计思维','约束','极简'],
}

export interface EffectiveLevelInfo {
  /** 当前有效等级 */
  level: UserLevel
  /** 当前等级索引 (0-4) */
  levelIndex: number
  /** 当前等级已掌握的元概念数 */
  currentLearned: number
  /** 当前等级总元概念数 */
  currentTotal: number
  /** 当前等级进度百分比 */
  currentPercent: number
  /** 是否达到下一级门槛 */
  canAdvance: boolean
  /** 还需要掌握多少概念才能升级 */
  remainingToAdvance: number
  /** 全局已掌握数 */
  totalLearned: number
  /** 全局总概念数 */
  totalConcepts: number
}

export function useEffectiveLevel(): EffectiveLevelInfo {
  const { scores } = useMetaProgressStore()

  return useMemo(() => {
    const mastered = (layerKeys: number[]) => {
      const allKeys = layerKeys.flatMap((l) => LAYER_CONCEPTS[l] || [])
      return allKeys.filter((k) => (scores[k] ?? 0) >= 80).length
    }

    const countConcepts = (layerKeys: number[]) => {
      return layerKeys.reduce((sum, l) => sum + (LAYER_CONCEPTS[l]?.length || 0), 0)
    }

    // 判断当前等级
    const levels: UserLevel[] = ['小白', '初级', '中级', '高级', '大师']
    let currentLevel: UserLevel = '小白'
    let canAdvance = false

    for (let i = 0; i < levels.length - 1; i++) {
      const coreLayers = LEVEL_CORE_LAYERS[levels[i]]
      const total = countConcepts(coreLayers)
      const learned = mastered(coreLayers)
      const percent = total > 0 ? learned / total : 1

      if (percent >= ADVANCE_THRESHOLD) {
        // 可以选择进阶
        canAdvance = true
      } else {
        currentLevel = levels[i]
        canAdvance = false
        break
      }
    }

    // 检查是否已经是大师
    if (currentLevel === levels[0]) {
      // 从高往下检查
      for (let i = levels.length - 1; i >= 0; i--) {
        if (i === levels.length - 1) {
          // 大师：所有层 80% 掌握
          const allLayers = [1, 2, 3, 4, 5, 6, 7, 8]
          const total = countConcepts(allLayers)
          const learned = mastered(allLayers)
          if (total > 0 && learned / total >= ADVANCE_THRESHOLD) {
            currentLevel = '大师'
            canAdvance = false
            break
          }
        }
        // 检查当前层级是否全部达标（包括高级核心Layer8）
        if (i > 0) {
          const coreLayers = LEVEL_CORE_LAYERS[levels[i - 1]]
          const total = countConcepts(coreLayers)
          const learned = mastered(coreLayers)
          if (total > 0 && learned / total >= ADVANCE_THRESHOLD) {
            currentLevel = levels[i]
            // Check if this level itself is fully mastered
            const thisLayers = LEVEL_CORE_LAYERS[levels[i]]
            const thisTotal = countConcepts(thisLayers)
            const thisLearned = mastered(thisLayers)
            canAdvance = thisTotal > 0 && thisLearned / thisTotal >= ADVANCE_THRESHOLD && i < levels.length - 1
            break
          }
        }
      }
    }

    const levelIdx = levels.indexOf(currentLevel)
    const coreLayers = LEVEL_CORE_LAYERS[currentLevel]
    const currentTotal = countConcepts(coreLayers)
    const currentLearned = mastered(coreLayers)
    const currentPercent = currentTotal > 0 ? Math.round((currentLearned / currentTotal) * 100) : 0

    // 计算还差多少才能升级
    const requiredToAdvance = Math.ceil(currentTotal * ADVANCE_THRESHOLD)
    const remainingToAdvance = Math.max(0, requiredToAdvance - currentLearned)

    // 全局统计
    const allLayers = [1, 2, 3, 4, 5, 6, 7, 8]
    const totalConcepts = countConcepts(allLayers)
    const totalLearned = mastered(allLayers)

    return {
      level: currentLevel,
      levelIndex: levelIdx,
      currentLearned,
      currentTotal,
      currentPercent,
      canAdvance,
      remainingToAdvance,
      totalLearned,
      totalConcepts,
    }
  }, [scores])
}
