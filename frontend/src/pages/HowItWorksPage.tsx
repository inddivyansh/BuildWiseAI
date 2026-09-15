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
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface HowItWorksPageProps {
  onNavigate: (route: string) => void
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Upload Your Blueprint',
      desc: 'DXF, vector PDF, or raster scans are ingested and parsed without resolution loss.',
      icon: UploadCloud,
      color: 'text-indigo-400',
    },
    {
      num: '02',
      title: 'Extract Canonical Geometry',
      desc: 'We detect walls, rooms, doors, stairs, windows, and exit portals into a unified spatial schema.',
      icon: Layers,
      color: 'text-cyan-400',
    },
    {
      num: '03',
      title: 'Build Building Graph',
      desc: 'NetworkX topological circulation models calculate connectivity, travel distances, and egress bottlenecks.',
      icon: GitBranch,
      color: 'text-emerald-400',
    },
    {
      num: '04',
      title: 'NBC 2016 Compliance Analysis',
      desc: '100+ statutory clauses from NBC 2016 Part 3 & 4 are evaluated deterministically.',
      icon: ShieldCheck,
      color: 'text-purple-400',
    },
    {
      num: '05',
      title: 'Visualize & Inspect Violations',
      desc: 'Interactive CAD overlay highlights non-compliances with calculated dimension shortfalls.',
      icon: Eye,
      color: 'text-rose-400',
    },
    {
      num: '06',
      title: 'Get Grounded AI Explanations',
      desc: 'Gemini RAG assistant answers legal and architectural questions grounded directly in NBC PDFs.',
      icon: MessageSquare,
      color: 'text-amber-400',
    },
    {
      num: '07',
      title: 'Generate Statutory Report',
      desc: 'Download client-ready documentation and municipal compliance audit packages.',
      icon: FileCheck2,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      {/* Header with Subtle Ambient Glow */}
      <section className="relative pt-16 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6B57FF]/15 blur-[120px] pointer-events-none rounded-full" />
        
        <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
          Algorithmic Architecture Pipeline
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-2">
          How BuildWise Works
        </h1>
        <p className="mt-3 text-base text-slate-400 font-normal">
          From raw blueprint ingestion to grounded statutory insights — in 7 verified steps.
        </p>
      </section>

      {/* Main 2-Column Content */}
      <section className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: 7 Steps (JetBrains Dark Stepper) */}
          <div className="lg:col-span-6 space-y-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-[#090C14] border border-[#1A2133] hover:border-[#6B57FF] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#141A29] border border-[#232D45] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {step.num}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${step.color}`} />
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* JetBrains White Pill CTA Button */}
            <div className="pt-4 text-left">
              <button
                onClick={() => onNavigate('/how-it-works/demo')}
                className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-black font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Try the Interactive Demo Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Workflow Cards Stack (JetBrains Dark Aesthetics) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Card 1: CAD Blueprint Preview */}
            <div className="p-6 rounded-3xl bg-[#090C14] border border-[#1A2133] shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A2133] mb-4 text-[11px] text-slate-400 font-mono">
                <span className="text-indigo-400 font-bold">RIVERSIDE_LVL01_ARCH.DWG</span>
                <span>1:100 VECTOR SCALE</span>
              </div>
              
              <svg viewBox="0 0 400 180" className="w-full h-auto bg-[#06080E] rounded-xl p-2 border border-[#141A28]" fill="none" stroke="currentColor">
                {/* Background Tech Grid */}
                <pattern id="cad-grid-dark" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#161F30" strokeWidth="0.5" />
                </pattern>
                <rect width="400" height="180" fill="url(#cad-grid-dark)" />

                {/* Building Outer Walls */}
                <rect x="30" y="20" width="340" height="140" stroke="#6366F1" strokeWidth="2.5" fill="#0A0E18" />

                {/* Interior Partitions */}
                <line x1="160" y1="20" x2="160" y2="160" stroke="#475569" strokeWidth="1.8" />
                <line x1="260" y1="20" x2="260" y2="160" stroke="#475569" strokeWidth="1.8" />
                <line x1="30" y1="95" x2="160" y2="95" stroke="#475569" strokeWidth="1.8" />
                <line x1="260" y1="95" x2="370" y2="95" stroke="#475569" strokeWidth="1.8" />

                {/* Door Opening Arcs */}
                <path d="M 160 60 A 25 25 0 0 1 185 85" stroke="#00F0FF" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1="160" y1="60" x2="160" y2="85" stroke="#00F0FF" strokeWidth="1.8" />

                <path d="M 260 130 A 25 25 0 0 0 235 155" stroke="#00F0FF" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1="260" y1="130" x2="260" y2="155" stroke="#00F0FF" strokeWidth="1.8" />

                {/* Dimension Lines */}
                <line x1="30" y1="12" x2="370" y2="12" stroke="#64748b" strokeWidth="0.8" />
                <text x="200" y="10" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">18.40 m</text>

                {/* Room Labels */}
                <text x="95" y="60" fill="#E2E8F0" fontSize="9" fontWeight="600" textAnchor="middle">BEDROOM 01</text>
                <text x="95" y="130" fill="#E2E8F0" fontSize="9" fontWeight="600" textAnchor="middle">BEDROOM 02</text>
                <text x="210" y="92" fill="#E2E8F0" fontSize="9" fontWeight="600" textAnchor="middle">CORRIDOR</text>
                <text x="315" y="60" fill="#E2E8F0" fontSize="9" fontWeight="600" textAnchor="middle">LIVING ROOM</text>
                <text x="315" y="130" fill="#E2E8F0" fontSize="9" fontWeight="600" textAnchor="middle">KITCHEN</text>
              </svg>
            </div>

            {/* Card 2: Analyzed Canonical Floor Plan with Red Violation Tag */}
            <div className="relative p-6 rounded-3xl bg-[#090C14] border border-[#1A2133] shadow-2xl overflow-hidden text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A2133] mb-4 text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">● GEOMETRY EXTRACTED</span>
                <span>NBC 2016 COMPLIANCE CHECK</span>
              </div>

              <svg viewBox="0 0 400 160" className="w-full h-auto bg-[#06080E] rounded-xl p-2 border border-[#141A28]" fill="none">
                {/* Rooms with Color Fills */}
                <rect x="30" y="15" width="130" height="65" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1" />
                <rect x="30" y="85" width="130" height="65" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1" />
                <rect x="250" y="15" width="120" height="65" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1" />
                <rect x="250" y="85" width="120" height="65" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1" />

                {/* Corridor with Red Violation Highlight */}
                <rect x="165" y="15" width="80" height="135" fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Egress Path Line */}
                <path d="M 95 45 L 205 45 L 205 150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="205" cy="150" r="4" fill="#10b981" />
              </svg>

              {/* Red Violation Tag Badge */}
              <div className="absolute top-[54%] left-[51%] -translate-x-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-full bg-[#FE2857] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(254,40,87,0.6)] animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Violation: 1.0m (req 1.5m)</span>
              </div>
            </div>

            {/* Card 3: JetBrains Code / Citation Card */}
            <div className="p-6 rounded-3xl bg-[#090C14] border border-[#232B40] text-left shadow-2xl">
              <div className="text-xs font-mono font-bold text-[#818CF8] tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#818CF8]" />
                <span>NBC 2016 · Statutory Source Verification</span>
              </div>
              <div className="text-sm font-bold text-white font-mono mt-2">
                Clause 4.3.2 — Minimum Corridor Clear Width
              </div>
              <p className="mt-2 text-xs text-slate-300 font-normal leading-relaxed">
                "For residential apartment buildings exceeding 15m height, all exit access corridors shall have a minimum clear width of 1.5 metres without obstruction."
              </p>
              <div className="mt-4 pt-3 border-t border-[#1A2133] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Volume 1 · Part 4 · Section 4.3</span>
                <span className="text-indigo-400">Page 38</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
