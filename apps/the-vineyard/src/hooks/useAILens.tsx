import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  createContext,
  useContext } from
'react';
import { AI_LENSES, getMockAnalysis } from '../data/aiLenses';
import {
  AILens,
  AILensAnalysis,
  AgentXResponse,
  Task,
  VineConversation,
  Grape,
  Project } from
'../types';
import { client } from '../api/client';
// ─── Types ───
export interface LensDropZone {
  id: string;
  label: string;
  pageId: string;
  dataType: string;
  getData: () => any;
  getSummary: () => string;
}
export interface AILensContextType {
  // Drag state
  isDragging: boolean;
  draggingLensId: string | null;
  dragOverZoneId: string | null;
  // Active lens overlay
  isOverlayOpen: boolean;
  activeLens: AILens | null;
  activeZone: LensDropZone | null;
  analysisResult: string;
  lastAgentXResponse: AgentXResponse | null;
  // Analysis history
  analysisHistory: AILensAnalysis[];
  // AgentX status
  agentXStatus: 'idle' | 'analyzing' | 'error';
  // Handlers
  handleDragStart: (e: React.DragEvent, lensId: string) => void;
  handleDragOver: (e: React.DragEvent, zoneId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, zone: LensDropZone) => void;
  closeOverlay: () => void;
  // AgentX communication (via Bree API client)
  sendToAgentX: (
  lensId: string,
  zoneId: string,
  data: any)
  => Promise<AgentXResponse | null>;
  // Registration
  registerDropZone: (zone: LensDropZone) => void;
  unregisterDropZone: (zoneId: string) => void;
  dropZones: Map<string, LensDropZone>;
}
const AILensContext = createContext<AILensContextType | null>(null);
// ─── Provider ───
export function AILensProvider({ children }: {children: React.ReactNode;}) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingLensId, setDraggingLensId] = useState<string | null>(null);
  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [activeLens, setActiveLens] = useState<AILens | null>(null);
  const [activeZone, setActiveZone] = useState<LensDropZone | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [lastAgentXResponse, setLastAgentXResponse] =
  useState<AgentXResponse | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AILensAnalysis[]>([]);
  const [agentXStatus, setAgentXStatus] = useState<
    'idle' | 'analyzing' | 'error'>(
    'idle');
  const dropZonesRef = useRef<Map<string, LensDropZone>>(new Map());
  const [dropZones, setDropZones] = useState<Map<string, LensDropZone>>(
    new Map()
  );
  const registerDropZone = useCallback((zone: LensDropZone) => {
    dropZonesRef.current.set(zone.id, zone);
    setDropZones(new Map(dropZonesRef.current));
  }, []);
  const unregisterDropZone = useCallback((zoneId: string) => {
    dropZonesRef.current.delete(zoneId);
    setDropZones(new Map(dropZonesRef.current));
  }, []);
  const handleDragStart = useCallback((e: React.DragEvent, lensId: string) => {
    e.dataTransfer.setData('lensId', lensId);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    setDraggingLensId(lensId);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverZoneId(zoneId);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZoneId(null);
  }, []);
  // ── AgentX Communication via Bree API Client ──
  const sendToAgentX = useCallback(
    async (
    lensId: string,
    zoneId: string,
    data: any)
    : Promise<AgentXResponse | null> => {
      const lens = AI_LENSES.find((l) => l.id === lensId);
      if (!lens) return null;
      const zone = dropZonesRef.current.get(zoneId);
      const summary = zone?.getSummary() || 'No data available';
      const dataType = zone?.dataType || 'unknown';
      setAgentXStatus('analyzing');
      try {
        // Call through the Bree Eden-style API client
        const { data: response, error } = await client.api.agentx.analyze({
          lensId,
          targetType: dataType,
          targetId: zoneId,
          contextSummary: summary,
          priority: lensId === 'urgent-lens' ? 'urgent' : 'normal'
        });
        if (error) {
          console.error('[AgentX] Analysis failed:', error.message);
          setAgentXStatus('error');
          return null;
        }
        setLastAgentXResponse(response);
        setAgentXStatus('idle');
        // Fetch updated analysis history for this lens
        const { data: history } = await client.api.lenses.
        byId(lensId).
        analyses.get();
        if (history) {
          setAnalysisHistory(history);
        }
        return response;
      } catch (err) {
        console.error('[AgentX] Communication error:', err);
        setAgentXStatus('error');
        return null;
      }
    },
    []
  );
  const handleDrop = useCallback(
    async (e: React.DragEvent, zone: LensDropZone) => {
      e.preventDefault();
      setIsDragging(false);
      setDraggingLensId(null);
      setDragOverZoneId(null);
      const lensId = e.dataTransfer.getData('lensId');
      const lens = AI_LENSES.find((l) => l.id === lensId);
      if (lens) {
        setActiveLens(lens as any);
        setActiveZone(zone);
        // Send through AgentX via Bree API client
        const response = await sendToAgentX(lensId, zone.id, zone.getData());
        if (response) {
          setAnalysisResult(response.analysis);
        } else {
          // Fallback to local mock if AgentX fails
          setAnalysisResult(
            getMockAnalysis(lensId, zone.dataType, zone.getSummary())
          );
        }
        setIsOverlayOpen(true);
      }
    },
    [sendToAgentX]
  );
  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setActiveLens(null);
    setActiveZone(null);
    setAnalysisResult('');
    setLastAgentXResponse(null);
  }, []);
  const value: AILensContextType = {
    isDragging,
    draggingLensId,
    dragOverZoneId,
    isOverlayOpen,
    activeLens,
    activeZone,
    analysisResult,
    lastAgentXResponse,
    analysisHistory,
    agentXStatus,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    closeOverlay,
    sendToAgentX,
    registerDropZone,
    unregisterDropZone,
    dropZones
  };
  return (
    <AILensContext.Provider value={value}>{children}</AILensContext.Provider>);

}
// ─── Hook ───
export function useAILens() {
  const context = useContext(AILensContext);
  if (!context) {
    throw new Error('useAILens must be used within an AILensProvider');
  }
  return context;
}
// ─── Drop Zone Helper Hook ───
export function useLensDropZone(config: {
  id: string;
  label: string;
  pageId: string;
  dataType: string;
  getData: () => any;
  getSummary: () => string;
}) {
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dragOverZoneId,
    isDragging,
    registerDropZone,
    unregisterDropZone
  } = useAILens();
  useEffect(() => {
    registerDropZone({
      id: config.id,
      label: config.label,
      pageId: config.pageId,
      dataType: config.dataType,
      getData: config.getData,
      getSummary: config.getSummary
    });
    return () => unregisterDropZone(config.id);
  }, [config.id, config.label, config.pageId, config.dataType]);
  const isOver = dragOverZoneId === config.id;
  const zone: LensDropZone = {
    id: config.id,
    label: config.label,
    pageId: config.pageId,
    dataType: config.dataType,
    getData: config.getData,
    getSummary: config.getSummary
  };
  return {
    isOver,
    isDragging,
    dropProps: {
      onDragOver: (e: React.DragEvent) => handleDragOver(e, config.id),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, zone)
    },
    dropClassName: isOver ?
    'ring-2 ring-violet-400/50 ring-offset-2 ring-offset-transparent' :
    isDragging ?
    'ring-1 ring-violet-200/30 ring-offset-1 ring-offset-transparent' :
    ''
  };
}