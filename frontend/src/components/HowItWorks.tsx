import React, { useState } from 'react'
import {
  UploadCloud,
  Layers,
  GitBranch,
  ShieldCheck,
  Eye,
  MessageSquare,
  FileCheck2,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
} from 'lucide-react'
import {
  DEMO_METADATA,
  DEMO_FLOOR_PLAN,
  DEMO_VIOLATIONS,
  DEMO_COMPLIANCE_RESULTS,
  DEMO_COMPLIANCE_SUMMARY,
  DEMO_GRAPH_DATA,
} from '../demo/sampleData'
import { FloorPlanViewer } from './FloorPlanViewer'
import { InspectionPanel } from './InspectionPanel'
import { ComplianceMatrix } from './ComplianceMatrix'
import { TopologicalGraphViewer } from './TopologicalGraphViewer'
import { RegulatoryChat } from './RegulatoryChat'
import { ReportViewer } from './ReportViewer'
import type { Violation } from '../types/compliance'
import type { CGMRoom } from '../types/geometry'

interface HowItWorksProps {
  onAnalyzeBlueprint: () => void
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onAnalyzeBlueprint }) => {
  // Demo interactive tab state
  const [demoTab, setDemoTab] = useState<'studio' | 'compliance' | 'graph' | 'chat' | 'reports'>('studio')
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(DEMO_VIOLATIONS[0])
  const [selectedRoom, setSelectedRoom] = useState<CGMRoom | null>(null)

  const steps = [
    {
      number: 'STEP 1',
      title: 'Upload Your Blueprint',
      description: 'Upload architectural files in DXF (CAD), Vector PDF, or high-res image (PNG/JPG). BuildWise automatically detects file type, scale units, and layer structures.',
      icon: UploadCloud,
      color: 'from-blue-500 to-indigo-500',
      badge: 'DXF · PDF · PNG · JPG',
    },
    {
      number: 'STEP 2',
      title: 'BuildWise Extracts Geometry',
      description: 'The geometry engine reconstructs a Canonical Geometry Model (CGM). It detects coordinate boundaries, polygonizes rooms, extracts wall axes, and identifies clear door widths, stairs, and emergency exits.',
      icon: Layers,
      color: 'from-indigo-500 to-purple-500',
      badge: 'Walls · Rooms · Doors · Openings · Stairs · Exits',
    },
    {
      number: 'STEP 3',
      title: 'BuildWise Builds the Building Graph',
      description: 'Generates a topological circulation graph via NetworkX connecting habitable spaces, egress corridors, and discharge doors. Computes Dijkstra shortest egress paths and identifies hazardous dead-end corridors.',
      icon: GitBranch,
      color: 'from-cyan-500 to-teal-500',
      badge: 'Rooms · Corridors · Doors · Exits · Egress Paths',
    },
    {
      number: 'STEP 4',
      title: 'NBC 2016 Compliance Analysis',
      description: 'Runs deterministic mathematical evaluations against verified rules from NBC 2016 Volumes 1 & 2. Audits corridor widths, room areas, stair widths, and travel distance limits with zero LLM hallucination.',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-cyan-500',
      badge: 'Measurements · Rules · Requirements · Pass/Fail',
    },
    {
      number: 'STEP 5',
      title: 'Visualize Violations',
      description: 'Violations appear directly on the floor plan canvas. Clicking any violation smoothly pans, zooms, and centers the camera on the affected geometry while displaying exact mathematical shortfall math.',
      icon: Eye,
      color: 'from-amber-500 to-rose-500',
      badge: 'Auto-Focus Zoom · Shortfall Math · Visual Vectors',
    },
    {
      number: 'STEP 6',
      title: 'Ask BuildWise AI',
      description: 'Converse with an AI assistant that cites authoritative NBC 2016 text. Every answer specifies Volume, Part, Section, Clause, and PDF source page for transparent regulatory verification.',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      badge: 'Grounded AI · NBC Clause + Page + Source',
    },
    {
      number: 'STEP 7',
      title: 'Generate Statutory Report',
      description: 'Export structured client reports complete with dimensional inventories, categorical scorecards, remediation targets, insufficient data registries, and statutory legal disclaimers.',
      icon: FileCheck2,
      color: 'from-teal-500 to-emerald-500',
      badge: 'Client Audit PDF · Structured JSON Data',
    },
  ]

  return (
    <div className="flex-1 flex flex-col w-full pb-20">
      {/* Educational Header */}
      <section className="py-14 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 border-b border-slate-800/80 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture & Regulatory Pipeline</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How BuildWise Works
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto font-light">
            From raw architectural drawing to mathematically verified NBC 2016 statutory screening in seven automated steps.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="#interactive-demo"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jump to Interactive Demo</span>
            </a>
            <button
              onClick={onAnalyzeBlueprint}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 7 Step Linear Workflow */}
      <section className="py-16 max-w-5xl mx-auto px-6 w-full">
        <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-8 space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative pl-8 sm:pl-10 group">
                {/* Step Node Marker */}
                <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-xs font-mono font-bold text-indigo-300 shadow-md shadow-indigo-950">
                  {idx + 1}
                </div>

                {/* Step Content Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} text-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-wider text-indigo-400">
                        {step.number}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700/60">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="interactive-demo" className="py-12 bg-slate-950 border-t border-slate-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Demo Callout Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 mb-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold uppercase tracking-wider">
                      Interactive Demo · Sample Project
                    </span>
                    <span className="text-xs text-slate-400">Read-Only Demonstration</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {DEMO_METADATA.project_name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    This interactive demo uses precomputed architectural geometry to demonstrate BuildWise automated screening.
                    Click violations to auto-focus, inspect 3-column measurements, explore the circulation graph, and ask grounded NBC questions.
                  </p>
                </div>
              </div>

              <button
                onClick={onAnalyzeBlueprint}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap"
              >
                <span>Analyze Your Own Blueprint</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Sub-Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setDemoTab('studio')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  demoTab === 'studio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Floor Plan Studio</span>
              </button>

              <button
                onClick={() => setDemoTab('compliance')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  demoTab === 'compliance'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance Matrix ({DEMO_COMPLIANCE_SUMMARY.total_checks})</span>
              </button>

              <button
                onClick={() => setDemoTab('graph')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  demoTab === 'graph'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Egress Graph</span>
              </button>

              <button
                onClick={() => setDemoTab('chat')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  demoTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>NBC AI Assistant</span>
              </button>

              <button
                onClick={() => setDemoTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  demoTab === 'reports'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Audit Report Preview</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Sample Model: Business / Office</span>
            </div>
          </div>

          {/* Interactive Demo Content Area */}
          <div className="w-full">
            {demoTab === 'studio' && (
              <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
                <div className="flex-1 w-full">
                  <FloorPlanViewer
                    floorPlan={DEMO_FLOOR_PLAN}
                    violations={DEMO_VIOLATIONS}
                    selectedViolation={selectedViolation}
                    selectedRoom={selectedRoom}
                    onSelectViolation={(v) => {
                      setSelectedViolation(v)
                      setSelectedRoom(null)
                    }}
                    onSelectRoom={(r) => {
                      setSelectedRoom(r)
                      setSelectedViolation(null)
                    }}
                  />
                </div>

                <InspectionPanel
                  violation={selectedViolation}
                  room={selectedRoom}
                  onClose={() => {
                    setSelectedViolation(null)
                    setSelectedRoom(null)
                  }}
                />
              </div>
            )}

            {demoTab === 'compliance' && (
              <ComplianceMatrix
                summary={DEMO_COMPLIANCE_SUMMARY}
                results={DEMO_COMPLIANCE_RESULTS}
                onInspectResult={(res) => {
                  const matchedViol = DEMO_VIOLATIONS.find((v) => v.rule_id === res.rule_id)
                  if (matchedViol) {
                    setSelectedViolation(matchedViol)
                  }
                  setDemoTab('studio')
                }}
              />
            )}

            {demoTab === 'graph' && <TopologicalGraphViewer graphData={DEMO_GRAPH_DATA} />}

            {demoTab === 'chat' && <RegulatoryChat />}

            {demoTab === 'reports' && (
              <ReportViewer
                runId="demo-sample-01"
                summary={DEMO_COMPLIANCE_SUMMARY}
                results={DEMO_COMPLIANCE_RESULTS}
                buildingMetadata={{
                  total_area_m2: DEMO_FLOOR_PLAN.total_area_m2,
                  floor_count: DEMO_FLOOR_PLAN.floor_count,
                  source_file: DEMO_FLOOR_PLAN.metadata?.source_filename,
                  occupancy: DEMO_METADATA.occupancy_type,
                }}
                floorPlan={DEMO_FLOOR_PLAN}
              />
            )}
          </div>
        </div>
      </section>

      {/* Demo to Real Transition CTA */}
      <section className="py-16 max-w-5xl mx-auto px-6 w-full text-center">
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to analyze your own blueprint?
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
            Experience the real workflow. Upload your own DXF, PDF, or image file and get an instant compliance screening report.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={onAnalyzeBlueprint}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
