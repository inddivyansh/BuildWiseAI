import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Sparkles,
  AlertTriangle,
  Layers,
  ShieldCheck,
  GitBranch,
  MessageSquare,
  FileCheck2,
  History,
  CheckCircle2,
  Play,
  RefreshCw,
  Building2,
  Maximize2,
  FileUp,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { FloorPlanViewer } from './FloorPlanViewer'
import { InspectionPanel } from './InspectionPanel'
import { ComplianceMatrix } from './ComplianceMatrix'
import { TopologicalGraphViewer } from './TopologicalGraphViewer'
import { RegulatoryChat } from './RegulatoryChat'
import { ReportViewer } from './ReportViewer'
import { AnalysisHistoryModal, AnalysisHistoryRecord } from './AnalysisHistoryModal'
import type { Project, UploadedDocument, DocumentDetection } from '../types/project'
import type { CanonicalFloorPlan, CGMRoom } from '../types/geometry'
import type { ComplianceResult, ComplianceSummary, Violation } from '../types/compliance'

interface ProjectWorkspaceProps {
  project: Project
  onBackToProjects: () => void
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBackToProjects,
}) => {
  // Navigation tabs inside workspace
  const [activeTab, setActiveTab] = useState<'studio' | 'compliance' | 'graph' | 'chat' | 'reports'>('studio')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Project documents & runs
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [latestDocument, setLatestDocument] = useState<UploadedDocument | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryRecord[]>([])
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)

  // Real analysis data (empty initially, populated strictly from backend)
  const [floorPlan, setFloorPlan] = useState<CanonicalFloorPlan | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([])
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null)
  const [graphData, setGraphData] = useState<any>(null)

  // Selection state
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<CGMRoom | null>(null)

  // Upload dropzone state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectionInfo, setDetectionInfo] = useState<DocumentDetection | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis execution state
  const [analysisProgress, setAnalysisProgress] = useState<{
    status: string
    stage: string
    progress_pct: number
    error_message?: string
  } | null>(null)

  // Load real run data strictly from backend API
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
      } else {
        setSelectedViolation(null)
      }
    } catch (err) {
      console.error('Failed to load analysis run data', err)
    }
  }

  // Load project's documents and history on mount
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const docsRes = await apiClient.listProjectDocuments(project.id)
        setDocuments(docsRes.items || [])
        if (docsRes.items && docsRes.items.length > 0) {
          setLatestDocument(docsRes.items[0])
        }

        const histRes = await apiClient.getProjectHistory(project.id)
        setAnalysisHistory(histRes.runs || [])

        // If runs exist and the latest run is complete, load its real data
        if (histRes.runs && histRes.runs.length > 0) {
          const latestRun = histRes.runs[0]
          if (latestRun.status === 'complete') {
            await loadRunData(latestRun.id)
          } else if (latestRun.status === 'processing' || latestRun.status === 'queued') {
            pollRunStatus(latestRun.id)
          }
        }
      } catch (err) {
        console.error('Failed to load project details', err)
      }
    }

    fetchProjectData()
  }, [project.id])

  // Poll analysis run status until completion
  const pollRunStatus = (runId: string) => {
    setCurrentRunId(runId)
    setAnalysisProgress({
      status: 'processing',
      stage: 'validating',
      progress_pct: 10,
    })

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

          // Refresh history
          const histRes = await apiClient.getProjectHistory(project.id)
          setAnalysisHistory(histRes.runs || [])
        } else if (st.status === 'failed') {
          clearInterval(pollInterval)
        }
      } catch (err) {
        clearInterval(pollInterval)
      }
    }, 1500)
  }

  // File selection and pre-detection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setUploadError(null)

    try {
      const detection = await apiClient.detectDocument(file)
      setDetectionInfo(detection)
    } catch {
      // Detection probe is best-effort
      setDetectionInfo(null)
    }
  }

  // Upload and start analysis
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setUploadError(null)

      // 1. Upload file to backend
      const uploadedDoc = await apiClient.uploadDocument(project.id, selectedFile)
      setLatestDocument(uploadedDoc)
      setDocuments((prev) => [uploadedDoc, ...prev])

      // 2. Start analysis run with project occupancy context
      const occ = project.occupancy_type || 'Business / Office'
      const run = await apiClient.startAnalysis(project.id, uploadedDoc.id, {
        occupancy_type: occ,
      })

      // 3. Reset upload selection and start polling
      setSelectedFile(null)
      setDetectionInfo(null)
      setIsUploading(false)

      pollRunStatus(run.id)
    } catch (err: any) {
      setIsUploading(false)
      setUploadError(err?.response?.data?.detail || err?.message || 'Failed to upload document.')
    }
  }

  // Trigger analysis on existing document
  const handleRunAnalysisOnDoc = async (docId: string) => {
    try {
      const occ = project.occupancy_type || 'Business / Office'
      const run = await apiClient.startAnalysis(project.id, docId, {
        occupancy_type: occ,
      })
      pollRunStatus(run.id)
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || err?.message || 'Failed to start analysis.')
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-4rem)]">
      {/* Project Breadcrumb Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToProjects}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Projects</span>
            </button>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{project.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
                {project.occupancy_type || 'Business / Office'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysisHistory.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Runs ({analysisHistory.length})</span>
              </button>
            )}

            {floorPlan && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Blueprint</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".dxf,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Live Analysis Progress Banner */}
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

      {/* WORKSPACE CONTENT ROUTER */}
      {/* State 1: No documents uploaded yet */}
      {documents.length === 0 && !floorPlan && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-lg shadow-indigo-950">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white">Upload a Blueprint to Begin</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md">
            Upload an AutoCAD DXF, Vector PDF, or floor plan image to run an automated NBC 2016 compliance audit on {project.name}.
          </p>

          {/* Upload Dropzone */}
          <div className="mt-8 w-full p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-900/40 transition-all flex flex-col items-center">
            {selectedFile ? (
              <div className="w-full space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{selectedFile.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {detectionInfo?.doc_type?.toUpperCase() || 'DOCUMENT'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setDetectionInfo(null)
                    }}
                    className="text-slate-400 hover:text-rose-400 text-xs font-medium"
                  >
                    Change
                  </button>
                </div>

                {detectionInfo && (
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 text-left">
                    <span className="font-semibold">Detected:</span> {detectionInfo.description} (Pipeline: {detectionInfo.recommended_pipeline})
                  </div>
                )}

                <button
                  onClick={handleUploadAndAnalyze}
                  disabled={isUploading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {isUploading ? (
                    <span>Uploading & Analyzing...</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start NBC 2016 Compliance Screening</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center w-full">
                <FileUp className="w-10 h-10 text-slate-500 mb-3" />
                <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                  Click to select architectural file
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports DXF (AutoCAD), Vector PDF, PNG, JPG (up to 50MB)
                </span>
                <input
                  type="file"
                  accept=".dxf,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* State 2: Document uploaded but analysis not run yet */}
      {documents.length > 0 && !floorPlan && !analysisProgress && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <FileText className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white">Blueprint Uploaded — Ready to Analyze</h2>
          <p className="text-xs text-slate-400 mt-1.5">
            File: <span className="font-mono text-slate-200">{latestDocument?.original_name || latestDocument?.filename}</span>
          </p>

          <div className="mt-6 flex flex-col gap-3 w-full">
            <button
              onClick={() => latestDocument && handleRunAnalysisOnDoc(latestDocument.id)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Automated Compliance Analysis</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Upload Different Blueprint
            </button>
          </div>
        </div>
      )}

      {/* State 3: Analysis complete with real backend results */}
      {floorPlan && (
        <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
          {/* Sub-Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'studio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Floor Plan Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'compliance'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance Matrix ({complianceSummary?.total_checks || complianceResults.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'graph'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Egress Graph</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>NBC AI Assistant</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'reports'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Statutory Audit Report</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Source: {floorPlan.metadata?.source_filename || 'Uploaded Blueprint'}</span>
            </div>
          </div>

          {/* Active Tab View */}
          <main className="flex-1 flex flex-col">
            {activeTab === 'studio' && (
              <div className="flex-1 flex flex-col lg:flex-row items-start gap-6 w-full">
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

            {activeTab === 'compliance' && complianceSummary && (
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

            {activeTab === 'graph' && graphData && (
              <TopologicalGraphViewer graphData={graphData} />
            )}

            {activeTab === 'chat' && <RegulatoryChat />}

            {activeTab === 'reports' && complianceSummary && (
              <ReportViewer
                runId={currentRunId}
                summary={complianceSummary}
                results={complianceResults}
                buildingMetadata={{
                  total_area_m2: floorPlan.total_area_m2,
                  floor_count: floorPlan.floor_count,
                  source_file: floorPlan.metadata?.source_filename,
                  occupancy: project.occupancy_type || 'Business / Office',
                }}
                floorPlan={floorPlan}
              />
            )}
          </main>
        </div>
      )}

      {/* Analysis History Modal Drawer */}
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
