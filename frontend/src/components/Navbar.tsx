import React, { useState } from 'react'
import {
  Layers,
  ShieldCheck,
  FileUp,
  Sparkles,
  BookOpen,
  FolderKanban,
  Cpu,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react'

interface NavbarProps {
  currentView: 'landing' | 'how-it-works' | 'projects' | 'workspace'
  onNavigate: (view: 'landing' | 'how-it-works' | 'projects') => void
  onAnalyzeBlueprint: () => void
  readiness?: {
    database: string
    storage: string
    llm_status: string
  }
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onAnalyzeBlueprint,
  readiness,
}) => {
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const isDbOk = readiness?.database === 'ok'
  const isLlmOk = readiness?.llm_status === 'available'

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        {/* Brand & Identity */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-white tracking-tight">
                BuildWise <span className="text-cyan-400 font-extrabold">AI</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                NBC 2016
              </span>
            </div>
          </div>
        </div>

        {/* Clean Application Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate('how-it-works')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'how-it-works'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>How It Works?</span>
          </button>

          <button
            onClick={() => onNavigate('projects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'projects' || currentView === 'workspace'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setIsDocsOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Standards / About</span>
          </button>
        </nav>

        {/* Primary Action & Status */}
        <div className="flex items-center gap-3">
          {/* Readiness Indicators */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbOk ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-400">PostgreSQL</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLlmOk ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-400">Gemini Pool</span>
            </div>
          </div>

          {/* Primary CTA: Analyze Blueprint */}
          <button
            onClick={onAnalyzeBlueprint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <FileUp className="w-4 h-4" />
            <span>Analyze Blueprint</span>
          </button>
        </div>
      </header>

      {/* Standards & About Modal */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  National Building Code of India 2016 — Authoritative Sources
                </h3>
              </div>
              <button
                onClick={() => setIsDocsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <p className="font-semibold text-white">Zero-Hallucination Compliance Screening</p>
                <p className="mt-1">
                  BuildWise enforces strict source grounding. Every rule evaluation, citation, and recommendation originates from the official 5-document NBC 2016 statutory repository.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
                  Mapped Statutory Source Documents
                </h4>
                <ul className="space-y-2 font-mono">
                  <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <div className="text-white font-semibold">NBC 2016 Vol 1 (Part 0 to 3)</div>
                      <div className="text-slate-400 text-[11px]">Development Control, General Building Requirements, Habitable Spaces (Clause 12.2)</div>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <div className="text-white font-semibold">NBC 2016 Vol 1 (Part 4)</div>
                      <div className="text-slate-400 text-[11px]">Fire & Life Safety, Exit Corridors (Table 8), Travel Distance (Cl 4.5.1), Dead Ends (Cl 4.5.2)</div>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <div className="text-white font-semibold">NBC 2016 Vol 1 (Part 5)</div>
                      <div className="text-slate-400 text-[11px]">Building Materials, Structural Fire Resistance Ratings</div>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <div className="text-white font-semibold">NBC 2016 Vol 2 (Part 6 to 9)</div>
                      <div className="text-slate-400 text-[11px]">Structural Design, Plumbing, Mechanical & Electrical Services</div>
                    </div>
                  </li>
                  <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <div className="text-white font-semibold">NBC 2016 Vol 2 (Part 10 to 12)</div>
                      <div className="text-slate-400 text-[11px]">Landscape, Sustainability & Asset Management Guidelines</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Disclaimer:</span> BuildWise is an automated preliminary screening system and does not grant statutory municipal approval or licensed architectural sign-off.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDocsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
