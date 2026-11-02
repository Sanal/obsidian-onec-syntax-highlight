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

## Manual installation

1. Unpack `onec-language-support-1.0.0.zip` — it contains a `onec-language-support` folder.
2. Copy it into the `.obsidian/plugins/` folder of your vault:
   `<vault>/.obsidian/plugins/onec-language-support/`
   It should contain `main.js`, `manifest.json`, `README.md`.
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

After the build, copy the plugin folder into `.obsidian/plugins/` (see the steps above).

## Credits

The keyword and built-in function lists are based on the 1C language definitions from [highlight.js](https://github.com/highlightjs/highlight.js) (BSD-3-Clause) and [Prism](https://github.com/PrismJS/prism) (MIT).

License: MIT.

---

# 1C (BSL) Language Support

Подсветка синтаксиса встроенного языка **1С:Предприятие (BSL)** в блоках кода Obsidian — в режиме чтения и в редакторе.

## Поддерживаемые теги

`1c` вне зависимости от регистра или алфавита. Также поддерживается тег `bsl`.

## Возможности

- ключевые слова — русские и английские (`Если`/`If`, `КонецЕсли`/`EndIf`, `Асинх`/`Async`, `Ждать`/`Await` и т.д.);
- методы глобального контекста (`Сообщить`, `СтрДлина`, `Окр`, `ТекущаяДата`, `ЗначениеЗаполнено`…) и типы платформы (`Массив`, `Структура`, `Запрос`…);
- литералы `Истина`, `Ложь`, `Неопределено`, `Null`;
- строки, включая многострочные с продолжением `|` и экранирование `""`;
- литералы дат `'20240101'`, числа, комментарии `//` и `/* … */`;
- директивы препроцессора (`#Если Сервер Тогда`, `#Область`) и аннотации (`&НаСервере`, `&Перед("Имя")`);
- имена процедур и функций выделяются при объявлении.

## Установка из готового архива

1. Распакуйте `onec-language-support-1.0.0.zip` — внутри папка `onec-language-support`.
2. Скопируйте её в папку `.obsidian/plugins/` вашего хранилища:
   `<хранилище>/.obsidian/plugins/onec-language-support/`
   Внутри должны быть `main.js`, `manifest.json`, `README.md`.
3. В Obsidian откройте **Настройки → Сторонние плагины** (Community plugins):
   - если включён безопасный режим — отключите его;
   - включите **1C (BSL) Language Support** в списке.
4. Если плагин не появился в списке — перезапустите Obsidian.
5. Заметки, открытые до включения плагина, могут не подсветиться сразу — переоткройте их.

## Проверка

Вставьте в заметку:

    ```1с
    Процедура Приветствие(Имя = "Мир") Экспорт
    	Если Не ЗначениеЗаполнено(Имя) Тогда
    		Имя = "мир";
    	КонецЕсли;
    	Сообщить(СтрШаблон("Привет, %1!", Имя)); // комментарий
    КонецПроцедуры
    ```

## Сборка из исходников

Требуется Node.js 18+:

```bash
npm install
npm run build
```

После сборки папку плагина можно скопировать в `.obsidian/plugins/` (см. шаги выше).

## Благодарности

Списки ключевых слов и встроенных функций основаны на определениях языка 1C из [highlight.js](https://github.com/highlightjs/highlight.js) (BSD-3-Clause) и [Prism](https://github.com/PrismJS/prism) (MIT).

License: MIT.
