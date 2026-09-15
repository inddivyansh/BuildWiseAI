import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { LandingPage } from './components/LandingPage'
import { HowItWorks } from './components/HowItWorks'
import { ProjectsManager } from './components/ProjectsManager'
import { ProjectWorkspace } from './components/ProjectWorkspace'
import { apiClient } from './api/client'
import type { Project } from './types/project'

export type AppView = 'landing' | 'how-it-works' | 'projects' | 'workspace'

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Live system readiness check
  const [readiness, setReadiness] = useState<any>({
    database: 'ok',
    storage: 'ok',
    llm_status: 'available',
  })

  // Fetch projects list from backend
  const fetchProjects = async () => {
    try {
      const data = await apiClient.listProjects()
      setProjects(data.items || [])
    } catch (err) {
      console.error('Failed to fetch projects from backend', err)
    }
  }

  useEffect(() => {
    fetchProjects()

    const checkHealth = async () => {
      try {
        const ready = await apiClient.getReadiness()
        setReadiness(ready)
      } catch {
        // Best effort
      }
    }
    checkHealth()
    const timer = setInterval(checkHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  // Create new project handler
  const handleCreateProject = async (data: {
    name: string
    description?: string
    occupancy_type: string
  }) => {
    const created = await apiClient.createProject({
      name: data.name,
      description: data.description,
      occupancy_type: data.occupancy_type,
    })
    await fetchProjects()
    setSelectedProject(created)
    setCurrentView('workspace')
  }

  // Delete project handler
  const handleDeleteProject = async (projectId: string) => {
    await apiClient.deleteProject(projectId)
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
      setCurrentView('projects')
    }
    await fetchProjects()
  }

  // Open a project's workspace
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    setCurrentView('workspace')
  }

  // Primary Action: "Analyze Your Blueprint"
  const handleAnalyzeBlueprint = () => {
    if (selectedProject) {
      setCurrentView('workspace')
    } else {
      setCurrentView('projects')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Application Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'projects') {
            setSelectedProject(null)
          }
          setCurrentView(view)
        }}
        onAnalyzeBlueprint={handleAnalyzeBlueprint}
        readiness={readiness}
      />

      {/* View Routing */}
      {currentView === 'landing' && (
        <LandingPage
          onAnalyzeBlueprint={handleAnalyzeBlueprint}
          onHowItWorks={() => setCurrentView('how-it-works')}
        />
      )}

      {currentView === 'how-it-works' && (
        <HowItWorks onAnalyzeBlueprint={handleAnalyzeBlueprint} />
      )}

      {currentView === 'projects' && (
        <ProjectsManager
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject}
          onHowItWorks={() => setCurrentView('how-it-works')}
        />
      )}

      {currentView === 'workspace' && selectedProject && (
        <ProjectWorkspace
          project={selectedProject}
          onBackToProjects={() => {
            setSelectedProject(null)
            setCurrentView('projects')
          }}
        />
      )}
    </div>
  )
}
