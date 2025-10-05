
import React from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { EditorTool } from '../../../types/index';
import MoveContextualBar from './MoveContextualBar';
import TransformContextualBar from './TransformContextualBar';
import CropContextualBar from './CropContextualBar';
import { useEditor } from '../core/EditorProvider';

// Fix: Refactored ContextualTaskbar to use the useEditor hook instead of props.
// It now gets all necessary state from the context.
const ContextualTaskbar: React.FC = () => {
    const { 
      toolState, 
      interaction,
      // Placeholder actions, would be connected in EditorProvider
      editorActions
    } = useEditor();

    const renderContent = () => {
        if (interaction.transformSession) {
            return <TransformContextualBar 
                        onConfirm={() => {}} 
                        onCancel={() => {}}
                        onRotateCW={() => {}}
                        onRotateCCW={() => {}}
                        onFlipHorizontal={() => {}}
                        onFlipVertical={() => {}}
                    />;
        }

        if (toolState.activeTool === EditorTool.TRANSFORM) {
            switch (toolState.activeSubTool) {
                case 'move':
                    return <MoveContextualBar />;
                case 'crop':
                    return <CropContextualBar onConfirm={() => {}} onCancel={() => {}} />;
                default:
                    return null;
            }
        }
        return null;
    };

    const content = renderContent();
    const isVisible = !!content; // Simplified visibility logic

    if (!isVisible) {
        return null;
    }

    return (
        <div 
            className="absolute bottom-4 left-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20 transition-opacity"
            style={{ 
                transform: 'translateX(-50%)',
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            {content}
        </div>
    );
};

export default ContextualTaskbar;
