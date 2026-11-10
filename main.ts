import { Plugin } from 'obsidian';
import Prism from 'prismjs';
import { createOneCMode } from './onec-cm-mode';
import { buildOneCPrismGrammar } from './onec-prism';

// Свой экземпляр Prism: не подсвечиваем блоки автоматически — только
// явные вызовы из пост-процессора (иначе Prism трогает чужие блоки).
Prism.manual = true;

interface CodeMirrorCompat {
  defineMode(name: string, factory: unknown): void;
  modes?: Record<string, unknown>;
}

declare global {
  interface Window {
    CodeMirror?: CodeMirrorCompat;
  }
}

// Режимы редактора: Obsidian извлекает из info-строки блока только
// символы [\w\/+#-]*. Поэтому «1c» → режим 1c, «1C» → режим 1C,
// а кириллические «1с»/«1С» обрезаются до «1». Покрываем все варианты,
// плюс каноническое имя bsl.
const EDITOR_MODE_NAMES = ['1c', '1C', '1', 'bsl'];

// Класс language-* для любого из вариантов тега: 1c, 1C, 1с, 1С
const LANGUAGE_CLASS_TEST = /(?:^|\s)language-1[cс](?=\s|$)/i;
const LANGUAGE_CLASS_REPLACE = /language-1[cс](?=\s|$)/gi;

// Грамматика режима чтения собирается один раз. Prism входит в бандл
// плагина, чтобы подсветка не зависела от версии Prism в Obsidian.
const READING_GRAMMAR = buildOneCPrismGrammar() as Prism.Grammar;

export default class OneCLanguagePlugin extends Plugin {
  private readonly modeFactories = new Map<string, unknown>();

  async onload() {
    this.registerEditorModes();

    // Режим чтения: нормализуем класс блока и подсвечиваем его через Prism.
    // sortOrder 100 — после встроенных обработчиков.
    this.registerMarkdownPostProcessor(
      (el) => this.processRenderedBlocks(el),
      100
    );

    this.app.workspace.onLayoutReady(() => {
      this.registerEditorModes();
      // Блоки, отрендеренные до загрузки плагина
      this.highlightAllBlocks();
    });
  }

  onunload() {
    this.unregisterEditorModes();
  }

  // ------------------------- Редактор (CodeMirror) -------------------------

  private registerEditorModes() {
    const cm = window.CodeMirror;
    if (!cm || typeof cm.defineMode !== 'function') return;
    for (const name of EDITOR_MODE_NAMES) {
      if (this.modeFactories.has(name)) continue;
      const factory = () => createOneCMode();
      this.modeFactories.set(name, factory);
      try {
        cm.defineMode(name, factory);
      } catch (e) {
        console.error(
          `1C language: не удалось зарегистрировать режим «${name}»`,
          e
        );
      }
    }
  }

  private unregisterEditorModes() {
    const cm = window.CodeMirror;
    if (cm && cm.modes) {
      for (const [name, factory] of this.modeFactories) {
        if (cm.modes[name] === factory) {
          delete cm.modes[name];
        }
      }
    }
    this.modeFactories.clear();
  }

  // ------------------------- Режим чтения (Prism) -------------------------

  private processRenderedBlocks(container: HTMLElement) {
    const codes = container.querySelectorAll('pre > code');
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i] as HTMLElement;
      if (!code || typeof code.className !== 'string') continue;
      if (!LANGUAGE_CLASS_TEST.test(code.className)) continue;
      this.normalizeLanguageClass(code);
      this.highlightElement(code);
    }
  }

  // Кириллический тег Prism не распознаёт (класс language-1с),
  // поэтому приводим класс к распознаваемому «language-1c»
  private normalizeLanguageClass(code: HTMLElement) {
    const targets: (HTMLElement | null)[] = [code, code.parentElement];
    for (const el of targets) {
      if (el && LANGUAGE_CLASS_TEST.test(el.className)) {
        el.className = el.className.replace(
          LANGUAGE_CLASS_REPLACE,
          'language-1c'
        );
      }
    }
  }

  private highlightElement(code: HTMLElement) {
    const text = code.textContent ?? '';
    try {
      code.innerHTML = Prism.highlight(text, READING_GRAMMAR, '1c');
    } catch (e) {
      console.error('1C language: ошибка подсветки Prism', e);
    }
  }

  private highlightAllBlocks() {
    const docs = new Set<Document>();
    docs.add(document);
    this.app.workspace.iterateAllLeaves((leaf) => {
      const el = leaf.view?.containerEl;
      if (el?.ownerDocument) docs.add(el.ownerDocument);
    });
    for (const doc of docs) {
      const codes = doc.querySelectorAll('pre > code');
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i] as HTMLElement;
        if (!code || typeof code.className !== 'string') continue;
        if (!LANGUAGE_CLASS_TEST.test(code.className)) continue;
        this.normalizeLanguageClass(code);
        this.highlightElement(code);
      }
    }
  }
}
