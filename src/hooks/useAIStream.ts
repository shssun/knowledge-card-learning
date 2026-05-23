import { useState, useCallback } from 'react'
import { sendChatRequest } from '../services/openai'
import { OpenAI } from 'openai'

export interface UseAIStreamReturn {
  content: string
  isStreaming: boolean
  error: string | null
  sendMessage: (messages: OpenAI.Chat.ChatCompletionMessageParam[]) => Promise<string>
  resetContent: () => void
}

/**
 * Hook for AI streaming responses
 */
export function useAIStream(): UseAIStreamReturn {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const sendMessage = useCallback(
    async (messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> => {
      setIsStreaming(true)
      setError(null)
      setContent('')
      
      try {
        const fullContent = await sendChatRequest(messages, (chunk) => {
          setContent((prev) => prev + chunk)
        })
        
        return fullContent
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'AI 请求失败'
        setError(errorMessage)
        throw err
      } finally {
        setIsStreaming(false)
      }
    },
    []
  )
  
  const resetContent = useCallback((): void => {
    setContent('')
    setError(null)
  }, [])
  
  return {
    content,
    isStreaming,
    error,
    sendMessage,
    resetContent,
  }
}

/**
 * Hook for typing animation effect
 */
export function useTypingAnimation(
  text: string,
  speed: number = 50
): {
  displayedText: string
  isComplete: boolean
  progress: number
} {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  
  // Calculate progress (0 to 1)
  const progress = text.length > 0 ? displayedText.length / text.length : 0
  
  // Reset when text changes
  useState(() => {
    setDisplayedText('')
    setIsComplete(false)
  })
  
  // Typing effect
  useState(() => {
    if (!text) {
      setDisplayedText('')
      setIsComplete(true)
      return
    }
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, speed)
    
    return () => clearInterval(timer)
  })
  
  return {
    displayedText,
    isComplete,
    progress,
  }
}
