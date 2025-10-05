
import React, { useState, useRef, useEffect } from 'react';
import { DocumentSettings } from '../../../types/document';
import { defaultPreset, mostUsedPresets, photoPresets, socialMediaPresets, filmAndVideoPresets } from '../../../utils/presets';
import Icon from '../../../components/ui/Icon';
import ColorPicker from '../../../components/ui/ColorPicker';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CustomDocumentContent: React.FC<{
  settings: DocumentSettings,
  setSettings: React.Dispatch<React.SetStateAction<DocumentSettings>>,
  onCreate: () => void,
  onSavePreset: (name: string) => boolean
}> = ({ settings, setSettings, onCreate, onSavePreset }) => {
  const { name, width, height, units, resolution, background, customBgColor } = settings;
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
  const aspectRatioRef = useRef(width > 0 && height > 0 ? width / height : 1);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState(name);

  const updateSetting = (key: keyof DocumentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handlePresetChange = (presetName: string) => {
    const allPresets = [defaultPreset, ...mostUsedPresets, ...photoPresets, ...socialMediaPresets, ...filmAndVideoPresets];
    const selected = allPresets.find(p => p.name === presetName);
    if (selected) {
        setSettings({
            ...settings,
            name: selected.name,
            width: selected.w,
            height: selected.h,
            resolution: selected.res ?? 72,
            units: selected.units ?? 'Pixels',
            background: selected.bg ?? 'White',
            customBgColor: selected.bgColor ?? '#FFFFFF',
        });
    }
  };
  
  const allPresetsList = [defaultPreset, ...mostUsedPresets, ...photoPresets, ...socialMediaPresets, ...filmAndVideoPresets];
  const uniquePresets = allPresetsList.filter((p, i, a) => a.findIndex(t => t.name === p.name) === i);
  
  const presetOptions = uniquePresets.map(p => ({ value: p.name, label: p.name }));

  const unitOptions = ['Pixels', 'Inches', 'Centimeters', 'Millimeters', 'Points', 'Picas'].map(u => ({ value: u, label: u }));
  const resolutionUnitOptions = [{ value: 'ppi', label: 'Pixels/Inch' }, { value: 'ppcm', label: 'Pixels/cm' }];
  const backgroundOptions = ['White', 'Black', 'Transparent', 'Custom'].map(b => ({ value: b, label: b }));

  const handleInitiateSave = () => {
    setNewPresetName(name);
    setIsSavingPreset(true);
  };

  const handleConfirmSavePreset = () => {
    const success = onSavePreset(newPresetName);
    if (success) {
      setIsSavingPreset(false);
    }
  };

  const handleCancelSavePreset = () => {
    setIsSavingPreset(false);
  };

  const toggleLock = () => {
    if (!isAspectRatioLocked) {
        if (width > 0 && height > 0) {
            aspectRatioRef.current = width / height;
        }
    }
    setIsAspectRatioLocked(prev => !prev);
  };

  const handleWidthChange = (newWidthValue: string) => {
    const newWidth = parseInt(newWidthValue, 10) || 0;
    updateSetting('width', newWidth);
    if (isAspectRatioLocked && aspectRatioRef.current && newWidth > 0) {
      const newHeight = Math.round(newWidth / aspectRatioRef.current);
      if (newHeight > 0) {
        updateSetting('height', newHeight);
      }
    }
  };
  const handleHeightChange = (newHeightValue: string) => {
    const newHeight = parseInt(newHeightValue, 10) || 0;
    updateSetting('height', newHeight);
    if (isAspectRatioLocked && aspectRatioRef.current && newHeight > 0) {
      const newWidth = Math.round(newHeight * aspectRatioRef.current);
      if (newWidth > 0) {
        updateSetting('width', newWidth);
      }
    }
  };
  
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
      const currentOrientation = width >= height ? 'landscape' : 'portrait';
      if (newOrientation !== currentOrientation && width > 0 && height > 0) {
          const oldWidth = width;
          updateSetting('width', height);
          updateSetting('height', oldWidth);
          if (isAspectRatioLocked) {
            aspectRatioRef.current = height / oldWidth;
          }
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const orientation = width >= height ? 'landscape' : 'portrait';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 pr-4 overflow-y-auto">
        <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100 mb-6">Create a custom blank document</h2>
        <div className="space-y-5 max-w-lg">
          <div>
            <label htmlFor="docName" className="block text-sm font-medium text-gray-400 mb-1">Document name <span className="text-red-400">*</span></label>
            {isSavingPreset ? (
              <div className="flex items-center space-x-2">
                <Input
                  id="presetName"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleConfirmSavePreset(); if (e.key === 'Escape') handleCancelSavePreset(); }}
                />
                <button onClick={handleConfirmSavePreset} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md font-medium whitespace-nowrap">Save Preset</button>
                <button onClick={handleCancelSavePreset} className="px-4 py-2 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded-md font-medium">Cancel</button>
              </div>
            ) : (
              <div className="relative">
                <Input id="docName" value={name} onChange={e => updateSetting('name', e.target.value)} />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <button onClick={handleInitiateSave} title="Save Preset" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors" aria-label="Save preset">
                        <Icon type="save" />
                    </button>
                </div>
              </div>
            )}
          </div>
          
          <Select label="Preset" options={presetOptions} value={settings.name} onChange={handlePresetChange} />
  
          <div className="grid grid-cols-2 gap-x-6 items-start">
            {/* Left Column for Width/Height/Lock */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 space-y-2">
                <Input label="Width" type="number" value={width} onChange={e => handleWidthChange(e.target.value)} />
                <Input label="Height" type="number" value={height} onChange={e => handleHeightChange(e.target.value)} />
              </div>
              <div className="pt-7">
                <button onClick={toggleLock} title={isAspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"} className="p-2 rounded-md text-gray-500 hover:bg-gray-700 hover:text-white transition-colors">
                  <Icon type={isAspectRatioLocked ? 'lock' : 'unlock'} className="w-5 h-5"/>
                </button>
              </div>
            </div>

            {/* Right Column for Units/Orientation */}
            <div className="space-y-5">
              <Select label="Units" options={unitOptions} value={units} onChange={val => updateSetting('units', val)} />
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Orientation</label>
                <div className="flex space-x-2">
                    <button onClick={() => handleOrientationChange('portrait')} className={`p-2 rounded-md transition-colors ${orientation === 'portrait' ? 'bg-gray-500 text-white' : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700'}`}><Icon type="orientation-portrait"/></button>
                    <button onClick={() => handleOrientationChange('landscape')} className={`p-2 rounded-md transition-colors ${orientation === 'landscape' ? 'bg-gray-500 text-white' : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700'}`}><Icon type="orientation-landscape"/></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6">
              <Input label="Resolution" type="number" value={resolution} onChange={e => updateSetting('resolution', parseInt(e.target.value))} />
              <Select label="&nbsp;" options={resolutionUnitOptions} value={settings.resolutionUnit} onChange={val => updateSetting('resolutionUnit', val)} />
          </div>
  
          <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Select label="Background contents" options={backgroundOptions} value={background} onChange={val => updateSetting('background', val)} />
              </div>
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => background === 'Custom' && setIsColorPickerOpen(p => !p)}
                  className="w-10 h-10 p-0 border border-gray-600 rounded-md cursor-pointer disabled:cursor-not-allowed"
                  disabled={background !== 'Custom'}
                  style={{ backgroundColor: background === 'White' ? '#FFFFFF' : background === 'Black' ? '#000000' : background === 'Transparent' ? 'transparent' : customBgColor, backgroundImage: background === 'Transparent' ? `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)` : 'none', backgroundSize: '10px 10px'}}
                />
                {isColorPickerOpen && background === 'Custom' && (
                  <ColorPicker
                    color={customBgColor}
                    onChange={color => updateSetting('customBgColor', color)}
                    onClose={() => setIsColorPickerOpen(false)}
                  />
                )}
              </div>
           </div>
          
          <div>
              <p className="text-sm text-gray-500">Color mode</p>
              <p className="text-sm font-medium text-gray-300">RGB 8 bit</p>
          </div>
  
        </div>
      </div>
      <div className="flex justify-end pt-6 border-t border-gray-700/50">
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-8 rounded-md transition-colors">Create</button>
      </div>
    </div>
  );
};

export default CustomDocumentContent;