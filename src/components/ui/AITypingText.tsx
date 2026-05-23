import { useState, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

interface AITypingTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  showCursor?: boolean
  variant?: 'body1' | 'body2' | 'subtitle1' | 'h6'
}

function AITypingText({
  text,
  speed = 30,
  onComplete,
  showCursor = true,
  variant = 'body1',
}: AITypingTextProps): JSX.Element {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(timer)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  return (
    <Box
      component="span"
      sx={{
        fontFamily: 'inherit',
        lineHeight: 'inherit',
      }}
    >
      <Typography
        component="span"
        variant={variant}
        sx={{ whiteSpace: 'pre-wrap' }}
      >
        {displayedText}
      </Typography>
      {showCursor && !isComplete && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            bgcolor: 'primary.main',
            ml: 0.5,
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': {
              '50%': { opacity: 0 },
            },
          }}
        />
      )}
    </Box>
  )
}

export default AITypingText
