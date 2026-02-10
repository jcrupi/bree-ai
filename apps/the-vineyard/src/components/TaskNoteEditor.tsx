import React, { useEffect, useMemo, useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ChevronDown,
  Search,
  Cpu,
  Layout,
  Activity,
  Server,
  Eye,
  Check,
  X } from
'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { AGENTX_NOTES } from '../data/agentxNotes';
import { AgentXNote, ComponentType } from '../types';
interface TaskNoteEditorProps {
  onNoteChange: (noteId: string | null, content: string) => void;
  initialNoteId?: string;
}
// Helper to group notes by type
const groupNotesByType = (notes: AgentXNote[]) => {
  const groups: Record<string, AgentXNote[]> = {};
  notes.forEach((note) => {
    if (!groups[note.type]) groups[note.type] = [];
    groups[note.type].push(note);
  });
  return groups;
};
const getTypeIcon = (type: ComponentType) => {
  switch (type) {
    case 'lens':
      return <Eye size={14} className="text-violet-500" />;
    case 'page':
      return <Layout size={14} className="text-blue-500" />;
    case 'component':
      return <div size={14} className="text-emerald-500" />;
    case 'hook':
      return <Activity size={14} className="text-amber-500" />;
    case 'api':
      return <Server size={14} className="text-rose-500" />;
    default:
      return <FileText size={14} className="text-slate-500" />;
  }
};
export function TaskNoteEditor({
  onNoteChange,
  initialNoteId
}: TaskNoteEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<AgentXNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Initialize editor
  const editor = useCreateBlockNote({
    initialContent: [
    {
      type: 'paragraph',
      content: 'Select an AgentX Note template to begin...'
    }]

  });
  // Handle Note Selection
  const handleSelectNote = (note: AgentXNote) => {
    setSelectedNote(note);
    setIsOpen(false);
    // Generate initial blocks from note metadata
    const blocks: any[] = [
    {
      type: 'heading',
      props: {
        level: 1
      },
      content: note.title
    },
    {
      type: 'paragraph',
      props: {
        textColor: 'gray'
      },
      content: note.description
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
      content: [
      {
        type: 'text',
        text: 'ID: ',
        styles: {
          bold: true
        }
      },
      {
        type: 'text',
        text: note.id,
        styles: {
          code: true
        }
      }]

    },
    {
      type: 'bulletListItem',
      content: [
      {
        type: 'text',
        text: 'NATS Subject: ',
        styles: {
          bold: true
        }
      },
      {
        type: 'text',
        text: note.natsSubject,
        styles: {
          code: true
        }
      }]

    },
    {
      type: 'heading',
      props: {
        level: 3
      },
      content: 'Context & Instructions'
    },
    {
      type: 'paragraph',
      content: 'Add specific context for the agent here...'
    }];

    editor.replaceBlocks(editor.document, blocks);
    // Notify parent immediately
    onNoteChange(note.id, JSON.stringify(blocks));
  };
  // Handle editor changes
  const handleEditorChange = () => {
    if (selectedNote) {
      onNoteChange(selectedNote.id, JSON.stringify(editor.document));
    }
  };
  // Filter notes
  const filteredNotes = useMemo(() => {
    return AGENTX_NOTES.filter(
      (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);
  const groupedNotes = useMemo(
    () => groupNotesByType(filteredNotes),
    [filteredNotes]
  );
  return (
    <div className="flex flex-col gap-4 bg-white rounded-xl border border-violet-100 overflow-hidden shadow-sm">
      {/* Header / Selector */}
      <div className="p-4 border-b border-violet-50 bg-violet-50/30">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-violet-200 rounded-lg text-sm hover:border-violet-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-100">

            <div className="flex items-center gap-2">
              {selectedNote ?
              <>
                  {getTypeIcon(selectedNote.type)}
                  <span className="font-semibold text-slate-700">
                    {selectedNote.title}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    {selectedNote.id}
                  </span>
                </> :

              <>
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-slate-500">
                    Select AgentX Note Template...
                  </span>
                </>
              }
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen &&
            <motion.div
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
                y: 5
              }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-[300px] flex flex-col">

                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-10">
                  <div className="relative">
                    <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
                    autoFocus />

                  </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-2 space-y-3">
                  {Object.entries(groupedNotes).map(([type, notes]) =>
                <div key={type}>
                      <div className="px-2 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        {getTypeIcon(type as ComponentType)}
                        {type}s
                      </div>
                      <div className="space-y-1">
                        {notes.map((note) =>
                    <button
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${selectedNote?.id === note.id ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-600'}`}>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">
                                {note.title}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {note.description}
                              </div>
                            </div>
                            {selectedNote?.id === note.id &&
                      <Check size={14} className="text-violet-500" />
                      }
                          </button>
                    )}
                      </div>
                    </div>
                )}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex min-h-[300px]">
        {/* Main Editor */}
        <div className="flex-1 border-r border-violet-50 bg-white">
          <BlockNoteView
            editor={editor}
            onChange={handleEditorChange}
            theme="light"
            className="py-4" />

        </div>

        {/* Metadata Sidebar (Desktop) */}
        {selectedNote &&
        <div className="w-64 bg-slate-50/50 p-4 hidden md:block overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Metadata
            </h4>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-slate-500 font-medium mb-1">
                  Compatible Lenses
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNote.lensAccepts.length > 0 ?
                selectedNote.lensAccepts.map((lens) =>
                <span
                  key={lens}
                  className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[9px] font-medium border border-violet-200">

                        {lens.replace('-lens', '').replace('-', ' ')}
                      </span>
                ) :

                <span className="text-[10px] text-slate-400 italic">
                      None
                    </span>
                }
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-medium mb-1">
                  Assigned Agents
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNote.agents.length > 0 ?
                selectedNote.agents.map((agent) =>
                <span
                  key={agent.id}
                  className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium border border-blue-200">

                        {agent.id} ({agent.role.split(' ')[0]}...)
                      </span>
                ) :

                <span className="text-[10px] text-slate-400 italic">
                      None
                    </span>
                }
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-medium mb-1">
                  Capabilities
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNote.capabilities.map((cap) =>
                <span
                  key={cap}
                  className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] border border-slate-300">

                      {cap}
                    </span>
                )}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}