
import { DocumentSettings, Layer } from './';

/**
 * A version of the Layer type where image data is serialized to a base64 string.
 */
export interface SerializedLayer extends Omit<Layer, 'imageData' | 'thumbnail'> {
  imageData: string | null; // base64 string
}

/**
 * The structure of the saved project file.
 */
export interface ProjectFile {
  documentSettings: DocumentSettings;
  layers: SerializedLayer[];
}
