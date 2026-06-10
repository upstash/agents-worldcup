// ── Path constants ──

export const BOX_ROOT = process.env.BOX_ROOT ?? "/workspace/home";
export const DATA_DIR = process.env.DATA_DIR ?? `${BOX_ROOT}/data`;

export function fixturesPath(): string {
  return `${DATA_DIR}/fixtures.json`;
}

export function statePath(): string {
  return `${DATA_DIR}/state.json`;
}

export function guessesPath(): string {
  return `${DATA_DIR}/guesses.json`;
}

export function diaryPath(): string {
  return `${DATA_DIR}/diary.md`;
}

export function memoryPath(): string {
  return `${DATA_DIR}/memory.md`;
}

// ── Data schemas ──

export type Stage = "group" | "elimination";

// "A" = teamA wins, "B" = teamB wins, "draw" = draw (group games only).
export type Pick = "A" | "B" | "draw";

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  stage: Stage;
  group: string | null; // group letter for group games, null for elimination
  teamA: string;
  teamB: string;
}

export interface Guess {
  pick: Pick;
  reason?: string;
  actual?: Pick | null; // filled in when the match is scored
  correct?: boolean | null;
}

export interface State {
  agent: string;
  score: number;
  correct: number;
  total_guessed: number;
  day_number: number;
  start_date: string;
  last_action: { summary: string; timestamp: string } | null;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}
