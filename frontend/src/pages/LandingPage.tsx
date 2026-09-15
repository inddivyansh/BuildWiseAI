import React from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  Layers,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Check,
  Eye,
  GitBranch,
  Scale,
  Building,
} from 'lucide-react'
import { Wireframe3D } from '../components/common/Wireframe3D'

interface LandingPageProps {
  onNavigate: (route: string) => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#1E2433] bg-[#07090E]">
        {/* Subtle background tech grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

        {/* Ambient indigo/violet glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-indigo-600/10 blur-[160px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-white leading-[1.02]">
                From<br />
                Blueprints to<br />
                <span className="bg-gradient-to-r from-[#7B61FF] via-[#9B51E0] to-[#6366F1] bg-clip-text text-transparent">
                  Compliance
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-lg font-normal leading-relaxed">
                Upload your architectural drawings and get an automated preliminary NBC 2016 compliance analysis with AI-powered insights.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('/projects/new')}
                  className="px-6 py-3.5 rounded-xl bg-[#5448EC] hover:bg-[#4639D9] text-white font-semibold text-sm shadow-[0_0_20px_rgba(84,72,236,0.35)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Analyze Your Blueprint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('/how-it-works')}
                  className="px-6 py-3.5 rounded-xl bg-[#121622] hover:bg-[#1A2030] text-slate-200 font-medium text-sm border border-[#232B3E] hover:border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  <span>How It Works</span>
                </button>
              </div>

              {/* Feature capability pills row */}
              <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full border-t border-[#1E2433] pt-8 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-medium text-slate-300">NBC 2016 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-medium text-slate-300">AI-Powered Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="font-medium text-slate-300">Detailed Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-300">Works with DXF, PDF, Images</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-400 font-light">
                <span>Trusted by students, architects and builders</span>
                <ArrowDown className="w-3.5 h-3.5 text-slate-400 animate-bounce" />
              </div>
            </div>

            {/* Hero Right: 3D Architectural Wireframe & Floating Cards */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px] lg:min-h-[480px]">
              {/* Central 3D Wireframe */}
              <Wireframe3D className="w-full max-w-[500px] h-auto drop-shadow-2xl" accentColor="#7B61FF" isDark={true} />

              {/* Floating Stat Card 1: 12 Violations Found (Top Right) */}
              <div className="absolute top-4 right-2 sm:right-6 bg-[#121622]/95 backdrop-blur-md border border-[#232B3E] rounded-xl p-3.5 shadow-2xl transition-transform hover:-translate-y-0.5">
                <div className="text-2xl font-black text-[#EF4444] font-mono leading-none">
                  12
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Violations Found
                </div>
              </div>

              {/* Floating Stat Card 2: 85% Compliant (Middle Right) */}
              <div className="absolute top-1/2 right-0 sm:right-2 -translate-y-1/2 bg-[#121622]/95 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2.5 transition-transform hover:-translate-y-1/2 hover:scale-105">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-sm font-bold text-emerald-400 font-mono">85%</span>
                <span className="text-xs text-slate-300 font-medium">Compliant</span>
              </div>

              {/* Floating Stat Card 3: 3.2m Corridor Width (Bottom Right) */}
              <div className="absolute bottom-6 right-4 sm:right-12 bg-[#121622]/95 backdrop-blur-md border border-[#232B3E] rounded-xl p-3.5 shadow-2xl transition-transform hover:-translate-y-0.5">
                <div className="text-base font-bold text-white font-mono leading-none">
                  3.2m
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Corridor Width <span className="font-mono text-[10px] text-indigo-400">(NBC 4.3.2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* From Drawing to Decision Workflow */}
      <section className="py-20 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
            Pipeline Architecture
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight mt-2">
            From Drawing to Decision
          </h2>
          <p className="mt-3 text-sm text-slate-400 font-light">
            Automated statutory checking that turns raw CAD entities into verified compliance findings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-xl bg-[#0F131C] border border-[#1E2433] text-left">
            <span className="text-xs font-mono font-bold text-indigo-400">01</span>
            <h3 className="text-sm font-bold text-white mt-2">Upload Blueprint</h3>
            <p className="text-xs text-slate-400 mt-1">DXF, architectural vector PDF, or raster scans.</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F131C] border border-[#1E2433] text-left">
            <span className="text-xs font-mono font-bold text-cyan-400">02</span>
            <h3 className="text-sm font-bold text-white mt-2">Extract Geometry</h3>
            <p className="text-xs text-slate-400 mt-1">Walls, rooms, doors, stairs and exit positions.</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F131C] border border-[#1E2433] text-left">
            <span className="text-xs font-mono font-bold text-emerald-400">03</span>
            <h3 className="text-sm font-bold text-white mt-2">Build Graph</h3>
            <p className="text-xs text-slate-400 mt-1">NetworkX topological circulation and egress routes.</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F131C] border border-[#1E2433] text-left">
            <span className="text-xs font-mono font-bold text-purple-400">04</span>
            <h3 className="text-sm font-bold text-white mt-2">Check NBC Rules</h3>
            <p className="text-xs text-slate-400 mt-1">200+ rules from NBC 2016 Vol 1 & 2 evaluated.</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F131C] border border-[#1E2433] text-left">
            <span className="text-xs font-mono font-bold text-rose-400">05</span>
            <h3 className="text-sm font-bold text-white mt-2">Review & Report</h3>
            <p className="text-xs text-slate-400 mt-1">Floor plan visual overlay, AI chat and PDF report.</p>
          </div>
        </div>
      </section>

      {/* Built For The Way Architects Work */}
      <section className="py-20 bg-[#05070A] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
              Engineered for Accuracy
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight mt-2">
              Built for the Way Architects Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#0C0F17] border border-[#1D2333]">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Floor-Plan Visualization</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Zoom, pan, and click entities to see live dimensions and compliance status with auto-focus highlights.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0C0F17] border border-[#1D2333]">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Compliance Matrix</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Comprehensive scorecard detailing evaluated rules, measured vs required values, and statutory citations.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0C0F17] border border-[#1D2333]">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Violation Inspection</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Mathematical shortfall calculation showing exact target dimensions needed to achieve statutory compliance.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0C0F17] border border-[#1D2333]">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Regulatory Citations</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AI assistant grounded in NBC 2016 source documents with exact Volume, Part, Section, and Page references.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* See BuildWise in Action CTA */}
      <section className="py-20 max-w-5xl mx-auto px-6 w-full text-center">
        <div className="p-10 sm:p-14 rounded-2xl bg-gradient-to-br from-[#0E1320] via-[#141A2C] to-[#0E1320] border border-[#232B3E]">
          <h2 className="text-3xl font-extrabold text-white">
            See BuildWise in Action
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Experience our automated screening pipeline with a pre-computed commercial office sample project.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/how-it-works/demo')}
              className="px-6 py-3.5 rounded-xl bg-[#1D2333] hover:bg-[#252D42] text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Explore Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/projects/new')}
              className="px-6 py-3.5 rounded-xl bg-[#5448EC] hover:bg-[#4639D9] text-white font-semibold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-slate-500 max-w-xl mx-auto">
          BuildWise AI is an automated screening tool based on the National Building Code of India 2016. It does not replace statutory municipal approval or licensed architectural review.
        </p>
      </section>
    </div>
  )
}
