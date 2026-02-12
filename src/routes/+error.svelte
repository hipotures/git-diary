<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="error-container">
	<div class="error-card">
		<h1>{$page.status}</h1>
		<p class="error-message">{$page.error?.message || 'An error occurred'}</p>
		<a href="/" class="back-link">← Back to home</a>
	</div>
</div>

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: var(--space-xl);
	}

	.error-card {
		text-align: center;
		max-width: 500px;
	}

	h1 {
		font-size: 4rem;
		font-family: var(--font-mono);
		color: var(--color-danger);
		margin-bottom: var(--space-md);
	}

	.error-message {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-xl);
	}

	.back-link {
		display: inline-block;
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		text-decoration: none;
		transition: all 0.15s;
	}

	.back-link:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}
</style>
