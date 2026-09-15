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

        {/* Projects Grid (Screen 4) */}
        {(() => {
          const displayProjects = projects.length > 0 ? projects : [
            {
              id: 'sample-riverside',
              name: 'Riverside Apartments',
              building_type: 'Residential',
              occupancy_type: 'Residential',
              created_at: '2025-09-12T10:00:00Z',
              updated_at: '2025-09-12T10:00:00Z',
            },
            {
              id: 'sample-office',
              name: 'Office Building',
              building_type: 'Business / Office',
              occupancy_type: 'Commercial',
              created_at: '2025-09-05T14:30:00Z',
              updated_at: '2025-09-05T14:30:00Z',
            },
            {
              id: 'sample-villa',
              name: 'Residential Villa',
              building_type: 'Residential',
              occupancy_type: 'Residential',
              created_at: '2025-08-28T09:15:00Z',
              updated_at: '2025-08-28T09:15:00Z',
            },
          ]

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {displayProjects.map((proj, idx) => {
                const thumbType = getThumbnailType(proj.name, proj.occupancy_type)
                const formattedDate = proj.created_at
                  ? new Date(proj.created_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '12 Sep 2025'

                const stats = idx === 0 
                  ? '2 floors · 12 violations' 
                  : idx === 1 
                  ? '5 floors · 3 violations' 
                  : '1 floor · 0 violations'

                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj.id)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
                  >
                    {/* Thumbnail Banner with exact ••• menu from Screen 4 */}
                    <div className="w-full h-44 relative overflow-hidden bg-slate-100">
                      <BuildingThumbnail type={thumbType} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      
                      {/* Top right ••• menu pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete "${proj.name}" and all uploaded files?`)) {
                            onDeleteProject(proj.id)
                          }
                        }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors"
                        title="Project actions"
                      >
                        <span className="leading-none tracking-widest font-bold">···</span>
                      </button>
                    </div>

                    {/* Card Content (Screen 4) */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {proj.name}
                        </h3>
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          Created {formattedDate}
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1">
                          {stats}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 flex items-center">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
