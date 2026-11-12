import {
	BUILTIN_SET,
	DEF_START_SET,
	KEYWORD_SET,
	LITERAL_SET,
	OPERATOR_WORD_SET,
	TYPE_SET,
} from "./onec-words";

// CodeMirror 5-совместимый stream-режим для встроенного языка 1С.
// Obsidian передаёт fenced-блоки с зарегистрированным именем режима
// в этот режим через CodeMirror.getMode().
// Модель токенов совпадает с Prism-грамматикой (режим чтения) и приведена
// к эталонной грамматике 1c-syntax: имя метода → def, параметры → variable,
// типы → type, методы глобального контекста → builtin, литералы → atom,
// логические операторы И/Или/Не → operator.

export interface OneCStream {
	eol(): boolean;
	sol(): boolean;
	peek(): string | undefined;
	next(): string | undefined;
	eat(ch: string): string | undefined;
	match(re: RegExp, consume?: boolean): RegExpMatchArray | null | undefined;
	skipToEnd(): void;
	column(): number;
	current(): string;
}

export interface OneCState {
	inString: boolean;
	inBlockComment: boolean;
	// Предыдущий токен — «Процедура»/«Функция»: следующий идентификатор — имя метода
	defNext: boolean;
	// Предыдущий токен — имя объявленного метода: следующая «(» открывает параметры
	afterDef: boolean;
	// Внутри скобок объявления метода: идентификаторы — параметры
	inParams: boolean;
	parenDepth: number;
}

// Читает тело строкового литерала (возможно многострочного,
// продолжение строки в 1С начинается с символа |).
function readString(stream: OneCStream, state: OneCState, justOpened: boolean): string {
	// Пустая строка "" сразу после открывающей кавычки
	if (justOpened && stream.peek() === '"' && charAt(stream, 1) !== '"') {
		stream.next();
		state.inString = false;
		return "string";
	}
	while (!stream.eol()) {
		const ch = stream.peek();
		if (ch === '"') {
			if (charAt(stream, 1) === '"') {
				// Удвоенная кавычка внутри строки
				stream.next();
				stream.next();
				continue;
			}
			stream.next();
			state.inString = false;
			break;
		}
		stream.next();
	}
	return "string";
}

// Двухсимвольный lookahead поверх CM5 StringStream
// (свойства .string/.pos — часть его публичного устройства).
function charAt(stream: OneCStream, offset: number): string | undefined {
	const s = stream as unknown as { string: string; pos: number };
	return s.string.charAt(s.pos + offset);
}

export function createOneCMode(): {
	name: string;
	startState: () => OneCState;
	copyState: (s: OneCState) => OneCState;
	token: (stream: OneCStream, state: OneCState) => string | null;
} {
	return {
		name: "1c",

		startState(): OneCState {
			return {
				inString: false,
				inBlockComment: false,
				defNext: false,
				afterDef: false,
				inParams: false,
				parenDepth: 0,
			};
		},

		copyState(s: OneCState): OneCState {
			return {
				inString: s.inString,
				inBlockComment: s.inBlockComment,
				defNext: s.defNext,
				afterDef: s.afterDef,
				inParams: s.inParams,
				parenDepth: s.parenDepth,
			};
		},

		token(stream: OneCStream, state: OneCState): string | null {
			// Блочный комментарий
			if (state.inBlockComment) {
				if (!stream.match(/^.*?\*\//)) {
					stream.skipToEnd();
				} else {
					state.inBlockComment = false;
				}
				return "comment";
			}

			// Многострочная строка
			if (state.inString) {
				if (stream.sol() && stream.peek() === "|") {
					stream.next();
					return "string";
				}
				return readString(stream, state, false);
			}

			// Директивы препроцессора (#Если, #Область, ...) и аннотации (&НаСервере, &Перед(...))
			if (stream.column() === 0 && stream.match(/^[ \t]*[#&]/, false)) {
				stream.skipToEnd();
				state.defNext = false;
				state.afterDef = false;
				return "meta";
			}

			// Комментарии
			if (stream.match(/^\/\//)) {
				stream.skipToEnd();
				return "comment";
			}
			if (stream.match(/^\/\*/)) {
				state.inBlockComment = true;
				if (!stream.match(/^.*?\*\//)) {
					stream.skipToEnd();
				} else {
					state.inBlockComment = false;
				}
				return "comment";
			}

			// Строковый литерал
			if (stream.peek() === '"') {
				stream.next();
				state.inString = true;
				state.defNext = false;
				state.afterDef = false;
				return readString(stream, state, true);
			}

			// Литерал даты: '20240101', '20240101120000'
			if (stream.peek() === "'") {
				stream.next();
				if (!stream.match(/^(?:\d{2}){1,7}'/)) {
					if (!stream.match(/^[^']*'/)) {
						stream.skipToEnd();
					}
				}
				state.defNext = false;
				state.afterDef = false;
				return "number";
			}

			// Число
			if (stream.match(/^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/)) {
				state.defNext = false;
				state.afterDef = false;
				return "number";
			}

			// Идентификатор (кириллица и латиница)
			if (stream.match(/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*/)) {
				const word = stream.current().toLowerCase();
				if (state.defNext) {
					state.defNext = false;
					state.afterDef = true;
					return "def";
				}
				if (OPERATOR_WORD_SET.has(word)) {
					state.defNext = false;
					state.afterDef = false;
					return "operator";
				}
				if (KEYWORD_SET.has(word)) {
					state.defNext = DEF_START_SET.has(word);
					state.afterDef = false;
					return "keyword";
				}
				if (LITERAL_SET.has(word)) {
					state.defNext = false;
					state.afterDef = false;
					return "atom";
				}
				// Параметры объявления метода
				if (state.inParams) {
					state.defNext = false;
					state.afterDef = false;
					return "variable";
				}
				if (BUILTIN_SET.has(word)) {
					state.defNext = false;
					state.afterDef = false;
					return "builtin";
				}
				if (TYPE_SET.has(word)) {
					state.defNext = false;
					state.afterDef = false;
					return "type";
				}
				return null;
			}

			// Операторы
			if (stream.match(/^(?:<>|<=|>=|[+\-*/%=<>])/)) {
				state.defNext = false;
				state.afterDef = false;
				return "operator";
			}

			// Пунктуация
			if (stream.match(/^[()[\],;.]/)) {
				const ch = stream.current().slice(-1);
				if (ch === "(") {
					if (state.afterDef) {
						state.inParams = true;
						state.parenDepth = 1;
					} else if (state.inParams) {
						state.parenDepth++;
					}
				} else if (ch === ")") {
					if (state.inParams) {
						state.parenDepth--;
						if (state.parenDepth <= 0) {
							state.inParams = false;
							state.parenDepth = 0;
						}
					}
				}
				state.defNext = false;
				state.afterDef = false;
				return "punctuation";
			}

			// Любой другой символ (пробелы не сбрасывают ожидание имени
			// объявления после «Процедура»/«Функция»)
			const other = stream.next();
			if (other !== undefined && !/\s/.test(other)) {
				state.defNext = false;
				state.afterDef = false;
			}
			return null;
		},
	};
}
