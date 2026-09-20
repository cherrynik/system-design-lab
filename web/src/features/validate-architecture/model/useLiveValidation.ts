import { useCallback, useState } from 'react';

const preferenceKey = 'system-design-lab:live-validation';

function readPreference() {
  try {
    return window.localStorage.getItem(preferenceKey) === 'true';
  } catch {
    return false;
  }
}

export function useLiveValidation() {
  const [enabled, setEnabled] = useState(readPreference);
  const change = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      window.localStorage.setItem(preferenceKey, String(value));
    } catch {
      // Live feedback remains usable when browser storage is unavailable.
    }
  }, []);
  return { enabled, change };
}
