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
          // Auto transition to project workspace after 1.5s
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
    { id: 'upload', label: 'File uploaded', detail: 'Drawing validated' },
    { id: 'detection', label: 'Detecting file type', detail: 'Vector CAD / PDF' },
    { id: 'geometry', label: 'Extracting geometry', detail: 'Parsing walls, rooms, doors...' },
    { id: 'graph', label: 'Building graph', detail: 'Analyzing connectivity & egress...' },
    { id: 'compliance', label: 'Running NBC compliance', detail: 'Checking statutory rules...' },
    { id: 'report', label: 'Generating results', detail: 'Finalizing audit report...' },
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Top Header (Screen 6) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                status === 'complete'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : status === 'failed'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {status === 'complete' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {status === 'failed' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
              <span className="capitalize">{status}</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate(`/projects/${project.id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Processing Card */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
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
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isCompleted
                            ? 'text-slate-800'
                            : isCurrent
                            ? 'text-indigo-600 font-extrabold'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.label}
                      </span>
                      {isCurrent && (
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {progressPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {st.detail}
                    </p>

                    {isCurrent && (
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(progressPct, 15)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Column: Wireframe Graphic & Context */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
            <Wireframe3D className="w-48 h-44 mb-4" accentColor="#4f46e5" isDark={false} />
            <h3 className="text-sm font-bold text-slate-900">
              Processing your blueprint...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs font-light">
              This usually takes 10–30 seconds depending on file complexity and geometric layer count.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
