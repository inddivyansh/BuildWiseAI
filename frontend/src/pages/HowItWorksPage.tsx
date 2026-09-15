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

          {/* Right Column: Visual Workflow Cards Stack */}
          <div className="lg:col-span-6 space-y-4">
            {/* Card 1: Blueprint Ingestion Graphic */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center min-h-[140px]">
              <svg viewBox="0 0 280 100" className="w-full max-w-[260px]" fill="none">
                <rect x="10" y="10" width="260" height="80" rx="4" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                <rect x="25" y="25" width="90" height="50" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <rect x="130" y="25" width="125" height="50" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <line x1="115" y1="50" x2="130" y2="50" stroke="#6366f1" strokeWidth="2" />
                <circle cx="115" cy="50" r="3" fill="#6366f1" />
              </svg>
            </div>

            {/* Card 2: Floor Plan with Violation Tag */}
            <div className="relative p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm min-h-[160px] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 280 120" className="w-full max-w-[260px]" fill="none">
                <rect x="20" y="20" width="240" height="80" stroke="#475569" strokeWidth="1.5" />
                <rect x="30" y="30" width="100" height="60" fill="#1e293b" stroke="#334155" />
                <rect x="150" y="30" width="100" height="60" fill="#1e293b" stroke="#334155" />
                {/* Corridor */}
                <rect x="130" y="30" width="20" height="60" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="130" y1="90" x2="150" y2="90" stroke="#10b981" strokeWidth="2" />
              </svg>

              {/* Red Violation Tag */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                <AlertTriangle className="w-3 h-3" />
                <span>Violation</span>
              </div>
            </div>

            {/* Card 3: Grounded NBC Citation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NBC 2016 · Clause 4.3.2</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 font-light leading-relaxed">
                Minimum corridor width shall be 1.5m for residential buildings...
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
