import { useEffect, useRef, useState } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import { cn } from '@/shared/lib';
import { getArchitectureVariant } from '../model/catalog';
import { ArchitectureLayerName } from './ArchitectureLayerName';
import type { ArchitectureLayerItemProps } from './ArchitectureLayerItem.types';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';
import './architecture-sidebar.css';

export function ArchitectureLayerItem({
  node,
  fallbackLabel,
  connectionState,
  validationState,
  mode = 'list',
  readOnly = false,
  onFocus,
  onOpenMenu,
  onRename,
}: ArchitectureLayerItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.data.label);
  const cancelled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const variant = getArchitectureVariant(node.data.kind, node.data.variantId);
  const Icon = variant.icon;
  const label = node.data.label || fallbackLabel;
  const itemRole = editing ? undefined : 'button';
  const itemTabIndex = editing ? -1 : 0;
  const compact = mode === 'graph';
  const hasValidationIssue = Boolean(validationState && validationState.status !== 'valid');

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const beginRename = () => {
    if (readOnly || !onRename) return;
    cancelled.current = false;
    setDraft(node.data.label);
    setEditing(true);
  };

  const finishRename = () => {
    setEditing(false);
    if (!cancelled.current) onRename?.(node.id, draft);
  };

  const cancelRename = () => {
    cancelled.current = true;
    setDraft(node.data.label);
    setEditing(false);
  };

  let menuButton = null;
  if (!readOnly && onOpenMenu) {
    menuButton = (
      <button
        className={cn('component-menu-trigger', compact && 'component-menu-trigger--compact')}
        data-component-menu-trigger={node.id}
        type="button"
        aria-label={`Open menu for ${label}`}
        onClick={(event) => onOpenMenu(node.id, event.clientX, event.clientY)}
      >
        <FiMoreHorizontal />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'layer-row',
        mode === 'graph' && 'layer-row--graph',
        node.selected && 'layer-row--selected',
      )}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!readOnly) onOpenMenu?.(node.id, event.clientX, event.clientY);
      }}
    >
      <div
        className={cn(
          'layer-item',
          compact && 'layer-item--graph',
          editing && 'layer-item--editing',
          hasValidationIssue && 'layer-item--validated',
        )}
        role={itemRole}
        tabIndex={itemTabIndex}
        onClick={() => {
          if (!editing) onFocus(node.id);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          beginRename();
        }}
        onKeyDown={(event) => {
          if (editing) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onFocus(node.id);
          }
          if (event.key === 'F2') {
            event.preventDefault();
            beginRename();
          }
        }}
      >
        <Icon
          className={cn(
            'component-logo component-logo--layer',
            `component-logo--${node.data.kind}`,
            compact && 'component-logo--compact',
          )}
          aria-hidden="true"
          focusable="false"
        />
        <span className="layer-item__content">
          <ArchitectureLayerName
            editing={editing}
            label={label}
            draft={draft}
            mode={mode}
            connectionState={connectionState}
            inputRef={inputRef}
            onDraftChange={setDraft}
            onFinish={finishRename}
            onCancel={cancelRename}
          />
        </span>
        <ArchitectureValidationBadge
          label={label}
          validationState={validationState}
          compact={compact}
        />
      </div>
      {menuButton}
    </div>
  );
}
