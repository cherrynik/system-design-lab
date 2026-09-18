import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  BaseBoxShapeUtil,
  ArrowShapeKindStyle,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  HTMLContainer,
  T,
  Tldraw,
  createShapeId,
  getArrowBindings,
  getArrowTerminalsInArrowSpace,
  renderPlaintextFromRichText,
  toRichText,
  useEditor,
  useValue,
  type Editor,
  type RecordProps,
  type TLArrowShape,
  type TLShape,
  type TLUiOverrides,
} from 'tldraw';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import 'tldraw/tldraw.css';
import { architectureMeta, architectureVariants, getArchitectureVariant, getArrowProtocol } from '../model/catalog';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation';
import type { ArchitectureEdge, ArchitectureNode, ArchitectureNodeKind, EdgeAnchor } from '../model/types';

const CARD_TYPE = 'architecture-card' as const;
const CARD_WIDTH = 220;
const CARD_HEIGHT = 86;
type HotspotSide = 'top' | 'right' | 'bottom' | 'left';

export function isSupportedArchitectureCanvasShape(shape: Pick<TLShape, 'type'>) {
  return shape.type === CARD_TYPE || shape.type === 'arrow';
}

export function resolveArchitectureCardLabel(currentLabel: string, draft: string, cancelled: boolean) {
  const nextLabel = draft.trim();
  return cancelled || !nextLabel ? currentLabel : nextLabel;
}

let pendingHotspotStart: {
  shapeId: ArchitectureCardShape['id'];
  anchor: { x: number; y: number };
  existingArrowIds: Set<string>;
} | null = null;

const hotspotAnchor: Record<HotspotSide, { x: number; y: number }> = {
  top: { x: 0.5, y: 0 },
  right: { x: 1, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
};

function setArchitectureArrowStyles(editor: Editor) {
  editor.setStyleForNextShapes(ArrowShapeKindStyle, 'arc');
  editor.setStyleForNextShapes(DefaultColorStyle, 'light-blue');
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid');
  editor.setStyleForNextShapes(DefaultFillStyle, 'none');
  editor.setStyleForNextShapes(DefaultFontStyle, 'mono');
  editor.setStyleForNextShapes(DefaultSizeStyle, 's');
}

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [CARD_TYPE]: {
      w: number;
      h: number;
      nodeId: string;
      label: string;
      kind: ArchitectureNodeKind;
      variantId: string;
      validation: 'idle' | 'valid' | 'warning' | 'error';
      validationMessage: string;
    };
  }
}

type ArchitectureCardShape = TLShape<typeof CARD_TYPE>;

type ArchitectureCanvasActions = {
  inspectorId: string | null;
  closeInspector: () => void;
  updateVariant: (nodeId: string, variantId: string) => void;
  nodeRenamed: (nodeId: string, label: string) => void;
};

const ArchitectureCanvasActionsContext = createContext<ArchitectureCanvasActions>({
  inspectorId: null,
  closeInspector: () => undefined,
  updateVariant: () => undefined,
  nodeRenamed: () => undefined,
});

function finalizePendingHotspotStart(editor: Editor, pending: NonNullable<typeof pendingHotspotStart>) {
  const createdArrow = [...editor.getCurrentPageShapes()]
    .reverse()
    .find((shape): shape is TLArrowShape => shape.type === 'arrow' && !pending.existingArrowIds.has(shape.id));
  if (!createdArrow) return false;

  pendingHotspotStart = null;
  const startBinding = getArrowBindings(editor, createdArrow).start;
  if (startBinding) editor.updateBinding({
    ...startBinding,
    props: { ...startBinding.props, normalizedAnchor: pending.anchor, isPrecise: true },
  });
  else editor.createBinding({
    type: 'arrow',
    fromId: createdArrow.id,
    toId: pending.shapeId,
    props: { terminal: 'start', normalizedAnchor: pending.anchor, isPrecise: true, isExact: false, snap: 'none' },
  });
  const sourceShape = editor.getShape(pending.shapeId);
  const protocol = getArrowProtocol(sourceShape?.type === CARD_TYPE ? sourceShape.props.kind : undefined);
  editor.updateShape<TLArrowShape>({
    id: createdArrow.id,
    type: 'arrow',
    props: {
      kind: 'arc',
      dash: 'solid',
      size: 's',
      fill: 'none',
      color: 'light-blue',
      labelColor: 'light-blue',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(protocol),
    },
  });
  return true;
}

class ArchitectureCardShapeUtil extends BaseBoxShapeUtil<ArchitectureCardShape> {
  static override type = CARD_TYPE;
  static override props: RecordProps<ArchitectureCardShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    label: T.string,
    kind: T.literalEnum('client', 'load-balancer', 'service'),
    variantId: T.string,
    validation: T.literalEnum('idle', 'valid', 'warning', 'error'),
    validationMessage: T.string,
  };

  override getDefaultProps(): ArchitectureCardShape['props'] {
    return { w: CARD_WIDTH, h: CARD_HEIGHT, nodeId: '', label: 'Component', kind: 'service', variantId: 'abstract', validation: 'idle', validationMessage: '' };
  }

  override canBind({ bindingType }: { bindingType: string }) {
    return bindingType === 'arrow';
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return false;
  }

  override hideResizeHandles() {
    return true;
  }

  override hideRotateHandle() {
    return true;
  }

  override hideSelectionBoundsBg() {
    return true;
  }

  override hideSelectionBoundsFg() {
    return true;
  }

  component(shape: ArchitectureCardShape) {
    return <ArchitectureCardContent shape={shape} />;
  }

  getIndicatorPath(shape: ArchitectureCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }
}

function ArchitectureCardContent({ shape }: { shape: ArchitectureCardShape }) {
  const editor = useEditor();
  const actions = useContext(ArchitectureCanvasActionsContext);
  const [draft, setDraft] = useState(shape.props.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameCancelledRef = useRef(false);
  const variant = getArchitectureVariant(shape.props.kind, shape.props.variantId);
  const Icon = variant.icon;
  const isSelected = useValue('architecture card selected', () => editor.getSelectedShapeIds().includes(shape.id), [editor, shape.id]);
  const isEditing = useValue('architecture card editing', () => editor.getEditingShapeId() === shape.id, [editor, shape.id]);
  const isBindingTarget = useValue('architecture card binding target', () => editor.getHintingShapeIds().includes(shape.id), [editor, shape.id]);
  const isArrowInteraction = useValue('arrow interaction active', () => editor.getCurrentToolId() === 'arrow' || editor.getPath().startsWith('select.dragging_handle'), [editor]);

  useEffect(() => {
    if (!isEditing) setDraft(shape.props.label);
  }, [isEditing, shape.props.label]);

  useEffect(() => {
    if (!isEditing) return;
    renameCancelledRef.current = false;
    setDraft(shape.props.label);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const finishRename = () => {
    const label = resolveArchitectureCardLabel(shape.props.label, draft, renameCancelledRef.current);
    renameCancelledRef.current = false;
    if (label !== shape.props.label) {
      actions.nodeRenamed(shape.props.nodeId, label);
      editor.updateShape<ArchitectureCardShape>({ id: shape.id, type: CARD_TYPE, props: { label } });
    }
    if (editor.getEditingShapeId() === shape.id) editor.setEditingShape(null);
  };

  const beginRename = () => {
    editor.select(shape.id);
    editor.setCurrentTool('select');
    renameCancelledRef.current = false;
    setDraft(shape.props.label);
    editor.setEditingShape(shape.id);
  };

  const beginArrow = (event: ReactPointerEvent<HTMLSpanElement>, side: HotspotSide) => {
    if (event.button !== 0 || isArrowInteraction) return;
    const pending = {
      shapeId: shape.id,
      anchor: hotspotAnchor[side],
      existingArrowIds: new Set(editor.getCurrentPageShapes().filter(({ type }) => type === 'arrow').map(({ id }) => id)),
    };
    pendingHotspotStart = pending;
    const finalizeArrow = () => {
      window.removeEventListener('pointerup', finalizeArrow, true);
      window.removeEventListener('pointercancel', finalizeArrow, true);
      window.requestAnimationFrame(() => {
        if (pendingHotspotStart !== pending || finalizePendingHotspotStart(editor, pending)) return;
        window.setTimeout(() => {
          if (pendingHotspotStart === pending) pendingHotspotStart = null;
        }, 1_200);
      });
    };
    window.addEventListener('pointerup', finalizeArrow, true);
    window.addEventListener('pointercancel', finalizeArrow, true);
    editor.setCurrentTool('arrow');
  };

  return (
    <HTMLContainer
      className={`tldraw-architecture-card tldraw-architecture-card--${shape.props.kind} tldraw-architecture-card--validation-${shape.props.validation} ${isSelected ? 'tldraw-architecture-card--selected' : ''} ${isBindingTarget ? 'tldraw-architecture-card--binding-target' : ''} ${isArrowInteraction ? 'tldraw-architecture-card--arrow-interaction' : ''}`}
      onDoubleClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.requestAnimationFrame(beginRename);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || event.detail !== 2) return;
        event.preventDefault();
        event.stopPropagation();
        window.requestAnimationFrame(beginRename);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.requestAnimationFrame(beginRename);
      }}
    >
      <Icon className={`component-logo component-logo--${shape.props.kind}`} />
      <span>
        {isEditing ? <input
          ref={inputRef}
          className="tldraw-node-name-input"
          aria-label={`Rename ${shape.props.label}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onBlur={finishRename}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              renameCancelledRef.current = true;
              event.currentTarget.blur();
            }
          }}
        /> : <strong>{shape.props.label}</strong>}
        <small>{architectureMeta[shape.props.kind].role}</small>
      </span>
      {shape.props.validation !== 'idle' && shape.props.validation !== 'valid' && <i className={`tldraw-node-validation node-validation-tooltip tldraw-node-validation--${shape.props.validation}`} data-tooltip={shape.props.validationMessage} aria-label="Node validation issue" tabIndex={0}>
        {shape.props.validation === 'error' ? <FiX /> : <FiAlertTriangle />}
      </i>}
      {(['top', 'right', 'bottom', 'left'] as HotspotSide[]).map((side) => <span
        key={side}
        className={`tldraw-node-hotspot tldraw-node-hotspot--${side}`}
        aria-label={`Create connection from ${side} of ${shape.props.label}`}
        aria-hidden={!isSelected && !isBindingTarget}
        role="button"
        onPointerDown={(event) => beginArrow(event, side)}
      />)}
    </HTMLContainer>
  );
}

function ArchitectureInspectorOverlay() {
  const editor = useEditor();
  const actions = useContext(ArchitectureCanvasActionsContext);
  const state = useValue('architecture inspector overlay', () => {
    if (!actions.inspectorId) return null;
    editor.getCamera();
    const shape = editor.getShape<ArchitectureCardShape>(shapeIdForNode(actions.inspectorId));
    const bounds = shape ? editor.getShapePageBounds(shape.id) : undefined;
    if (!shape || !bounds || shape.type !== CARD_TYPE) return null;
    const anchor = editor.pageToViewport({ x: bounds.midX, y: bounds.y });
    return { shape, x: anchor.x, y: anchor.y };
  }, [editor, actions.inspectorId]);
  if (!state) return null;

  const variant = getArchitectureVariant(state.shape.props.kind, state.shape.props.variantId);
  const Icon = variant.icon;
  return <aside
    className="component-inspector component-inspector--above component-inspector--canvas-overlay"
    style={{ left: state.x, top: state.y - 18 }}
  >
    <div className="component-inspector__header">
      <span className="panel-id">COMPONENT INSPECTOR</span>
      <button onClick={actions.closeInspector} aria-label="Close inspector"><FiX /></button>
    </div>
    <div className="component-inspector__identity">
      <Icon className={`component-logo component-logo--${state.shape.props.kind}`} />
      <span><strong>{variant.label}</strong><small>{architectureMeta[state.shape.props.kind].role}</small></span>
    </div>
    <span className="inspector-label">IMPLEMENTATION</span>
    <div className="inspector-variants">
      {architectureVariants[state.shape.props.kind].map((candidate) => {
        const VariantIcon = candidate.icon;
        return <button
          key={candidate.id}
          className={candidate.id === variant.id ? 'inspector-variant--active' : ''}
          onClick={() => actions.updateVariant(state.shape.props.nodeId, candidate.id)}
        >
          <VariantIcon />
          <span><strong>{candidate.label}</strong><small>{candidate.description}</small></span>
        </button>;
      })}
    </div>
    <span className="inspector-label">CAPABILITIES</span>
    <div className="inspector-capabilities">
      {variant.capabilities.map((capability) => <code key={capability}>{capability}</code>)}
    </div>
  </aside>;
}

const shapeUtils = [ArchitectureCardShapeUtil];
const tldrawComponents = { InFrontOfTheCanvas: ArchitectureInspectorOverlay };
const tldrawOverrides: TLUiOverrides = {
  actions(_editor, actions) {
    return {
      ...actions,
      'zoom-in': { ...actions['zoom-in'], kbd: '=' },
      'zoom-in-on-cursor': { ...actions['zoom-in-on-cursor'], kbd: 'shift+=' },
      'zoom-out': { ...actions['zoom-out'], kbd: '-' },
      'zoom-out-on-cursor': { ...actions['zoom-out-on-cursor'], kbd: 'shift+-' },
    };
  },
};

type Props = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  tool: 'hand' | 'selection' | 'connection';
  onNodesChange: (nodes: ArchitectureNode[]) => void;
  onEdgesChange: (edges: ArchitectureEdge[]) => void;
  onMountEditor: (editor: Editor) => void;
  onToolChange: (tool: 'hand' | 'selection' | 'connection') => void;
  inspectorId?: string | null;
  onCloseInspector?: () => void;
  onUpdateVariant?: (nodeId: string, variantId: string) => void;
  onNodeRenamed?: (nodeId: string, label: string) => void;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
};

const shapeIdForNode = (nodeId: string) => createShapeId(nodeId);
const shapeIdForEdge = (edgeId: string) => createShapeId(edgeId);
const recordId = (shapeId: string) => shapeId.startsWith('shape:') ? shapeId.slice(6) : shapeId;

function normalizedAnchor(anchor?: EdgeAnchor) {
  if (!anchor) return { x: 0.5, y: 0.5 };
  if (anchor.side === 'left') return { x: 0, y: anchor.offset };
  if (anchor.side === 'right') return { x: 1, y: anchor.offset };
  if (anchor.side === 'top') return { x: anchor.offset, y: 0 };
  return { x: anchor.offset, y: 1 };
}

function edgeAnchor(point: { x: number; y: number }): EdgeAnchor {
  const candidates = [
    { side: 'left' as const, distance: Math.abs(point.x), offset: point.y },
    { side: 'right' as const, distance: Math.abs(1 - point.x), offset: point.y },
    { side: 'top' as const, distance: Math.abs(point.y), offset: point.x },
    { side: 'bottom' as const, distance: Math.abs(1 - point.y), offset: point.x },
  ];
  const nearest = candidates.sort((a, b) => a.distance - b.distance)[0];
  return { side: nearest.side, offset: Math.min(0.98, Math.max(0.02, nearest.offset)) };
}

function componentPoint(node: ArchitectureNode) {
  return node.data.isAnchor
    ? { x: node.position.x, y: node.position.y }
    : { x: node.position.x + CARD_WIDTH / 2, y: node.position.y + CARD_HEIGHT / 2 };
}

function createArrow(editor: Editor, edge: ArchitectureEdge, nodes: ArchitectureNode[]) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return;
  const start = componentPoint(source);
  const end = componentPoint(target);
  const arrowId = shapeIdForEdge(edge.id);
  editor.createShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    props: {
      kind: 'arc',
      start: { x: 0, y: 0 },
      end: { x: end.x - start.x, y: end.y - start.y },
      bend: edge.data?.bend?.normal ?? 0,
      color: 'light-blue',
      labelColor: 'light-blue',
      fill: 'none',
      dash: 'solid',
      size: 's',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(edge.data?.protocol ?? String(edge.label ?? '')),
      labelPosition: 0.5,
      scale: 1,
      elbowMidPoint: 0.5,
    },
  });
  if (!source.data.isAnchor) {
    editor.createBinding({ type: 'arrow', fromId: arrowId, toId: shapeIdForNode(source.id), props: { terminal: 'start', normalizedAnchor: normalizedAnchor(edge.data?.sourceAnchor), isPrecise: Boolean(edge.data?.sourceAnchor), isExact: false, snap: 'none' } });
  }
  if (!target.data.isAnchor) {
    editor.createBinding({ type: 'arrow', fromId: arrowId, toId: shapeIdForNode(target.id), props: { terminal: 'end', normalizedAnchor: normalizedAnchor(edge.data?.targetAnchor), isPrecise: Boolean(edge.data?.targetAnchor), isExact: false, snap: 'none' } });
  }
}

export function TldrawArchitectureCanvas({ nodes, edges, tool, onNodesChange, onEdgesChange, onMountEditor, onToolChange, inspectorId = null, onCloseInspector = () => undefined, onUpdateVariant = () => undefined, onNodeRenamed = () => undefined, validationStates }: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const nodesRef = useRef(nodes);
  const toolRef = useRef(tool);
  const syncFrame = useRef<number | null>(null);
  const didInitialFit = useRef(false);
  const lastArrowCount = useRef(0);
  const canvasActions = useMemo<ArchitectureCanvasActions>(() => ({
    inspectorId,
    closeInspector: onCloseInspector,
    updateVariant: onUpdateVariant,
    nodeRenamed: onNodeRenamed,
  }), [inspectorId, onCloseInspector, onUpdateVariant, onNodeRenamed]);
  nodesRef.current = nodes;
  toolRef.current = tool;

  useEffect(() => {
    if (!editor) return;
    editor.setCurrentTool(tool === 'selection' ? 'select' : tool === 'connection' ? 'arrow' : 'hand');
  }, [editor, tool]);

  useEffect(() => {
    if (!editor) return;
    return editor.sideEffects.registerAfterCreateHandler('shape', (shape, source) => {
      if (source !== 'user' || isSupportedArchitectureCanvasShape(shape)) return;
      editor.deleteShape(shape.id);
      editor.setCurrentTool('select');
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const componentNodes = nodes.filter((node) => !node.data.isAnchor);
    const desiredNodeIds = new Set(componentNodes.map((node) => shapeIdForNode(node.id)));
    const currentCards = editor.getCurrentPageShapes().filter((shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE);
    const currentByNodeId = new Map(currentCards.map((shape) => [shape.props.nodeId, shape]));
    const updates: ArchitectureCardShape[] = [];
    for (const node of componentNodes) {
      const existing = currentByNodeId.get(node.id);
      const validationState = validationStates?.get(node.id);
      const validation = validationState?.status ?? 'idle';
      const validationMessage = validationState?.issues.map(({ message, suggestion }) => `${message}\n${suggestion}`).join('\n\n') ?? '';
      if (!existing) {
        editor.createShape<ArchitectureCardShape>({ id: shapeIdForNode(node.id), type: CARD_TYPE, x: node.position.x, y: node.position.y, props: { w: CARD_WIDTH, h: CARD_HEIGHT, nodeId: node.id, label: node.data.label, kind: node.data.kind, variantId: node.data.variantId, validation, validationMessage } });
      } else if (existing.x !== node.position.x || existing.y !== node.position.y || existing.props.label !== node.data.label || existing.props.kind !== node.data.kind || existing.props.variantId !== node.data.variantId || existing.props.validation !== validation || existing.props.validationMessage !== validationMessage) {
        updates.push({ ...existing, x: node.position.x, y: node.position.y, props: { ...existing.props, label: node.data.label, kind: node.data.kind, variantId: node.data.variantId, validation, validationMessage } });
      }
    }
    if (updates.length) editor.updateShapes(updates);
    const cardsToDelete = currentCards.filter((shape) => !desiredNodeIds.has(shape.id)).map((shape) => shape.id);
    if (cardsToDelete.length) editor.deleteShapes(cardsToDelete);

    const desiredEdgeIds = new Set(edges.map((edge) => shapeIdForEdge(edge.id)));
    const currentArrows = editor.getCurrentPageShapes().filter((shape): shape is TLArrowShape => shape.type === 'arrow');
    for (const edge of edges) if (!editor.getShape(shapeIdForEdge(edge.id))) createArrow(editor, edge, nodes);
    const arrowsToDelete = currentArrows.filter((shape) => !desiredEdgeIds.has(shape.id)).map((shape) => shape.id);
    if (arrowsToDelete.length) editor.deleteShapes(arrowsToDelete);
    if (!didInitialFit.current && componentNodes.length) {
      didInitialFit.current = true;
      requestAnimationFrame(() => editor.zoomToFit({ animation: { duration: 180 } }));
    }
  }, [editor, nodes, edges, validationStates]);

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const shapes = editor.getCurrentPageShapes();
      const editorTool = editor.getCurrentToolId();
      const nextTool = editorTool === 'hand' ? 'hand' : editorTool === 'arrow' ? 'connection' : 'selection';
      if (nextTool !== toolRef.current) onToolChange(nextTool);
      const selected = new Set(editor.getSelectedShapeIds());
      const cards = shapes.filter((shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE);
      const cardById = new Map(cards.map((shape) => [shape.id, shape]));
      const cardNodes: ArchitectureNode[] = cards.map((shape) => ({
        id: shape.props.nodeId,
        type: 'architecture',
        position: { x: shape.x, y: shape.y },
        selected: selected.has(shape.id),
        data: { kind: shape.props.kind, variantId: shape.props.variantId, label: shape.props.label },
      }));
      const previousComponents = nodesRef.current.filter((node) => !node.data.isAnchor);
      const nextNodes: ArchitectureNode[] = cards.length === 0 && previousComponents.length > 0 ? previousComponents : cardNodes;
      const nextEdges: ArchitectureEdge[] = [];
      const arrows = shapes.filter((shape): shape is TLArrowShape => shape.type === 'arrow');
      for (const arrow of arrows) {
        const bindings = getArrowBindings(editor, arrow);
        const terminals = getArrowTerminalsInArrowSpace(editor, arrow, bindings);
        const transform = editor.getShapePageTransform(arrow);
        const edgeId = recordId(arrow.id);
        const startCard = bindings.start ? cardById.get(bindings.start.toId) : undefined;
        const endCard = bindings.end ? cardById.get(bindings.end.toId) : undefined;
        const sourceId = startCard?.props.nodeId ?? `anchor-${edgeId}-start`;
        const targetId = endCard?.props.nodeId ?? `anchor-${edgeId}-end`;
        if (!startCard) {
          const point = transform.applyToPoint(terminals.start);
          nextNodes.push({ id: sourceId, type: 'architecture', position: { x: point.x, y: point.y }, data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true } });
        }
        if (!endCard) {
          const point = transform.applyToPoint(terminals.end);
          nextNodes.push({ id: targetId, type: 'architecture', position: { x: point.x, y: point.y }, data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true } });
        }
        // HTTP / HTTPS is only the initial suggestion. Once the user edits a
        // non-empty label, keep that text as the connection protocol.
        const currentLabel = renderPlaintextFromRichText(editor, arrow.props.richText).trim();
        const defaultProtocol = getArrowProtocol(startCard?.props.kind);
        const protocol = currentLabel || (editor.getEditingShapeId() === arrow.id ? '' : defaultProtocol);
        if (!currentLabel && protocol) editor.updateShape<TLArrowShape>({ id: arrow.id, type: 'arrow', props: { richText: toRichText(protocol), color: 'light-blue', labelColor: 'light-blue', font: 'mono', size: 's', kind: 'arc', arrowheadEnd: 'arrow' } });
        nextEdges.push({ id: edgeId, source: sourceId, target: targetId, type: 'architecture', selected: selected.has(arrow.id), label: protocol, data: { protocol, sourceAnchor: bindings.start?.props.isPrecise ? edgeAnchor(bindings.start.props.normalizedAnchor) : undefined, targetAnchor: bindings.end?.props.isPrecise ? edgeAnchor(bindings.end.props.normalizedAnchor) : undefined } });
      }
      onNodesChange(nextNodes);
      onEdgesChange(nextEdges);
      if (arrows.length > lastArrowCount.current && toolRef.current === 'connection' && editor.getPath() === 'arrow.idle') {
        editor.setCurrentTool('select');
        onToolChange('selection');
      }
      lastArrowCount.current = arrows.length;
    };
    const unsubscribe = editor.store.listen(() => {
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
      syncFrame.current = requestAnimationFrame(sync);
    });
    return () => {
      unsubscribe();
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
    };
  }, [editor, onNodesChange, onEdgesChange, onToolChange]);

  return (
    <div
      className="tldraw-engine"
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClickCapture={(event) => {
        if (!editor || event.button !== 0) return;
        const pagePoint = editor.screenToPage({ x: event.clientX, y: event.clientY });
        const card = editor.getShapesAtPoint(pagePoint, { hitInside: true })
          .find((shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE);
        if (!card) return;
        event.preventDefault();
        event.stopPropagation();
        editor.select(card.id);
        editor.setCurrentTool('select');
        window.requestAnimationFrame(() => editor.setEditingShape(card.id));
      }}
    >
      <ArchitectureCanvasActionsContext.Provider value={canvasActions}>
        <Tldraw
          hideUi
          components={tldrawComponents}
          overrides={tldrawOverrides}
          shapeUtils={shapeUtils}
          onMount={(nextEditor) => {
            nextEditor.user.updateUserPreferences({ colorScheme: 'dark', isSnapMode: true });
            nextEditor.updateInstanceState({ isGridMode: true });
            setArchitectureArrowStyles(nextEditor);
            setEditor(nextEditor);
            onMountEditor(nextEditor);
          }}
        />
      </ArchitectureCanvasActionsContext.Provider>
    </div>
  );
}
