import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  AlertTriangle,
  GitBranch,
  FileCheck2,
  FileDown,
  FileUp,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Eye,
  Building,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Calendar,
  Compass,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { FloorPlanViewer } from '../components/FloorPlanViewer'
import { InspectionPanel } from '../components/InspectionPanel'
import { ComplianceMatrix } from '../components/ComplianceMatrix'
import { TopologicalGraphViewer } from '../components/TopologicalGraphViewer'
import { RegulatoryChat } from '../components/RegulatoryChat'
import { ReportViewer } from '../components/ReportViewer'
import type { Project, UploadedDocument } from '../types/project'
import type { CanonicalFloorPlan, CGMRoom } from '../types/geometry'
import type { ComplianceResult, ComplianceSummary, Violation } from '../types/compliance'

interface ProjectWorkspacePageProps {
  project: Project
  initialTab?: string
  onNavigate: (route: string) => void
}

export const ProjectWorkspacePage: React.FC<ProjectWorkspacePageProps> = ({
  project,
  initialTab = 'floor-plan',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [latestDoc, setLatestDoc] = useState<UploadedDocument | null>(null)
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)

  // Real data state
  const [floorPlan, setFloorPlan] = useState<CanonicalFloorPlan | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([])
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null)
  const [graphData, setGraphData] = useState<any>(null)

  // Selection state
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<CGMRoom | null>(null)

  // Layer toggles (Screen 7)
  const [layers, setLayers] = useState({
    rooms: true,
    walls: true,
    doors: true,
    windows: true,
    stairs: true,
    exits: true,
    violations: true,
  })

  // Selected floor level in multi-floor models
  const [selectedFloorLevel, setSelectedFloorLevel] = useState(0)

  // Upload trigger
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Load real project data from backend
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // 1. Fetch documents
        const docs = await apiClient.listProjectDocuments(project.id)
        setDocuments(docs.items || [])

        const latest = docs.items?.[0] || null
        setLatestDoc(latest)

        if (!latest) return

        // 2. Fetch latest analysis run
        const runs = await apiClient.getProjectHistory(project.id)
        const latestRun = runs.runs?.[0]
        if (!latestRun) return
        setCurrentRunId(latestRun.id)

        // 3. Fetch CGM (canonical floor plan)
        try {
          const cgm = await apiClient.getFloorPlan(latestRun.id)
          setFloorPlan(cgm)
        } catch {}

        // 4. Fetch compliance results
        try {
          const comp = await apiClient.getComplianceResults(latestRun.id)
          setComplianceResults(comp.results || [])
          setComplianceSummary(comp.summary || null)
        } catch {}

        // 5. Fetch violations
        try {
          const viols = await apiClient.getViolations(latestRun.id)
          setViolations(viols.violations || [])
        } catch {}

        // 6. Fetch graph topology
        try {
          const graph = await apiClient.getGraph(latestRun.id)
          setGraphData(graph)
        } catch {}
      } catch (err) {
        console.error('Failed to load workspace data', err)
      }
    }

    fetchProjectData()
  }, [project.id])

  // File upload handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const doc = await apiClient.uploadDocument(project.id, file)
      const run = await apiClient.startAnalysis(project.id, doc.id, {
        occupancy_type: project.occupancy_type,
      })
      onNavigate(`/projects/${project.id}/analyze?runId=${run.id}`)
    } catch (err) {
      console.error('Upload failed', err)
      setIsUploading(false)
    }
  }

  // Trigger statutory PDF download
  const handleExportPdf = () => {
    if (currentRunId) {
      window.open(apiClient.downloadReportPdfUrl(currentRunId), '_blank')
    } else {
      window.print()
    }
  }

  const complianceScorePct = complianceSummary?.compliance_score_pct ?? 85

  return (
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf,.pdf,.png,.jpg,.jpeg"
        onChange={handleUploadFile}
        className="hidden"
      />

      {/* If no documents uploaded yet, show clean empty upload state */}
      {documents.length === 0 && !floorPlan && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#121624] border border-[#202738] flex items-center justify-center text-[#6B57FF] mb-4">
            <FileUp className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Upload a Blueprint to Begin</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Attach a CAD DXF or vector PDF for {project.name} to run an automated NBC 2016 compliance audit.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 px-6 py-2.5 rounded-xl bg-[#6B57FF] hover:bg-[#7C6AFF] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <FileUp className="w-4 h-4" />
            <span>Select Blueprint File</span>
          </button>
        </div>
      )}

      {/* Main Workspace Tabs Content */}
      {floorPlan && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#090C14] border border-[#1A2133]">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Building Type</div>
                  <div className="text-lg font-bold text-white mt-1">{project.occupancy_type || 'Residential'}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">NBC 2016 Group A</div>
                </div>

                <div className="p-5 rounded-xl bg-[#090C14] border border-[#1A2133]">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Compliance Score</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{complianceScorePct.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {complianceSummary?.passed ?? 0} Passed · {complianceSummary?.failed ?? 0} Failed
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#090C14] border border-[#1A2133]">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Geometry Inventory</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {floorPlan.floors[0]?.rooms?.length ?? 0} Rooms
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {floorPlan.floors[0]?.walls?.length ?? 0} Walls · {floorPlan.floors[0]?.openings?.length ?? 0} Openings
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#090C14] border border-[#1A2133]">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Drawing</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {floorPlan.metadata?.source_filename || 'blueprint.dxf'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    Format: {floorPlan.metadata?.source_format?.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('floor-plan')}
                  className="p-6 rounded-2xl bg-[#090C14] border border-[#1A2133] hover:border-[#6B57FF] hover:shadow-[0_8px_32px_rgba(107,87,255,0.15)] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#121624] border border-[#202738] text-[#6B57FF] flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Explore Floor Plan</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Inspect geometry, click entities to focus, and view real-time architectural measurements.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#6B57FF] mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open Floor Plan <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('compliance')}
                  className="p-6 rounded-2xl bg-[#090C14] border border-[#1A2133] hover:border-[#6B57FF] hover:shadow-[0_8px_32px_rgba(107,87,255,0.15)] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#0A1A12] border border-[#1A3324] text-emerald-400 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Compliance Matrix</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Detailed statutory audit breakdown across Life Safety, Planning, and Egress regulations.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#6B57FF] mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Matrix <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('report')}
                  className="p-6 rounded-2xl bg-[#090C14] border border-[#1A2133] hover:border-[#6B57FF] hover:shadow-[0_8px_32px_rgba(107,87,255,0.15)] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#091520] border border-[#102638] text-cyan-400 flex items-center justify-center mb-3">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Statutory Audit Report</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Export client-ready documentation complete with shortfall tables and NBC legal stamps.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#6B57FF] mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Report <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLOOR PLAN (Screen 7) */}
          {activeTab === 'floor-plan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Panel: Floors & Layers (Screen 7 Left) */}
              <div className="lg:col-span-3 space-y-6 bg-[#090C14] p-5 rounded-2xl border border-[#1A2133]">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Floors
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFloorLevel(0)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        selectedFloorLevel === 0
                          ? 'bg-[#6B57FF]/15 text-[#A594FF] border border-[#6B57FF]/30'
                          : 'text-slate-400 hover:bg-[#0F131F] hover:text-slate-200'
                      }`}
                    >
                      <span>Ground Floor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {floorPlan.floor_count > 1 && (
                      <button
                        onClick={() => setSelectedFloorLevel(1)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          selectedFloorLevel === 1
                            ? 'bg-[#6B57FF]/15 text-[#A594FF] border border-[#6B57FF]/30'
                            : 'text-slate-400 hover:bg-[#0F131F] hover:text-slate-200'
                        }`}
                      >
                        <span>First Floor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1A2133]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Layers
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'rooms', label: 'Rooms', color: 'bg-emerald-500' },
                      { key: 'walls', label: 'Walls', color: 'bg-slate-400' },
                      { key: 'doors', label: 'Doors', color: 'bg-blue-500' },
                      { key: 'windows', label: 'Windows', color: 'bg-amber-400' },
                      { key: 'stairs', label: 'Stairs', color: 'bg-purple-500' },
                      { key: 'exits', label: 'Exits', color: 'bg-rose-500' },
                      { key: 'violations', label: 'Violations', color: 'bg-red-500' },
                    ].map((l) => (
                      <label
                        key={l.key}
                        className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={layers[l.key as keyof typeof layers]}
                          onChange={(e) =>
                            setLayers((prev) => ({ ...prev, [l.key]: e.target.checked }))
                          }
                          className="rounded border-[#2B354F] bg-[#06080E] text-[#6B57FF] focus:ring-0"
                        />
                        <span className={`w-2.5 h-2.5 rounded-full ${l.color} shrink-0`} />
                        <span className="font-medium">{l.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Canvas: Large Floor Plan SVG (Screen 7 Center) */}
              <div className="lg:col-span-6 bg-[#06080E] rounded-2xl overflow-hidden min-h-[500px] border border-[#1A2133] relative flex flex-col">
                <FloorPlanViewer
                  floorPlan={floorPlan}
                  violations={violations}
                  selectedViolation={selectedViolation}
                  selectedRoom={selectedRoom}
                  onSelectViolation={(v) => {
                    setSelectedViolation(v)
                    setSelectedRoom(null)
                  }}
                  onSelectRoom={(r) => {
                    setSelectedRoom(r)
                  }}
                />
              </div>

              {/* Right Panel: Project Summary & Recent Violations (Screen 7 Right) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Project Summary Card */}
                <div className="p-5 rounded-2xl bg-[#090C14] border border-[#1A2133]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">Project Summary</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {complianceScorePct.toFixed(0)}% Compliant
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#161B28] rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${complianceScorePct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-[#1A2133]">
                    <div>
                      <div className="text-base font-bold text-white font-mono">
                        {floorPlan.floors[0]?.rooms?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Rooms</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-rose-400 font-mono">
                        {violations.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Violations</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-white font-mono">
                        {floorPlan.floor_count}
                      </div>
                      <div className="text-[10px] text-slate-500">Floors</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('compliance')}
                    className="w-full mt-3 text-xs font-semibold text-[#6B57FF] hover:text-[#A594FF] text-left flex items-center justify-between transition-colors"
                  >
                    <span>View Compliance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Recent Violations Card */}
                <div className="p-5 rounded-2xl bg-[#090C14] border border-[#1A2133]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Recent Violations ({violations.length})
                  </h4>

                  <div className="space-y-3">
                    {violations.slice(0, 4).map((viol, idx) => (
                      <div
                        key={viol.id}
                        onClick={() => setSelectedViolation(viol)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedViolation?.id === viol.id
                            ? 'bg-rose-950/40 border-rose-700/50'
                            : 'bg-[#06080E] border-[#1A2133] hover:border-[#2B354F]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-900/50 text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white line-clamp-1">
                              {viol.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Measured: {viol.measured_value} {viol.unit} (req. {viol.required_value} {viol.unit})
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLIANCE MATRIX */}
          {activeTab === 'compliance' && complianceSummary && (
            <ComplianceMatrix
              summary={complianceSummary}
              results={complianceResults}
              onInspectResult={(res) => {
                const matched = violations.find((v) => v.rule_id === res.rule_id)
                if (matched) setSelectedViolation(matched)
                setActiveTab('floor-plan')
              }}
            />
          )}

          {/* TAB 4: VIOLATIONS ISSUE TRACKER */}
          {activeTab === 'violations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Violations & Findings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Parametric shortfalls detected against National Building Code of India 2016.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {violations.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl bg-[#090C14] border border-[#1A2133] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-400">{v.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/50 text-rose-400 border border-rose-800/40">
                          {v.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[#06080E] text-center font-mono text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">Measured</div>
                          <div className="font-bold text-rose-400 mt-0.5">{v.measured_value} {v.unit}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">Required</div>
                          <div className="font-bold text-slate-300 mt-0.5">≥ {v.required_value} {v.unit}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">Shortfall</div>
                          <div className="font-bold text-amber-400 mt-0.5">{Math.abs(v.difference || 0)} {v.unit}</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 font-light leading-relaxed">
                        {v.recommendation}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1A2133] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-500">
                        {v.regulation_source}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedViolation(v)
                          setActiveTab('floor-plan')
                        }}
                        className="font-semibold text-[#6B57FF] hover:text-[#A594FF] transition-colors"
                      >
                        View on Floor Plan →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Geometric Measurements</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted physical spatial parameters across architectural geometry.
                </p>
              </div>

              <div className="bg-[#090C14] rounded-2xl border border-[#1A2133] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#06080E] border-b border-[#1A2133] text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3.5">Entity</th>
                      <th className="p-3.5">Measurement Category</th>
                      <th className="p-3.5">Measured Value</th>
                      <th className="p-3.5">Unit</th>
                      <th className="p-3.5">Statutory Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2133]">
                    {floorPlan.floors[0]?.rooms?.map((r) => (
                      <tr key={r.id} className="hover:bg-[#0F131F] transition-colors">
                        <td className="p-3.5 font-medium text-white">{r.label || r.room_type}</td>
                        <td className="p-3.5 text-slate-400">Habitable Room Floor Area</td>
                        <td className="p-3.5 font-mono font-bold text-slate-200">{r.area_m2?.toFixed(2) ?? '0.00'}</td>
                        <td className="p-3.5 text-slate-500">m²</td>
                        <td className="p-3.5 font-mono text-slate-500">NBC 2016 Part 3 Cl 12.2</td>
                      </tr>
                    ))}
                    {floorPlan.floors[0]?.openings?.map((op) => (
                      <tr key={op.id} className="hover:bg-[#0F131F] transition-colors">
                        <td className="p-3.5 font-medium text-white">{op.opening_type} ({op.id})</td>
                        <td className="p-3.5 text-slate-400">Door Clear Opening Width</td>
                        <td className="p-3.5 font-mono font-bold text-slate-200">{op.width_m?.toFixed(2) ?? '0.00'}</td>
                        <td className="p-3.5 text-slate-500">m</td>
                        <td className="p-3.5 font-mono text-slate-500">NBC 2016 Part 4 Sec 4.3</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: EGRESS TOPOLOGY */}
          {activeTab === 'egress' && graphData && (
            <TopologicalGraphViewer graphData={graphData} />
          )}

          {/* TAB 7: AI REGULATORY ASSISTANT */}
          {activeTab === 'assistant' && (
            <div className="max-w-4xl mx-auto w-full">
              <RegulatoryChat />
            </div>
          )}

          {/* TAB 8: STATUTORY REPORT (Screen 8) */}
          {activeTab === 'report' && complianceSummary && (
            <ReportViewer
              runId={currentRunId}
              summary={complianceSummary}
              results={complianceResults}
              buildingMetadata={{
                total_area_m2: floorPlan.total_area_m2,
                floor_count: floorPlan.floor_count,
                source_file: floorPlan.metadata?.source_filename,
                occupancy: project.occupancy_type || 'Residential',
              }}
              floorPlan={floorPlan}
            />
          )}
        </div>
      )}
    </div>
  )
}
