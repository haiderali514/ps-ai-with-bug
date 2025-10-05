
import { Layer } from './layers';

/**
 * Represents a single state in the editor's history.
 */
export interface HistoryState {
  layers: Layer[];
  action: string; // e.g., "Brush Stroke", "Add Layer"
}
