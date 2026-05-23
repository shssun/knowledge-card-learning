import { useNavigate } from 'react-router-dom'
import { Box, Container, Button } from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import MaterialCenter from '../features/materials/MaterialCenter'
import { ROUTES } from '../constants/routes'

function MaterialPage(): JSX.Element {
  const navigate = useNavigate()
  
  return (
    <Box>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(ROUTES.HOME)}
            sx={{ color: 'text.secondary' }}
          >
            返回首页
          </Button>
        </Box>
      </Container>
      <MaterialCenter />
    </Box>
  )
}

export default MaterialPage
