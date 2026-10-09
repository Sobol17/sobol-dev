# Static demonstration

This build publishes the landing and the CRM interface with fictional leads. It reuses the production landing sections, CRM views, tokens and UI primitives. It does not publish server routes, database files, authentication or notification clients.

- Landing: https://sobol17.github.io/sobol-dev/
- CRM: https://sobol17.github.io/sobol-dev/admin/
- The brief validates in the browser and opens a labelled demonstration result. It never sends or stores the entered values.
- A visible demo bar and noindex metadata distinguish this build from the server application.
- The normal build still uses adapter-node. BUILD_DEMO selects separate routes, output and adapter-static.

## Build and inspect

```sh
pnpm install --frozen-lockfile
pnpm check:demo
pnpm test:demo
```

The browser test command builds the static files and serves them under `/sobol-dev/`, matching GitHub Pages. For manual inspection after building, run `node scripts/serve-demo.mjs` and open `http://127.0.0.1:4176/sobol-dev/`.

The demo config uses its own `.svelte-kit-demo` output. SvelteKit also checks the root tsconfig and prints an extends advisory; the dedicated demo type check uses `demo/tsconfig.json` and must finish with zero errors and warnings.

## Publish

Run `pnpm build:demo`. Publish only the contents of `build-demo/` to the `gh-pages` branch of `Sobol17/sobol-dev`. Keep `.nojekyll` so Pages serves `_app` assets. Preserve existing deployment history when updating the branch. Never copy `.env`, `var`, the Node build or the repository root into the published artifact.

GitHub Pages serves the root of `gh-pages`. Publishing this artifact does not merge application PRs or deploy the Node service. Review and republish after changes; source commits do not update the demo automatically.
