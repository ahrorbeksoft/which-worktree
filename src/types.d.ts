export interface WorktreeInfo {
	/** Worktree/pasture name, or the directory basename for plain checkouts. */
	name: string;
	/** Current branch, or short sha when detached. */
	branch?: string;
	/** Absolute path of the source checkout this worktree shares from. */
	source?: string;
	/** How the worktree was detected. */
	kind: 'cow' | 'worktree' | 'repo' | 'dir';
}

export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface WorktreeBadgeProps {
	/** Corner to pin the badge to. Defaults to `"bottom-right"`. */
	position?: BadgePosition;
	/** URL the badge fetches `WorktreeInfo` from. Defaults to `"/__which-worktree__"`. */
	endpoint?: string;
}
