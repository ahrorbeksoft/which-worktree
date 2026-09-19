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
