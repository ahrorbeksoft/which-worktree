# which-worktree

Vite plugin for worktree-based development in Svelte 5 apps. It does two things:

1. **Fixes `server.fs.allow` for symlinked `node_modules`.** Worktree tools
   (git worktrees, cow pastures) share dependencies by symlinking each entry
   into a source checkout. Vite then realpath-resolves those files to locations
   outside the project root, and `/@fs/...` asset requests fail with 403. The
   plugin scans `node_modules` for symlinks and adds their real parent
   directories — plus the detected workspace root — to the fs allow list.
2. **Shows which checkout is running.** When you have several worktrees with
   dev servers on different ports, it's easy to lose track of which is which.
   The plugin adds a `GET /__which-worktree__` dev-server endpoint that returns
   the checkout info as JSON, and the `<WorktreeBadge />` component fetches it
   and renders a small badge with the worktree name and current branch.

Using a server endpoint instead of HTML injection means it works everywhere —
including SvelteKit, where Vite's `transformIndexHtml` never runs — and the
info is computed per request, so the badge reflects branch switches without
restarting the dev server.

## Install

```bash
npm install -D which-worktree
```

`svelte` (^5), `react` (>=16.8) and `vite` (>=5) are peer dependencies — all
optional, install only what your framework uses.

## Usage — Vite (React, Vue, Solid, SvelteKit, Astro, …)

Add the plugin in `vite.config.js` / `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { whichWorktree } from "which-worktree/vite";

export default defineConfig({
  plugins: [whichWorktree()]
});
```

The plugin only applies to `vite serve` — builds are untouched. This is all a
Vite app needs: the fs.allow fix and the `GET /__which-worktree__` endpoint
both come from the plugin. Then pick the badge for your framework.

### Svelte / SvelteKit

```svelte
<script>
  import { WorktreeBadge } from "which-worktree";
</script>

<WorktreeBadge />
```

### React (Vite, React Router, …)

```tsx
import { WorktreeBadge } from "which-worktree/react";

export default function Root() {
  return (
    <>
      <Outlet />
      <WorktreeBadge />
    </>
  );
}
```

### Any other framework (Vue, Solid, Astro, plain JS)

```ts
import { attachWorktreeBadge } from "which-worktree/badge";

attachWorktreeBadge(); // call once in your client entry
```

All badges render only in development and fetch `/__which-worktree__` from the
same origin — with no plugin running the request simply fails and nothing
shows.

## Usage — Next.js

Next.js doesn't use Vite, so there's no `fs.allow` fix to apply — symlinked
`node_modules` already resolve through webpack/Turbopack. To get the badge,
expose the endpoint with a route handler:

```ts
// app/__which-worktree__/route.ts
export { GET, dynamic } from "which-worktree/next";
```

Pages Router instead:

```ts
// pages/api/__which-worktree__.ts
export { apiHandler as default } from "which-worktree/next";
```

Then mount the React badge in your root layout:

```tsx
// app/layout.tsx
import { WorktreeBadge } from "which-worktree/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WorktreeBadge />
        {/* Pages Router lives at /api/... — pass the endpoint: */}
        {/* <WorktreeBadge endpoint="/api/__which-worktree__" /> */}
      </body>
    </html>
  );
}
```

### Endpoint

```
GET /__which-worktree__ → {"name":"my-feature","branch":"feat/x","source":"/abs/path","kind":"worktree"}
```

`WorktreeInfo` is recomputed on each request.

### Badge props

```svelte
<WorktreeBadge position="top-left" endpoint="/api/__which-worktree__" />
```

- `position` — `"top-left" | "top-right" | "bottom-left" | "bottom-right"`
  (default `"bottom-right"`)
- `endpoint` — where to fetch `WorktreeInfo` (default `"/__which-worktree__"`)

Hovering the badge shows a tooltip with the full worktree name, branch, and
source checkout path.

## `worktreeInfo(root?)`

Exported from `which-worktree/info` (also re-exported by `which-worktree/vite`
and `which-worktree/next`) for programmatic use. It's pure Node with no Vite
dependency, so custom dev servers (Express, Fastify, webpack `devServer`
middleware, Angular CLI proxies) can serve `WorktreeInfo` however they like —
the Vite plugin and Next.js handlers are both built on it. Detects the
checkout kind at `root` (defaults to `process.cwd()`) and never throws — it
falls back to the directory name:

```ts
import { worktreeInfo } from "which-worktree/info";

worktreeInfo(); // { name, branch?, source?, kind }
```

```ts
interface WorktreeInfo {
  /** Worktree/pasture name, or the directory basename for plain checkouts. */
  name: string;
  /** Current branch, or short sha when detached. */
  branch?: string;
  /** Absolute path of the source checkout this worktree shares from. */
  source?: string;
  /** How the worktree was detected. */
  kind: "cow" | "worktree" | "repo" | "dir";
}
```

Detection order:

- `.cow-context` file → `cow` pasture
- `.git` **file** → linked git `worktree` (reads `HEAD` for the branch and
  `commondir` for the source checkout)
- `.git` directory → plain `repo`
- neither → bare `dir`

## Publishing

```bash
npm run release            # interactive: prompts for version bump, then publishes
npm run release -- patch   # bump + publish non-interactively
npm run release -- --dry-run
```

The script checks npm auth (offering `npm login` if needed), applies the version
bump via `npm version`, and runs `npm publish --access public`.

## License

ISC
