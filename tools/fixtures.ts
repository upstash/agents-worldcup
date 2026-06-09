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
    // The soonest match day: today if it has games, otherwise the next day that does.
    const upcoming = all.filter((m) => m.date >= dateOffset(0));
    const nextDate = upcoming.reduce<string | null>(
      (min, m) => (min === null || m.date < min ? m.date : min),
      null,
    );
    out = nextDate ? upcoming.filter((m) => m.date === nextDate) : [];
  } else {
    console.log(JSON.stringify({ error: "usage: fixtures.ts <next|today|yesterday|all>" }));
    process.exit(1);
  }

  console.log(JSON.stringify(out, null, 2));
}
