import { HTMLContainer, useEditor, useValue } from 'tldraw';
import { architectureMeta, getArchitectureVariant } from '@/entities/architecture';
import { startEditingArchitectureCard } from '../lib/cardEditing';
import type { ArchitectureCardContentProps } from '../model/architectureCanvasComponents.types';
import { hotspotSides } from '../model/hotspots';
import { useArchitectureCanvasActions } from '../model/ArchitectureCanvasActionsContext';
import { ArchitectureCardHotspot } from './ArchitectureCardHotspot';
import { ArchitectureCardNameInput } from './ArchitectureCardNameInput';
import { ArchitectureValidationBadge } from './ArchitectureValidationBadge';

export function ArchitectureCardContent({ shape }: ArchitectureCardContentProps) {
  const editor = useEditor();
  const actions = useArchitectureCanvasActions();
  const variant = getArchitectureVariant(shape.props.kind, shape.props.variantId);
  const Icon = variant.icon;
  const isSelected = useValue(
    'architecture card selected',
    () => editor.getSelectedShapeIds().includes(shape.id),
    [editor, shape.id],
  );
  const isEditing = useValue(
    'architecture card editing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id],
  );
  const isBindingTarget = useValue(
    'architecture card binding target',
    () => editor.getHintingShapeIds().includes(shape.id),
    [editor, shape.id],
  );
  const isConnectionTool = useValue(
    'connection tool active',
    () => editor.getCurrentToolId() === 'arrow',
    [editor],
  );
  const isDraggingArrowHandle = useValue(
    'arrow handle drag active',
    () => editor.getPath().startsWith('select.dragging_handle'),
    [editor],
  );
  const isInteractive = actions.mode === 'interactive';
  const roleLabel = architectureMeta[shape.props.kind].role;
  const showHotspots = isInteractive && (isConnectionTool || isSelected || isBindingTarget);
  const disableHotspots = !isInteractive || isDraggingArrowHandle;
  const classes = [
    'tldraw-architecture-card',
    `tldraw-architecture-card--${shape.props.kind}`,
    `tldraw-architecture-card--validation-${shape.props.validation}`,
  ];
  if (isSelected) classes.push('tldraw-architecture-card--selected');
  if (isBindingTarget) classes.push('tldraw-architecture-card--binding-target');
  if (isConnectionTool) classes.push('tldraw-architecture-card--connection-tool');
  if (isDraggingArrowHandle) classes.push('tldraw-architecture-card--arrow-interaction');
  let cardTabIndex = -1;
  if (isInteractive) {
    cardTabIndex = 0;
  }

  let name = <strong>{shape.props.label}</strong>;
  if (isEditing && isInteractive) {
    name = (
      <ArchitectureCardNameInput shape={shape} editor={editor} onRename={actions.nodeRenamed} />
    );
  }
  let hotspots = null;
  if (isInteractive) {
    hotspots = hotspotSides.map((side) => (
      <ArchitectureCardHotspot
        key={side}
        shape={shape}
        side={side}
        visible={showHotspots}
        disabled={disableHotspots}
      />
    ));
  }

  return (
    <HTMLContainer
      aria-label={`${shape.props.label}, ${roleLabel}`}
      className={classes.join(' ')}
      role="group"
      tabIndex={cardTabIndex}
      onKeyDown={(event) => {
        if (!isInteractive || event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          editor.select(shape.id);
        }
        if (event.key === 'F2') {
          event.preventDefault();
          startEditingArchitectureCard(editor, shape);
        }
      }}
    >
      <Icon
        aria-hidden="true"
        focusable="false"
        className={`component-logo component-logo--${shape.props.kind}`}
      />
      <span>
        {name}
        <small>{roleLabel}</small>
      </span>
      <ArchitectureValidationBadge
        status={shape.props.validation}
        message={shape.props.validationMessage}
      />
      {hotspots}
    </HTMLContainer>
  );
}
