import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { statePath } from "./types.js";
import type { State } from "./types.js";

export function readState(): State {
  return JSON.parse(readFileSync(statePath(), "utf-8")) as State;
}

export function writeState(state: State): void {
  mkdirSync(dirname(statePath()), { recursive: true });
  writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

// Day 1 = start_date; recomputed from the calendar so it never drifts.
function dayNumber(startDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().split("T")[0]}T00:00:00Z`);
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

// ── CLI entry point ──

if (process.argv[1]?.endsWith("state.ts")) {
  if (process.argv[2] !== "get") {
    console.log(JSON.stringify({ error: "usage: state.ts get" }));
    process.exit(1);
  }

  const state = readState();
  state.day_number = dayNumber(state.start_date);
  writeState(state);
  console.log(JSON.stringify(state, null, 2));
}
