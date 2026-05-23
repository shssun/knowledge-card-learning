import {
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Replay as ReplayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Audiotrack as AudioIcon,
} from '@mui/icons-material'
import { ArchiveRecord } from '../../types/archive.types'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAudioStore, AudioRecord } from '../../store/audioStore'
import { useRef, useEffect, useCallback } from 'react'

interface ArchiveDetailProps {
  record: ArchiveRecord
  onClose: () => void
}

function ArchiveDetail({ record, onClose }: ArchiveDetailProps): JSX.Element {
  const navigate = useNavigate()
  const {
    audioList,
    currentAudio,
    isPlaying,
    currentTime,
    addAudio,
    deleteAudio,
    setCurrentAudio,
    setIsPlaying,
    setCurrentTime,
  } = useAudioStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 过滤当前领域的音频
  const domainAudios = audioList.filter((a) => a.domain === record.domain)

  // 格式化时间
  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // 音频文件上传 → base64
  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        // 获取时长
        const audio = new Audio(base64)
        audio.addEventListener('loadedmetadata', () => {
          addAudio({
            name: file.name.replace(/\.[^.]+$/, ''),
            domain: record.domain,
            audioData: base64,
            duration: audio.duration || 0,
          })
        })
      }
      reader.readAsDataURL(file)
      // 清空 input，允许重复上传同一文件
      e.target.value = ''
    },
    [record.domain, addAudio]
  )

  // 播放/暂停切换
  const handlePlay = useCallback(
    (audio: AudioRecord) => {
      if (currentAudio?.id === audio.id && isPlaying) {
        setIsPlaying(false)
        audioRef.current?.pause()
      } else {
        if (currentAudio?.id !== audio.id) {
          setCurrentAudio(audio)
          setIsPlaying(true)
          // useEffect 里会处理 audio.play()
        } else {
          setIsPlaying(true)
          audioRef.current?.play()
        }
      }
    },
    [currentAudio, isPlaying, setCurrentAudio, setIsPlaying]
  )

  // 同步 HTMLAudioElement 状态
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentAudio) return
    if (audio.src !== currentAudio.audioData) {
      audio.src = currentAudio.audioData
    }
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [currentAudio, isPlaying, setIsPlaying])

  // 播放进度更新
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime])

  // 播放结束
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
  }, [setIsPlaying, setCurrentTime])

  const getScoreLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: '优秀', color: '#10b981' }
    if (score >= 75) return { label: '良好', color: '#3b82f6' }
    if (score >= 60) return { label: '及格', color: '#f59e0b' }
    return { label: '需改进', color: '#ef4444' }
  }

  const level = getScoreLevel(record.averageScore)

  // 重新学习：跳转到研习页面
  const handleRStudy = (): void => {
    onClose()
    navigate(`${ROUTES.STUDY}?term=${encodeURIComponent(record.terms[0] || '')}`)
  }

  // 开始复习：跳转到复习页面
  const handleReview = (): void => {
    onClose()
    navigate(ROUTES.REVIEW)
  }
  
  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {record.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(record.studiedAt).toLocaleString('zh-CN')}
          </Typography>
        </Box>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          关闭
        </Button>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Score Overview */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 3,
                bgcolor: 'grey.50',
                borderRadius: 2,
              }}
            >
              <Typography variant="h2" fontWeight={700} sx={{ color: level.color }}>
                {record.averageScore.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                综合得分
              </Typography>
              <Chip
                label={level.label}
                sx={{
                  mt: 1,
                  bgcolor: level.color,
                  color: 'white',
                }}
              />
            </Box>
          </Grid>
          
          {/* Details */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                所属领域
              </Typography>
              <Chip label={record.domain} sx={{ mt: 0.5 }} />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                学习术语 ({record.terms.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {record.terms.map((term) => (
                  <Chip
                    key={term}
                    label={term}
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ========== 音频播放区 ========== */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AudioIcon fontSize="small" />
          磨耳朵 · 播客音频
        </Typography>

        {/* 上传按钮 */}
        <Box sx={{ mb: 2 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
            size="small"
            sx={{ mb: domainAudios.length > 0 ? 1.5 : 0 }}
          >
            上传音频
            <input type="file" accept="audio/*" hidden onChange={handleUpload} />
          </Button>
          <Typography variant="caption" color="text.disabled" sx={{ ml: 1.5 }}>
            支持 WAV、MP3 等格式
          </Typography>
        </Box>

        {/* 音频列表 */}
        {domainAudios.length > 0 ? (
          <Box>
            {domainAudios.map((audio) => {
              const isCurrent = currentAudio?.id === audio.id
              const isThisPlaying = isCurrent && isPlaying
              const progress = isCurrent && audio.duration > 0 ? (currentTime / audio.duration) * 100 : 0
              return (
                <Box
                  key={audio.id}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: isCurrent ? 'primary.50' : 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handlePlay(audio)}
                    >
                      {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {audio.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {audio.duration > 0 ? formatTime(audio.duration) : '未知时长'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteAudio(audio.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {/* 播放进度条 */}
                  {isCurrent && audio.duration > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                        {formatTime(currentTime)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ flex: 1, height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                        {formatTime(audio.duration)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">
            暂无音频，点击上方「上传音频」添加播客内容
          </Typography>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="primary" startIcon={<ReplayIcon />} onClick={handleRStudy}>
            重新学习
          </Button>
          <Button variant="contained" color="primary" startIcon={<PlayIcon />} onClick={handleReview}>
            开始复习
          </Button>
        </Box>
      </DialogContent>
    </>
  )
}

export default ArchiveDetail
