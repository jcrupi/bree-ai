import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap,
  ArrowRight,
  BarChart3,
  Lock } from
'lucide-react';
import { AILens } from '../data/aiLenses';
import { Task, VineConversation, Grape, Project } from '../types';
interface AILensOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  lens: AILens | null;
  targetCard: string | null;
  initialAnalysis: string;
  data: {
    tasks: Task[];
    vines: VineConversation[];
    grapes: Grape[];
    project: Project | null;
  };
}
interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
}
export function AILensOverlay({
  isOpen,
  onClose,
  lens,
  targetCard,
  initialAnalysis,
  data
}: AILensOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      setMessages([]); // Clear previous chat
    }
  }, [isOpen, lens]);
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `I've updated the visualization based on your query about "${inputValue}". Is there anything specific you'd like to drill down into?`
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  if (!isOpen || !lens) return null;
  // ─── VISUALIZATION COMPONENTS ───
  const RiskView = () =>
  <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
          <div className="text-rose-600 font-bold text-sm mb-1 flex items-center gap-2">
            <AlertTriangle size={16} /> High Risk Items
          </div>
          <div className="text-3xl font-bold text-slate-900">3</div>
          <div className="text-xs text-rose-600/80 mt-1">+1 from last week</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
          <div className="text-amber-600 font-bold text-sm mb-1 flex items-center gap-2">
            <AlertTriangle size={16} /> Medium Risk
          </div>
          <div className="text-3xl font-bold text-slate-900">5</div>
          <div className="text-xs text-amber-600/80 mt-1">Stable</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <div className="text-emerald-600 font-bold text-sm mb-1 flex items-center gap-2">
            <CheckCircle2 size={16} /> Low Risk
          </div>
          <div className="text-3xl font-bold text-slate-900">12</div>
          <div className="text-xs text-emerald-600/80 mt-1">Improving</div>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle size={18} className="text-rose-500" /> Risk Heatmap
      </h3>
      <div className="space-y-3">
        {data.tasks.slice(0, 5).map((task, i) =>
      <div
        key={task.id}
        className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">

            <div
          className={`w-2 h-12 rounded-full ${i === 0 ? 'bg-rose-500' : i < 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} />

            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-800">
                  {task.title}
                </span>
                <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-rose-100 text-rose-700' : i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>

                  {i === 0 ? 'CRITICAL' : i < 3 ? 'WARNING' : 'SAFE'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {i === 0 ?
            'Blocked by external dependency (Auth API)' :
            i < 3 ?
            'Approaching deadline with no recent activity' :
            'On track, normal velocity'}
              </p>
            </div>
          </div>
      )}
      </div>
    </div>;

  const ProgressView = () =>
  <div className="h-full overflow-y-auto p-6">
      <div className="mb-8">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-500" /> Velocity Forecast
        </h3>
        <div className="h-48 flex items-end gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
          {[30, 45, 35, 50, 60, 55, 75].map((h, i) =>
        <div
          key={i}
          className="flex-1 flex flex-col justify-end group relative">

              <div
            className="w-full bg-blue-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500"
            style={{
              height: `${h}%`
            }} />

              <span className="text-[10px] text-slate-400 text-center mt-2">
                W{i + 1}
              </span>
              {i === 6 &&
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                  Projected
                </div>
          }
            </div>
        )}
          {/* Trend line overlay mock */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <path
              d="M0,100 C50,80 100,90 150,70 S250,60 300,40 S400,30 500,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-blue-600" />

            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-slate-700 mb-3 text-sm">
            Completion by Area
          </h4>
          <div className="space-y-3">
            {['Frontend', 'Backend', 'Design', 'DevOps'].map((area, i) =>
          <div key={area}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{area}</span>
                  <span className="text-slate-400">{70 - i * 10}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${70 - i * 10}%`
                }} />

                </div>
              </div>
          )}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h4 className="font-bold text-blue-800 mb-2 text-sm">AI Insight</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Based on current velocity, the team is performing{' '}
            <strong>15% above average</strong>. The backend refactor is the main
            bottleneck. Recommend reallocating 1 frontend resource to assist
            with API integration.
          </p>
        </div>
      </div>
    </div>;

  const IdeaView = () =>
  <div className="h-full overflow-y-auto p-6 bg-slate-50/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-full bg-amber-100/50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Lightbulb size={20} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Creative Synthesis</h3>
            <p className="text-sm text-amber-800/80 mt-1">
              Analyzing {data.tasks.length} tasks and {data.vines.length}{' '}
              conversations generated 4 new feature concepts.
            </p>
          </div>
        </div>

        {[
      'Smart Notifications',
      'Automated Reporting',
      'Voice Commands',
      'Dark Mode V2'].
      map((idea, i) =>
      <motion.div
        key={idea}
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: i * 0.1
        }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">

            <div className="flex justify-between items-start mb-2">
              <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                Feature
              </span>
              <span className="text-slate-300 group-hover:text-amber-400 transition-colors">
                <Sparkles size={14} />
              </span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">{idea}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Suggested based on user feedback in "Mobile Navigation" vine and
              high usage of the dashboard component.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2].map((k) =>
            <div
              key={k}
              className="w-5 h-5 rounded-full bg-slate-200 border border-white" />

            )}
              </div>
              <span className="text-[10px] text-slate-400">
                +2 related tasks
              </span>
            </div>
          </motion.div>
      )}
      </div>
    </div>;

  const SecurityView = () =>
  <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#e2e8f0"
            strokeWidth="12"
            fill="none" />

            <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#10b981"
            strokeWidth="12"
            fill="none"
            strokeDasharray="440"
            strokeDashoffset="110"
            strokeLinecap="round" />

          </svg>
          <div className="absolute text-center">
            <div className="text-4xl font-bold text-slate-800">75</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Score
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="p-2 bg-white rounded-full text-red-500 shadow-sm">
            <Lock size={16} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-700 text-sm">
              Auth Token Expiry
            </h4>
            <p className="text-xs text-red-600/80">
              JWT tokens currently have no expiration set.
            </p>
          </div>
          <button className="px-3 py-1 bg-white text-red-600 text-xs font-bold rounded border border-red-200 hover:bg-red-50">
            Fix
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="p-2 bg-white rounded-full text-amber-500 shadow-sm">
            <Shield size={16} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-700 text-sm">
              Dependency Audit
            </h4>
            <p className="text-xs text-amber-600/80">
              3 packages have minor vulnerabilities.
            </p>
          </div>
          <button className="px-3 py-1 bg-white text-amber-600 text-xs font-bold rounded border border-amber-200 hover:bg-amber-50">
            Review
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg opacity-75">
          <div className="p-2 bg-white rounded-full text-emerald-500 shadow-sm">
            <CheckCircle2 size={16} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-700 text-sm">
              HTTPS Enforcement
            </h4>
            <p className="text-xs text-emerald-600/80">
              Enabled on all endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>;

  const PriorityView = () =>
  <div className="h-full overflow-y-auto p-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-violet-50 border border-violet-100 p-4 rounded-xl text-center">
          <div className="text-violet-600 font-bold text-2xl">4.2x</div>
          <div className="text-xs text-violet-400 uppercase font-bold tracking-wider">
            Impact Multiplier
          </div>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
          <div className="text-slate-600 font-bold text-2xl">-12%</div>
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
            Effort Reduction
          </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Zap size={18} className="text-violet-500" /> Optimized Workflow
      </h3>

      <div className="relative space-y-4 pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {data.tasks.slice(0, 4).map((task, i) =>
      <div
        key={task.id}
        className="relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">

            <div
          className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ring-2 ${i === 0 ? 'bg-violet-500 text-white ring-violet-100' : 'bg-slate-100 text-slate-500 ring-slate-50'}`}>

              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold text-sm text-slate-800">
                  {task.title}
                </span>
                {i === 0 &&
            <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    High Impact
                  </span>
            }
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">
                  Effort: {['Low', 'Med', 'High'][i % 3]}
                </span>
                <ArrowRight size={10} className="text-slate-300" />
                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">
                  Unblocks: {2 + (3 - i)} tasks
                </span>
              </div>
            </div>
          </div>
      )}
      </div>
    </div>;

  // ─── RENDER ───
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" />


          {/* Window */}
          <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">

            <div className="w-full max-w-4xl h-[80vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div
              className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${lens.color.replace('text-', 'bg-').replace('600', '50/50')}`}>

                <div className="flex items-center gap-4">
                  <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm bg-white`}>

                    {lens.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {lens.name}
                      <span className="text-xs font-normal px-2 py-0.5 bg-white/60 rounded-full text-slate-600 border border-slate-100/50">
                        {targetCard} View
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 opacity-90">
                      {lens.description}
                    </p>
                  </div>
                </div>
                <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-700 transition-colors">

                  <X size={24} />
                </button>
              </div>

              {/* Main Content - Visualization */}
              <div className="flex-1 bg-slate-50/30 overflow-hidden relative">
                {lens.id === 'risk-scanner' && <RiskView />}
                {lens.id === 'progress-analyst' && <ProgressView />}
                {lens.id === 'idea-generator' && <IdeaView />}
                {lens.id === 'security-auditor' && <SecurityView />}
                {lens.id === 'priority-optimizer' && <PriorityView />}

                {/* Fallback for unknown lens */}
                {![
              'risk-scanner',
              'progress-analyst',
              'idea-generator',
              'security-auditor',
              'priority-optimizer'].
              includes(lens.id) &&
              <div className="p-8 text-center text-slate-400">
                    Visualization not available for this lens.
                  </div>
              }
              </div>

              {/* Chat Footer (Secondary) */}
              <div className="p-4 bg-white border-t border-slate-100">
                {/* Chat History (Collapsible/Overlay style) */}
                {messages.length > 0 &&
              <div className="mb-4 max-h-32 overflow-y-auto space-y-2 px-2">
                    {messages.map((msg) =>
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                        <div
                    className={`text-xs px-3 py-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>

                          {msg.content}
                        </div>
                      </div>
                )}
                    {isTyping &&
                <div className="text-xs text-slate-400 italic px-2">
                        AI is analyzing...
                      </div>
                }
                  </div>
              }

                <div className="relative flex items-center gap-2">
                  <div className="absolute left-4 text-slate-400">
                    <Bot size={18} />
                  </div>
                  <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${lens.name} a follow-up question...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />

                  <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md active:scale-95 transform duration-100">

                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}