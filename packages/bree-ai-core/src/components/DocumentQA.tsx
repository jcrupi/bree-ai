import React, { useState, useEffect, useRef, useMemo } from 'react';
import { currentBrand } from '../config/branding';
import { motion, AnimatePresence } from 'framer-motion';
import { SendIcon, Loader2Icon, Volume2Icon, VolumeXIcon, MicIcon, SettingsIcon, MaximizeIcon, PlayIcon, RadioIcon, FileText, Gauge } from 'lucide-react';
import { DocumentSelector } from './DocumentSelector';
import { ChatMessage } from './ChatMessage';
import { SpeakingAvatar } from './SpeakingAvatar';
import { AdminSettings } from './AdminSettings';
import { AvatarMode } from './AvatarMode';
import { 
  ActionGroup, 
  ActionToggle, 
  PageHeader 
} from './ui';
import { FeedbackButton } from './FeedbackButton';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeakToText';
import { api, API_URL } from '../utils/api-client';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

interface Document {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'processing' | 'error';
  pageCount?: number;
}

const initialDocuments: Document[] = [{
  id: 'all-docs',
  title: 'All Documents',
  description: 'Search across the entire collection.',
  status: 'ready'
}];

const mockMessages: Message[] = [];

const getMockSearchResponse = (query: string): RagsterSearchResponse => {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('habit') || queryLower.includes('change') || queryLower.includes('how')) {
    return {
      results: [{
        id: 'mock-1',
        text: "Habit change starts with awareness. The parenting book emphasizes identifying the physical sensations that precede the behavior. By using the Keen2 bracelet to catch these moments, children can learn to replace the habit with a healthier 'competing response'.",
        score: 0.95,
        collection: 'parenting-book',
        metadata: { page: 45, section: 'The Path to Change' }
      }],
      query,
      count: 1
    };
  } else if (queryLower.includes('connection') || queryLower.includes('relationship')) {
    return {
      results: [{
        id: 'mock-2',
        text: "Prioritizing connection means meeting the child where they are. When a parent reacts with frustration, it can increase the child's stress and exacerbate the behavior. The book suggests taking a 'paws' yourself to respond with curiosity instead of correction.",
        score: 0.92,
        collection: 'parenting-book',
        metadata: { page: 12, section: 'Parenting with Awareness' }
      }],
      query,
      count: 1
    };
  }
  
  return {
    results: [{
      id: 'mock-default',
      text: `According to the parenting book and HabitAware research, your question about "${query}" is best addressed by building awareness and maintaining a supportive environment. Keen2 can help track these patterns over time.`,
      score: 0.75,
      collection: 'parenting-book',
      metadata: { page: 0, section: 'General' }
    }],
    query,
    count: 1
  };
};

export interface DocumentQAProps {
  collectionId?: string;
  orgId?: string;
  orgSlug?: string;
  userEmail?: string;
  initialMessages?: Message[];
  title?: string;
  subtitle?: string;
  description?: string;
  showAdmin?: boolean;
  brandLogo?: string;
  brandColor?: string;
  aiName?: string;
  instructionsPath?: string;
}

export function DocumentQA({
  collectionId: propCollectionId,
  orgId: propOrgId,
  orgSlug: propOrgSlug = currentBrand.collection.orgId,
  userEmail: propUserEmail = `user@${currentBrand.collection.orgId}`,
  initialMessages = mockMessages,
  title: propTitle,
  subtitle: propSubtitle = 'Powered by AI',
  description: propDescription = `${currentBrand.displayName} Intelligence`,
  showAdmin: propShowAdmin = true,
  brandLogo = currentBrand.logo,
  brandColor = currentBrand.colors.primary,
  aiName = currentBrand.aiName || 'AI Assistant',
  instructionsPath = currentBrand.instructionsPath || '/instructions.md'
}: DocumentQAProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'play' | 'live'>('live');
  const [selectedDoc, setSelectedDoc] = useState('all-docs');
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingEnabled, setSpeakingEnabled] = useState(false);
  const handleToggleSpeaking = () => {
    if (isActuallySpeaking) {
      stopSpeaking();
    }
    setSpeakingEnabled(!speakingEnabled);
  };
  const [speakingRate, setSpeakingRate] = useState(1.1);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [avatarMode, setAvatarMode] = useState(false);
  const [avatarSessionStart, setAvatarSessionStart] = useState<number>(0);
  const [adminInstructions, setAdminInstructions] = useState('Be professional and gentle in your responses. If you do not know the answer to a question based on the provided context, politely inform the user that you will get back to them and thank them for their patience.');
  const [responseStyle, setResponseStyle] = useState<'thorough' | 'succinct'>('thorough');
  const [language, setLanguage] = useState<'english' | 'spanish'>('english');
  const [globalCollectionId, setGlobalCollectionId] = useState<string>(() => propCollectionId || localStorage.getItem(`${currentBrand.name}_default_collection`) || '');
  const [defaultDocumentIds, setDefaultDocumentIds] = useState<string[]>(['all-docs']);
  const [currentCollectionName, setCurrentCollectionName] = useState<string>('');
  const [currentCollectionDocCount, setCurrentCollectionDocCount] = useState<number>(0);
  const [expertMode, setExpertMode] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const isLightTheme = currentBrand.name === 'habitaware-ai' || currentBrand.name === 'genius-talent';
  
  // Reset avatar session message tracking when entering avatar mode
  useEffect(() => {
    if (avatarMode) {
      setAvatarSessionStart(messages.length);
    }
  }, [avatarMode]);

  // Load brand config from DB on mount
  useEffect(() => {
    const loadBrandConfig = async () => {
      try {
        const { data: config } = await (api.api.config as any)[currentBrand.name].get();
        if (config && !config.error) {
          if (config.defaultDocumentIds) setDefaultDocumentIds(config.defaultDocumentIds);
          if (config.responseStyle) setResponseStyle(config.responseStyle);
          if (config.language) setLanguage(config.language);
          if (config.globalCollectionId) setGlobalCollectionId(config.globalCollectionId);
        }
      } catch (err) {
        console.warn('Failed to load brand config from DB:', err);
      }
    };
    loadBrandConfig();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    // Try to load persisted instructions from AntiMatterDB first
    // Try to load persisted instructions from Gateway API
    api.api.identity.instructions.get().then(({ data: persistedInstructions }) => {
      const pStr = String(persistedInstructions);
      if (persistedInstructions && !pStr.includes('<!DOCTYPE html>') && !pStr.includes('<html')) {
        setAdminInstructions(pStr);
      } else {
        // Fallback to brand-specific instructions
        fetch(instructionsPath)
          .then(res => res.text())
          .then(text => {
            if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
              setAdminInstructions(text);
            }
          })
          .catch(err => console.error(`Failed to load ${instructionsPath}:`, err));
      }
    }).catch(err => {
      console.warn('Failed to load persisted instructions, trying static:', err);
      fetch(instructionsPath)
        .then(res => res.text())
        .then(text => {
          if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            setAdminInstructions(text);
          }
        })
        .catch(err => console.error(`Failed to load ${instructionsPath}:`, err));
    });
    
    // Load default collection if in live mode AND no collection is selected
    if (mode === 'live' && !globalCollectionId) {
      api.api.knowledge.collections.get({ query: { org_id: propOrgSlug } }).then(({ data: result }) => {
        if (result && (result as any).collections && (result as any).collections.length > 0) {
          const collections = (result as any).collections;
          // First, try to find the brand's default collection
          const defaultColName = currentBrand.collection.collectionId;
          const brandDefault = collections.find((c: any) => 
            c.name === defaultColName || c.slug === defaultColName
          );
          
          if (brandDefault) {
            setGlobalCollectionId(brandDefault.id);
            localStorage.setItem(`${currentBrand.name}_default_collection`, brandDefault.id);
          } else {
            // Fallback to first collection
            setGlobalCollectionId(collections[0].id);
            localStorage.setItem(`${currentBrand.name}_default_collection`, collections[0].id);
          }
        }
      }).catch(err => console.error('Failed to load initial collections:', err));
    }

  }, [mode]);

  useEffect(() => {
    if (mode === 'live' && globalCollectionId) {
       // Load collection info and resources via gateway
       Promise.all([
         api.api.knowledge.resources.get({ query: { collection_id: globalCollectionId, org_id: propOrgSlug } }).catch(() => ({ data: { resources: [] } })),
         api.api.knowledge.collections.get({ query: { org_id: propOrgSlug } }).catch((err) => {
           console.error('Failed to load collections list:', err);
           return { data: { collections: [] } };
         })
       ]).then(async ([resData, collectionsData]) => {
         const res = (resData.data || { resources: [] }) as any;
         const collectionsResult = (collectionsData.data || { collections: [] }) as any;
         
         const mappedDocs: Document[] = res.resources.map((r: any) => ({
           id: r.id,
           title: r.filename,
           description: `Uploaded resource: ${r.filename}`,
           status: 'ready',
           pageCount: Math.ceil(r.size / 2000) || 1
         }));
         
         // Find current collection info
         let currentCollection = collectionsResult.collections.find((c: any) => c.id === globalCollectionId);
         
         // If not found in list, try to fetch directly by ID
         if (!currentCollection && globalCollectionId) {
            try {
              const { data: directCollection } = await api.api.knowledge.collections({ id: globalCollectionId }).get();
              if (directCollection) {
                currentCollection = directCollection;
              }
            } catch (err) {
              console.error('Failed to fetch collection directly:', err);
            }
         }
         
         if (currentCollection) {
            setCurrentCollectionName((currentCollection as any).name);
            setCurrentCollectionDocCount((currentCollection as any).documents || (currentCollection as any).document_count || res.resources.length);
         }
 else if (collectionsResult.collections.length === 0) {
           // If collections list is empty, show error state
           setCurrentCollectionName('No Collection Found');
           setCurrentCollectionDocCount(res.resources.length);
         } else {
           setCurrentCollectionName('Loading...');
           setCurrentCollectionDocCount(res.resources.length);
         }
         
         setDocuments([
           { id: 'all-docs', title: 'Whole Collection', description: 'Search across all files', status: 'ready' },
           ...mappedDocs
         ]);

         // If defaultDocumentIds contains exactly one specific doc, select it for UI
         if (defaultDocumentIds.length === 1 && defaultDocumentIds[0] !== 'all-docs') {
           if (mappedDocs.some(d => d.id === defaultDocumentIds[0])) {
             setSelectedDoc(defaultDocumentIds[0]);
           }
         } else {
           setSelectedDoc('all-docs');
         }
       }).catch(err => {
         console.error('Failed to fetch collection resources:', err);
         setCurrentCollectionName('Error Loading Collection');
         setCurrentCollectionDocCount(0);
       });
    } else {
      setCurrentCollectionName('');
      setCurrentCollectionDocCount(0);
    }
  }, [mode, globalCollectionId, defaultDocumentIds]);

  const { speak, stop: stopSpeaking, isSpeaking: isActuallySpeaking } = useTextToSpeech();
  const { startListening, stopListening, isRecording, isTranscribing, isSupported: micSupported } = useSpeechToText();
  
  const selectedDocument = documents.find(d => d.id === selectedDoc);

  const handleVoiceInput = async () => {
    if (isRecording) {
      const transcribedText = await stopListening();
      if (transcribedText) setInput(transcribedText);
    } else {
      startListening();
    }
  };

  const speakLastMessage = () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage && speakingEnabled) {
      speak(lastAssistantMessage.content, speakingRate);
    } else if (!speakingEnabled) {
      // Stop any currently playing audio when speaking is disabled
      stopSpeaking();
    }
  };

  // Stop speaking when toggle is turned off
  useEffect(() => {
    if (!speakingEnabled) {
      stopSpeaking();
    }
  }, [speakingEnabled, stopSpeaking]);

  const refreshInstructions = async () => {
    try {
      const { data: persistedInstructions } = await api.api.identity.instructions.get();
      if (persistedInstructions) {
        setAdminInstructions(persistedInstructions as string);
      } else {

        const res = await fetch(instructionsPath + '?t=' + Date.now());
        const text = await res.text();
        if (text && !text.includes('<!DOCTYPE html>')) {
          setAdminInstructions(text);
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const handleSaveSettings = async (settings: {
    instructions: string;
    responseStyle: 'thorough' | 'succinct';
    language: 'english' | 'spanish';
  }) => {
    setAdminInstructions(settings.instructions);
    setResponseStyle(settings.responseStyle);
    setLanguage(settings.language);

    // Persist brand config to Gateway API (Database Level)
    try {
      // 1. Save Instructions to the identity identity service
      await api.api.identity.instructions.post({ content: settings.instructions });
      
      // 2. Save UI Config to the config service
      await (api.api.config as any)[currentBrand.name].post({ 
        defaultDocumentIds,
        responseStyle: settings.responseStyle,
        language: settings.language,
        globalCollectionId
      });
      console.log('Instructions and Brand configuration persisted to database level');
    } catch (err) {
      console.error('Failed to persist brand config:', err);
    }
  };

  const handleUploadDocuments = (files: File[]) => {
    const newDocuments = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: `Uploaded document: ${file.name}`,
      status: 'processing' as const,
      pageCount: Math.floor(Math.random() * 50) + 10
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => newDocuments.find(nd => nd.id === doc.id) ? {
        ...doc, status: 'ready' as const
      } : doc));
    }, 2000);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (selectedDoc === id && documents.length > 1) {
      const remainingDocs = documents.filter(doc => doc.id !== id);
      setSelectedDoc(remainingDocs[0].id);
    }
  };

  const SUGGESTED_QUESTIONS = useMemo(() => {
    if (isLightTheme) {
      return [
        "How can I build awareness for my child?",
        "What does the book say about 'connecting over correcting'?",
        "How do I explain Keen2 to my child?",
        "What are the first steps for habit change?"
      ];
    }
    
    if (currentBrand.name === 'genius-talent') {
      return [
        "How can I improve candidate engagement?",
        "What are the best practices for recruiter branding?",
        "How do I streamline the interview process?",
        "What metrics should I track for better hiring?"
      ];
    }

    if (language === 'spanish') {
      return [
        "¿Cuáles son los requisitos de vestimenta y conducta del personal?",
        "¿Qué artículos está prohibido empacar?",
        "¿Cuáles son las responsabilidades para la eliminación de escombros?"
      ];
    }

    return [
      "What are the appearance and conduct requirements?",
      "What items are prohibited from being used?",
      "What are the responsibilities for maintenance?"
    ];
  }, [language]);

  const handleSend = async (textOverride?: string) => {
    const query = textOverride || input.trim();
    if (!query || isLoading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let searchResults: RagsterSearchResponse;
      if (mode === 'play') {
        await new Promise(resolve => setTimeout(resolve, 500));
        searchResults = getMockSearchResponse(query);
      } else {
        // Use gateway for search
        const collectionToUse = globalCollectionId || selectedDoc;
        
        // Build document filter based on selection
        let filter = undefined;
        if (!defaultDocumentIds.includes('all-docs')) {
          const docTitles = defaultDocumentIds
            .map(id => documents.find(d => d.id === id)?.title)
            .filter(Boolean);
            
          if (docTitles.length === 1) {
            filter = { filename: docTitles[0] };
          } else if (docTitles.length > 1) {
            filter = { filename: { $in: docTitles } };
          }
        }

        // Add tag filtering if tags are selected
        if (selectedTags.length > 0) {
          const tagFilter = { tags: { $in: selectedTags } };
          filter = filter ? { $and: [filter, tagFilter] } : tagFilter;
        }

        const { data } = await api.api.knowledge.search.post({
          query,
          collection: collectionToUse,
          topK: 10,
          min_score: 0.4,
          org_id: propOrgSlug,
          filter
        });
        
        searchResults = (data as any)?.data || data as any;
      }


      let currentInstructions = adminInstructions;
      try {
        const { data: persistedInstructions } = await api.api.identity.instructions.get();
        const pStr = String(persistedInstructions);
        if (persistedInstructions && !pStr.includes('<!DOCTYPE html>') && !pStr.includes('<html')) {
          currentInstructions = pStr;
          setAdminInstructions(pStr);
        } else {
          const instRes = await fetch(instructionsPath + '?t=' + Date.now());
          const instText = await instRes.text();
          if (instText && !instText.includes('<!DOCTYPE html>') && !instText.includes('<html')) {
            currentInstructions = instText;
            setAdminInstructions(instText);
          }
        }
      } catch (e) {
        console.warn('Failed to sync instructions on send:', e);
      }

      let context = '';
      if (searchResults.results && searchResults.results.length > 0) {
        context = searchResults.results
          .map((result, idx) => `[Segment ${idx + 1}](Collection: ${result.collection || 'Default'}):\n${result.text}`)
          .join('\n\n---\n\n');
      }

      let responseText = '';
      
      try {
        const chatMessages = [
          { 
            role: 'system', 
            content: (currentInstructions || `You are ${currentBrand.aiName}, a helpful AI assistant.`) + 
                     "\n\nIMPORTANT: Use the provided document context to answer questions. Do not state how many snippets you found or mention internal document IDs. Simply provide a helpful answer based on the knowledge provided." + 
                     (language === 'spanish' ? ' Respond in Spanish.' : '') 
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { 
            role: 'user', 
            content: `KNOWLEDGE SOURCES:\n${context || 'No specific document context found.'}\n\nUSER QUESTION: ${query}` 
          }
        ];

        const chatPayload = {
          messages: chatMessages,
          userEmail: propUserEmail,
          orgSlug: propOrgSlug,
          options: {
            model: 'gpt-4o',
            temperature: 0.0,
            stream: true,
            filter: selectedTags.length > 0 ? { tags: { $in: selectedTags } } : undefined
          }
        };

        const response = await fetch(`${API_URL}/api/collective/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload)
        });

        if (!response.ok) throw new Error(`Streaming failed: ${response.statusText}`);
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        let fullContent = '';
        let lastSpokenIndex = 0;
        let lineBuffer = '';

        // Add an empty assistant message to populate
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '',
          sources: searchResults.results
        }]);

        const cleanAIResponse = (text: string) => {
          return text
            .replace(/^Verified User: [^\n]+\n*/i, '')
            .replace(/\[Sources: [^\]]+\]/gi, '')
            .trim();
        };

        const processRawData = (dataStr: string) => {
          try {
            const json = JSON.parse(dataStr);
            const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || json.content || '';
            
            if (delta) {
              // Handle full-content overwrite vs delta
              if (fullContent && delta.startsWith(fullContent) && delta.length > fullContent.length) {
                fullContent = delta;
              } else if (fullContent && delta === fullContent) {
                // redundant
              } else {
                fullContent += delta;
              }
              
              const cleanedContent = cleanAIResponse(fullContent);
              
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0 && newMessages[lastIdx].role === 'assistant') {
                  newMessages[lastIdx] = { ...newMessages[lastIdx], content: cleanedContent };
                }
                return newMessages;
              });

              if (speakingEnabled) {
                const nextChunk = cleanedContent.slice(lastSpokenIndex);
                const sentenceMatch = nextChunk.match(/.*?[.!?](\s+|$)/);
                if (sentenceMatch) {
                  const sentence = sentenceMatch[0];
                  enqueue(sentence, speakingRate);
                  lastSpokenIndex += sentence.length;
                }
              }
            }
          } catch (e) {
            console.warn('JSON Parse error in stream chunk:', e, dataStr);
          }
        };

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            lineBuffer += chunk;
            
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
              const dataStr = trimmedLine.startsWith('data: ') ? trimmedLine.slice(6) : trimmedLine;
              if (dataStr.startsWith('{')) processRawData(dataStr);
            }
          }

          if (lineBuffer.trim()) {
            const finalLines = lineBuffer.split('\n');
            for (const line of finalLines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const dataStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
              if (dataStr.startsWith('{')) processRawData(dataStr);
            }
          }
        }

        if (speakingEnabled && lastSpokenIndex < fullContent.length) {
          enqueue(fullContent.slice(lastSpokenIndex), speakingRate);
        }
        responseText = fullContent;
      } catch (error) {
        console.error('AI generation error:', error);
        if (!responseText && context) {
          responseText = formatBasicResponse(searchResults, responseStyle);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
               lastMsg.content = responseText;
            } else {
               newMessages.push({ role: 'assistant', content: responseText, sources: searchResults.results });
            }
            return newMessages;
          });
        }
      }

      if (mode === 'play') {
        // Play mode logic handled above basically, but we append mark if needed
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBasicResponse = (searchResults: RagsterSearchResponse, style: 'thorough' | 'succinct') => {
    if (!searchResults.results || searchResults.results.length === 0) return '';
    if (style === 'thorough') {
      return searchResults.results
        .map((result, idx) => `${idx + 1}. ${result.text}`)
        .join('\n\n');
    } else {
      return searchResults.results[0].text;
    }
  };

  const handleAvatarModeSend = async () => {
    if (input.trim()) await handleSend();
  };

  const currentAvatarResponse = messages.length > avatarSessionStart ? messages[messages.length - 1].content : undefined;

  return (
    <>
      <div className={`min-h-screen ${
        isLightTheme 
          ? 'bg-[#F8F9FA] text-slate-900' 
          : 'bg-slate-950 text-slate-100'
      }`}>
        <div className="max-w-[940px] mx-auto px-6 py-8">
          <PageHeader
            title={propTitle || `${currentBrand.displayName} Chat`}
            subtitle={propSubtitle || 'AI Assistant'}
            description={propDescription || currentBrand.tagline}
            logo={
              <div className="w-full h-full bg-white flex items-center justify-center p-1 rounded-xl shadow-inner overflow-hidden">
                <img 
                  src={brandLogo} 
                  alt={currentBrand.displayName} 
                  className="max-w-full max-h-full object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-slate-400">${currentBrand.displayName}</span>`;
                  }}
                />
              </div>
            }
            actions={
              <ActionGroup>
                <ActionToggle
                  icon={speakingEnabled ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
                  label="Speak"
                  isActive={speakingEnabled}
                  variant="brand"
                  activeColor={brandColor}
                  onClick={handleToggleSpeaking}
                  title={speakingEnabled ? 'Disable speaking' : 'Enable speaking'}
                />

                <AnimatePresence>
                  {speakingEnabled && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: -10 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -10 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden"
                    >
                      <Gauge size={14} className="text-slate-400 shrink-0" />
                      <div className="flex flex-col gap-0.5 min-w-[80px]">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <span>Speed</span>
                          <span style={{ color: brandColor }}>{speakingRate.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={speakingRate}
                          onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                          style={{
                             color: brandColor,
                             background: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${((speakingRate - 0.5) / 1.5) * 100}%, #334155 ${((speakingRate - 0.5) / 1.5) * 100}%, #334155 100%)`
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ActionToggle
                  icon={mode === 'play' ? <PlayIcon size={16} /> : <RadioIcon size={16} />}
                  label={mode === 'play' ? 'Play' : 'Live'}
                  isActive={true}
                  variant="brand"
                  activeColor={brandColor}
                  onClick={() => setMode(mode === 'play' ? 'live' : 'play')}
                />

                <ActionToggle
                  icon={<MaximizeIcon size={16} />}
                  label="Avatar"
                  isActive={avatarMode}
                  variant="brand"
                  activeColor={brandColor}
                  onClick={() => setAvatarMode(!avatarMode)}
                />

                <ActionToggle
                  icon={<FileText size={16} />}
                  label="Expert"
                  isActive={expertMode}
                  variant="brand"
                  activeColor={brandColor}
                  onClick={() => setExpertMode(!expertMode)}
                  title={expertMode ? "Hide sources" : "Show sources"}
                />

                {propShowAdmin && (
                  <ActionToggle
                    icon={<SettingsIcon size={16} />}
                    label="Admin"
                    isActive={showAdminSettings}
                    variant="brand"
                    activeColor={brandColor}
                    onClick={() => {
                      if (!showAdminSettings) { /* refresh logic if needed */ }
                      setShowAdminSettings(!showAdminSettings);
                    }}
                  />
                )}
              </ActionGroup>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
            <aside>
              <DocumentSelector 
                documents={documents} 
                selectedId={selectedDoc} 
                onSelect={setSelectedDoc}
                collectionName={currentCollectionName}
                documentCount={currentCollectionDocCount}
              />
            </aside>

            <main className="flex flex-col">
              <div className={`backdrop-blur-sm border transition-all duration-500 rounded-3xl shadow-xl flex flex-col h-[500px] sm:h-[600px] lg:h-[calc(100vh-200px)] lg:min-h-[650px] overflow-hidden ${
                isLightTheme 
                  ? 'bg-white border-slate-100 shadow-slate-200/50' 
                  : 'bg-slate-900/50 border-slate-800'
              }`}>
                {showAdminSettings ? (
                  <AdminSettings 
                    onSave={handleSaveSettings} 
                    onUploadDocuments={handleUploadDocuments} 
                    documents={documents} 
                    onDeleteDocument={handleDeleteDocument} 
                    initialInstructions={adminInstructions} 
                    initialResponseStyle={responseStyle} 
                    initialLanguage={language} 
                    mode={mode} 
                    onClose={() => setShowAdminSettings(false)} 
                    globalCollectionId={globalCollectionId}
                    onGlobalCollectionChange={setGlobalCollectionId}
                    defaultDocumentIds={defaultDocumentIds}
                    onDefaultDocumentChange={(ids) => {
                      setDefaultDocumentIds(ids);
                      // If only one, select it for UI, otherwise use 'all-docs' as placeholder
                      if (ids.length === 1 && ids[0] !== 'all-docs') {
                        setSelectedDoc(ids[0]);
                      } else {
                        setSelectedDoc('all-docs');
                      }
                    }}
                  />
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {messages.map((message, index) => (
                        <ChatMessage 
                          key={index} 
                          role={message.role} 
                          content={message.content} 
                          index={index} 
                          isSpeaking={speakingEnabled && isActuallySpeaking && message.role === 'assistant'} 
                          sources={expertMode ? message.sources : undefined}
                          brandColor={brandColor}
                        />
                      ))}
                      {isLoading && <div className={`${isLightTheme ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Searching...</div>}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className={`p-6 border-t ${isLightTheme ? 'border-slate-50 bg-slate-50/30' : 'border-slate-800'}`}>
                      {/* Suggested Questions */}
                      {!isLoading && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                          {SUGGESTED_QUESTIONS.map((q, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              onClick={() => handleSend(q)}
                              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all text-xs font-medium shadow-sm flex-shrink-0 ${
                                isLightTheme 
                                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-[#D448AA]/10 hover:border-[#D448AA]/30 hover:text-[#D448AA]' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-200'
                              }`}
                            >
                              {q}
                            </motion.button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        {micSupported && (
                          <button 
                            onClick={handleVoiceInput} 
                            className={`px-4 py-3 rounded-xl border transition-all ${
                              isRecording 
                                ? 'bg-red-500/20 border-red-500 animate-pulse' 
                                : isLightTheme
                                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                                  : 'bg-slate-800 border-slate-700'
                            }`}
                          >
                            <MicIcon size={18} />
                          </button>
                        )}
                        <textarea 
                          value={input} 
                          onChange={e => setInput(e.target.value)} 
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                          placeholder={language === 'spanish' ? `Pregunta a ${currentBrand.aiName}...` : `Ask ${currentBrand.aiName} a question...`}
                          className={`flex-1 rounded-xl px-4 py-3 text-sm border focus:outline-none transition-all ${
                            isLightTheme
                              ? 'bg-slate-50 text-slate-800 border-slate-200 focus:ring-2 focus:ring-[#D448AA]/20 focus:border-[#D448AA]/30'
                              : 'bg-slate-800 text-slate-100 border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30'
                          }`}
                        />
                        <button 
                          onClick={() => handleSend()} 
                          disabled={!input.trim() || isLoading} 
                          className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                            isLightTheme
                              ? 'bg-[#D448AA] text-white hover:bg-[#b03a8d]'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {isLoading ? <Loader2Icon className="animate-spin" size={18} /> : <SendIcon size={18} />}
                        </button>
                      </div>
                      {/* Language Quick Toggle */}
                      <div className="flex justify-end mt-2 px-1">
                        <button 
                          onClick={() => setLanguage(language === 'english' ? 'spanish' : 'english')}
                          className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                            isLightTheme
                              ? 'text-slate-400 hover:text-slate-600 bg-slate-50 border-slate-200'
                              : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border-slate-700/50'
                          }`}
                        >
                          <span className={language === 'english' ? (isLightTheme ? 'text-[#D448AA] font-bold' : 'text-blue-400 font-bold') : ''}>EN</span>
                          <span className="opacity-30">/</span>
                          <span className={language === 'spanish' ? (isLightTheme ? 'text-[#D448AA] font-bold' : 'text-blue-400 font-bold') : ''}>ES</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
      
      <FeedbackButton brandColor={brandColor} />

      <AnimatePresence>
        {avatarMode && <AvatarMode 
            isSpeaking={isActuallySpeaking} 
            onClose={() => setAvatarMode(false)}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onVoiceInput={handleVoiceInput}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            micSupported={micSupported}
            currentResponse={messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1].content : ''}
            onStopSpeaking={stopSpeaking}
            brandLogo={brandLogo}
            brandColor={brandColor}
          />}
      </AnimatePresence>
    </>
  );
}
