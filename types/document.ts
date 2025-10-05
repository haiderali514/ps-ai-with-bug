/**
 * Defines the type for image export formats.
 */
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

/**
 * Defines the properties for a new document created by the user.
 */
export interface DocumentSettings {
  name: string;
  width: number;
  height: number;
  units: string;
  resolution: number;
  resolutionUnit: string;
  background: string;
  customBgColor: string;
}


/**
 * Represents a saved project with metadata for the recent files list.
 */
export interface RecentProject extends DocumentSettings {
  id: string;
  lastModified: number;
  thumbnail?: string;
}