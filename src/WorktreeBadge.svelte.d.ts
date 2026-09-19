import type { Component } from 'svelte';

export interface WorktreeBadgeProps {
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

declare const WorktreeBadge: Component<WorktreeBadgeProps>;
export default WorktreeBadge;
