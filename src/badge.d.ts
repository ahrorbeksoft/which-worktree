import type { WorktreeBadgeProps } from './types.js';

/**
 * Framework-agnostic badge: fetches the which-worktree endpoint and mounts a
 * small fixed-position pill into `target`. No-ops outside development or when
 * the endpoint is unreachable. Returns the mounted element.
 */
export function attachWorktreeBadge(
	options?: WorktreeBadgeProps & { target?: HTMLElement }
): Promise<HTMLElement | undefined>;
export default attachWorktreeBadge;
