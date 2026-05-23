import { useTheme } from '@mui/material'
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
} from '@mui/material'
import {
  Work as WorkIcon,
  School as SchoolIcon,
  EmojiEvents as ExamIcon,
  Share as ShareIcon,
} from '@mui/icons-material'

interface Scene {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tags: string[]
}

const scenes: Scene[] = [
  {
    id: 'work',
    title: '职场应用',
    description: '用于工作汇报、项目介绍、方案展示等职场场景',
    icon: <WorkIcon sx={{ fontSize: 40 }} />,
    tags: ['工作汇报', '方案展示', '项目介绍'],
  },
  {
    id: 'study',
    title: '学习分享',
    description: '制作学习笔记、知识点总结、知识分享PPT',
    icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    tags: ['笔记整理', '知识总结', '学习分享'],
  },
  {
    id: 'exam',
    title: '考试准备',
    description: '备考复习、知识问答、答题练习',
    icon: <ExamIcon sx={{ fontSize: 40 }} />,
    tags: ['备考', '问答', '练习'],
  },
  {
    id: 'social',
    title: '社交分享',
    description: '朋友圈分享、社群讨论、直播讲解',
    icon: <ShareIcon sx={{ fontSize: 40 }} />,
    tags: ['朋友圈', '社群', '直播'],
  },
]

function SceneSelector(): JSX.Element {
  const theme = useTheme()
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        选择输出场景，获取专属模板和建议
      </Typography>
      
      <Grid container spacing={3}>
        {scenes.map((scene) => (
          <Grid item xs={12} sm={6} md={3} key={scene.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    {scene.icon}
                  </Box>
                  
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {scene.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {scene.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {scene.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Template Preview */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          场景模板预览
        </Typography>
        
        <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              职场应用 - 方案展示模板
            </Typography>
            <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
{`## 方案背景
（介绍项目背景和目标）

## 核心概念
### [概念名称]
- 定义：（概念定义）
- 适用范围：（使用场景）
- 注意事项：（关键要点）

## 实践案例
（实际应用案例）

## 总结
（核心要点回顾）`}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default SceneSelector
