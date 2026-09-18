# Design QA

- Source visual truth: user-provided system design lab reference
- Implementation: `http://127.0.0.1:5173/`
- Implementation capture: Codex in-app browser capture, 1296 x 904 CSS pixels, device scale 1
- State: initial unsolved exercise
- Source pixels: 1296 x 904
- Implementation pixels: 1296 x 904
- Density normalization: none required

## Full-view comparison

The implementation matches the reference's primary composition: specification and component registry on the left, architecture canvas in the main workspace, validation action in the canvas header, and a persistent test runner below the canvas. The dark navy palette, mono technical labels, bordered data rows, compact component groups, and mint validation state follow the reference.

The implementation uses a focused tldraw toolbar and architecture-specific canvas interactions while keeping the exercise state editable.

## Focused comparison

- Requirement panel: ID, required state, structured request metadata, acceptance rule, and component registry follow the reference hierarchy.
- Component registry: real browser, NGINX, and Go icons are provided by `react-icons`; search filters the registry.
- Canvas: component names and roles match the registry while tldraw provides binding, reconnect, selection, viewport, and keyboard behavior.
- Test runner: persistent, internally scrollable run history remains wired to the Go validation API.

## Findings

No actionable P0, P1, or P2 differences remain for the MVP scope.

## Comparison history

- Initial pass: the right validation sidebar conflicted with the selected reference's bottom test-runner composition.
- Fix: moved validation into a bottom runner, moved Validate to the canvas header, widened the specification panel, and rebuilt the registry around grouped concrete components.
- Post-fix evidence: the 1296 x 904 in-app browser capture preserves the reference hierarchy without revealing the solved architecture.

## Follow-up polish

- P3: enrich successful runner output with a compact visual path once the API returns the involved node sequence.
- P3: add more component groups only when the exercise catalog expands beyond the MVP.

final result: passed
