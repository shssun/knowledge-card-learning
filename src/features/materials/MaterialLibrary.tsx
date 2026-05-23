import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LibraryBooks as LibraryIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaterialStore } from '../../store/materialStore'
import { MaterialCategory, DifficultyLevel } from '../../types/material.types'
import DifficultyBadge from './DifficultyBadge'
import EmptyState from '../../components/ui/EmptyState'
import { ROUTES } from '../../constants/routes'

interface MaterialLibraryProps {
  onEditMaterial?: (id: string) => void
}

function MaterialLibrary({ onEditMaterial }: MaterialLibraryProps): JSX.Element {
  const { materials, deleteMaterial } = useMaterialStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()
  
  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    id: string
  ): void => {
    setAnchorEl(event.currentTarget)
    setSelectedId(id)
  }
  
  const handleMenuClose = (): void => {
    setAnchorEl(null)
    setSelectedId(null)
  }
  
  const handleDelete = (): void => {
    if (selectedId && window.confirm('确定要删除这个资料吗？')) {
      deleteMaterial(selectedId)
    }
    handleMenuClose()
  }
  
  const handleEdit = (): void => {
    if (selectedId && onEditMaterial) {
      onEditMaterial(selectedId)
    }
    handleMenuClose()
  }
  
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case MaterialCategory.SCHOOL_SUBJECT:
        return '学科课程'
      case MaterialCategory.INDUSTRY_TRACK:
        return '行业赛道'
      case MaterialCategory.FREE_RESEARCH:
        return '自由研究'
      default:
        return category
    }
  }
  
  if (materials.length === 0) {
    return (
      <EmptyState
        icon={<LibraryIcon sx={{ fontSize: 48 }} />}
        title="暂无学习资料"
        description="上传一些学习资料，开始你的知识积累之旅吧"
      />
    )
  }
  
  return (
    <Box>
      {/* Search */}
      <TextField
        fullWidth
        placeholder="搜索资料..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      
      {/* Materials Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
        {filteredMaterials.map((material) => (
          <Card key={material.id} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: '80%' }}>
                  {material.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, material.id)}
                >
                  <MoreIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={getCategoryLabel(material.category)}
                  size="small"
                  sx={{ fontSize: 11 }}
                />
                <DifficultyBadge level={material.difficulty} />
              </Box>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {material.content}
              </Typography>
              
              {material.keywords.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {material.keywords.slice(0, 3).map((kw) => (
                    <Chip
                      key={kw}
                      label={kw}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  ))}
                  {material.keywords.length > 3 && (
                    <Chip
                      label={`+${material.keywords.length - 3}`}
                      size="small"
                      sx={{ fontSize: 10 }}
                    />
                  )}
                </Box>
              )}
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                size="small"
                color="primary"
                onClick={() => navigate(`${ROUTES.STUDY}?materialId=${material.id}&mode=focused`)}
              >
                开始学习
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      
      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          编辑
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default MaterialLibrary
