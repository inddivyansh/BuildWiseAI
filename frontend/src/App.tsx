import React, { useState, useEffect } from 'react'
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Navbar } from './components/Navbar'
import { FloorPlanViewer } from './components/FloorPlanViewer'
import { InspectionPanel } from './components/InspectionPanel'
import { ComplianceMatrix } from './components/ComplianceMatrix'
import { TopologicalGraphViewer } from './components/TopologicalGraphViewer'
import { RegulatoryChat } from './components/RegulatoryChat'
import { ReportViewer } from './components/ReportViewer'
import { UploadModal } from './components/UploadModal'
import { AnalysisHistoryModal, AnalysisHistoryRecord } from './components/AnalysisHistoryModal'
import { apiClient } from './api/client'
import type { CanonicalFloorPlan, CGMRoom } from './types/geometry'
import type { ComplianceResult, ComplianceSummary, Violation } from './types/compliance'
import type { Project } from './types/project'

// Default Demo Sample Floor Plan (instant demonstration)
const DEMO_FLOOR_PLAN: CanonicalFloorPlan = {
  id: 'demo-sample-01',
  version: '1.0',
  floor_count: 1,
  bounding_box: { xmin: 0, ymin: 0, xmax: 10, ymax: 8 },
  metadata: {
    source_format: 'dxf',
    source_filename: 'office_sample_floor.dxf',
    extraction_method: 'ezdxf',
    coordinate_unit: 'meters',
    is_multi_floor: false,
    extraction_warnings: [],
    extraction_errors: [],
  },
  floors: [
    {
      level: 0,
      elevation_m: 0,
      rooms: [
        {
          id: 'room-101',
          room_type: 'living_room',
          label: 'Executive Conference Room',
          boundary: {
            vertices: [
              { x: 0, y: 0 },
              { x: 5, y: 0 },
              { x: 5, y: 4.5 },
              { x: 0, y: 4.5 },
            ],
          },
          area_m2: 22.5,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-102',
          room_type: 'bedroom',
          label: 'Private Office A',
          boundary: {
            vertices: [
              { x: 5, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 4.5 },
              { x: 5, y: 4.5 },
            ],
          },
          area_m2: 22.5,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-103',
          room_type: 'corridor',
          label: 'Main Egress Corridor',
          boundary: {
            vertices: [
              { x: 0, y: 4.5 },
              { x: 10, y: 4.5 },
              { x: 10, y: 5.3 },
              { x: 0, y: 5.3 },
            ],
          },
          area_m2: 8.0,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'room-104',
          room_type: 'kitchen',
          label: 'Pantry / Breakroom',
          boundary: {
            vertices: [
              { x: 0, y: 5.3 },
              { x: 4, y: 5.3 },
              { x: 4, y: 8 },
              { x: 0, y: 8 },
            ],
          },
          area_m2: 10.8,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      walls: [
        {
          id: 'w-1',
          wall_type: 'exterior',
          segments: [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'w-2',
          wall_type: 'exterior',
          segments: [{ start: { x: 10, y: 0 }, end: { x: 10, y: 8 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'w-3',
          wall_type: 'exterior',
          segments: [{ start: { x: 10, y: 8 }, end: { x: 0, y: 8 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'w-4',
          wall_type: 'exterior',
          segments: [{ start: { x: 0, y: 8 }, end: { x: 0, y: 0 } }],
          thickness_m: 0.2,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'w-5',
          wall_type: 'interior',
          segments: [{ start: { x: 5, y: 0 }, end: { x: 5, y: 4.5 } }],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'w-6',
          wall_type: 'interior',
          segments: [{ start: { x: 0, y: 4.5 }, end: { x: 10, y: 4.5 } }],
          thickness_m: 0.15,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      openings: [
        {
          id: 'op-1',
          opening_type: 'door',
          position: { x: 2.5, y: 4.5 },
          width_m: 0.75, // Substandard width violation!
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'op-2',
          opening_type: 'door',
          position: { x: 7.5, y: 4.5 },
          width_m: 1.0,
          floor_level: 0,
          confidence: 'high',
        },
        {
          id: 'op-3',
          opening_type: 'emergency_exit',
          position: { x: 10, y: 4.9 },
          width_m: 1.2,
          floor_level: 0,
          confidence: 'high',
        },
      ],
      stairs: [],
      exits: [
        {
          id: 'ex-1',
          position: { x: 10, y: 4.9 },
          exit_type: 'emergency_exit',
          width_m: 1.2,
          floor_level: 0,
          confidence: 'high',
        },
      ],
    },
  ],
}

const DEMO_VIOLATIONS: Violation[] = [
  {
    id: 'viol-001',
    compliance_result_id: 'cr-001',
    rule_id: 'NBC-4-CW-001',
    title: 'Substandard Corridor Width',
    severity: 'CRITICAL',
    status: 'UNVERIFIED',
    entity_type: 'corridor',
    geometry_hint: 'polygon',
    coordinates: [
      [0, 4.5],
      [10, 4.5],
      [10, 5.3],
      [0, 5.3],
    ],
    label_text: 'Corridor width 0.80m < 1.50m required',
    label_position: { x: 5, y: 4.9 },
    floor_level: 0,
    measured_value: 0.8,
    required_value: 1.5,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Section 4.4.2',
    recommendation:
      'Widen the main egress corridor from 0.80 m to at least 1.50 m clear width to prevent fatal choke-points during emergency evacuation.',
    llm_explanation:
      'Under National Building Code 2016 Part 4 (Fire & Life Safety), exit corridors serving commercial or business occupancies must maintain a continuous, unobstructed minimum clear width of 1.50 m. The current corridor measures only 0.80 m wide, posing severe risks of crush, bottlenecking, and smoke entrapment during high-density evacuation.',
  },
  {
    id: 'viol-002',
    compliance_result_id: 'cr-002',
    rule_id: 'NBC-4-DW-001',
    title: 'Conference Room Door Clear Width Below Standard',
    severity: 'MAJOR',
    status: 'UNVERIFIED',
    entity_type: 'opening',
    geometry_hint: 'point',
    coordinates: [[2.5, 4.5]],
    label_text: 'Door 0.75m < 0.90m',
    label_position: { x: 2.5, y: 4.5 },
    floor_level: 0,
    measured_value: 0.75,
    required_value: 0.9,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Section 4.3',
    recommendation:
      'Replace the 750 mm door leaf with a standard 900 mm or 1000 mm clear opening doorway.',
    llm_explanation:
      'Doors serving habitable or assembly spaces must have a clear opening width not less than 0.90 m (900 mm) to accommodate single-file wheelchair access and emergency egress without impediment.',
  },
]

const DEMO_COMPLIANCE_RESULTS: ComplianceResult[] = [
  {
    id: 'cr-001',
    rule_id: 'NBC-4-CW-001',
    title: 'Corridor Clear Width — Main Egress Corridor',
    description: 'Corridor measured at 0.80 m vs requirement of 1.50 m.',
    status: 'UNVERIFIED',
    severity: 'CRITICAL',
    measured_value: 0.8,
    required_value: 1.5,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Section 4.4.2',
    confidence: 'high',
    recommendation: 'Widen corridor to at least 1.50 m clear width.',
    llm_explanation:
      'Corridor width falls short of the 1.50 m fire safety requirement for commercial office corridors.',
  },
  {
    id: 'cr-002',
    rule_id: 'NBC-4-DW-001',
    title: 'Door Clear Width — Conference Room',
    description: 'Opening measured at 0.75 m vs requirement of 0.90 m.',
    status: 'UNVERIFIED',
    severity: 'MAJOR',
    measured_value: 0.75,
    required_value: 0.9,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Section 4.3',
    confidence: 'high',
    recommendation: 'Increase door width to at least 0.90 m.',
  },
  {
    id: 'cr-003',
    rule_id: 'NBC-3-RA-001',
    title: 'Room Area — Executive Conference Room',
    description: 'Room area measured at 22.50 m² vs requirement of 9.50 m².',
    status: 'PASS',
    severity: 'MAJOR',
    measured_value: 22.5,
    required_value: 9.5,
    unit: 'm2',
    regulation_source: 'NBC 2016 Part 3 Clause 12.2',
    confidence: 'high',
    recommendation: 'Space complies with minimum area requirement.',
  },
  {
    id: 'cr-004',
    rule_id: 'NBC-4-TD-001',
    title: 'Maximum Travel Distance to Exit',
    description: 'Longest travel path to emergency exit measured at 11.2 m vs limit of 30.0 m.',
    status: 'PASS',
    severity: 'CRITICAL',
    measured_value: 11.2,
    required_value: 30.0,
    unit: 'm',
    regulation_source: 'NBC 2016 Part 4 Table 5',
    confidence: 'high',
    recommendation: 'Travel distance is safely within statutory threshold.',
  },
  {
    id: 'cr-005',
    rule_id: 'NBC-4-EX-001',
    title: 'Minimum Exit Count — Floor Level 0',
    description: 'Floor area is 63.8 m² with 1 exit door (required: 1).',
    status: 'PASS',
    severity: 'CRITICAL',
    measured_value: 1.0,
    required_value: 1.0,
    unit: 'count',
    regulation_source: 'NBC 2016 Part 4 Section 4.2',
    confidence: 'high',
    recommendation: 'Single exit is sufficient for floor area under 500 m².',
  },
]

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'compliance' | 'graph' | 'chat' | 'reports'>('studio')
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryRecord[]>([])
  const [currentOccupancy, setCurrentOccupancy] = useState<string>('Business / Office')

  // Data state
  const [projects, setProjects] = useState<Project[]>([])
  const [currentRunId, setCurrentRunId] = useState<string | null>('demo-run-001')
  const [floorPlan, setFloorPlan] = useState<CanonicalFloorPlan>(DEMO_FLOOR_PLAN)
  const [violations, setViolations] = useState<Violation[]>(DEMO_VIOLATIONS)
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>(DEMO_COMPLIANCE_RESULTS)
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary>({
    total_checks: 5,
    passed: 3,
    failed: 0,
    unverified: 2,
    warning: 0,
    insufficient_data: 0,
    not_applicable: 0,
    compliance_score_pct: 60.0,
  })
  const [graphData, setGraphData] = useState<any>({
    nodes: [
      { id: 'room-101', node_type: 'room', label: 'Conference Room', centroid_x: 2.5, centroid_y: 2.25, floor_level: 0, confidence: 'high' },
      { id: 'room-102', node_type: 'room', label: 'Private Office', centroid_x: 7.5, centroid_y: 2.25, floor_level: 0, confidence: 'high' },
      { id: 'room-103', node_type: 'corridor', label: 'Corridor', centroid_x: 5.0, centroid_y: 4.9, floor_level: 0, confidence: 'high' },
      { id: 'ex-1', node_type: 'exit', label: 'Final Exit', centroid_x: 10.0, centroid_y: 4.9, floor_level: 0, confidence: 'high' },
    ],
    edges: [
      { source_id: 'room-101', target_id: 'room-103', edge_type: 'door', width_m: 0.75 },
      { source_id: 'room-102', target_id: 'room-103', edge_type: 'door', width_m: 1.0 },
      { source_id: 'room-103', target_id: 'ex-1', edge_type: 'door', width_m: 1.2 },
    ],
    stats: { connected_components: 1, total_nodes: 4, total_edges: 3 },
  })

  // Selection state
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(DEMO_VIOLATIONS[0])
  const [selectedRoom, setSelectedRoom] = useState<CGMRoom | null>(null)

  // System readiness
  const [readiness, setReadiness] = useState<any>({
    database: 'ok',
    storage: 'ok',
    llm_status: 'available',
  })

  const loadRunData = async (runId: string) => {
    try {
      setCurrentRunId(runId)
      const fp = await apiClient.getFloorPlan(runId)
      const viols = await apiClient.getViolations(runId)
      const comp = await apiClient.getComplianceResults(runId)
      const graph = await apiClient.getGraph(runId)

      setFloorPlan(fp)
      setViolations(viols.violations)
      setComplianceResults(comp.results)
      setComplianceSummary(comp.summary)
      setGraphData(graph)
      if (viols.violations.length > 0) {
        setSelectedViolation(viols.violations[0])
      }
    } catch (err) {
      console.error('Failed to load run snapshot', err)
    }
  }

  // Load initial projects & history
  useEffect(() => {
    const initData = async () => {
      try {
        const projData = await apiClient.listProjects()
        setProjects(projData.items)
        if (projData.items.length > 0) {
          const hist = await apiClient.getProjectHistory(projData.items[0].id)
          setAnalysisHistory(hist.runs)
        }
      } catch {
        // Fallback demo values
      }
    }
    initData()
  }, [])

  // Polling for live system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const ready = await apiClient.getReadiness()
        setReadiness(ready)
      } catch {
        // Keep fallback values
      }
    }
    checkHealth()
    const timer = setInterval(checkHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  // Live analysis state
  const [analysisProgress, setAnalysisProgress] = useState<{
    status: string
    stage: string
    progress_pct: number
    error_message?: string
  } | null>(null)

  // Poll analysis run if one was started
  const handleAnalysisStarted = (runId: string) => {
    setCurrentRunId(runId)
    setActiveTab('studio')
    setAnalysisProgress({
      status: 'processing',
      stage: 'validating',
      progress_pct: 5,
    })

    // Poll until completion
    const pollInterval = setInterval(async () => {
      try {
        const st = await apiClient.getAnalysisStatus(runId)
        setAnalysisProgress({
          status: st.status,
          stage: st.stage,
          progress_pct: st.progress_pct,
          error_message: st.error_message,
        })

        if (st.status === 'complete') {
          clearInterval(pollInterval)
          setTimeout(() => setAnalysisProgress(null), 3000)

          await loadRunData(runId)

          // Refresh history if project exists
          if (projects.length > 0) {
            try {
              const hist = await apiClient.getProjectHistory(projects[0].id)
              setAnalysisHistory(hist.runs)
            } catch {
              // Ignore
            }
          }
        } else if (st.status === 'failed') {
          clearInterval(pollInterval)
        }
      } catch {
        clearInterval(pollInterval)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Brand Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        readiness={readiness}
      />

      {/* Live Pipeline Processing Banner */}
      {analysisProgress && (
        <div className="bg-slate-900/95 border-b border-indigo-500/30 px-6 py-3 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                {analysisProgress.status === 'failed' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                )}
                <span>
                  {analysisProgress.status === 'failed'
                    ? `Analysis Failed: ${analysisProgress.error_message || 'Processing error'}`
                    : `Pipeline Active — Stage: ${analysisProgress.stage?.toUpperCase() || 'PROCESSING'}`}
                </span>
              </div>
              <span className="font-mono text-indigo-300 font-semibold">{analysisProgress.progress_pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  analysisProgress.status === 'failed' ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${Math.max(analysisProgress.progress_pct, 5)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 flex flex-col">
        {activeTab === 'studio' && (
          <div className="flex-1 flex flex-col lg:flex-row items-start gap-6 max-w-7xl mx-auto w-full">
            {/* Interactive Floor Plan Viewer Canvas */}
            <div className="flex-1 w-full">
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
                  setSelectedViolation(null)
                }}
              />
            </div>

            {/* Inspection Drawer Panel */}
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

        {activeTab === 'compliance' && (
          <ComplianceMatrix
            summary={complianceSummary}
            results={complianceResults}
            onInspectResult={(res) => {
              const matchedViol = violations.find((v) => v.rule_id === res.rule_id)
              if (matchedViol) {
                setSelectedViolation(matchedViol)
              }
              setActiveTab('studio')
            }}
          />
        )}

        {activeTab === 'graph' && <TopologicalGraphViewer graphData={graphData} />}

        {activeTab === 'chat' && <RegulatoryChat />}

        {activeTab === 'reports' && (
          <ReportViewer
            runId={currentRunId}
            summary={complianceSummary}
            results={complianceResults}
            buildingMetadata={{
              total_area_m2: floorPlan?.total_area_m2,
              floor_count: floorPlan?.floor_count,
              source_file: floorPlan?.metadata?.source_filename,
              occupancy: currentOccupancy,
            }}
            floorPlan={floorPlan}
          />
        )}
      </main>

      {/* Upload Blueprint Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projects={projects}
        onAnalysisStarted={handleAnalysisStarted}
      />

      {/* Analysis History Modal */}
      <AnalysisHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={analysisHistory}
        currentRunId={currentRunId}
        onSelectRun={loadRunData}
      />
    </div>
  )
}
