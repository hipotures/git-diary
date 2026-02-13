<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { ImpactDailyRow } from '$lib/domain/types.js';
	import type { DateRange } from '$lib/stores/dateRange';
	import { theme } from '$lib/stores/theme';
	import { getEChartsColors, getEChartsTheme } from '$lib/utils/echarts-themes';

	let { daily, range }: { daily: ImpactDailyRow[]; range: DateRange } = $props();

	let chartDom: HTMLDivElement;
	let chart: any;
	let resizeObserver: ResizeObserver | undefined;

	function parseIsoDay(day: string): Date {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(Date.UTC(year, month - 1, date));
	}

	function toIsoDay(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	function getRangeBounds(): { start: Date; end: Date } {
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		if (range === 'all') {
			if (daily.length === 0) {
				const start = new Date(today);
				start.setUTCDate(start.getUTCDate() - 89);
				return { start, end: today };
			}

			const sortedDays = daily.map((d) => d.day).sort();
			return {
				start: parseIsoDay(sortedDays[0]),
				end: parseIsoDay(sortedDays[sortedDays.length - 1])
			};
		}

		const start = new Date(today);
		start.setUTCDate(start.getUTCDate() - (range - 1));
		return { start, end: today };
	}

	function buildFullData(): Array<{ day: string; files: number; netLoc: number }> {
		const dataMap = new Map<string, { files: number; netLoc: number }>();
		for (const entry of daily) {
			const current = dataMap.get(entry.day) ?? { files: 0, netLoc: 0 };
			dataMap.set(entry.day, {
				files: current.files + entry.filesChanged,
				netLoc: current.netLoc + entry.net
			});
		}

		const { start, end } = getRangeBounds();
		const fullData: Array<{ day: string; files: number; netLoc: number }> = [];

		const cursor = new Date(start);
		while (cursor <= end) {
			const day = toIsoDay(cursor);
			const value = dataMap.get(day) ?? { files: 0, netLoc: 0 };
			fullData.push({ day, files: value.files, netLoc: value.netLoc });
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}

		return fullData;
	}

	const initChart = (currentTheme: 'light' | 'dark') => {
		import('echarts').then((echarts) => {
			if (chart) {
				chart.dispose();
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}

			const colors = getEChartsColors(currentTheme);
			const netColor = currentTheme === 'dark' ? '#3fb950' : '#1a7f37';
			chart = echarts.init(chartDom, getEChartsTheme(currentTheme));

			const fullData = buildFullData();
			const numDays = fullData.length;

			chart.setOption({
				backgroundColor: 'transparent',
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'line' },
					textStyle: { fontSize: 13 },
					formatter: (params: any) => {
						const rows = Array.isArray(params) ? params : [params];
						const day = rows[0]?.axisValueLabel ?? rows[0]?.axisValue ?? '';

						const filesRow = rows.find((row: any) => row.seriesName === 'Files');
						const netRow = rows.find((row: any) => row.seriesName === 'Net LOC');
						const filesRaw = filesRow?.value ?? 0;
						const netRaw = netRow?.value ?? 0;

						const files = Number(filesRaw).toLocaleString('en-US');
						const netValue = Number(netRaw);
						const net = `${netValue >= 0 ? '+' : ''}${netValue.toLocaleString('en-US')}`;
						const filesMarker = filesRow?.marker ?? '';
						const netMarker = netRow?.marker ?? '';

						return `${day}<br/>${filesMarker} ${files}<br/>${netMarker} ${net}`;
					}
				},
				grid: {
					left: 12,
					right: 20,
					top: 32,
					bottom: 62,
					containLabel: true
				},
				legend: {
					bottom: 8,
					left: 12,
					orient: 'horizontal',
					itemGap: 16,
					textStyle: { color: colors.text, fontSize: 13 },
					data: ['Files', 'Net LOC']
				},
				xAxis: {
					type: 'category',
					data: fullData.map((d) => d.day),
					axisLabel: {
						color: colors.text,
						fontSize: 12,
						interval: numDays <= 30 ? 2 : numDays <= 90 ? 6 : numDays <= 180 ? 14 : 30,
						formatter: (value: string) => {
							const parts = value.split('-');
							return `${parts[1]}-${parts[2]}`;
						}
					},
					axisLine: { lineStyle: { color: colors.border } },
					axisTick: { show: false }
				},
				yAxis: [
					{
						type: 'value',
						name: 'Files',
						position: 'left',
						nameTextStyle: { color: colors.text, fontSize: 12 },
						axisLabel: { color: colors.text, fontSize: 12 },
						splitLine: { lineStyle: { color: colors.split } }
					},
					{
						type: 'value',
						name: 'Net LOC',
						position: 'right',
						nameTextStyle: { color: colors.text, fontSize: 12 },
						axisLabel: {
							color: colors.text,
							fontSize: 12,
							formatter: (value: number) => `${value >= 0 ? '+' : ''}${value}`
						},
						splitLine: { show: false }
					}
				],
				series: [
					{
						name: 'Files',
						type: 'bar',
						yAxisIndex: 0,
						data: fullData.map((d) => d.files),
						itemStyle: {
							color: colors.accent,
							borderRadius: [2, 2, 0, 0]
						},
						barMaxWidth: 8
					},
					{
						name: 'Net LOC',
						type: 'line',
						yAxisIndex: 1,
						data: fullData.map((d) => d.netLoc),
						smooth: false,
						showSymbol: false,
						lineStyle: {
							color: netColor,
							width: 2
						},
						itemStyle: {
							color: netColor
						}
					}
				]
			});

			resizeObserver = new ResizeObserver(() => {
				if (chart) chart.resize();
			});
			resizeObserver.observe(chartDom);
		});
	};

	onMount(() => {
		initChart($theme);
	});

	$effect(() => {
		if (!chartDom) return;
		const currentTheme = $theme;
		const _daily = daily;
		const _range = range;
		void _daily;
		void _range;
		initChart(currentTheme);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		if (chart) {
			chart.dispose();
		}
	});
</script>

<div bind:this={chartDom} class="chart"></div>

<style>
	.chart {
		width: 100%;
		height: 320px;
	}
</style>
