import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseSpeechRecognitionReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

/**
 * Hook for speech recognition functionality
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  
  useEffect(() => {
    if (!isSupported) return
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
      }
    }
    
    recognition.onerror = (event: any) => {
      setError(event.error)
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognitionRef.current = recognition
    
    return () => {
      recognition.abort()
    }
  }, [isSupported])
  
  const startListening = useCallback((): void => {
    if (!isSupported || !recognitionRef.current) {
      setError('语音识别不支持')
      return
    }
    
    setError(null)
    setTranscript('')
    
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      setError('启动语音识别失败')
    }
  }, [isSupported])
  
  const stopListening = useCallback((): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])
  
  const resetTranscript = useCallback((): void => {
    setTranscript('')
  }, [])
  
  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default useSpeechRecognition
