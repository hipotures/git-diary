<script lang="ts">
	import StatsTable from '$lib/components/StatsTable.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Note: In static export, period toggle is disabled (always 90d)
	const totalCommits = $derived(data.stats.repos.reduce((sum, r) => sum + r.totalCommits, 0));
	const activeRepos = $derived(data.stats.repos.filter((r) => r.totalCommits > 0).length);
	const avgCommitsPerRepo = $derived(
		activeRepos > 0 ? Math.round(totalCommits / activeRepos) : 0
	);
	const topStreak = $derived(Math.max(...data.stats.repos.map((r) => r.longestStreak), 0));
</script>

<div class="header">
	<h1>Repository Comparison (90 days)</h1>
</div>

<div class="metrics-grid">
	<MetricCard label="Total Commits" value={totalCommits} />
	<MetricCard label="Active Repos" value={activeRepos} />
	<MetricCard label="Avg/Repo" value={avgCommitsPerRepo} />
	<MetricCard label="Top Streak" value={topStreak} suffix="days" />
</div>

<section class="table-section">
	<h2>Statistics by Repository</h2>
	<StatsTable repos={data.stats.repos} period={data.stats.period} />
</section>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-xl);
	}

	.period-toggle {
		display: flex;
		gap: var(--space-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 2px;
	}

	.period-btn {
		padding: var(--space-xs) var(--space-md);
		border-radius: calc(var(--radius) - 2px);
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all 0.15s;
	}

	.period-btn:hover {
		color: var(--color-text);
		background: var(--color-surface-hover);
	}

	.period-btn.active {
		color: var(--color-text);
		background: var(--color-accent);
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.table-section {
		margin-top: var(--space-xl);
	}
</style>
