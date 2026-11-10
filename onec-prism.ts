import {
  BUILTINS,
  KEYWORDS_EN,
  KEYWORDS_RU,
  LITERALS,
  OPERATORS_WORDS,
  OPERATOR_WORD_SET,
  TYPES,
} from "./onec-words";

// Грамматика Prism для режима чтения. Модель токенов приведена к эталонной
// грамматике 1c-syntax (syntaxes/1c.tmLanguage.json): имя метода при
// объявлении → function, параметры → variable, типы → class-name, методы
// глобального контекста → builtin, литералы → constant, логические операторы
// И/Или/Не → operator (исключены из ключевых слов).

// Кириллические диапазоны для границ слов
const CYR = "\\u0400-\\u04ff";
const WORD_CHARS = `\\w${CYR}`;
const IDENT = "[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*";

function wordsMinus(words: string, remove: Set<string>): string {
  return words
    .split(/\s+/)
    .filter((w) => w.length > 0 && !remove.has(w))
    .join(" ");
}

function alternation(words: string): string {
  return words.trim().split(/\s+/).join("|");
}

function bounded(words: string): string {
  return `(^|[^${WORD_CHARS}])(?:${alternation(words)})(?![${WORD_CHARS}])`;
}

export function buildOneCPrismGrammar(): Record<string, unknown> {
  // И/Или/Не (and/or/not) выделяются как операторы — убираем их из ключевых слов
  const keywordsRu = wordsMinus(KEYWORDS_RU, OPERATOR_WORD_SET);
  const keywordsEn = wordsMinus(KEYWORDS_EN, OPERATOR_WORD_SET);

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

    // Объявление метода: Процедура Имя(Параметр, …) / Функция Имя(…)
    // greedy: объявление может пересекать строки в значениях параметров по умолчанию
    "method-declaration": {
      pattern: new RegExp(
        `(^|[^${WORD_CHARS}])(?:Процедура|Функция|Procedure|Function)\\s+` +
          `${IDENT}\\s*\\((?:[^()]|\\([^()]*\\))*\\)`,
        "i"
      ),
      lookbehind: true,
      greedy: true,
      inside: {
        "decl-keyword": {
          pattern: /(?:Процедура|Функция|Procedure|Function)(?=\s)/i,
          alias: "keyword",
        },
        params: {
          pattern: /\((?:[^()]|\([^()]*\))*\)/,
          inside: {
            "param-keyword": {
              pattern: new RegExp(bounded("знач val"), "i"),
              lookbehind: true,
            },
            "param-literal": {
              pattern: new RegExp(bounded(LITERALS), "i"),
              lookbehind: true,
              alias: "constant",
            },
            number: /(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/,
            operator: /=/,
            string: /"(?:[^"]|"")*"(?!")/,
            "param-name": {
              pattern: new RegExp(IDENT),
              alias: "variable",
            },
          },
        },
        "decl-name": {
          pattern: new RegExp(`(^|[^${WORD_CHARS}])(${IDENT})`),
          lookbehind: true,
          alias: "function",
        },
      },
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

    // Операторы — идут до keyword: слова И/Или/Не есть в обоих списках
    operator: [
      {
        pattern: new RegExp(bounded(OPERATORS_WORDS), "i"),
        lookbehind: true,
      },
      /<>|<=|>=|[+\-*/%=<>]/,
    ],

    keyword: [
      {
        pattern: new RegExp(bounded(keywordsRu), "i"),
        lookbehind: true,
      },
      {
        pattern: new RegExp(`\\b(?:${alternation(keywordsEn)})\\b`, "i"),
      },
    ],

    // Литералы: Истина, Ложь, Неопределено, Null, ...
    literal: {
      pattern: new RegExp(bounded(LITERALS), "i"),
      lookbehind: true,
      alias: "constant",
    },

    builtin: {
      pattern: new RegExp(bounded(BUILTINS), "i"),
      lookbehind: true,
    },

    "class-name": {
      pattern: new RegExp(bounded(TYPES), "i"),
      lookbehind: true,
    },

    punctuation: /[()[\],;.]/,
  };
}
