<script lang="ts">
	import { onMount } from 'svelte';
	import type { WorktreeBadgeProps, WorktreeInfo } from './types.js';

	let {
		position = 'bottom-right',
		endpoint = '/__which-worktree__'
	}: WorktreeBadgeProps = $props();

	let info = $state<WorktreeInfo>();

	onMount(async () => {
		try {
			const res = await fetch(endpoint);
			if (res.ok) info = await res.json();
		} catch {}
	});

	let shortName = $derived(info?.name.split('/').pop() ?? info?.name);
	let tooltip = $derived(
		info
			? [
					`worktree: ${info.name}`,
					info.branch && `branch: ${info.branch}`,
					info.source && `source: ${info.source}`
				]
					.filter(Boolean)
					.join('\n')
			: ''
	);
</script>

{#if import.meta.env.DEV && shortName}
	<div class="wwb {position}" title={tooltip}>
		<span class="wwb-dot"></span>
		<span>{shortName}</span>
		{#if info?.branch && info.branch !== shortName}
			<span class="wwb-branch">@{info.branch}</span>
		{/if}
	</div>
{/if}

<style>
	.wwb {
		position: fixed;
		z-index: 99999;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.125rem 0.5rem;
		font:
			500 11px/1.5 ui-monospace,
			SFMono-Regular,
			monospace;
		color: #e4e4e7;
		background: rgb(24 24 27 / 0.85);
		border: 1px solid rgb(255 255 255 / 0.12);
		border-radius: 999px;
		backdrop-filter: blur(4px);
		user-select: none;
	}
	.bottom-right {
		right: 0.75rem;
		bottom: 0.75rem;
	}
	.bottom-left {
		left: 0.75rem;
		bottom: 0.75rem;
	}
	.top-right {
		right: 0.75rem;
		top: 0.75rem;
	}
	.top-left {
		left: 0.75rem;
		top: 0.75rem;
	}
	.wwb-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #34d399;
	}
	.wwb-branch {
		color: #a1a1aa;
	}
</style>
