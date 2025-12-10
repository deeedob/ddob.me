import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = {
    mode: String, // "preload" or "editor"
    key: String,
    code: String,
    language: String,
    section: String,
  };

  static cache = new Map(); // shared among all instances

  async connect() {
    if (this.modeValue === "preload") {
      this.preload();
    } else if (this.modeValue === "editor") {
      await this.renderEditor();
    }
  }

  preload() {
    const { keyValue, codeValue, languageValue } = this;
    if (!keyValue || !codeValue) return;

    this.constructor.cache.set(keyValue, {
      code: codeValue,
      language: languageValue,
    });

    console.log(`[CodeMirror] Preloaded ${keyValue} (${languageValue})`);
  }

  async renderEditor() {
    const entry = this.constructor.cache.get(this.keyValue);
    if (!entry) {
      console.warn(
        `[CodeMirror] No cached data found for key: ${this.keyValue}`,
      );
      return;
    }

    const { code, language } = entry;
    const sectionCode = this.extractSection(code, this.sectionValue);

    await this.createEditor(sectionCode, language);
  }

  extractSection(fullCode, sectionName) {
    if (!sectionName) return fullCode;

    const startMarker = `// @section-start:${sectionName}`;
    const endMarker = `// @section-end:${sectionName}`;

    const startIdx = fullCode.indexOf(startMarker);
    if (startIdx === -1) return fullCode;

    const endIdx = fullCode.indexOf(endMarker, startIdx + startMarker.length);
    if (endIdx === -1) return fullCode;

    const sectionCode = fullCode
      .slice(startIdx + startMarker.length, endIdx)
      .replace(/^\s*\n/, "") // remove leading empty lines
      .replace(/\n\s*$/, ""); // remove trailing empty lines;

    return sectionCode;
  }

  async createEditor(code, language) {
    try {
      const [
        { EditorView },
        { EditorState },
        { cpp },
        { vim },
        { codemirrorTheme },
        { basicSetup },
      ] = await Promise.all([
        import("codemirror"),
        import("@codemirror/state"),
        import("@codemirror/lang-cpp"),
        import("@replit/codemirror-vim"),
        import("./codemirror_theme"),
        import("./codemirror_basic_setup"),
      ]);

      const extensions = [
        vim(),
        basicSetup,
        cpp(),
        codemirrorTheme,
        EditorState.readOnly.of(true),
      ];

      new EditorView({
        doc: code,
        parent: this.element,
        extensions,
      });
    } catch (error) {
      console.error("CodeMirror init failed:", error);
      this.element.innerHTML = `<pre><code>${code}</code></pre>`;
    }
  }
}
