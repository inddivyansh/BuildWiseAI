import React, { useState } from 'react'
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  Eye,
  GitBranch,
  MessageSquare,
  FileCheck2,
  Sparkles,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-react'
import {
  DEMO_FLOOR_PLAN,
  DEMO_VIOLATIONS,
  DEMO_COMPLIANCE_RESULTS,
  DEMO_COMPLIANCE_SUMMARY,
  DEMO_GRAPH_DATA,
} from '../demo/sampleData'
import { FloorPlanViewer } from '../components/FloorPlanViewer'
import { ComplianceMatrix } from '../components/ComplianceMatrix'
import { TopologicalGraphViewer } from '../components/TopologicalGraphViewer'
import { RegulatoryChat } from '../components/RegulatoryChat'
import { ReportViewer } from '../components/ReportViewer'
import type { Violation } from '../types/compliance'
import type { CGMRoom } from '../types/geometry'

interface DemoPageProps {
  onNavigate: (route: string) => void
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'floor-plan' | 'violations' | 'measurements' | 'compliance' | 'assistant' | 'report'>('floor-plan')
  const [selectedViolationIndex, setSelectedViolationIndex] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<CGMRoom | null>(null)

  // Layer toggles
  const [layers, setLayers] = useState({
    rooms: true,
    walls: true,
    doors: true,
    stairs: true,
    exits: true,
    violations: true,
  })

  const currentViolation = DEMO_VIOLATIONS[selectedViolationIndex] || DEMO_VIOLATIONS[0]

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      {/* Top Demo Bar */}
      <div className="border-b border-slate-800 px-6 py-4 bg-[#0B0F17]/95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/how-it-works')}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to How It Works</span>
            </button>
            <span className="text-slate-700">|</span>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                Explore a Sample Analysis
              </h1>
              <p className="text-[11px] text-slate-400">
                Try BuildWise with a pre-computed example project.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Interactive Demo
            </span>

            <button
              onClick={() => onNavigate('/projects/new')}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>Analyze your own blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-800 px-6 bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {[
            { id: 'floor-plan', label: 'Floor Plan' },
            { id: 'violations', label: 'Violations' },
            { id: 'measurements', label: 'Measurements' },
            { id: 'compliance', label: 'Compliance' },
            { id: 'assistant', label: 'AI Assistant' },
            { id: 'report', label: 'Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Studio Canvas */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
        {activeTab === 'floor-plan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Canvas Column (8 cols) - Matches Mockup Screen 3 */}
            <div className="lg:col-span-8 bg-[#090D16] border border-[#1E2536] rounded-2xl overflow-hidden shadow-xl flex flex-col">
              {/* Canvas Top Bar: Floor Selector + Zoom Controls */}
              <div className="px-4 py-3 bg-[#0B0F1A] border-b border-[#1E2536] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select className="bg-[#121624] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer">
                    <option>Ground Floor</option>
                    <option disabled>First Floor</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px] font-mono mr-2">1:100 SCALE</span>
                </div>
              </div>

              {/* Central Floor Plan Viewport */}
              <div className="min-h-[480px] relative flex flex-col bg-[#070A11]">
                <FloorPlanViewer
                  floorPlan={DEMO_FLOOR_PLAN}
                  violations={DEMO_VIOLATIONS}
                  selectedViolation={currentViolation}
                  selectedRoom={selectedRoom}
                  onSelectViolation={(v) => {
                    if (v) {
                      const idx = DEMO_VIOLATIONS.findIndex((item) => item.id === v.id)
                      if (idx >= 0) setSelectedViolationIndex(idx)
                    }
                    setSelectedRoom(null)
                  }}
                  onSelectRoom={(r) => {
                    setSelectedRoom(r)
                  }}
                />
              </div>

              {/* Canvas Bottom Bar: Exact Legend Swatches from Screen 3 */}
              <div className="px-5 py-3 bg-[#0B0F1A] border-t border-[#1E2536] flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  <span>Rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Walls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                  <span>Doors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                  <span>Stairs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                  <span>Exits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 animate-ping" />
                  <span className="text-rose-400 font-semibold">Violations</span>
                </div>
              </div>
            </div>

            {/* Right Violation Inspector Column (4 cols) - Matches Mockup Screen 3 */}
            <div className="lg:col-span-4 bg-[#0C101A] p-6 rounded-2xl border border-[#1E2536] shadow-xl flex flex-col justify-between min-h-[540px]">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300">
                    Violation {selectedViolationIndex + 1} of {DEMO_VIOLATIONS.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setSelectedViolationIndex((prev) =>
                          prev > 0 ? prev - 1 : DEMO_VIOLATIONS.length - 1
                        )
                      }
                      className="p-1 rounded-md bg-[#161D2B] hover:bg-[#20293D] text-slate-300 text-xs px-2"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setSelectedViolationIndex((prev) =>
                          prev < DEMO_VIOLATIONS.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="p-1 rounded-md bg-[#161D2B] hover:bg-[#20293D] text-slate-300 text-xs px-2"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 mt-3">
                  <h3 className="text-base font-bold text-white leading-tight">
                    {currentViolation.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                    Fail
                  </span>
                </div>

                {/* 3 Metric Rows */}
                <div className="mt-5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070A11] border border-[#1A2234]">
                    <span className="text-slate-400 font-sans">Measured:</span>
                    <span className="font-bold text-rose-400">{currentViolation.measured_value} m</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070A11] border border-[#1A2234]">
                    <span className="text-slate-400 font-sans">Required:</span>
                    <span className="font-bold text-slate-200">≥ {currentViolation.required_value} m</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070A11] border border-[#1A2234]">
                    <span className="text-slate-400 font-sans">Shortfall:</span>
                    <span className="font-bold text-rose-400">{Math.abs(currentViolation.difference || 0.5).toFixed(1)} m</span>
                  </div>
                </div>

                {/* NBC Grounded Citation Box */}
                <div className="mt-6 pt-5 border-t border-[#1E2536]">
                  <div className="text-xs font-mono font-bold text-[#818CF8] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>NBC 2016 – Clause 4.3.2</span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-300 font-light leading-relaxed">
                    Minimum corridor width in residential buildings shall be 1.5 metres. Corridors serving habitable rooms must maintain unrestricted egress width without protruding door swings.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#1E2536] mt-6">
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="w-full py-2.5 rounded-xl bg-[#161D2B] hover:bg-[#20293D] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-[#232B3E] transition-colors"
                >
                  <span>View in Document</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Violations Log ({DEMO_VIOLATIONS.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEMO_VIOLATIONS.map((viol) => (
                <div key={viol.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">{viol.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">FAIL</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Measured: {viol.measured_value}m vs Required: {viol.required_value}m
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    {viol.regulation_source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'measurements' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Geometric Measurements</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-mono">
                  <tr>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Measurement</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3">Main Egress Corridor</td>
                    <td className="p-3">Clear Width</td>
                    <td className="p-3 font-mono font-bold text-rose-400">0.80</td>
                    <td className="p-3">m</td>
                    <td className="p-3 text-rose-400 font-semibold">FAIL</td>
                  </tr>
                  <tr>
                    <td className="p-3">Conference Room Door</td>
                    <td className="p-3">Clear Opening</td>
                    <td className="p-3 font-mono font-bold text-rose-400">0.75</td>
                    <td className="p-3">m</td>
                    <td className="p-3 text-rose-400 font-semibold">FAIL</td>
                  </tr>
                  <tr>
                    <td className="p-3">Executive Conference Room</td>
                    <td className="p-3">Floor Area</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">22.50</td>
                    <td className="p-3">m²</td>
                    <td className="p-3 text-emerald-400 font-semibold">PASS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <ComplianceMatrix
            summary={DEMO_COMPLIANCE_SUMMARY}
            results={DEMO_COMPLIANCE_RESULTS}
            onInspectResult={() => setActiveTab('floor-plan')}
          />
        )}

        {activeTab === 'assistant' && <RegulatoryChat />}

        {activeTab === 'report' && (
          <ReportViewer
            runId="demo-sample-01"
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
