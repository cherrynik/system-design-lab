import { createContext, useContext } from 'react';
import type { DialogContextValue } from './dialog.types';

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be rendered inside Dialog');
  }

  return context;
}
