
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface ShapeProps {
  type: 'rectangle';
  fill: string;
  stroke: string | null;
  strokeWidth: number;
}


/**
 * Represents a single layer in the editor.
 * The transformation properties (x, y, rotation, scale) are applied
 * around the layer's center point.
 */
export interface Layer {
  id: string;
  name: string;
  type: 'pixel' | 'shape';
  isVisible: boolean;
  isLocked: boolean;
  isBackground?: boolean; 
  opacity: number; // 0-1
  blendMode: BlendMode;
  thumbnail?: string;
  imageData: ImageData | null;
  
  // Transformation properties
  x: number; // Center X coordinate relative to the document
  y: number; // Center Y coordinate relative to the document
  width: number; // The intrinsic width of the imageData or shape
  height: number; // The intrinsic height of the imageData or shape
  rotation: number; // In degrees
  scaleX: number; // Multiplier
  scaleY: number; // Multiplier

  // Shape specific properties
  shapeProps?: ShapeProps;
}
