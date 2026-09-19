import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import type { TargetElementProps } from './resolve-compound-target.types';

export function resolveCompoundTarget(render: ReactElement | undefined, children: ReactNode) {
  if (render) {
    return cloneElement(render as ReactElement<TargetElementProps>, undefined, children);
  }

  if (isValidElement(children)) {
    return children;
  }

  return <button type="button">{children}</button>;
}
