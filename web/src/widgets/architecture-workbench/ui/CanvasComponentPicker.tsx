import { useState } from 'react';
import { Search } from 'lucide-react';
import { architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { Input } from '@/shared/ui';
import type { CanvasComponentPickerProps } from './CanvasComponentPicker.types';

export function CanvasComponentPicker({ connected, onAdd }: CanvasComponentPickerProps) {
  const [query, setQuery] = useState('');
  const options = (Object.keys(architectureVariants) as ArchitectureNodeKind[])
    .filter((kind) => !connected || kind !== 'client')
    .flatMap((kind) => architectureVariants[kind].map((variant) => ({ ...variant, kind })))
    .filter((option) =>
      `${option.label} ${option.description}`.toLowerCase().includes(query.toLowerCase().trim()),
    );
  return (
    <div className="canvas-component-picker">
      <label className="canvas-component-picker__search">
        <Search size={14} aria-hidden="true" />
        <Input
          autoFocus
          aria-label="Find component"
          placeholder="Find a component…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="canvas-component-picker__list" role="group" aria-label="Available components">
        {options.map((option) => (
          <button
            key={`${option.kind}-${option.id}`}
            type="button"
            className="platform-menu-row"
            onClick={() => onAdd(option.kind, option.id)}
          >
            <option.icon className="platform-menu-icon" aria-hidden="true" />
            <span>
              {option.label}
              <small>{option.description}</small>
            </span>
          </button>
        ))}
        {!options.length && (
          <p className="canvas-component-picker__empty">No matching components</p>
        )}
      </div>
    </div>
  );
}
