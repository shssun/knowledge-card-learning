import { Box, Typography, Paper } from '@mui/material'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { ScoreResult } from '../../types/study.types'

interface ScoreRadarProps {
  scoreResult: ScoreResult
  showTotal?: boolean
}

const dimensionLabels: Record<string, string> = {
  definitionAccuracy: '概念准确性',
  boundaryClarity: '边界清晰度',
  caseCompleteness: '案例完整性',
  misconceptionAwareness: '误区意识',
}

function ScoreRadar({ scoreResult, showTotal = true }: ScoreRadarProps): JSX.Element {
  const data = [
    { dimension: '概念准确性', score: scoreResult.definitionAccuracy, fullMark: 100 },
    { dimension: '边界清晰度', score: scoreResult.boundaryClarity, fullMark: 100 },
    { dimension: '案例完整性', score: scoreResult.caseCompleteness, fullMark: 100 },
    { dimension: '误区意识', score: scoreResult.misconceptionAwareness, fullMark: 100 },
  ]

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981'
    if (score >= 75) return '#3b82f6'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      {showTotal && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {scoreResult.totalScore}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            综合得分
          </Typography>
        </Box>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.replace('准确性', '').replace('清晰度', '').replace('完整性', '').replace('意识', '')}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score breakdown */}
      <Box sx={{ mt: 2 }}>
        {data.map((item) => (
          <Box
            key={item.dimension}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 0.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.dimension}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: getScoreColor(item.score) }}
            >
              {item.score}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default ScoreRadar
