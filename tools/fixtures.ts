import { readFileSync } from "fs";
import { fixturesPath } from "./types.js";
import type { Match } from "./types.js";

export function readFixtures(): Match[] {
  return JSON.parse(readFileSync(fixturesPath(), "utf-8")) as Match[];
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// ── CLI entry point ──

if (process.argv[1]?.endsWith("fixtures.ts")) {
  const cmd = process.argv[2];
  const all = readFixtures();

  let out: Match[];
  if (cmd === "all") {
    out = all;
  } else if (cmd === "today") {
    out = all.filter((m) => m.date === dateOffset(0));
  } else if (cmd === "yesterday") {
    out = all.filter((m) => m.date === dateOffset(-1));
  } else if (cmd === "next") {
    const upcoming = all
      .filter((m) => m.date >= dateOffset(0))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const nextDate = upcoming[0]?.date ?? null;
    // Normally just the soonest game day. Exception only at the very start: the
    // lone opening game would look empty, so on/before the opener we roll forward
    // to at least 3 games. Later light days (e.g. semis, final) stay on their own.
    const OPENER = "2026-06-11";
    if (nextDate && nextDate <= OPENER) {
      out = [];
      for (const m of upcoming) {
        if (out.length >= 3 && m.date !== out[out.length - 1].date) break;
        out.push(m);
      }
    } else {
      out = nextDate ? upcoming.filter((m) => m.date === nextDate) : [];
    }
  } else if (cmd === "upcoming") {
    // Games on the next N distinct game-day dates (default 2), today or later.
    // Predicting a multi-day window — not just the soonest day — gives every game
    // several predict runs before its date passes, so a single failed or missed
    // run never silently drops a game.
    const n = Math.max(1, Number.parseInt(process.argv[3] ?? "2", 10) || 2);
    const upcoming = all
      .filter((m) => m.date >= dateOffset(0))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const dates = [...new Set(upcoming.map((m) => m.date))].slice(0, n);
    out = upcoming.filter((m) => dates.includes(m.date));
  } else {
    console.log(JSON.stringify({ error: "usage: fixtures.ts <next|upcoming [days]|today|yesterday|all>" }));
    process.exit(1);
  }

  console.log(JSON.stringify(out, null, 2));
}
