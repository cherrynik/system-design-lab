# System Design Lab

An intentionally small proof of concept for a deterministic system-design evaluator.

The first vertical slice asks one question: **can a client reach a service through the architecture graph?** The evaluator checks reachability rather than comparing the graph with one reference topology.

## Repository layout

- `web/` — tldraw-based architecture editor and validation results.
- `api/` — Go HTTP API and deterministic evaluator.
- `docs/v0.1.md` — exact scope and acceptance criteria.

## Run locally

Requirements: Go 1.22+, Node.js 22+, pnpm 10+.

```bash
make install
make dev-api
make dev-web
```

Open `http://localhost:5173`. The API listens on `http://localhost:8081`.

## Verify

```bash
make test
make build
```
