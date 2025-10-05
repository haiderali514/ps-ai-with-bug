import React, { useState } from 'react';
import Home from '../features/home/components/Home';
import Editor from '../features/editor/components/Editor';
// Fix: Corrected import path for types from the root directory.
import { DocumentSettings, RecentProject } from '../types/document';
import { addRecentProject } from '../utils/recentProjects';
import ErrorBoundary from '../components/ErrorBoundary';

const App: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings | null>(null);
  const [initialFile, setInitialFile] = useState<File | null>(null);

  const handleCreateDocument = (settings: DocumentSettings, file?: File) => {
    const newProject = addRecentProject({
        ...settings,
        background: settings.background,
        customBgColor: settings.customBgColor,
    });
    setDocumentSettings(newProject);
    setInitialFile(file ?? null);
    setIsEditorOpen(true);
  };
  
  const handleOpenRecentProject = (project: RecentProject) => {
    setDocumentSettings(project);
    setInitialFile(null); // Recent projects don't have an initial file to load
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setDocumentSettings(null);
    setInitialFile(null);
  };

  const handleOpenNewDocument = () => {
    setIsEditorOpen(false);
    setDocumentSettings(null);
    setInitialFile(null);
    // The Home component will now manage the create modal state.
  };

  return (
    <ErrorBoundary>
      {isEditorOpen && documentSettings ? (
        <Editor document={documentSettings} onClose={handleCloseEditor} onNew={handleOpenNewDocument} initialFile={initialFile} />
      ) : (
        <Home 
          onCreateDocument={handleCreateDocument} 
          onOpenRecentProject={handleOpenRecentProject} 
        />
      )}
    </ErrorBoundary>
  );
};

export default App;