import React, { useEffect, useState, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  MessageCircle,
  Terminal,
  Send,
  Paperclip,
  Leaf,
  GitBranch,
  CheckSquare,
  ChevronRight,
  MoreHorizontal,
  Hash,
  Command,
  FileText } from
'lucide-react';
import { MOCK_TODOS, MOCK_CLI_HISTORY } from '../data/taskBoardData';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import { useLensDropZone } from '../hooks/useAILens';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { getNoteById } from '../data/agentxNotes';
// --- Types & Mock Data ---
const MOCK_TASKS = [
{
  id: 't1',
  title: 'Build task list component',
  status: 'in-progress',
  priority: 'high',
  branch: 'feature/ui-refactor',
  agentxNoteId: 'bree.components.task-list',
  agentxNoteContent: JSON.stringify([
  {
    type: 'heading',
    props: {
      level: 1
    },
    content: 'Task List Component'
  },
  {
    type: 'paragraph',
    content: 'Displays tasks grouped by status with inline editing.'
  },
  {
    type: 'heading',
    props: {
      level: 3
    },
    content: 'AgentX Metadata'
  },
  {
    type: 'bulletListItem',
    content: 'ID: bree.components.task-list'
  }]
  )
},
{
  id: 't2',
  title: 'Implement drag and drop',
  status: 'todo',
  priority: 'medium',
  branch: 'feature/dnd-impl'
},
{
  id: 't3',
  title: 'Add keyboard shortcuts',
  status: 'todo',
  priority: 'low',
  branch: 'feature/a11y-shortcuts'
},
{
  id: 't4',
  title: 'Train task priority model',
  status: 'done',
  priority: 'urgent',
  branch: 'model/priority-v2'
}];

type TabType = 'task' | 'vine' | 'cli';
// --- Components ---
function TaskSwitcher({
  activeIndex,
  onChange



}: {activeIndex: number;onChange: (index: number) => void;}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
      {MOCK_TASKS.map((task, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={task.id}
            onClick={() => onChange(index)}
            className={`
              relative px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${isActive ? 'text-slate-900 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
            `}>

            {task.id}
          </button>);

      })}
    </div>);

}
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count






}: {active: boolean;onClick: () => void;icon: any;label: string;count?: number;}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all
        ${active ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}
      `}>

      <Icon size={16} />
      <span>{label}</span>
      {count !== undefined && count > 0 &&
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>

          {count}
        </span>
      }
    </button>);

}
// --- Main Page ---
export function TaskBoardPage() {
  const { taskId } = useParams();
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('task');
  const [todos, setTodos] = useState(MOCK_TODOS);
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState(MOCK_CLI_HISTORY);
  const [vineInput, setVineInput] = useState('');
  // Use the first conversation as mock data
  const vineConversation = VINE_CONVERSATIONS[0];
  const activeTask = MOCK_TASKS[activeTaskIndex] as any;
  // AI Lens drop zone
  const taskZone = useLensDropZone({
    id: `task-board-${activeTask.id}`,
    label: `Task: ${activeTask.title}`,
    pageId: 'task-board',
    dataType: 'tasks',
    getData: () => ({
      tasks: MOCK_TASKS as any,
      vines: [vineConversation],
      grapes: [],
      project: null
    }),
    getSummary: () =>
    `Task "${activeTask.title}" (${activeTask.status}, ${activeTask.priority} priority)`
  });
  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((t) =>
      t.id === id ?
      {
        ...t,
        completed: !t.completed
      } :
      t
      )
    );
  };
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    const newHistory = [
    ...cliHistory,
    {
      type: 'user',
      content: cliInput
    }];

    setCliHistory(newHistory);
    setCliInput('');
    // Mock response
    setTimeout(() => {
      setCliHistory((prev) => [
      ...prev,
      {
        type: 'agent',
        content: `Processing command: ${cliInput}...`
      }]
      );
    }, 600);
  };
  const getSenderAvatar = (senderId: string) => {
    const member = TEAM_MEMBERS.find((m) => m.id === senderId);
    return member?.avatar || '??';
  };
  // Calculate progress
  const completedTodos = todos.filter((t) => t.completed).length;
  const progress = Math.round(completedTodos / todos.length * 100);
  // Initialize read-only editor if note content exists
  const noteEditor = useCreateBlockNote({
    initialContent: activeTask.agentxNoteContent ?
    JSON.parse(activeTask.agentxNoteContent) :
    undefined
  });
  // Update editor content when active task changes
  useEffect(() => {
    if (activeTask.agentxNoteContent) {
      const blocks = JSON.parse(activeTask.agentxNoteContent);
      noteEditor.replaceBlocks(noteEditor.document, blocks);
    }
  }, [activeTask, noteEditor]);
  // Get note metadata if ID exists
  const noteMetadata = activeTask.agentxNoteId ?
  getNoteById(activeTask.agentxNoteId) :
  null;
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Minimal Top Navigation */}
      <nav className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">

            <ArrowLeft size={18} />
          </Link>

          <div className="h-4 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">Task Board</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-500">
              {activeTask.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TaskSwitcher
            activeIndex={activeTaskIndex}
            onChange={setActiveTaskIndex} />

          <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </nav>

      <main
        className={`flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col gap-8 ${taskZone.dropClassName} transition-all duration-200`}
        {...taskZone.dropProps}>

        {/* Header Area */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-100">
              <GitBranch size={12} />
              <span>{activeTask.branch}</span>
            </div>
            <span>•</span>
            <span>Updated 2h ago</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight max-w-3xl">
              {activeTask.title}
            </h1>
            <div className="flex gap-2 shrink-0">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${activeTask.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : activeTask.status === 'in-progress' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>

                {activeTask.status === 'in-progress' ?
                'In Progress' :
                activeTask.status}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${activeTask.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-100' : activeTask.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>

                {activeTask.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 flex gap-6">
          <TabButton
            active={activeTab === 'task'}
            onClick={() => setActiveTab('task')}
            icon={CheckSquare}
            label="Overview" />

          <TabButton
            active={activeTab === 'vine'}
            onClick={() => setActiveTab('vine')}
            icon={Leaf}
            label="Vine Chat"
            count={vineConversation.unreadCount} />

          <TabButton
            active={activeTab === 'cli'}
            onClick={() => setActiveTab('cli')}
            icon={Terminal}
            label="Terminal" />

        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* TASK VIEW */}
            {activeTab === 'task' &&
            <motion.div
              key="task"
              initial={{
                opacity: 0,
                y: 5
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -5
              }}
              transition={{
                duration: 0.15
              }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                <div className="lg:col-span-2 space-y-8">
                  {/* Description */}
                  <div className="prose prose-slate prose-sm max-w-none text-slate-600">
                    <p className="leading-relaxed">
                      Create a focused workspace for single tasks. The layout
                      should be a bento-grid style with the task card as the
                      centerpiece, surrounded by context panels for code, chat,
                      and AI assistance.
                    </p>
                  </div>

                  {/* Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-slate-400" />
                        Acceptance Criteria
                      </h3>
                      <span className="text-xs font-medium text-slate-400">
                        {progress}% complete
                      </span>
                    </div>

                    <div className="space-y-1">
                      {todos.map((todo) =>
                    <button
                      key={todo.id}
                      onClick={() => toggleTodo(todo.id)}
                      className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group">

                          <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-violet-400 bg-white'}`}>

                            {todo.completed &&
                        <CheckCircle2 size={12} className="text-white" />
                        }
                          </div>
                          <span
                        className={`text-sm ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>

                            {todo.text}
                          </span>
                        </button>
                    )}
                    </div>
                  </div>

                  {/* AgentX Note Section */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-violet-500" />
                        AgentX Note
                      </h3>
                      {noteMetadata &&
                    <span className="text-xs font-mono text-violet-500 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                          {noteMetadata.id}
                        </span>
                    }
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                      {activeTask.agentxNoteContent ?
                    <div className="p-4">
                          <BlockNoteView
                        editor={noteEditor}
                        editable={false}
                        theme="light" />

                        </div> :

                    <div className="p-8 text-center text-slate-400 text-sm italic">
                          No AgentX Note attached to this task.
                        </div>
                    }
                    </div>
                  </div>
                </div>

                {/* Sidebar Meta */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Details
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Calendar size={12} /> Due Date
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          Oct 24, 2024
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock size={12} /> Est. Time
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          4 hours
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-500 mb-2">
                        Assignees
                      </div>
                      <div className="flex -space-x-2">
                        {TEAM_MEMBERS.slice(0, 3).map((m) =>
                      <div
                        key={m.id}
                        className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600"
                        title={m.name}>

                            {m.avatar}
                          </div>
                      )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button className="w-full px-4 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-violet-200">
                      <CheckCircle2 size={16} />
                      Mark Complete
                    </button>
                    <button className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2">
                      <Paperclip size={16} />
                      Attach File
                    </button>
                  </div>
                </div>
              </motion.div>
            }

            {/* VINE CHAT VIEW */}
            {activeTab === 'vine' &&
            <motion.div
              key="vine"
              initial={{
                opacity: 0,
                y: 5
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -5
              }}
              transition={{
                duration: 0.15
              }}
              className="flex flex-col h-[600px] border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">

                {/* Header */}
                <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 relative z-10 bg-white border-b border-slate-50">
                  <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white shadow-lg mb-3"
                  style={{
                    background:
                    'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
                    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.25)'
                  }}>

                    <MessageCircle size={22} fill="white" />
                  </div>

                  <h3 className="font-vine font-bold text-xl text-[#3c2415] text-center leading-tight">
                    {vineConversation.topic}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-xs font-medium text-[#2d6a4f]">
                      {vineConversation.participants.
                    map((p) => {
                      const m = TEAM_MEMBERS.find((tm) => tm.id === p);
                      return m?.name.split(' ')[0];
                    }).
                    join(' & ')}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-8">
                  {/* Vine SVG Spine Background */}
                  <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 flex justify-center">
                    <svg width="100%" height="100%" className="opacity-30">
                      <path
                      d="M430,0 Q450,100 430,200 Q410,300 430,400 Q450,500 430,600 Q410,700 430,800 Q450,900 430,1000"
                      fill="none"
                      stroke="#52b788"
                      strokeWidth="2.5"
                      strokeLinecap="round" />

                    </svg>
                  </div>

                  <div className="relative z-10 flex flex-col max-w-3xl mx-auto pb-20">
                    <AnimatePresence initial={false}>
                      {vineConversation.messages.map((msg, idx) => {
                      const isLeft = msg.senderCategory === 'human-design';
                      // Overlap logic: negative margin for all except first
                      const marginTop = idx === 0 ? 0 : -32;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{
                            opacity: 0,
                            y: 16
                          }}
                          animate={{
                            opacity: 1,
                            y: 0
                          }}
                          transition={{
                            delay: idx * 0.12,
                            duration: 0.5,
                            ease: 'easeOut'
                          }}
                          style={{
                            marginTop
                          }}
                          className={`flex w-full ${isLeft ? 'justify-start pr-[50%]' : 'justify-end pl-[50%] flex-row-reverse'} gap-4`}>

                            {/* Avatar */}
                            <div
                            className="w-11 h-11 min-w-[44px] rounded-full flex items-center justify-center text-xs font-vine font-bold text-white shadow-sm z-20 mt-1"
                            style={{
                              backgroundColor: isLeft ? '#e07852' : '#0284c7',
                              boxShadow: '0 3px 14px rgba(0,0,0,0.12)'
                            }}>

                              {getSenderAvatar(msg.senderId)}
                            </div>

                            {/* Message Body */}
                            <div
                            className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} min-w-0 flex-1 z-10`}>

                              {/* Meta */}
                              <div
                              className={`flex items-center gap-2 mb-1.5 ${isLeft ? '' : 'flex-row-reverse'}`}>

                                <span className="font-vine font-medium text-sm text-[#3c2415]">
                                  {msg.senderName}
                                </span>
                                <span className="text-xs text-[#94a3b8]">
                                  {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }
                                )}
                                </span>
                              </div>

                              {/* Bubble */}
                              <div
                              className={`relative p-[22px] text-sm leading-relaxed text-[#334155] bg-white transition-shadow hover:shadow-md`}
                              style={{
                                borderRadius: isLeft ?
                                '22px 22px 22px 4px' :
                                '22px 22px 4px 22px',
                                border: isLeft ?
                                '1.5px solid rgba(45, 106, 79, 0.12)' :
                                '1.5px solid rgba(2, 132, 199, 0.10)',
                                boxShadow: isLeft ?
                                '0 2px 12px rgba(45, 106, 79, 0.06)' :
                                '0 2px 12px rgba(2, 132, 199, 0.06)'
                              }}>

                                {/* Accent Strip */}
                                {isLeft ?
                              <div
                                className="absolute top-0 left-0 w-1 h-full rounded-l-[4px] opacity-40"
                                style={{
                                  background:
                                  'linear-gradient(to bottom, #52b788, #2d6a4f)'
                                }} /> :


                              <div
                                className="absolute top-0 right-0 w-1 h-full rounded-r-[4px] opacity-35"
                                style={{
                                  background:
                                  'linear-gradient(to bottom, #38bdf8, #0284c7)'
                                }} />

                              }

                                {msg.content}
                              </div>
                            </div>
                          </motion.div>);

                    })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-t from-white via-white to-transparent z-20">
                  <div className="relative max-w-2xl mx-auto flex items-center gap-3">
                    <input
                    type="text"
                    value={vineInput}
                    onChange={(e) => setVineInput(e.target.value)}
                    placeholder="Message the team..."
                    className="flex-1 px-6 py-4 rounded-[28px] bg-white text-sm text-[#1e293b] outline-none transition-all placeholder-[#94a3b8]"
                    style={{
                      border: '1.5px solid rgba(45, 106, 79, 0.15)',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
                    }} />

                    <button
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                      background:
                      'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
                      boxShadow: '0 4px 16px rgba(45, 106, 79, 0.25)'
                    }}>

                      <Send size={20} color="white" className="ml-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            }

            {/* CLI VIEW */}
            {activeTab === 'cli' &&
            <motion.div
              key="cli"
              initial={{
                opacity: 0,
                y: 5
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -5
              }}
              transition={{
                duration: 0.15
              }}
              className="flex flex-col h-[600px] bg-[#0f172a] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">

                <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  </div>
                  <div className="ml-2 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                    <Terminal size={10} />
                    aria-agent — zsh
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono text-xs md:text-sm space-y-2">
                  {cliHistory.map((msg, i) =>
                <div
                  key={i}
                  className={`break-words leading-relaxed ${msg.type === 'user' ? 'text-amber-400' : msg.type === 'agent' ? 'text-emerald-400' : msg.type === 'success' ? 'text-green-400' : 'text-slate-500'}`}>

                      <span className="opacity-50 mr-2 select-none">
                        {msg.type === 'user' ?
                    '>' :
                    msg.type === 'system' ?
                    '#' :
                    '$'}
                      </span>
                      {msg.content}
                    </div>
                )}
                </div>

                <form
                onSubmit={handleCliSubmit}
                className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">

                  <span className="text-emerald-500 font-bold text-sm select-none">
                    {'>'}
                  </span>
                  <input
                  type="text"
                  value={cliInput}
                  onChange={(e) => setCliInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-sm placeholder:text-slate-700"
                  placeholder="Enter command..."
                  autoComplete="off"
                  autoFocus />

                </form>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </main>
    </div>);

}