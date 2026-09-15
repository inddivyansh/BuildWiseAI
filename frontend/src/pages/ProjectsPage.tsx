import React from 'react'
import {
  Plus,
  ArrowRight,
  FolderPlus,
  Trash2,
  Calendar,
  Sparkles,
  Building2,
  Layers,
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
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#1A2133]">
          <div>
            <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              Workspace Manager
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              My Projects
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your building analyses, drawings, and statutory audits.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/projects/new')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-black text-xs font-bold shadow-lg transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid (JetBrains Dark Aesthetic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
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
                className="group bg-[#090C14] rounded-3xl border border-[#1A2133] hover:border-[#6B57FF] hover:shadow-[0_10px_40px_rgba(107,87,255,0.15)] transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Thumbnail Banner */}
                <div className="w-full h-44 relative overflow-hidden bg-[#06080E]">
                  <BuildingThumbnail type={thumbType} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

                  {/* Top right ••• menu pill */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${proj.name}" and all uploaded files?`)) {
                        onDeleteProject(proj.id)
                      }
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/70 hover:bg-[#FE2857] text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors border border-white/10"
                    title="Project actions"
                  >
                    <span className="leading-none tracking-widest font-bold">···</span>
                  </button>

                  <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-xs border border-white/10 text-[10px] font-mono text-slate-300">
                    {proj.occupancy_type || 'Residential'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#6B57FF] transition-colors line-clamp-1">
                      {proj.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      Created {formattedDate}
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {stats}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#161D2E] flex items-center justify-between">
                    <span className="text-xs text-slate-400">Open Workspace</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-[#6B57FF] group-hover:translate-x-1 transition-all">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
