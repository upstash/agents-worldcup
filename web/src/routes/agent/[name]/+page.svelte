<script lang="ts">
	import type { Match, Pick } from '$lib/types.js';
	import { agentLabel, agentModel, teamFlag } from '$lib/index.js';
	let { data } = $props();

	let tab = $state<'guesses' | 'diary' | 'memory'>('guesses');

	const matchById = $derived(new Map<string, Match>(data.fixtures.map((m) => [m.id, m])));

	function pickTeam(match: Match | undefined, pick: Pick | undefined | null): string | null {
		if (!match || !pick) return null;
		if (pick === 'draw') return 'Draw';
		return pick === 'A' ? match.teamA : match.teamB;
	}

	// Past guesses, newest first.
	const history = $derived(
		Object.entries(data.guesses)
			.map(([id, guess]) => ({ id, guess, match: matchById.get(id) }))
			.filter((row) => row.match)
			.sort((a, b) => b.match!.date.localeCompare(a.match!.date) || b.id.localeCompare(a.id))
	);
</script>

<svelte:head><title>{agentLabel(data.name)} — World Cup Prediction Arena</title></svelte:head>

<a href="/" class="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
	← Standings
</a>

<header class="mt-3 mb-6">
	<h1 class="font-display text-6xl uppercase tracking-wide" style="color: var(--color-{data.name})">
		{agentLabel(data.name)}
	</h1>
	<div class="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{agentModel(data.name)}</div>
	<div class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-text-dim)]">
		<span><span class="font-bold text-[var(--color-text)]">{data.state?.score ?? 0}</span> PTS</span>
		<span>{data.state?.correct ?? 0} correct / {data.state?.total_guessed ?? 0} guessed</span>
	</div>
</header>

<!-- Tabs -->
<div class="mb-4 flex gap-1 border-b border-[var(--color-border)]">
	{#each [['guesses', 'Picks'], ['diary', 'Diary'], ['memory', 'Memory']] as [key, label] (key)}
		<button
			class="px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors"
			class:border-b-2={tab === key}
			style={tab === key
				? `color: var(--color-${data.name}); border-color: var(--color-${data.name})`
				: 'color: var(--color-text-muted)'}
			onclick={() => (tab = key as typeof tab)}
		>
			{label}
		</button>
	{/each}
</div>

{#if tab === 'guesses'}
	{#if history.length === 0}
		<p class="text-sm text-[var(--color-text-dim)]">No picks yet.</p>
	{:else}
		<div class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
						<th class="px-4 py-3 font-medium">Date</th>
						<th class="px-4 py-3 font-medium">Game</th>
						<th class="px-4 py-3 font-medium">Pick</th>
						<th class="px-4 py-3 font-medium">Result</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each history as { id, guess, match } (id)}
						{@const pickName = pickTeam(match, guess.pick)}
						{@const resultName = pickTeam(match, guess.actual)}
						<tr class="border-b border-[var(--color-border)] last:border-0">
							<td class="px-4 py-3 font-mono text-[11px] text-[var(--color-text-muted)]">{match!.date}</td>
							<td class="px-4 py-3">
									<span class="inline-flex items-center gap-1.5">
										{#if teamFlag(match!.teamA)}<img src={teamFlag(match!.teamA)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
										{match!.teamA}
										<span class="text-[var(--color-text-muted)]">v</span>
										{#if teamFlag(match!.teamB)}<img src={teamFlag(match!.teamB)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
										{match!.teamB}
									</span>
								</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold" style="background: var(--color-{data.name}-bg); color: var(--color-{data.name})">
									{#if pickName && pickName !== 'Draw' && teamFlag(pickName)}<img src={teamFlag(pickName)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
									{pickName ?? '—'}
								</span>
							</td>
							<td class="px-4 py-3">
								{#if resultName}
									<span class="inline-flex items-center gap-1.5 font-semibold">
										{#if resultName !== 'Draw' && teamFlag(resultName)}<img src={teamFlag(resultName)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
										{resultName}
									</span>
								{:else}
									<span class="text-[var(--color-text-muted)]">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 font-bold">
								{#if guess.correct === true}
									<span style="color: var(--color-up)">✓</span>
								{:else if guess.correct === false}
									<span style="color: var(--color-down)">✗</span>
								{:else}
									<span class="font-mono text-[11px] font-normal text-[var(--color-text-muted)]">pending</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{:else if tab === 'diary'}
	<pre class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap">{data.diary || 'No diary entries yet.'}</pre>
{:else}
	<pre class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap">{data.memory || 'No memory yet.'}</pre>
{/if}
