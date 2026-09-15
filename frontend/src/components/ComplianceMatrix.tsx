import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Eye,
  ArrowUpRight,
  Search,
} from 'lucide-react'
import type { ComplianceResult, ComplianceSummary } from '../types/compliance'

interface ComplianceMatrixProps {
  summary?: ComplianceSummary
  results: ComplianceResult[]
  onInspectResult?: (result: ComplianceResult) => void
}

export const ComplianceMatrix: React.FC<ComplianceMatrixProps> = ({
  summary,
  results,
  onInspectResult,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredResults = results.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'FLAGGED'
        ? r.status === 'FAIL' || r.status === 'UNVERIFIED' || r.status === 'WARNING'
        : r.status === statusFilter

    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.regulation_source && r.regulation_source.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesStatus && matchesSearch
  })

  const score = summary?.compliance_score_pct ?? 100

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6">
      {/* Top Scorecard & Statistics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Score Card */}
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compliance Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display font-extrabold text-3xl text-white">
                {score.toFixed(1)}%
              </span>
              <span
                className={`text-xs font-semibold ${
                  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {score >= 80 ? 'Good Standing' : 'Action Required'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {summary?.passed ?? 0} of {summary?.total_checks ?? results.length} checks satisfied
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
        </div>

        {/* Total Checks */}
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-l-cyan-500">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Checks
            </span>
            <div className="font-display font-extrabold text-3xl text-white mt-1">
              {summary?.total_checks ?? results.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              NBC 2016 parametric audits
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Filter className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Flagged / Unverified */}
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Flagged Deviations
            </span>
            <div className="font-display font-extrabold text-3xl text-purple-400 mt-1">
              {(summary?.failed ?? 0) + (summary?.unverified ?? 0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Awaiting verification / non-compliant
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Verified Pass */}
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compliant Checks
            </span>
            <div className="font-display font-extrabold text-3xl text-emerald-400 mt-1">
              {summary?.passed ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Satisfies code thresholds
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'FLAGGED', 'PASS', 'INSUFFICIENT_DATA'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st === 'ALL'
                ? 'All Checks'
                : st === 'FLAGGED'
                ? 'Deviations / Unverified'
                : st === 'PASS'
                ? 'Passed'
                : 'Insufficient Data'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rule or clause..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-3">
        {filteredResults.map((result) => {
          const isPass = result.status === 'PASS'
          const isFlagged = result.status === 'UNVERIFIED' || result.status === 'FAIL'
          const isCrit = result.severity === 'CRITICAL'

          return (
            <div
              key={result.id}
              className="glass-card p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800/80 hover:border-indigo-500/40"
            >
              <div className="flex items-start gap-3.5 flex-1">
                {/* Status Icon */}
                <div className="mt-0.5">
                  {isPass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isFlagged ? (
                    <AlertTriangle className={`w-5 h-5 ${isCrit ? 'text-rose-400' : 'text-purple-400'}`} />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {result.rule_id}
                    </span>
                    {result.status === 'UNVERIFIED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        REQUIRES VERIFICATION
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isCrit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {result.status}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      • {result.severity}
                    </span>
                    {result.verification_status === 'VERIFIED' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        NBC VERIFIED
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white mt-1">{result.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{result.description}</p>

                  {/* Grounded Clause and Page */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                    <span>
                      <strong className="text-slate-300">Clause:</strong>{' '}
                      {result.statutory_clause || 'Part 4'}
                    </span>
                    {result.source_page && (
                      <span>
                        <strong className="text-slate-300">Page:</strong> {result.source_page}
                      </span>
                    )}
                    <span>
                      <strong className="text-slate-300">Confidence:</strong>{' '}
                      <span className={result.confidence === 'high' ? 'text-emerald-400' : 'text-amber-400'}>
                        {result.confidence.toUpperCase()}
                      </span>
                    </span>
                  </div>

                  {result.recommendation && (
                    <p className="text-xs text-indigo-300/90 mt-1.5 bg-indigo-950/20 p-2 rounded-lg border border-indigo-500/20">
                      💡 <strong>Recommendation:</strong> {result.recommendation}
                    </p>
                  )}
                </div>
              </div>

              {/* Parametric Measurements & Citation */}
              <div className="flex items-center gap-6 text-right md:border-l md:border-slate-800 md:pl-6">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Measured / Required
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-200 mt-0.5">
                    {result.measured_value !== undefined ? result.measured_value.toFixed(2) : '—'}{' '}
                    {result.unit} /{' '}
                    <span className="text-slate-400">
                      {result.required_value !== undefined ? `≥ ${result.required_value.toFixed(2)}` : '—'}{' '}
                      {result.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 block mt-0.5">
                    {result.statutory_volume || result.regulation_source}
                  </span>
                </div>

                {onInspectResult && (
                  <button
                    onClick={() => onInspectResult(result)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-sm"
                    title="Inspect space"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filteredResults.length === 0 && (
          <div className="glass-panel p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">No compliance checks match the current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
