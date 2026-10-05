import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Key, Eye, EyeOff, Check, X, Bot, ShieldCheck, Lock, Trash2 } from 'lucide-react';
import { 
  getAISettings, 
  saveAISettings, 
  clearAllAISettings,
  DEFAULT_MODELS, 
  type AIProvider, 
  type AISettings,
  type StorageMode 
} from '../services/aiSettings';
import { cn } from '../lib/utils';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { id: AIProvider; label: string; placeholder: string; docUrl: string }[] = [
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIzaSy...', docUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-proj-...', docUrl: 'https://platform.openai.com/api-keys' },
  { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-...', docUrl: 'https://console.anthropic.com/settings/keys' },
];

export const AISettingsModal = React.memo(function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(getAISettings);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAISettings());
      setSavedSuccess(false);
      setConfirmClear(false);
    }
  }, [isOpen]);

  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({
      ...prev,
      provider,
      model: DEFAULT_MODELS[provider],
    }));
  };

  const handleStorageModeChange = (storageMode: StorageMode) => {
    setSettings(prev => ({ ...prev, storageMode }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAISettings(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    clearAllAISettings();
    const cleared: AISettings = {
      provider: settings.provider,
      apiKey: '',
      model: DEFAULT_MODELS[settings.provider],
      storageMode: 'session',
    };
    setSettings(cleared);
    setConfirmClear(false);
  };

  const currentProviderInfo = PROVIDERS.find(p => p.id === settings.provider) || PROVIDERS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    AI Task Extraction & Security
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Extract, categorize & prioritize tasks with client-side security
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Provider Selection Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  AI Provider
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg font-medium transition-colors text-center cursor-pointer",
                        settings.provider === p.id
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {p.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Key className="w-3 h-3 text-zinc-400" />
                    <span>{currentProviderInfo.label} API Key</span>
                  </label>
                  <a
                    href={currentProviderInfo.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Get API key ↗
                  </a>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder={currentProviderInfo.placeholder}
                    value={settings.apiKey}
                    onChange={e => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full text-xs font-mono px-3 py-2 pr-16 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Storage Mode Security Toggle */}
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Credential Storage Policy</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStorageModeChange('session')}
                    className={cn(
                      "p-2 rounded-lg text-left border transition-all cursor-pointer",
                      settings.storageMode === 'session'
                        ? "bg-white dark:bg-zinc-700/80 border-blue-500 dark:border-blue-400 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    <div className="font-medium text-[11px]">Session Only</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Cleared when tab closes</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStorageModeChange('local')}
                    className={cn(
                      "p-2 rounded-lg text-left border transition-all cursor-pointer",
                      settings.storageMode === 'local'
                        ? "bg-white dark:bg-zinc-700/80 border-blue-500 dark:border-blue-400 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    <div className="font-medium text-[11px]">Remember on Device</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Obfuscated in localStorage</div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-zinc-400" />
                  <span>Model Identifier</span>
                </label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none"
                />
              </div>

              {/* Security Safeguard Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-medium">Direct Browser-to-API Calls</div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                    Requests connect straight from your browser to Google/OpenAI/Anthropic using authorization headers. No third-party proxy or backend server ever sees your tokens.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {settings.apiKey ? (
                  confirmClear ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline cursor-pointer"
                      >
                        Confirm Wipe
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Wipe key</span>
                    </button>
                  )
                ) : (
                  <span className="text-[11px] text-zinc-400">
                    Smart local parser active (offline)
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Settings</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
