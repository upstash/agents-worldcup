import { getBoxByName } from '$lib/server/box.js';
import { getOrSetCache } from '$lib/server/cache.js';
import type { State, Match, Guess, AgentView } from '$lib/types.js';

const AGENTS = [
	{ name: 'claude', boxName: 'worldcup-claude-v5' },
	{ name: 'openai', boxName: 'worldcup-openai-v5' },
	{ name: 'gemini', boxName: 'worldcup-gemini-v5' }
] as const;

export const AGENT_NAMES = AGENTS.map((a) => a.name);

const DATA_DIR = '/workspace/home/data';
const CACHE_TTL_MS = 30 * 1000;

function boxNameFor(name: string): string | null {
	return AGENTS.find((a) => a.name === name)?.boxName ?? null;
}

async function readJson<T>(boxName: string, path: string): Promise<T | null> {
	try {
		const box = await getBoxByName(boxName);
		const raw = await box.files.read(path);
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

async function readText(boxName: string, path: string): Promise<string> {
	try {
		const box = await getBoxByName(boxName);
		return (await box.files.read(path)) ?? '';
	} catch {
		return '';
	}
}

function today(): string {
	return new Date().toISOString().split('T')[0];
}

// Fixtures are identical in every box — read from whichever responds first.
async function fetchFixtures(): Promise<Match[]> {
	for (const agent of AGENTS) {
		const fixtures = await readJson<Match[]>(agent.boxName, `${DATA_DIR}/fixtures.json`);
		if (fixtures) return fixtures;
	}
	return [];
}

async function fetchAgentView(name: string, boxName: string): Promise<AgentView> {
	const [state, guesses] = await Promise.all([
		readJson<State>(boxName, `${DATA_DIR}/state.json`),
		readJson<Record<string, Guess>>(boxName, `${DATA_DIR}/guesses.json`)
	]);
	return { name, state, guesses: guesses ?? {} };
}

export async function fetchHomepage(): Promise<{
	agents: AgentView[];
	nextDays: { date: string; games: Match[] }[];
	previousGames: Match[];
}> {
	return getOrSetCache('homepage', CACHE_TTL_MS, async () => {
		const [fixtures, agents] = await Promise.all([
			fetchFixtures(),
			Promise.all(AGENTS.map((a) => fetchAgentView(a.name, a.boxName)))
		]);

		// A game is "played" once it has a confirmed result (any agent scored it)
		// or its date is in the past. Games kick off throughout the day, so a match
		// dated today may already be finished — bucket by result, not date alone,
		// otherwise a finished game lingers in "Next" until midnight UTC.
		const scoredIds = new Set<string>();
		for (const agent of agents) {
			for (const [id, guess] of Object.entries(agent.guesses)) {
				if (guess?.actual != null) scoredIds.add(id);
			}
		}
		const isPlayed = (m: Match): boolean => scoredIds.has(m.id) || m.date < today();

		// Show the next two game days — mirrors the agents' two-day prediction
		// window (tools/fixtures.ts `upcoming 2`), so picks already locked in for
		// tomorrow are visible here instead of hidden until that day arrives.
		const NEXT_DAYS = 2;
		const upcoming = fixtures
			.filter((m) => !isPlayed(m))
			.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
		const nextDates = [...new Set(upcoming.map((m) => m.date))].slice(0, NEXT_DAYS);
		const nextDays = nextDates.map((date) => ({
			date,
			games: upcoming.filter((m) => m.date === date)
		}));

		// All games already played, newest first.
		const previousGames = fixtures
			.filter(isPlayed)
			.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

		// Fixed display order: claude, openai, gemini (the AGENTS order).
		return { agents, nextDays, previousGames };
	});
}

export async function fetchAgentDetail(name: string): Promise<{
	state: State | null;
	guesses: Record<string, Guess>;
	fixtures: Match[];
	diary: string;
	memory: string;
} | null> {
	const boxName = boxNameFor(name);
	if (!boxName) return null;

	return getOrSetCache(`agent:${name}`, CACHE_TTL_MS, async () => {
		const [view, fixtures, diary, memory] = await Promise.all([
			fetchAgentView(name, boxName),
			fetchFixtures(),
			readText(boxName, `${DATA_DIR}/diary.md`),
			readText(boxName, `${DATA_DIR}/memory.md`)
		]);

		return { state: view.state, guesses: view.guesses, fixtures, diary, memory };
	});
}
