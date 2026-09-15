import React from 'react'
import {
  Layers,
  ArrowRight,
  Plus,
  FileDown,
  Play,
  FileUp,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

export interface NavbarProps {
  theme?: 'dark' | 'light'
  currentRoute?: string
  projectName?: string
  activeWorkspaceTab?: string
  onWorkspaceTabChange?: (tab: string) => void
  onNavigate: (route: string) => void
  onAnalyzeBlueprint?: () => void
  onExportReport?: () => void
  isWorkspace?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute = '/',
  projectName,
  activeWorkspaceTab = 'floor-plan',
  onWorkspaceTabChange,
  onNavigate,
  onAnalyzeBlueprint,
  onExportReport,
  isWorkspace = false,
}) => {
  const workspaceTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'floor-plan', label: 'Floor Plan' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'violations', label: 'Violations' },
    { id: 'measurements', label: 'Measurements' },
    { id: 'egress', label: 'Egress' },
    { id: 'assistant', label: 'AI Assistant' },
    { id: 'report', label: 'Report' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#000000] border-b border-[#1A1D26] text-white select-none">
      {/* Primary JetBrains Navigation Bar */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            {/* JetBrains-style logo icon */}
            <div className="relative w-8 h-8 rounded-lg bg-black p-[1.5px] bg-gradient-to-br from-[#FE2857] via-[#9B51E0] to-[#6B57FF] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#090A0F] rounded-[6px] flex items-center justify-center">
                <span className="font-mono text-[13px] font-black text-white leading-none tracking-tighter">_BW</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-slate-200 transition-colors uppercase">
                BuildWise
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#161B28] text-[#818CF8] border border-[#232B3E]">
                AI
              </span>
            </div>
          </button>

          {isWorkspace && projectName && (
            <div className="hidden sm:flex items-center gap-2 text-xs ml-2 pl-3 border-l border-slate-800">
              <button
                onClick={() => onNavigate('/projects')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Projects
              </button>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                {projectName}
              </span>
            </div>
          )}
        </div>

        {/* Center Links (JetBrains style) */}
        {!isWorkspace && (
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide">
            <button
              onClick={() => onNavigate('/')}
              className={`transition-colors py-1 ${
                currentRoute === '/'
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Product
            </button>

            <button
              onClick={() => onNavigate('/how-it-works')}
              className={`transition-colors py-1 relative ${
                currentRoute === '/how-it-works'
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              How It Works
              {currentRoute === '/how-it-works' && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#6B57FF] rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('/projects')}
              className={`transition-colors py-1 relative ${
                currentRoute.startsWith('/projects')
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Projects
              {currentRoute.startsWith('/projects') && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#6B57FF] rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('/how-it-works/demo')}
              className={`transition-colors py-1 flex items-center gap-1.5 ${
                currentRoute.startsWith('/how-it-works/demo')
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Interactive Demo</span>
            </button>
          </nav>
        )}

        {/* Right CTA Actions (JetBrains White Pill Style) */}
        <div className="flex items-center gap-3">
          {isWorkspace ? (
            <>
              {onExportReport && (
                <button
                  onClick={onExportReport}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#121624] hover:bg-[#1A2033] text-slate-200 border border-[#232B3E] transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              )}

              <button
                onClick={onAnalyzeBlueprint || (() => onNavigate('/projects/new'))}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-black text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Analyze Blueprint</span>
              </button>
            </>
          ) : currentRoute.startsWith('/projects') ? (
            <button
              onClick={() => onNavigate('/projects/new')}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-black text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/how-it-works/demo')}
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5"
              >
                <span>Demo</span>
              </button>
              <button
                onClick={() => onNavigate('/projects/new')}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-black text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Analyze Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* JetBrains-Style Workspace Tab Bar (When inside Project Workspace) */}
      {isWorkspace && (
        <div className="border-t border-[#161B26] px-6 overflow-x-auto bg-[#05070B]">
          <div className="max-w-7xl mx-auto flex items-center gap-1">
            {workspaceTabs.map((tab) => {
              const isActive = activeWorkspaceTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onWorkspaceTabChange && onWorkspaceTabChange(tab.id)}
                  className={`py-2.5 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#6B57FF] text-white font-bold bg-[#0F131F]'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0A0D15]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
