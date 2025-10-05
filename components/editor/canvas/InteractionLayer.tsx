
import React, { useRef, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
// Fix: Updated import path to point to the types directory's index file.
import { EditorTool, PaintSubTool, BrushShape } from '../../../types/index';

export interface InteractionCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getCanvasDataURL: () => string;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface InteractionLayerProps {
  width: number;
  height: number;
  activeTool: EditorTool;
  activeSubTool: PaintSubTool;
  brushSettings: {
    color: string;
    size: number;
    opacity: number;
    hardness: number;
    shape: BrushShape;
  };
  isDrawingEnabled: boolean;
  onDrawEnd?: (imageData: ImageData) => void;
  backgroundColor?: string;
}

const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};

const InteractionLayer = forwardRef<InteractionCanvasHandle, InteractionLayerProps>((props, ref) => {
    const { width, height, activeTool, activeSubTool, brushSettings, isDrawingEnabled, onDrawEnd, backgroundColor } = props;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const getCtx = () => canvasRef.current?.getContext('2d', { willReadFrequently: true });
    
    useEffect(() => {
        const ctx = getCtx();
        if (ctx && backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
            setHistory([ctx.getImageData(0, 0, width, height)]);
            setHistoryIndex(0);
        } else if (!backgroundColor) {
             setHistory([]);
             setHistoryIndex(-1);
        }
    }, [width, height, backgroundColor]);

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        getCanvasDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
        clear: () => {
            const ctx = getCtx();
            if (ctx) {
                ctx.clearRect(0, 0, width, height);
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, width, height);
                }
                const blankState = ctx.getImageData(0, 0, width, height);
                setHistory([blankState]);
                setHistoryIndex(0);
            }
        },
        undo: () => {
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                const ctx = getCtx();
                if (ctx) ctx.putImageData(history[newIndex], 0, 0);
            }
        },
        redo: () => {
            if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                const ctx = getCtx();
                if (ctx) ctx.putImageData(history[newIndex], 0, 0);
            }
        },
        canUndo: () => historyIndex > 0,
        canRedo: () => historyIndex < history.length - 1,
    }));

    const stamp = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        const { color, size, opacity, hardness, shape } = brushSettings;
        const radgrad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
        const { r, g, b } = hexToRgb(color);
        const colorWithOpacity = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        const transparentColor = `rgba(${r}, ${g}, ${b}, 0)`;

        radgrad.addColorStop(0, colorWithOpacity);
        radgrad.addColorStop(Math.max(0, hardness), colorWithOpacity);
        radgrad.addColorStop(1, transparentColor);

        ctx.fillStyle = radgrad;
      
        if (shape === 'square') {
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingEnabled || e.button !== 0) return;
        const ctx = getCtx();
        if (!ctx) return;
        
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setIsDrawing(true);
        lastPos.current = { x, y };

        ctx.globalCompositeOperation = activeSubTool === 'eraser' ? 'destination-out' : 'source-over';
        stamp(ctx, x, y);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getCtx();
        if (!ctx || !lastPos.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
        const angle = Math.atan2(y - lastPos.current.y, x - lastPos.current.x);
        for (let i = 0; i < dist; i += Math.max(1, brushSettings.size / 20)) {
            const currentX = lastPos.current.x + Math.cos(angle) * i;
            const currentY = lastPos.current.y + Math.sin(angle) * i;
            stamp(ctx, currentX, currentY);
        }
        stamp(ctx, x, y);
        lastPos.current = { x, y };
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPos.current = null;
        const ctx = getCtx();
        if (ctx) {
            const newImageData = ctx.getImageData(0, 0, width, height);
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newImageData);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            if (onDrawEnd) onDrawEnd(newImageData);
        }
    };
    
    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
});

export default InteractionLayer;
