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
   The plugin injects `globalThis.__WHICH_WORKTREE__` into served HTML, and the
   `<WorktreeBadge />` component renders a small badge with the worktree name
   and current branch.

## Install

```bash
npm install -D which-worktree
```

`svelte` (^5) and `vite` (>=5) are peer dependencies.

## Usage

Add the plugin in `vite.config.js` / `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { whichWorktree } from "which-worktree/vite";

export default defineConfig({
  plugins: [whichWorktree()]
});
```

The plugin only applies to `vite serve` — builds are untouched.

Then mount the badge once, e.g. in your root layout:

```svelte
<script>
  import { WorktreeBadge } from "which-worktree";
</script>

<WorktreeBadge />
```

The badge renders only when `import.meta.env.DEV` is true, so it never appears
in production builds.

### Options

```ts
whichWorktree({ badge: false }); // skip the HTML injection
whichWorktree();                 // default: inject __WHICH_WORKTREE__
```

### Badge props

```svelte
<WorktreeBadge position="top-left" />
```

`position` is one of `"top-left" | "top-right" | "bottom-left" | "bottom-right"`
(default `"bottom-right"`). Hovering the badge shows a tooltip with the full
worktree name, branch, and source checkout path.

## `worktreeInfo(root?)`

Also exported from `which-worktree/vite` for programmatic use. Detects the
checkout kind at `root` (defaults to `process.cwd()`) and never throws — it
falls back to the directory name:

```ts
import { worktreeInfo } from "which-worktree/vite";

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
