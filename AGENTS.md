# AGENTS.md — инструкции для ИИ-агентов

Плагин Obsidian: подсветка синтаксиса встроенного языка 1С (BSL) в блоках кода,
в режимах чтения (Prism) и редактирования (legacy stream-режим CodeMirror).

## Команды

- `npm run build` — production-сборка `main.js` (esbuild, минификация).
- `npx tsc --noEmit` — проверка типов. **Обязательно запускать после правок**:
  esbuild типы не проверяет, ошибки типов видны только так.

## Правила процесса

- **Не пушить в git без явной команды пользователя.** Рабочий цикл: правка →
  сборка `main.js` → пользователь проверяет вручную → команда на пуш.
- Релиз делается только по команде: bump `version` в `manifest.json` →
  коммит → push `main` → `git tag X.Y.Z` → `git push origin X.Y.Z`.
  Workflow `.github/workflows/release.yml` соберёт и опубликует релиз сам
  (сразу published, не draft). Тег должен точно совпадать с `version`
  (без префикса «v»).
- Каталог Obsidian читает `manifest.json` из HEAD основной ветки. Исправления
  по замечаниям ревью оформляются новым релизом с инкрементом версии.

## Требования платформы (Obsidian review) — соблюдать всегда

### manifest.json

- `description`: не содержать слова «Obsidian»; не начинаться с имени плагина;
  заканчиваться знаком препинания (`.`/`!`/`?`).
- `id`: строчные буквы и дефисы, без слова «obsidian», не заканчиваться на
  «plugin», уникален в каталоге.
- `version`: semver `x.y.z`; тег релиза совпадает с версией; релиз опубликован
  (черновики каталог не видит).

### Исходный код (линтеры ревью)

- **Запрещено присваивание `innerHTML`/`outerHTML`/`insertAdjacentHTML`**
  (блокирующая ошибка `no-unsanitized`). HTML собирать хелперами Obsidian
  (`createSpan`/`appendText`/`empty`), см. `appendTokens`/`appendToken` в `main.ts`.
- **Использовать хелперы Obsidian `createEl`/`createSpan`/`appendText`/`empty`
  вместо `document.createElement`/`createTextNode`** (правило
  `obsidianmd/prefer-create-el`). См. `appendTokens`/`appendToken` в `main.ts`.
- **Никакого неявного `any`**: внешние объекты (стримы CodeMirror и т.п.)
  описывать интерфейсом полностью — иначе `no-unsafe-assignment/call/
  member-access`. Касты `as unknown as ...` не считаются типизацией.
- Регэкспы: не включать комбинирующие символы Unicode (категория M, напр.
  диапазоны `2DE0–2DFF`, `FE2E–FE2F`) в символьные классы — варнинг
  «Unexpected combined character in character class».
- Зависимости: не использовать пакет `builtin-modules` и аналоги из
  [es-tooling/module-replacements](https://github.com/es-tooling/module-replacements)
  — брать `builtinModules` из `node:module`.

### Необязательное (не блокирует публикацию)

- GitHub artifact attestations для ассетов релиза — рекомендация, не сделано.

## Технические грабли проекта (проверено опытом)

- Prism не умеет маппить группы захвата в `inside` — только полная
  подграмматика над всем совпадением.
- Жадные (`greedy`) паттерны Prism разрезают текст на узлы: сквозные паттерны
  (объявление метода со строками в параметрах) тоже делать `greedy`.
- Obsidian поставляет старую сборку Prism, несовместимую с нашей грамматикой —
  используем встроенный в бандл `prismjs` (npm), не `window.Prism`.
  `Prism.manual = true` — иначе Prism сам подсветит чужие блоки.
- Обёртка `window.CodeMirror` в Obsidian игнорирует `tokenTable` legacy-режима
  и мапит имя токена в CSS-класс `cm-<имя>`.
- В режиме редактирования Obsidian по умолчанию не окрашивает
  `variableName.definition` (имя метода чёрное) — это поведение платформы,
  не баг плагина (встроенный JS в Obsidian ведёт себя так же).
- Кириллический тег `1с` в режиме чтения даёт класс `language-1с` — пост-
  процессор нормализует классы `language-1c/1C/1с/bsl/os` → `language-1c`.
- После перезапуска Obsidian DOM режима чтения дозаполняется уже после
  `layoutReady`, а preview не пересоздаётся при переключении чтение↔редакт. —
  поэтому `highlightAllBlocks` повторяется с задержкой (500/2000 мс) и
  вызывается на событии `layout-change`. Проход идемпотентен.
