import { ArchitectureConnectionSummary } from './ArchitectureConnectionSummary';
import type { ArchitectureLayerNameProps } from './ArchitectureLayerItem.types';

export function ArchitectureLayerName({
  editing,
  label,
  draft,
  mode,
  connectionState,
  inputRef,
  onDraftChange,
  onFinish,
  onCancel,
}: ArchitectureLayerNameProps) {
  if (editing) {
    return (
      <input
        ref={inputRef}
        className="layer-item__name-input"
        aria-label={`Rename ${label}`}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onBlur={onFinish}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') onCancel();
        }}
      />
    );
  }

  return (
    <>
      <strong>{label}</strong>
      {mode === 'list' && <ArchitectureConnectionSummary connectionState={connectionState} />}
    </>
  );
}
