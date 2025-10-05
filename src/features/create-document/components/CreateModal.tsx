
import React, { useState, useCallback, useEffect } from 'react';
// Fix: Corrected import path for types from the root directory.
import { DocumentSettings } from '../../../types/document';
import { Tool } from '../../../types/tools';
import Icon from '../../../components/ui/Icon';
import { defaultPreset, getCustomPresets, saveCustomPreset, deleteCustomPreset, renameCustomPreset } from '../../../utils/presets';
import CreateModalNav, { ModalView } from './CreateModalNav';
import QuickStartContent from './QuickStartContent';
import BlankDocumentContent from './BlankDocumentContent';
import CustomDocumentContent from './CustomDocumentContent';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: DocumentSettings, file?: File) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [activeView, setActiveView] = useState<ModalView>('quickStart');
  
  // State for the custom document form
  const [docSettings, setDocSettings] = useState<DocumentSettings>({
    name: 'Untitled-1',
    width: defaultPreset.w,
    height: defaultPreset.h,
    units: defaultPreset.units ?? 'Pixels',
    resolution: defaultPreset.res ?? 72,
    resolutionUnit: 'ppi',
    background: defaultPreset.bg ?? 'White',
    customBgColor: '#FFFFFF',
  });
  
  // State for presets
  const [customPresets, setCustomPresets] = useState(getCustomPresets());

  useEffect(() => {
    if (isOpen) {
      setCustomPresets(getCustomPresets());
      setActiveView('quickStart');
    }
  }, [isOpen]);

  const handleSavePreset = (presetName: string): boolean => {
    const { success, presets } = saveCustomPreset({
      name: presetName,
      w: docSettings.width,
      h: docSettings.height,
      res: docSettings.resolution,
      units: docSettings.units,
      bg: docSettings.background,
      bgColor: docSettings.customBgColor
    });
    setCustomPresets(presets);
    return success;
  };

  const handleDeletePreset = (presetName: string) => {
      const updatedPresets = deleteCustomPreset(presetName);
      setCustomPresets(updatedPresets);
  };
  
  const handleRenamePreset = (oldName: string, newName: string): boolean => {
    const { success, presets } = renameCustomPreset(oldName, newName);
    setCustomPresets(presets);
    return success;
  };

  const handleToolSelect = useCallback((tool: Tool) => {
    console.log("Selected tool:", tool);
    onClose();
  }, [onClose]);

  const handleImageUpload = useCallback(async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const settings: DocumentSettings = {
        name: file.name.split('.').slice(0, -1).join('.') || 'Untitled',
        width: img.width,
        height: img.height,
        units: 'Pixels',
        resolution: 72,
        resolutionUnit: 'ppi',
        background: 'Transparent',
        customBgColor: '#FFFFFF',
      };
      onCreate(settings, file);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
        alert("Could not load image file.");
        URL.revokeObjectURL(url);
    }
    img.src = url;
  }, [onCreate]);
  
  const handleCreateCustom = () => {
    onCreate(docSettings);
  };
  
  const handleSetPreset = (preset: any) => {
    setDocSettings({
        name: preset.name,
        width: preset.w,
        height: preset.h,
        resolution: preset.res ?? 72,
        resolutionUnit: 'ppi',
        units: preset.units ?? 'Pixels',
        background: preset.bg ?? 'White',
        customBgColor: preset.bgColor ?? '#FFFFFF',
    });
    setActiveView('customDoc');
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeView) {
      case 'quickStart':
        return <QuickStartContent onUpload={handleImageUpload} onToolSelect={handleToolSelect} />;
      case 'blankDoc':
        return <BlankDocumentContent 
                    onPresetSelect={handleSetPreset} 
                    customPresets={customPresets} 
                    onDeletePreset={handleDeletePreset}
                    onRenamePreset={handleRenamePreset}
                />;
      case 'customDoc':
        return (
          <CustomDocumentContent
            settings={docSettings}
            setSettings={setDocSettings}
            onCreate={handleCreateCustom}
            onSavePreset={handleSavePreset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-[#2D2D2D] w-full max-w-5xl h-[80vh] max-h-[700px] rounded-xl shadow-2xl flex overflow-hidden" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10" title="Close" aria-label="Close">
          <Icon type="close" />
        </button>
        
        <CreateModalNav activeView={activeView} setActiveView={setActiveView} />

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CreateModal;