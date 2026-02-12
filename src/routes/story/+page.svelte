<script lang="ts">
	import StorySection from '$lib/components/StorySection.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
</script>

<h1>Build Story</h1>
<p class="subtitle">A narrative view of your development activity</p>

<StorySection story={data.story30d} period="30d" />
<StorySection story={data.story90d} period="90d" />

<style>
	.subtitle {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-xl);
	}
</style>
