# 1C (BSL) Language Support

Syntax highlighting for the **1C:Enterprise built-in language (BSL)** in Obsidian code blocks — both in reading mode and in the editor.

## Supported tags

`1c` in any letter case, Cyrillic or Latin. The `bsl` tag is also supported.

## Features

- keywords in Russian and English (`Если`/`If`, `КонецЕсли`/`EndIf`, `Асинх`/`Async`, `Ждать`/`Await`, etc.);
- global context methods (`Сообщить`, `СтрДлина`, `Окр`, `ТекущаяДата`, `ЗначениеЗаполнено`…) and platform types (`Массив`, `Структура`, `Запрос`…);
- `Истина`, `Ложь`, `Неопределено`, `Null` literals;
- strings, including multiline ones with `|` continuation and `""` escaping;
- date literals `'20240101'`, numbers, `//` and `/* … */` comments;
- preprocessor directives (`#Если Сервер Тогда`, `#Область`) and annotations (`&НаСервере`, `&Перед("Имя")`);
- procedure and function names are highlighted at declaration.

## Installation

### From the community plugin directory

Open **Settings → Community plugins → Browse**, search for "1C", then install and enable **1C (BSL) Language Support**.

### Manual installation

1. Download `main.js` and `manifest.json` from the [latest GitHub release](https://github.com/Sanal/obsidian-onec-syntax-highlight/releases/latest).
2. Place both files into a folder named `onec-syntax-highlight` inside your vault:
   `<vault>/.obsidian/plugins/onec-syntax-highlight/`
3. In Obsidian, open **Settings → Community plugins**:
   - if Restricted Mode is enabled — turn it off;
   - enable **1C (BSL) Language Support** in the list.
4. If the plugin does not appear in the list — restart Obsidian.
5. Notes that were open before enabling the plugin may not highlight immediately — reopen them.

## Quick check

Paste into a note:

    ```1c
    Процедура Приветствие(Имя = "Мир") Экспорт
    	Если Не ЗначениеЗаполнено(Имя) Тогда
    		Имя = "мир";
    	КонецЕсли;
    	Сообщить(СтрШаблон("Привет, %1!", Имя)); // комментарий
    КонецПроцедуры
    ```

## Building from source

Requires Node.js 18+:

```bash
npm install
npm run build
```

`main.js` is a build artifact and is not committed to the repository — the build produces it in the project root. Copy it together with `manifest.json` into `<vault>/.obsidian/plugins/onec-syntax-highlight/` (see the steps above).

## Credits

The keyword and built-in function lists are based on the 1C language definitions from [highlight.js](https://github.com/highlightjs/highlight.js) (BSD-3-Clause) and [Prism](https://github.com/PrismJS/prism) (MIT).

License: MIT.
