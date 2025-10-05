
import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import TextToImagePanel from '../panels/TextToImagePanel';
import DrawToImagePanel from '../panels/DrawToImagePanel';
import GenerativeFillPanel from '../panels/GenerativeFillPanel';
import RemoveBackgroundPanel from '../panels/RemoveBackgroundPanel';
import HomePanel from '../panels/HomePanel';
import RecentFilesPanel from '../panels/RecentFilesPanel';
import CreateModal from '../../create-document/components/CreateModal';
// Fix: Corrected import path for types from the root directory.
import { DocumentSettings, RecentProject } from '../../../types/document';
import { Tool } from '../../../types/tools';

interface HomeProps {
    onCreateDocument: (settings: DocumentSettings, file?: File) => void;
    onOpenRecentProject: (project: RecentProject) => void;
}

const Home: React.FC<HomeProps> = ({ onCreateDocument, onOpenRecentProject }) => {
    const [activeTool, setActiveTool] = useState<Tool>(Tool.HOME);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreate = (settings: DocumentSettings, file?: File) => {
        setIsCreateModalOpen(false);
        onCreateDocument(settings, file);
    }
    
    const content = useMemo(() => {
        switch (activeTool) {
        case Tool.HOME:
            return <HomePanel setActiveTool={setActiveTool} onOpenProject={onOpenRecentProject} />;
        case Tool.FILES:
            return <RecentFilesPanel onOpenProject={onOpenRecentProject} />;
        case Tool.TEXT_TO_IMAGE:
            return <TextToImagePanel />;
        case Tool.DRAW_TO_IMAGE:
            return <DrawToImagePanel />;
        case Tool.GENERATIVE_FILL:
            return <GenerativeFillPanel />;
        case Tool.REMOVE_BACKGROUND:
            return <RemoveBackgroundPanel />;
        default:
            return <HomePanel setActiveTool={setActiveTool} onOpenProject={onOpenRecentProject} />;
        }
    }, [activeTool, onOpenRecentProject]);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            <Sidebar 
                activeTool={activeTool} 
                setActiveTool={setActiveTool} 
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                {content}
                </div>
            </main>
            <CreateModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreate}
            />
        </div>
    );
};

export default Home;