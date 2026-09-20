import type { ConnectionSuggestionPreference } from './canvasCreation.types';

export const CONNECTION_SUGGESTION_KEY = 'system-design-lab:connection-suggestions';

export function readConnectionSuggestionPreference(): ConnectionSuggestionPreference {
  try {
    const value = localStorage.getItem(CONNECTION_SUGGESTION_KEY);
    if (value === 'always' || value === 'never') return value;
  } catch {
    // Browser storage can be unavailable; keep this preference for the session.
  }
  return 'ask';
}

export function saveConnectionSuggestionPreference(value: ConnectionSuggestionPreference) {
  try {
    localStorage.setItem(CONNECTION_SUGGESTION_KEY, value);
  } catch {
    // The session preference still applies.
  }
}
