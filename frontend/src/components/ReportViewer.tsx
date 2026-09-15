import React from 'react'
import { FileText, Download, Printer, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { apiClient } from '../api/client'
import type { ComplianceResult, ComplianceSummary } from '../types/compliance'

interface ReportViewerProps {
  runId?: string | null
  summary?: ComplianceSummary
  results: ComplianceResult[]
  buildingMetadata?: {
    total_area_m2?: number
    floor_count?: number
    source_file?: string
    occupancy?: string
  }
  floorPlan?: any
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  runId,
  summary,
  results,
  buildingMetadata,
  floorPlan,
}) => {
  const handlePrint = () => {
    window.print()
  }

  const failedResults = results.filter((r) => r.status === 'FAIL')
  const insufficientResults = results.filter((r) => r.status === 'INSUFFICIENT_DATA')
  const verifiedPassed = results.filter((r) => r.status === 'PASS')

  const totalRooms = floorPlan?.floors?.reduce((acc: number, f: any) => acc + (f.rooms?.length || 0), 0) ?? 4
  const totalWalls = floorPlan?.floors?.reduce((acc: number, f: any) => acc + (f.walls?.length || 0), 0) ?? 12
  const totalOpenings = floorPlan?.floors?.reduce((acc: number, f: any) => acc + (f.openings?.length || 0), 0) ?? 4
  const totalStairs = floorPlan?.floors?.reduce((acc: number, f: any) => acc + (f.stairs?.length || 0), 0) ?? 1
  const totalExits = floorPlan?.floors?.reduce((acc: number, f: any) => acc + (f.exits?.length || 0), 0) ?? 1

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

        {/* 1. INPUT & GEOMETRY SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Input Document & Context
            </span>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Source Document</span>
              <span className="font-mono text-white font-medium">
                {buildingMetadata?.source_file || floorPlan?.metadata?.source_filename || 'blueprint_plan.dxf'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Format Pipeline</span>
              <span className="font-mono text-cyan-400 uppercase font-medium">
                {floorPlan?.metadata?.source_format?.toUpperCase() || 'DXF / VECTOR CAD'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Occupancy Classification</span>
              <span className="font-semibold text-indigo-300">
                {buildingMetadata?.occupancy || 'Business / Office'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Floors Analyzed</span>
              <span className="font-mono text-slate-200">
                {buildingMetadata?.floor_count || floorPlan?.floor_count || 1} Level(s)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Extracted Canonical Geometry
            </span>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rooms</span>
                <span className="text-base font-bold font-mono text-white">{totalRooms}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Walls</span>
                <span className="text-base font-bold font-mono text-white">{totalWalls}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Openings</span>
                <span className="text-base font-bold font-mono text-cyan-400">{totalOpenings}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Stairs</span>
                <span className="text-base font-bold font-mono text-rose-400">{totalStairs}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Exits</span>
                <span className="text-base font-bold font-mono text-emerald-400">{totalExits}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Area</span>
                <span className="text-base font-bold font-mono text-slate-200">
                  {buildingMetadata?.total_area_m2 ? `${buildingMetadata.total_area_m2.toFixed(1)}m²` : '63.8 m²'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. EXECUTIVE SUMMARY */}
        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            3. Executive Compliance Assessment
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This automated compliance screening audit evaluated spatial and topological attributes against
            NBC 2016 statutory clauses. Results are categorized into definitive Passes, Actionable Non-Compliances,
            and items with Insufficient Geometric Data.
          </p>

          <div className="grid grid-cols-4 gap-4 mt-2 pt-3 border-t border-slate-800/80 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Status</span>
              <span
                className={`text-xl font-bold font-display ${
                  failedResults.length > 0
                    ? 'text-rose-400'
                    : insufficientResults.length > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {failedResults.length > 0 ? 'FAIL' : insufficientResults.length > 0 ? 'INSUFFICIENT DATA' : 'PASS'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Passed</span>
              <span className="text-xl font-bold text-emerald-400 font-display">{verifiedPassed.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Violations</span>
              <span className="text-xl font-bold text-rose-400 font-display">{failedResults.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Insufficient Data</span>
              <span className="text-xl font-bold text-amber-400 font-display">{insufficientResults.length}</span>
            </div>
          </div>
        </div>

        {/* 4. NON-COMPLIANCE VIOLATIONS LIST */}
        {failedResults.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>4. Non-Compliance Violations & Advisory Corrective Actions</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {failedResults.map((r) => (
                <div key={r.id} className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{r.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {r.severity}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 my-2 text-[11px] font-mono">
                    <span className="text-slate-400">
                      Measured: <strong className="text-rose-300">{r.measured_value?.toFixed(2)} {r.unit}</strong>
                    </span>
                    <span className="text-slate-400">
                      Required: <strong className="text-emerald-300">{r.required_value?.toFixed(2)} {r.unit}</strong>
                    </span>
                    <span className="text-slate-400">
                      Shortfall:{' '}
                      <strong className="text-amber-300">
                        {r.measured_value && r.required_value ? (r.measured_value - r.required_value).toFixed(2) : '—'} {r.unit}
                      </strong>
                    </span>
                  </div>
                  <div className="text-slate-300 mt-1">
                    <strong className="text-indigo-300">Recommendation:</strong> {r.recommendation}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Clause: <span className="text-cyan-300 font-mono">{r.statutory_clause || r.regulation_source}</span>
                    {r.source_page && ` · Page ${r.source_page}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INSUFFICIENT DATA FINDINGS */}
        {insufficientResults.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              5. Unevaluated Items (Insufficient Geometric Data)
            </h4>
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-slate-300">
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                {insufficientResults.map((r) => (
                  <li key={r.id}>
                    <strong className="text-slate-200">{r.title}:</strong> {r.description || 'Requires supplementary CAD geometry or explicit label tagging before statutory evaluation.'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 6. COMPREHENSIVE COMPLIANCE MATRIX TABLE */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            6. Complete Rule Verification Registry
          </h4>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Rule</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Measured</th>
                  <th className="p-3">Required</th>
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
                            : r.status === 'FAIL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.status}
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

        {/* 7. REGULATORY SOURCES & STATUTORY DISCLAIMER */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span>Authoritative Regulatory Source:</span>
            <span className="text-cyan-400 font-mono">National Building Code of India (NBC 2016)</span>
          </div>
          <p className="text-slate-400">
            Rules evaluated derive strictly from Volume 1 (Part 3 Development Control & Part 4 Fire & Life Safety)
            and Volume 2 (Part 8 Building Services).
          </p>
          <div className="pt-2 border-t border-slate-800 text-slate-400">
            <strong className="text-slate-200">Statutory Disclaimer:</strong> "BuildWise AI provides automated preliminary
            compliance screening and does not replace review by a qualified architect, engineer, or competent authority."
          </div>
        </div>
      </div>
    </div>
  )
}
