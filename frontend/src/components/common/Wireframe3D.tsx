import React from 'react'

interface Wireframe3DProps {
  className?: string
  accentColor?: string
  isDark?: boolean
}

export const Wireframe3D: React.FC<Wireframe3DProps> = ({
  className = 'w-full h-full',
  accentColor = '#6366f1',
  isDark = true,
}) => {
  const strokeColor = isDark ? '#334155' : '#cbd5e1'
  const beamColor = isDark ? '#64748b' : '#94a3b8'
  const highlightColor = accentColor
  const gridColor = isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)'

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 540 480"
        className="w-full h-full max-h-[460px] drop-shadow-2xl overflow-visible select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wfCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="wfFloorGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Perspective Ground Grid */}
        <g stroke={gridColor} strokeWidth="1" strokeDasharray="3 3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={`g1-${i}`} x1={40 + i * 40} y1={360 + i * 15} x2={270 + i * 40} y2={450 - i * 15} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={`g2-${i}`} x1={270 - i * 40} y1={450 - i * 15} x2={500 - i * 40} y2={360 + i * 15} />
          ))}
        </g>

        {/* Foundation Slab */}
        <polygon
          points="270,410 430,330 270,250 110,330"
          fill="url(#wfFloorGlow)"
          stroke={beamColor}
          strokeWidth="1.5"
        />

        {/* Level 1 Columns */}
        <line x1="110" y1="330" x2="110" y2="240" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="430" y1="330" x2="430" y2="240" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="270" y1="410" x2="270" y2="320" stroke={highlightColor} strokeWidth="2" />
        <line x1="270" y1="250" x2="270" y2="160" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />

        {/* Interior Core Columns Level 1 */}
        <line x1="190" y1="370" x2="190" y2="280" stroke={strokeColor} strokeWidth="1" />
        <line x1="350" y1="370" x2="350" y2="280" stroke={strokeColor} strokeWidth="1" />

        {/* Level 1 Floor Plate */}
        <polygon
          points="270,320 430,240 270,160 110,240"
          fill="url(#wfFloorGlow)"
          stroke={highlightColor}
          strokeWidth="1.8"
        />

        {/* Room Partition Lines Level 1 */}
        <line x1="270" y1="320" x2="270" y2="240" stroke="#38bdf8" strokeWidth="1.2" />
        <line x1="270" y1="240" x2="350" y2="200" stroke="#38bdf8" strokeWidth="1.2" />
        <line x1="190" y1="280" x2="270" y2="240" stroke="#38bdf8" strokeWidth="1.2" />

        {/* Level 2 Columns */}
        <line x1="110" y1="240" x2="110" y2="150" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="430" y1="240" x2="430" y2="150" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="270" y1="320" x2="270" y2="230" stroke={highlightColor} strokeWidth="2" />
        <line x1="270" y1="160" x2="270" y2="70" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />

        {/* Level 2 Floor Plate */}
        <polygon
          points="270,230 430,150 270,70 110,150"
          fill="url(#wfFloorGlow)"
          stroke={highlightColor}
          strokeWidth="1.8"
        />

        {/* Level 3 Columns */}
        <line x1="110" y1="150" x2="110" y2="60" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="430" y1="150" x2="430" y2="60" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="270" y1="230" x2="270" y2="140" stroke={highlightColor} strokeWidth="2" />
        <line x1="270" y1="70" x2="270" y2="-20" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />

        {/* Roof Structure */}
        <polygon
          points="270,140 430,60 270,-20 110,60"
          fill="none"
          stroke="url(#wfCyanGrad)"
          strokeWidth="2.2"
        />

        {/* Cantilever Roof Trellis */}
        <line x1="270" y1="140" x2="270" y2="115" stroke={highlightColor} strokeWidth="1.5" />
        <line x1="430" y1="60" x2="430" y2="35" stroke={highlightColor} strokeWidth="1.5" />
        <line x1="110" y1="60" x2="110" y2="35" stroke={highlightColor} strokeWidth="1.5" />
        <polygon
          points="270,115 430,35 270,-45 110,35"
          fill="none"
          stroke={beamColor}
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Glowing Compliance Inspection Nodes */}
        <g filter="url(#nodeGlow)">
          <circle cx="270" cy="240" r="4" fill="#6366f1" />
          <circle cx="350" cy="200" r="4.5" fill="#ef4444" />
          <circle cx="190" cy="280" r="4" fill="#10b981" />
          <circle cx="270" cy="320" r="4" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  )
}
