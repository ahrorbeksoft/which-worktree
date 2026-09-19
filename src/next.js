import { worktreeInfo } from './info.js';

export { worktreeInfo };

/**
 * Next.js App Router route handler serving `WorktreeInfo` JSON so
 * `<WorktreeBadge />` can fetch it in dev. Re-export it from a route file:
 *
 *   // app/__which-worktree__/route.ts
 *   export { GET, dynamic } from 'which-worktree/next';
 */
export const dynamic = 'force-dynamic';

export function GET() {
	return Response.json(worktreeInfo(), {
		headers: { 'cache-control': 'no-store' }
	});
}

/**
 * Pages Router / connect-style handler serving the same JSON:
 *
 *   // pages/api/__which-worktree__.ts
 *   export { apiHandler as default } from 'which-worktree/next';
 *
 * @param {import('node:http').IncomingMessage} _req
 * @param {import('node:http').ServerResponse} res
 */
export function apiHandler(_req, res) {
	res.setHeader('content-type', 'application/json');
	res.setHeader('cache-control', 'no-store');
	res.end(JSON.stringify(worktreeInfo()));
}
