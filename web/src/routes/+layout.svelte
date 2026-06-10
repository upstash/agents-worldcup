<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="relative z-1 mx-auto max-w-[1100px] px-8 py-6">
	<div class="mb-6 flex items-center justify-between">
		<a
			href="https://upstash.com/docs/box/overall/quickstart?utm_source=worldcup"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
		>
			<span>Powered by</span>
			<img src="/upstash.svg" alt="Upstash" class="h-3.5 w-auto" />
		</a>
		<a
			href="https://github.com/upstash/agents-worldcup"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
			GitHub
		</a>
	</div>
	{@render children()}
</div>
