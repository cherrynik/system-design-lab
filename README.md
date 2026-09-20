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

Start with **Design system / Foundations** for the interface rules and tokens. **Primitives**
contains shared controls, and **Workspace** contains the canvas, inspector, sidebar, and
validation runner with their states. Use the search in Storybook to jump to a component;
the **Docs** tab describes its props and **Canvas** shows the interactive example.

## Verify

```bash
make check
```

`make check` runs backend race tests, vet, and build; frontend type checking, linting, formatting, architecture and Storybook guards, browser-based Storybook interaction and accessibility tests, coverage, production builds, and Playwright workflows. GitHub Actions runs these checks on pull requests and pushes to `main`, except the full Playwright workflow suite. That suite is currently opt-in: use **Verify platform → Run workflow → Run the full browser workflow suite**. The small static Pages checks still run before deployment.

## Public demo (GitHub Pages)

The `Verify platform` workflow verifies main, builds the static app, tests it without an API server, and publishes it to GitHub Pages. Configure **Settings → Pages → Source → GitHub Actions** once. The default address is https://cherrynik.github.io/system-design-lab/.

Pages builds use the existing Go API compiled to WebAssembly in a Web Worker. The same handlers and evaluator run locally in the browser; no evaluation rules are duplicated in TypeScript. The canvas and saved attempts stay in the visitor's browser. The first validation loads the Go runtime. Local development continues to use the Go HTTP server.

Build and verify the static version (Go must be on PATH):

```sh
pnpm --dir web build:pages
pnpm --dir web test:pages
pnpm --dir web exec vite preview --mode pages
```

For a custom domain, set it in GitHub Pages settings and configure its DNS record. The pipeline reads the Pages base path and rebuilds the asset URLs accordingly. Set `VITE_BASE_PATH=/` when building locally for a domain root. Generated `web/public/runtime/` files are ignored; CI rebuilds the Wasm binary and copies the matching Go runtime and license.

### Canvas SDK dependency

tldraw is pinned to `5.4.2`. The checked-in `patches/@tldraw__editor@5.4.2.patch` supplies this project's runtime override: the SDK manager starts in the `licensed` state with enabled feature flags, without validating a key. pnpm applies the patch during installation, and the frozen lockfile makes local and CI builds use the same dependency. No separate fork or package registry is required.

The SDK retains its upstream license and copyright notices; this repository does not relicense tldraw or grant downstream users additional rights. This override is specific to this project's integration. Upgrading the SDK requires reviewing the patch and rerunning the browser checks.

The Pages job tests the final build using its production hostname and waits beyond the SDK's five-second initialization gate before checking that the canvas remains usable. To run that check locally:

```sh
PAGES_PUBLIC_URL=https://cherrynik.github.io/system-design-lab/ pnpm --dir web test:pages
```

To restore the stock SDK, remove the patch with `pnpm patch-remove @tldraw/editor@5.4.2`, rebuild, and configure a license key according to https://tldraw.dev/sdk-features/license-key before publishing.
