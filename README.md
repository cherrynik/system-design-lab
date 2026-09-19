# System Design Lab

A technical workbench for building and validating system-design graphs. The first exercise asks one deterministic question: **can a request source reach an HTTP handler through the submitted architecture?** The evaluator checks the graph's capabilities and reachability instead of comparing it with one fixed reference drawing.

The editor and every reference solution use the same tldraw runtime, node renderer, connection model, validation flow, and test runner. Mantine supplies accessible interface primitives, react-resizable-panels owns workspace resizing, and Storybook is the contract for every production UI component.

## Repository layout

- `web/` — FSD React application, universal tldraw canvas, design system, Storybook, and browser tests.
- `api/` — Go HTTP API and deterministic evaluator.
- `docs/v0.1.md` — exact scope and acceptance criteria.

The frontend dependency direction is `app → pages → widgets → features → entities → shared`. Slices expose public APIs through `index.ts`; architecture checks reject upward and cross-slice imports. Production UI follows one component per file, adjacent `*.types.ts` contracts, and no conditional expressions inside JSX. `pnpm storybook:check` rejects components that are missing from Storybook.

## Run locally

Requirements: Go 1.22+, Node.js 22+, and pnpm 11+. Go is read from `PATH` by default; if you manage it through mise, pass `GO="mise exec -- go"` to the Make target.

```bash
make install
make dev-api
make dev-web
```

Open `http://localhost:5173`. The API listens on `http://localhost:8081`.

Run the component catalogue separately with:

```bash
make storybook
```

Storybook opens on `http://localhost:6006`.

## Verify

```bash
make check
```

`make check` runs backend race tests, vet, and build; frontend type checking, linting, formatting, architecture and Storybook guards, browser-based Storybook interaction and accessibility tests, coverage, production builds, and Playwright workflows. The same contract runs in GitHub Actions on every pull request and push to `main`.
