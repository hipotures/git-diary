<script lang="ts">
	import { dateRange, type DateRange } from '$lib/stores/dateRange';

	// Convert store value to string for select binding
	let selectedValue = $derived(String($dateRange));

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value === 'all' ? 'all' : parseInt(target.value, 10);
		dateRange.set(value as DateRange);
	}
</script>

<div class="date-range-selector">
	<label for="date-range">Period:</label>
	<select id="date-range" value={selectedValue} onchange={handleChange}>
		<option value="7">7 days</option>
		<option value="30">30 days</option>
		<option value="90">90 days</option>
		<option value="180">180 days</option>
		<option value="360">360 days</option>
		<option value="all">All time</option>
	</select>
</div>

<style>
	.date-range-selector {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}

	label {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	select {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	select:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-border);
	}

	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
