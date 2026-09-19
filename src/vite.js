import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { searchForWorkspaceRoot } from 'vite';

/**
 * Identify the checkout at `root`: cow pasture, git worktree, plain repo or
 * bare directory. Never throws — falls back to the directory name.
 * @param {string} [root]
 * @returns {import('./types.js').WorktreeInfo}
 */
export function worktreeInfo(root = process.cwd()) {
	const dirName = basename(root);
	try {
		const ctx = JSON.parse(readFileSync(join(root, '.cow-context'), 'utf8'));
		return {
			name: ctx.name ?? dirName,
			branch: ctx.branch,
			source: ctx.source,
			kind: 'cow'
		};
	} catch {}

	const gitEntry = join(root, '.git');
	try {
		const stat = lstatSync(gitEntry);
		if (stat.isFile()) {
			const match = readFileSync(gitEntry, 'utf8').match(/^gitdir:\s*(.+)$/m);
			if (match) {
				const gitdir = resolve(root, match[1].trim());
				return {
					name: basename(gitdir),
					branch: readBranch(join(gitdir, 'HEAD')),
					source: readSource(gitdir),
					kind: 'worktree'
				};
			}
		}
		if (stat.isDirectory()) {
			return { name: dirName, branch: readBranch(join(gitEntry, 'HEAD')), kind: 'repo' };
		}
	} catch {}
	return { name: dirName, kind: 'dir' };
}

function readBranch(headFile) {
	try {
		const head = readFileSync(headFile, 'utf8').trim();
		if (head.startsWith('ref:')) {
			const ref = head.slice(4).trim();
			return ref.startsWith('refs/heads/') ? ref.slice(11) : ref;
		}
		return head ? head.slice(0, 12) : undefined;
	} catch {
		return undefined;
	}
}

function readSource(gitdir) {
	try {
		const common = readFileSync(join(gitdir, 'commondir'), 'utf8').trim();
		return dirname(resolve(gitdir, common));
	} catch {
		return undefined;
	}
}

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
