import { useState, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Psychology as ExtractIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Link as LinkIcon,
  Article as WebIcon,
} from '@mui/icons-material'
import { useMaterialStore } from '../../store/materialStore'
import { MaterialCategory, DifficultyLevel } from '../../types/material.types'
import { extractKeywords } from '../../services/keywordExtractionService'

interface UploadMaterialProps {
  onClose: () => void
  materialId?: string
}

type ExtractedKW = {
  term: string
  isNew: boolean
  crossCategory?: MaterialCategory
  crossCategoryLabel?: string
}

function UploadMaterial({ onClose, materialId }: UploadMaterialProps): JSX.Element {
  const { addMaterial, updateMaterial, getMaterialById } = useMaterialStore()
  const existing = materialId ? getMaterialById(materialId) : undefined
  const isEdit = !!existing

  const [title, setTitle] = useState(existing?.title ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [category, setCategory] = useState<MaterialCategory>(existing?.category ?? MaterialCategory.FREE_RESEARCH)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(existing?.difficulty ?? DifficultyLevel.BEGINNER)
  const [keywords, setKeywords] = useState<string[]>(existing?.keywords ?? [])
  const [keywordInput, setKeywordInput] = useState('')
  const [source, setSource] = useState(existing?.source ?? '')
  const [error, setError] = useState<string | null>(null)

  // Extracted keywords
  const [extracted, setExtracted] = useState<ExtractedKW[]>([])
  const [showExtracted, setShowExtracted] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  // Wordbank dialog
  const [pendingWordbank, setPendingWordbank] = useState<string[]>([])
  const [showWbDialog, setShowWbDialog] = useState(false)
  const [wbDefinitions, setWbDefinitions] = useState<Record<string, string>>({})
  const [wbDifficulties, setWbDifficulties] = useState<Record<string, DifficultyLevel>>({})
  const [crossHint, setCrossHint] = useState<string | null>(null)

  // PDF import
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL import
  const [urlInput, setUrlInput] = useState('')
  const [isImportingUrl, setIsImportingUrl] = useState(false)

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setImportError('请选择 PDF 文件')
      return
    }
    setIsImportingPdf(true)
    setImportError(null)
    try {
      // 动态加载 pdfjs 以减小首屏体积
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n\n'
      }
      
      setContent(fullText.trim())
      if (!title && file.name) {
        setTitle(file.name.replace(/\.pdf$/i, ''))
      }
    } catch (err) {
      setImportError('PDF 解析失败：' + (err instanceof Error ? err.message : '文件格式不支持'))
    } finally {
      setIsImportingPdf(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUrlImport = async () => {
    const url = urlInput.trim()
    if (!url) return
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImportError('请输入有效的网页链接（以 http:// 或 https:// 开头）')
      return
    }
    setIsImportingUrl(true)
    setImportError(null)
    try {
      // 使用 Jina Reader API（免费，无需 API Key）
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: { 'X-Return-Format': 'text' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      if (text.length < 50) throw new Error('无法提取到有效内容')
      
      setContent(text.trim())
      if (!title) {
        // 从 URL 中提取有意义的标题
        const urlObj = new URL(url)
        const pathSegments = urlObj.pathname.split('/').filter(Boolean)
        setTitle(decodeURIComponent(pathSegments[pathSegments.length - 1] || urlObj.hostname))
      }
      setUrlInput('')
    } catch (err) {
      setImportError('网页抓取失败：' + (err instanceof Error ? err.message : '网络错误'))
    } finally {
      setIsImportingUrl(false)
    }
  }

  // Parse batch input
  const parseBatchInput = (input: string): string[] => {
    const normalized = input
      .replace(/[，；、\n\r]+/g, ',')
      .replace(/\s+/g, ',')
    return normalized
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handleBatchKeywordInput = (): void => {
    const parsed = parseBatchInput(keywordInput)
    if (parsed.length === 0) return
    const existingSet = new Set(keywords)
    const duplicates: string[] = []
    const newOnes: string[] = []
    parsed.forEach((kw) => {
      if (existingSet.has(kw)) {
        duplicates.push(kw)
      } else {
        newOnes.push(kw)
      }
    })
    if (duplicates.length > 0) {
      setError(`以下关键词已存在，已自动跳过：${duplicates.join('、')}`)
    }
    if (newOnes.length > 0) {
      setKeywords((prev) => [...prev, ...newOnes])
      setError(null)
      // Check cross-category duplicates
      const state = useMaterialStore.getState()
      const crossLabels: string[] = []
      const labelMap: Record<MaterialCategory, string> = {
        [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
        [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
        [MaterialCategory.FREE_RESEARCH]: '自由研究',
      }
      newOnes.forEach((kw) => {
        for (const bank of state.wordBanks) {
          if (bank.category !== category && bank.words.some((w) => w.term === kw)) {
            crossLabels.push(`「${kw}」已存在于【${labelMap[bank.category]}】词库`)
            break
          }
        }
      })
      if (crossLabels.length > 0) {
        setCrossHint(crossLabels.join('；'))
      } else {
        setCrossHint(null)
      }
    }
    setKeywordInput('')
  }

  const handleAddKeyword = (): void => {
    const kw = keywordInput.trim()
    if (!kw) return
    const parsed = parseBatchInput(kw)
    if (parsed.length > 1) {
      handleBatchKeywordInput()
      return
    }
    if (keywords.includes(kw)) {
      setError(`"${kw}" 已存在`)
      return
    }
    setKeywords((prev) => [...prev, kw])
    setKeywordInput('')
    setError(null)
    // Check cross-category duplicate
    const state = useMaterialStore.getState()
    const labelMap: Record<MaterialCategory, string> = {
      [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
      [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
      [MaterialCategory.FREE_RESEARCH]: '自由研究',
    }
    for (const bank of state.wordBanks) {
      if (bank.category !== category && bank.words.some((w) => w.term === kw)) {
        setCrossHint(`「${kw}」已存在于【${labelMap[bank.category]}】词库，已纳入当前领域的学习复习`)
        break
      }
    }
  }

  const handleRemoveKeyword = (kw: string): void => {
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  // Auto extract
  const handleAutoExtract = async (): Promise<void> => {
    if (!content.trim()) {
      setExtractError('请先填写资料内容')
      return
    }
    setIsExtracting(true)
    setExtractError(null)
    try {
      const result = await extractKeywords(content, 8)
      const existingSet = new Set(keywords)
      const state = useMaterialStore.getState()
      const allWordBanks = state.wordBanks

      const mapped: ExtractedKW[] = result.map((term: string) => {
        const isNew = !existingSet.has(term)
        // Check if term exists in other category wordbanks
        let crossCategory: MaterialCategory | undefined
        let crossCategoryLabel: string | undefined
        for (const bank of allWordBanks) {
          if (bank.category !== category && bank.words.some((w) => w.term === term)) {
            crossCategory = bank.category
            const labelMap: Record<MaterialCategory, string> = {
              [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
              [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
              [MaterialCategory.FREE_RESEARCH]: '自由研究',
            }
            crossCategoryLabel = labelMap[bank.category]
            break
          }
        }
        return { term, isNew, crossCategory, crossCategoryLabel }
      })
      setExtracted(mapped)
      setShowExtracted(true)
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : '提取失败')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleAcceptExtracted = (): void => {
    const newTerms = extracted.filter((e) => e.isNew).map((e) => e.term)
    setKeywords((prev) => [...prev, ...newTerms])
    setShowExtracted(false)
    // Set cross-category hint
    const crossItems = extracted.filter((e) => e.crossCategory)
    if (crossItems.length > 0) {
      setCrossHint(
        crossItems.map((e) => `「${e.term}」已存在于【${e.crossCategoryLabel}】词库，已纳入当前领域的学习复习`).join('；')
      )
    }
    setExtracted([])
    // Prompt wordbank
    if (newTerms.length > 0) {
      setPendingWordbank(newTerms)
      setShowWbDialog(true)
    }
  }

  const handleRemoveExtracted = (term: string): void => {
    setExtracted((prev) => prev.filter((e) => e.term !== term))
  }

  // Wordbank dialog handlers
  const handleConfirmWordbank = (): void => {
    const termsToAdd = pendingWordbank.filter((t) => wbDefinitions[t] || wbDifficulties[t])
    if (termsToAdd.length === 0) {
      setShowWbDialog(false)
      setPendingWordbank([])
      return
    }
    // Build WordEntry objects and add to category bank
    const entries = termsToAdd.map((term) => ({
      term,
      definition: wbDefinitions[term] || '',
      difficulty: wbDifficulties[term] || DifficultyLevel.BEGINNER,
      domain: title || category,
    }))
    useMaterialStore.getState().addWordsToCategoryBank(category, entries)
    setShowWbDialog(false)
    setPendingWordbank([])
  }

  // Submit
  const handleSubmit = (): void => {
    if (!title.trim()) {
      setError('请输入资料标题')
      return
    }
    if (!content.trim()) {
      setError('请输入资料内容')
      return
    }
    if (isEdit && materialId) {
      updateMaterial(materialId, {
        title: title.trim(),
        content: content.trim(),
        category,
        difficulty,
        keywords,
        source: source.trim(),
      })
    } else {
      addMaterial({
        title: title.trim(),
        content: content.trim(),
        category,
        difficulty,
        keywords,
        source: source.trim(),
      })
    }
    onClose()
  }

  const categoryLabel: Record<MaterialCategory, string> = {
    [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
    [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
    [MaterialCategory.FREE_RESEARCH]: '自由研究',
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '编辑资料' : '上传资料'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {extractError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setExtractError(null)}>
            {extractError}
          </Alert>
        )}
        {importError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
            {importError}
          </Alert>
        )}

        <TextField
          fullWidth
          label="资料标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
          placeholder="例如：市场营销基础知识"
        />

        {/* 导入方式工具栏 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            导入方式：
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isImportingPdf}
          >
            {isImportingPdf ? '解析中...' : 'PDF 文件'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handlePdfImport}
          />
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexGrow: 1, maxWidth: 400 }}>
            <TextField
              size="small"
              placeholder="粘贴网页链接..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlImport() } }}
              sx={{ flexGrow: 1 }}
              disabled={isImportingUrl}
            />
            <Tooltip title="从网页抓取正文内容（免费服务，无需配置）">
              <Button
                size="small"
                variant="outlined"
                onClick={handleUrlImport}
                disabled={isImportingUrl || !urlInput.trim()}
                startIcon={isImportingUrl ? <CircularProgress size={14} /> : <WebIcon />}
              >
                {isImportingUrl ? '抓取中' : '导入'}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={6}
          label="资料内容（逐字稿）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="粘贴输入、或使用上方工具栏导入 PDF / 网页内容..."
        />

        {/* Auto-extract button */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={isExtracting ? <CircularProgress size={16} /> : <ExtractIcon />}
            onClick={handleAutoExtract}
            disabled={isExtracting || !content.trim()}
          >
            {isExtracting ? '提取中...' : '自动提取关键词'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            从逐字稿中 AI 提取关键词（最多8个）
          </Typography>
        </Box>

        {/* Extracted keywords preview */}
        {showExtracted && (
          <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              AI 提取结果（
              <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>绿色=新增</Box>
              {' / '}
              <Box component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>橙色=本资料已存在</Box>
              {' / '}
              <Box component="span" sx={{ color: 'secondary.main', fontWeight: 600 }}>紫色=其他领域已存在</Box>
              ）
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {extracted.map((item) => {
                let chipSx = {}
                if (!item.isNew && !item.crossCategory) {
                  chipSx = { bgcolor: '#fff3e0', color: '#e65100', borderColor: '#ffcc80' }
                } else if (item.crossCategory) {
                  chipSx = { bgcolor: '#f3e5f5', color: '#7b1fa2', borderColor: '#ce93d8' }
                } else {
                  chipSx = { bgcolor: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7' }
                }
                return (
                  <Chip
                    key={item.term}
                    label={item.term}
                    size="small"
                    sx={chipSx}
                    variant="outlined"
                    onDelete={item.isNew || item.crossCategory ? () => handleRemoveExtracted(item.term) : undefined}
                    deleteIcon={<CloseIcon />}
                  />
                )
              })}
            </Box>
            {/* Cross-category hints */}
            {extracted.some((e) => e.crossCategory) && (
              <Alert severity="info" sx={{ mb: 1, fontSize: '0.8rem' }}>
                {extracted.filter((e) => e.crossCategory).map((e) => (
                  <span key={e.term}>
                    「{e.term}」已存在于【{e.crossCategoryLabel}】词库，
                    确认添加后将同时纳入当前领域的学习复习。
                  </span>
                ))}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleAcceptExtracted}>
                确认添加
              </Button>
              <Button size="small" onClick={() => { setShowExtracted(false); setExtracted([]) }}>
                取消
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>分类</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              label="分类"
            >
              <MenuItem value={MaterialCategory.SCHOOL_SUBJECT}>学科课程</MenuItem>
              <MenuItem value={MaterialCategory.INDUSTRY_TRACK}>行业赛道</MenuItem>
              <MenuItem value={MaterialCategory.FREE_RESEARCH}>自由研究</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>难度</InputLabel>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              label="难度"
            >
              <MenuItem value={DifficultyLevel.BEGINNER}>入门</MenuItem>
              <MenuItem value={DifficultyLevel.INTERMEDIATE}>进阶</MenuItem>
              <MenuItem value={DifficultyLevel.ADVANCED}>高级</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          label="来源（可选）"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="例如：书籍名称、课程名称"
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          关键词
          {keywords.length > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              （同一分类下的关键词在学习时共享）
            </Typography>
          )}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          支持批量输入：用逗号、分号、空格或换行分隔多个关键词
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            placeholder="输入关键词（支持批量，逗号/分号/空格分隔）"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleBatchKeywordInput()
              }
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button variant="outlined" size="small" onClick={handleBatchKeywordInput}>
            添加
          </Button>
        </Box>

        {keywords.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {keywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                onDelete={() => handleRemoveKeyword(kw)}
                size="small"
              />
            ))}
          </Box>
        )}
        {crossHint && (
          <Alert severity="info" sx={{ mb: 1 }} onClose={() => setCrossHint(null)}>
            {crossHint}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<UploadIcon />}>
          {isEdit ? '保存' : '上传'}
        </Button>
      </DialogActions>

      {/* Wordbank confirm dialog */}
      <Dialog open={showWbDialog} onClose={() => { setShowWbDialog(false); setPendingWordbank([]) }} maxWidth="xs" fullWidth>
        <DialogTitle>加入词库？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            以下关键词可以加入「{categoryLabel[category]}」词库，用于后续学习和复习：
          </Typography>
          {pendingWordbank.map((term) => (
            <Box key={term} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={term} size="small" />
              <TextField
                size="small"
                placeholder="定义（可选）"
                value={wbDefinitions[term] || ''}
                onChange={(e) => setWbDefinitions((prev) => ({ ...prev, [term]: e.target.value }))}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={wbDifficulties[term] || DifficultyLevel.BEGINNER}
                  onChange={(e) => setWbDifficulties((prev) => ({ ...prev, [term]: e.target.value as DifficultyLevel }))}
                >
                  <MenuItem value={DifficultyLevel.BEGINNER}>入门</MenuItem>
                  <MenuItem value={DifficultyLevel.INTERMEDIATE}>进阶</MenuItem>
                  <MenuItem value={DifficultyLevel.ADVANCED}>高级</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowWbDialog(false); setPendingWordbank([]) }}>跳过</Button>
          <Button onClick={handleConfirmWordbank} variant="contained">
            加入词库
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default UploadMaterial
