<script lang="ts">
	import { onMount } from 'svelte';
	import type { DailyEntry } from '$lib/domain/types.js';

	let { daily }: { daily: DailyEntry[] } = $props();

	let chartDom: HTMLDivElement;

	onMount(async () => {
		const echarts = await import('echarts');
		const chart = echarts.init(chartDom, 'dark');

		// Calculate date range (90 days)
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		const start = new Date(today);
		start.setUTCDate(start.getUTCDate() - 89);

		const startDate = start.toISOString().slice(0, 10);
		const endDate = today.toISOString().slice(0, 10);

		// Prepare data for calendar
		const calendarData = daily.map((d) => [d.day, d.commits]);

		// Find max commits for color scale
		const maxCommits = Math.max(...daily.map((d) => d.commits), 1);

		chart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				position: 'top',
				formatter: (params: any) => {
					const date = params.data[0];
					const commits = params.data[1];
					return `${date}<br/>${commits} commit${commits !== 1 ? 's' : ''}`;
				}
			},
			visualMap: {
				show: false,
				min: 0,
				max: maxCommits,
				inRange: {
					color: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
				}
			},
			calendar: {
				range: [startDate, endDate],
				cellSize: ['auto', 14],
				splitLine: {
					show: true,
					lineStyle: {
						color: '#21262d',
						width: 2
					}
				},
				yearLabel: { show: false },
				monthLabel: {
					nameMap: 'en',
					fontSize: 11,
					color: '#7d8590'
				},
				dayLabel: {
					nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
					fontSize: 10,
					color: '#7d8590'
				},
				itemStyle: {
					borderWidth: 2,
					borderColor: '#0d1117'
				}
			},
			series: [
				{
					type: 'heatmap',
					coordinateSystem: 'calendar',
					data: calendarData
				}
			]
		});

		const resizeObserver = new ResizeObserver(() => chart.resize());
		resizeObserver.observe(chartDom);

		return () => {
			resizeObserver.disconnect();
			chart.dispose();
		};
	});
</script>

<div bind:this={chartDom} class="chart"></div>

<style>
	.chart {
		width: 100%;
		height: 180px;
	}
</style>
