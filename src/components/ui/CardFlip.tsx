import { useState, useCallback } from 'react'
import { Box, IconButton } from '@mui/material'
import { Flip as FlipIcon } from '@mui/icons-material'

interface CardFlipProps {
  children: React.ReactNode
  onFlip?: (isFlipped: boolean) => void
  defaultFlipped?: boolean
}

function CardFlip({
  children,
  onFlip,
  defaultFlipped = false,
}: CardFlipProps): JSX.Element {
  const [isFlipped, setIsFlipped] = useState(defaultFlipped)

  const handleFlip = useCallback((): void => {
    setIsFlipped((prev) => {
      const newState = !prev
      onFlip?.(newState)
      return newState
    })
  }, [onFlip])

  // children should be an array of [front, back]
  const childArray = Array.isArray(children) ? children : [children]
  const front = childArray[0]
  const back = childArray[1]

  return (
    <Box
      sx={{
        perspective: 1000,
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={handleFlip}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            '&.flipped': {
              transform: 'rotateY(180deg)',
            },
          }}
        >
          {front}
        </Box>

        {/* Back */}
        {back && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {back}
          </Box>
        )}
      </Box>

      {/* Flip button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          handleFlip()
        }}
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'action.hover',
          '&:hover': {
            bgcolor: 'action.selected',
          },
        }}
      >
        <FlipIcon />
      </IconButton>
    </Box>
  )
}

export default CardFlip
