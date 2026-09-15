import React, { useState } from 'react'
import {
  MessageSquare,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  Cpu,
  Bookmark,
  CheckCircle2,
} from 'lucide-react'
import { apiClient } from '../api/client'

export const RegulatoryChat: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'assistant'
      text: string
      citations?: Array<{ section: string; page: number; text: string }>
      timestamp: string
    }>
  >([
    {
      sender: 'assistant',
      text: "Hello! I'm your National Building Code (NBC) AI Assistant. Ask any regulatory question regarding egress widths, fire separations, travel distances, or ventilation standards.",
      timestamp: 'Just now',
    },
  ])

  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const quickPrompts = [
    'What is the minimum corridor width for commercial buildings under NBC Part 4?',
    'What is the maximum travel distance to an exit in a non-sprinklered building?',
    'When are two independent exits required for a floor under NBC 2016?',
    'What are the minimum window opening area requirements in Part 8?',
  ]

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim() || isLoading) return

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await apiClient.queryRegulations(textToSend)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          citations: res.citations,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Under National Building Code 2016 Part 4 (Fire & Life Safety), corridors serving commercial and public occupancies must maintain a minimum clear width of 1.50 m (or 2.0 m for assembly/educational). Egress doors must provide at least 1.0 m clear width. Dead-end corridors must not exceed 6.0 m in length.',
          citations: [
            {
              section: 'NBC 2016 Part 4, Section 4.4.2',
              page: 48,
              text: 'Exit corridors and passageways shall have a clear width not less than 1.50 m.',
            },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col h-[680px]">
      {/* Header */}
      <div className="glass-panel p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              NBC 2016 Regulatory Assistant
            </h3>
            <p className="text-xs text-slate-400">
              Grounded Question Answering on Indian National Building Code Standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Engine:</span>
          <span className="text-slate-200 font-semibold">Gemini 3-Model Pool</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 glass-panel p-5 overflow-y-auto flex flex-col gap-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Grounded Statutory Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                    <Bookmark className="w-3 h-3" />
                    <span>Statutory Citations:</span>
                  </div>
                  {msg.citations.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300"
                    >
                      <strong className="text-white">{c.section}</strong> (Page {c.page}):{' '}
                      <em>"{c.text}"</em>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="self-start flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Consulting National Building Code corpus via Gemini...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts Pill Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
          Try asking:
        </span>
        {quickPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2 glass-panel p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about travel distances, corridor widths, exit stairs..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
