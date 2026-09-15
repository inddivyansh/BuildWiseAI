import React from 'react'
import { FileText, Download, Printer, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { apiClient } from '../api/client'
import type { ComplianceResult, ComplianceSummary } from '../types/compliance'

interface ReportViewerProps {
  runId?: string | null
  summary?: ComplianceSummary
  results: ComplianceResult[]
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  runId,
  summary,
  results,
}) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6">
      {/* Action Bar */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Official NBC Compliance Audit Report
            </h3>
            <p className="text-xs text-slate-400">
              Run ID: <span className="font-mono text-slate-300">{runId || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>

          {runId && (
            <a
              href={apiClient.downloadReportJsonUrl(runId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all shadow-md shadow-indigo-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON Audit
            </a>
          )}
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="glass-panel p-8 flex flex-col gap-6 bg-slate-900/60 border border-slate-800">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">
              BUILDWISE AI — STATUTORY COMPLIANCE REPORT
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              National Building Code of India (NBC 2016) Screening & Verification Audit
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Audit Date
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Executive Summary
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This automated compliance screening audit evaluated the spatial and topological
            attributes of the provided architectural blueprint against NBC 2016 statutory clauses,
            focusing on fire and life safety, egress capacities, travel distances, and room
            dimensions.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-2 pt-3 border-t border-slate-800/80 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Compliance Score</span>
              <span className="text-2xl font-bold text-white font-display">
                {summary?.compliance_score_pct.toFixed(1) ?? '100'}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Checks</span>
              <span className="text-2xl font-bold text-cyan-400 font-display">
                {summary?.total_checks ?? results.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Flagged Items</span>
              <span className="text-2xl font-bold text-rose-400 font-display">
                {(summary?.failed ?? 0) + (summary?.unverified ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Findings Table */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Regulatory Evaluation Findings
          </h4>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Rule</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Measurement</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">NBC Citation</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="p-3">
                      <strong className="text-white block font-mono text-[11px]">{r.rule_id}</strong>
                      <span className="text-slate-400 text-[11px]">{r.title}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.status === 'UNVERIFIED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {r.status === 'UNVERIFIED' ? 'REQUIRES VERIFICATION' : r.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-200">
                      {r.measured_value !== undefined ? r.measured_value.toFixed(2) : '—'} {r.unit}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {r.required_value !== undefined ? `≥ ${r.required_value.toFixed(2)}` : '—'} {r.unit}
                    </td>
                    <td className="p-3 text-[11px]">
                      <span className="text-cyan-400 font-mono block">
                        {r.statutory_clause || r.regulation_source}
                      </span>
                      {r.source_page && (
                        <span className="text-slate-400 text-[10px]">Page {r.source_page}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold ${r.confidence === 'high' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {r.confidence.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Statutory Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Legal Disclaimer:</strong> BuildWise AI provides automated preliminary
          compliance screening and does not replace review by a qualified architect, engineer, or competent authority.
        </div>
      </div>
    </div>
  )
}
