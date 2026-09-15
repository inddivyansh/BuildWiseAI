/**
 * BuildWise AI — Frontend API Client
 * Connects to FastAPI backend (/api/v1)
 */

import axios from 'axios'
import type { CanonicalFloorPlan } from '../types/geometry'
import type { ComplianceResult, ComplianceRuleMeta, ComplianceSummary, Violation } from '../types/compliance'
import type { AnalysisRun, Project, UploadedDocument } from '../types/project'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = {
  // Health
  getHealth: async () => {
    const res = await api.get<{ status: string; version: string }>('/health')
    return res.data
  },
  getReadiness: async () => {
    const res = await api.get<{
      status: string
      database: string
      storage: string
      llm_status: string
    }>('/health/ready')
    return res.data
  },

  // Projects
  listProjects: async () => {
    const res = await api.get<{ items: Project[]; total: number }>('/api/v1/projects/')
    return res.data
  },
  createProject: async (data: { name: string; description?: string; building_type: string; occupancy_type: string }) => {
    const res = await api.post<Project>('/api/v1/projects/', data)
    return res.data
  },

  // Documents
  uploadDocument: async (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', projectId)
    const res = await api.post<UploadedDocument>('/api/v1/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // Analysis
  startAnalysis: async (projectId: string, documentId: string, config?: Record<string, any>) => {
    const res = await api.post<AnalysisRun>('/api/v1/analysis/start', {
      project_id: projectId,
      document_id: documentId,
      config: config || {},
    })
    return res.data
  },
  getAnalysisStatus: async (runId: string) => {
    const res = await api.get<{
      run_id: string
      status: string
      stage: string
      progress_pct: number
      error_code?: string
      error_message?: string
    }>(`/api/v1/analysis/${runId}/status`)
    return res.data
  },
  getFloorPlan: async (runId: string) => {
    const res = await api.get<CanonicalFloorPlan>(`/api/v1/analysis/${runId}/floor-plan`)
    return res.data
  },
  getViolations: async (runId: string) => {
    const res = await api.get<{
      run_id: string
      total: number
      violations: Violation[]
    }>(`/api/v1/analysis/${runId}/violations`)
    return res.data
  },
  getComplianceResults: async (runId: string) => {
    const res = await api.get<{
      run_id: string
      summary: ComplianceSummary
      results: ComplianceResult[]
    }>(`/api/v1/analysis/${runId}/compliance`)
    return res.data
  },
  getGraph: async (runId: string) => {
    const res = await api.get<any>(`/api/v1/analysis/${runId}/graph`)
    return res.data
  },

  // Compliance Rules
  listRules: async () => {
    const res = await api.get<{ total: number; rules: ComplianceRuleMeta[] }>('/api/v1/compliance/rules/')
    return res.data
  },

  // Chat / RAG
  queryRegulations: async (question: string) => {
    const res = await api.post<{
      answer: string
      citations: Array<{ section: string; page: number; text: string }>
      llm_available: boolean
    }>('/api/v1/chat/query', { question })
    return res.data
  },

  // Reports
  downloadReportJsonUrl: (runId: string) => `${API_BASE}/api/v1/reports/${runId}/json`,
  downloadReportPdfUrl: (runId: string) => `${API_BASE}/api/v1/reports/${runId}/pdf`,
}
