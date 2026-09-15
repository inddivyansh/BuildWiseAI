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
  UploadCloud,
  FileCheck2,
  Compass,
  ChevronDown,
  Download,
  Terminal,
} from 'lucide-react'
import { Wireframe3D } from '../components/common/Wireframe3D'

interface LandingPageProps {
  onNavigate: (route: string) => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#6B57FF] selection:text-white">
      {/* JetBrains Hero Section (Inspired by jetbrains.com) */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-[#161B26]">
        {/* Massive JetBrains Violet Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[radial-gradient(circle_at_50%_20%,rgba(107,87,255,0.38),rgba(155,81,224,0.18),transparent_70%)] blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-white leading-[1.08] max-w-5xl">
            Building the Architectural Compliance Intelligence
          </h1>

          <p className="mt-6 text-base sm:text-xl text-[#B4BDD4] max-w-2xl font-normal leading-relaxed">
            An open platform for algorithmic blueprint screening and statutory NBC 2016 verification — with you in control.
          </p>

          {/* JetBrains-Style Action Buttons Row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/projects/new')}
              className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-black font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Analyze Your Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/how-it-works/demo')}
              className="px-8 py-3.5 rounded-full bg-[#0D0F17] hover:bg-[#151926] text-white font-semibold text-sm border border-[#2B344D] hover:border-[#6B57FF] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Explore Demo Studio</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 font-mono">
            Direct deterministic rule checking against National Building Code of India 2016
          </p>

          {/* JetBrains Centerpiece Showcase: CAD & AI Compliance Studio Window */}
          <div className="mt-14 w-full max-w-5xl rounded-2xl bg-[#090C14] border border-[#1E2538] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Window Title Bar */}
            <div className="px-4 py-3 bg-[#0B0E18] border-b border-[#1A2133] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FE2857]/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#FFB800]/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#00F0FF]/80 inline-block" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 ml-2">riverside_lvl01_architecture.dxf — BuildWise Studio</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-400">● NBC 2016 Compliant Engine</span>
                <span className="px-2 py-0.5 rounded bg-[#161D2E] text-slate-300">CGM v2.4</span>
              </div>
            </div>

            {/* Studio Workspace Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-[#070910]">
              {/* Left Layers & Entities Sidebar */}
              <div className="md:col-span-3 border-r border-[#161D2E] p-4 text-left font-mono text-xs space-y-3 bg-[#080A12]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CAD Layers</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>A-WALL-EXTR (24)</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>A-DOOR-SWNG (8)</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>A-ROOM-BOUND (6)</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>A-EGRESS-PATH (2)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#161D2E]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Evaluated Rules</div>
                  <div className="p-2 rounded bg-[#0F1424] border border-[#1E2942] text-[10px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Corridor Width</span>
                      <span className="text-rose-400 font-bold">FAIL (1.0m)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Travel Distance</span>
                      <span className="text-emerald-400 font-bold">PASS (18.2m)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Door Swing Clearance</span>
                      <span className="text-emerald-400 font-bold">PASS (1.05m)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Canvas Viewport */}
              <div className="md:col-span-6 p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(#1A2234_1px,transparent_1px)] [background-size:24px_24px]">
                <Wireframe3D className="w-full max-w-[340px] h-auto" accentColor="#6B57FF" isDark={true} />

                {/* Floating Inspection Tooltip */}
                <div className="absolute bottom-6 bg-[#0E1322]/95 backdrop-blur-md border border-[#2B3754] rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Corridor Width Violation</div>
                    <div className="text-[10px] text-slate-400 font-mono">Measured: 1.0m · NBC Required: ≥ 1.5m</div>
                  </div>
                </div>
              </div>

              {/* Right Regulatory Agent Chat Panel */}
              <div className="md:col-span-3 border-l border-[#161D2E] p-4 text-left font-sans text-xs bg-[#080A12] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-[#161D2E]">
                    <div className="w-5 h-5 rounded bg-[#6B57FF] flex items-center justify-center text-white text-[10px] font-bold font-mono">
                      BW
                    </div>
                    <span className="font-bold text-white text-xs">NBC Assistant</span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-[#0F1424] border border-[#1E2942] text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-indigo-400 font-bold font-mono block mb-1">Clause 4.3.2 Citation:</span>
                    "For residential apartment buildings, minimum corridor clear width shall be 1.5 metres to allow safe egress."
                  </div>
                </div>

                <div className="pt-3 border-t border-[#161D2E]">
                  <button
                    onClick={() => onNavigate('/how-it-works/demo')}
                    className="w-full py-2 rounded-lg bg-[#6B57FF] hover:bg-[#5844ED] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Interactive Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* JetBrains Banner Card with Teal Glow (Inspired by jetbrains.com) */}
          <div className="mt-12 w-full max-w-5xl rounded-3xl bg-gradient-to-r from-[#0C1A24] via-[#09151E] to-[#080C14] border border-[#00F0FF]/30 p-8 sm:p-10 sm:pl-14 relative overflow-hidden text-left shadow-[0_0_40px_rgba(0,240,255,0.08)]">
            {/* Left Vertical Tab Tag */}
            <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(50%-12px)] -rotate-90 bg-[#00F0FF] text-black font-bold text-[10px] tracking-widest px-3 py-0.5 rounded-t uppercase whitespace-nowrap origin-center">
              NBC 2016 Compliant
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <div className="flex items-center gap-2 text-[#00F0FF] font-mono text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Algorithmic Rule Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Run statutory compliance screening side by side with geometry verification
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Turn architectural blueprints into mathematical graphs. Verify corridor widths, dead-end travel distances, stair dimensions, and door swings deterministically.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onNavigate('/projects/new')}
                    className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Upload Blueprint
                  </button>
                  <button
                    onClick={() => onNavigate('/how-it-works')}
                    className="text-xs font-semibold text-[#00F0FF] hover:underline flex items-center gap-1.5"
                  >
                    <span>Learn how the pipeline works</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 bg-[#060A12] border border-[#162234] rounded-2xl p-4 text-xs font-mono">
                <div className="text-slate-400 pb-2 border-b border-slate-800 text-[11px] flex justify-between">
                  <span>NBC Automated Audit</span>
                  <span className="text-emerald-400">STATUS: PASSING</span>
                </div>
                <div className="space-y-2 mt-3 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-[#0A101C]">
                    <span className="text-slate-300">Corridor Minimum Width</span>
                    <span className="text-emerald-400">1.50m (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#0A101C]">
                    <span className="text-slate-300">Stair Treads & Risers</span>
                    <span className="text-emerald-400">150mm / 300mm</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#0A101C]">
                    <span className="text-slate-300">Dead-End Travel Limit</span>
                    <span className="text-amber-400">6.0m limit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JetBrains "For {Architects}" Suite of Tools Section (media_1789507087912.png) */}
      <section className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="text-left mb-8">
          <span className="text-xs font-mono font-bold text-[#00F0FF] tracking-wider">
            For &#123;architects & builders&#125;
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Enjoy designing compliant buildings
          </h2>
        </div>

        {/* Deep JetBrains Purple Container with Featured Badge */}
        <div className="rounded-3xl bg-[#0E0C1C] border border-[#271E4A] p-8 sm:p-12 sm:pl-14 relative overflow-hidden shadow-2xl">
          {/* Left Vertical Tab */}
          <div className="hidden sm:block absolute left-0 top-24 -translate-x-[calc(50%-12px)] -rotate-90 bg-[#6B57FF] text-white font-bold text-[10px] tracking-widest px-3 py-0.5 rounded-t uppercase whitespace-nowrap origin-center">
            Featured
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white mb-8">
            A rich suite of tools that provide an exceptional architectural screening experience
          </h3>

          {/* 6 Engineering Tool Cards Grid (Inspired by JetBrains Tool Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tool 1: CGM */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B57FF] to-[#00F0FF] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    CG
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Canonical Geometry Engine</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Extract walls, rooms, doors, stairs, and openings from DXF, PDF, or raster scans into clean geometry.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-indigo-400">Standardized Spatial Schema</span>
              </div>
            </div>

            {/* Tool 2: NBC Engine */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FE2857] to-[#FFB800] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    NB
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Deterministic Rule Engine</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Evaluates 100+ statutory clauses from National Building Code of India 2016 Part 3 & 4 with mathematical shortfall.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-rose-400">Strict Source Grounding</span>
              </div>
            </div>

            {/* Tool 3: Egress Graph */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#10B981] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    GR
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Topological Egress Graph</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  NetworkX spatial circulation graphs computing travel distances, room connectivity, and bottleneck detection.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-emerald-400">Dijkstra Circulation Paths</span>
              </div>
            </div>

            {/* Tool 4: Regulatory RAG */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B51E0] to-[#FE2857] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    AI
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Grounded Regulatory RAG</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Interactive AI legal assistant anchored directly into verified NBC PDF clauses with exact Volume, Part, and Page citations.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-purple-400">Zero Hallucination Anchor</span>
              </div>
            </div>

            {/* Tool 5: Vision Pipeline */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#10B981] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    VP
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Vector Ingestion Pipeline</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Direct extraction of PDF vector paths and DXF entities, ensuring zero resolution loss during geometry construction.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-amber-400">High-Precision Geometry</span>
              </div>
            </div>

            {/* Tool 6: Municipal Report */}
            <div className="p-6 rounded-2xl bg-[#141228] border border-[#2B2352] hover:border-[#6B57FF] transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#6B57FF] p-[1.5px] mb-4">
                  <div className="w-full h-full bg-[#110E24] rounded-[10px] flex items-center justify-center font-mono font-bold text-white text-xs">
                    RP
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">Statutory Audit Reports</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Client-ready and municipal-submission audit documentation formatted with shortfall calculations and statutory stamps.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#231C44]">
                <span className="text-[10px] font-mono text-cyan-400">Print & PDF Export</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-left">
            <button
              onClick={() => onNavigate('/how-it-works')}
              className="text-xs font-semibold text-white hover:text-[#6B57FF] transition-colors flex items-center gap-1.5"
            >
              <span>Explore all BuildWise engines and compliance workflows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* JetBrains "Trusted by" stat banner */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Trusted across <span className="text-[#6B57FF]">100+ NBC 2016</span> statutory regulations
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-light">
            Empowering students, practicing architects, and structural engineering firms with automated screening.
          </p>
        </div>
      </section>

      {/* JetBrains "Discover More" Section (Inspired by media_1789507108449.png) */}
      <section className="py-20 bg-[#06070B] border-t border-[#161B26]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-10 text-left">
            Discover more
          </h2>

          {/* 4 Dark Rounded Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0D0F17] border border-[#1E2536] flex flex-col justify-between min-h-[220px]">
              <div>
                <UploadCloud className="w-6 h-6 text-white mb-4" />
                <h3 className="text-lg font-bold text-white">Upload Your Blueprint</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Analyze DXF or vector PDF drawings in seconds.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/projects/new')}
                className="mt-6 px-4 py-2 rounded-full border border-slate-700 hover:border-white text-xs font-semibold text-white transition-colors"
              >
                Start Analysis
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D0F17] border border-[#1E2536] flex flex-col justify-between min-h-[220px]">
              <div>
                <Eye className="w-6 h-6 text-white mb-4" />
                <h3 className="text-lg font-bold text-white">Interactive Demo</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Explore pre-computed commercial office analysis.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/how-it-works/demo')}
                className="mt-6 px-4 py-2 rounded-full border border-slate-700 hover:border-white text-xs font-semibold text-white transition-colors"
              >
                Try Interactive Demo
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D0F17] border border-[#1E2536] flex flex-col justify-between min-h-[220px]">
              <div>
                <ShieldCheck className="w-6 h-6 text-white mb-4" />
                <h3 className="text-lg font-bold text-white">NBC 2016 Grounding</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Learn how rules are traced to authoritative PDFs.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/how-it-works')}
                className="mt-6 px-4 py-2 rounded-full border border-slate-700 hover:border-white text-xs font-semibold text-white transition-colors"
              >
                View Pipeline
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D0F17] border border-[#1E2536] flex flex-col justify-between min-h-[220px]">
              <div>
                <FileCheck2 className="w-6 h-6 text-white mb-4" />
                <h3 className="text-lg font-bold text-white">Statutory Reports</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Export PDF documentation ready for authorities.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/projects')}
                className="mt-6 px-4 py-2 rounded-full border border-slate-700 hover:border-white text-xs font-semibold text-white transition-colors"
              >
                View Projects
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* JetBrains Full Dark Multi-Column Footer (Inspired by media_1789507108449.png) */}
      <footer className="bg-[#040508] border-t border-[#121622] pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 pb-12 border-b border-[#1A2132] text-xs">
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Engines</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white">Canonical Model</button></li>
                <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white">Rule Determinism</button></li>
                <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white">Circulation Graph</button></li>
                <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white">Regulatory RAG</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Regulations</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white">NBC 2016 Vol 1</span></li>
                <li><span className="hover:text-white">Part 3 Development</span></li>
                <li><span className="hover:text-white">Part 4 Fire Safety</span></li>
                <li><span className="hover:text-white">Part 8 Services</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Workflows</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => onNavigate('/projects/new')} className="hover:text-white">DXF Parser</button></li>
                <li><button onClick={() => onNavigate('/projects/new')} className="hover:text-white">Vector PDF</button></li>
                <li><button onClick={() => onNavigate('/how-it-works/demo')} className="hover:text-white">Demo Studio</button></li>
                <li><button onClick={() => onNavigate('/projects')} className="hover:text-white">Export Audit</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Audiences</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white">Architects</span></li>
                <li><span className="hover:text-white">Civil Engineers</span></li>
                <li><span className="hover:text-white">Municipal Authorities</span></li>
                <li><span className="hover:text-white">Architecture Students</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-white">Documentation</button></li>
                <li><span className="hover:text-white">Statutory Matrix</span></li>
                <li><span className="hover:text-white">API Reference</span></li>
                <li><span className="hover:text-white">Release Notes</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white">FastAPI Core</span></li>
                <li><span className="hover:text-white">PostgreSQL Vector</span></li>
                <li><span className="hover:text-white">NetworkX Egress</span></li>
                <li><span className="hover:text-white">Gemini 2.5 Pro</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              BuildWise AI is an automated screening assistant. It does not replace statutory municipal review or licensed architectural approval.
            </div>
            <div className="font-mono text-slate-400">
              Developed with drive &amp; JetBrains design inspiration
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
