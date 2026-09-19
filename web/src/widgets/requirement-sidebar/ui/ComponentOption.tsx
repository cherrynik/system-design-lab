import type { ComponentOptionProps } from './RequirementSidebar.types';

export function ComponentOption({ option, onAdd }: ComponentOptionProps) {
  const Icon = option.icon;

  return (
    <button className="component-option" type="button" onClick={() => onAdd(option)}>
      <Icon aria-hidden="true" focusable="false" />
      <span>
        <strong>{option.label}</strong>
        <small>{option.description}</small>
      </span>
      <em>{option.meta}</em>
    </button>
  );
}
