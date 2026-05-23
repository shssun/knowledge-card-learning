import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useTokenStore, ChartDataPoint } from '../store/tokenStore'

interface TokenUsageChartProps {
  height?: number
}

export default function TokenUsageChart({ height = 300 }: TokenUsageChartProps) {
  const chartData = useTokenStore((s) => s.getChartData())
  const totalTokens = useTokenStore((s) => s.getTotalTokens())
  const clearUsage = useTokenStore((s) => s.clearUsage)
  const dailyUsage = useTokenStore((s) => s.dailyUsage)

  const totalDays = Object.keys(dailyUsage).length

  const formatYAxis = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return `${value}`
  }

  const formatTooltip = (value: number): [string, string] => {
    return [`${value.toLocaleString()} tokens`, '']
  }

  const latestDate = chartData.length > 0 ? chartData[chartData.length - 1].date : '-'
  const latestTokens =
    chartData.length > 0 ? chartData[chartData.length - 1].totalTokens : 0

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
        <p>暂无 Token 使用数据</p>
        <p style={{ fontSize: 12 }}>
          使用 AI 功能后，这里会自动统计每日 Token 消耗量
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 统计摘要 */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <StatBox label="累计消耗" value={totalTokens.toLocaleString()} unit="tokens" color="#1976d2" />
        <StatBox label="统计天数" value={totalDays} unit="天" color="#2e7d32" />
        <StatBox
          label="日均消耗"
          value={totalDays > 0 ? Math.round(totalTokens / totalDays).toLocaleString() : '0'}
          unit="tokens/天"
          color="#ed6c02"
        />
        <StatBox label="最近一天" value={latestTokens.toLocaleString()} unit="tokens" color="#9c27b0" />
      </div>

      {/* 面积图 + 折线 */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                totalTokens: '总消耗',
                promptTokens: '输入 Token',
                completionTokens: '输出 Token',
              }
              return [`${value.toLocaleString()}`, labelMap[name] || name]
            }}
            labelFormatter={(label: string) => `日期：${label}`}
          />
          <Legend
            formatter={(value: string) => {
              const labelMap: Record<string, string> = {
                totalTokens: '总消耗',
                promptTokens: '输入 Token',
                completionTokens: '输出 Token',
              }
              return labelMap[value] || value
            }}
          />
          <Area
            type="monotone"
            dataKey="totalTokens"
            stroke="#1976d2"
            fillOpacity={1}
            fill="url(#colorTotal)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="promptTokens"
            stroke="#2e7d32"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completionTokens"
            stroke="#ed6c02"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* 清除按钮 */}
      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <button
          onClick={clearUsage}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 12,
            color: '#999',
          }}
        >
          清除统计数据
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div
      style={{
        background: '#f5f5f5',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 140,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#999' }}>{unit}</div>
    </div>
  )
}
