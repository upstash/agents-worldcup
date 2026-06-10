import { getBoxByName } from '$lib/server/box.js';
import { getOrSetCache } from '$lib/server/cache.js';
import type { State, Match, Guess, AgentView } from '$lib/types.js';

const AGENTS = [
	{ name: 'claude', boxName: 'worldcup-claude-v4' },
	{ name: 'openai', boxName: 'worldcup-openai-v4' },
	{ name: 'gemini', boxName: 'worldcup-gemini-v4' }
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
	nextGames: Match[];
	nextDate: string | null;
	previousGames: Match[];
}> {
	return getOrSetCache('homepage', CACHE_TTL_MS, async () => {
		const [fixtures, agents] = await Promise.all([
			fetchFixtures(),
			Promise.all(AGENTS.map((a) => fetchAgentView(a.name, a.boxName)))
		]);

		// Next game day: today if it has games, otherwise the soonest future date.
		const upcoming = fixtures.filter((m) => m.date >= today());
		const nextDate = upcoming.reduce<string | null>(
			(min, m) => (min === null || m.date < min ? m.date : min),
			null
		);
		const nextGames = nextDate ? upcoming.filter((m) => m.date === nextDate) : [];

		// All games already played, newest first.
		const previousGames = fixtures
			.filter((m) => m.date < today())
			.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

		// Fixed display order: claude, openai, gemini (the AGENTS order).
		return { agents, nextGames, nextDate, previousGames };
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
