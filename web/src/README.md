# Frontend architecture

The frontend follows Feature-Sliced Design. Dependencies point only downward:

`app → pages → features → entities → shared`

- `app` initializes providers and global styles.
- `pages` compose complete screens and own page-level orchestration.
- `features` contain user actions and their API/model code.
- `entities` contain domain models and domain UI.
- `shared` contains domain-agnostic types and reusable infrastructure.

Each slice exposes a public API through `index.ts`. Code outside a slice imports from that public API rather than from its internal folders.
