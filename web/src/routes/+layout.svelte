<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="relative z-1 mx-auto max-w-[1100px] px-8 py-6">
	<div class="mb-6 flex items-center justify-between">
		<a
			href="https://upstash.com/docs/box/overall/quickstart"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
		>
			<span>Powered by</span>
			<img src="/upstash.svg" alt="Upstash" class="h-3.5 w-auto" />
		</a>
		<a
			href="/"
			class="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
		>
			Leaderboard
		</a>
	</div>
	{@render children()}
</div>
