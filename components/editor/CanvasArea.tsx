import React, { useState, useRef, useEffect } from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { EditorTool } from '../../types/index';
import DisplayCanvas from './canvas/DisplayCanvas';
import InteractionLayer, { InteractionCanvasHandle } from './canvas/InteractionLayer';
import OverlaysLayer from './canvas/OverlaysLayer';
import TransformControls from './TransformControls';
import { useEditor } from './core/EditorProvider';
// Fix: Import generateThumbnail to resolve undefined function call.
import { generateThumbnail } from '../../utils/imageUtils';

const MIN_ZOOM = 0.01; // 1%
const MAX_ZOOM = 5; // 500%

// Fix: Refactored CanvasArea to be a self-contained component using the useEditor hook.
// It no longer accepts props and manages its own interaction logic based on context state.
const CanvasArea: React.FC = () => {
  const { 
    docSettings, 
    zoom, 
    pan, 
    editorActions, 
    toolState, 
    modals, 
    activeLayer,
    layerActions,
    interaction
  } = useEditor();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const interactionCanvasRef = useRef<InteractionCanvasHandle>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container && docSettings) {
        const { clientWidth, clientHeight } = container;
        const initialPanX = (clientWidth - docSettings.width * zoom.value) / 2;
        const initialPanY = (clientHeight - docSettings.height * zoom.value) / 2;
        pan.set({ x: initialPanX, y: initialPanY });
    }
  }, [docSettings?.width, docSettings?.height]); // Run only when document dimensions change

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    if (e.altKey) {
      // ALT + Scroll = Zoom
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const pointX = (mouseX - pan.value.x) / zoom.value;
      const pointY = (mouseY - pan.value.y) / zoom.value;
      
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 ? zoom.value * zoomFactor : zoom.value / zoomFactor;
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
      
      if (clampedZoom === zoom.value) return;

      const newPanX = mouseX - pointX * clampedZoom;
      const newPanY = mouseY - pointY * clampedZoom;

      pan.set({ x: newPanX, y: newPanY });
      zoom.set(clampedZoom);
    } else {
      // Scroll = Pan
      let dx = e.deltaX;
      let dy = e.deltaY;

      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }

      pan.set({
        x: pan.value.x - dx,
        y: pan.value.y - dy
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacebarDown) {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
        return;
    }
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) { 
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      e.preventDefault();
      pan.set({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning.current) {
        isPanning.current = false;
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' && !e.repeat && !isSpacebarDown) {
        e.preventDefault();
        setIsSpacebarDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsSpacebarDown(false);
        isPanning.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacebarDown]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isSpacebarDown) {
      container.style.cursor = isPanning.current ? 'grabbing' : 'grab';
    } else {
      container.style.cursor = 'default';
    }
  }, [isSpacebarDown, isPanning.current]);

  if (!docSettings) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-900 overflow-hidden relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute"
        style={{
          width: `${docSettings.width}px`,
          height: `${docSettings.height}px`,
          transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
          transformOrigin: '0 0',
          background: docSettings.background === 'Transparent' 
              ? `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)`
              : 'transparent',
          backgroundSize: '20px 20px',
        }}
      >
        <DisplayCanvas />
        <InteractionLayer
            ref={interactionCanvasRef}
            width={docSettings.width}
            height={docSettings.height}
            activeTool={toolState.activeTool}
            activeSubTool={toolState.activeSubTool as any}
            brushSettings={{ 
                color: toolState.foregroundColor, 
                ...toolState.brushSettings 
            }}
            isDrawingEnabled={toolState.activeTool === EditorTool.PAINT}
            onDrawEnd={(imageData) => {
                if(activeLayer) {
                    layerActions.updateLayerProps(activeLayer.id, { imageData, thumbnail: generateThumbnail(imageData, 48, 40) }, 'Paint Brush');
                }
            }}
        />
        <OverlaysLayer />
        {activeLayer && !activeLayer.isBackground && (toolState.activeSubTool === 'transform' || interaction.transformSession) && (
           <TransformControls 
                layer={interaction.transformSession ? interaction.transformSession.layer : activeLayer}
                zoom={zoom.value}
                pan={pan.value}
                onTransformStart={() => {}} // This logic is now handled in EditorProvider
            />
        )}
      </div>
    </div>
  );
};

export default CanvasArea;