
import { Layer, AnySubTool, TransformMode } from './';

export interface TransformSession {
    layer: Layer;
    handle: string; // e.g., 'bottom-right', 'rotate'
    isAspectRatioLocked: boolean;
    originalLayer: Layer;
    startMouse: { x: number; y: number }; // Screen-relative
    startCanvasMouse: { x: number; y: number }; // Canvas-relative
    startPan: { x: number; y: number };
    startZoom: number;
    mode: TransformMode;
    previousSubTool: AnySubTool | null;
    startCursor: string;
}

export interface SnapLine {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export interface MoveSession {
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    layerStartX: number;
    layerStartY: number;
    currentMouseX: number;
    currentMouseY: number;
}
