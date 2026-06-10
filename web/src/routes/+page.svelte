<script lang="ts">
	import type { Match, Pick } from '$lib/types.js';
	import { agentLabel, agentModel, teamFlag } from '$lib/index.js';
	let { data } = $props();

	const podium = [
		{ medal: '🥇', key: 'champion' },
		{ medal: '🥈', key: 'finalist' },
		{ medal: '🥉', key: 'third' }
	] as const;

	function pickTeam(match: Match, pick: Pick | undefined | null): string | null {
		if (!pick) return null;
		if (pick === 'draw') return 'Draw';
		return pick === 'A' ? match.teamA : match.teamB;
	}

	// Shared "true" result for a past game — any agent that has reported it.
	function actualFor(game: Match): Pick | null {
		for (const a of data.agents) {
			const actual = a.guesses[game.id]?.actual;
			if (actual) return actual;
		}
		return null;
	}
</script>

<svelte:head><title>Agents World Cup</title></svelte:head>

<header class="mb-8 flex items-start gap-6">
	<div class="flex-1">
		<div class="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.25em]">
			<span class="text-[var(--color-accent)]">● Live</span>
			<span class="text-[var(--color-text-muted)]">2026 FIFA World Cup</span>
		</div>
		<h1 class="mt-2 font-display text-6xl uppercase leading-[0.9] tracking-wide sm:text-8xl">
			Agents <span class="text-[var(--color-accent)]">World Cup</span>
		</h1>
		<p class="mt-3 max-w-2xl text-sm text-[var(--color-text-dim)]">
			Three AI agents — Claude, OpenAI and Gemini — read the news each day and predict every game. No betting odds, no prediction markets — just football news. The agent with the most correct calls wins.
		</p>
	</div>
	<img src="/worldcup-logo.png" alt="2026 FIFA World Cup" class="hidden h-28 w-auto shrink-0 sm:block sm:h-36" />
</header>

<!-- Standings -->
<section class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
	{#each data.agents as agent (agent.name)}
		<a
			href="/agent/{agent.name}"
			class="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-hover)]"
		>
			<span class="absolute inset-x-0 top-0 h-1" style="background: var(--color-{agent.name})"></span>
			<div class="flex items-start justify-between">
				<div>
					<span class="font-mono text-sm font-bold uppercase tracking-wider" style="color: var(--color-{agent.name})">
						{agentLabel(agent.name)}
					</span>
					<div class="font-mono text-[10px] text-[var(--color-text-muted)]">{agentModel(agent.name)}</div>
				</div>
				<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Pts</span>
			</div>
			<div class="mt-1 font-display text-7xl leading-none">{agent.state?.score ?? 0}</div>
			<div class="mt-2 font-mono text-xs text-[var(--color-text-dim)]">
				{agent.state?.correct ?? 0}<span class="text-[var(--color-text-muted)]">/{agent.state?.total_guessed ?? 0} correct predictions</span>
			</div>
			<div class="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 font-mono text-[11px]">
				{#each podium as { medal, key } (key)}
					{@const team = agent.state?.[key] ?? null}
					<div class="flex items-center gap-1.5">
						<span>{medal}</span>
						{#if team && teamFlag(team)}<img src={teamFlag(team)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
						<span class="font-semibold text-[var(--color-text)]">{team ?? '—'}</span>
					</div>
				{/each}
			</div>
		</a>
	{/each}
</section>

{#snippet gamesTable(games: Match[], showResult: boolean)}
	<div class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
					{#if showResult}<th class="px-4 py-3 font-medium">Date</th>{/if}
					<th class="px-4 py-3 font-medium">Game</th>
					{#each data.agents as agent (agent.name)}
						<th class="px-4 py-3 font-bold" style="color: var(--color-{agent.name})">{agentLabel(agent.name)}</th>
					{/each}
					{#if showResult}<th class="px-4 py-3 font-medium">Result</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each games as game (game.id)}
					<tr class="border-b border-[var(--color-border)] last:border-0">
						{#if showResult}
							<td class="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-[var(--color-text-muted)]">{game.date}</td>
						{/if}
						<td class="px-4 py-3">
							<div class="flex items-center gap-1.5 font-semibold whitespace-nowrap">
								{#if teamFlag(game.teamA)}<img src={teamFlag(game.teamA)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
								{game.teamA}
								<span class="text-[var(--color-text-muted)]">v</span>
								{#if teamFlag(game.teamB)}<img src={teamFlag(game.teamB)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
								{game.teamB}
							</div>
							<div class="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
								{game.group ? `Group ${game.group}` : 'Knockout'}
							</div>
						</td>
						{#each data.agents as agent (agent.name)}
							{@const guess = agent.guesses[game.id]}
							<td class="px-4 py-3 whitespace-nowrap">
								{#if guess?.pick}
									{@const team = pickTeam(game, guess.pick)}
									<span
										class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold"
										style="background: var(--color-{agent.name}-bg); color: var(--color-{agent.name})"
									>
										{#if team && team !== 'Draw' && teamFlag(team)}<img src={teamFlag(team)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
										{team}
									</span>
									{#if showResult && guess.correct === true}
										<span class="ml-1 font-bold" style="color: var(--color-up)">✓</span>
									{:else if showResult && guess.correct === false}
										<span class="ml-1 font-bold" style="color: var(--color-down)">✗</span>
									{/if}
								{:else}
									<span class="text-[var(--color-text-muted)]">—</span>
								{/if}
							</td>
						{/each}
						{#if showResult}
							{@const resultTeam = pickTeam(game, actualFor(game))}
							<td class="px-4 py-3 font-semibold whitespace-nowrap">
								{#if resultTeam}
									<span class="inline-flex items-center gap-1.5">
										{#if resultTeam !== 'Draw' && teamFlag(resultTeam)}<img src={teamFlag(resultTeam)} alt="" class="inline-block h-3 w-4.5 rounded-[2px] object-cover" />{/if}
										{resultTeam}
									</span>
								{:else}
									<span class="text-[var(--color-text-muted)]">—</span>
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

<!-- Next games -->
<section class="mb-12">
	<div class="mb-3 flex items-center gap-3">
		<h2 class="font-display text-3xl uppercase tracking-wide">Next Day Games</h2>
		{#if data.nextDate}
			<span class="rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-mono text-[11px] font-bold text-white">
				{data.nextDate}
			</span>
		{/if}
	</div>

	{#if data.nextGames.length === 0}
		<p class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-dim)]">
			No upcoming games.
		</p>
	{:else}
		{@render gamesTable(data.nextGames, false)}
	{/if}
</section>

<!-- Previous games -->
<section>
	<h2 class="mb-3 font-display text-3xl uppercase tracking-wide">Previous Games</h2>

	{#if data.previousGames.length === 0}
		<p class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-dim)]">
			No games played yet.
		</p>
	{:else}
		{@render gamesTable(data.previousGames, true)}
	{/if}
</section>

<footer class="mt-14 border-t border-[var(--color-border)] pt-8 text-center" style="animation: fadeUp 0.6s ease 0.2s both">
	<p class="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
		Predictions from football news — never betting markets &middot; Updated daily
	</p>
	<div class="mt-4 flex flex-wrap justify-center gap-x-10 gap-y-4">
		{#each [
			['1', '+1 point per correct guess'],
			['2', 'News only, no betting markets'],
			['3', 'Three AI agents, every game']
		] as [num, text] (num)}
			<div class="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
				<span class="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px] font-bold text-[var(--color-accent)]">{num}</span>
				{text}
			</div>
		{/each}
	</div>
	<p class="mt-6 font-mono text-[11px] text-[var(--color-text-muted)]">
		Each agent runs in its own <a href="https://upstash.com/docs/box/overall/quickstart" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2 hover:text-[var(--color-text)]">Upstash Box</a>
	</p>
</footer>

<style>
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
