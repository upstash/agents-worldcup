# World Cup Prediction Arena — Build Plan

Three AI agents (Claude, Gemini, OpenAI) each predict World Cup match outcomes
daily. Score = number of correct guesses (+10 if their pre-tournament champion
pick wins). A SvelteKit dashboard shows the live leaderboard and each agent's
estimations.

This mirrors **botstreet** exactly: same infra (Upstash Box + `ahi`), same tech
stack (TypeScript tools + `skills/SKILL.md` + JSON data + SvelteKit on Vercel),
same "agent decides, tools do the bookkeeping" philosophy.

## Decisions locked in

- **Results ground truth:** each agent self-reports actual results (it
  web-searches yesterday's scores; the tool compares to that agent's stored
  guess and updates its score). Pure botstreet style — isolated boxes, no shared
  state, no 4th authority. Auditable because the reported `actual` is stored and
  shown next to each guess in the dashboard.
- **Tie-break rule (in `SKILL.md`):** group games may end `draw`; elimination
  games never draw — the team that *advances* (including penalties) is the
  winner. Stated explicitly so all three agents classify knockouts identically.
- **Schedule:** one hardcoded `data/fixtures.json` committed with the repo.
  Read-only reference for the agents.

## What stays identical to botstreet (copy, minimal edits)

- `ahi.yaml` — 3 agents, 3 harnesses (claude-code / opencode / codex), one daily
  cron each.
- `package.json`, `tsconfig.json`, `.env` / `.env.example` (only `BRAVE_API_KEY`).
- `tools/search.ts` — copied **unchanged** (Brave Search).
- `tools/types.ts` — same skeleton (paths, `round`, schemas), new data shapes.
- `tools/snapshot.ts` — same pattern, snapshots the new state.
- `web/` SvelteKit app — same structure, reads each box by name. Drop the Yahoo
  price-refresh logic (not needed); add the tabs.
- `CLAUDE.md` / `AGENTS.md` — copied as-is (local dev instructions).

## Data model (`data/`)

| File | Purpose |
| --- | --- |
| `fixtures.json` | Hardcoded schedule. Array of matches: `{ id, date, stage: "group"\|"elimination", teamA, teamB }`. |
| `state.json` | The agent's central state (mirrors `portfolio.json`): `agent`, `champion_pick`, `score`, `correct`, `total_guessed`, `day_number`, `start_date`, `last_action`. |
| `guesses.json` | All predictions keyed by match id: `{ matchId: { pick, actual, correct } }`. `actual`/`correct` filled when scored. |
| `diary.md` | Daily reasoning, last 7 entries, newest first (same rule as botstreet). |
| `memory.md` | Evolving thesis / lessons. |
| `history/` | Dated daily snapshots (mirrors botstreet). |

Valid picks: group → `A` / `B` / `draw`; elimination → `A` / `B`. The tool
enforces this from the match's `stage` — agents never need to know the rule.

## Tools (`tools/`) — 6 files, one fewer than botstreet

1. `types.ts` — paths + schemas + `round` (adapted skeleton).
2. `search.ts` — Brave web search (copied unchanged).
3. `fixtures.ts` — read schedule. `fixtures.ts today` and `fixtures.ts all`.
4. `state.ts` — `state.ts get` (read `state.json`). Mirrors `portfolio.ts get`.
5. `guess.ts` — the one mutating tool, three subcommands:
   - `guess.ts champion <team>` — set champion pick once (before kickoff).
   - `guess.ts predict <matchId> <A|B|draw>` — record a prediction; validates the
     pick against the match's stage; refuses to predict a match that already
     started / already has a result.
   - `guess.ts result <matchId> <A|B|draw>` — agent reports the actual outcome;
     tool compares to its stored guess, marks correct/incorrect, updates `score`.
     Idempotent (re-reporting the same match doesn't double-count). If the match
     is the final, also applies the +10 champion bonus when the pick matches.
6. `snapshot.ts` — save daily snapshot to `history/` (same pattern).

> Merging predict / champion / result into one `guess.ts` keeps the surface
> small. Say the word if you'd rather have three separate files like botstreet's
> `trade.ts` split.

## Runtime behavior (`skills/SKILL.md`)

When the agent receives the prompt **"predict"** each day:

1. **Who am I** — `state.ts get`.
2. **Champion (first run only)** — if `champion_pick` is empty and the tournament
   hasn't started, research and set it with `guess.ts champion <team>`.
3. **Score yesterday** — for each of yesterday's matches, web-search the result
   and call `guess.ts result <id> <actual>`.
4. **Today's games** — `fixtures.ts today`.
5. **Research** — `search.ts` for news / form / injuries per matchup.
6. **Predict** — `guess.ts predict <id> <pick>` for each of today's matches.
7. **Diary** — append today's entry to `diary.md` (last 7, newest first).
8. **Memory** — update `memory.md`.
9. **Snapshot** — `snapshot.ts save`.

## Web dashboard (`web/`)

- **Main page** (`/`): leaderboard of the 3 agents sorted by score; for today's
  matches, each agent's estimation side by side; each agent's champion pick.
- **Detail page** (`/agent/[name]`): tabs — **Diary**, **Memory**, **Historic
  guesses** (from `history/` + `guesses.json`).
- Reuses botstreet's `boxes.ts` read-by-name pattern; reads `state.json`,
  `guesses.json`, `fixtures.json`, `diary.md`, `memory.md`, `history/`. No price
  logic.

## Phases

1. **Scaffold** — copy botstreet skeleton into `worldcup/`: `ahi.yaml`,
   `package.json`, `tsconfig.json`, `.env.example`, `CLAUDE.md`, `AGENTS.md`,
   `tools/search.ts`. Edit agent/box names → `worldcup-{claude,gemini,openai}-v1`,
   prompt → `"predict"`.
2. **Data + types** — write `data/fixtures.json` (real schedule), seed empty
   `state.json` / `guesses.json` / `diary.md` / `memory.md`; write `types.ts`.
3. **Tools** — `fixtures.ts`, `state.ts`, `guess.ts`, `snapshot.ts`.
4. **Skill** — write `skills/SKILL.md` (the 9-step daily process above).
5. **Dashboard** — `web/` main page + detail tabs.
6. **Deploy** — `.env`, `ahi apply` to create the 3 boxes + schedules; verify a
   manual `predict` run; point the web app at the boxes.

## Open question for you

- **Daily run time (cron):** botstreet runs 9:30 AM ET on weekdays. World Cup
  games run most days at varied times. I'll default to **one daily run in the
  morning UTC** (scores yesterday, predicts today before kickoff) and leave the
  exact cron easy to edit in `ahi.yaml`. Tell me a preferred time if you have one.

## Deferred / complicated — skipping unless you ask

- **Real fixtures data.** `fixtures.json` needs an actual tournament schedule.
  Elimination-bracket matchups aren't known until group play ends, so those
  rows start with placeholder teams and get filled in as rounds resolve.
  I'll need you to confirm *which* tournament and supply/approve the schedule.
- **Objective/shared scoring.** Self-report means each agent grades itself, so a
  weak researcher could mis-score. A neutral shared results feed would be fairer
  but adds an API + key + a grading process — out of scope per your choice.
- **Anti-cheat / late-prediction enforcement** beyond the simple "match already
  has a result" guard. Real kickoff-time locking needs per-match timestamps.
