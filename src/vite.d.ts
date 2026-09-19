import type { Plugin } from 'vite';
import type { WorktreeInfo } from './types.js';

/**
 * Identify the checkout at `root`: cow pasture, git worktree, plain repo or
 * bare directory. Never throws — falls back to the directory name.
 */
export function worktreeInfo(root?: string): WorktreeInfo;

/**
 * Vite plugin for worktree-based development: extends `server.fs.allow` with
 * the real locations of symlinked `node_modules` entries and serves
 * `WorktreeInfo` JSON at `GET /__which-worktree__`.
 */
export function whichWorktree(): Plugin;
export default whichWorktree;
