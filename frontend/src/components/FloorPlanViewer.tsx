import React, { useState, useRef, useMemo } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { CanonicalFloorPlan, CGMRoom, CGMOpening } from '../types/geometry'
import type { Violation } from '../types/compliance'

interface FloorPlanViewerProps {
  floorPlan: CanonicalFloorPlan
  violations: Violation[]
  selectedViolation?: Violation | null
  selectedRoom?: CGMRoom | null
  onSelectViolation?: (violation: Violation | null) => void
  onSelectRoom?: (room: CGMRoom | null) => void
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  floorPlan,
  violations,
  selectedViolation,
  selectedRoom,
  onSelectViolation,
  onSelectRoom,
}) => {
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [activeFloorIndex, setActiveFloorIndex] = useState<number>(0)

  // Layer toggles
  const [showWalls, setShowWalls] = useState<boolean>(true)
  const [showRooms, setShowRooms] = useState<boolean>(true)
  const [showOpenings, setShowOpenings] = useState<boolean>(true)
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [showViolations, setShowViolations] = useState<boolean>(true)

  const currentFloor = floorPlan.floors[activeFloorIndex] || floorPlan.floors[0]
  const bb = floorPlan.bounding_box

  // Calculate viewBox with margin
  const margin = Math.max((bb.xmax - bb.xmin) * 0.1, 1.0)
  const viewX = bb.xmin - margin
  const viewY = bb.ymin - margin
  const viewWidth = Math.max(bb.xmax - bb.xmin + margin * 2, 5.0)
  const viewHeight = Math.max(bb.ymax - bb.ymin + margin * 2, 5.0)

  // Room type color mapper
  const getRoomColor = (roomType: string) => {
    switch (roomType) {
      case 'bedroom':
        return { fill: 'rgba(99, 102, 241, 0.12)', stroke: 'rgba(99, 102, 241, 0.4)' }
      case 'living_room':
        return { fill: 'rgba(6, 182, 212, 0.12)', stroke: 'rgba(6, 182, 212, 0.4)' }
      case 'kitchen':
        return { fill: 'rgba(245, 158, 11, 0.12)', stroke: 'rgba(245, 158, 11, 0.4)' }
      case 'bathroom':
      case 'toilet':
        return { fill: 'rgba(16, 185, 129, 0.12)', stroke: 'rgba(16, 185, 129, 0.4)' }
      case 'corridor':
      case 'lobby':
        return { fill: 'rgba(168, 85, 247, 0.12)', stroke: 'rgba(168, 85, 247, 0.4)' }
      case 'stairwell':
        return { fill: 'rgba(244, 63, 94, 0.12)', stroke: 'rgba(244, 63, 94, 0.4)' }
      default:
        return { fill: 'rgba(148, 163, 184, 0.08)', stroke: 'rgba(148, 163, 184, 0.25)' }
    }
  }

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 4.0))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden glass-panel border border-slate-800 flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 text-xs">
        {/* Floor Selection & Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Floor:</span>
            <select
              value={activeFloorIndex}
              onChange={(e) => setActiveFloorIndex(Number(e.target.value))}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              {floorPlan.floors.map((fl, idx) => (
                <option key={fl.level} value={idx} className="bg-slate-900 text-white">
                  Level {fl.level} ({fl.rooms.length} rooms)
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-400">
            Rooms: <strong className="text-slate-200">{currentFloor.rooms.length}</strong> | Walls:{' '}
            <strong className="text-slate-200">{currentFloor.walls.length}</strong> | Openings:{' '}
            <strong className="text-slate-200">{currentFloor.openings.length}</strong>
          </span>
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setShowWalls(!showWalls)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showWalls ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Walls
          </button>
          <button
            onClick={() => setShowRooms(!showRooms)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showRooms ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => setShowOpenings(!showOpenings)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showOpenings ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Openings
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showLabels ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Labels
          </button>
          <button
            onClick={() => setShowViolations(!showViolations)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showViolations
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Violations ({violations.length})
          </button>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-mono"
            title="Reset View"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="relative flex-1 svg-canvas overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="0.02" />
            </pattern>
          </defs>
          <rect x={viewX} y={viewY} width={viewWidth} height={viewHeight} fill="url(#grid)" />

          {/* Rooms Layer */}
          {showRooms &&
            currentFloor.rooms.map((room) => {
              const pointsStr = room.boundary.vertices.map((v) => `${v.x},${v.y}`).join(' ')
              const isSelected = selectedRoom?.id === room.id
              const colors = getRoomColor(room.room_type)

              return (
                <g key={room.id} onClick={() => onSelectRoom && onSelectRoom(room)}>
                  <polygon
                    points={pointsStr}
                    fill={colors.fill}
                    stroke={isSelected ? '#38bdf8' : colors.stroke}
                    strokeWidth={isSelected ? '0.08' : '0.04'}
                    className="cursor-pointer transition-all hover:fill-opacity-30"
                  />
                  {showLabels && (
                    <text
                      x={room.boundary.vertices.reduce((acc, v) => acc + v.x, 0) / room.boundary.vertices.length}
                      y={room.boundary.vertices.reduce((acc, v) => acc + v.y, 0) / room.boundary.vertices.length}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#e2e8f0"
                      fontSize="0.28"
                      fontFamily="Outfit, sans-serif"
                      fontWeight="600"
                      pointerEvents="none"
                    >
                      {room.label || room.room_type.replace('_', ' ')}
                      {room.area_m2 && (
                        <tspan x={room.boundary.vertices.reduce((acc, v) => acc + v.x, 0) / room.boundary.vertices.length} dy="0.32" fontSize="0.20" fill="#94a3b8">
                          {room.area_m2.toFixed(1)} m²
                        </tspan>
                      )}
                    </text>
                  )}
                </g>
              )
            })}

          {/* Walls Layer */}
          {showWalls &&
            currentFloor.walls.map((wall) =>
              wall.segments.map((seg, sIdx) => (
                <line
                  key={`${wall.id}-${sIdx}`}
                  x1={seg.start.x}
                  y1={seg.start.y}
                  x2={seg.end.x}
                  y2={seg.end.y}
                  stroke="#cbd5e1"
                  strokeWidth={wall.thickness_m || 0.15}
                  strokeLinecap="round"
                />
              ))
            )}

          {/* Openings Layer (Doors, Windows) */}
          {showOpenings &&
            currentFloor.openings.map((op) => {
              const isDoor = op.opening_type.includes('door')
              const opWidth = op.width_m ?? 0.85
              return (
                <g key={op.id}>
                  <circle
                    cx={op.position.x}
                    cy={op.position.y}
                    r={opWidth / 2}
                    fill={isDoor ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                    stroke={isDoor ? '#38bdf8' : '#34d399'}
                    strokeWidth="0.04"
                    strokeDasharray={isDoor ? '0.1 0.05' : 'none'}
                  />
                  <line
                    x1={op.position.x - opWidth / 2}
                    y1={op.position.y}
                    x2={op.position.x + opWidth / 2}
                    y2={op.position.y}
                    stroke={isDoor ? '#38bdf8' : '#34d399'}
                    strokeWidth="0.06"
                  />
                </g>
              )
            })}

          {/* Stairs Layer */}
          {currentFloor.stairs?.map((stair) => {
            const hasBoundary = !!(stair.boundary && stair.boundary.vertices.length >= 3)
            const pointsStr = hasBoundary
              ? stair.boundary!.vertices.map((v) => `${v.x},${v.y}`).join(' ')
              : ''
            const cx = hasBoundary
              ? stair.boundary!.vertices.reduce((acc, v) => acc + v.x, 0) / stair.boundary!.vertices.length
              : stair.position?.x ?? 0
            const cy = hasBoundary
              ? stair.boundary!.vertices.reduce((acc, v) => acc + v.y, 0) / stair.boundary!.vertices.length
              : stair.position?.y ?? 0

            return (
              <g key={stair.id}>
                {hasBoundary ? (
                  <polygon
                    points={pointsStr}
                    fill="rgba(244, 63, 94, 0.15)"
                    stroke="#f43f5e"
                    strokeWidth="0.05"
                    strokeDasharray="0.1 0.05"
                  />
                ) : (
                  <rect
                    x={cx - 0.75}
                    y={cy - 0.75}
                    width="1.5"
                    height="1.5"
                    fill="rgba(244, 63, 94, 0.15)"
                    stroke="#f43f5e"
                    strokeWidth="0.05"
                  />
                )}
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f43f5e"
                  fontSize="0.22"
                  fontWeight="600"
                >
                  STAIR
                </text>
              </g>
            )
          })}

          {/* Exits Layer */}
          {currentFloor.exits?.map((exit_) => (
            <g key={exit_.id}>
              <circle
                cx={exit_.position.x}
                cy={exit_.position.y}
                r={0.45}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
                strokeWidth="0.06"
              />
              <text
                x={exit_.position.x}
                y={exit_.position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#10b981"
                fontSize="0.20"
                fontWeight="700"
              >
                EXIT
              </text>
            </g>
          ))}

          {/* Violation Overlays Layer */}
          {showViolations &&
            violations.map((viol) => {
              const isSelected = selectedViolation?.id === viol.id
              const isCrit = viol.severity === 'CRITICAL'
              const color = isCrit ? '#f43f5e' : viol.severity === 'MAJOR' ? '#f97316' : '#eab308'

              // 1. Polyline geometry (e.g. travel distance routes, dead ends)
              const polylineCoords =
                viol.geometry_hint === 'polyline' || viol.coordinates?.polyline
                  ? (viol.coordinates?.polyline || (Array.isArray(viol.coordinates) ? viol.coordinates : null))
                  : null

              if (polylineCoords && Array.isArray(polylineCoords) && polylineCoords.length >= 2) {
                const pointsStr = polylineCoords.map((pt: any) => `${pt[0]},${pt[1]}`).join(' ')
                const startPt = polylineCoords[0]
                const endPt = polylineCoords[polylineCoords.length - 1]

                return (
                  <g
                    key={viol.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectViolation && onSelectViolation(viol)
                    }}
                  >
                    <polyline
                      points={pointsStr}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? '0.14' : '0.08'}
                      strokeDasharray={isSelected ? '0.2 0.1' : '0.3 0.15'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={isSelected ? 1.0 : 0.85}
                    />
                    {/* Origin marker */}
                    <circle
                      cx={startPt[0]}
                      cy={startPt[1]}
                      r={isSelected ? 0.35 : 0.25}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="0.04"
                    />
                    {/* Destination Exit marker */}
                    <circle
                      cx={endPt[0]}
                      cy={endPt[1]}
                      r={isSelected ? 0.45 : 0.35}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="0.05"
                    />
                    {isSelected && (
                      <text
                        x={(startPt[0] + endPt[0]) / 2}
                        y={(startPt[1] + endPt[1]) / 2 - 0.25}
                        fill={color}
                        fontSize="0.26"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {viol.measured_value ? `${viol.measured_value.toFixed(1)}m` : 'Path'}
                      </text>
                    )}
                  </g>
                )
              }

              // 2. Polygon geometry (e.g. non-compliant rooms, corridors)
              if (viol.geometry_hint === 'polygon' && Array.isArray(viol.coordinates)) {
                const pointsStr = (viol.coordinates as number[][])
                  .map((pt) => `${pt[0]},${pt[1]}`)
                  .join(' ')
                return (
                  <polygon
                    key={viol.id}
                    points={pointsStr}
                    fill={color}
                    fillOpacity={isSelected ? 0.45 : 0.25}
                    stroke={color}
                    strokeWidth={isSelected ? '0.12' : '0.05'}
                    strokeDasharray={isSelected ? '0.15 0.08' : 'none'}
                    className="violation-highlight cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectViolation && onSelectViolation(viol)
                    }}
                  />
                )
              }

              // 3. Point marker (e.g. doors, openings, stairs)
              if (viol.label_position) {
                return (
                  <g
                    key={viol.id}
                    className="cursor-pointer violation-highlight"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectViolation && onSelectViolation(viol)
                    }}
                  >
                    {isSelected && (
                      <circle
                        cx={viol.label_position.x}
                        cy={viol.label_position.y}
                        r="0.65"
                        fill="none"
                        stroke={color}
                        strokeWidth="0.04"
                        strokeDasharray="0.1 0.05"
                        opacity="0.8"
                      />
                    )}
                    <circle
                      cx={viol.label_position.x}
                      cy={viol.label_position.y}
                      r={isSelected ? 0.45 : 0.35}
                      fill={color}
                      fillOpacity="0.85"
                      stroke="#ffffff"
                      strokeWidth="0.04"
                    />
                  </g>
                )
              }

              return null
            })}
        </svg>

        {/* Interactive Room Overlay Badge (Screen 7) */}
        <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 animate-in fade-in duration-300">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#0F1420]/95 backdrop-blur-md border border-emerald-500/40 text-white shadow-xl text-center">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <span>{selectedRoom ? selectedRoom.label || selectedRoom.room_type : 'Living Room'}</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5 flex items-center justify-center gap-1">
              <span>Area: {selectedRoom?.area_m2 ? selectedRoom.area_m2.toFixed(1) : '24.5'} m²</span>
              <span className="text-emerald-400 font-bold">· Compliant ✓</span>
            </div>
          </div>
        </div>

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-3 left-3 glass-panel px-3 py-2 text-[11px] flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500/50 border border-indigo-400" />
            <span>Habitable Room</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500/50 border border-purple-400" />
            <span>Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Door</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/60 border border-rose-400" />
            <span>NBC Non-Compliance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
