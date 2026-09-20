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
import { ComponentCatalog } from './ComponentCatalog';
import { ComponentSearchResults } from './ComponentSearchResults';
import { RegistryCategories } from './RegistryCategories';
import type { ComponentRegistryDialogProps } from './RequirementSidebar.types';
import './component-library.css';

export function ComponentRegistryDialog({
  registryOpen,
  query,
  group,
  usesCommandKey,
  onRegistryOpenChange,
  onQueryChange,
  onGroupChange,
  onAddNode,
}: ComponentRegistryDialogProps) {
  const shortcutKey = usesCommandKey ? '⌘' : 'Ctrl';
  let content = <ComponentCatalog group={group} onAddNode={onAddNode} />;

  if (query.trim()) {
    content = <ComponentSearchResults query={query} onAddNode={onAddNode} />;
  }

  return (
    <Dialog open={registryOpen} onOpenChange={onRegistryOpenChange}>
      <DialogContent
        centered
        yOffset="12px"
        xOffset="8px"
        classNames={{
          body: 'component-catalog-dialog__body',
          content: 'component-catalog-dialog',
        }}
        size="min(1180px, calc(100vw - 48px))"
        showCloseButton={false}
      >
        <DialogHeader className="component-catalog-dialog__header" role="presentation">
          <div>
            <DialogTitle aria-label="COMPONENT LIBRARY">Components</DialogTitle>
            <DialogDescription>Choose a component for your architecture.</DialogDescription>
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
        <label className="component-catalog-search">
          <Search aria-hidden="true" focusable="false" />
          <Input
            autoFocus
            data-autofocus
            aria-label="Search components"
            placeholder="Search names, types, or capabilities"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <Kbd>{shortcutKey} K</Kbd>
        </label>
        <div className="component-catalog-dialog__workspace">
          <RegistryCategories
            group={group}
            onGroupChange={onGroupChange}
            onQueryChange={onQueryChange}
          />
          <div className="component-catalog-dialog__results">{content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
