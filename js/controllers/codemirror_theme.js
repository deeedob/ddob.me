import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const customHighlightStyle = HighlightStyle.define([
  // === COMMENTS & DOCUMENTATION ===
  { tag: [t.comment, t.docComment, t.lineComment, t.blockComment],
    color: "var(--cm-comment)"
  },

  // === PREPROCESSOR & MACROS ===
  { tag: [t.meta, t.processingInstruction, t.macroName],
    color: "var(--cm-macro)"
  },

  // === KEYWORDS & CONTROL FLOW ===
  // Fix: Include all keyword types and const-specific keyword
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword],
    color: "var(--cm-keyword)"
  },
  { tag: t.operatorKeyword,
    color: "var(--cm-operator-light)"
  },
  // Special color for const/let/var keywords
  { tag: t.definitionKeyword,
    color: "var(--cm-keyword-const)"
  },

  // === TYPES & CLASSES ===
  { tag: [t.typeName, t.className, t.namespace],
    color: "var(--cm-type)"
  },

  // === FUNCTIONS & METHODS ===
  { tag: [t.function(t.variableName), t.standard(t.function(t.variableName))],
    color: "var(--cm-function)"
  },
  { tag: t.definition(t.function(t.variableName)),
    color: "var(--cm-function-light)"
  },

  // === VARIABLES & PARAMETERS ===
  { tag: [t.variableName, t.standard(t.variableName)],
    color: "var(--cm-variable)"
  },
  { tag: [t.definition(t.variableName), t.local(t.variableName)],
    color: "var(--cm-variable-light)"
  },
  { tag: t.self,
    color: "var(--cm-variable-dark)"
  },
  // CONST VARIABLES - Different color to stand out
  { tag: t.constant(t.variableName),
    color: "var(--cm-variable-const)"
  },
  { tag: t.constant(t.definition(t.variableName)),
    color: "var(--cm-variable-const)"
  },

  // === PROPERTIES & MEMBERS ===
  { tag: [t.propertyName, t.attributeName],
    color: "var(--cm-property)"
  },
  { tag: t.definition(t.propertyName),
    color: "var(--cm-property-dark)"
  },

  // === STRINGS & LITERALS ===
  { tag: [t.string, t.docString, t.character, t.attributeValue],
    color: "var(--cm-string)"
  },
  { tag: [t.special(t.string), t.escape],
    color: "var(--cm-string-light)"
  },

  // === NUMBERS & CONSTANTS ===
  { tag: [t.number, t.integer, t.float, t.atom],
    color: "var(--cm-number)"
  },
  { tag: [t.bool, t.null, t.constant(t.name)],
    color: "var(--cm-number-light)"
  },

  // === OPERATORS & PUNCTUATION ===
  { tag: [t.operator, t.arithmeticOperator, t.logicOperator, t.bitwiseOperator,
          t.compareOperator, t.updateOperator, t.definitionOperator,
          t.typeOperator, t.controlOperator],
    color: "var(--cm-operator)"
  },
  { tag: t.derefOperator,
    color: "var(--cm-operator-light)"
  },
  { tag: [t.punctuation, t.separator, t.bracket, t.angleBracket,
          t.squareBracket, t.paren, t.brace],
    color: "var(--cm-punctuation)"
  },

  // === TAGS & LABELS ===
  { tag: [t.tagName, t.labelName],
    color: "var(--cm-property-dark)"
  },

  // === ANNOTATIONS & MODIFIERS ===
  { tag: [t.annotation, t.modifier],
    color: "var(--cm-comment-light)"
  },

  // === URLS & REGEX ===
  { tag: [t.url, t.regexp, t.color],
    color: "var(--cm-string-light)"
  },

  // === SPECIAL & INVALID ===
  { tag: t.special(t.variableName),
    color: "var(--cm-variable-light)"
  },
  { tag: t.invalid,
    color: "var(--cm-macro)",
    backgroundColor: "var(--cm-macro)"
  },
  { tag: t.deleted,
    color: "var(--cm-macro-light)"
  },

  // === TEXT FORMATTING ===
  { tag: t.strong,
    color: "var(--cm-variable-light)"
  },
  { tag: t.emphasis,
    color: "var(--cm-variable-dark)"
  },
  { tag: t.link,
    color: "var(--cm-function)"
  },
  { tag: t.heading,
    color: "var(--cm-property-dark)"
  },
  { tag: t.monospace,
    color: "var(--cm-variable)"
  },
  { tag: t.strikethrough,
    color: "var(--cm-comment)"
  },
]);

const baseTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--color-panel)",
    color: "var(--color-content)",
    fontSize: "14px",
    borderRadius: "14px",
    padding: "14px",
  },

  "&.cm-focused": {
    outline: "none",
  },

  ".cm-content": {
    caretColor: "var(--color-accent)",
  },

  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--color-primary)",
  },

  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--color-overlay)",
  },

  ".cm-gutters": {
    backgroundColor: "var(--color-panel)",
    color: "var(--color-content-muted)",
    border: "none",
  },

  ".cm-activeLine": {
    backgroundColor: "var(--color-panel)",
  },

  ".cm-activeLineGutter": {
    backgroundColor: "var(--color-panel)",
    color: "var(--color-primary)",
  },

  "&:hover .cm-activeLine, &:hover .cm-activeLineGutter": {
    backgroundColor: "var(--color-background)",
  },

  ".cm-selectionMatch": {
    backgroundColor: "var(--color-overlay)",
  },

  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "var(--color-overlay)",
    outline: "1px solid var(--color-accent)",
  },

  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--color-content-muted)",
  },

  ".cm-line:has(.cm-foldPlaceholder), .cm-activeLine:has(.cm-foldPlaceholder)":
    {
      height: "14px",
      lineHeight: "14px",
    },

  ".cm-tooltip": {
    backgroundColor: "var(--color-panel)",
    border: "1px solid var(--color-overlay)",
  },

  ".cm-panels": {
    backgroundColor: "var(--color-panel)",
    color: "var(--color-content)",
  },

  ".cm-searchMatch": {
    backgroundColor: "var(--color-state-info)",
    outline: "1px solid var(--color-state-info)",
  },

  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--color-state-info)",
  },

  // Vim-specific styles
  ".cm-vimMode .cm-line ::selection": {
    backgroundColor: "transparent",
  },

  "&.cm-focused .cm-fat-cursor": {
    backgroundColor: "var(--color-state-info)",
  },

  "&:not(.cm-focused) .cm-fat-cursor": {
    backgroundColor: "transparent",
    outline: "solid 1px var(--color-accent)",
  },
}, { dark: true });

const codemirrorTheme = [
  baseTheme,
  syntaxHighlighting(customHighlightStyle)
];

export { codemirrorTheme };
