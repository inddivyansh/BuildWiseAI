import React from 'react'
import {
  Layers,
  ShieldCheck,
  Network,
  MessageSquare,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Cpu,
  History,
} from 'lucide-react'

interface NavbarProps {
  activeTab: 'studio' | 'compliance' | 'graph' | 'chat' | 'reports'
  onTabChange: (tab: 'studio' | 'compliance' | 'graph' | 'chat' | 'reports') => void
  onOpenUpload: () => void
  onOpenHistory?: () => void
  readiness?: {
    database: string
    storage: string
    llm_status: string
  }
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenUpload,
  onOpenHistory,
  readiness,
}) => {
  const isDbOk = readiness?.database === 'ok'
  const isLlmOk = readiness?.llm_status === 'available'

  return (
    <header className="sticky top-0 z-50 glass-panel !rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white tracking-tight">
              BuildWise <span className="text-cyan-400 font-extrabold">AI</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v0.1.0 • NBC 2016
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Algorithmic Blueprint & Regulatory Compliance Platform
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onTabChange('studio')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'studio'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Floor Plan Studio
        </button>

        <button
          onClick={() => onTabChange('compliance')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'compliance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Compliance Matrix
        </button>

        <button
          onClick={() => onTabChange('graph')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'graph'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Egress Topology
        </button>

        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          NBC AI Chat
        </button>

        <button
          onClick={() => onTabChange('reports')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Reports
        </button>
      </nav>

      {/* System Status Indicators & Upload Button */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isDbOk ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-400">Postgres:</span>
            <span className="text-slate-200 font-medium">
              {isDbOk ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="w-px h-3 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Gemini:</span>
            <span className={`font-medium ${isLlmOk ? 'text-cyan-400' : 'text-amber-400'}`}>
              {isLlmOk ? 'Round-Robin' : 'Mock/Fallback'}
            </span>
          </div>
        </div>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:text-white transition-all"
            title="View Project Analysis History"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>History</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          Upload DXF Blueprint
        </button>
      </div>
    </header>
  )
}
