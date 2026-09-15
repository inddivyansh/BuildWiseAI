import React, { useState } from 'react'
import {
  UploadCloud,
  FileCode,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react'
import { apiClient } from '../api/client'
import type { Project } from '../types/project'

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
  const [occupancyType, setOccupancyType] = useState<string>('commercial')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.name.toLowerCase().endsWith('.dxf')) {
        setUploadError('Please select a valid AutoCAD DXF (.dxf) file.')
        return
      }
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError('Please choose a DXF blueprint file to upload.')
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

      // Upload file
      const doc = await apiClient.uploadDocument(targetProjId, selectedFile)

      // Start analysis
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
      <div className="glass-panel w-full max-w-lg p-6 border border-slate-700/80 shadow-2xl relative">
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
            <h3 className="text-lg font-display font-bold text-white">Upload DXF Blueprint</h3>
            <p className="text-xs text-slate-400">
              AutoCAD format supported (R12 through 2018 DXF)
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all text-center group">
            <FileCode className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Click to browse or drag & drop DXF'}
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                : 'Maximum file size: 50 MB'}
            </span>
            <input
              type="file"
              accept=".dxf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Occupancy Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Occupancy Classification</label>
            <select
              value={occupancyType}
              onChange={(e) => setOccupancyType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="commercial">Commercial / Business (Office, Retail)</option>
              <option value="residential">Residential (Group Housing, Apartments)</option>
              <option value="assembly">Assembly / Public Gathering</option>
              <option value="educational">Educational (Schools, Institutes)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/25"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Launch Analysis</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
