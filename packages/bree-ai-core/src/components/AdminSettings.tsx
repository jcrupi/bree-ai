import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SaveIcon, SettingsIcon, SparklesIcon, UploadIcon, FileTextIcon, XIcon, CheckCircle2Icon, FolderPlusIcon, Loader2Icon, PlayIcon, ArrowLeftIcon, RefreshCw, Edit3Icon, EyeIcon } from 'lucide-react';
import { createCollection, listCollections, uploadDocument, RagsterCollection } from '../utils/ragster';
import * as Collective from '../utils/collective';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { currentBrand } from '../config/branding';

interface Document {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'processing' | 'error';
  tags?: string[];
  pageCount?: number;
}

interface AdminSettingsProps {
  onSave: (settings: {
    instructions: string;
    responseStyle: 'thorough' | 'succinct';
    language: 'english' | 'spanish';
  }) => void;
  onUploadDocuments: (files: File[]) => void;
  documents: Document[];
  onDeleteDocument: (id: string) => void;
  initialInstructions?: string;
  initialResponseStyle?: 'thorough' | 'succinct';
  initialLanguage?: 'english' | 'spanish';
  mode?: 'play' | 'live';
  onClose?: () => void;
  globalCollectionId?: string;
  onGlobalCollectionChange?: (id: string) => void;
  defaultDocumentIds?: string[];
  onDefaultDocumentChange?: (ids: string[]) => void;
}

export function AdminSettings({
  onSave,
  onUploadDocuments,
  documents,
  onDeleteDocument,
  initialInstructions = '',
  initialResponseStyle = 'thorough',
  initialLanguage = 'english',
  mode = 'live',
  onClose,
  globalCollectionId = '',
  onGlobalCollectionChange,
  defaultDocumentIds = ['all-docs'],
  onDefaultDocumentChange
}: AdminSettingsProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [responseStyle, setResponseStyle] = useState<'thorough' | 'succinct'>(initialResponseStyle);
  const [language, setLanguage] = useState<'english' | 'spanish'>(initialLanguage);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collections, setCollections] = useState<RagsterCollection[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [uploadingToRagster, setUploadingToRagster] = useState(false);
  const isLightTheme = currentBrand.name === 'habitaware-ai' || currentBrand.name === 'genius-talent';
  const [newCollectionName, setNewCollectionName] = useState('');
  const [instructionTab, setInstructionTab] = useState<'write' | 'preview'>('write');
  const [activeMainTab, setActiveMainTab] = useState<'general' | 'instructions' | 'identity'>('general');
  const [uploadCollectionId, setUploadCollectionId] = useState(globalCollectionId || '');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Update upload collection when global collection changes
  useEffect(() => {
    if (globalCollectionId) {
      setUploadCollectionId(globalCollectionId);
    }
  }, [globalCollectionId]);

  // Set default collection when collections load and no upload collection is set
  useEffect(() => {
    if (collections.length > 0 && !uploadCollectionId) {
      // Prefer globalCollectionId if available, otherwise use first collection
      const defaultId = globalCollectionId || collections[0].id;
      setUploadCollectionId(defaultId);
    }
  }, [collections, globalCollectionId, uploadCollectionId]);

  // Identity State
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [amHealthy, setAmHealthy] = useState(false);

  useEffect(() => {
    if (mode === 'live') {
      loadCollections();
      checkAntiMatter();
    }
  }, [mode]);

  useEffect(() => {
    if (initialInstructions) {
      setInstructions(initialInstructions);
    }
  }, [initialInstructions]);

  useEffect(() => {
    if (activeMainTab === 'identity' && amHealthy) {
      loadOrgs();
    }
  }, [activeMainTab, amHealthy]);

  useEffect(() => {
    if (selectedOrg) {
      loadUsers(selectedOrg.slug);
    } else {
      setUsers([]);
    }
  }, [selectedOrg]);

  const AGENTX_URL = import.meta.env.VITE_AGENTX_URL || import.meta.env.VITE_COLLECTIVE_URL || 'http://localhost:9000';

  const checkAntiMatter = async () => {
    // Current health check for the Collective
    const healthy = await fetch(`${AGENTX_URL}/api/collective/health`).then(res => res.ok).catch(() => false);
    setAmHealthy(healthy);
  };

  const loadOrgs = async () => {
    setLoadingIdentity(true);
    const result = await Collective.identity.listOrgs();
    setOrgs(result.entries?.filter((e: any) => e.path.endsWith('index.agentx.md')).map((e: any) => e.frontMatter) || []);
    setLoadingIdentity(false);
  };

  const loadUsers = async (slug: string) => {
    setLoadingIdentity(true);
    const result = await fetch(`${AGENTX_URL}/api/identity/entries?dir=orgs/${slug}/users`).then(res => res.json());
    setUsers(result.entries?.map((e: any) => e.frontMatter) || []);
    setLoadingIdentity(false);
  };

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) return;
    const orgPath = `orgs/${newOrgSlug}/index.agentx.md`;
    const frontMatter = {
      name: newOrgName,
      slug: newOrgSlug,
      uuid: crypto.randomUUID(),
      type: 'organization',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${AGENTX_URL}/api/identity/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: orgPath,
        frontMatter,
        content: `# Organization: ${newOrgName}`,
      }),
    });

    if (response.ok) {
      setOrgs(prev => [...prev, frontMatter]);
      setNewOrgName('');
      setNewOrgSlug('');
    }
  };

  const handleCreateUser = async () => {
    if (!selectedOrg || !newUserEmail || !newUserName) return;
    const userPath = `orgs/${selectedOrg.slug}/users/${newUserEmail}.agentx.md`;
    const frontMatter = {
      email: newUserEmail,
      name: newUserName,
      uuid: crypto.randomUUID(),
      role: newUserRole,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${AGENTX_URL}/api/identity/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: userPath,
        frontMatter,
        content: `# User: ${newUserName}`,
      }),
    });

    if (response.ok) {
      setUsers(prev => [...prev, frontMatter]);
      setNewUserEmail('');
      setNewUserName('');
    }
  };

  const loadCollections = async () => {
    if (mode === 'play') return;
    try {
      const result = await listCollections({ limit: 100 });
      console.log('Loaded collections:', result.collections.length, result);
      setCollections(result.collections || []);
      
      // If no collection is set, try to find the brand's default collection first
      if (result.collections && result.collections.length > 0 && !globalCollectionId && onGlobalCollectionChange) {
        const defaultColName = currentBrand.collection.collectionId;
        const brandDefault = result.collections.find(c => 
          c.name === defaultColName || c.slug === defaultColName
        );
        
        if (brandDefault) {
          onGlobalCollectionChange(brandDefault.id);
          setUploadCollectionId(brandDefault.id);
        } else {
          // Fallback to first collection
          onGlobalCollectionChange(result.collections[0].id);
          setUploadCollectionId(result.collections[0].id);
        }
      } else if (result.collections && result.collections.length > 0 && globalCollectionId) {
        // Ensure upload collection is set to current collection
        setUploadCollectionId(globalCollectionId);
      } else if (result.collections && result.collections.length === 0) {
        console.warn('No collections found. API returned empty array.');
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      setCollections([]);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      setCreatingCollection(true);
      // Use environment variables or brand defaults for org/user
      const orgId = import.meta.env.VITE_RAGSTER_DEFAULT_ORG_ID || currentBrand.collection.orgId;
      const userId = import.meta.env.VITE_RAGSTER_DEFAULT_USER_ID || `user@${currentBrand.collection.orgId}`;
      
      const collection = await createCollection({
        name: newCollectionName.trim(),
        org_id: orgId,
        user_id: userId,
        created_by_member: userId,
        description: `Collection for ${newCollectionName.trim()}`,
        embedding_provider: 'openai',
        embedding_model: 'text-embedding-3-large',
        embedding_dimension: 3072,
        chunking_strategy: 'semantic',
        chunk_size: 1024,
        chunk_overlap: 200,
      });
      setCollections(prev => [...prev, collection]);
      if (onGlobalCollectionChange) onGlobalCollectionChange(collection.id);
      setNewCollectionName('');
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleSave = () => {
    onSave({ instructions, responseStyle, language });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) await handleUploadToRagster(files);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await handleUploadToRagster(files);
  };

  const handleUploadToRagster = async (files: File[]) => {
    if (mode === 'play') {
      alert('Document uploads to Ragster are only available in Live mode.');
      return;
    }
    if (!globalCollectionId) {
      alert('Please select or create a collection first');
      return;
    }
    try {
      setUploadingToRagster(true);
      // Use environment variables or brand defaults for org/user
      const orgId = import.meta.env.VITE_RAGSTER_DEFAULT_ORG_ID || currentBrand.collection.orgId;
      const userId = import.meta.env.VITE_RAGSTER_DEFAULT_USER_ID || `user@${currentBrand.collection.orgId}`;
      
      for (const file of files) {
        try {
          await uploadDocument({
            file,
            org_id: orgId,
            user_id: userId,
            collection_id: uploadCollectionId || globalCollectionId,
            metadata: { 
              filename: file.name, 
              uploaded_at: new Date().toISOString(),
              tags: activeTags,
              [`${currentBrand.name}_doc_id`]: file.name // Use filename as the unique doc ID in Ragster
            },
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      onUploadDocuments(files);
      await loadCollections();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingToRagster(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };

  const defaultTemplate = `Be professional and gentle in your responses. If you do not know the answer to a question based on the provided context, politely inform the user that you will get back to them and thank them for their patience.`;

  return (
    <div className={`h-full flex flex-col ${isLightTheme ? 'bg-white' : 'bg-slate-900 shadow-xl border border-slate-800'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${isLightTheme ? 'border-slate-100 bg-slate-50/30' : 'border-slate-800 bg-slate-800/50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>Admin Settings</h2>
              <p className="text-xs text-slate-400">Configure AI behavior and management</p>
            </div>
          </div>
          {onClose && (
            <motion.button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium ${
                isLightTheme 
                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to {currentBrand.displayName}
            </motion.button>
          )}
        </div>
        
        {/* Tab Switcher */}
        <div className={`flex p-1 rounded-xl border mt-4 ${
          isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveMainTab('general')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMainTab === 'general' 
                ? isLightTheme
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                : isLightTheme
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Admin Stuff
          </button>
          <button
            onClick={() => setActiveMainTab('instructions')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMainTab === 'instructions' 
                ? isLightTheme
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                : isLightTheme
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveMainTab('identity')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMainTab === 'identity' 
                ? isLightTheme
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                : isLightTheme
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Identity (AM)
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeMainTab === 'general' ? (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Mode Indicator */}
              {mode === 'play' && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayIcon className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-medium text-yellow-300">Play Mode Active</h3>
                  </div>
                  <p className="text-xs text-yellow-400/80">Ragster document uploads and collections are disabled in Play mode.</p>
                </div>
              )}

              {/* Collections Section */}
              <section>
                <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 transition-colors ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                  <FolderPlusIcon className={`w-4 h-4 ${isLightTheme ? 'text-purple-500' : 'text-blue-400'}`} /> Ragster Collections
                </h3>
                <div className={`p-5 rounded-2xl border mb-6 transition-all ${
                  mode === 'play' 
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' 
                    : isLightTheme 
                      ? 'bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow' 
                      : 'bg-slate-800/30 border-slate-700/50'
                }`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      placeholder="New collection name..."
                      disabled={mode === 'play'}
                      className={`flex-1 text-sm rounded-xl px-4 py-2 border transition-all outline-none ${
                        isLightTheme 
                          ? 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5' 
                          : 'bg-slate-900 text-slate-200 border-slate-700'
                      }`}
                    />
                    <button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim() || creatingCollection || mode === 'play'}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        isLightTheme
                          ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/40'
                      }`}
                    >
                      {creatingCollection ? <Loader2Icon className="animate-spin w-4 h-4" /> : 'Create'}
                    </button>
                  </div>
                  {collections.length > 0 && mode === 'live' && (
                    <div className="mt-4">
                      <label className="text-xs text-slate-500 mb-2 block">Set Default Collection</label>
                      <select
                        value={globalCollectionId}
                        onChange={e => {
                          const selectedId = e.target.value;
                          onGlobalCollectionChange?.(selectedId);
                          // Save to brand-specific localStorage key
                          localStorage.setItem(`${currentBrand.name}_default_collection`, selectedId);
                        }}
                        className={`w-full text-sm rounded-xl px-4 py-2.5 border transition-all outline-none ${
                          isLightTheme
                            ? 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5'
                            : 'bg-slate-900 text-slate-200 border-slate-700'
                        }`}
                      >
                        {collections.map((c, idx) => (
                          <option key={c.id || `col-${idx}`} value={c.id}>
                            {c.name === currentBrand.collection.collectionId ? '⭐ ' : ''}
                            {c.name} ({c.chunk_count || 0} chunks)
                            {c.id === globalCollectionId ? ' ✓' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Default: "{currentBrand.collection.collectionId}" (if available). Selected collection is saved automatically.
                      </p>
                      
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block">Target Search Documents</label>
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                          {/* All Documents Toggle */}
                          <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                            defaultDocumentIds.includes('all-docs') 
                              ? isLightTheme
                                ? 'bg-purple-50 border-purple-200 text-purple-700 font-semibold shadow-sm'
                                : 'bg-blue-500/10 border-blue-500/50 text-blue-100' 
                              : isLightTheme
                                ? 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                            <input
                              type="checkbox"
                              checked={defaultDocumentIds.includes('all-docs')}
                              onChange={() => {
                                if (onDefaultDocumentChange) {
                                  onDefaultDocumentChange(['all-docs']);
                                }
                              }}
                              className={`w-4 h-4 rounded border-slate-300 transition-all ${
                                isLightTheme ? 'text-purple-600 focus:ring-purple-500/30' : 'text-blue-500 focus:ring-blue-500/30'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium italic">All Documents</div>
                              <div className="text-[10px] opacity-50">Search across the entire collection</div>
                            </div>
                          </label>

                          {documents.filter(d => d.id !== 'all-docs').map(doc => {
                            const isChecked = defaultDocumentIds.includes(doc.id) && !defaultDocumentIds.includes('all-docs');
                            return (
                              <label key={doc.id} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                                isChecked 
                                  ? isLightTheme
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 font-semibold shadow-sm'
                                    : 'bg-blue-500/10 border-blue-500/50 text-blue-100' 
                                  : isLightTheme
                                    ? 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (onDefaultDocumentChange) {
                                      let newIds = [...defaultDocumentIds].filter(id => id !== 'all-docs');
                                      if (isChecked) {
                                        newIds = newIds.filter(id => id !== doc.id);
                                        if (newIds.length === 0) newIds = ['all-docs'];
                                      } else {
                                        newIds.push(doc.id);
                                      }
                                      onDefaultDocumentChange(newIds);
                                    }
                                  }}
                                  className={`w-4 h-4 rounded border-slate-300 transition-all ${
                                    isLightTheme ? 'text-purple-600 focus:ring-purple-500/30' : 'text-blue-500 focus:ring-blue-500/30'
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{doc.title}</div>
                                  <div className="text-[10px] opacity-50">{doc.status}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">When starting {currentBrand.displayName}, these documents will be used for knowledge searches.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Uploads Section */}
              <section>
                <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 transition-colors ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                  <UploadIcon className={`w-4 h-4 ${isLightTheme ? 'text-teal-500' : 'text-emerald-400'}`} /> Document Management
                </h3>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-2 block">Upload to Collection:</label>
                  <select
                    value={uploadCollectionId || globalCollectionId || ''}
                    onChange={e => setUploadCollectionId(e.target.value)}
                    className={`w-full text-sm rounded-xl px-4 py-2.5 border transition-all outline-none ${
                      isLightTheme
                        ? 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {collections.length === 0 ? (
                      <option value="">No collections available</option>
                    ) : (
                      collections.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.id === globalCollectionId ? '(Current)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {globalCollectionId && !uploadCollectionId && (
                    <p className="text-xs text-slate-500 mt-1">Current collection will be used</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-2 block">Apply Tags to Uploads:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeTags.map(tag => (
                      <span key={tag} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 font-medium ${
                        isLightTheme ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        #{tag}
                        <button onClick={() => setActiveTags(prev => prev.filter(t => t !== tag))} className="hover:text-white"><XIcon size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          const tag = newTagInput.trim().toLowerCase().replace(/^#/, '');
                          if (!activeTags.includes(tag)) setActiveTags(prev => [...prev, tag]);
                          setNewTagInput('');
                        }
                      }}
                      placeholder="Add tag (e.g. #react)..."
                       className={`flex-1 rounded-lg px-3 py-1.5 text-xs transition-all border ${
                         isLightTheme 
                          ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500' 
                          : 'bg-slate-900/50 border-slate-700/50 text-slate-300 focus:border-blue-500/50'
                       }`}
                    />
                    <button 
                      onClick={() => {
                        if (newTagInput.trim()) {
                          const tag = newTagInput.trim().toLowerCase().replace(/^#/, '');
                          if (!activeTags.includes(tag)) setActiveTags(prev => [...prev, tag]);
                          setNewTagInput('');
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        isLightTheme
                          ? 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={`border-2 border-dashed rounded-3xl p-10 transition-all text-center ${
                  isDragging 
                    ? isLightTheme ? 'border-teal-400 bg-teal-50' : 'border-blue-500 bg-blue-500/10' 
                    : isLightTheme ? 'border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/30' : 'border-slate-700 bg-slate-800/30'
                } ${uploadingToRagster ? 'opacity-50' : ''}`}>
                  <input type="file" id="doc-upload" multiple onChange={handleFileSelect} className="hidden" />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isLightTheme ? 'bg-slate-50 shadow-inner' : 'bg-slate-700/50'
                    }`}>
                      {uploadingToRagster ? <Loader2Icon className="animate-spin text-teal-500" /> : <UploadIcon className={`${isLightTheme ? 'text-teal-400' : 'text-slate-400'}`} />}
                    </div>
                    <p className={`text-sm font-semibold ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>Click or Drag to Upload to Ragster</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT supported</p>
                  </label>
                </div>
                {documents.length > 0 && (
                  <div className="mt-6 space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {documents.map(doc => (
                      <div key={doc.id} className={`group flex items-center gap-4 p-3 rounded-2xl text-xs transition-all border ${
                        isLightTheme ? 'bg-white border-slate-100 hover:border-teal-100 hover:shadow-sm' : 'bg-slate-800/50 border-slate-700/50'
                      }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLightTheme ? 'bg-slate-50 text-slate-400' : 'bg-slate-700'}`}>
                          <FileTextIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className={`truncate font-semibold ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>{doc.title}</p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.tags.map(t => (
                                <span key={t} className={`text-[9px] uppercase tracking-wider font-bold ${isLightTheme ? 'text-teal-500' : 'text-blue-400'}`}>#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => onDeleteDocument(doc.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Response Settings Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <h3 className={`text-sm font-semibold mb-3 transition-colors ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Response Style</h3>
                  <div className="flex gap-2">
                    {['thorough', 'succinct'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setResponseStyle(style as any)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          responseStyle === style 
                            ? isLightTheme
                              ? 'bg-[#D448AA]/10 border-[#D448AA] text-[#D448AA]'
                              : 'bg-blue-500/20 border-blue-500 text-blue-300' 
                            : isLightTheme
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-3 transition-colors ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Language</h3>
                  <div className="flex gap-2">
                    {['english', 'spanish'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang as any)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          language === lang 
                            ? isLightTheme
                              ? 'bg-[#00A99D]/10 border-[#00A99D] text-[#00A99D]'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                            : isLightTheme
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tips Section */}
              <div className={`rounded-xl p-4 flex gap-3 border ${
                isLightTheme
                  ? 'bg-[#D448AA]/5 border-[#D448AA]/20'
                  : 'bg-purple-500/10 border border-purple-500/20'
              }`}>
                <SparklesIcon className={`w-5 h-5 flex-shrink-0 ${
                  isLightTheme ? 'text-[#D448AA]' : 'text-purple-400'
                }`} />
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-purple-300'
                  }`}>Pro Tips</h4>
                  <ul className={`text-xs space-y-1 ${
                    isLightTheme ? 'text-slate-600' : 'text-purple-200/70'
                  }`}>
                    <li>• Switch to instructions tab to customize {currentBrand.displayName}'s personality</li>
                    <li>• Multiple documents help {currentBrand.displayName} provide better context</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : activeMainTab === 'instructions' ? (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                    isLightTheme ? 'text-slate-800' : 'text-white'
                  }`}>
                    <SparklesIcon className={`w-4 h-4 ${
                      isLightTheme ? 'text-[#D448AA]' : 'text-purple-400'
                    }`} /> {currentBrand.displayName} Instructions
                  </h3>
                  <p className={`text-xs mt-1 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-500'
                  }`}>Directly controls {currentBrand.displayName}'s system prompt and behavior</p>
                </div>
                <div className={`flex p-1 rounded-lg border ${
                  isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
                }`}>
                  <button 
                    onClick={() => setInstructionTab('write')} 
                    className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                      instructionTab === 'write' 
                        ? isLightTheme
                          ? 'bg-[#D448AA] text-white shadow-sm'
                          : 'bg-purple-500 text-white shadow-lg' 
                        : 'text-slate-400'
                    }`}
                  >Write</button>
                  <button 
                    onClick={() => setInstructionTab('preview')} 
                    className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                      instructionTab === 'preview' 
                        ? isLightTheme
                          ? 'bg-[#D448AA] text-white shadow-sm'
                          : 'bg-purple-500 text-white shadow-lg' 
                        : 'text-slate-400'
                    }`}
                  >Preview</button>
                </div>
              </div>

              <div className="relative">
                {instructionTab === 'write' ? (
                  <>
                    <textarea
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      className="w-full h-[400px] bg-white text-slate-800 text-sm rounded-xl p-5 border border-slate-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      placeholder={`Define rules like 'Always say your name is ${currentBrand.aiName}'...`}
                    />
                    <button onClick={() => setInstructions(defaultTemplate)} className={`absolute bottom-4 left-4 text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-all ${
                      isLightTheme 
                        ? 'text-slate-500 hover:text-purple-600 bg-slate-100 hover:bg-white border border-slate-200 shadow-sm' 
                        : 'text-slate-500 hover:text-purple-400 bg-slate-950/40'
                    }`}>
                      <RefreshCw size={10} /> Reset to Template
                    </button>
                  </>
                ) : (
                  <div className="w-full h-[400px] bg-slate-50 text-slate-800 text-sm rounded-xl p-8 border border-slate-200 overflow-y-auto prose prose-slate prose-sm max-w-none">
                    {instructions ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions}</ReactMarkdown> : <p className="italic text-slate-500">No content.</p>}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
                    <CheckCircle2Icon className={`w-4 h-4 ${isLightTheme ? 'text-teal-500' : 'text-emerald-400'}`} /> Identity Management
                  </h3>
                  <p className={`text-xs mt-1 transition-colors ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`}>Manage Organizations and Users via AntiMatterDB</p>
                </div>
                {!amHealthy && (
                  <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 uppercase font-bold">
                    AM Server Offline
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Org List */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border transition-all ${isLightTheme ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 transition-colors ${isLightTheme ? 'text-teal-600' : 'text-slate-400'}`}>Create Organization</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Organization Name (e.g. Kick)"
                        value={newOrgName}
                        onChange={e => setNewOrgName(e.target.value)}
                        className={`w-full text-sm rounded-lg px-3 py-2 border transition-all ${
                          isLightTheme ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500' : 'bg-slate-900 border-slate-700 text-slate-200'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Org Slug (e.g. kick)"
                        value={newOrgSlug}
                        onChange={e => setNewOrgSlug(e.target.value)}
                        className={`w-full text-sm rounded-lg px-3 py-2 border transition-all ${
                          isLightTheme ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500' : 'bg-slate-900 border-slate-700 text-slate-200'
                        }`}
                      />
                      <button
                        onClick={handleCreateOrg}
                        disabled={!newOrgName || !newOrgSlug || !amHealthy}
                        className={`w-full py-2 rounded-lg border transition-all text-xs font-bold ${
                          isLightTheme 
                            ? 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        Create Organization
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className={`text-xs font-bold uppercase tracking-wider transition-colors ${isLightTheme ? 'text-slate-400' : 'text-slate-400'}`}>Organizations</h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                      {orgs.map(org => (
                        <button
                          key={org.slug}
                          onClick={() => setSelectedOrg(org)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedOrg?.slug === org.slug 
                              ? isLightTheme 
                                ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                : 'bg-blue-500/20 border-blue-500 text-blue-100' 
                              : isLightTheme
                                ? 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="font-semibold text-sm">{org.name}</div>
                          <div className="text-[10px] opacity-60">Slug: {org.slug}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  {selectedOrg ? (
                    <>
                      <div className={`p-4 rounded-xl border transition-all ${isLightTheme ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 transition-colors ${isLightTheme ? 'text-purple-600' : 'text-slate-400'}`}>Add User to {selectedOrg.name}</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                            className={`w-full text-sm rounded-lg px-3 py-2 border transition-all ${
                              isLightTheme ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                            className={`w-full text-sm rounded-lg px-3 py-2 border transition-all ${
                              isLightTheme ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                          <select
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value as any)}
                            className={`w-full text-sm rounded-lg px-3 py-2 border transition-all ${
                              isLightTheme ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-900 text-slate-200'
                            }`}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={handleCreateUser}
                            disabled={!newUserName || !newUserEmail || !amHealthy}
                            className={`w-full py-2 rounded-lg border transition-all text-xs font-bold ${
                              isLightTheme 
                                ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' 
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                            }`}
                          >
                            Add User
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className={`text-xs font-bold uppercase tracking-wider transition-colors ${isLightTheme ? 'text-slate-400' : 'text-slate-400'}`}>Users ({users.length})</h4>
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                          {loadingIdentity ? (
                            <div className="p-8 flex justify-center"><Loader2Icon size={24} className="animate-spin text-slate-600" /></div>
                          ) : users.length > 0 ? (
                            users.map(user => (
                                <div key={user.email} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                  isLightTheme ? 'bg-white border-slate-100' : 'bg-slate-800/40 border-slate-700/50'
                                }`}>
                                  <div>
                                    <div className={`font-semibold text-sm transition-colors ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>{user.name}</div>
                                    <div className="text-[10px] text-slate-500">{user.email}</div>
                                  </div>
                                  <div className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                    isLightTheme ? 'bg-slate-100 text-slate-500' : 'bg-slate-700 text-slate-300'
                                  }`}>{user.role}</div>
                                </div>
                            ))
                          ) : (
                            <div className="text-center p-8 text-xs text-slate-600 italic">No users in this organization yet.</div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`h-full flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed text-center transition-all ${
                      isLightTheme ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/10 border-slate-700/30'
                    }`}>
                      <SettingsIcon className={`w-12 h-12 mb-4 opacity-20 transition-colors ${isLightTheme ? 'text-slate-400' : 'text-slate-700'}`} />
                      <p className={`text-sm font-medium transition-colors ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>Select an organization to manage its users</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`p-6 border-t ${isLightTheme ? 'border-slate-100 bg-slate-50/30' : 'border-slate-800'}`}>
        <motion.button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
            isSaved 
              ? isLightTheme 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:shadow-purple-200/50'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isSaved ? <><CheckCircle2Icon size={18} /> Settings Saved!</> : <><SaveIcon size={18} /> Save All Changes</>}
        </motion.button>
      </div>
    </div>
  );
}
