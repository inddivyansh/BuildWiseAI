import React from 'react'

interface BuildingThumbnailProps {
  type: 'residential_apartment' | 'commercial_office' | 'residential_villa' | 'default'
  className?: string
}

export const BuildingThumbnail: React.FC<BuildingThumbnailProps> = ({
  type,
  className = 'w-full h-36',
}) => {
  if (type === 'residential_apartment') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover select-none" fill="none">
          <rect width="320" height="180" fill="#0f172a" />
          <path d="M0 140 L320 140 L320 180 L0 180 Z" fill="#1e293b" />
          {/* Main Building Mass */}
          <rect x="50" y="30" width="220" height="110" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <rect x="70" y="20" width="180" height="20" fill="#334155" />
          {/* Balconies / Grid Windows */}
          {Array.from({ length: 4 }).map((_, floor) => (
            <g key={floor}>
              {Array.from({ length: 6 }).map((_, win) => (
                <rect
                  key={win}
                  x={65 + win * 32}
                  y={45 + floor * 22}
                  width="22"
                  height="14"
                  fill="#0ea5e9"
                  fillOpacity={win % 2 === 0 ? "0.35" : "0.2"}
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
              ))}
            </g>
          ))}
          {/* Architectural accent lines */}
          <line x1="50" y1="30" x2="270" y2="30" stroke="#6366f1" strokeWidth="2" />
          <line x1="160" y1="20" x2="160" y2="140" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      </div>
    )
  }

  if (type === 'commercial_office') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover select-none" fill="none">
          <rect width="320" height="180" fill="#090d16" />
          <path d="M0 145 L320 145 L320 180 L0 180 Z" fill="#1e293b" />
          {/* High-Rise Office Tower */}
          <rect x="80" y="15" width="160" height="130" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Curtain Wall Glass Grid */}
          <rect x="90" y="25" width="140" height="110" fill="#0f172a" stroke="#334155" />
          {Array.from({ length: 7 }).map((_, floor) => (
            <line
              key={floor}
              x1="90"
              y1={25 + floor * 15}
              x2="230"
              y2={25 + floor * 15}
              stroke="#6366f1"
              strokeWidth="0.8"
              opacity="0.6"
            />
          ))}
          {Array.from({ length: 9 }).map((_, col) => (
            <line
              key={col}
              x1={90 + col * 15.5}
              y1="25"
              x2={90 + col * 15.5}
              y2="130"
              stroke="#06b6d4"
              strokeWidth="0.8"
              opacity="0.4"
            />
          ))}
          {/* Glass reflection beam */}
          <polygon points="95,130 145,25 170,25 120,130" fill="#38bdf8" fillOpacity="0.12" />
        </svg>
      </div>
    )
  }

  if (type === 'residential_villa') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover select-none" fill="none">
          <rect width="320" height="180" fill="#0f172a" />
          <path d="M0 140 L320 140 L320 180 L0 180 Z" fill="#1e293b" />
          {/* Slanted Roof & Modern Pavilion */}
          <polygon points="40,90 120,45 280,45 200,90" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          <rect x="70" y="80" width="170" height="60" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Large Panoramic French Windows */}
          <rect x="90" y="90" width="60" height="45" fill="#0ea5e9" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1" />
          <rect x="170" y="90" width="55" height="45" fill="#0ea5e9" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1" />
          <rect x="230" y="95" width="20" height="45" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" />
          <line x1="40" y1="90" x2="280" y2="90" stroke="#f43f5e" strokeWidth="1.5" />
        </svg>
      </div>
    )
  }

  // Default architectural drawing
  return (
    <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 320 180" className="w-full h-full select-none" fill="none">
        <rect width="320" height="180" fill="#0f172a" />
        <line x1="40" y1="40" x2="280" y2="40" stroke="#475569" strokeWidth="1.5" />
        <line x1="280" y1="40" x2="280" y2="140" stroke="#475569" strokeWidth="1.5" />
        <line x1="280" y1="140" x2="40" y2="140" stroke="#475569" strokeWidth="1.5" />
        <line x1="40" y1="140" x2="40" y2="40" stroke="#475569" strokeWidth="1.5" />
        <rect x="70" y="60" width="80" height="60" fill="#1e293b" stroke="#6366f1" strokeWidth="1" />
        <rect x="170" y="60" width="80" height="60" fill="#1e293b" stroke="#06b6d4" strokeWidth="1" />
      </svg>
    </div>
  )
}
