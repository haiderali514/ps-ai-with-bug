
import React, { useMemo } from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { DocumentSettings, Layer } from '../../types/index';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import ConfirmModal from '../modals/ConfirmModal';
import ExportModal from '../modals/ExportModal';
import { useEditor } from './core/EditorProvider';
import RightSidebarContainer from './RightSidebarContainer';
import LeftSidebar from './LeftSidebar';
import ContextualTaskbar from './contextualBars/ContextualTaskbar';
import { EditorProvider } from './core/EditorProvider';

interface EditorShellProps {
  onClose: () => void;
  onNew: () => void;
}

// Fix: Refactored EditorShell to use the useEditor hook and correctly pass props to its children.
const EditorShell: React.FC<EditorShellProps> = ({ onClose, onNew }) => {
    const {
        docSettings,
        fileInputRef, handleFileChange,
        editorActions,
        history,
        zoom,
        modals,
        panels,
        toolState,
        activeLayer,
        layerActions
    } = useEditor();

    const transformProps = useMemo(() => activeLayer && !activeLayer.isBackground ? {
        layer: activeLayer,
        onPropChange: (prop: keyof Layer, value: any) => layerActions.updateLayerPropsPreview(activeLayer.id, { [prop]: value }),
        onCommit: (prop: keyof Layer, value: any) => layerActions.updateLayerProps(activeLayer.id, { [prop]: value }, 'Transform Layer'),
    } : undefined, [activeLayer, layerActions]);

    const onSwapColors = () => {
        const fg = toolState.foregroundColor;
        toolState.setForegroundColor(toolState.backgroundColor);
        toolState.setBackgroundColor(fg);
    };

    const onResetColors = () => {
        toolState.setForegroundColor('#000000');
        toolState.setBackgroundColor('#ffffff');
    };

    if (!docSettings) return null; // Or a loading state

    return (
        <div className="w-screen h-screen bg-[#181818] flex flex-col font-sans overflow-hidden">
            <input ref={fileInputRef} type="file" accept=".aips" onChange={handleFileChange} className="hidden" />
            <EditorHeader 
                documentName={docSettings.name} 
                onClose={onClose}
                onNew={onNew}
                onSaveAs={() => modals.setIsExportModalOpen(true)}
                onSaveProject={editorActions.handleSaveProject}
                onOpenProject={editorActions.handleOpenProject}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onUndo={history.undo}
                onRedo={history.redo}
                zoom={zoom.value}
                onZoomChange={zoom.set}
                onResetView={editorActions.handleResetView}
            />
            <main className="flex-1 flex overflow-hidden">
                <LeftSidebar 
                  activeTool={toolState.activeTool}
                  onToolSelect={toolState.setActiveTool}
                  foregroundColor={toolState.foregroundColor}
                  backgroundColor={toolState.backgroundColor}
                  onSetForegroundColor={toolState.setForegroundColor}
                  onSetBackgroundColor={toolState.setBackgroundColor}
                  onSwapColors={onSwapColors}
                  onResetColors={onResetColors}
                  isPropertiesPanelOpen={panels.isPropertiesPanelOpen}
                  togglePropertiesPanel={() => panels.setIsPropertiesPanelOpen(p => !p)}
                  activeSubTool={toolState.activeSubTool}
                  onSubToolChange={toolState.setActiveSubTool}
                  transformProps={transformProps}
                  onImageAdded={editorActions.handleImageAdded}
                  brushSettings={toolState.brushSettings}
                  onBrushSettingsChange={toolState.setBrushSettings}
                />
                <CanvasArea />
                <RightSidebarContainer />
                <ContextualTaskbar />
            </main>
            <ConfirmModal
                isOpen={modals.isBgConvertModalOpen}
                onClose={() => modals.setIsBgConvertModalOpen(false)}
                onConfirm={editorActions.handleConfirmConvertToLayer}
                title="Convert Background"
                confirmText="Convert"
            >
              <p>The Background layer cannot be moved or have its blending options changed. Do you want to convert it to a normal layer?</p>
            </ConfirmModal>
            <ExportModal 
                isOpen={modals.isExportModalOpen}
                onClose={() => modals.setIsExportModalOpen(false)}
                onExport={editorActions.handleExport}
                documentName={docSettings.name}
            />
        </div>
    );
};


interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
  onNew: () => void;
  initialFile?: File | null;
}

const Editor: React.FC<EditorProps> = ({ document, onClose, onNew, initialFile }) => (
    <EditorProvider
        initialDocumentSettings={document}
        initialFile={initialFile}
    >
        <EditorShell onClose={onClose} onNew={onNew} />
    </EditorProvider>
);

export default Editor;
