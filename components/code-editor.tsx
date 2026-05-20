"use client";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useMemo } from "react";

// Dark graphite theme matched to the global palette. The editor's chrome
// should be quiet so the code is the content.
const graphiteTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "#ECE7D8",
      fontSize: "13.5px",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.65",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#4F525C",
      border: "none",
      paddingRight: "10px",
    },
    ".cm-gutterElement": {
      padding: "0 8px 0 14px",
      fontVariantNumeric: "tabular-nums",
      fontSize: "12px",
    },
    ".cm-activeLine": { backgroundColor: "rgba(200, 240, 73, 0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#C8F049" },
    ".cm-cursor": {
      borderLeftColor: "#C8F049",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(200, 240, 73, 0.22) !important",
    },
    ".cm-content": { padding: "12px 0", caretColor: "#C8F049" },
    ".cm-line": { padding: "0 14px" },
    ".cm-matchingBracket": {
      outline: "1px solid rgba(200, 240, 73, 0.6)",
      backgroundColor: "transparent",
      color: "#ECE7D8 !important",
    },
    ".cm-foldGutter .cm-gutterElement": { color: "#4F525C" },
    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      color: "#7A7565",
      border: "1px solid #2C2F3A",
      padding: "0 4px",
    },
    ".cm-tooltip": {
      backgroundColor: "#1B1D24",
      border: "1px solid #2C2F3A",
      color: "#ECE7D8",
    },
  },
  { dark: true },
);

const graphiteHighlight = HighlightStyle.define([
  // Keywords get the accent so control flow visually anchors the eye.
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword], color: "#C8F049", fontStyle: "italic" },
  { tag: [t.definitionKeyword, t.modifier], color: "#C8F049", fontStyle: "italic" },
  // Strings warm slightly to separate from the cream baseline.
  { tag: [t.string, t.special(t.string)], color: "#E0B077" },
  { tag: [t.regexp], color: "#E0B077" },
  // Numbers and bools share the amber family.
  { tag: [t.number, t.bool, t.null], color: "#E5B445" },
  // Comments dim and italic.
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#5F5C50", fontStyle: "italic" },
  // Functions and types in mint.
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#6FDCA0" },
  { tag: [t.className, t.typeName], color: "#6FDCA0" },
  // Property and variable names stay cream.
  { tag: [t.propertyName], color: "#C0BAA9" },
  { tag: [t.variableName], color: "#ECE7D8" },
  // Operators and punctuation muted.
  { tag: [t.operator, t.punctuation, t.bracket], color: "#9C9484" },
  // Markup (used by some highlights).
  { tag: [t.tagName], color: "#C8F049" },
  { tag: [t.attributeName], color: "#E5B445" },
  { tag: [t.heading], color: "#ECE7D8", fontWeight: "600" },
  { tag: [t.link], color: "#C8F049", textDecoration: "underline" },
]);

export function CodeEditor({
  value,
  language,
  onChange,
  height = "420px",
}: {
  value: string;
  language: "python" | "javascript";
  onChange: (next: string) => void;
  height?: string;
}) {
  const extensions = useMemo<Extension[]>(
    () => [
      language === "python" ? python() : javascript({ jsx: false, typescript: false }),
      graphiteTheme,
      syntaxHighlighting(graphiteHighlight),
      EditorView.lineWrapping,
    ],
    [language],
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        history: true,
        autocompletion: false,
        bracketMatching: true,
        closeBrackets: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: false,
      }}
      className="cm-theme"
    />
  );
}
