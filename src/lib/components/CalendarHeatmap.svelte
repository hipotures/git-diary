<script lang="ts">
	import type { DailyEntry } from '$lib/domain/types.js';
	import type { DateRange } from '$lib/stores/dateRange';
	import { theme } from '$lib/stores/theme';
	import { getEChartsColors } from '$lib/utils/echarts-themes';

	type Cell = {
		iso: string;
		commits: number;
		inWindow: boolean;
		level: number;
	};

	type MonthLabel = {
		id: string;
		name: string;
		column: number;
	};

	let { daily, range }: { daily: DailyEntry[]; range: DateRange } = $props();

	const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function parseIsoDay(day: string): Date {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(Date.UTC(year, month - 1, date));
	}

	function toIsoDay(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	function mondayIndex(date: Date): number {
		return (date.getUTCDay() + 6) % 7;
	}

	function dayMs(day: Date): number {
		return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
	}

	function level(commits: number, maxCommits: number): number {
		if (commits <= 0) return 0;
		if (maxCommits <= 0) return 1;
		return Math.max(1, Math.min(4, Math.ceil((commits / maxCommits) * 4)));
	}

	function getRangeBounds(): { start: Date; end: Date; numDays: number } {
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		if (range === 'all') {
			if (daily.length === 0) {
				const start = new Date(today);
				start.setUTCDate(start.getUTCDate() - 89);
				return { start, end: today, numDays: 90 };
			}

			const sortedDays = daily.map((d) => d.day).sort();
			const start = parseIsoDay(sortedDays[0]);
			const end = parseIsoDay(sortedDays[sortedDays.length - 1]);
			const numDays = Math.floor((dayMs(end) - dayMs(start)) / (24 * 60 * 60 * 1000)) + 1;
			return { start, end, numDays };
		}

		const start = new Date(today);
		start.setUTCDate(start.getUTCDate() - (range - 1));
		return { start, end: today, numDays: range };
	}

	const palette = $derived(getEChartsColors($theme).heatmap);
	const emptyColor = $derived($theme === 'dark' ? '#273042' : '#ebedf0');
	const gapColor = $derived($theme === 'dark' ? '#161b22' : '#f6f8fa');

	const bounds = $derived(getRangeBounds());
	const maxCommits = $derived(Math.max(...daily.map((d) => d.commits), 0));
	const dataMap = $derived(new Map(daily.map((d) => [d.day, d.commits])));

	const cellSize = 13;
	const cellGap = 4;

	const grid = $derived.by(() => {
		const start = bounds.start;
		const end = bounds.end;
		const startMs = dayMs(start);
		const endMs = dayMs(end);

		const normalizedStart = new Date(start);
		normalizedStart.setUTCDate(normalizedStart.getUTCDate() - mondayIndex(start));

		const weeks: Cell[][] = [];
		const months: MonthLabel[] = [];
		const seenMonthIds = new Set<string>();
		let cursor = new Date(normalizedStart);

		while (dayMs(cursor) <= endMs) {
			const week: Cell[] = [];
			for (let row = 0; row < 7; row++) {
				const day = new Date(cursor);
				const iso = toIsoDay(day);
				const currentMs = dayMs(day);
				const inWindow = currentMs >= startMs && currentMs <= endMs;
				const commits = inWindow ? dataMap.get(iso) ?? 0 : 0;

				week.push({
					iso,
					commits,
					inWindow,
					level: inWindow ? level(commits, maxCommits) : 0
				});

				if (inWindow && day.getUTCDate() === 1) {
					const id = `${day.getUTCFullYear()}-${day.getUTCMonth()}`;
					if (!seenMonthIds.has(id)) {
						months.push({
							id,
							name: monthShort[day.getUTCMonth()],
							column: weeks.length
						});
						seenMonthIds.add(id);
					}
				}

				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}
			weeks.push(week);
		}

		return { weeks, months };
	});

	const weekCount = $derived(grid.weeks.length);
	const shownWeekdays = $derived(
		weekdayNames.map((name, idx) => ({ name, show: idx === 0 || idx === 2 || idx === 4 || idx === 6 }))
	);

	// Filter months to prevent overlapping labels (minimum 4 columns apart)
	// Keep later months (actual month starts) and skip earlier ones if they conflict
	const visibleMonths = $derived.by(() => {
		const minColumnGap = 4;
		const months = grid.months;
		const visible: boolean[] = new Array(months.length).fill(true);

		// Check each month against the next ones
		for (let i = 0; i < months.length; i++) {
			if (!visible[i]) continue;

			for (let j = i + 1; j < months.length; j++) {
				if (!visible[j]) continue;

				const gap = months[j].column - months[i].column;
				if (gap < minColumnGap) {
					// Conflict: hide the earlier month (i), keep the later one (j)
					visible[i] = false;
					break;
				} else {
					// No more conflicts for month i
					break;
				}
			}
		}

		return months.filter((_, idx) => visible[idx]);
	});
</script>

<div class="heatmap-shell" style={`--cell-size:${cellSize}px; --cell-gap:${cellGap}px;`}>
	<div class="calendar-wrap">
		<div class="month-row">
			<div class="month-spacer"></div>
			<div
				class="months"
				style={`--week-count:${weekCount}; width: calc(var(--week-count) * (var(--cell-size) + var(--cell-gap)) - var(--cell-gap));`}
			>
				{#each visibleMonths as month (month.id)}
					<span class="month-label" style={`left: calc(${month.column} * (var(--cell-size) + var(--cell-gap)))`}>
						{month.name}
					</span>
				{/each}
			</div>
		</div>

		<div class="matrix-row">
			<div class="day-labels">
				{#each shownWeekdays as day}
					<div class="day-label">{day.show ? day.name : ''}</div>
				{/each}
			</div>

			<div
				class="weeks-area"
				style={`--week-count:${weekCount}; width: calc(var(--week-count) * (var(--cell-size) + var(--cell-gap)) - var(--cell-gap));`}
			>
				{#each grid.weeks as week, weekIndex (`week-${weekIndex}`)}
					<div class="week-col">
						{#each week as cell (`${cell.iso}-${weekIndex}`)}
							<div
								class="cell"
								style={`background:${cell.inWindow ? (cell.level === 0 ? emptyColor : palette[cell.level]) : 'transparent'}; border-color:${gapColor};`}
								title={cell.inWindow
									? `${cell.iso}: ${cell.commits} commit${cell.commits !== 1 ? 's' : ''}`
									: ''}
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="legend-row">
		<span></span>
		<div class="legend-scale">
			<span>Less</span>
			<div class="swatches">
				{#each palette as color, idx}
					<span
						class="swatch"
						style={`background:${idx === 0 ? emptyColor : color}; border-color:${gapColor};`}
					></span>
				{/each}
			</div>
			<span>More</span>
		</div>
	</div>
</div>

<style>
	.heatmap-shell {
		--cell-size: 13px;
		--cell-gap: 4px;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.calendar-wrap {
		overflow-x: auto;
		padding-bottom: var(--space-xs);
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.calendar-wrap::-webkit-scrollbar {
		display: none;
	}

	.month-row {
		display: grid;
		grid-template-columns: 48px 1fr;
		align-items: end;
		margin-bottom: var(--space-xs);
	}

	.months {
		position: relative;
		height: 20px;
	}

	.month-label {
		position: absolute;
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.matrix-row {
		display: grid;
		grid-template-columns: 48px 1fr;
	}

	.day-labels {
		display: grid;
		grid-template-rows: repeat(7, var(--cell-size));
		row-gap: var(--cell-gap);
		align-items: center;
	}

	.day-label {
		font-size: 0.84rem;
		color: var(--color-text-secondary);
		line-height: 1;
	}

	.weeks-area {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: var(--cell-size);
		column-gap: var(--cell-gap);
	}

	.week-col {
		display: grid;
		grid-template-rows: repeat(7, var(--cell-size));
		row-gap: var(--cell-gap);
		width: var(--cell-size);
	}

	.cell {
		width: var(--cell-size);
		height: var(--cell-size);
		border-radius: 3px;
		border: 1px solid transparent;
	}

	.legend-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		flex-wrap: wrap;
		padding: 0 var(--space-sm) var(--space-xs);
	}

	.legend-scale {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.swatches {
		display: flex;
		gap: 4px;
	}

	.swatch {
		width: 13px;
		height: 13px;
		border-radius: 3px;
		border: 1px solid transparent;
	}

	@media (max-width: 700px) {
		.heatmap-shell {
			--cell-size: 12px;
			--cell-gap: 3px;
		}
	}
</style>
