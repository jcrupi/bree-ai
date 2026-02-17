import { useState, useEffect } from 'react'
import { AdminSettings, Card } from '@bree-ai/core/components'
import { api } from '@bree-ai/core/utils'
import { currentBrand } from '@bree-ai/core/config'
import { agentXSpecialities } from '../data/specialities'
import { Check, Edit3, Eye, X, Save, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Settings() {
  const [instructions, setInstructions] = useState('')
  const [responseStyle, setResponseStyle] = useState<'thorough' | 'succinct'>('thorough')
  const [language, setLanguage] = useState<'english' | 'spanish'>('english')
  const [globalCollectionId, setGlobalCollectionId] = useState('')
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([])
  const [currentConfig, setCurrentConfig] = useState<any>({})
  const [editingSpec, setEditingSpec] = useState<any>(null)
  const [tempNotes, setTempNotes] = useState('')
  const [editTab, setEditTab] = useState<'write' | 'preview'>('write')
  const [specialityOverrides, setSpecialityOverrides] = useState<Record<string, string>>({})

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load persisted instructions
        const { data: inst } = await api.api.identity.instructions.get()
        if (inst && typeof inst === 'string' && !inst.includes('<!DOCTYPE html>')) {
          setInstructions(inst)
        }

        // Load config
        const { data: config } = await (api.api.config as any)[currentBrand.name].get()
        if (config) {
          setCurrentConfig(config)
          if (config.responseStyle) setResponseStyle(config.responseStyle)
          if (config.language) setLanguage(config.language)
          if (config.globalCollectionId) setGlobalCollectionId(config.globalCollectionId)
          if (config.specialities) setSelectedSpecialities(config.specialities)
          if (config.specialityOverrides) setSpecialityOverrides(config.specialityOverrides)
        }

        // Load documents if collection exists
        if (config?.globalCollectionId || globalCollectionId) {
          const colId = config?.globalCollectionId || globalCollectionId
          const { data: res } = await api.api.knowledge.resources.get({ 
            query: { collection_id: colId } 
          })
          if (res && (res as any).resources) {
            setDocuments((res as any).resources.map((r: any) => ({
              id: r.id,
              title: r.filename,
              description: `Size: ${Math.round(r.size / 1024)}KB`,
              status: 'ready'
            })))
          }
        }
      } catch (err) {
        console.error('Failed to load admin settings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async (settings: any) => {
    try {
      // 1. Save Instructions
      await api.api.identity.instructions.post({ content: settings.instructions })

      // 2. Save UI Config
      const newConfig = {
        ...currentConfig,
        responseStyle: settings.responseStyle,
        language: settings.language,
        globalCollectionId: globalCollectionId,
        specialities: selectedSpecialities,
        specialityOverrides: specialityOverrides
      }
      setCurrentConfig(newConfig)
      
      await (api.api.config as any)[currentBrand.name].post(newConfig)

      setInstructions(settings.instructions)
      setResponseStyle(settings.responseStyle)
      setLanguage(settings.language)
      
      console.log('Admin settings persisted successfully')
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-dark-950 text-white overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
              <Shield size={12} />
              Admin Infrastructure
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">Control</span> Center
            </h1>
            <p className="text-dark-400 max-w-2xl text-xl font-medium leading-relaxed">
              Define the intelligence layer. Set global AI behaviors, manage knowledge stores, and configure specialized technical domains.
            </p>
          </div>
          
          <div className="flex items-center gap-8 bg-dark-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl shadow-black/50">
            <div className="flex flex-col items-center gap-1">
              <span className="text-dark-500 text-[9px] font-black uppercase tracking-[0.2em]">Active Nodes</span>
              <span className="text-3xl font-black text-brand-orange tabular-nums">{selectedSpecialities.length}</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col gap-1.5">
              <span className="text-dark-500 text-[9px] font-black uppercase tracking-[0.2em] leading-none">System Status</span>
              <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[11px] font-bold text-green-500 uppercase tracking-widest">Gateway Active</span>
              </div>
            </div>
          </div>
        </div>


        {/* Specialities Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-dark-800/80 flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-md">
                <Sparkles size={20} className="text-brand-orange" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">AgentX Interview Specialties</h2>
                <p className="text-sm text-dark-500 font-medium">Configure specialized domain experts</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-dark-600 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
              Available Modules: {agentXSpecialities.length}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentXSpecialities.map((spec) => {
              const isSelected = selectedSpecialities.includes(spec.id);
              return (
                <div
                  key={spec.id}
                  className={`group relative flex flex-col h-72 rounded-[2rem] border transition-all duration-700 overflow-hidden ${
                    isSelected
                      ? 'border-brand-orange/40 bg-gradient-to-br from-brand-orange/[0.12] to-transparent shadow-2xl shadow-brand-orange/10 scale-[1.03]'
                      : 'border-white/5 bg-dark-900/30 hover:bg-dark-800/50 hover:border-white/10 hover:translate-y-[-4px]'
                  }`}
                >
                  {/* Decorative Gradient Glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full transition-opacity duration-700 ${isSelected ? 'bg-brand-orange/20 opacity-100' : 'bg-brand-orange/5 opacity-0 group-hover:opacity-100'}`} />

                  {/* Icon & Selection Handler */}
                  <div className="relative z-10 p-4 flex items-center justify-between">
                    <div 
                      onClick={() => {
                        const current = selectedSpecialities.includes(spec.id);
                        const newSelection = current
                          ? selectedSpecialities.filter(id => id !== spec.id)
                          : [...selectedSpecialities, spec.id];
                        setSelectedSpecialities(newSelection);
                      }}
                      className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 cursor-pointer ${
                        isSelected 
                          ? 'bg-brand-orange text-white shadow-[0_0_25px_rgba(255,102,0,0.4)] rotate-0 scale-110' 
                          : 'bg-dark-800/80 text-dark-600 hover:text-dark-200 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <Check size={28} strokeWidth={3} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-dark-700 transition-all group-hover:border-dark-500" />
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const initialContent = specialityOverrides[spec.id] || `# ${spec.name}\n\n${spec.description}\n\n### Key Evaluation Areas\n${spec.questions.map(q => `- **${q.category}**: ${q.text}`).join('\n')}`;
                        setEditingSpec(spec);
                        setTempNotes(initialContent);
                      }}
                      className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-dark-500 hover:text-white backdrop-blur-md"
                      title="Edit Knowledge Notes"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div 
                    onClick={() => {
                      const current = selectedSpecialities.includes(spec.id);
                      const newSelection = current
                        ? selectedSpecialities.filter(id => id !== spec.id)
                        : [...selectedSpecialities, spec.id];
                      setSelectedSpecialities(newSelection);
                    }}
                    className="relative z-10 p-7 flex-1 cursor-pointer flex flex-col justify-end"
                  >
                    <div className="space-y-2">
                       <h3 className={`text-2xl font-black tracking-tight transition-all duration-500 ${isSelected ? 'text-white' : 'text-dark-200 group-hover:text-white'}`}>
                        {spec.name}
                      </h3>
                      <p className="text-xs text-dark-500 leading-relaxed font-bold group-hover:text-dark-400 transition-colors line-clamp-2 uppercase tracking-wider">
                         {specialityOverrides[spec.id]?.split('\n')[2] || spec.description}
                      </p>
                    </div>
                  </div>

                  {/* Animated Selection Indicator */}
                  <div className={`absolute bottom-0 left-0 h-1.5 transition-all duration-700 ease-out ${isSelected ? 'w-full bg-brand-orange' : 'w-0 bg-transparent'}`} />
                </div>
              );
            })}
          </div>
        </section>


        {/* Behavior & Admin Settings */}
        <section className="space-y-10 pt-16 border-t border-white/5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-dark-800/80 flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-md">
                <SettingsIcon size={20} className="text-brand-orange" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Global Intelligence & Knowledge Labs</h2>
                <p className="text-sm text-dark-500 font-medium">Fine-tune AI personas and data ingestion</p>
             </div>
          </div>

          <div className="bg-[#0c0c0c] backdrop-blur-2xl rounded-[3rem] border border-white/10 p-3 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
             <div className="bg-dark-900/40 rounded-[2.8rem] p-4 sm:p-10 lg:p-16 border border-white/5 shadow-inner">
                <AdminSettings
                  hideTabs={['identity']}
                  brandName="Genius Talent"
                  mode="live"
                  initialInstructions={instructions}
                  initialResponseStyle={responseStyle}
                  initialLanguage={language}
                  globalCollectionId={globalCollectionId}
                  onGlobalCollectionChange={setGlobalCollectionId}
                  documents={documents}
                  onSave={handleSave}
                  onUploadDocuments={async () => {
                    const { data: res } = await api.api.knowledge.resources.get({ 
                      query: { collection_id: globalCollectionId } 
                    })
                    if (res && (res as any).resources) {
                      setDocuments((res as any).resources.map((r: any) => ({
                        id: r.id,
                        title: r.filename,
                        description: `Size: ${Math.round(r.size / 1024)}KB`,
                        status: 'ready'
                      })))
                    }
                  }}
                  onDeleteDocument={async (id) => {
                    try {
                      await api.api.knowledge.resources({ id }).delete()
                      setDocuments(docs => docs.filter(d => d.id !== id))
                    } catch (err) {
                      console.error('Failed to delete document:', err)
                    }
                  }}
                />
             </div>
          </div>
        </section>

      </div>

      {/* Specialty Markdown Editor Modal */}
      {editingSpec && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-dark-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-brand-orange/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit AgentX Notes: {editingSpec.name}</h2>
                  <p className="text-sm text-dark-500">Customize the knowledge base for this speciality.</p>
                </div>
              </div>
              <button onClick={() => setEditingSpec(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-dark-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-white/5">
              <button
                onClick={() => setEditTab('write')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all ${
                  editTab === 'write' ? 'text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5' : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Edit3 size={16} />
                Write
              </button>
              <button
                onClick={() => setEditTab('preview')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all ${
                  editTab === 'preview' ? 'text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5' : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Eye size={16} />
                Preview
              </button>
            </div>

              <div className="flex items-center gap-2 text-xs text-dark-500 italic">
                <Sparkles size={14} className="text-brand-orange" />
                Speciality data is persisted in Ragster Vector Store
              </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden p-6 gap-6 flex">
              {editTab === 'write' ? (
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="w-full h-full bg-dark-700/30 border border-white/5 rounded-2xl p-6 text-dark-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder-dark-600"
                  placeholder="# Enter AgentX Notes here..."
                />
              ) : (
                <div className="w-full h-full bg-dark-700/30 border border-white/5 rounded-2xl p-8 overflow-y-auto prose prose-invert prose-brand max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tempNotes}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-dark-800/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingSpec(null)}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-dark-300 font-medium hover:bg-white/5 transition-all"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  setSpecialityOverrides(prev => ({
                    ...prev,
                    [editingSpec.id]: tempNotes
                  }));
                  setEditingSpec(null);
                }}
                className="px-8 h-12 rounded-xl bg-brand-orange text-white font-bold shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Save size={18} />
                Save Overrides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
