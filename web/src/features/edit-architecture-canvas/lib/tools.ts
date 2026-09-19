import type { ArchitectureCanvasTool } from '../model/architectureCanvas.types';

export function tldrawToolForCanvasTool(tool: ArchitectureCanvasTool) {
  if (tool === 'selection') return 'select';
  if (tool === 'connection') return 'arrow';
  return 'hand';
}

export function canvasToolForTldrawTool(tool: string): ArchitectureCanvasTool {
  if (tool === 'hand') return 'hand';
  if (tool === 'arrow') return 'connection';
  return 'selection';
}
