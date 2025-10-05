
export enum Tool {
  HOME = 'HOME',
  FILES = 'FILES',
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  DRAW_TO_IMAGE = 'DRAW_TO_IMAGE',
  GENERATIVE_FILL = 'GENERATIVE_FILL',
  REMOVE_BACKGROUND = 'REMOVE_BACKGROUND',
}

/**
 * Defines the set of tools available within the main editor, redesigned for a modern workflow.
 */
export enum EditorTool {
  TRANSFORM = 'TRANSFORM',
  GENERATIVE = 'GENERATIVE',
  ADJUST = 'ADJUST',
  SELECT = 'SELECT',
  RETOUCH = 'RETOUCH',
  QUICK_ACTIONS = 'QUICK_ACTIONS',
  EFFECTS = 'EFFECTS',
  PAINT = 'PAINT',
  SHAPES = 'SHAPES',
  TYPE = 'TYPE',
  ADD_IMAGE = 'ADD_IMAGE',
}

export type TransformSubTool = 'move' | 'transform' | 'crop';
export type GenerativeSubTool = 'fill' | 'expand' | 'textToImage';
export type AdjustSubTool = 'brightnessContrast' | 'levels' | 'curves' | 'exposure';
export type SelectSubTool = 'rectangle' | 'ellipse' | 'lasso' | 'subject';
export type RetouchSubTool = 'spotHeal' | 'cloneStamp' | 'patch';
export type QuickActionsSubTool = 'removeBackground' | 'enhance';
export type EffectsSubTool = 'blur' | 'sharpen' | 'noise';
export type PaintSubTool = 'brush' | 'eraser';
export type ShapesSubTool = 'rectangle' | 'ellipse' | 'polygon' | 'line';
export type TypeSubTool = 'horizontal' | 'vertical';

export type AnySubTool = TransformSubTool | GenerativeSubTool | AdjustSubTool | SelectSubTool | RetouchSubTool | QuickActionsSubTool | EffectsSubTool | PaintSubTool | ShapesSubTool | TypeSubTool;


export type AutoSelectType = 'Layer' | 'Group';
export type TransformMode = 'free-transform' | 'skew' | 'distort' | 'perspective';

/**
 * Defines the possible text alignment options for the Text tool.
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Defines the possible shapes for the brush tip.
 */
export type BrushShape = 'round' | 'square';
