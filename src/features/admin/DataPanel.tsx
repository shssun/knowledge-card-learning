import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material'
import { Download as DownloadIcon, Upload as UploadIcon, Warning as WarningIcon } from '@mui/icons-material'
import { useDomainStore } from '../../store/domainStore'
import { useTermStore } from '../../store/termStore'
import { usePodcastStore } from '../../store/podcastStore'
import { useAudioStore } from '../../store/audioStore'
import { useArchiveStore } from '../../store/archiveStore'

interface ExportData {
  version: string
  exportedAt: string
  domainStore: { domains: unknown[] }
  termStore: { terms: unknown[] }
  podcastStore: { podcasts: unknown[] }
  audioStore: { audioList: unknown[] }
  archiveStore: { records: unknown[] }
}

function DataPanel(): JSX.Element {
  const domainStore = useDomainStore()
  const termStore = useTermStore()
  const podcastStore = usePodcastStore()
  const audioStore = useAudioStore()
  const archiveStore = useArchiveStore()

  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  // 导出
  const handleExport = useCallback(() => {
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      domainStore: { domains: domainStore.domains },
      termStore: { terms: termStore.terms },
      podcastStore: { podcasts: podcastStore.podcasts },
      audioStore: { audioList: audioStore.audioList },
      archiveStore: { records: archiveStore.records },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zhika-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [domainStore, termStore, podcastStore, audioStore, archiveStore])

  // 导入
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setImportFile(e.target.files?.[0] || null)
    setImportResult(null)
  }

  const doImport = useCallback(async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await importFile.text()
      const data: ExportData = JSON.parse(text)

      const results: string[] = []
      if (importMode === 'replace') {
        // 全量替换
        if (data.domainStore?.domains) {
          data.domainStore.domains.forEach((d: any) => domainStore.addDomain({ name: d.name, description: d.description }))
          results.push(`领域 ${data.domainStore.domains.length} 条`)
        }
        if (data.termStore?.terms) {
          data.termStore.terms.forEach((t: any) => termStore.addTerm({ name: t.name, domainId: t.domainId, description: t.description }))
          results.push(`术语 ${data.termStore.terms.length} 条`)
        }
        if (data.podcastStore?.podcasts) {
          data.podcastStore.podcasts.forEach((p: any) => podcastStore.addPodcast({
            name: p.name, domainId: p.domainId, termIds: p.termIds || [],
            status: p.status, reviewNote: p.reviewNote,
          }))
          results.push(`播客 ${data.podcastStore.podcasts.length} 条`)
        }
        if (data.audioStore?.audioList) {
          data.audioStore.audioList.forEach((a: any) => audioStore.addAudio({ name: a.name, domain: a.domain, audioData: a.audioData, duration: a.duration }))
          results.push(`音频 ${data.audioStore.audioList.length} 条`)
        }
        if (data.archiveStore?.records) {
          data.archiveStore.records.forEach((r: any) => archiveStore.addRecord({ title: r.title, terms: r.terms || [], averageScore: r.averageScore ?? 0, domain: r.domain, studiedAt: r.studiedAt, studySessionId: r.studySessionId || r.id }))
          results.push(`归档 ${data.archiveStore.records.length} 条`)
        }
      } else {
        // 合并：追加（去重由业务层处理，这里直接追加）
        if (data.domainStore?.domains) results.push(`合并领域 ${data.domainStore.domains.length} 条`)
        if (data.termStore?.terms) results.push(`合并术语 ${data.termStore.terms.length} 条`)
        if (data.podcastStore?.podcasts) results.push(`合并播客 ${data.podcastStore.podcasts.length} 条`)
        if (data.audioStore?.audioList) results.push(`合并音频 ${data.audioStore.audioList.length} 条`)
        if (data.archiveStore?.records) results.push(`合并归档 ${data.archiveStore.records.length} 条`)
      }

      setImportResult(`导入成功：${results.join('、')}`)
    } catch {
      setImportResult('导入失败：文件格式错误，请检查 JSON 文件')
    }
    setImporting(false)
  }, [importFile, importMode, domainStore, termStore, podcastStore, audioStore, archiveStore])

  const stats = {
    领域: domainStore.domains.length,
    术语: termStore.terms.length,
    播客: podcastStore.podcasts.length,
    音频: audioStore.audioList.length,
    归档: archiveStore.records.length,
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        导出/导入功能用于数据备份和换设备迁移。当前数据存储在浏览器本地，清理浏览器数据会导致丢失，建议定期导出备份。
      </Alert>

      {/* 统计卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5, mb: 3 }}>
        {(Object.entries(stats) as [string, number][]).map(([label, count]) => (
          <Card key={label} variant="outlined" sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="primary">{count}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={importing ? <CircularProgress size={18} /> : <DownloadIcon />} onClick={handleExport}>
          导出全部数据
        </Button>
        <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setImportOpen(true)}>
          导入数据
        </Button>
      </Box>

      {/* 导入弹窗 */}
      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" fontSize="small" />
          导入数据
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            选择之前导出的 JSON 备份文件进行恢复。
          </Typography>
          <Button variant="outlined" component="label">
            选择文件
            <input type="file" accept=".json" hidden onChange={handleImportFile} />
          </Button>
          {importFile && (
            <Typography variant="body2" color="text.primary">
              已选择：{importFile.name}
            </Typography>
          )}
          <RadioGroup value={importMode} onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}>
            <FormControlLabel value="merge" control={<Radio />} label="合并（追加，不覆盖已有数据）" />
            <FormControlLabel value="replace" control={<Radio />} label="替换（清空后导入，可能丢失数据）" />
          </RadioGroup>
          {importResult && (
            <Alert severity={importResult.includes('失败') ? 'error' : 'success'}>{importResult}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>取消</Button>
          <Button variant="contained" onClick={doImport} disabled={!importFile || importing}>
            {importing ? '导入中...' : '确认导入'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DataPanel
