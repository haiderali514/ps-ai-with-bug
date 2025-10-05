
import React, { useState } from 'react';
import Home from './components/home/Home';
import Editor from './components/editor/Editor';
// Fix: Updated import path to point to the types directory's index file.
import { DocumentSettings, RecentProject } from './types/index';
import { addRecentProject } from './utils/recentProjects';

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

  if (isEditorOpen && documentSettings) {
    return <Editor document={documentSettings} onClose={handleCloseEditor} onNew={handleOpenNewDocument} initialFile={initialFile} />;
  }

  return (
    <Home 
      onCreateDocument={handleCreateDocument} 
      onOpenRecentProject={handleOpenRecentProject} 
    />
  );
};

export default App;
