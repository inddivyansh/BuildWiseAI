import React from 'react'

interface BuildingThumbnailProps {
  type: 'residential_apartment' | 'commercial_office' | 'residential_villa' | 'default'
  className?: string
}

export const BuildingThumbnail: React.FC<BuildingThumbnailProps> = ({
  type,
  className = 'w-full h-40',
}) => {
  if (type === 'residential_apartment') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover select-none" fill="none">
          {/* Sky Gradient */}
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#skyGrad)" />

          {/* Ground / Landscape */}
          <rect y="180" width="400" height="60" fill="#0f172a" />
          <path d="M0 195 Q100 190 200 195 T400 195 L400 240 L0 240 Z" fill="#1e293b" />

          {/* Main Apartment Blocks (Corner Perspective) */}
          <polygon points="60,200 180,210 180,40 60,60" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
          <polygon points="180,210 340,195 340,45 180,40" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />

          {/* Upper Cantilever Penthouse */}
          <polygon points="50,60 180,40 350,45 350,25 180,20 50,40" fill="#334155" />

          {/* Balconies Left Facade (Wood cladding + Glass) */}
          {[0, 1, 2, 3].map((f) => (
            <g key={`l-${f}`}>
              <polygon
                points={`70,${80 + f * 30} 170,${70 + f * 30} 170,${90 + f * 30} 70,${100 + f * 30}`}
                fill="url(#woodGrad)"
              />
              <polygon
                points={`70,${72 + f * 30} 170,${62 + f * 30} 170,${78 + f * 30} 70,${88 + f * 30}`}
                fill="url(#glassGrad)"
                stroke="#38bdf8"
                strokeWidth="0.5"
              />
            </g>
          ))}

          {/* Balconies Right Facade */}
          {[0, 1, 2, 3].map((f) => (
            <g key={`r-${f}`}>
              <polygon
                points={`190,${70 + f * 30} 330,${80 + f * 30} 330,${100 + f * 30} 190,${90 + f * 30}`}
                fill="#1e293b"
              />
              <polygon
                points={`190,${62 + f * 30} 330,${72 + f * 30} 330,${88 + f * 30} 190,${78 + f * 30}`}
                fill="url(#glassGrad)"
                stroke="#38bdf8"
                strokeWidth="0.5"
              />
            </g>
          ))}

          {/* Architectural trees & planting */}
          <circle cx="45" cy="190" r="14" fill="#059669" fillOpacity="0.8" />
          <circle cx="355" cy="195" r="16" fill="#047857" fillOpacity="0.8" />
          <circle cx="375" cy="190" r="12" fill="#10b981" fillOpacity="0.7" />
        </svg>
      </div>
    )
  }

  if (type === 'commercial_office') {
    return (
      <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover select-none" fill="none">
          <defs>
            <linearGradient id="twilightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="towerGlass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#twilightGrad)" />

          {/* Background skyline silhouettes */}
          <rect x="30" y="100" width="60" height="140" fill="#090d16" />
          <rect x="310" y="80" width="70" height="160" fill="#090d16" />

          {/* Ground Plaza */}
          <rect y="200" width="400" height="40" fill="#030712" />

          {/* Main Commercial Glass Tower */}
          <polygon points="120,210 280,210 260,20 140,20" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
          <polygon points="125,205 275,205 255,25 145,25" fill="url(#towerGlass)" />

          {/* Horizontal Floor Spandrel Lines */}
          {Array.from({ length: 11 }).map((_, idx) => (
            <line
              key={idx}
              x1={125 + idx * 1.8}
              y1={205 - idx * 16}
              x2={275 - idx * 1.8}
              y2={205 - idx * 16}
              stroke="#6366f1"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
          ))}

          {/* Vertical Mullion Lines */}
          {Array.from({ length: 8 }).map((_, idx) => (
            <line
              key={idx}
              x1={140 + idx * 17}
              y1="25"
              x2={135 + idx * 19}
              y2="205"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
          ))}

          {/* Glowing Crown Fin */}
          <polygon points="140,20 260,20 270,10 130,10" fill="#4f46e5" fillOpacity="0.5" />
          <line x1="200" y1="10" x2="200" y2="-5" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      </div>
    )
  }

  if (type === 'residential_villa') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover select-none" fill="none">
          <defs>
            <linearGradient id="duskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="warmLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="poolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#duskGrad)" />

          {/* Modern Villa Structure */}
          <rect x="50" y="80" width="300" height="110" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />

          {/* Upper Cantilever Box */}
          <rect x="120" y="40" width="210" height="70" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <rect x="140" y="55" width="170" height="45" fill="url(#warmLight)" />

          {/* Ground Floor Glass Wall */}
          <rect x="70" y="110" width="180" height="80" fill="url(#warmLight)" />
          {/* Stone Wall Element */}
          <rect x="260" y="100" width="80" height="90" fill="#475569" />

          {/* Infinity Pool in Foreground */}
          <polygon points="30,220 370,220 350,195 50,195" fill="url(#poolGrad)" />
          <line x1="30" y1="220" x2="370" y2="220" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Palm trees */}
          <path d="M40 195 Q35 150 25 110" stroke="#78350f" strokeWidth="3" fill="none" />
          <circle cx="25" cy="110" r="18" fill="#10b981" fillOpacity="0.8" />
        </svg>
      </div>
    )
  }

  // Default Blueprint Wireframe
  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      <svg viewBox="0 0 400 240" className="w-full h-full select-none" fill="none">
        <rect width="400" height="240" fill="#0a0d14" />
        <rect x="40" y="40" width="320" height="160" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="70" y="70" width="110" height="100" fill="#111827" stroke="#4f46e5" strokeWidth="1.5" />
        <rect x="200" y="70" width="130" height="100" fill="#111827" stroke="#06b6d4" strokeWidth="1.5" />
        <line x1="180" y1="120" x2="200" y2="120" stroke="#10b981" strokeWidth="2" />
      </svg>
    </div>
  )
}
