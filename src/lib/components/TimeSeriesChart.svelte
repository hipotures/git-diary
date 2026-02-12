<script lang="ts">
	import { onMount } from 'svelte';
	import type { DailyEntry } from '$lib/domain/types.js';

	let { daily }: { daily: DailyEntry[] } = $props();

	let chartDom: HTMLDivElement;

	onMount(async () => {
		const echarts = await import('echarts');
		const chart = echarts.init(chartDom, 'dark');

		// Fill in missing days with 0 commits
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		const dataMap = new Map(daily.map((d) => [d.day, d.commits]));
		const fullData: Array<{ day: string; commits: number }> = [];

		for (let i = 89; i >= 0; i--) {
			const date = new Date(today);
			date.setUTCDate(date.getUTCDate() - i);
			const day = date.toISOString().slice(0, 10);
			fullData.push({ day, commits: dataMap.get(day) || 0 });
		}

		chart.setOption({
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'line' }
			},
			grid: {
				left: 12,
				right: 24,
				top: 32,
				bottom: 24,
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: fullData.map((d) => d.day),
				axisLabel: {
					color: '#7d8590',
					fontSize: 10,
					interval: 'auto',
					formatter: (value: string) => {
						const parts = value.split('-');
						return `${parts[1]}-${parts[2]}`;
					}
				},
				axisLine: { lineStyle: { color: '#30363d' } },
				axisTick: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { color: '#7d8590', fontSize: 11 },
				splitLine: { lineStyle: { color: '#21262d' } }
			},
			series: [
				{
					name: 'Commits',
					type: 'bar',
					data: fullData.map((d) => d.commits),
					itemStyle: {
						color: '#58a6ff',
						borderRadius: [2, 2, 0, 0]
					},
					barMaxWidth: 8
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
		height: 320px;
	}
</style>
