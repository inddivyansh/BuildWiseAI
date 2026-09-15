import React, { useState } from 'react'
import {
  UploadCloud,
  FileCode,
  FileType,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react'
import { apiClient } from '../api/client'
import type { DocumentDetection, Project } from '../types/project'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onAnalysisStarted: (runId: string) => void
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAnalysisStarted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '')
  const [occupancyType, setOccupancyType] = useState<string>('Business/Office')
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [detection, setDetection] = useState<DocumentDetection | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (!isOpen) return null

  const allowedExtensions = ['.dxf', '.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.webp']

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        setUploadError(`Unsupported format. Allowed: DXF, Vector PDF, PNG, JPG/JPEG.`)
        setSelectedFile(null)
        setDetection(null)
        return
      }

      setSelectedFile(file)
      setUploadError(null)
      setIsDetecting(true)

      try {
        const detected = await apiClient.detectDocument(file)
        setDetection(detected)
      } catch (err) {
        // Fallback detection from extension
        let fallbackType: DocumentDetection['doc_type'] = 'unknown'
        if (ext === '.dxf') fallbackType = 'dxf'
        else if (ext === '.pdf') fallbackType = 'vector_pdf'
        else fallbackType = 'image'

        setDetection({
          doc_type: fallbackType,
          is_vector: fallbackType === 'dxf' || fallbackType === 'vector_pdf',
          mime_type: file.type || 'application/octet-stream',
          description: `Architectural Blueprint (${ext.toUpperCase()})`,
          recommended_pipeline: fallbackType === 'dxf' ? 'dxf_pipeline' : fallbackType === 'vector_pdf' ? 'vector_pdf_pipeline' : 'classical_cv_pipeline',
          page_count: 1,
          confidence: 0.9,
        })
      } finally {
        setIsDetecting(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError('Please select a blueprint file to upload.')
      return
    }

    if (detection?.doc_type === 'raster_pdf') {
      setUploadError(
        'Scanned / Raster PDF detected. Vector CAD extraction is not possible directly from raster scans. Please upload a vector DXF/PDF or an architectural PNG/JPG image.'
      )
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      let targetProjId = projectId
      if (!targetProjId) {
        const newProj = await apiClient.createProject({
          name: `Blueprint Audit — ${new Date().toLocaleDateString()}`,
          building_type: 'Commercial Office',
          occupancy_type: occupancyType,
        })
        targetProjId = newProj.id
      }

      // 1. Upload document
      const doc = await apiClient.uploadDocument(targetProjId, selectedFile)

      // 2. Start analysis
      const run = await apiClient.startAnalysis(targetProjId, doc.id, {
        occupancy_type: occupancyType,
        is_sprinklered: false,
      })

      onAnalysisStarted(run.id)
      onClose()
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || err.message || 'Failed to upload and start analysis.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-6 border border-slate-700/80 shadow-2xl relative rounded-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">Upload Architectural Blueprint</h3>
            <p className="text-xs text-slate-400">
              AutoCAD DXF, Vector PDF, or Plan Images (PNG/JPG)
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all text-center group">
            <div className="flex items-center gap-2">
              <FileCode className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <FileType className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <ImageIcon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Click to browse or drop DXF, PDF, or PNG/JPG'}
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                : 'DXF (CAD), Vector PDF (Multi-floor), PNG/JPEG (Sketches)'}
            </span>
            <input
              type="file"
              accept=".dxf,.pdf,.png,.jpg,.jpeg,.bmp,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Document Type Detection Badge */}
          {isDetecting && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing stream signature and vector geometry...</span>
            </div>
          )}

          {detection && !isDetecting && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-xs ${
                detection.doc_type === 'raster_pdf'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {detection.doc_type === 'raster_pdf' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white">
                    {detection.doc_type === 'dxf'
                      ? 'AutoCAD DXF Vector Blueprint'
                      : detection.doc_type === 'vector_pdf'
                      ? 'Vector Architectural PDF'
                      : detection.doc_type === 'raster_pdf'
                      ? 'Scanned / Raster PDF'
                      : 'Architectural Plan Image'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {detection.recommended_pipeline.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{detection.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                <span>Mode: {detection.is_vector ? 'Precise Vector CAD' : 'Raster Bitmap'}</span>
                <span>Confidence: {(detection.confidence * 100).toFixed(0)}%</span>
                {detection.page_count > 1 && <span>Pages: {detection.page_count}</span>}
              </div>
            </div>
          )}

          {/* Occupancy Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Occupancy Classification</label>
            <select
              value={occupancyType}
              onChange={(e) => setOccupancyType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Business/Office">Business / Office (Offices, Banks, Professional)</option>
              <option value="Residential">Residential (Dwellings, Apartments)</option>
              <option value="Educational">Educational (Schools, Colleges, Training)</option>
              <option value="Institutional">Institutional (Hospitals, Sanatoria, Custodial)</option>
              <option value="Assembly">Assembly (Theatres, Halls, Terminals)</option>
              <option value="Other">Other / Unclassified</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading || isDetecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/25"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
