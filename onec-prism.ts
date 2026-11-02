import { BUILTINS, KEYWORDS_EN, KEYWORDS_RU, LITERALS_EN, LITERALS_RU, TYPES } from "./onec-words";

// Грамматика Prism для режима чтения. Prism в Obsidian загружается лениво
// и не распознаёт кириллический тег «1с» из класса language-*,
// поэтому плагин дополнительно нормализует класс до «language-1c».

// Кириллические диапазоны для границ слов (как в грамматике bsl из Prism)
const CYR =
	"\\u0400-\\u0484\\u0487-\\u052f\\u1d2b\\u1d78\\u2de0-\\u2dff\\ua640-\\ua69f\\ufe2e-\\ufe2f";
const WORD_CHARS = `\\w${CYR}`;

function alternation(words: string): string {
	return words.trim().split(/\s+/).join("|");
}

function bounded(words: string): string {
	return `(^|[^${WORD_CHARS}])(?:${alternation(words)})(?![${WORD_CHARS}])`;
}

export function buildOneCPrismGrammar(): Record<string, unknown> {
	return {
		comment: [/\/\/.*/, /\/\*[\s\S]*?(?:\*\/|$)/],

		// Директивы препроцессора (#Если Сервер Тогда) и аннотации (&НаСервере, &Перед("..."))
		directive: {
			pattern: /^[ \t]*[#&][^\n]*/gm,
			greedy: true,
			alias: "important",
		},

		string: {
			pattern: /"(?:[^"]|"")*"(?!")/,
			greedy: true,
		},

		// Литерал даты: '20240101', '20240101120000'
		date: {
			pattern: new RegExp(`(^|[^${WORD_CHARS}])'(?:\\d{2}){1,7}'`),
			lookbehind: true,
			alias: "number",
		},

		number: {
			pattern: new RegExp(`(^|[^${WORD_CHARS}])(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[eE][+-]?\\d+)?(?![${WORD_CHARS}])`),
			lookbehind: true,
		},

		keyword: [
			{
				pattern: new RegExp(bounded(KEYWORDS_RU + " " + LITERALS_RU), "i"),
				lookbehind: true,
			},
			{
				pattern: new RegExp(`\\b(?:${alternation(KEYWORDS_EN + " " + LITERALS_EN)})\\b`, "i"),
			},
		],

		builtin: {
			pattern: new RegExp(bounded(BUILTINS), "i"),
			lookbehind: true,
		},

		"class-name": {
			pattern: new RegExp(bounded(TYPES), "i"),
			lookbehind: true,
		},

		operator: /<>|<=|>=|[+\-*/%=<>]/,

		punctuation: /[()[\],;.]/,
	};
}
