import React from 'react'
import {
  UploadCloud,
  Layers,
  GitBranch,
  ShieldCheck,
  Eye,
  MessageSquare,
  FileCheck2,
  ArrowRight,
  AlertTriangle,
  FileText,
} from 'lucide-react'

interface HowItWorksPageProps {
  onNavigate: (route: string) => void
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: 1,
      title: 'Upload Your Blueprint',
      desc: 'DXF, PDF or image files',
      icon: UploadCloud,
    },
    {
      num: 2,
      title: 'Extract Geometry',
      desc: 'We detect walls, rooms, doors, stairs and more',
      icon: Layers,
    },
    {
      num: 3,
      title: 'Build Building Graph',
      desc: 'Understand connectivity and egress paths',
      icon: GitBranch,
    },
    {
      num: 4,
      title: 'NBC 2016 Compliance Analysis',
      desc: 'Check against statutory requirements',
      icon: ShieldCheck,
    },
    {
      num: 5,
      title: 'Visualize & Explore',
      desc: 'See violations, measurements and insights',
      icon: Eye,
    },
    {
      num: 6,
      title: 'Get AI Explanations',
      desc: 'Grounded in actual NBC clauses',
      icon: MessageSquare,
    },
    {
      num: 7,
      title: 'Generate Report',
      desc: 'Download a complete analysis report',
      icon: FileCheck2,
    },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <section className="pt-12 pb-8 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How BuildWise Works
        </h1>
        <p className="mt-2 text-base text-slate-500 font-light">
          From upload to insights — in a few simple steps.
        </p>
      </section>

      {/* Main 2-Column Content */}
      <section className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: 7 Steps */}
          <div className="lg:col-span-6 space-y-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/how-it-works/demo')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>Try the Interactive Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Workflow Cards Stack (Mockup Screen 2) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Card 1: Crisp Architectural Blueprint CAD Preview */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3 text-[11px] text-slate-400 font-mono">
                <span>RIVERSIDE_LVL01_ARCH.DWG</span>
                <span>1:100 SCALE</span>
              </div>
              <svg viewBox="0 0 400 180" className="w-full h-auto bg-slate-50 rounded-lg p-2" fill="none" stroke="currentColor">
                {/* Background Grid */}
                <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
                <rect width="400" height="180" fill="url(#cad-grid)" />

                {/* Building Outer Walls */}
                <rect x="30" y="20" width="340" height="140" stroke="#1e293b" strokeWidth="2.5" fill="#f8fafc" />

                {/* Interior Partitions */}
                <line x1="160" y1="20" x2="160" y2="160" stroke="#334155" strokeWidth="1.8" />
                <line x1="260" y1="20" x2="260" y2="160" stroke="#334155" strokeWidth="1.8" />
                <line x1="30" y1="95" x2="160" y2="95" stroke="#334155" strokeWidth="1.8" />
                <line x1="260" y1="95" x2="370" y2="95" stroke="#334155" strokeWidth="1.8" />

                {/* Door Opening Arcs */}
                <path d="M 160 60 A 25 25 0 0 1 185 85" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1="160" y1="60" x2="160" y2="85" stroke="#1e293b" strokeWidth="1.8" />

                <path d="M 260 130 A 25 25 0 0 0 235 155" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1="260" y1="130" x2="260" y2="155" stroke="#1e293b" strokeWidth="1.8" />

                {/* Dimension Lines */}
                <line x1="30" y1="12" x2="370" y2="12" stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="200" y="10" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">18.40 m</text>

                <line x1="18" y1="20" x2="18" y2="160" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="14" y="95" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 14 95)">8.20 m</text>

                {/* Room Labels */}
                <text x="95" y="60" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">BEDROOM 01</text>
                <text x="95" y="130" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">BEDROOM 02</text>
                <text x="210" y="92" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">CORRIDOR</text>
                <text x="315" y="60" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">LIVING ROOM</text>
                <text x="315" y="130" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">KITCHEN</text>
              </svg>
            </div>

            {/* Card 2: Analyzed Floor Plan with Color Fills and Floating Red Violation Tag */}
            <div className="relative p-5 rounded-2xl bg-[#090D16] border border-[#1E2536] shadow-md overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3 text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400">● GEOMETRY EXTRACTED</span>
                <span className="text-slate-400">CANONICAL MODEL v1</span>
              </div>
              <svg viewBox="0 0 400 160" className="w-full h-auto" fill="none">
                {/* Rooms with color fills */}
                <rect x="30" y="15" width="130" height="65" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1" />
                <rect x="30" y="85" width="130" height="65" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1" />
                <rect x="250" y="15" width="120" height="65" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" strokeWidth="1" />
                <rect x="250" y="85" width="120" height="65" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" strokeWidth="1" />

                {/* Corridor with Red Violation Highlight */}
                <rect x="165" y="15" width="80" height="135" fill="rgba(239, 68, 68, 0.18)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Egress Path Line */}
                <path d="M 95 45 L 205 45 L 205 150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="205" cy="150" r="4" fill="#10b981" />
              </svg>

              {/* Red Violation Tag Badge positioned over corridor */}
              <div className="absolute top-[52%] left-[51%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-[#DC2626] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xl animate-pulse">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Violation</span>
              </div>
            </div>

            {/* Card 3: JetBrains Code/Citation Dark Card */}
            <div className="p-5 rounded-2xl bg-[#0C101A] border border-[#1E2536] text-left shadow-md">
              <div className="text-xs font-mono font-bold text-[#818CF8] tracking-wider uppercase">
                NBC 2016
              </div>
              <div className="text-sm font-bold text-white font-mono mt-1">
                Clause 4.3.2
              </div>
              <p className="mt-2 text-xs text-slate-300 font-normal leading-relaxed">
                Minimum corridor width shall be 1.5m for residential buildings...
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
