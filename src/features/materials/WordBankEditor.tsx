import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material'
import { useMaterialStore } from '../../store/materialStore'
import {
  WordBank,
  WordEntry,
  DifficultyLevel,
  MaterialCategory,
  BankType,
} from '../../types/material.types'
import DifficultyBadge from './DifficultyBadge'
import EmptyState from '../../components/ui/EmptyState'

function WordBankEditor(): JSX.Element {
  const { wordBanks, addWordBank, updateWordBank, deleteWordBank, addWordToBank, removeWordFromBank } = useMaterialStore()
  
  const [activeTab, setActiveTab] = useState(0)
  const [showAddBank, setShowAddBank] = useState(false)
  const [showAddWord, setShowAddWord] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  
  // New bank form
  const [newBankName, setNewBankName] = useState('')
  const [newBankCategory, setNewBankCategory] = useState<MaterialCategory>(MaterialCategory.FREE_RESEARCH)
  
  // New word form
  const [newWordTerm, setNewWordTerm] = useState('')
  const [newWordDefinition, setNewWordDefinition] = useState('')
  const [newWordDifficulty, setNewWordDifficulty] = useState<DifficultyLevel>(DifficultyLevel.BEGINNER)
  const [newWordDomain, setNewWordDomain] = useState('')
  
  const handleAddBank = (): void => {
    if (!newBankName.trim()) return
    
    addWordBank({
      name: newBankName.trim(),
      type: BankType.PRIVATE,
      category: newBankCategory,
      words: [],
    })
    
    setNewBankName('')
    setShowAddBank(false)
  }
  
  const handleAddWord = (): void => {
    if (!selectedBankId || !newWordTerm.trim()) return
    
    addWordToBank(selectedBankId, {
      term: newWordTerm.trim(),
      definition: newWordDefinition.trim(),
      difficulty: newWordDifficulty,
      domain: newWordDomain.trim() || '通用',
    })
    
    setNewWordTerm('')
    setNewWordDefinition('')
    setNewWordDomain('')
    setShowAddWord(false)
  }
  
  const selectedBank = wordBanks.find((b) => b.id === selectedBankId)
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="我的词库" />
          <Tab label="内置词库" />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddBank(true)}
        >
          新建词库
        </Button>
      </Box>
      
      {wordBanks.length === 0 ? (
        <EmptyState
          icon={<BrainIcon sx={{ fontSize: 48 }} />}
          title="暂无词库"
          description="创建你的第一个词库，开始系统化学习"
        />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {wordBanks.map((bank) => (
            <Card
              key={bank.id}
              sx={{
                cursor: 'pointer',
                border: selectedBankId === bank.id ? '2px solid' : '1px solid',
                borderColor: selectedBankId === bank.id ? 'primary.main' : 'divider',
              }}
              onClick={() => setSelectedBankId(bank.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {bank.name}
                  </Typography>
                  <Chip
                    label={bank.type === BankType.PUBLIC ? '内置' : '私有'}
                    size="small"
                    color={bank.type === BankType.PUBLIC ? 'default' : 'primary'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {bank.words.length} 个词条
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  {bank.words.slice(0, 5).map((word) => (
                    <Chip
                      key={word.id}
                      label={word.term}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  ))}
                  {bank.words.length > 5 && (
                    <Chip
                      label={`+${bank.words.length - 5}`}
                      size="small"
                      sx={{ fontSize: 10 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Selected Bank Detail */}
      {selectedBank && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{selectedBank.name}</Typography>
              <Box>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddWord(true)}
                >
                  添加词条
                </Button>
                {selectedBank.type === BankType.PRIVATE && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (window.confirm('确定要删除这个词库吗？')) {
                        deleteWordBank(selectedBank.id)
                        setSelectedBankId(null)
                      }
                    }}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            <List>
              {selectedBank.words.map((word) => (
                <ListItem
                  key={word.id}
                  divider
                  sx={{
                    bgcolor: 'grey.50',
                    mb: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography fontWeight={600}>{word.term}</Typography>
                        <DifficultyBadge level={word.difficulty} />
                      </Box>
                    }
                    secondary={word.definition}
                    secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                  />
                  {selectedBank.type === BankType.PRIVATE && (
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => removeWordFromBank(selectedBank.id, word.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      
      {/* Add Bank Dialog */}
      <Dialog open={showAddBank} onClose={() => setShowAddBank(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建词库</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="词库名称"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="分类"
            value={newBankCategory}
            onChange={(e) => setNewBankCategory(e.target.value as MaterialCategory)}
            SelectProps={{ native: true }}
          >
            <option value={MaterialCategory.SCHOOL_SUBJECT}>学科课程</option>
            <option value={MaterialCategory.INDUSTRY_TRACK}>行业赛道</option>
            <option value={MaterialCategory.FREE_RESEARCH}>自由研究</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddBank(false)}>取消</Button>
          <Button onClick={handleAddBank} variant="contained">创建</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Word Dialog */}
      <Dialog open={showAddWord} onClose={() => setShowAddWord(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加词条</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="术语"
            value={newWordTerm}
            onChange={(e) => setNewWordTerm(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="定义"
            value={newWordDefinition}
            onChange={(e) => setNewWordDefinition(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="领域"
            placeholder="例如：市场营销、心理学"
            value={newWordDomain}
            onChange={(e) => setNewWordDomain(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="难度"
            value={newWordDifficulty}
            onChange={(e) => setNewWordDifficulty(e.target.value as DifficultyLevel)}
            SelectProps={{ native: true }}
          >
            <option value={DifficultyLevel.BEGINNER}>入门</option>
            <option value={DifficultyLevel.INTERMEDIATE}>进阶</option>
            <option value={DifficultyLevel.ADVANCED}>高级</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddWord(false)}>取消</Button>
          <Button onClick={handleAddWord} variant="contained">添加</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WordBankEditor
