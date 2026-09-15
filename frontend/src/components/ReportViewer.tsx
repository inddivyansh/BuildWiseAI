import React, { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Building,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { BuildingThumbnail } from './common/BuildingThumbnails'
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
  const [activeSection, setActiveSection] = useState('executive-summary')
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 12
  const [zoomLevel, setZoomLevel] = useState(100)

  const handlePrint = () => {
    window.print()
  }

  const failedResults = results.filter((r) => r.status === 'FAIL')
  const verifiedPassed = results.filter((r) => r.status === 'PASS')
  const insufficientResults = results.filter((r) => r.status === 'INSUFFICIENT_DATA')

  const complianceScorePct = summary?.compliance_score_pct ?? 0
  const violationCount = failedResults.length
  const floorsCount = buildingMetadata?.floor_count || floorPlan?.floor_count || 0
  const projectName = buildingMetadata?.source_file?.replace(/\.[^/.]+$/, '') || 'Untitled Project'

  const reportSections = [
    { id: 'executive-summary', label: 'Executive Summary', page: 1 },
    { id: 'building-info', label: 'Building Information', page: 2 },
    { id: 'compliance-analysis', label: 'Compliance Analysis', page: 3 },
    { id: 'violations', label: 'Violations', page: 4 },
    { id: 'measurements', label: 'Measurements', page: 6 },
    { id: 'egress-analysis', label: 'Egress Analysis', page: 8 },
    { id: 'recommendations', label: 'Recommendations', page: 10 },
    { id: 'appendices', label: 'Appendices', page: 12 },
  ]

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Sidebar: Report Sections — Dark Theme */}
      <div className="w-full lg:w-64 shrink-0 bg-[#090C14] rounded-2xl border border-[#1A2133] p-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 px-2">
          Report Sections
        </h3>

        <div className="space-y-1">
          {reportSections.map((sec) => {
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id)
                  setCurrentPage(sec.page)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-[#6B57FF]/15 text-[#A594FF] font-bold border border-[#6B57FF]/30'
                    : 'text-slate-400 hover:bg-[#0F131F] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-[#A594FF]' : 'text-slate-600'}`} />
                  <span>{sec.label}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">p.{sec.page}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Column: Realistic PDF Document Viewer — Dark Surround */}
      <div className="flex-1 w-full flex flex-col bg-[#06080E] rounded-2xl border border-[#1A2133] overflow-hidden">
        {/* Document Top Toolbar — Dark */}
        <div className="px-4 py-2.5 bg-[#090C14] border-b border-[#1A2133] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-[#0F131F] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-1 text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-[#0F131F] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1.5 rounded-lg hover:bg-[#0F131F] transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-semibold text-slate-300">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-lg hover:bg-[#0F131F] transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg hover:bg-[#0F131F] text-slate-400 transition-colors"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
            </button>

            {runId && (
              <a
                href={apiClient.downloadReportPdfUrl(runId)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6B57FF] hover:bg-[#7C6AFF] text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Printable Document Paper Viewport — The A4 paper itself stays white (it's a document) */}
        <div className="p-8 overflow-x-auto flex justify-center bg-[#040609]">
          {/* A4 Sheet Paper (Screen 8 Cover Page) */}
          <div
            className="w-full max-w-[720px] bg-white rounded-lg shadow-xl border border-slate-300 p-10 sm:p-12 text-center flex flex-col justify-between min-h-[880px] transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Top Document Brand */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  BuildWise
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                NBC 2016 Compliance Report
              </h1>
              <p className="text-base font-semibold text-slate-700 mt-2">
                {projectName}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Center Architectural Building Elevation Render (Screen 8) */}
            <div className="my-8 max-w-[480px] mx-auto w-full rounded-xl overflow-hidden border border-slate-200 shadow-md">
              <BuildingThumbnail type="residential_apartment" className="w-full h-56 object-cover" />
            </div>

            {/* Bottom 3 KPI Metric Cards in Row (Screen 8) */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {complianceScorePct.toFixed(0)}%
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1">
                  Compliant
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-2xl font-black text-rose-600 font-mono">
                  {violationCount}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1">
                  Total Violations
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  {floorsCount}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1">
                  Floors Analyzed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
