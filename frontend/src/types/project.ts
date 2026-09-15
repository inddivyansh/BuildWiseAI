/**
 * Project and Document Types — Frontend TypeScript Contracts
 */

export interface Project {
  id: string
  name: string
  description?: string
  building_type: string
  occupancy_type: string
  created_at: string
  updated_at: string
}

export interface DocumentDetection {
  doc_type: 'dxf' | 'vector_pdf' | 'raster_pdf' | 'image' | 'unknown'
  is_vector: boolean
  mime_type: string
  description: string
  recommended_pipeline: string
  page_count: number
  confidence: number
  details?: Record<string, any>
}

export interface UploadedDocument {
  id: string
  project_id: string
  filename: string
  file_size_bytes: number
  mime_type: string
  storage_key: string
  created_at: string
  detection_info?: DocumentDetection
}

export interface AnalysisRun {
  id: string
  project_id: string
  document_id: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  stage?: string
  progress_pct: number
  error_code?: string
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
}
