import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { Handle, NodeToolbar, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { FiX } from 'react-icons/fi';
import { architectureMeta, architectureVariants, getArchitectureVariant } from '../model/catalog';
import type { ArchitectureNode, EdgeAnchor } from '../model/types';

type EndpointHandle = EdgeAnchor & { id: string; type: 'source' | 'target' };
export const ArchitectureActionsContext = createContext<{ inspectorId: string|null; edgeEndpointIds:Set<string>; endpointHandles:Map<string,EndpointHandle[]>; dropTargetId:string|null; setInspectorId: (id:string|null)=>void; updateVariant:(id:string,v:string)=>void; renameNode:(id:string,label:string)=>void; openMenu:(id:string,e:ReactMouseEvent)=>void }>({ inspectorId:null, edgeEndpointIds:new Set(), endpointHandles:new Map(), dropTargetId:null, setInspectorId:()=>{}, updateVariant:()=>{}, renameNode:()=>{}, openMenu:()=>{} });

export function ArchitectureCard({ id, data, selected }: NodeProps<ArchitectureNode>) {
  const actions = useContext(ArchitectureActionsContext);
  const updateNodeInternals = useUpdateNodeInternals();
  const endpointHandles = actions.endpointHandles.get(id)??[];
  useEffect(()=>updateNodeInternals(id),[id,endpointHandles,updateNodeInternals]);
  if (data.isAnchor) return <div className={`free-anchor-node ${actions.edgeEndpointIds.has(id)?'free-anchor-node--selected-edge-endpoint':''}`}><Handle id="top" type="source" position={Position.Top}/><Handle id="right" type="source" position={Position.Right}/><Handle id="bottom" type="source" position={Position.Bottom}/><Handle id="left" type="source" position={Position.Left}/></div>;
  const variant = getArchitectureVariant(data.kind, data.variantId);
  const Icon = variant.icon;
  const inspect = actions.inspectorId === id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelEditRef = useRef(false);
  useEffect(() => { if (!editing) setDraft(data.label); }, [data.label, editing]);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  const saveName = () => { const nextName = draft.trim(); if (!cancelEditRef.current && nextName && nextName !== data.label) actions.renameNode(id, nextName); cancelEditRef.current = false; setEditing(false); };
  return <>
    <NodeToolbar isVisible={inspect} position={Position.Top} offset={14}>
      <aside className="component-inspector component-inspector--flow" onPointerDown={(event)=>event.stopPropagation()}>
        <div className="component-inspector__header"><span className="panel-id">COMPONENT INSPECTOR</span><button onClick={()=>actions.setInspectorId(null)} aria-label="Close inspector"><FiX/></button></div>
        <div className="component-inspector__identity"><Icon className={`component-logo component-logo--${data.kind}`}/><span><strong>{variant.label}</strong><small>{architectureMeta[data.kind].role}</small></span></div>
        <span className="inspector-label">IMPLEMENTATION</span><div className="inspector-variants">{architectureVariants[data.kind].map(candidate=>{const VariantIcon=candidate.icon;return <button key={candidate.id} className={candidate.id===variant.id?'inspector-variant--active':''} onClick={()=>actions.updateVariant(id,candidate.id)}><VariantIcon/><span><strong>{candidate.label}</strong><small>{candidate.description}</small></span></button>})}</div>
        <span className="inspector-label">CAPABILITIES</span><div className="inspector-capabilities">{variant.capabilities.map(capability=><code key={capability}>{capability}</code>)}</div>
      </aside>
    </NodeToolbar>
    <div className={`flow-node flow-node--${data.kind} ${selected?'flow-node--selected':''} ${actions.edgeEndpointIds.has(id)?'flow-node--selected-edge-endpoint':''} ${actions.dropTargetId===id?'flow-node--drop-target':''}`} onContextMenu={(event)=>actions.openMenu(id,event)} onDoubleClick={(event)=>{event.stopPropagation();cancelEditRef.current=false;setEditing(true)}}>
      <Icon className={`component-logo component-logo--${data.kind}`}/><span>{editing?<input ref={inputRef} className="flow-node__name-input nodrag" value={draft} onChange={(event)=>setDraft(event.target.value)} onPointerDown={(event)=>event.stopPropagation()} onDoubleClick={(event)=>event.stopPropagation()} onBlur={saveName} onKeyDown={(event)=>{if(event.key==='Enter')event.currentTarget.blur();if(event.key==='Escape'){cancelEditRef.current=true;setDraft(data.label);setEditing(false)}}}/>:<strong>{data.label}</strong>}<small>{architectureMeta[data.kind].role}</small></span>
      {[Position.Top,Position.Right,Position.Bottom,Position.Left].map((position)=><Handle key={position} id={position} type="source" position={position} className="flow-handle"/>)}
      {endpointHandles.map(handle=>{const vertical=handle.side==='left'||handle.side==='right';const style=(vertical?{top:`${handle.offset*100}%`}:{left:`${handle.offset*100}%`}) as CSSProperties;return <Handle key={handle.id} id={handle.id} type={handle.type} position={Position[handle.side[0].toUpperCase()+handle.side.slice(1) as keyof typeof Position]} style={style} className="flow-handle flow-handle--edge-anchor"/>})}
    </div>
  </>;
}

export const architectureNodeTypes = { architecture: ArchitectureCard };
