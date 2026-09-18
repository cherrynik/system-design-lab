import { createContext, useContext } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position, useReactFlow } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { ArchitectureEdge as ArchitectureEdgeModel } from '../model/types';

export const ArchitectureEdgeActionsContext = createContext<{
  beginEdgeEdit: () => void;
  updateEdgeBend: (id: string, bend: { along: number; normal: number }) => void;
}>({ beginEdgeEdit: () => {}, updateEdgeBend: () => {} });

const samplePath = (path: string) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  element.setAttribute('d', path);
  const length = element.getTotalLength();
  return element.getPointAtLength(length * .5);
};

export function ArchitectureEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps<ArchitectureEdgeModel>) {
  const flow = useReactFlow();
  const actions = useContext(ArchitectureEdgeActionsContext);
  const fallback = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const bend = data?.bend;
  const sourceIsFree = Boolean(flow.getNode(source)?.data.isAnchor);
  const targetIsFree = Boolean(flow.getNode(target)?.data.isAnchor);
  const dx=targetX-sourceX,dy=targetY-sourceY,distance=Math.max(1,Math.hypot(dx,dy)),ux=dx/distance,uy=dy/distance;
  const tangent=(position:Position)=>position===Position.Left?[-1,0]:position===Position.Right?[1,0]:position===Position.Top?[0,-1]:[0,1];
  const sourceDirection=sourceIsFree?[ux,uy]:tangent(sourcePosition);
  const targetDirection=targetIsFree?[ux,uy]:tangent(targetPosition);
  const sourceLength=Math.min(80,distance*.4),targetLength=Math.min(60,distance*.3);
  const freePath=`M ${sourceX} ${sourceY} C ${sourceX+sourceDirection[0]*sourceLength} ${sourceY+sourceDirection[1]*sourceLength} ${targetX+(targetIsFree?-targetDirection[0]:targetDirection[0])*targetLength} ${targetY+(targetIsFree?-targetDirection[1]:targetDirection[1])*targetLength} ${targetX} ${targetY}`;
  const perpendicularX=-uy,perpendicularY=ux;
  const bendPoint=bend?{
    x:(sourceX+targetX)/2+bend.along*ux+bend.normal*perpendicularX,
    y:(sourceY+targetY)/2+bend.along*uy+bend.normal*perpendicularY,
  }:null;
  const quadraticControl=bendPoint?{x:2*bendPoint.x-.5*(sourceX+targetX),y:2*bendPoint.y-.5*(sourceY+targetY)}:null;
  const path = quadraticControl ? `M ${sourceX} ${sourceY} Q ${quadraticControl.x} ${quadraticControl.y} ${targetX} ${targetY}` : sourceIsFree||targetIsFree ? freePath : fallback[0];
  const midpoint = bendPoint??samplePath(path);
  const startControlDrag = (event: ReactPointerEvent<Element>) => {
    event.preventDefault();
    event.stopPropagation();
    actions.beginEdgeEdit();
    const move = (pointerEvent: PointerEvent) => {
      const desiredMidpoint = flow.screenToFlowPosition({ x: pointerEvent.clientX, y: pointerEvent.clientY });
      const offsetX=desiredMidpoint.x-(sourceX+targetX)/2;
      const offsetY=desiredMidpoint.y-(sourceY+targetY)/2;
      actions.updateEdgeBend(id, {
        along:offsetX*ux+offsetY*uy,
        normal:offsetX*perpendicularX+offsetY*perpendicularY,
      });
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  };

  return <>
    <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={28}/>
    {selected && !data?.protocol && <g className="edge-control-points" aria-hidden="true">
      <circle className="edge-control-point--editable" cx={midpoint.x} cy={midpoint.y} r={5} onPointerDown={startControlDrag}/>
    </g>}
    {data?.protocol && <EdgeLabelRenderer>
      <span
        className={`flow-edge-label ${selected ? 'flow-edge-label--editable' : ''}`}
        style={{transform:`translate(-50%, -50%) translate(${midpoint.x}px, ${midpoint.y}px)`}}
        onPointerDown={selected ? startControlDrag : undefined}
      >{data.protocol}</span>
    </EdgeLabelRenderer>}
  </>;
}

export const architectureEdgeTypes = { architecture: ArchitectureEdge };
