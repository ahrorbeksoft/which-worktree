import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WorktreeInfo } from './types.js';

export const dynamic: 'force-dynamic';
export function GET(): Response;
export function apiHandler(_req: IncomingMessage, res: ServerResponse): void;
export function worktreeInfo(root?: string): WorktreeInfo;
export type { WorktreeInfo };
