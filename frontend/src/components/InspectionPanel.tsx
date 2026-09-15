import React from 'react'
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import type { Violation } from '../types/compliance'
import type { CGMRoom } from '../types/geometry'

interface InspectionPanelProps {
  violation?: Violation | null
  room?: CGMRoom | null
  onClose: () => void
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  violation,
  room,
  onClose,
}) => {
  if (!violation && !room) return null

  return (
    <div className="w-96 glass-panel border border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto max-h-[620px] shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            {violation ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  violation.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : violation.severity === 'MAJOR'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {violation.severity} NON-COMPLIANCE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                SPACE INSPECTOR
              </span>
            )}

            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              UNVERIFIED NBC
            </span>
          </div>

          <h3 className="text-base font-semibold text-white mt-1.5 leading-snug">
            {violation ? violation.title : room?.label || room?.room_type.replace('_', ' ')}
          </h3>
          <p className="text-xs text-slate-400">
            {violation ? `Rule ID: ${violation.rule_id}` : `Space Type: ${room?.room_type}`}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Measurement vs Requirement Card */}
      {violation && (
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800/80 flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Parametric Comparison
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Measured Value</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                {violation.measured_value !== undefined ? violation.measured_value.toFixed(2) : '—'}{' '}
                <span className="text-xs font-normal text-slate-400">{violation.unit}</span>
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Statutory Required</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {violation.required_value !== undefined ? violation.required_value.toFixed(2) : '—'}{' '}
                <span className="text-xs font-normal text-slate-400">{violation.unit}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Regulation Source:</span>
            <span className="text-slate-200 font-medium">{violation.regulation_source}</span>
          </div>
        </div>
      )}

      {/* Room Geometric Properties */}
      {room && (
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800/80 flex flex-col gap-2 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Geometric Properties
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Floor Area</span>
            <span className="font-mono text-white font-semibold">
              {room.area_m2 ? `${room.area_m2.toFixed(2)} m²` : 'Not computed'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Confidence Level</span>
            <span className="font-medium text-emerald-400 uppercase">{room.confidence}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Floor Level</span>
            <span className="font-mono text-slate-300">Level {room.floor_level}</span>
          </div>
        </div>
      )}

      {/* Actionable Engineering Recommendation */}
      {violation?.recommendation && (
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Corrective Recommendation</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{violation.recommendation}</p>
        </div>
      )}

      {/* AI Plain-Language Explanation (Gemini) */}
      {violation?.llm_explanation && (
        <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-3.5 text-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Code Interpretation (Gemini)</span>
          </div>

          <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
            {violation.llm_explanation}
          </p>
        </div>
      )}
    </div>
  )
}
