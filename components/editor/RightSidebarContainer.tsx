import React, { useState } from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { HistoryState, Layer } from '../../types/index';
import LayersPanel from './LayersPanel';
import HistoryPanel from './HistoryPanel';
import CommentsPanel from './CommentsPanel';
import Icon from '../ui/Icon';
import { useEditor } from './core/EditorProvider';

interface PanelState {
  isLayersOpen: boolean;
  isHistoryOpen: boolean;
  isCommentsOpen: boolean;
}

// Fix: Refactored RightSidebarContainer to use the useEditor hook instead of receiving numerous props.
// This simplifies the component and decouples it from its parent.
const RightSidebarContainer: React.FC = () => {
  const {
      layers,
      activeLayerId,
      layerActions,
      history,
  } = useEditor();

  const [panelState, setPanelState] = useState<PanelState>({ isLayersOpen: true, isHistoryOpen: false, isCommentsOpen: false });
  const [layersPanelHeight, setLayersPanelHeight] = useState(400);
  const [historyPanelHeight, setHistoryPanelHeight] = useState(300);
  const [commentsPanelHeight, setCommentsPanelHeight] = useState(300);

  const togglePanel = (panel: keyof PanelState) => {
    setPanelState(prev => ({...prev, [panel]: !prev[panel]}));
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full overflow-y-auto">
        {panelState.isLayersOpen && (
          <LayersPanel
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={layerActions.setActiveLayerId}
            onAddLayer={layerActions.addLayer}
            onDeleteLayer={layerActions.deleteLayer}
            onUpdateLayerProps={layerActions.updateLayerProps}
            onUpdateLayerPropsPreview={layerActions.updateLayerPropsPreview}
            onDuplicateLayer={layerActions.duplicateLayer}
            onMergeDown={layerActions.mergeDown}
            onConvertBackground={layerActions.convertBackgroundToLayer}
            onReorderLayer={layerActions.reorderLayer}
            onClose={() => togglePanel('isLayersOpen')}
            height={layersPanelHeight}
            onHeightChange={setLayersPanelHeight}
          />
        )}
        {panelState.isHistoryOpen && (
            <HistoryPanel 
                history={history.states}
                currentIndex={history.currentIndex}
                onJumpToState={history.undo} // Simplified for now, should be a specific jump
                onClose={() => togglePanel('isHistoryOpen')}
                height={historyPanelHeight}
                onHeightChange={setHistoryPanelHeight}
            />
        )}
        {panelState.isCommentsOpen && (
            <CommentsPanel 
              onClose={() => togglePanel('isCommentsOpen')}
              height={commentsPanelHeight}
              onHeightChange={setCommentsPanelHeight}
            />
        )}
      </div>
      <div className="w-12 bg-[#1E1E1E] border-l border-black/20 p-2 flex flex-col items-center space-y-2">
        <PanelToggleButton label="Layers" icon={<Icon type="layers" />} isActive={panelState.isLayersOpen} onClick={() => togglePanel('isLayersOpen')} />
        <PanelToggleButton label="History" icon={<Icon type="history" />} isActive={panelState.isHistoryOpen} onClick={() => togglePanel('isHistoryOpen')} />
        <PanelToggleButton label="Comments" icon={<Icon type="comment" />} isActive={panelState.isCommentsOpen} onClick={() => togglePanel('isCommentsOpen')} />
      </div>
    </div>
  );
};

const PanelToggleButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        title={label}
        className={`p-3 rounded-md transition-colors ${isActive ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400'}`}
    >
        {icon}
    </button>
);

export default RightSidebarContainer;
