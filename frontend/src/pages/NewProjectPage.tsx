import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
} from 'lucide-react'
import { apiClient } from '../api/client'
import type { DocumentDetection } from '../types/project'

interface NewProjectPageProps {
  onNavigate: (route: string) => void
  onProjectCreated: (projectId: string, runId?: string) => void
}

export const NewProjectPage: React.FC<NewProjectPageProps> = ({
  onNavigate,
  onProjectCreated,
}) => {
  const [projectName, setProjectName] = useState('')
  const [buildingType, setBuildingType] = useState('Residential')
  const [description, setDescription] = useState('')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detection, setDetection] = useState<DocumentDetection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setErrorMsg(null)

    try {
      const det = await apiClient.detectDocument(file)
      setDetection(det)
    } catch {
      setDetection(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setErrorMsg('Please enter a project name.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)

      // 1. Create project
      const project = await apiClient.createProject({
        name: projectName.trim(),
        description: description.trim() || undefined,
        building_type: buildingType,
        occupancy_type: buildingType,
      })

      // 2. If a blueprint file was attached, upload it and trigger analysis immediately
      if (selectedFile) {
        const uploadedDoc = await apiClient.uploadDocument(project.id, selectedFile)
        const run = await apiClient.startAnalysis(project.id, uploadedDoc.id, {
          occupancy_type: buildingType,
        })
        onProjectCreated(project.id, run.id)
        onNavigate(`/projects/${project.id}/analyze?runId=${run.id}`)
      } else {
        onProjectCreated(project.id)
        onNavigate(`/projects/${project.id}`)
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Failed to create project.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 flex flex-col">
        {/* Stepper (Screen 5) */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8 text-xs font-semibold">
          <div className="flex items-center gap-2 text-indigo-600">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Project Details</span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Upload</span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Analyze</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create New Project
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-light">
            Upload your architectural drawings to get started.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Card Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greenfield Residence"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Building Type *
                </label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                >
                  <option value="Residential">Residential (Group A)</option>
                  <option value="Business / Office">Commercial / Business (Group B)</option>
                  <option value="Educational">Educational (Group C)</option>
                  <option value="Institutional">Institutional (Group D)</option>
                  <option value="Assembly">Assembly (Group E)</option>
                  <option value="Other / Mixed">Other / Mixed Occupancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 3BHK villa, ground + 1 floor"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Right Column: Upload Blueprint Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload Your Blueprint
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6 text-indigo-600" />
                </div>

                <div className="text-xs font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Upload Your Blueprint'}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ${
                        detection?.doc_type?.toUpperCase() || 'Attached'
                      }`
                    : 'Drag and drop files here, or click to browse'}
                </p>

                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  DXF, PDF, PNG, JPG (max 50 MB)
                </div>

                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  {selectedFile ? 'Change File' : 'Browse Files'}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dxf,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {detection && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900">
                  <span className="font-bold">Detected:</span> {detection.description} (Pipeline: {detection.recommended_pipeline})
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
