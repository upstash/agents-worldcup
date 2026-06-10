export type Stage = 'group' | 'elimination';

// "A" = teamA wins, "B" = teamB wins, "draw" = draw (group games only).
export type Pick = 'A' | 'B' | 'draw';

export interface Match {
	id: string;
	date: string;
	stage: Stage;
	group: string | null;
	teamA: string;
	teamB: string;
}

export interface Guess {
	pick: Pick;
	reason?: string;
	actual?: Pick | null;
	correct?: boolean | null;
}

export interface State {
	agent: string;
	champion: string | null;
	finalist: string | null;
	third: string | null;
	score: number;
	correct: number;
	total_guessed: number;
	day_number: number;
	start_date: string;
	last_action: { summary: string; timestamp: string } | null;
}

export interface AgentView {
	name: string;
	state: State | null;
	guesses: Record<string, Guess>;
}
