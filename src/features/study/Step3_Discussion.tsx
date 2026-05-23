import { useState, useRef, useEffect } from 'react'
import { useTheme, Tooltip } from '@mui/material'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Alert,
} from '@mui/material'
import {
  Send as SendIcon,
  Psychology as AIIcon,
  Person as UserIcon,
} from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { DiscussionMessage, MessageRole } from '../../types/study.types'
import { sendDiscussionMessage } from '../../services/discussionService'
import { hasApiKey } from '../../services/openai'
import VoiceInput from '../../components/ui/VoiceInput'
import AITypingText from '../../components/ui/AITypingText'
import { v4 as uuidv4 } from 'uuid'

interface Step3Props {
  onNext: () => void
  onBack: () => void
}

function Step3_Discussion({ onNext, onBack }: Step3Props): JSX.Element {
  const theme = useTheme()
  const { getCurrentSession, updateSession } = useStudyStore()
  const session = getCurrentSession()
  
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentCard = session?.generatedCards[0]
  const apiKeyAvailable = hasApiKey()
  
  // Get or create discussion for current card
  const currentDiscussion = session?.discussions.find(
    (d) => d.cardId === currentCard?.id
  )
  const messages = currentDiscussion?.messages || []
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async (): Promise<void> => {
    if (!input.trim() || !currentCard) return

    const userMessage: DiscussionMessage = {
      id: uuidv4(),
      role: MessageRole.USER,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add user message to local state immediately
    const updatedMessages = [...messages, userMessage]

    // Determine the discussion record index (use fresh session to avoid stale closure)
    const sessionNow = getCurrentSession()
    const existingIndex = sessionNow?.discussions.findIndex(
      (d) => d.cardId === currentCard.id
    )
    const isNewDiscussion = existingIndex === undefined || existingIndex < 0

    if (isNewDiscussion) {
      const newDiscussion = {
        id: uuidv4(),
        cardId: currentCard.id,
        messages: updatedMessages,
        createdAt: new Date().toISOString(),
      }
      updateSession(sessionNow!.id, {
        discussions: [...(sessionNow?.discussions || []), newDiscussion],
      })
    } else {
      updateSession(sessionNow!.id, {
        discussions: sessionNow!.discussions.map((d, i) =>
          i === existingIndex ? { ...d, messages: updatedMessages } : d
        ),
      })
    }

    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      if (!apiKeyAvailable) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const demoResponse: DiscussionMessage = {
          id: uuidv4(),
          role: MessageRole.ASSISTANT,
          content: `好的，关于"${currentCard.term}"，我们来深入探讨一下。\n\n请思考：这个概念的核心要点是什么？它与其他类似概念有什么区别？能不能举一个你亲身经历的例子？`,
          timestamp: new Date().toISOString(),
        }

        // Always use fresh session to avoid stale closure
        const fresh = getCurrentSession()
        const targetIndex = isNewDiscussion
          ? (fresh?.discussions.length || 0) - 1  // last element just added
          : existingIndex!

        updateSession(fresh!.id, {
          discussions: fresh!.discussions.map((d, i) =>
            i === targetIndex
              ? { ...d, messages: [...updatedMessages, demoResponse] }
              : d
          ),
        })
      } else {
        const historyForAPI = updatedMessages.slice(0, -1)
        const userMsg = input.trim()

        const result = await sendDiscussionMessage(
          currentCard,
          historyForAPI,
          userMsg
        )

        if (result.success && result.message) {
          // Always use fresh session to avoid stale closure
          const fresh = getCurrentSession()
          const targetIndex = isNewDiscussion
            ? (fresh?.discussions.length || 0) - 1
            : existingIndex!

          updateSession(fresh!.id, {
            discussions: fresh!.discussions.map((d, i) =>
              i === targetIndex
                ? { ...d, messages: [...updatedMessages, result.message!] }
                : d
            ),
          })
        } else {
          setError(result.error || '发送失败，请重试')
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '发生错误'
      console.error('[DeepDiscussion] API error:', err)
      setError(errMsg)
    } finally {
      setIsTyping(false)
    }
  }
  
  const handleVoiceInput = (transcript: string): void => {
    if (transcript) {
      setInput(transcript)
    }
  }
  
  if (!currentCard) {
    return (
      <Box>
        <Alert severity="warning">没有可讨论的卡片</Alert>
      </Box>
    )
  }
  
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        深度讨论
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        与 AI 导师讨论，加深对"{currentCard.term}"的理解
      </Typography>
      
      {/* Card Info */}
      <Card sx={{ mb: 3, bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'primary.50' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600}>
            {currentCard.term}
          </Typography>
          <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'grey.300' : 'text.secondary'}>
            {currentCard.coreDefinition}
          </Typography>
        </CardContent>
      </Card>
      
      {/* Messages */}
      <Box
        sx={{
          height: 300,
          overflowY: 'auto',
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          borderRadius: 2,
          p: 2,
          mb: 2,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AIIcon sx={{ fontSize: 48, color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              开始讨论，提出你的问题或想法
            </Typography>
          </Box>
        )}
        
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              justifyContent:
                message.role === MessageRole.USER ? 'flex-end' : 'flex-start',
            }}
          >
            {message.role === MessageRole.ASSISTANT && (
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <AIIcon fontSize="small" />
              </Avatar>
            )}
            
            <Box
              sx={{
                maxWidth: '70%',
                p: 1.5,
                borderRadius: 2,
                bgcolor:
                  message.role === MessageRole.USER
                    ? 'primary.main'
                    : 'background.paper',
                color:
                  message.role === MessageRole.USER ? 'white' : 'text.primary',
                boxShadow: 1,
              }}
            >
              {message.role === MessageRole.ASSISTANT ? (
                <AITypingText
                  text={message.content}
                  variant="body2"
                  speed={20}
                />
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              )}
            </Box>
            
            {message.role === MessageRole.USER && (
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <UserIcon fontSize="small" />
              </Avatar>
            )}
          </Box>
        ))}
        
        {isTyping && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              <AIIcon fontSize="small" />
            </Avatar>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                color: 'text.primary',   // 显式指定，暗色模式下也能正确继承
                boxShadow: 1,
              }}
            >
              <Typography variant="body2">
                AI 导师正在思考...
              </Typography>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <VoiceInput
          onTranscriptChange={handleVoiceInput}
          size="small"
          showTranscript={false}
        />
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="输入你的问题或想法..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isTyping}
        />
        <Tooltip title={!input.trim() || isTyping ? '请输入内容后发送' : '发送消息'}>
          <span>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              sx={{ minWidth: 60 }}
            >
              <SendIcon />
            </Button>
          </span>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onBack}>上一步</Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onNext}
        >
          下一步：生成融合卡
        </Button>
      </Box>
    </Box>
  )
}

export default Step3_Discussion
