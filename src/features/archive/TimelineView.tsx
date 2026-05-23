import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
} from '@mui/material'
import { Timeline as TimelineIcon } from '@mui/icons-material'
import { useArchiveStore } from '../../store/archiveStore'
import { ArchiveRecord } from '../../types/archive.types'

function TimelineView(): JSX.Element {
  const { records } = useArchiveStore()
  
  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    const date = new Date(record.studiedAt).toLocaleDateString('zh-CN')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(record)
    return acc
  }, {} as Record<string, ArchiveRecord[]>)
  
  const sortedDates = Object.keys(groupedRecords).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )
  
  if (records.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <TimelineIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          暂无学习记录
        </Typography>
        <Typography variant="body2" color="text.secondary">
          开始学习后将在这里看到你的学习轨迹
        </Typography>
      </Box>
    )
  }
  
  return (
    <Box>
      {sortedDates.map((date) => (
        <Box key={date} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip label={date} sx={{ fontWeight: 600 }} />
            <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider', ml: 2 }} />
          </Box>
          
          <Grid container spacing={2}>
            {groupedRecords[date].map((record) => (
              <Grid item xs={12} sm={6} md={4} key={record.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {record.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                      <Chip label={record.domain} size="small" />
                      <Chip
                        label={`${record.averageScore.toFixed(0)}分`}
                        size="small"
                        color={
                          record.averageScore >= 75
                            ? 'success'
                            : record.averageScore >= 60
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      学习 {record.terms.length} 个术语
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {record.terms.slice(0, 2).map((term) => (
                        <Chip
                          key={term}
                          label={term}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10 }}
                        />
                      ))}
                      {record.terms.length > 2 && (
                        <Chip
                          label={`+${record.terms.length - 2}`}
                          size="small"
                          sx={{ fontSize: 10 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  )
}

export default TimelineView
