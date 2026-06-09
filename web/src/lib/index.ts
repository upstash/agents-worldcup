// place files you want to import through the `$lib` alias in this folder.

// Display label for an agent key (the key itself stays lowercase everywhere).
export function agentLabel(name: string): string {
	return { claude: 'Claude', gemini: 'Gemini', openai: 'OpenAI' }[name] ?? name;
}
