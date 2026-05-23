import { useEffect } from 'react'
import { Box, IconButton, Tooltip, CircularProgress, Typography } from '@mui/material'
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
} from '@mui/icons-material'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

interface VoiceInputProps {
  onTranscriptChange?: (transcript: string) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  showTranscript?: boolean
}

function VoiceInput({
  onTranscriptChange,
  disabled = false,
  size = 'medium',
  showTranscript = true,
}: VoiceInputProps): JSX.Element {
  const {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  // Report transcript changes
  useEffect(() => {
    onTranscriptChange?.(transcript)
  }, [transcript, onTranscriptChange])

  const handleToggle = (): void => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  const sizeConfig = {
    small: { button: 36, icon: 20 },
    medium: { button: 48, icon: 24 },
    large: { button: 64, icon: 32 },
  }

  const config = sizeConfig[size]

  if (!isSupported) {
    return (
      <Tooltip title="您的浏览器不支持语音输入">
        <IconButton disabled size={size}>
          <MicOffIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={handleToggle}
          disabled={disabled}
          sx={{
            width: config.button,
            height: config.button,
            bgcolor: isListening ? 'error.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: isListening ? 'error.dark' : 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          {isListening ? (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress
                size={config.icon}
                sx={{ position: 'absolute', color: 'white' }}
              />
              <StopIcon sx={{ fontSize: config.icon }} />
            </Box>
          ) : (
            <MicIcon sx={{ fontSize: config.icon }} />
          )}
        </IconButton>

        {isListening && (
          <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
            正在聆听...
          </Typography>
        )}

        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}
      </Box>

      {showTranscript && transcript && (
        <Typography
          variant="body2"
          sx={{
            p: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
            fontStyle: 'italic',
          }}
        >
          {transcript}
        </Typography>
      )}
    </Box>
  )
}

export default VoiceInput
