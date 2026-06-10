// place files you want to import through the `$lib` alias in this folder.

// Display label for an agent key (the key itself stays lowercase everywhere).
export function agentLabel(name: string): string {
	return { claude: 'Claude', gemini: 'Gemini', openai: 'OpenAI' }[name] ?? name;
}

// The model each agent runs (mirrors ahi.yaml; not stored in box data).
export function agentModel(name: string): string {
	return { claude: 'Fable 5', openai: 'GPT-5.5', gemini: 'Gemini 3.5 Flash' }[name] ?? '';
}

// Map team name → flag SVG filename (ISO 3166-1 alpha-2, with subdivisions for UK nations).
const teamFlagCodes: Record<string, string> = {
	'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czech Republic': 'cz',
	'Canada': 'ca', 'Bosnia & Herzegovina': 'ba', 'USA': 'us', 'Paraguay': 'py',
	'Qatar': 'qa', 'Switzerland': 'ch', 'Brazil': 'br', 'Morocco': 'ma',
	'Haiti': 'ht', 'Scotland': 'gb-sct', 'Australia': 'au', 'Turkey': 'tr',
	'Germany': 'de', 'Curacao': 'cw', 'Netherlands': 'nl', 'Japan': 'jp',
	'Ivory Coast': 'ci', 'Ecuador': 'ec', 'Sweden': 'se', 'Tunisia': 'tn',
	'Spain': 'es', 'Cape Verde': 'cv', 'Belgium': 'be', 'Egypt': 'eg',
	'Saudi Arabia': 'sa', 'Uruguay': 'uy', 'Iran': 'ir', 'New Zealand': 'nz',
	'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
	'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
	'Portugal': 'pt', 'DR Congo': 'cd', 'England': 'gb-eng', 'Croatia': 'hr',
	'Ghana': 'gh', 'Panama': 'pa', 'Uzbekistan': 'uz', 'Colombia': 'co',
};

/** Returns the path to a team's flag SVG, e.g. "/flags/br.svg". */
export function teamFlag(team: string): string {
	const code = teamFlagCodes[team] ?? '';
	return code ? `/flags/${code}.svg` : '';
}
