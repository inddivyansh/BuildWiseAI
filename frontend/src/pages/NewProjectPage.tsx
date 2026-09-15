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
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Stepper (JetBrains Dark Stepper) */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-10 text-xs font-semibold">
          <div className="flex items-center gap-2 text-white">
            <span className="w-7 h-7 rounded-full bg-[#6B57FF] text-white flex items-center justify-center text-xs font-mono font-bold shadow-[0_0_12px_rgba(107,87,255,0.6)]">
              1
            </span>
            <span>Project Details</span>
          </div>

          <div className="w-8 h-px bg-[#202738]" />

          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-7 h-7 rounded-full bg-[#121624] text-slate-400 border border-[#202738] flex items-center justify-center text-xs font-mono font-bold">
              2
            </span>
            <span>Upload</span>
          </div>

          <div className="w-8 h-px bg-[#202738]" />

          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-7 h-7 rounded-full bg-[#121624] text-slate-400 border border-[#202738] flex items-center justify-center text-xs font-mono font-bold">
              3
            </span>
            <span>Analyze</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-left">
          <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
            New Analysis Run
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Create New Project
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your architectural drawings to trigger automated NBC compliance evaluation.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FE2857]/10 border border-[#FE2857]/40 text-[#FE2857] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Dark Card Container */}
        <form onSubmit={handleSubmit} className="bg-[#090C14] rounded-3xl border border-[#1A2133] p-8 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            {/* Left Column: Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greenfield Residence"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#06080E] border border-[#202738] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6B57FF] focus:ring-1 focus:ring-[#6B57FF] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Building Type (NBC 2016 Occupancy) *
                </label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#06080E] border border-[#202738] rounded-xl text-xs text-white focus:outline-none focus:border-[#6B57FF] focus:ring-1 focus:ring-[#6B57FF] transition-all cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. 3BHK residential villa, ground + 1 floor, 2 staircases"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#06080E] border border-[#202738] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6B57FF] focus:ring-1 focus:ring-[#6B57FF] transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Column: Upload Blueprint Box */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Upload Your Blueprint
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 rounded-2xl border-2 border-dashed border-[#232D42] hover:border-[#6B57FF] bg-[#06080E]/60 hover:bg-[#06080E] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#121624] border border-[#202738] flex items-center justify-center text-[#6B57FF] mb-3 shadow-md">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-white">
                  {selectedFile ? selectedFile.name : 'Upload Your Blueprint'}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ${
                        detection?.doc_type?.toUpperCase() || 'Ready'
                      }`
                    : 'Drag and drop files here, or click to browse'}
                </p>

                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  DXF, PDF, PNG, JPG (max 50 MB)
                </div>

                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded-full bg-[#161D2E] border border-[#2B354F] text-xs font-semibold text-slate-200 hover:bg-[#1E273D] transition-colors"
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
                <div className="mt-3 p-3 rounded-xl bg-[#0E1526] border border-[#1E2B4A] text-[11px] text-indigo-300">
                  <span className="font-bold">Detected:</span> {detection.description} (Pipeline: {detection.recommended_pipeline})
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-[#161D2E] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-white hover:bg-slate-100 disabled:opacity-50 text-black text-xs font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Starting Analysis...</span>
              ) : (
                <>
                  <span>Next Step</span>
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
