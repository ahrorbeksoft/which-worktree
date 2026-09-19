import type { WorktreeInfo } from './types.js';

/**
 * Identify the checkout at `root`: cow pasture, git worktree, plain repo or
 * bare directory. Never throws — falls back to the directory name. Pure Node,
 * no Vite dependency.
 */
export function worktreeInfo(root?: string): WorktreeInfo;
export type { WorktreeInfo };
