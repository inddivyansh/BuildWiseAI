import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { Wireframe3D } from '../components/common/Wireframe3D'
import type { Project } from '../types/project'

interface AnalysisProgressPageProps {
  project: Project
  runId: string
  onNavigate: (route: string) => void
}

export const AnalysisProgressPage: React.FC<AnalysisProgressPageProps> = ({
  project,
  runId,
  onNavigate,
}) => {
  const [status, setStatus] = useState<'processing' | 'complete' | 'failed'>('processing')
  const [stage, setStage] = useState('extracting geometry')
  const [progressPct, setProgressPct] = useState(25)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: any = null

    const poll = async () => {
      try {
        const st = await apiClient.getAnalysisStatus(runId)
        setStatus(st.status as any)
        if (st.stage) setStage(st.stage)
        setProgressPct(st.progress_pct || 10)

        if (st.status === 'complete') {
          clearInterval(timer)
          setTimeout(() => {
            onNavigate(`/projects/${project.id}`)
          }, 1500)
        } else if (st.status === 'failed') {
          setErrorMessage(st.error_message || 'Pipeline evaluation failed.')
          clearInterval(timer)
        }
      } catch {
        // Continue polling
      }
    }

    poll()
    timer = setInterval(poll, 1500)
    return () => clearInterval(timer)
  }, [runId, project.id, onNavigate])

  const stages = [
    { id: 'upload', label: 'File uploaded', detail: 'Drawing validated & hash computed' },
    { id: 'detection', label: 'Detecting file type', detail: 'Vector CAD / PDF format verified' },
    { id: 'geometry', label: 'Extracting geometry', detail: 'Parsing walls, rooms, doors into Canonical Model...' },
    { id: 'graph', label: 'Building graph', detail: 'Analyzing NetworkX connectivity & egress routes...' },
    { id: 'compliance', label: 'Running NBC compliance', detail: 'Checking 100+ statutory rules deterministically...' },
    { id: 'report', label: 'Generating results', detail: 'Finalizing municipal compliance audit report...' },
  ]

  const getStageIndex = () => {
    const s = stage.toLowerCase()
    if (status === 'complete') return 6
    if (s.includes('report') || s.includes('generat')) return 5
    if (s.includes('complian') || s.includes('rule') || s.includes('evaluat')) return 4
    if (s.includes('graph') || s.includes('connect')) return 3
    if (s.includes('cgm') || s.includes('geometr') || s.includes('parse') || s.includes('extract')) return 2
    if (s.includes('detect') || s.includes('valid')) return 1
    return 1
  }

  const currentActiveIdx = getStageIndex()

  return (
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1A2133]">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {project.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                status === 'complete'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-[#6B57FF]/10 text-[#818CF8] border border-[#6B57FF]/30'
              }`}
            >
              {status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {status === 'complete' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
              <span className="capitalize">{status}</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate(`/projects/${project.id}`)}
            className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#6B57FF] transition-colors"
          >
            <span>View Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Processing Card */}
        <div className="mt-8 bg-[#090C14] rounded-3xl border border-[#1A2133] p-8 sm:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-10 items-center text-left">
          {/* Left Column: Real Stage Stepper */}
          <div className="md:col-span-7 space-y-6">
            {stages.map((st, idx) => {
              const isCompleted = idx < currentActiveIdx || status === 'complete'
              const isCurrent = idx === currentActiveIdx && status === 'processing'
              const isPending = idx > currentActiveIdx && status !== 'complete'

              return (
                <div key={st.id} className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-black" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-[#6B57FF] text-white flex items-center justify-center shadow-[0_0_12px_rgba(107,87,255,0.7)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-[#202738] bg-[#06080E] flex items-center justify-center text-slate-600 text-xs font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isCompleted
                            ? 'text-white'
                            : isCurrent
                            ? 'text-[#818CF8] font-black'
                            : 'text-slate-500'
                        }`}
                      >
                        {st.label}
                      </span>
                      {isCurrent && (
                        <span className="text-xs font-mono font-bold text-[#818CF8]">
                          {progressPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-light">
                      {st.detail}
                    </p>

                    {isCurrent && (
                      <div className="w-full h-1.5 bg-[#141A29] rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6B57FF] to-[#00F0FF] transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(progressPct, 15)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-[#FE2857]/10 border border-[#FE2857]/40 text-[#FE2857] text-xs">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Column: Wireframe Graphic & Context */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-8 bg-[#06080E] rounded-2xl border border-[#161D2E]">
            <Wireframe3D className="w-48 h-44 mb-4" accentColor="#6B57FF" isDark={true} />
            <h3 className="text-sm font-bold text-white">
              Processing your blueprint...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs font-light">
              This usually takes 10–30 seconds depending on CAD layer density and geometric entities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
