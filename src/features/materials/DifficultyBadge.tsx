import { Chip } from '@mui/material'
import { DifficultyLevel } from '../../types/material.types'

interface DifficultyBadgeProps {
  level: string
  size?: 'small' | 'medium'
}

function DifficultyBadge({ level, size = 'small' }: DifficultyBadgeProps): JSX.Element {
  const getLevelConfig = (lvl: string) => {
    switch (lvl) {
      case DifficultyLevel.BEGINNER:
        return { label: '入门', color: 'success' as const }
      case DifficultyLevel.INTERMEDIATE:
        return { label: '进阶', color: 'warning' as const }
      case DifficultyLevel.ADVANCED:
        return { label: '高级', color: 'error' as const }
      default:
        return { label: lvl, color: 'default' as const }
    }
  }
  
  const config = getLevelConfig(level)
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 500 }}
    />
  )
}

export default DifficultyBadge
