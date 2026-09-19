'use client';

import { useEffect, useState } from 'react';

const DEV = import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';

const POSITIONS = {
	'top-left': { top: '0.75rem', left: '0.75rem' },
	'top-right': { top: '0.75rem', right: '0.75rem' },
	'bottom-left': { bottom: '0.75rem', left: '0.75rem' },
	'bottom-right': { bottom: '0.75rem', right: '0.75rem' }
};

const styles = {
	badge: {
		position: 'fixed',
		zIndex: 99999,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.375rem',
		padding: '0.125rem 0.5rem',
		font: '500 11px/1.5 ui-monospace, SFMono-Regular, monospace',
		color: '#e4e4e7',
		background: 'rgb(24 24 27 / 0.85)',
		border: '1px solid rgb(255 255 255 / 0.12)',
		borderRadius: '999px',
		backdropFilter: 'blur(4px)',
		userSelect: 'none'
	},
	dot: { width: 6, height: 6, borderRadius: '50%', background: '#34d399' },
	branch: { color: '#a1a1aa' }
};

/**
 * Dev-only badge showing the current worktree name and branch. Fetches the
 * `endpoint` on mount and renders nothing in production or when the dev
 * server has no which-worktree endpoint.
 * @param {import('./types.js').WorktreeBadgeProps} props
 */
export function WorktreeBadge({ position = 'bottom-right', endpoint = '/__which-worktree__' }) {
	const [info, setInfo] = useState(/** @type {import('./types.js').WorktreeInfo | undefined} */ (undefined));

	useEffect(() => {
		if (!DEV) return;
		fetch(endpoint)
			.then((res) => (res.ok ? res.json() : undefined))
			.then(setInfo)
			.catch(() => {});
	}, [endpoint]);

	if (!DEV || !info?.name) return null;

	const shortName = info.name.split('/').pop() ?? info.name;
	const tooltip = [
		`worktree: ${info.name}`,
		info.branch && `branch: ${info.branch}`,
		info.source && `source: ${info.source}`
	]
		.filter(Boolean)
		.join('\n');

	return (
		<div title={tooltip} style={{ ...styles.badge, ...POSITIONS[position] }}>
			<span style={styles.dot} />
			<span>{shortName}</span>
			{info.branch && info.branch !== shortName && <span style={styles.branch}>@{info.branch}</span>}
		</div>
	);
}

export default WorktreeBadge;
