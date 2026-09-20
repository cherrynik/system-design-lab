import { Plus } from 'lucide-react';
import type { ComponentOptionProps } from './RequirementSidebar.types';

export function ComponentOption({ option, onAdd }: ComponentOptionProps) {
  const Icon = option.icon;
  let context = null;

  if (option.context) {
    context = <span className="catalog-option__context">{option.context}</span>;
  }

  return (
    <button
      className="catalog-option"
      type="button"
      onClick={() => onAdd(option)}
      aria-label={option.actionLabel}
    >
      <span className={`catalog-option__icon component-logo--${option.kind}`}>
        <Icon aria-hidden="true" focusable="false" />
      </span>
      <span className="catalog-option__copy">
        <span className="catalog-option__title">
          <strong>{option.label}</strong>
          {context}
        </span>
        <small>{option.description}</small>
        <code>{option.type}</code>
      </span>
      <span className="catalog-option__action" aria-hidden="true">
        <Plus />
        <span>{option.actionText}</span>
      </span>
    </button>
  );
}
