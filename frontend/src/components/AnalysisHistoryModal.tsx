import React from 'react'
import {
  History,
  X,
  FileCode,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react'

export interface AnalysisHistoryRecord {
  id: string
  run_number: number
  project_id: string
  document_id: string
  document_filename?: string
  occupancy_type?: string
  status: string
  stage?: string
  created_at: string
  completed_at?: string
  passed_count: number
  failed_count: number
  insufficient_count: number
  total_checks: number
  score_pct?: number
}

interface AnalysisHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  history: AnalysisHistoryRecord[]
  currentRunId?: string | null
  onSelectRun: (runId: string) => void
}

export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  currentRunId,
  onSelectRun,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl p-6 border border-slate-700/80 shadow-2xl relative rounded-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">Project Analysis History</h3>
              <p className="text-xs text-slate-400">
                Audit iteration records for design evolution & statutory verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No previous analysis runs found for this project. Upload a blueprint to begin Analysis #1.
            </div>
          ) : (
            history.map((item) => {
              const isCurrent = currentRunId === item.id
              const isFail = item.failed_count > 0 || item.status === 'failed'
              const isPass = item.failed_count === 0 && item.passed_count > 0

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col gap-2.5 ${
                    isCurrent
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Analysis #{item.run_number}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          ACTIVE VIEW
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isFail
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isFail ? 'FAIL' : isPass ? 'PASS' : 'INSUFFICIENT DATA'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectRun(item.id)
                        onClose()
                      }}
                      disabled={isCurrent}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-indigo-600 disabled:opacity-40 transition-colors"
                    >
                      <span>Load Snapshot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Input Document</span>
                      <span className="font-mono text-slate-200 text-[11px] truncate block">
                        {item.document_filename || 'blueprint.dxf'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Occupancy</span>
                      <span className="font-medium text-indigo-300 text-[11px]">
                        {item.occupancy_type || 'Business/Office'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Compliance Stats</span>
                      <span className="text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">{item.passed_count}P</span> ·{' '}
                        <span className="text-rose-400 font-bold">{item.failed_count}F</span> ·{' '}
                        <span className="text-amber-400 font-bold">{item.insufficient_count}I</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Timestamp</span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
