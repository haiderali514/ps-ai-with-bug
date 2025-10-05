import React, { createContext, useContext, useState, useRef, useMemo, useCallback, ReactNode, RefObject, useEffect } from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { DocumentSettings, EditorTool, Layer, AnySubTool, TransformSession, MoveSession, SnapLine, TransformMode, HistoryState, ExportFormat, BrushShape } from '../../../types/index';
import { generateThumbnail, fileToBase64, base64ToImageData } from '../../../utils/imageUtils';
import { saveProject, loadProject } from '../../../utils/projectUtils';

// --- CONTEXT STATE AND ACTIONS ---

interface EditorState {
    docSettings: DocumentSettings | null;
    setDocSettings: React.Dispatch<React.SetStateAction<DocumentSettings | null>>;
    
    // Layers
    layers: Layer[];
    activeLayerId: string | null;
    activeLayer: Layer | undefined;
    layerActions: {
        commit: (newLayers: Layer[], action: string, newActiveLayerId?: string) => void;
        setActiveLayerId: (id: string | null) => void;
        updateLayerProps: (id: string, props: Partial<Layer>, action: string) => void;
        updateLayerPropsPreview: (id: string, props: Partial<Layer>) => void;
        addLayer: () => void;
        addShapeLayer: (rect: { x: number; y: number; width: number; height: number; }) => void;
        deleteLayer: () => void;
        duplicateLayer: () => void;
        mergeDown: () => void;
        convertBackgroundToLayer: () => void;
        reorderLayer: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
    };
    
    // History
    history: {
        undo: () => void;
        redo: () => void;
        canUndo: boolean;
        canRedo: boolean;
        states: HistoryState[];
        currentIndex: number;
    };

    // Tool State
    toolState: {
        activeTool: EditorTool;
        setActiveTool: (tool: EditorTool) => void;
        activeSubTool: AnySubTool;
        setActiveSubTool: (subTool: AnySubTool) => void;
        foregroundColor: string;
        setForegroundColor: (color: string) => void;
        backgroundColor: string;
        setBackgroundColor: (color: string) => void;
        brushSettings: { size: number; hardness: number; opacity: number; shape: BrushShape; };
        setBrushSettings: React.Dispatch<React.SetStateAction<{ size: number; hardness: number; opacity: number; shape: BrushShape; }>>;
    };

    // View State
    zoom: {
        value: number;
        set: (update: number | 'in' | 'out' | 'reset') => void;
    };
    pan: {
        value: { x: number; y: number };
        set: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    };
    
    // Interaction State
    interaction: {
        transformSession: TransformSession | null;
        setTransformSession: React.Dispatch<React.SetStateAction<TransformSession | null>>;
        moveSession: MoveSession | null;
        setMoveSession: React.Dispatch<React.SetStateAction<MoveSession | null>>;
        snapLines: SnapLine[];
        setSnapLines: React.Dispatch<React.SetStateAction<SnapLine[]>>;
        selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
        setSelection: React.Dispatch<React.SetStateAction<{ rect: { x: number; y: number; width: number; height: number; } } | null>>;
    };

    // Modals
    modals: {
        isBgConvertModalOpen: boolean;
        setIsBgConvertModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isExportModalOpen: boolean;
        setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    };
    
    // Panels
    panels: {
        isPropertiesPanelOpen: boolean;
        setIsPropertiesPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isLayersPanelOpen: boolean;
        setIsLayersPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    };
    
    // General Actions
    editorActions: {
        handleSaveProject: () => void;
        handleOpenProject: () => void;
        handleExport: (format: ExportFormat, quality?: number) => void;
        handleResetView: () => void;
        handleConfirmConvertToLayer: () => void;
        handleImageAdded: (url: string) => void;
    };
    
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const EditorContext = createContext<EditorState | null>(null);

// --- PROVIDER COMPONENT ---

interface EditorProviderProps {
    children: ReactNode;
    initialDocumentSettings: DocumentSettings;
    initialFile?: File | null;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children, initialDocumentSettings, initialFile }) => {
    // State definitions...
    const [docSettings, setDocSettings] = useState<DocumentSettings | null>(initialDocumentSettings);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [previewLayerProps, setPreviewLayerProps] = useState<{ id: string; props: Partial<Layer> } | null>(null);
    
    const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.TRANSFORM);
    const [activeSubTool, setActiveSubTool] = useState<AnySubTool>('move');
    
    const [zoom, setZoomValue] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [viewResetKey, setViewResetKey] = useState(0); // Used to trigger recentering

    const [isBgConvertModalOpen, setIsBgConvertModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
    const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
    
    const [transformSession, setTransformSession] = useState<TransformSession | null>(null);
    const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
    const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
    const [selection, setSelection] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);

    const [foregroundColor, setForegroundColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [brushSettings, setBrushSettings] = useState({ size: 30, hardness: 0.8, opacity: 1, shape: 'round' as BrushShape });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived state and memos...
    const currentLayers = useMemo(() => {
        const layers = history[historyIndex]?.layers ?? [];
        if (!previewLayerProps) return layers;
        return layers.map(l => l.id === previewLayerProps.id ? { ...l, ...previewLayerProps.props } : l);
    }, [history, historyIndex, previewLayerProps]);

    const activeLayer = useMemo(() => currentLayers.find(l => l.id === activeLayerId), [currentLayers, activeLayerId]);

    // Actions and handlers...
    const commit = useCallback((newLayers: Layer[], action: string, newActiveLayerId?: string) => {
        const newHistoryState: HistoryState = { layers: newLayers, action };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newHistoryState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        if (newActiveLayerId !== undefined) {
            setActiveLayerId(newActiveLayerId);
        }
        setPreviewLayerProps(null);
    }, [history, historyIndex]);

    const undo = () => {
        if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
    };
    const redo = () => {
        if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
    };

    const updateLayerProps = useCallback((id: string, props: Partial<Layer>, action: string) => {
        const finalLayers = (history[historyIndex]?.layers ?? []).map(l => (l.id === id ? { ...l, ...props } : l));
        commit(finalLayers, action);
    }, [commit, history, historyIndex]);

    const updateLayerPropsPreview = useCallback((id: string, props: Partial<Layer>) => {
        setPreviewLayerProps({ id, props });
    }, []);

    const addLayer = () => {
        if (!docSettings) return;
        const baseLayers = history[historyIndex]?.layers ?? [];
        let maxLayerNum = 0;
        baseLayers.forEach(l => {
            const match = l.name.match(/^Layer (\d+)$/);
            if (match) maxLayerNum = Math.max(maxLayerNum, parseInt(match[1]));
        });

        const newLayer: Layer = {
            id: crypto.randomUUID(), name: `Layer ${maxLayerNum + 1}`, type: 'pixel',
            isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal', imageData: null,
            thumbnail: generateThumbnail(null, 48, 40),
            x: docSettings.width / 2, y: docSettings.height / 2, width: docSettings.width, height: docSettings.height,
            rotation: 0, scaleX: 1, scaleY: 1,
        };
        
        const newLayers = [...baseLayers];
        const activeIndex = activeLayerId ? newLayers.findIndex(l => l.id === activeLayerId) : -1;
        newLayers.splice(activeIndex !== -1 ? activeIndex + 1 : newLayers.length, 0, newLayer);
        commit(newLayers, 'Add Layer', newLayer.id);
    };
    
    const addShapeLayer = (rect: { x: number; y: number; width: number; height: number; }) => {
        const baseLayers = history[historyIndex]?.layers ?? [];
        const newShapeLayer: Layer = {
            id: crypto.randomUUID(), name: `Rectangle 1`, type: 'shape',
            shapeProps: { type: 'rectangle', fill: foregroundColor, stroke: null, strokeWidth: 0 },
            isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal', imageData: null, thumbnail: '',
            width: rect.width, height: rect.height, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
            rotation: 0, scaleX: 1, scaleY: 1,
        };
        const newLayers = [...baseLayers, newShapeLayer];
        commit(newLayers, 'Add Shape', newShapeLayer.id);
    };
    
    // ... Other actions like deleteLayer, duplicateLayer, etc.
    const deleteLayer = () => {
        const baseLayers = history[historyIndex]?.layers ?? [];
        if (baseLayers.length <= 1 || activeLayer?.isBackground) return;
        const newLayers = baseLayers.filter(l => l.id !== activeLayerId);
        commit(newLayers, 'Delete Layer', newLayers[0]?.id);
    };

    const duplicateLayer = () => {
        const baseLayers = history[historyIndex]?.layers ?? [];
        if (!activeLayer) return;
        const newLayer: Layer = { ...activeLayer, id: crypto.randomUUID(), name: `${activeLayer.name} copy`, x: activeLayer.x + 10, y: activeLayer.y + 10 };
        const activeIndex = baseLayers.findIndex(l => l.id === activeLayerId);
        const newLayers = [...baseLayers];
        newLayers.splice(activeIndex + 1, 0, newLayer);
        commit(newLayers, 'Duplicate Layer', newLayer.id);
    };

    const mergeDown = () => {}; // Complex logic, simplified for now
    const convertBackgroundToLayer = () => {
        const newLayers = (history[historyIndex]?.layers ?? []).map(l => l.isBackground ? { ...l, name: 'Layer 0', isLocked: false, isBackground: false } : l);
        commit(newLayers, 'Convert Background');
    };
    
    const reorderLayer = (draggedId: string, targetId: string, position: 'before' | 'after') => {
        const baseLayers = history[historyIndex]?.layers ?? [];
        if (draggedId === targetId) return;

        const draggedLayer = baseLayers.find(l => l.id === draggedId);
        if (!draggedLayer || draggedLayer.isBackground) return;

        // Filter out the dragged layer
        const remainingLayers = baseLayers.filter(l => l.id !== draggedId);
        
        // Find the index of the target layer in the new array
        let targetIndex = remainingLayers.findIndex(l => l.id === targetId);

        // If the target is not found, do nothing
        if (targetIndex === -1) return;

        // Adjust index based on drop position
        if (position === 'after') {
            targetIndex += 1;
        }

        // Insert the dragged layer at the new position
        remainingLayers.splice(targetIndex, 0, draggedLayer);
        
        commit(remainingLayers, 'Reorder Layer', draggedId);
    };

    const handleSaveProject = () => {
        if (docSettings) saveProject(docSettings, history[historyIndex]?.layers);
    };
    const handleOpenProject = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { documentSettings, layers } = await loadProject(file);
                setDocSettings(documentSettings);
                commit(layers, 'Open Project', layers[layers.length - 1].id);
            } catch (error) {
                alert(error instanceof Error ? error.message : 'An unknown error occurred.');
            }
        }
    };
    
    const handleExport = (format: ExportFormat, quality?: number) => {
        if (!docSettings) return;
        // Export logic from old Editor.tsx
    };

    const handleResetView = () => {
        setZoomValue(1);
        setPan({x:0, y:0});
        setViewResetKey(k => k + 1);
    };
    
    const handleConfirmConvertToLayer = () => {
        convertBackgroundToLayer();
        setIsBgConvertModalOpen(false);
    };

    const handleImageAdded = async (url: string) => { /* ... */ };

    useEffect(() => {
        const init = async () => {
            if (!docSettings) return;
            let initialImageData: ImageData | null = null;
            if (docSettings.background !== 'Transparent') {
                const canvas = document.createElement('canvas');
                canvas.width = docSettings.width;
                canvas.height = docSettings.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = docSettings.background === 'Custom' ? docSettings.customBgColor : docSettings.background.toLowerCase();
                    ctx.fillRect(0, 0, docSettings.width, docSettings.height);
                    initialImageData = ctx.getImageData(0, 0, docSettings.width, docSettings.height);
                }
            }

            const backgroundLayer: Layer = {
                id: crypto.randomUUID(), name: 'Background', type: 'pixel', isVisible: true, isLocked: true, isBackground: true,
                opacity: 1, blendMode: 'normal', imageData: initialImageData, thumbnail: generateThumbnail(initialImageData, 48, 40),
                x: docSettings.width / 2, y: docSettings.height / 2, width: docSettings.width, height: docSettings.height,
                rotation: 0, scaleX: 1, scaleY: 1,
            };
            
            let initialLayers = [backgroundLayer];
            let initialActiveId = backgroundLayer.id;

            if (initialFile) {
                const base64 = await fileToBase64(initialFile);
                const imageData = await base64ToImageData(base64, docSettings.width, docSettings.height);
                const imageLayer: Layer = {
                    id: crypto.randomUUID(), name: initialFile.name, type: 'pixel', isVisible: true, isLocked: false,
                    imageData: imageData, opacity: 1, blendMode: 'normal', thumbnail: generateThumbnail(imageData, 48, 40),
                    x: docSettings.width / 2, y: docSettings.height / 2, width: docSettings.width, height: docSettings.height,
                    rotation: 0, scaleX: 1, scaleY: 1,
                };
                initialLayers.push(imageLayer);
                initialActiveId = imageLayer.id;
            }

            commit(initialLayers, 'New Document', initialActiveId);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const value: EditorState = {
        docSettings, setDocSettings,
        layers: currentLayers, activeLayerId, activeLayer,
        layerActions: {
            commit, setActiveLayerId, updateLayerProps, updateLayerPropsPreview, addLayer, addShapeLayer,
            deleteLayer, duplicateLayer, mergeDown, convertBackgroundToLayer, reorderLayer
        },
        history: { undo, redo, canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1, states: history, currentIndex: historyIndex },
        toolState: {
            activeTool, setActiveTool, activeSubTool, setActiveSubTool,
            foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
            brushSettings, setBrushSettings
        },
        zoom: {
            value: zoom,
            set: (update) => {
                if (typeof update === 'number') setZoomValue(update);
                // Future: implement 'in'/'out'
            }
        },
        pan: { value: pan, set: setPan },
        interaction: {
            transformSession, setTransformSession, moveSession, setMoveSession,
            snapLines, setSnapLines, selection, setSelection
        },
        modals: {
            isBgConvertModalOpen, setIsBgConvertModalOpen,
            isExportModalOpen, setIsExportModalOpen,
        },
        panels: {
            isPropertiesPanelOpen, setIsPropertiesPanelOpen,
            isLayersPanelOpen, setIsLayersPanelOpen,
        },
        editorActions: {
            handleSaveProject, handleOpenProject, handleExport,
            handleResetView, handleConfirmConvertToLayer, handleImageAdded
        },
        fileInputRef,
        handleFileChange,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = (): EditorState => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
