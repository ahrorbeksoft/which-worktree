import type { Plugin } from 'vite';
import type { WorktreeInfo } from './types.js';

/**
 * Identify the checkout at `root`: cow pasture, git worktree, plain repo or
 * bare directory. Never throws — falls back to the directory name.
 */
export function worktreeInfo(root?: string): WorktreeInfo;

/**
 * Vite plugin for worktree-based development: extends `server.fs.allow` with
 * the real locations of symlinked `node_modules` entries and injects
 * `globalThis.__WHICH_WORKTREE__` into served HTML.
 */
export function whichWorktree(options?: { badge?: boolean }): Plugin;
export default whichWorktree;
