# API architecture

The API follows a small ports-and-adapters layout while keeping the HTTP contract deliberately simple.

```text
cmd/server -> transport/httpapi -> application -> domain
     |                                  ^
     +-> config                         |
     +-> evaluator ---------------------+
     +-> exercises -> domain
```

- `internal/domain` contains transport-independent entities and result types.
- `internal/application` owns the use case and defines the evaluator port it needs.
- `internal/evaluator` implements that port with deterministic graph traversal.
- `internal/exercises` is the catalog of exercise definitions.
- `internal/transport/httpapi` owns routing, CORS, bounded strict JSON decoding, and public error responses.
- `cmd/server` is the composition root and owns process signals, HTTP timeouts, and graceful shutdown.

Dependencies point inward: domain code has no infrastructure imports, and the application layer does not know about HTTP or the concrete evaluator.

## HTTP contract

- `GET /api/exercise` returns the current exercise.
- `POST /api/evaluate` accepts an architecture and returns `{ "results": [...] }`.
- Unknown JSON fields, malformed JSON, multiple JSON values, and request bodies larger than 1 MiB are rejected.

Configuration is provided through environment variables:

- `API_ADDRESS` defaults to `:8081`.
- `API_ALLOWED_ORIGIN` defaults to `http://localhost:5173`.

Run the backend checks from this directory:

```bash
go test ./...
go build ./cmd/server
```
