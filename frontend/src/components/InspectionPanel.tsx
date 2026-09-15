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
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Parametric Assessment
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                violation.status === 'FAIL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : violation.status === 'PASS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : violation.status === 'INSUFFICIENT_DATA'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}
            >
              {violation.status}
            </span>
          </div>

          {/* 3-Column Parametric Comparison */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-medium uppercase">Measured</span>
              <span className="text-base font-bold font-mono text-rose-400 block mt-0.5">
                {violation.measured_value !== undefined ? violation.measured_value.toFixed(2) : '—'}{' '}
                <span className="text-[10px] font-normal text-slate-400">{violation.unit}</span>
              </span>
            </div>

            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-medium uppercase">Required</span>
              <span className="text-base font-bold font-mono text-emerald-400 block mt-0.5">
                {violation.required_value !== undefined ? violation.required_value.toFixed(2) : '—'}{' '}
                <span className="text-[10px] font-normal text-slate-400">{violation.unit}</span>
              </span>
            </div>

            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-medium uppercase">Difference</span>
              {violation.measured_value !== undefined && violation.required_value !== undefined ? (
                (() => {
                  const diff = violation.measured_value - violation.required_value
                  return (
                    <span
                      className={`text-base font-bold font-mono block mt-0.5 ${
                        diff < 0 ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">{violation.unit}</span>
                    </span>
                  )
                })()
              ) : (
                <span className="text-base font-bold font-mono text-slate-500 block mt-0.5">—</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>NBC 2016</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Confidence: {violation.confidence || 'HIGH'}
            </span>
          </div>

          {/* Statutory Provenance */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] flex flex-col gap-1 mt-0.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Regulation:</span>
              <span className="text-slate-200 font-medium">{violation.statutory_volume || violation.regulation_source || 'NBC 2016'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Clause:</span>
              <strong className="text-cyan-300 font-mono">{violation.statutory_clause || 'Part 4 Egress / Part 3 Planning'}</strong>
            </div>
            {violation.source_page && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Source PDF Page:</span>
                <span className="text-slate-200 font-mono">Page {violation.source_page}</span>
              </div>
            )}
            {violation.verbatim_statutory_text && (
              <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 italic">
                "{violation.verbatim_statutory_text}"
              </div>
            )}
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
            <span>Deterministic Corrective Action</span>
          </div>
          <p className="text-slate-200 leading-relaxed font-medium">{violation.recommendation}</p>
          <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-indigo-500/20 italic">
            The recommendation is advisory and must not be represented as a guaranteed statutory solution.
          </p>
        </div>
      )}

      {/* AI Plain-Language Explanation (Gemini) — Clearly Separated */}
      {violation?.llm_explanation && (
        <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-3.5 text-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Interpretive Summary (Non-Statutory)</span>
            </div>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Gemini RAG
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
            {violation.llm_explanation}
          </p>
        </div>
      )}
    </div>
  )
}
