import { useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiArrowRight, FiMoreHorizontal, FiXCircle } from 'react-icons/fi';
import { getArchitectureVariant } from '../model/catalog';
import { getConnectionStateText, type ArchitectureNodeConnectionState } from '../model/connections';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation';
import type { ArchitectureNode } from '../model/types';

type Props = {
  node: ArchitectureNode;
  fallbackLabel: string;
  connectionState: ArchitectureNodeConnectionState;
  validationState?: ArchitectureNodeValidationState;
  mode?: 'list' | 'graph';
  onFocus: (nodeId: string) => void;
  onOpenMenu: (nodeId: string, x: number, y: number) => void;
  onRename: (nodeId: string, label: string) => void;
};

export function ArchitectureLayerItem({
  node,
  fallbackLabel,
  connectionState,
  validationState,
  mode = 'list',
  onFocus,
  onOpenMenu,
  onRename,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.data.label);
  const cancelled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const variant = getArchitectureVariant(node.data.kind, node.data.variantId);
  const Icon = variant.icon;
  const label = node.data.label || fallbackLabel;
  const connectionText = getConnectionStateText(connectionState);
  const missingText = (direction: 'incoming' | 'outgoing') =>
    direction === 'incoming' ? 'Choose source' : 'Choose destination';

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const beginRename = () => {
    cancelled.current = false;
    setDraft(node.data.label);
    setEditing(true);
  };

  const finishRename = () => {
    setEditing(false);
    if (!cancelled.current) onRename(node.id, draft);
  };

  return (
    <div
      className={`layer-row ${mode === 'graph' ? 'layer-row--graph' : ''} ${node.selected ? 'layer-row--selected' : ''}`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenMenu(node.id, event.clientX, event.clientY);
      }}
    >
      <div
        className={`layer-item ${editing ? 'layer-item--editing' : ''} ${validationState && validationState.status !== 'valid' ? 'layer-item--validated' : ''}`}
        role={editing ? undefined : 'button'}
        tabIndex={editing ? -1 : 0}
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
          } else if (event.key === 'F2') {
            event.preventDefault();
            beginRename();
          }
        }}
      >
        <Icon className={`component-logo component-logo--${node.data.kind}`} />
        <span>
          {editing ? (
            <input
              ref={inputRef}
              className="layer-item__name-input"
              aria-label={`Rename ${label}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onBlur={finishRename}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  cancelled.current = true;
                  setDraft(node.data.label);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <>
              <strong>{label}</strong>
              {mode === 'list' && (
                <span
                  className={`layer-item__connections layer-item__connections--${connectionState.state}`}
                  aria-label={connectionText}
                >
                  {connectionState.incoming.map((related) => {
                    const RelatedIcon = getArchitectureVariant(
                      related.data.kind,
                      related.data.variantId,
                    ).icon;
                    return (
                      <span
                        className="component-link component-link--incoming"
                        aria-label={`Connected from ${related.data.label}`}
                        key={`in-${related.id}`}
                      >
                        <RelatedIcon />
                        <b>{related.data.label}</b>
                        <FiArrowRight />
                      </span>
                    );
                  })}
                  {connectionState.outgoing.map((related) => {
                    const RelatedIcon = getArchitectureVariant(
                      related.data.kind,
                      related.data.variantId,
                    ).icon;
                    return (
                      <span
                        className="component-link component-link--outgoing"
                        aria-label={`Connected to ${related.data.label}`}
                        key={`out-${related.id}`}
                      >
                        <FiArrowRight />
                        <RelatedIcon />
                        <b>{related.data.label}</b>
                      </span>
                    );
                  })}
                  {connectionState.missing.map((direction) => (
                    <span className="component-link component-link--missing" key={direction}>
                      <i />
                      {missingText(direction)}
                    </span>
                  ))}
                </span>
              )}
            </>
          )}
        </span>
        {validationState && validationState.status !== 'valid' && (
          <span
            className={`layer-item__validation node-validation-tooltip layer-item__validation--${validationState.status}`}
            aria-label={`${label}: ${validationState.issues.length} validation ${validationState.issues.length === 1 ? 'issue' : 'issues'}`}
            data-tooltip={validationState.issues
              .map(({ message, suggestion }) => `${message}\n${suggestion}`)
              .join('\n\n')}
            tabIndex={0}
          >
            {validationState.status === 'error' ? <FiXCircle /> : <FiAlertTriangle />}
          </span>
        )}
      </div>
      <button
        className="component-menu-trigger"
        type="button"
        aria-label={`Open menu for ${label}`}
        onClick={(event) => onOpenMenu(node.id, event.clientX, event.clientY)}
      >
        <FiMoreHorizontal />
      </button>
    </div>
  );
}
