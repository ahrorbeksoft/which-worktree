const DEV = import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';

const POSITIONS = {
	'top-left': 'top:0.75rem;left:0.75rem',
	'top-right': 'top:0.75rem;right:0.75rem',
	'bottom-left': 'bottom:0.75rem;left:0.75rem',
	'bottom-right': 'bottom:0.75rem;right:0.75rem'
};

const BADGE_CSS =
	'position:fixed;z-index:99999;display:inline-flex;align-items:center;gap:0.375rem;' +
	'padding:0.125rem 0.5rem;font:500 11px/1.5 ui-monospace,SFMono-Regular,monospace;' +
	'color:#e4e4e7;background:rgb(24 24 27 / 0.85);border:1px solid rgb(255 255 255 / 0.12);' +
	'border-radius:999px;backdrop-filter:blur(4px);user-select:none';

const DOT_CSS = 'width:6px;height:6px;border-radius:50%;background:#34d399';
const BRANCH_CSS = 'color:#a1a1aa';

/**
 * Framework-agnostic badge: fetches the which-worktree endpoint and mounts a
 * small fixed-position pill into `target`. Works anywhere the plugin (or an
 * equivalent endpoint) is running — Vue, Solid, Astro, plain Vite apps.
 *
 * No-ops outside development or when the endpoint is unreachable. Returns the
 * mounted element so callers can remove it later.
 * @param {import('./types.js').WorktreeBadgeProps & { target?: HTMLElement }} [options]
 * @returns {Promise<HTMLElement | undefined>}
 */
export async function attachWorktreeBadge(options = {}) {
	const { position = 'bottom-right', endpoint = '/__which-worktree__', target = document.body } = options;
	if (!DEV) return;

	let info;
	try {
		const res = await fetch(endpoint);
		if (res.ok) info = await res.json();
	} catch {}
	if (!info?.name) return;

	const shortName = info.name.split('/').pop() ?? info.name;
	const tooltip = [
		`worktree: ${info.name}`,
		info.branch && `branch: ${info.branch}`,
		info.source && `source: ${info.source}`
	]
		.filter(Boolean)
		.join('\n');

	const el = document.createElement('div');
	el.title = tooltip;
	el.style.cssText = `${BADGE_CSS};${POSITIONS[position] ?? POSITIONS['bottom-right']}`;

	const dot = document.createElement('span');
	dot.style.cssText = DOT_CSS;
	el.append(dot, shortName);

	if (info.branch && info.branch !== shortName) {
		const branch = document.createElement('span');
		branch.style.cssText = BRANCH_CSS;
		branch.textContent = `@${info.branch}`;
		el.append(branch);
	}

	target.append(el);
	return el;
}

export default attachWorktreeBadge;
