export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'focusflow_ai_settings_v1';

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-haiku-20241022',
};

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || 'gemini',
        apiKey: parsed.apiKey || '',
        model: parsed.model || DEFAULT_MODELS[parsed.provider as AIProvider] || 'gemini-2.5-flash',
      };
    }
  } catch (e) {
    console.error('Failed to read AI settings', e);
  }
  return {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
  };
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings', e);
  }
}
