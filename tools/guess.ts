import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { guessesPath } from "./types.js";
import type { Guess, Pick, Match } from "./types.js";
import { readFixtures } from "./fixtures.js";
import { readState, writeState } from "./state.js";

function readGuesses(): Record<string, Guess> {
  try {
    return JSON.parse(readFileSync(guessesPath(), "utf-8")) as Record<string, Guess>;
  } catch {
    return {};
  }
}

function writeGuesses(guesses: Record<string, Guess>): void {
  mkdirSync(dirname(guessesPath()), { recursive: true });
  writeFileSync(guessesPath(), JSON.stringify(guesses, null, 2));
}

function findMatch(id: string): Match | undefined {
  return readFixtures().find((m) => m.id === id);
}

// Group games allow a draw; elimination games do not.
function isValidPick(stage: Match["stage"], value: string): value is Pick {
  if (stage === "group") return value === "A" || value === "B" || value === "draw";
  return value === "A" || value === "B";
}

function pickError(stage: Match["stage"]): string {
  return stage === "group"
    ? "group pick must be A, B, or draw"
    : "elimination pick must be A or B";
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ── tournament rank (champion / finalist / third — flavour, NOT scored) ──

function setRank(position: string, team: string) {
  if (position !== "champion" && position !== "finalist" && position !== "third") {
    return { success: false, error: "position must be champion, finalist, or third" };
  }
  const teams = new Set(readFixtures().flatMap((m) => [m.teamA, m.teamB]));
  if (!teams.has(team)) {
    return { success: false, error: `unknown team: ${team}` };
  }

  const state = readState();
  if (state[position]) {
    return { success: false, error: `${position} already set to ${state[position]}` };
  }

  state[position] = team;
  state.last_action = { summary: `${position}: ${team}`, timestamp: new Date().toISOString() };
  writeState(state);
  return { success: true, position, team };
}

// ── predict ──

function predict(id: string, pick: string, reason?: string) {
  const match = findMatch(id);
  if (!match) return { success: false, error: `unknown match: ${id}` };
  if (!isValidPick(match.stage, pick)) return { success: false, error: pickError(match.stage) };
  if (match.date < today()) {
    return { success: false, error: `match ${id} already played (${match.date}); cannot predict` };
  }

  const guesses = readGuesses();
  const existing = guesses[id];
  // Picks lock on first write: a game is predicted exactly once, before kickoff.
  // This keeps repeated predict runs (and any post-kickoff run) from overwriting.
  if (existing) {
    return existing.actual != null
      ? { success: false, error: `match ${id} already scored` }
      : { success: false, error: `match ${id} already predicted (${existing.pick}); picks are locked` };
  }

  guesses[id] = { pick, reason, actual: null, correct: null };
  writeGuesses(guesses);
  return { success: true, matchId: id, pick, match: `${match.teamA} vs ${match.teamB}` };
}

// ── pending (unscored guesses whose match has been played — date <= today) ──

function pending() {
  const guesses = readGuesses();
  const byId = new Map(readFixtures().map((m) => [m.id, m] as const));
  const t = today();
  const out: Array<{
    matchId: string;
    date: string;
    stage: Match["stage"];
    teamA: string;
    teamB: string;
    pick: Pick;
  }> = [];
  for (const [id, g] of Object.entries(guesses)) {
    if (g.actual != null) continue; // already scored
    const match = byId.get(id);
    if (!match || match.date > t) continue; // not played yet
    out.push({ matchId: id, date: match.date, stage: match.stage, teamA: match.teamA, teamB: match.teamB, pick: g.pick });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.matchId.localeCompare(b.matchId));
  return out;
}

// ── result (self-reported, then scored) ──

function result(id: string, actual: string) {
  const match = findMatch(id);
  if (!match) return { success: false, error: `unknown match: ${id}` };
  if (!isValidPick(match.stage, actual)) return { success: false, error: pickError(match.stage) };

  const guesses = readGuesses();
  const guess = guesses[id];
  if (!guess) return { success: false, error: `no guess for match ${id} to score` };
  if (guess.actual != null) {
    return { success: true, alreadyScored: true, matchId: id, pick: guess.pick, actual: guess.actual, correct: guess.correct };
  }

  const correct = guess.pick === actual;
  guess.actual = actual as Pick;
  guess.correct = correct;
  writeGuesses(guesses);

  const state = readState();
  state.total_guessed += 1;
  if (correct) {
    state.correct += 1;
    state.score += 1;
  }
  state.last_action = {
    summary: `Scored ${match.teamA} vs ${match.teamB}: ${actual} (${correct ? "correct" : "wrong"})`,
    timestamp: new Date().toISOString(),
  };
  writeState(state);

  return { success: true, matchId: id, pick: guess.pick, actual, correct, score: state.score };
}

// ── CLI entry point ──

const args = process.argv.slice(2);
const cmd = args[0];

// Read-only listing of games that still need scoring — used by the `score` run.
if (cmd === "pending") {
  console.log(JSON.stringify(pending(), null, 2));
  process.exit(0);
}

let res: { success: boolean; error?: string };

if (cmd === "rank") {
  const position = args[1];
  const team = args.slice(2).join(" ");
  res = position && team
    ? setRank(position, team)
    : { success: false, error: "usage: guess.ts rank <champion|finalist|third> <team>" };
} else if (cmd === "predict") {
  const [, id, pick, ...reason] = args;
  res = id && pick
    ? predict(id, pick, reason.join(" ") || undefined)
    : { success: false, error: "usage: guess.ts predict <matchId> <A|B|draw> [reason]" };
} else if (cmd === "result") {
  const [, id, actual] = args;
  res = id && actual
    ? result(id, actual)
    : { success: false, error: "usage: guess.ts result <matchId> <A|B|draw>" };
} else {
  res = { success: false, error: "usage: guess.ts <rank|predict|result|pending> ..." };
}

console.log(JSON.stringify(res, null, 2));
if (!res.success) process.exit(1);
