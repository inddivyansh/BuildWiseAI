import React from 'react'
import {
  Layers,
  ArrowRight,
  Plus,
  FileDown,
  Play,
  FileUp,
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
  theme = 'dark',
  currentRoute = '/',
  projectName,
  activeWorkspaceTab = 'floor-plan',
  onWorkspaceTabChange,
  onNavigate,
  onAnalyzeBlueprint,
  onExportReport,
  isWorkspace = false,
}) => {
  const isDark = theme === 'dark'

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
    <header
      className={`sticky top-0 z-40 transition-colors ${
        isDark
          ? 'bg-[#0B0F17]/95 border-b border-slate-800/80 text-white'
          : 'bg-white border-b border-slate-200 text-slate-900'
      }`}
    >
      {/* Primary Navigation Row */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <span className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>
              BuildWise
            </span>
          </button>

          {isWorkspace && projectName && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
              <button
                onClick={() => onNavigate('/projects')}
                className={`text-xs font-medium hover:underline ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Projects
              </button>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {projectName}
              </span>
            </div>
          )}
        </div>

        {/* Center Links (when not in project workspace) */}
        {!isWorkspace && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
            <button
              onClick={() => onNavigate('/')}
              className={`transition-colors ${
                currentRoute === '/'
                  ? isDark ? 'text-white font-semibold' : 'text-indigo-600 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Product
            </button>

            <button
              onClick={() => onNavigate('/how-it-works')}
              className={`transition-colors relative py-1 ${
                currentRoute.startsWith('/how-it-works')
                  ? isDark ? 'text-white font-semibold' : 'text-indigo-600 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              How It Works
              {currentRoute.startsWith('/how-it-works') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('/projects')}
              className={`transition-colors ${
                currentRoute.startsWith('/projects')
                  ? isDark ? 'text-white font-semibold' : 'text-indigo-600 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {currentRoute === '/' ? 'Pricing' : 'Projects'}
            </button>

            <button
              onClick={() => onNavigate('/how-it-works')}
              className={`transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {currentRoute === '/' ? 'About' : 'Documentation'}
            </button>
          </nav>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {isWorkspace ? (
            <>
              {onExportReport && (
                <button
                  onClick={onExportReport}
                  className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isDark
                      ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              )}

              <button
                onClick={onAnalyzeBlueprint || (() => onNavigate('/projects/new'))}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Analyze Blueprint</span>
              </button>
            </>
          ) : currentRoute.startsWith('/projects') ? (
            <button
              onClick={() => onNavigate('/projects/new')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/projects/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Bar for Project Workspace (Screen 7 & 8) */}
      {isWorkspace && (
        <div
          className={`border-t px-6 overflow-x-auto ${
            isDark ? 'border-slate-800/80 bg-[#0B0F17]' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
            {workspaceTabs.map((tab) => {
              const isActive = activeWorkspaceTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onWorkspaceTabChange && onWorkspaceTabChange(tab.id)}
                  className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 font-semibold'
                      : isDark
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
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
