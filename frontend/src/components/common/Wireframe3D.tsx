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
  const strokeColor = isDark ? '#475569' : '#94a3b8'
  const beamColor = accentColor
  const gridColor = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)'

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 500 450"
        className="w-full h-full max-h-[440px] drop-shadow-2xl overflow-visible select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wfGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="wfFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Ground grid */}
        <g stroke={gridColor} strokeWidth="1" strokeDasharray="3 3">
          <line x1="50" y1="360" x2="250" y2="440" />
          <line x1="90" y1="330" x2="290" y2="410" />
          <line x1="130" y1="300" x2="330" y2="380" />
          <line x1="170" y1="270" x2="370" y2="350" />
          <line x1="210" y1="240" x2="410" y2="320" />

          <line x1="250" y1="440" x2="450" y2="360" />
          <line x1="210" y1="410" x2="410" y2="330" />
          <line x1="170" y1="380" x2="370" y2="300" />
          <line x1="130" y1="350" x2="330" y2="270" />
          <line x1="90" y1="320" x2="290" y2="240" />
        </g>

        {/* Foundation Base Slab */}
        <polygon
          points="250,380 400,310 250,240 100,310"
          fill="url(#wfFloorGrad)"
          stroke={beamColor}
          strokeWidth="1.5"
        />

        {/* Level 1 Slabs & Columns */}
        {/* Columns Base to Level 1 */}
        <line x1="100" y1="310" x2="100" y2="220" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="400" y1="310" x2="400" y2="220" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="250" y1="380" x2="250" y2="290" stroke={beamColor} strokeWidth="2" />
        <line x1="250" y1="240" x2="250" y2="150" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

        {/* Interior structural columns */}
        <line x1="175" y1="345" x2="175" y2="255" stroke={strokeColor} strokeWidth="1" />
        <line x1="325" y1="345" x2="325" y2="255" stroke={strokeColor} strokeWidth="1" />
        <line x1="175" y1="275" x2="175" y2="185" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
        <line x1="325" y1="275" x2="325" y2="185" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

        {/* Level 1 Floor Slab */}
        <polygon
          points="250,290 400,220 250,150 100,220"
          fill="url(#wfFloorGrad)"
          stroke={beamColor}
          strokeWidth="1.5"
        />

        {/* Interior walls / partitions on Level 1 */}
        <g stroke={accentColor} strokeWidth="1.2" opacity="0.85">
          <line x1="250" y1="290" x2="250" y2="220" />
          <line x1="250" y1="220" x2="325" y2="185" />
          <line x1="175" y1="255" x2="250" y2="220" />
        </g>

        {/* Level 2 Columns */}
        <line x1="100" y1="220" x2="100" y2="130" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="400" y1="220" x2="400" y2="130" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="250" y1="290" x2="250" y2="200" stroke={beamColor} strokeWidth="2" />
        <line x1="250" y1="150" x2="250" y2="60" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

        {/* Level 2 Floor Slab */}
        <polygon
          points="250,200 400,130 250,60 100,130"
          fill="url(#wfFloorGrad)"
          stroke={beamColor}
          strokeWidth="1.5"
        />

        {/* Level 3 Columns */}
        <line x1="100" y1="130" x2="100" y2="50" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="400" y1="130" x2="400" y2="50" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="250" y1="200" x2="250" y2="120" stroke={beamColor} strokeWidth="2" />
        <line x1="250" y1="60" x2="250" y2="-20" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

        {/* Roof Slab */}
        <polygon
          points="250,120 400,50 250,-20 100,50"
          fill="none"
          stroke="url(#wfGrad1)"
          strokeWidth="2"
        />

        {/* Roof perimeter parapet details */}
        <line x1="250" y1="120" x2="250" y2="105" stroke={accentColor} strokeWidth="1.5" />
        <line x1="400" y1="50" x2="400" y2="35" stroke={accentColor} strokeWidth="1.5" />
        <line x1="100" y1="50" x2="100" y2="35" stroke={accentColor} strokeWidth="1.5" />
        <polygon
          points="250,105 400,35 250,-35 100,35"
          fill="none"
          stroke={beamColor}
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Structural cross-bracing / measurement lines */}
        <g stroke="#06b6d4" strokeWidth="1" opacity="0.6" strokeDasharray="3 3">
          <line x1="100" y1="310" x2="250" y2="290" />
          <line x1="250" y1="380" x2="100" y2="220" />
          <line x1="250" y1="290" x2="400" y2="310" />
          <line x1="400" y1="220" x2="250" y2="380" />
        </g>

        {/* Highlighted Compliance Nodes */}
        <circle cx="250" cy="220" r="4" fill="#6366f1" />
        <circle cx="250" cy="220" r="8" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.6" />

        <circle cx="325" cy="185" r="4" fill="#ef4444" />
        <circle cx="325" cy="185" r="9" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.7" />

        <circle cx="175" cy="255" r="4" fill="#10b981" />
        <circle cx="175" cy="255" r="8" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    </div>
  )
}
