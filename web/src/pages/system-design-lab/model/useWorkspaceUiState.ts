import { useCallback, useState } from 'react';
import { referenceSolutions, type ArchitectureNodeKind } from '@/entities/architecture';
import type { CanvasTool, WorkspaceView } from '@/widgets/architecture-workbench';
import type { WorkspaceUiState } from './WorkspaceUiState.types';

export function useWorkspaceUiState(): WorkspaceUiState {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('canvas');
  const [selectedSolutionId, setSelectedSolutionId] = useState(referenceSolutions[0].id);
  const [requirementsCollapsed, setRequirementsCollapsed] = useState(false);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<ArchitectureNodeKind | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [tool, setTool] = useState<CanvasTool>('selection');

  const openRegistry = useCallback(() => {
    setRequirementsCollapsed(false);
    setQuery('');
    setGroup(null);
    setRegistryOpen(true);
  }, []);

  const handleRegistryOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        openRegistry();
        return;
      }
      setRegistryOpen(false);
    },
    [openRegistry],
  );

  return {
    workspaceView,
    setWorkspaceView,
    selectedSolutionId,
    setSelectedSolutionId,
    requirementsCollapsed,
    setRequirementsCollapsed,
    requirementsExpanded,
    setRequirementsExpanded,
    layersExpanded,
    setLayersExpanded,
    registryOpen,
    query,
    setQuery,
    group,
    setGroup,
    versionsOpen,
    setVersionsOpen,
    tool,
    setTool,
    openRegistry,
    setRegistryOpen,
    handleRegistryOpenChange,
  };
}
