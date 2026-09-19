export function RequirementDocument() {
  return (
    <article className="requirements-content" aria-labelledby="requirement-title">
      <header className="requirement-document__header">
        <p className="requirement-document__eyebrow">System design task</p>
        <h1 id="requirement-title">Route web traffic to an HTTP API</h1>
        <p className="lead">
          Design a request path that starts in a browser and reaches an HTTP handler.
        </p>
      </header>
      <section className="requirement-document__section" aria-labelledby="request-contract-title">
        <h2 id="request-contract-title">Request contract</h2>
        <dl className="requirement-contract">
          <div>
            <dt>Entry point</dt>
            <dd>Web Browser</dd>
          </div>
          <div>
            <dt>Request</dt>
            <dd>
              <code>GET /{'{path}'}</code>
            </dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd>
              <code>HTTPS</code>
            </dd>
          </div>
          <div>
            <dt>Target capability</dt>
            <dd>
              <code>http.handle</code>
            </dd>
          </div>
        </dl>
      </section>
      <section className="requirement-document__section" aria-labelledby="acceptance-title">
        <h2 id="acceptance-title">Acceptance</h2>
        <p>The graph must contain a valid path from the request source to the handler.</p>
        <pre className="acceptance-rule">
          <code>
            <i>path</i>(source: http.request, target: http.handle) == <b>true</b>
          </code>
        </pre>
      </section>
    </article>
  );
}
