# Frontend architecture

The frontend follows Feature-Sliced Design. Dependencies point only downward:

`app → pages → widgets → features → entities → shared`

- `app` initializes providers and global styles.
- `pages` compose complete screens and own page-level orchestration.
- `widgets` compose independent workspace regions such as the requirements sidebar, canvas workbench, and validation runner.
- `features` contain user actions and their API/model code.
- `entities` contain domain models and domain UI.
- `shared` contains domain-agnostic types and reusable infrastructure.

Each slice exposes a public API through `index.ts`. Code outside a slice imports from that public API rather than from its internal folders.

## UI contract

- Mantine owns primitive behavior, focus management, menus, overlays, and accessibility behind the `shared/ui` public API. Product slices do not import interactive Mantine primitives directly.
- tldraw is the single graph runtime for the editable canvas and every reference solution.
- react-resizable-panels owns the resizable workspace boundaries.
- Shared design tokens live in `app/styles/tokens.css`; feature CSS consumes semantic variables.
- Every production component has a colocated Storybook story before it can pass `pnpm storybook:check`.
- Storybook stories run in Chromium with interaction and accessibility checks through `pnpm storybook:test`.
- Each production TSX file exports one component. Props and exported model contracts live in adjacent `*.types.ts` files.
- JSX conditional expressions are rejected; derive state before rendering or use explicit branches.

`pnpm architecture:check`, `pnpm storybook:check`, and `pnpm storybook:test` enforce these rules in CI.
