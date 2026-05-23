import * as d3 from 'd3'
import { useRef, useEffect, useCallback } from 'react'
import { GraphNode, GraphEdge, RelationType } from '../../types/graph.types'

interface DomainGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  /** 图谱高度，默认 600 */
  height?: number
  /** 是否暗色模式 */
  darkMode?: boolean
}

/** D3 力仿真会给节点动态添加 x, y, vx, vy */
interface SimNode extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

const RELATION_COLORS: Record<RelationType, string> = {
  '包含': '#4caf50',
  '对比': '#f44336',
  '因果': '#9c27b0',
  '应用': '#ff9800',
  '进阶': '#2196f3',
  '基础': '#8bc34a',
}

export default function DomainGraph({ nodes, edges, onNodeClick, height = 600, darkMode = false }: DomainGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null)

  const initGraph = useCallback(() => {
    const svg = d3.select(svgRef.current)
    if (!svgRef.current || nodes.length === 0) return

    const width = svgRef.current.clientWidth || 800
    const actualHeight = height

    svg.selectAll('*').remove()

    // 缩放
    const g = svg.append('g').attr('class', 'graph-main')
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })
    ;(svg as any).call(zoom)

    // 力仿真
    const simNodes = nodes as any[]
    const simEdges = edges as any[]
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges)
        .id((d: any) => d.term)
        .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, actualHeight / 2))
      .force('collision', d3.forceCollide(40))

    simulationRef.current = sim

    // 边
    const link = g.append('g')
      .attr('class', 'edges')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', (d) => RELATION_COLORS[d.relationType] || '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)

    // 边标签
    const linkLabel = g.append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .attr('font-size', 10)
      .attr('fill', (d) => RELATION_COLORS[d.relationType] || '#999')
      .attr('text-anchor', 'middle')
      .text((d) => d.label || d.relationType)

    // 节点组
    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    nodeGroup.append('circle')
      .attr('r', 20)
      .attr('fill', '#1976d2')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', 11)
      .attr('font-weight', '600')
      .text((d) => d.term.length > 6 ? d.term.slice(0, 6) + '…' : d.term)

    // 节点点击
    if (onNodeClick) {
      nodeGroup.on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick(d as any)
      })
    }

    // tick
    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      nodeGroup
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // 初始位置
    nodes.forEach((n, i) => {
      ;(n as any).x = width / 2 + Math.cos(i) * 100
      ;(n as any).y = actualHeight / 2 + Math.sin(i) * 100
    })
  }, [nodes, edges, onNodeClick, height])

  useEffect(() => {
    initGraph()
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [initGraph])

  const bgColor = darkMode ? '#1e1e2e' : '#fafafa'
  const borderColor = darkMode ? '#333' : '#e0e0e0'
  const nodeTextColor = darkMode ? '#e0e0e0' : '#fff'

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          background: bgColor,
          borderRadius: 8,
          border: `1px solid ${borderColor}`,
        }}
      />
    </div>
  )
}
