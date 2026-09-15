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
        const docsRes = await apiClient.listProjectDocuments(project.id)
        setDocuments(docsRes.items || [])
        if (docsRes.items && docsRes.items.length > 0) {
          setLatestDoc(docsRes.items[0])
        }

        const histRes = await apiClient.getProjectHistory(project.id)
        if (histRes.runs && histRes.runs.length > 0) {
          const run = histRes.runs[0]
          setCurrentRunId(run.id)
          if (run.status === 'complete') {
            await loadRunData(run.id)
          } else if (run.status === 'processing' || run.status === 'queued') {
            onNavigate(`/projects/${project.id}/analyze?runId=${run.id}`)
          }
        }
      } catch (err) {
        console.error('Failed to load project details', err)
      }
    }

    fetchProjectData()
  }, [project.id])

  const loadRunData = async (runId: string) => {
    try {
      setCurrentRunId(runId)
      const fp = await apiClient.getFloorPlan(runId)
      const viols = await apiClient.getViolations(runId)
      const comp = await apiClient.getComplianceResults(runId)
      const graph = await apiClient.getGraph(runId)

      setFloorPlan(fp)
      setViolations(viols.violations || [])
      setComplianceResults(comp.results || [])
      setComplianceSummary(comp.summary || null)
      setGraphData(graph)

      if (viols.violations && viols.violations.length > 0) {
        setSelectedViolation(viols.violations[0])
      }
    } catch (err) {
      console.error('Failed to load run snapshot', err)
    }
  }

  // Handle uploading a new revision
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const uploadedDoc = await apiClient.uploadDocument(project.id, file)
      const run = await apiClient.startAnalysis(project.id, uploadedDoc.id, {
        occupancy_type: project.occupancy_type || 'Residential',
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf,.pdf,.png,.jpg,.jpeg"
        onChange={handleUploadFile}
        className="hidden"
      />

      {/* Top Application Workspace Header (Screen 7 & 8) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 font-bold text-base text-slate-900 tracking-tight"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span>BuildWise</span>
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => onNavigate('/projects')}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Projects
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPdf}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Analyze Blueprint</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="border-t border-slate-200 px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'floor-plan', label: 'Floor Plan' },
              { id: 'compliance', label: 'Compliance' },
              { id: 'violations', label: 'Violations' },
              { id: 'measurements', label: 'Measurements' },
              { id: 'egress', label: 'Egress' },
              { id: 'assistant', label: 'AI Assistant' },
              { id: 'report', label: 'Report' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* If no documents uploaded yet, show clean empty upload state */}
      {documents.length === 0 && !floorPlan && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <FileUp className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Upload a Blueprint to Begin</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Attach a CAD DXF or vector PDF for {project.name} to run an automated NBC 2016 compliance audit.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2"
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
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Building Type</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{project.occupancy_type || 'Residential'}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">NBC 2016 Group A</div>
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Compliance Score</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">{complianceScorePct.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {complianceSummary?.passed ?? 0} Passed · {complianceSummary?.failed ?? 0} Failed
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Geometry Inventory</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {floorPlan.floors[0]?.rooms?.length ?? 0} Rooms
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {floorPlan.floors[0]?.walls?.length ?? 0} Walls · {floorPlan.floors[0]?.openings?.length ?? 0} Openings
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Drawing</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">
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
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Explore Floor Plan</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Inspect geometry, click entities to focus, and view real-time architectural measurements.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 mt-4 flex items-center gap-1">
                    Open Floor Plan <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('compliance')}
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Compliance Matrix</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Detailed statutory audit breakdown across Life Safety, Planning, and Egress regulations.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 mt-4 flex items-center gap-1">
                    View Matrix <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('report')}
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Statutory Audit Report</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Export client-ready documentation complete with shortfall tables and NBC legal stamps.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 mt-4 flex items-center gap-1">
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
              <div className="lg:col-span-3 space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Floors
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFloorLevel(0)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        selectedFloorLevel === 0
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50'
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
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>First Floor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Layers
                  </h4>
                  <div className="space-y-2 text-xs">
                    {Object.keys(layers).map((lKey) => (
                      <label
                        key={lKey}
                        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer select-none capitalize"
                      >
                        <input
                          type="checkbox"
                          checked={layers[lKey as keyof typeof layers]}
                          onChange={(e) =>
                            setLayers((prev) => ({ ...prev, [lKey]: e.target.checked }))
                          }
                          className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                        />
                        <span>{lKey}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Canvas: Large Floor Plan SVG (Screen 7 Center) */}
              <div className="lg:col-span-6 bg-slate-900 rounded-2xl overflow-hidden min-h-[500px] border border-slate-800 shadow-xs relative flex flex-col">
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
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Project Summary</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {complianceScorePct.toFixed(0)}% Compliant
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${complianceScorePct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-100">
                    <div>
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {floorPlan.floors[0]?.rooms?.length ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Rooms</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-rose-600 font-mono">
                        {violations.length}
                      </div>
                      <div className="text-[10px] text-slate-400">Violations</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {floorPlan.floor_count}
                      </div>
                      <div className="text-[10px] text-slate-400">Floors</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('compliance')}
                    className="w-full mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 text-left flex items-center justify-between"
                  >
                    <span>View Compliance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Recent Violations Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Recent Violations ({violations.length})
                  </h4>

                  <div className="space-y-3">
                    {violations.slice(0, 4).map((viol, idx) => (
                      <div
                        key={viol.id}
                        onClick={() => setSelectedViolation(viol)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedViolation?.id === viol.id
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 line-clamp-1">
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
                  <h2 className="text-xl font-bold text-slate-900">Violations & Findings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Parametric shortfalls detected against National Building Code of India 2016.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {violations.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600">{v.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {v.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-50 text-center font-mono text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">Measured</div>
                          <div className="font-bold text-rose-600 mt-0.5">{v.measured_value} {v.unit}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">Required</div>
                          <div className="font-bold text-slate-700 mt-0.5">≥ {v.required_value} {v.unit}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans">Shortfall</div>
                          <div className="font-bold text-amber-600 mt-0.5">{Math.abs(v.difference || 0)} {v.unit}</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 font-light leading-relaxed">
                        {v.recommendation}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-400">
                        {v.regulation_source}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedViolation(v)
                          setActiveTab('floor-plan')
                        }}
                        className="font-semibold text-indigo-600 hover:text-indigo-800"
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
                <h2 className="text-xl font-bold text-slate-900">Geometric Measurements</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted physical spatial parameters across architectural geometry.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3.5">Entity</th>
                      <th className="p-3.5">Measurement Category</th>
                      <th className="p-3.5">Measured Value</th>
                      <th className="p-3.5">Unit</th>
                      <th className="p-3.5">Statutory Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {floorPlan.floors[0]?.rooms?.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-medium text-slate-900">{r.label || r.room_type}</td>
                        <td className="p-3.5 text-slate-600">Habitable Room Floor Area</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{r.area_m2?.toFixed(2) ?? '0.00'}</td>
                        <td className="p-3.5 text-slate-500">m²</td>
                        <td className="p-3.5 font-mono text-slate-500">NBC 2016 Part 3 Cl 12.2</td>
                      </tr>
                    ))}
                    {floorPlan.floors[0]?.openings?.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-medium text-slate-900">{op.opening_type} ({op.id})</td>
                        <td className="p-3.5 text-slate-600">Door Clear Opening Width</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{op.width_m?.toFixed(2) ?? '0.00'}</td>
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
