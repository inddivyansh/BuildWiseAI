import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from 'lucide-react'
import {
  DEMO_METADATA,
  DEMO_FLOOR_PLAN,
  DEMO_VIOLATIONS,
  DEMO_COMPLIANCE_RESULTS,
  DEMO_COMPLIANCE_SUMMARY,
  DEMO_FINDINGS,
} from '../demo/sampleData'
import { InteractiveDemoStudio } from '../components/demo/InteractiveDemoStudio'
import { ComplianceMatrix } from '../components/ComplianceMatrix'
import { RegulatoryChat } from '../components/RegulatoryChat'
import { ReportViewer } from '../components/ReportViewer'

interface DemoPageProps {
  onNavigate: (route: string) => void
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'interactive-studio' | 'violations' | 'measurements' | 'compliance' | 'assistant' | 'report'>('interactive-studio')

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col font-sans">
      {/* Top Demo Bar */}
      <div className="border-b border-[#1A2234] px-6 py-3.5 bg-[#050811]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/how-it-works')}
              className="p-1.5 rounded-lg bg-[#0F1626] hover:bg-[#182236] text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to How It Works</span>
            </button>
            <span className="text-slate-700">|</span>
            <div className="text-left">
              <h1 className="text-sm font-bold text-white leading-tight">
                {DEMO_METADATA.project_name}
              </h1>
              <p className="text-[11px] text-slate-400">
                Deterministic interactive compliance walkthrough · 2 findings · 5 passing checks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Precomputed Demo
            </span>

            <button
              onClick={() => onNavigate('/projects/new')}
              className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-black text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>Analyze your own blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-[#1A2234] px-6 bg-[#090D1A]">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {[
            { id: 'interactive-studio', label: 'Interactive Blueprint Studio' },
            { id: 'violations', label: 'Violations Inspector' },
            { id: 'measurements', label: 'Extracted Measurements' },
            { id: 'compliance', label: 'Full NBC Matrix' },
            { id: 'assistant', label: 'Regulatory AI Assistant' },
            { id: 'report', label: 'Statutory Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
        {/* 1. Interactive Studio Tab (The Centerpiece) */}
        {activeTab === 'interactive-studio' && (
          <InteractiveDemoStudio onNavigate={onNavigate} isEmbedded={false} />
        )}

        {/* 2. Violations Inspector Tab */}
        {activeTab === 'violations' && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Deliberate Demo Findings (2 Violations)</h2>
                <p className="text-xs text-slate-400">
                  Precomputed deterministic non-compliances evaluated against NBC 2016 Part 4.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('interactive-studio')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View on Blueprint Canvas →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEMO_FINDINGS.filter((f) => f.category === 'violation').map((viol) => (
                <div key={viol.id} className="p-5 rounded-2xl bg-[#0C1220] border border-[#1E293B] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{viol.severity} VIOLATION</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                        {viol.rule_id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{viol.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">Entity: {viol.entity_name}</p>

                    <div className="grid grid-cols-3 gap-2 my-4 text-center font-mono text-xs">
                      <div className="p-2 rounded-xl bg-[#060912] border border-[#182236]">
                        <span className="text-[10px] text-slate-400 block uppercase">Measured</span>
                        <span className="font-bold text-rose-400 text-sm">{viol.measured_value} {viol.unit}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#060912] border border-[#182236]">
                        <span className="text-[10px] text-slate-400 block uppercase">Required</span>
                        <span className="font-bold text-slate-200 text-sm">≥ {viol.required_value} {viol.unit}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#060912] border border-[#182236]">
                        <span className="text-[10px] text-slate-400 block uppercase">Shortfall</span>
                        <span className="font-bold text-rose-400 text-sm">{viol.difference} {viol.unit}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{viol.why_it_fails_or_passes}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#182236] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{viol.clause}</span>
                    <span className="text-indigo-400">Page {viol.source_page}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Measurements Tab */}
        {activeTab === 'measurements' && (
          <div className="space-y-4 text-left">
            <h2 className="text-lg font-bold text-white">Extracted Geometric Measurements</h2>
            <p className="text-xs text-slate-400">
              Vector measurements extracted deterministically from the sample CAD blueprint geometry.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-[#1E293B] bg-[#0A0F1D]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0D1424] text-slate-400 font-mono border-b border-[#1E293B]">
                  <tr>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Parameter</th>
                    <th className="p-3.5">Measured Value</th>
                    <th className="p-3.5">Statutory Threshold</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Statutory Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162035]">
                  {DEMO_FINDINGS.map((finding) => (
                    <tr key={finding.id} className="hover:bg-[#0E1628] transition-colors">
                      <td className="p-3.5 font-medium text-white">{finding.entity_name}</td>
                      <td className="p-3.5 text-slate-300">{finding.rule_title}</td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        {finding.measured_value} {finding.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {finding.rule_id.includes('TD') ? '≤ ' : '≥ '}
                        {finding.required_value} {finding.unit}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            finding.status === 'FAIL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {finding.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {finding.clause} (P. {finding.source_page})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Full NBC Compliance Matrix */}
        {activeTab === 'compliance' && (
          <ComplianceMatrix
            summary={DEMO_COMPLIANCE_SUMMARY}
            results={DEMO_COMPLIANCE_RESULTS}
            onInspectResult={() => setActiveTab('interactive-studio')}
          />
        )}

        {/* 5. AI Regulatory Assistant */}
        {activeTab === 'assistant' && <RegulatoryChat />}

        {/* 6. Statutory Report */}
        {activeTab === 'report' && (
          <ReportViewer
            runId="demo-sample-apex-01"
            summary={DEMO_COMPLIANCE_SUMMARY}
            results={DEMO_COMPLIANCE_RESULTS}
            buildingMetadata={{
              total_area_m2: DEMO_FLOOR_PLAN.total_area_m2,
              floor_count: DEMO_FLOOR_PLAN.floor_count,
              source_file: DEMO_FLOOR_PLAN.metadata?.source_filename,
              occupancy: 'Business / Office',
            }}
            floorPlan={DEMO_FLOOR_PLAN}
          />
        )}
      </div>
    </div>
  )
}
