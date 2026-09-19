import { lstatSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

/**
 * Identify the checkout at `root`: cow pasture, git worktree, plain repo or
 * bare directory. Never throws — falls back to the directory name.
 *
 * Pure Node — no Vite dependency, so it also runs inside Next.js route
 * handlers and other dev servers.
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
