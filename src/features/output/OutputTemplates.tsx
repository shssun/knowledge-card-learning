import { useTheme, Tooltip } from '@mui/material'
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Button,
} from '@mui/material'
import {
  Description as DocIcon,
  Slideshow as SlideIcon,
  Code as CodeIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'

interface Template {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  format: string
  preview: string
}

const templates: Template[] = [
  {
    id: 'markdown',
    title: 'Markdown 文档',
    description: '适合笔记整理、博客写作、知识沉淀',
    icon: <DocIcon sx={{ fontSize: 32 }} />,
    format: 'md',
    preview: `# 知识卡片

## 概念定义
...

## 实践案例
...

## 常见误区
...`,
  },
  {
    id: 'slides',
    title: '演示文稿',
    description: '适合演讲展示、教学分享、商务汇报',
    icon: <SlideIcon sx={{ fontSize: 32 }} />,
    format: 'pptx',
    preview: 'Slide 1: 标题\nSlide 2: 定义\nSlide 3: 案例\nSlide 4: 总结',
  },
  {
    id: 'flashcard',
    title: '闪卡格式',
    description: '适合 Anki 等记忆工具导入',
    icon: <CodeIcon sx={{ fontSize: 32 }} />,
    format: 'csv',
    preview: 'Front,Back\n概念,定义\n...',
  },
  {
    id: 'article',
    title: '长文输出',
    description: '适合深度分析、主题写作',
    icon: <ArticleIcon sx={{ fontSize: 32 }} />,
    format: 'txt',
    preview: '标题\n\n正文内容...\n\n参考资料...',
  },
]

function OutputTemplates(): JSX.Element {
  const theme = useTheme()
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        选择输出模板，生成格式化内容
      </Typography>
      
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={3} key={template.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'secondary.dark' : 'secondary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: 'secondary.main',
                    }}
                  >
                    {template.icon}
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    {template.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {template.description}
                  </Typography>
                  
                  <Chip
                    label={`.${template.format}`}
                    size="small"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Template Preview */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          模板内容预览
        </Typography>
        
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {template.title}
                    </Typography>
                    <Tooltip title="将模板内容复制到剪贴板">
                      <Button
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(template.preview)
                        }}
                      >
                        使用
                      </Button>
                    </Tooltip>
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    {template.preview}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}

export default OutputTemplates
