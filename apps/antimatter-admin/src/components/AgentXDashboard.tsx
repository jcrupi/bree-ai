import React, { useState, useEffect } from 'react';
import { FileText, Plus, RefreshCw, Zap, CheckCircle, Shield, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Badge } from '@agent-collective/ui-kit';

interface AgentXMeta {
  type: string;
  subject: string;
  generated_at: string;
  valid_until: string;
  data_snapshot: any;
}

export default function AgentXDashboard() {
  const [activeNote, setActiveNote] = useState<'members' | 'posts' | null>(null);
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/agentx/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch AgentX status", e);
    }
  };

  const fetchNote = async (type: 'members' | 'posts') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/agentx/notes/${type}`);
      const data = await res.json();
      if (data.exists) {
        setNoteContent(data.content);
        setActiveNote(type);
      } else {
        setNoteContent("Note not found. Please generate it first.");
      }
    } catch (e) {
      console.error("Failed to fetch note", e);
    }
    setLoading(false);
  };

  const generateNote = async (type: 'members' | 'posts' | 'all') => {
    setGenerating(type);
    try {
      const endpoint = type === 'all' ? '/api/agentx/generate/all' : `/api/agentx/generate/${type}`;
      const res = await fetch(`http://localhost:3000${endpoint}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        if (type !== 'all') await fetchNote(type as 'members' | 'posts');
      }
    } catch (e) {
      console.error("Failed to generate note", e);
    }
    setGenerating(null);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="agentx-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actions Card */}
        <div className="card md:col-span-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Zap size={20} color="#a855f7" />
            <h3 style={{ margin: 0 }}>Creation Hub</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Trigger real-time intelligence gathering from Mighty Networks.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="primary" 
              onClick={() => generateNote('members')}
              disabled={generating === 'members'}
              style={{ justifyContent: 'flex-start' }}
            >
              <Plus size={18} style={{ marginRight: '10px' }} />
              {generating === 'members' ? 'Generating...' : 'Create Member Notes'}
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => generateNote('posts')}
              disabled={generating === 'posts'}
              style={{ justifyContent: 'flex-start' }}
            >
              <Search size={18} style={{ marginRight: '10px' }} />
              {generating === 'posts' ? 'Analyzing...' : 'Analyze Community Posts'}
            </Button>

            <Button 
              variant="glass" 
              onClick={() => generateNote('all')}
              disabled={generating === 'all'}
            >
              <RefreshCw size={18} style={{ marginRight: '10px' }} className={generating === 'all' ? 'animate-spin' : ''} />
              Re-sync All Insights
            </Button>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Note Status
            </h4>
            <div className="flex flex-col gap-4">
              <NoteStatusItem 
                label="Members" 
                exists={!!status?.members?.exists} 
                meta={status?.members?.meta}
                onClick={() => fetchNote('members')}
              />
              <NoteStatusItem 
                label="Posts" 
                exists={!!status?.posts?.exists} 
                meta={status?.posts?.meta}
                onClick={() => fetchNote('posts')}
              />
            </div>
          </div>
        </div>

        {/* content Viewport */}
        <div className="card md:col-span-2" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {activeNote ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color="#6366f1" />
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                    {activeNote.charAt(0).toUpperCase() + activeNote.slice(1)} Intelligence
                  </h3>
                </div>
                <Button variant="glass" onClick={() => setActiveNote(null)}>Close</Button>
              </div>
              <div className="note-content-area" style={{ flex: 1, backgroundColor: '#070b14', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
                {loading ? (
                   <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw className="animate-spin" size={32} color="#6366f1" />
                   </div>
                ) : (
                  <div className="markdown-render" style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                      {noteContent}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Shield size={40} color="#6366f1" />
              </div>
              <h3>AgentX Intelligence Viewer</h3>
              <p style={{ maxWidth: '300px', margin: '12px auto' }}>
                Select a note from the left to analyze community insights or generate a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteStatusItem({ label, exists, meta, onClick }: { label: string, exists: boolean, meta: any, onClick: () => void }) {
  return (
    <div 
      className="glass" 
      onClick={exists ? onClick : undefined}
      style={{ 
        padding: '12px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        cursor: exists ? 'pointer' : 'default',
        transition: 'all 0.2s',
        border: exists ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="flex items-center gap-3">
        {exists ? <CheckCircle size={16} color="#10b981" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #475569' }} />}
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: exists ? 'white' : 'var(--text-muted)' }}>{label}</span>
      </div>
      {exists && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {meta?.generated_at ? new Date(meta.generated_at).toLocaleDateString() : 'Ready'}
        </span>
      )}
    </div>
  );
}
