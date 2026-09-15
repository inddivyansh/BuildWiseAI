import React from 'react'
import {
  ShieldCheck,
  FileUp,
  GitBranch,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Compass,
  FileCheck2,
  BookOpen,
  Eye,
  Building2,
  Flame,
  Scale,
  Maximize2,
} from 'lucide-react'

interface LandingPageProps {
  onAnalyzeBlueprint: () => void
  onHowItWorks: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAnalyzeBlueprint,
  onHowItWorks,
}) => {
  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        {/* Glow backdrop accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          {/* Regulatory Authority Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6 shadow-sm shadow-indigo-950">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>National Building Code of India (NBC 2016) Grounded Screening</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Automated Architectural Compliance for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300">
              Indian Building Codes
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
            Upload your CAD blueprints or vector drawings to run an automated, preliminary compliance analysis.
            Extract real measurements, trace emergency egress routes, and detect NBC violations with mathematical precision.
          </p>

          {/* Primary and Secondary CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onAnalyzeBlueprint}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <FileUp className="w-5 h-5" />
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onHowItWorks}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium text-base hover:bg-slate-800 hover:text-white hover:border-slate-600 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>How It Works? (Demo)</span>
            </button>
          </div>

          {/* Supported Format Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Supported Inputs:</span>
            <span className="px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> DXF (AutoCAD / QCAD)
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Vector PDF (Architectural)
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Raster Drawings (PNG / JPG)
            </span>
          </div>
        </div>
      </section>

      {/* 6 Key Architectural Pillars Grid */}
      <section className="py-20 max-w-6xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Comprehensive Regulatory Intelligence Pipeline
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Built on a deterministic geometry engine that separates strict mathematical audit checks from non-statutory LLM reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: CGM */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Canonical Geometry Model (CGM)</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Raw AutoCAD entities and vector paths are normalized into structured coordinate geometry: polygonal room boundaries, multi-segment wall axes, clear door openings, and external exit gates.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-indigo-300 font-mono">
              Deterministic geometry extraction
            </div>
          </div>

          {/* Card 2: Circulation Graph */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Topological Circulation Graph</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Constructs a NetworkX connectivity graph between rooms, corridors, and exits. Calculates Dijkstra shortest egress routes, evaluates travel distance limits, and detects hazardous dead ends.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-cyan-300 font-mono">
              Egress & dead-end branch routing
            </div>
          </div>

          {/* Card 3: Deterministic NBC Evaluation */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Deterministic NBC 2016 Evaluation</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Every measurement is audited against authoritative statutory clauses from NBC 2016 Volumes 1 & 2. Computes exact mathematical shortfalls without hallucination.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-emerald-300 font-mono">
              Pass / Fail / Insufficient Data states
            </div>
          </div>

          {/* Card 4: Grounded AI Assistant */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Source-Grounded Regulatory AI</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Ask questions about complex building bylaws. Explanations are strictly grounded with Volume, Part, Section, Clause, and PDF source page citations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-purple-300 font-mono">
              Zero speculative clause fabrication
            </div>
          </div>

          {/* Card 5: Interactive Visual Inspector */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Visual Floor Plan Highlighting</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Click any non-compliant door, corridor, or travel route to automatically zoom and center the floor plan view on the offending architectural geometry with shortfall callouts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-amber-300 font-mono">
              Auto-focus zoom & 3-column analysis
            </div>
          </div>

          {/* Card 6: Comprehensive Audit Reports */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Statutory Audit Reports</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Generate formal compliance summaries with geometric dimensions, shortfall remediation guidelines, and explicit NBC disclaimer stamps.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-rose-300 font-mono">
              Structured JSON and printable report preview
            </div>
          </div>
        </div>
      </section>

      {/* Supported Occupancies Showcase */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Authoritative Context</span>
              <h3 className="text-2xl font-bold text-white mt-1">NBC 2016 Occupancy Classifications</h3>
              <p className="text-sm text-slate-400 mt-2">
                BuildWise applies customized rule thresholds based on statutory occupancy classes per NBC Part 4 Table 8.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">Group B</div>
                <div className="text-sm font-semibold text-white mt-0.5">Business / Office</div>
                <div className="text-[11px] text-slate-400 mt-1">1.50m corridors · 30m travel</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">Group A</div>
                <div className="text-sm font-semibold text-white mt-0.5">Residential</div>
                <div className="text-[11px] text-slate-400 mt-1">1.00m corridors · 9.5m² rooms</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">Group C</div>
                <div className="text-sm font-semibold text-white mt-0.5">Educational</div>
                <div className="text-[11px] text-slate-400 mt-1">1.50m corridors · 1.5m stairs</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">Group D</div>
                <div className="text-sm font-semibold text-white mt-0.5">Institutional</div>
                <div className="text-[11px] text-slate-400 mt-1">2.00m corridors · 2.0m stairs</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">Group E</div>
                <div className="text-sm font-semibold text-white mt-0.5">Assembly</div>
                <div className="text-[11px] text-slate-400 mt-1">2.00m corridors · 1.5m doors</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="text-xs font-bold text-indigo-300">General</div>
                <div className="text-sm font-semibold text-white mt-0.5">Other / Mixed</div>
                <div className="text-[11px] text-slate-400 mt-1">Universal baseline rules</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 max-w-6xl mx-auto px-6 w-full text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950 border border-indigo-500/30 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">
              Ready to verify your blueprint against NBC 2016?
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Upload your architectural drawing now to get an instant preliminary screening report with highlighted shortfall vectors.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onAnalyzeBlueprint}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <FileUp className="w-4 h-4" />
                <span>Analyze Your Blueprint</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={onHowItWorks}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium text-sm border border-slate-700/60 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Explore Interactive Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advisory Disclaimer */}
        <p className="mt-8 text-xs text-slate-500 max-w-2xl mx-auto">
          Disclaimer: BuildWise AI provides preliminary automated architectural screening based on the National Building Code of India 2016. It does not constitute statutory municipal sanction, NOC approval, or licensed structural sign-off.
        </p>
      </section>
    </div>
  )
}
