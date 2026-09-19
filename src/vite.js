import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { searchForWorkspaceRoot } from 'vite';
import { worktreeInfo } from './info.js';

export { worktreeInfo };

/**
 * Real locations of symlinked packages inside `root/node_modules`. Worktree
 * tools share dependencies by symlinking each entry into a source checkout,
 * which puts realpath-resolved files outside Vite's fs allow list.
 * @param {string} root
 * @returns {Set<string>}
 */
function linkedPackageRoots(root) {
	const roots = new Set();
	const nm = join(root, 'node_modules');
	let entries;
	try {
		entries = readdirSync(nm);
	} catch {
		return roots;
	}
	for (const entry of entries) {
		collect(join(nm, entry), roots);
		if (!entry.startsWith('@')) continue;
		try {
			for (const sub of readdirSync(join(nm, entry))) {
				collect(join(nm, entry, sub), roots);
			}
		} catch {}
	}
	return roots;
}

function collect(path, roots) {
	try {
		if (lstatSync(path).isSymbolicLink()) roots.add(dirname(realpathSync(path)));
	} catch {}
}

/**
 * Vite plugin for worktree-based development.
 *
 * - extends `server.fs.allow` with the real locations of symlinked
 *   `node_modules` entries so `/@fs/...` asset URLs stop 403ing
 * - serves `WorktreeInfo` JSON at `GET /__which-worktree__` so
 *   `<WorktreeBadge />` can show which checkout is running
 *
 * Uses a dev-server middleware instead of `transformIndexHtml`, so it also
 * works in SvelteKit where Vite's HTML transform never runs.
 *
 * @returns {import('vite').Plugin}
 */
export function whichWorktree() {
	let root = process.cwd();
	return {
		name: 'which-worktree',
		apply: 'serve',
		config(config) {
			root = config.root ?? root;
			return {
				server: {
					fs: {
						allow: [...new Set([searchForWorkspaceRoot(root), ...linkedPackageRoots(root)])]
					}
				}
			};
		},
		configureServer(server) {
			server.middlewares.use('/__which-worktree__', (_req, res) => {
				res.setHeader('content-type', 'application/json');
				res.setHeader('cache-control', 'no-store');
				res.end(JSON.stringify(worktreeInfo(root)));
			});
		}
	};
}

export default whichWorktree;
