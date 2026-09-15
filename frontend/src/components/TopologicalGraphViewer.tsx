import React from 'react'
import { Network, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'

interface TopologicalGraphViewerProps {
  graphData?: {
    nodes: Array<{
      id: string
      node_type: string
      label?: string
      room_type?: string
      area_m2?: number
      centroid_x: number
      centroid_y: number
      floor_level: number
      confidence: string
    }>
    edges: Array<{
      source_id: string
      target_id: string
      edge_type: string
      width_m?: number
    }>
    stats?: Record<string, any>
  }
}

export const TopologicalGraphViewer: React.FC<TopologicalGraphViewerProps> = ({
  graphData,
}) => {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400 max-w-4xl mx-auto my-8">
        <Network className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-200">No Topological Graph Available</h4>
        <p className="text-xs text-slate-400 mt-1">
          Upload and analyze a floor plan drawing to generate room connectivity topology.
        </p>
      </div>
    )
  }

  const nodes = graphData.nodes
  const edges = graphData.edges
  const stats = graphData.stats || {}

  // Compute node bounding box for SVG viewbox
  const xs = nodes.map((n) => n.centroid_x)
  const ys = nodes.map((n) => n.centroid_y)
  const minX = Math.min(...xs) - 2
  const maxX = Math.max(...xs) + 2
  const minY = Math.min(...ys) - 2
  const maxY = Math.max(...ys) + 2
  const width = Math.max(maxX - minX, 10)
  const height = Math.max(maxY - minY, 10)

  // Quick lookup
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <div className="w-full max-w-6xl mx-auto p-6 flex flex-col gap-5">
      {/* Header & Graph Statistics */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              Egress & Connectivity Topology Graph
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mathematical graph representation derived from Canonical Geometry Model (CGM)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Nodes: </span>
            <strong className="text-white font-mono">{nodes.length}</strong>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Edges: </span>
            <strong className="text-white font-mono">{edges.length}</strong>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Components: </span>
            <strong className="text-cyan-400 font-mono">
              {stats.connected_components ?? 1}
            </strong>
          </div>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div className="relative w-full h-[540px] rounded-2xl overflow-hidden glass-panel border border-slate-800 bg-slate-950/60 p-4">
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full">
          {/* Edges */}
          {edges.map((edge, idx) => {
            const src = nodeMap.get(edge.source_id)
            const tgt = nodeMap.get(edge.target_id)
            if (!src || !tgt) return null

            return (
              <g key={idx}>
                <line
                  x1={src.centroid_x}
                  y1={src.centroid_y}
                  x2={tgt.centroid_x}
                  y2={tgt.centroid_y}
                  stroke="rgba(99, 102, 241, 0.4)"
                  strokeWidth="0.08"
                  strokeDasharray={edge.edge_type === 'door' ? 'none' : '0.15 0.1'}
                />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isCorridor = node.node_type === 'corridor'
            const isExit = node.node_type === 'exit'
            const isStair = node.node_type === 'stair'
            const color = isExit
              ? '#10b981'
              : isStair
              ? '#f43f5e'
              : isCorridor
              ? '#a855f7'
              : '#38bdf8'

            return (
              <g key={node.id} className="cursor-pointer group">
                <circle
                  cx={node.centroid_x}
                  cy={node.centroid_y}
                  r="0.5"
                  fill={color}
                  fillOpacity="0.8"
                  stroke="#ffffff"
                  strokeWidth="0.06"
                />
                <text
                  x={node.centroid_x}
                  y={node.centroid_y + 0.9}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="0.32"
                  fontWeight="600"
                  fontFamily="Outfit, sans-serif"
                >
                  {node.label || node.room_type || node.node_type}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 text-[11px] flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Habitable Space</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Corridor / Passage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Exit Point</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Stairwell</span>
          </div>
        </div>
      </div>
    </div>
  )
}
