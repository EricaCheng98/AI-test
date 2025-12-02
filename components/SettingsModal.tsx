import React, { useState } from 'react';
import { AppSettings, UserID } from '../types';
import { XIcon, ArrowPathIcon, CheckIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onImportData: (jsonData: string) => void;
  currentDataJSON: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings, 
  onImportData,
  currentDataJSON
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [importString, setImportString] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'sync'>('profile');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDataJSON).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleImport = () => {
    if (!importString.trim()) return;
    if (window.confirm("Importing data will MERGE with your current expenses. Continue?")) {
        onImportData(importString);
        setImportString('');
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-50 border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                Profile & Users
            </button>
            <button 
                onClick={() => setActiveTab('sync')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'sync' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                Sync Data
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
            
            {activeTab === 'profile' ? (
                <>
                    {/* Names Configuration */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">User Names</label>
                        <div className="flex gap-3 items-center">
                             <div className="w-8 h-8 rounded-full bg-userA shrink-0"></div>
                             <div className="flex-1">
                                <label className="text-xs text-gray-400">User A (Purple)</label>
                                <input 
                                    type="text" 
                                    value={localSettings.userAName}
                                    onChange={(e) => setLocalSettings({...localSettings, userAName: e.target.value})}
                                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="e.g. Me"
                                />
                             </div>
                        </div>
                         <div className="flex gap-3 items-center">
                             <div className="w-8 h-8 rounded-full bg-userB shrink-0"></div>
                             <div className="flex-1">
                                <label className="text-xs text-gray-400">User B (Pink)</label>
                                <input 
                                    type="text" 
                                    value={localSettings.userBName}
                                    onChange={(e) => setLocalSettings({...localSettings, userBName: e.target.value})}
                                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="e.g. Partner"
                                />
                             </div>
                        </div>
                    </div>

                    {/* Identity Selection */}
                    <div className="pt-4 border-t border-gray-100">
                         <label className="block text-sm font-bold text-gray-700 mb-3">Who are you?</label>
                         <p className="text-xs text-gray-500 mb-3">This sets who is selected by default when adding expenses on this device.</p>
                         <div className="flex gap-2">
                             <button
                                type="button"
                                onClick={() => setLocalSettings({...localSettings, currentUserId: UserID.A})}
                                className={`flex-1 py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${localSettings.currentUserId === UserID.A ? 'border-userA bg-purple-50 text-userA' : 'border-gray-100 text-gray-400'}`}
                             >
                                I am {localSettings.userAName || 'User A'}
                             </button>
                             <button
                                type="button"
                                onClick={() => setLocalSettings({...localSettings, currentUserId: UserID.B})}
                                className={`flex-1 py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${localSettings.currentUserId === UserID.B ? 'border-userB bg-rose-50 text-userB' : 'border-gray-100 text-gray-400'}`}
                             >
                                I am {localSettings.userBName || 'User B'}
                             </button>
                         </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Sync / Export / Import */}
                    <div className="space-y-6">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800">
                            <strong>Note:</strong> Since this app doesn't use a cloud server, use this feature to copy data between two phones.
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">1. Export Data</label>
                            <p className="text-xs text-gray-500 mb-2">Copy this code and send it to your partner.</p>
                            <div className="relative">
                                <textarea 
                                    readOnly 
                                    value={currentDataJSON}
                                    className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-mono text-gray-600 resize-none focus:outline-none"
                                />
                                <button 
                                    onClick={handleCopy}
                                    className="absolute bottom-2 right-2 bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                                >
                                    {copySuccess ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                             <label className="block text-sm font-bold text-gray-700 mb-2">2. Import Data</label>
                             <p className="text-xs text-gray-500 mb-2">Paste the code from your partner here to merge their expenses.</p>
                             <textarea 
                                    value={importString}
                                    onChange={(e) => setImportString(e.target.value)}
                                    placeholder="Paste data code here..."
                                    className="w-full h-24 p-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-[10px] font-mono text-gray-800 resize-none focus:border-brand-500 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                                />
                             <button 
                                onClick={handleImport}
                                disabled={!importString}
                                className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                <ArrowPathIcon className="w-4 h-4" />
                                Merge & Sync
                             </button>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Footer */}
        {activeTab === 'profile' && (
             <div className="p-4 bg-white border-t border-gray-100 mt-auto">
                <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all"
                >
                <CheckIcon className="w-5 h-5" />
                Save Changes
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
