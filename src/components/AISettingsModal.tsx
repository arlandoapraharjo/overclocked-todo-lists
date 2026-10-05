import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Key, Eye, EyeOff, Check, X, Bot, ShieldCheck } from 'lucide-react';
import { getAISettings, saveAISettings, DEFAULT_MODELS, type AIProvider, type AISettings } from '../services/aiSettings';
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

  useEffect(() => {
    if (isOpen) {
      setSettings(getAISettings());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({
      ...prev,
      provider,
      model: DEFAULT_MODELS[provider],
    }));
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
    const cleared: AISettings = {
      provider: settings.provider,
      apiKey: '',
      model: DEFAULT_MODELS[settings.provider],
    };
    setSettings(cleared);
    saveAISettings(cleared);
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
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    AI Task Extraction Settings
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Extract, categorize & prioritize tasks from raw paragraphs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
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
                    rel="noreferrer"
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
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Stored locally in your browser. Never sent to any third-party server.</span>
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-zinc-400" />
                  <span>Model</span>
                </label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {settings.apiKey ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove key
                  </button>
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
