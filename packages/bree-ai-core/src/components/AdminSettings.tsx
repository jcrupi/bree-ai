import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SaveIcon, SettingsIcon, SparklesIcon, UploadIcon, FileTextIcon, XIcon, CheckCircle2Icon, FolderPlusIcon, Loader2Icon, PlayIcon, ArrowLeftIcon, RefreshCw, Edit3Icon, EyeIcon } from 'lucide-react';
import { createCollection, listCollections, uploadDocument, RagsterCollection } from '../utils/ragster';
import * as Collective from '../utils/collective';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { currentBrand } from '../config/branding';
import { breezeAPI } from '../utils/breeAPI';
import { safeEnv } from '../utils/env';
import { IdentityZeroConsole } from './identity-zero/identity-zero-console';

interface Document {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'processing' | 'error';
  tags?: string[];
  pageCount?: number;
}

type BuiltInTabId = 'general' | 'instructions' | 'bubbles' | 'identity';

export interface CustomTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface AdminSettingsProps {
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
  onBubblesChange?: () => void;
  onTestBubble?: (text: string) => void;
  /** Hide specific built-in tabs */
  hideTabs?: BuiltInTabId[];
  /** Inject custom tab panels */
  customTabs?: CustomTab[];
  /** Override brand name in header */
  brandName?: string;
  /** Hide the Create Collection input — use when only one fixed collection exists */
  hideCreateCollection?: boolean;
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
  onDefaultDocumentChange,
  onBubblesChange,
  onTestBubble,
  hideTabs = [],
  customTabs = [],
  brandName,
  hideCreateCollection = false
}: AdminSettingsProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [responseStyle, setResponseStyle] = useState<'thorough' | 'succinct'>(initialResponseStyle);
  const [language, setLanguage] = useState<'english' | 'spanish'>(initialLanguage);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collections, setCollections] = useState<RagsterCollection[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [uploadingToRagster, setUploadingToRagster] = useState(false);
  const isLightTheme = currentBrand.name === 'habitaware-ai';
  const [newCollectionName, setNewCollectionName] = useState('');
  const [instructionTab, setInstructionTab] = useState<'write' | 'preview'>('write');
  const [activeMainTab, setActiveMainTab] = useState<string>('general');

  // Build visible tabs from built-in + custom, filtering out hidden ones
  const builtInTabs: { id: BuiltInTabId; label: string }[] = [
    { id: 'general', label: 'Admin Stuff' },
    { id: 'instructions', label: 'Instructions' },
    { id: 'bubbles', label: 'Bubbles' },
    { id: 'identity', label: 'Identity (AM)' },
    { id: 'identity_zero', label: 'Identity Zero' },
  ];
  const visibleBuiltIn = builtInTabs.filter(t => !hideTabs.includes(t.id));
  const allTabs = [...visibleBuiltIn, ...customTabs.map(ct => ({ id: ct.id, label: ct.label }))];
  const [uploadCollectionId, setUploadCollectionId] = useState(globalCollectionId || '');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Bubbles State
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [loadingBubbles, setLoadingBubbles] = useState(false);
  const [newBubbleText, setNewBubbleText] = useState('');
  const [newBubbleInstructions, setNewBubbleInstructions] = useState('');
  const [showBubbleInstructions, setShowBubbleInstructions] = useState(false);
  const [editingBubbleId, setEditingBubbleId] = useState<number | null>(null);

  const loadBubbles = async () => {
    setLoadingBubbles(true);
    try {
      const resp = await breeAPI.bubbles.list(currentBrand.name);
      if (Array.isArray(resp)) {
        setBubbles(resp);
      }
    } catch (err) {
      console.error('Failed to load bubbles:', err);
    } finally {
      setLoadingBubbles(false);
    }
  };

  useEffect(() => {
    loadBubbles();
  }, []);

  const handleCreateBubble = async () => {
    if (!newBubbleText.trim()) return;
    try {
      await breeAPI.bubbles.create({
        brandId: currentBrand.name,
        text: newBubbleText.trim(),
        instructions: newBubbleInstructions.trim() || undefined
      });
      setNewBubbleText('');
      setNewBubbleInstructions('');
      setShowBubbleInstructions(false);
      loadBubbles();
      onBubblesChange?.();
    } catch (err) {
      console.error('Failed to create bubble:', err);
    }
  };

  const handleToggleBubble = async (id: number, currentActive: boolean) => {
    try {
      await breeAPI.bubbles.update(id, { active: !currentActive });
      loadBubbles();
      onBubblesChange?.();
    } catch (err) {
      console.error('Failed to toggle bubble:', err);
    }
  };

  const handleDeleteBubble = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bubble?')) return;
    try {
      await breeAPI.bubbles.delete(id);
      loadBubbles();
      onBubblesChange?.();
    } catch (err) {
      console.error('Failed to delete bubble:', err);
    }
  };

  const handleUpdateBubbleInstructions = async (id: number, instructions: string) => {
    try {
      await breeAPI.bubbles.update(id, { instructions });
      loadBubbles();
      onBubblesChange?.();
      setEditingBubbleId(null);
    } catch (err) {
      console.error('Failed to update bubble instructions:', err);
    }
  };

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

  const AGENTX_URL = safeEnv('VITE_AGENTX_URL', safeEnv('VITE_COLLECTIVE_URL', 'http://localhost:9000'));

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
      const orgId = safeEnv('VITE_RAGSTER_DEFAULT_ORG_ID', currentBrand.collection.orgId);
      const userId = safeEnv('VITE_RAGSTER_DEFAULT_USER_ID', `user@${currentBrand.collection.orgId}`);
      
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
      const orgId = safeEnv('VITE_RAGSTER_DEFAULT_ORG_ID', currentBrand.collection.orgId);
      const userId = safeEnv('VITE_RAGSTER_DEFAULT_USER_ID', `user@${currentBrand.collection.orgId}`);
      
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
              Back to {brandName || currentBrand.displayName}
            </motion.button>
          )}
        </div>
        
        {/* Tab Switcher */}
        <div className={`flex p-1 rounded-2xl border mt-6 backdrop-blur-md ${
          isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          {allTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeMainTab === tab.id 
                  ? isLightTheme
                    ? 'bg-white text-brand-orange shadow-md border border-slate-200 ring-4 ring-brand-orange/5'
                    : 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 border border-brand-orange/50' 
                  : isLightTheme
                    ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                  {!hideCreateCollection && (
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={e => setNewCollectionName(e.target.value)}
                        placeholder="Enter new collection name..."
                        disabled={mode === 'play'}
                        className={`flex-1 text-xs font-bold rounded-2xl px-5 py-3 border transition-all outline-none ${
                          isLightTheme 
                            ? 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-brand-orange/50 focus:ring-4 focus:ring-brand-orange/5' 
                            : 'bg-black/50 text-slate-200 border-white/5 focus:border-brand-orange/50'
                        }`}
                      />
                      <button
                        onClick={handleCreateCollection}
                        disabled={!newCollectionName.trim() || creatingCollection || mode === 'play'}
                        className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          isLightTheme
                            ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 hover:scale-[1.02]'
                        } disabled:opacity-20`}
                      >
                        {creatingCollection ? <Loader2Icon className="animate-spin w-4 h-4" /> : 'Create'}
                      </button>
                    </div>
                  )}

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

                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={`border-2 border-dashed rounded-[2rem] p-12 transition-all duration-500 text-center ${
                  isDragging 
                    ? isLightTheme ? 'border-brand-orange bg-brand-orange/5' : 'border-brand-orange bg-brand-orange/10 scale-[1.02]' 
                    : isLightTheme ? 'border-slate-100 bg-white hover:border-brand-orange/20 hover:bg-brand-orange/[0.02]' : 'border-white/5 bg-black/20 hover:border-brand-orange/20'
                } ${uploadingToRagster ? 'opacity-40 animate-pulse' : ''}`}>
                  <input type="file" id="doc-upload" multiple onChange={handleFileSelect} className="hidden" />
                  <label htmlFor="doc-upload" className="cursor-pointer group">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 transition-all duration-500 ${
                      isLightTheme ? 'bg-slate-50 shadow-inner group-hover:bg-brand-orange group-hover:text-white' : 'bg-white/5 group-hover:bg-brand-orange group-hover:text-white'
                    }`}>
                      {uploadingToRagster ? <Loader2Icon className="animate-spin text-brand-orange" /> : <UploadIcon className="transition-colors" />}
                    </div>
                    <p className={`text-base font-black uppercase tracking-tight ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>Click or Drag to Upload to Ragster</p>
                    <p className="text-xs text-dark-500 mt-2 font-bold uppercase tracking-widest">PDF, DOCX, TXT supported</p>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="mt-6 space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {documents.map(doc => (
                      <div key={doc.id} className={`group flex items-center gap-5 p-4 rounded-[1.5rem] text-xs transition-all border ${
                        isLightTheme 
                          ? 'bg-slate-50/50 border-slate-100 hover:border-brand-orange/30 hover:bg-white hover:shadow-xl hover:shadow-brand-orange/5' 
                          : 'bg-black/20 border-white/5 hover:border-brand-orange/30'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isLightTheme ? 'bg-white text-dark-400 shadow-sm' : 'bg-dark-800 text-dark-400'
                        } group-hover:text-brand-orange`}>
                          <FileTextIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate font-black uppercase tracking-tight ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>{doc.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-dark-500 font-bold">{doc.description}</span>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pl-2 border-l border-white/5">
                                {doc.tags.map(t => (
                                  <span key={t} className={`text-[9px] uppercase tracking-widest font-black ${isLightTheme ? 'text-brand-orange/80' : 'text-brand-orange/60'}`}>#{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => onDeleteDocument(doc.id)} 
                          className={`p-2.5 opacity-0 group-hover:opacity-100 transition-all rounded-xl ${
                            isLightTheme ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          <XIcon size={16} strokeWidth={3} />
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
          ) : activeMainTab === 'bubbles' ? (
            <motion.div
              key="bubbles"
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
                    }`} /> Suggested Bubbles
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Manage suggesting questions and their specific instructions</p>
                </div>
              </div>

              {/* Add New Bubble */}
              <div className={`p-4 rounded-2xl border ${
                isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newBubbleText}
                    onChange={e => setNewBubbleText(e.target.value)}
                    placeholder="Bubble question (e.g. How does this work?)"
                    className={`w-full text-sm rounded-xl px-4 py-2.5 border transition-all outline-none ${
                      isLightTheme 
                        ? 'bg-white text-slate-800 border-slate-200 focus:border-purple-500' 
                        : 'bg-slate-800 text-slate-200 border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  
                  {showBubbleInstructions ? (
                    <textarea
                      value={newBubbleInstructions}
                      onChange={e => setNewBubbleInstructions(e.target.value)}
                      placeholder="Optional specific instructions/context for this question..."
                      className={`w-full h-24 text-sm rounded-xl px-4 py-2.5 border transition-all outline-none font-mono ${
                        isLightTheme 
                          ? 'bg-white text-slate-800 border-slate-200 focus:border-purple-500' 
                          : 'bg-slate-800 text-slate-200 border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  ) : (
                    <button 
                      onClick={() => setShowBubbleInstructions(true)}
                      className="text-xs text-purple-500 hover:text-purple-600 font-medium"
                    >
                      + Add specific instructions for this question
                    </button>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    {showBubbleInstructions && (
                      <button 
                        onClick={() => { setShowBubbleInstructions(false); setNewBubbleInstructions(''); }}
                        className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancel Instructions
                      </button>
                    )}
                    <button
                      onClick={handleCreateBubble}
                      disabled={!newBubbleText.trim()}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isLightTheme
                          ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-800'
                      }`}
                    >
                      Add Bubble
                    </button>
                  </div>
                </div>
              </div>

              {/* Bubbles List */}
              <div className="space-y-3">
                {bubbles.map((bubble) => (
                  <div 
                    key={bubble.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isLightTheme 
                        ? 'bg-white border-slate-100 hover:shadow-sm' 
                        : 'bg-slate-800/50 border-slate-700'
                    } ${!bubble.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex-1 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${bubble.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-sm font-medium ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                          {bubble.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTestBubble?.(bubble.text)}
                          className={`p-2 rounded-lg transition-all ${
                            isLightTheme ? 'hover:bg-purple-50 text-purple-600' : 'hover:bg-blue-500/20 text-blue-400'
                          }`}
                          title="Test Bubble"
                        >
                          <PlayIcon size={16} />
                        </button>
                        <button
                          onClick={() => setEditingBubbleId(editingBubbleId === bubble.id ? null : bubble.id)}
                          className={`p-2 rounded-lg transition-all ${
                            isLightTheme ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-700 text-slate-500'
                          }`}
                          title="Edit Instructions"
                        >
                          <Edit3Icon size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleBubble(bubble.id, bubble.active)}
                          className={`p-2 rounded-lg transition-all ${
                            bubble.active 
                              ? isLightTheme ? 'text-emerald-500 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10'
                              : isLightTheme ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-700'
                          }`}
                          title={bubble.active ? 'Deactivate' : 'Activate'}
                        >
                          <CheckCircle2Icon size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBubble(bubble.id)}
                          className={`p-2 rounded-lg transition-all text-slate-400 hover:text-red-500 ${
                            isLightTheme ? 'hover:bg-red-50' : 'hover:bg-red-500/10'
                          }`}
                          title="Delete"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {bubble.instructions && editingBubbleId !== bubble.id && (
                      <div className={`mt-2 p-2 rounded-lg text-[10px] font-mono whitespace-pre-wrap ${
                        isLightTheme ? 'bg-slate-50 text-slate-500' : 'bg-slate-900/50 text-slate-400'
                      }`}>
                        {bubble.instructions}
                      </div>
                    )}

                    {editingBubbleId === bubble.id && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          defaultValue={bubble.instructions || ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleUpdateBubbleInstructions(bubble.id, e.currentTarget.value);
                            }
                          }}
                          placeholder="Type instructions here... (Ctrl+Enter to save)"
                          className={`w-full h-24 text-[11px] rounded-lg px-3 py-2 border transition-all outline-none font-mono ${
                            isLightTheme 
                              ? 'bg-slate-50 text-slate-800 border-slate-200' 
                              : 'bg-slate-900 text-slate-200 border-slate-700'
                          }`}
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingBubbleId(null)}
                            className="px-2 py-1 text-[10px] text-slate-500"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={(e) => {
                              const textarea = (e.currentTarget.previousElementSibling?.previousElementSibling as HTMLTextAreaElement);
                              handleUpdateBubbleInstructions(bubble.id, textarea.value);
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                              isLightTheme ? 'bg-purple-100 text-purple-700' : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            Save Instructions
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {bubbles.length === 0 && !loadingBubbles && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No custom bubbles configured. Using defaults.
                  </div>
                )}
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
          ) : activeMainTab === 'identity' ? (
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
          ) : activeMainTab === 'identity_zero' ? (
            <motion.div
              key="identity_zero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`p-6 rounded-2xl border transition-all ${
                isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/50 border-slate-800'
              }`}>
                <IdentityZeroConsole />
              </div>
            </motion.div>
          ) : (() => {
            const customTab = customTabs.find(ct => ct.id === activeMainTab);
            if (customTab) {
              return (
                <motion.div
                  key={activeMainTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {customTab.content}
                </motion.div>
              );
            }
            return null;
          })()}
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
