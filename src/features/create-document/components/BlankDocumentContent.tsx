
import React, { useState } from 'react';
import { CustomPreset, Preset, mostUsedPresets, photoPresets, socialMediaPresets, filmAndVideoPresets, printPresets } from '../../../utils/presets';
import Icon from '../../../components/ui/Icon';
import Input from '../../../components/ui/Input';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
            isActive ? 'bg-gray-700/50 text-white' : 'text-gray-400 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const PresetGrid: React.FC<{
    presets: Preset[];
    onPresetSelect: (preset: any) => void;
}> = ({ presets, onPresetSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {presets.map(p => (
            <button key={p.name} onClick={() => onPresetSelect(p)} className="aspect-[4/3] bg-gray-800/50 border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                <p className="font-semibold text-gray-200 w-full truncate">{p.name}</p>
                <p className="text-sm text-gray-400">{p.w} x {p.h} px</p>
            </button>
        ))}
    </div>
);

const BlankDocumentContent: React.FC<{
  onPresetSelect: (preset: any) => void;
  customPresets: CustomPreset[];
  onDeletePreset: (name: string) => void;
  onRenamePreset: (oldName: string, newName: string) => boolean;
}> = ({ onPresetSelect, customPresets, onDeletePreset, onRenamePreset }) => {
    type PresetTab = 'most used' | 'saved' | 'photo' | 'social media' | 'film & video' | 'print';
    const [activeTab, setActiveTab] = useState<PresetTab>('most used');
    const [deletingPresetName, setDeletingPresetName] = useState<string | null>(null);
    const [renamingPresetName, setRenamingPresetName] = useState<string | null>(null);
    const [editedPresetName, setEditedPresetName] = useState('');

    const handleDeleteConfirm = (name: string) => {
        onDeletePreset(name);
        setDeletingPresetName(null);
    };
    
    const handleRenameStart = (preset: CustomPreset) => {
        setRenamingPresetName(preset.name);
        setEditedPresetName(preset.name);
        setDeletingPresetName(null); 
    };

    const handleRenameCancel = () => {
        setRenamingPresetName(null);
        setEditedPresetName('');
    };

    const handleRenameConfirm = () => {
        if (renamingPresetName) {
            const success = onRenamePreset(renamingPresetName, editedPresetName);
            if (success) {
                handleRenameCancel();
            }
        }
    };

    const tabConfig: {label: string, id: PresetTab}[] = [
      { label: 'Most Used', id: 'most used' },
      { label: 'Saved', id: 'saved' },
      { label: 'Photo', id: 'photo' },
      { label: 'Print', id: 'print' },
      { label: 'Social Media', id: 'social media' },
      { label: 'Film & Video', id: 'film & video' },
    ];
    
    const presetData: Record<string, Preset[]> = {
        'most used': mostUsedPresets,
        'photo': photoPresets,
        'print': printPresets,
        'social media': socialMediaPresets,
        'film & video': filmAndVideoPresets,
    };

    return (
        <div>
            <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100 mb-4">Create a blank document</h2>
            <div className="flex border-b border-gray-700 mb-6">
                {tabConfig.map(tab => (
                    <TabButton 
                        key={tab.id} 
                        label={tab.label} 
                        isActive={activeTab === tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                    />
                ))}
            </div>

            {activeTab !== 'saved' && presetData[activeTab] && (
                <PresetGrid presets={presetData[activeTab]} onPresetSelect={onPresetSelect} />
            )}

            {activeTab === 'saved' && (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {customPresets.length === 0 ? (
                        <div className="text-gray-500 col-span-full text-center py-10">
                          <Icon type="save" className="mx-auto w-12 h-12 text-gray-600 mb-2" />
                          <p className="font-semibold">You have no saved presets.</p>
                          <p className="text-sm">Create a custom document to save a new preset.</p>
                        </div>
                    ) : (
                        customPresets.map(p => (
                             <div key={p.name} className="group relative aspect-[4/3] bg-gray-800/50 rounded-lg">
                                {renamingPresetName === p.name ? (
                                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 space-y-3 transition-opacity">
                                        <h4 className="font-semibold text-white text-center">Rename Preset</h4>
                                        <Input 
                                            type="text" 
                                            value={editedPresetName} 
                                            onChange={(e) => setEditedPresetName(e.target.value)} 
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameConfirm();
                                                if (e.key === 'Escape') handleRenameCancel();
                                            }}
                                        />
                                        <div className="flex space-x-2">
                                            <button onClick={handleRenameCancel} className="px-3 py-1 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded font-medium">Cancel</button>
                                            <button onClick={handleRenameConfirm} className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded font-medium">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                <>
                                    <button onClick={() => onPresetSelect(p)} className="w-full h-full border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                                        <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                                        <p className="font-semibold text-gray-200 truncate w-full">{p.name}</p>
                                        <p className="text-sm text-gray-400">{p.w} x {p.h} {p.units}</p>
                                    </button>
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRenameStart(p); }} 
                                            className="p-1.5 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-blue-500/50 disabled:opacity-50"
                                            aria-label={`Rename preset ${p.name}`}
                                            title={`Rename preset ${p.name}`}
                                            disabled={!!deletingPresetName || !!renamingPresetName}
                                        >
                                            <Icon type="edit" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDeletingPresetName(p.name); }} 
                                            className="p-1.5 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 disabled:opacity-50"
                                            aria-label={`Delete preset ${p.name}`}
                                            title={`Delete preset ${p.name}`}
                                            disabled={!!deletingPresetName || !!renamingPresetName}
                                        >
                                            <Icon type="trash" />
                                        </button>
                                    </div>
                                    {deletingPresetName === p.name && (
                                        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 space-y-3 transition-opacity">
                                            <p className="font-semibold text-white text-center">Delete preset?</p>
                                            <div className="flex space-x-2">
                                                <button onClick={() => setDeletingPresetName(null)} className="px-3 py-1 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded font-medium">Cancel</button>
                                                <button onClick={() => handleDeleteConfirm(p.name)} className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-500 rounded font-medium">Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
};

export default BlankDocumentContent;
