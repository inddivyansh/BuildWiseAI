import React, { useState } from 'react'
import {
  FolderPlus,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Sparkles,
  Plus,
  ShieldCheck,
  FileUp,
} from 'lucide-react'
import type { Project } from '../types/project'

interface ProjectsManagerProps {
  projects: Project[]
  onCreateProject: (data: { name: string; description?: string; occupancy_type: string }) => Promise<void>
  onDeleteProject: (projectId: string) => Promise<void>
  onSelectProject: (project: Project) => void
  onHowItWorks: () => void
}

const OCCUPANCY_OPTIONS = [
  { value: 'Business / Office', label: 'Group B: Business / Office (1.5m corridors, 30m travel)' },
  { value: 'Residential', label: 'Group A: Residential (1.0m corridors, 9.5m² rooms)' },
  { value: 'Educational', label: 'Group C: Educational (1.5m corridors, 1.5m stairs)' },
  { value: 'Institutional', label: 'Group D: Institutional (2.0m corridors, 2.0m stairs)' },
  { value: 'Assembly', label: 'Group E: Assembly (2.0m corridors, 1.5m doors)' },
  { value: 'Other / Mixed', label: 'Other / Mixed Occupancy' },
]

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  onCreateProject,
  onDeleteProject,
  onSelectProject,
  onHowItWorks,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [occupancyType, setOccupancyType] = useState('Business / Office')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setErrorMsg('Please enter a project name.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      await onCreateProject({
        name: projectName.trim(),
        occupancy_type: occupancyType,
        description: description.trim() || undefined,
      })
      setProjectName('')
      setDescription('')
      setIsCreateModalOpen(false)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-6 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Projects
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
              {projects.length}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your architectural blueprints and view automated NBC 2016 compliance audit runs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="my-auto py-16 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-lg shadow-indigo-950">
            <FolderPlus className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white">Welcome to BuildWise</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            No projects found. Create your first project to upload a CAD blueprint or vector PDF and run an automated compliance screening.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>

            <button
              onClick={onHowItWorks}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Explore How It Works</span>
            </button>
          </div>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {projects.map((proj) => {
            const occ = proj.occupancy_type || 'Business / Office'
            const createdDate = proj.created_at
              ? new Date(proj.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently'

            return (
              <div
                key={proj.id}
                className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete project "${proj.name}" and all uploaded drawings?`)) {
                          onDeleteProject(proj.id)
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mt-4 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {proj.name}
                  </h3>

                  {proj.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {proj.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      {occ}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {createdDate}
                  </span>

                  <button
                    onClick={() => onSelectProject(proj)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Tech Park Tower A"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  NBC Occupancy Classification *
                </label>
                <select
                  value={occupancyType}
                  onChange={(e) => setOccupancyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {OCCUPANCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Determines statutory minimum corridor widths, stair widths, and maximum travel distances.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description / Location (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Commercial office floor plan with 3 executive suites and main egress corridor"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? <span>Creating...</span> : <span>Create Project</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
