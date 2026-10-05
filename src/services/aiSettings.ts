export type AIProvider = 'gemini' | 'openai' | 'claude';
export type StorageMode = 'local' | 'session';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  storageMode: StorageMode;
}

const STORAGE_KEY = 'oc_todo_ai_settings_v2';
const LEGACY_STORAGE_KEY = 'focusflow_ai_settings_v1';
const CIPHER_SALT = 0x5a; // Obfuscation XOR mask to prevent plaintext API key exposure

// Obfuscate sensitive credentials in client-side storage
function obfuscate(text: string): string {
  if (!text) return '';
  try {
    const chars = Array.from(text).map(c => String.fromCharCode(c.charCodeAt(0) ^ CIPHER_SALT));
    return btoa(chars.join(''));
  } catch {
    return text;
  }
}

function deobfuscate(encoded: string): string {
  if (!encoded) return '';
  try {
    const decoded = atob(encoded);
    return Array.from(decoded).map(c => String.fromCharCode(c.charCodeAt(0) ^ CIPHER_SALT)).join('');
  } catch {
    // If not base64 encoded, return as-is (graceful fallback)
    return encoded;
  }
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-haiku-20241022',
};

export function getAISettings(): AISettings {
  // Check sessionStorage first (session-only keys take priority)
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      return {
        provider: parsed.provider || 'gemini',
        apiKey: deobfuscate(parsed.secKey || parsed.apiKey || ''),
        model: parsed.model || DEFAULT_MODELS[parsed.provider as AIProvider] || 'gemini-2.5-flash',
        storageMode: 'session',
      };
    }
  } catch (e) {
    console.warn('Could not read session AI settings:', e);
  }

  // Then check localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || 'gemini',
        apiKey: deobfuscate(parsed.secKey || parsed.apiKey || ''),
        model: parsed.model || DEFAULT_MODELS[parsed.provider as AIProvider] || 'gemini-2.5-flash',
        storageMode: 'local',
      };
    }

    // Check legacy key for migration
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const migrated: AISettings = {
        provider: parsed.provider || 'gemini',
        apiKey: parsed.apiKey || '',
        model: parsed.model || DEFAULT_MODELS[parsed.provider as AIProvider] || 'gemini-2.5-flash',
        storageMode: 'local',
      };
      saveAISettings(migrated);
      return migrated;
    }
  } catch (e) {
    console.warn('Could not read local AI settings:', e);
  }

  return {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
    storageMode: 'session',
  };
}

export function saveAISettings(settings: AISettings): void {
  try {
    const payload = {
      provider: settings.provider,
      model: settings.model,
      storageMode: settings.storageMode,
      secKey: obfuscate(settings.apiKey.trim()),
    };

    if (settings.storageMode === 'session') {
      // Save only in sessionStorage, purge from localStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      // Save in localStorage, purge from sessionStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to securely store AI settings:', e);
  }
}

export function clearAllAISettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear stored AI settings:', e);
  }
}
