import React from 'react'
import {
  Plus,
  ArrowRight,
  FolderPlus,
  Trash2,
  Calendar,
  Sparkles,
  Building2,
} from 'lucide-react'
import { BuildingThumbnail } from '../components/common/BuildingThumbnails'
import type { Project } from '../types/project'

interface ProjectsPageProps {
  projects: Project[]
  onDeleteProject: (projectId: string) => Promise<void>
  onSelectProject: (projectId: string) => void
  onNavigate: (route: string) => void
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onDeleteProject,
  onSelectProject,
  onNavigate,
}) => {
  // Helper to determine architectural thumbnail variant
  const getThumbnailType = (name: string, occ?: string) => {
    const lowerName = name.toLowerCase()
    const lowerOcc = (occ || '').toLowerCase()

    if (lowerName.includes('office') || lowerOcc.includes('business') || lowerOcc.includes('commercial')) {
      return 'commercial_office'
    }
    if (lowerName.includes('villa') || lowerName.includes('house') || lowerName.includes('residence')) {
      return 'residential_villa'
    }
    return 'residential_apartment'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 flex flex-col">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Projects
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-light">
              Manage your building analyses.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/projects/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <div className="my-auto py-20 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
              <FolderPlus className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">No projects yet.</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Create your first project to upload an architectural blueprint and run an automated NBC 2016 screening.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={() => onNavigate('/projects/new')}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Project</span>
              </button>

              <button
                onClick={() => onNavigate('/how-it-works/demo')}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Explore How It Works</span>
              </button>
            </div>
          </div>
        ) : (
          /* Projects Grid (Screen 4) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {projects.map((proj) => {
              const thumbType = getThumbnailType(proj.name, proj.occupancy_type)
              const occ = proj.occupancy_type || 'Residential'
              const formattedDate = proj.created_at
                ? new Date(proj.created_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently'

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* Thumbnail Banner */}
                  <div className="w-full h-40 relative">
                    <BuildingThumbnail type={thumbType} className="w-full h-full" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${proj.name}" and all uploaded files?`)) {
                          onDeleteProject(proj.id)
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/60 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {occ}
                      </div>
                      <div className="text-xs text-slate-400 mt-2 font-mono">
                        Created {formattedDate}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">
                        View Workspace
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
