import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  Kbd,
} from '@/shared/ui';
import { ComponentSearchResults } from './ComponentSearchResults';
import { RegistryCategories } from './RegistryCategories';
import type { ComponentRegistryDialogProps } from './RequirementSidebar.types';

export function ComponentRegistryDialog({
  registryOpen,
  query,
  group,
  groupQuery,
  usesCommandKey,
  onRegistryOpenChange,
  onQueryChange,
  onGroupChange,
  onGroupQueryChange,
  onAddNode,
}: ComponentRegistryDialogProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const registryDialogRef = useRef<HTMLDivElement | null>(null);
  const shortcutKey = usesCommandKey ? '⌘' : 'Ctrl';
  let content = (
    <RegistryCategories
      activeGroup={group}
      groupQuery={groupQuery}
      onGroupChange={onGroupChange}
      onGroupQueryChange={onGroupQueryChange}
      onAddNode={onAddNode}
    />
  );

  if (query.trim()) {
    content = <ComponentSearchResults query={query} onAddNode={onAddNode} />;
  }

  return (
    <Dialog open={registryOpen} onOpenChange={onRegistryOpenChange}>
      <DialogContent
        ref={registryDialogRef}
        centered
        classNames={{
          body: 'component-library__body',
          content: 'component-library',
        }}
        size="410px"
        showCloseButton={false}
      >
        <DialogHeader className="component-library__header">
          <div>
            <DialogTitle className="panel-id">COMPONENT LIBRARY</DialogTitle>
            <DialogDescription>Search or browse by category</DialogDescription>
          </div>
          <IconButton
            label="Close component library"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRegistryOpenChange(false)}
          >
            <X />
          </IconButton>
        </DialogHeader>
        <label className="catalog-search">
          <Search />
          <Input
            ref={searchRef}
            aria-label="Search components"
            placeholder="Search components…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <Kbd>{shortcutKey} K</Kbd>
        </label>
        {content}
      </DialogContent>
    </Dialog>
  );
}
