import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui';
import { Eye, Bug, Lightbulb, Zap, Clock, MessageSquare, Send, Loader2 } from 'lucide-react';

interface Observation {
  id: string;
  client_id: string;
  app_name: string;
  page_url: string;
  type: string;
  description: string;
  screenshot_data: string;
  status: string;
  created_at: string;
}

export function ObserverAdmin() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  
  // AI Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const res = await fetch('/api/identity-zero/observations', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setObservations(data.observations || []);
      }
    } catch (e) {
      console.error("Failed to fetch observations", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch('/api/identity-zero/observations/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          message: userMsg,
          observationId: selectedObs?.id || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'system', content: 'Connection Error: Failed to reach Observer.ai.' }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'system', content: 'Exception occurred while contacting Observer.ai.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'bug': return <Bug size={16} className="text-red-500" />;
      case 'enhancement': return <Zap size={16} className="text-amber-500" />;
      case 'new_feature': return <Lightbulb size={16} className="text-emerald-500" />;
      default: return <Eye size={16} className="text-slate-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'bug': return 'bg-red-50 text-red-700 border-red-200';
      case 'enhancement': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'new_feature': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Observation List */}
      <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Eye className="text-violet-600" /> All Observations
          </h2>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{observations.length} Total</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-violet-500" /></div>
        ) : observations.length === 0 ? (
          <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No active observations found across the Bree ecosystem.
          </div>
        ) : (
          observations.map(obs => (
            <div 
              key={obs.id} 
              onClick={() => { setSelectedObs(obs); setChatHistory([]); }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedObs?.id === obs.id ? 'bg-violet-50 border-violet-300 shadow-sm ring-1 ring-violet-200' : 'bg-white border-slate-200 hover:border-violet-200 hover:shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${getTypeColor(obs.type)}`}>
                  {getTypeIcon(obs.type)} {obs.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock size={10} /> {new Date(obs.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 line-clamp-2 mt-1 mb-2">{obs.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-violet-600">{obs.app_name}</span>
                <span className="truncate max-w-[120px]">{obs.client_id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail & AI View */}
      <div className="col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {selectedObs ? (
          <div className="flex h-full">
            {/* Left: Detail & Image */}
            <div className="w-1/2 p-6 border-r border-slate-100 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border mb-3 ${getTypeColor(selectedObs.type)}`}>
                  {getTypeIcon(selectedObs.type)} {selectedObs.type.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Observation Details</h3>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                  {selectedObs.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-xs mb-1">Application</span>
                  <span className="font-semibold text-slate-700">{selectedObs.app_name}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-xs mb-1">Tenant ID</span>
                  <span className="font-mono text-slate-700">{selectedObs.client_id}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                  <span className="text-slate-400 block text-xs mb-1">Page URL Triggered</span>
                  <span className="text-slate-600 font-mono text-xs">{selectedObs.page_url}</span>
                </div>
              </div>

              {selectedObs.screenshot_data && (
                <div className="mt-auto">
                  <span className="text-slate-500 font-medium text-xs block mb-2">User Interface Snapshot (WebP)</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={selectedObs.screenshot_data} alt="Observation Snapshot" className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>

            {/* Right: AI Chat */}
            <div className="w-1/2 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="bg-violet-100 text-violet-600 p-2 rounded-lg"><MessageSquare size={18} /></div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Observer.ai Insight</h3>
                  <p className="text-xs text-slate-500">Ask the LLM to analyze this exact observation.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {chatHistory.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                     <Bot size={48} className="text-slate-200 mb-4" />
                     <p className="text-sm">I'm Observer.ai, ready to break down this {selectedObs.type.replace('_', ' ')} for you. What would you like to know?</p>
                   </div>
                 )}
                 {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-none' : msg.role === 'system' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                       {msg.content}
                     </div>
                   </div>
                 ))}
                 {isChatting && (
                   <div className="flex justify-start">
                     <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                       <Loader2 size={16} className="animate-spin text-violet-500" />
                     </div>
                   </div>
                 )}
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask Observer.ai about this..."
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-xl pl-4 pr-12 py-3 text-sm transition-all"
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={isChatting || !chatMessage.trim()}
                    className="absolute right-2 p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-violet-50/50">
              <Eye size={32} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Select an Observation</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Click on any observation card from the feed to view its details, inspect the screen capture, and chat with Observer.ai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
