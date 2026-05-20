"use client";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useMemo } from "react";

// Paper-cream theme matched to the global palette. Keep the editor visually
// quiet: code is the content, the chrome should disappear.
const paperTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "#171411",
      fontSize: "13.5px",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.65",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#B7AC97",
      border: "none",
      paddingRight: "10px",
    },
    ".cm-gutterElement": {
      padding: "0 8px 0 14px",
      fontVariantNumeric: "tabular-nums",
      fontSize: "12px",
    },
    ".cm-activeLine": { backgroundColor: "rgba(168, 66, 27, 0.045)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#A8421B" },
    ".cm-cursor": {
      borderLeftColor: "#A8421B",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#E9D2C0 !important",
    },
    ".cm-content": { padding: "12px 0", caretColor: "#A8421B" },
    ".cm-line": { padding: "0 14px" },
    ".cm-matchingBracket": {
      outline: "1px solid #A8421B",
      backgroundColor: "transparent",
      color: "#171411 !important",
    },
    ".cm-foldGutter .cm-gutterElement": { color: "#B7AC97" },
    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      color: "#7A6F60",
      border: "1px solid #D5CDB8",
      padding: "0 4px",
    },
  },
  { dark: false },
);

const paperHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword], color: "#A8421B", fontStyle: "italic" },
  { tag: [t.definitionKeyword, t.modifier], color: "#A8421B", fontStyle: "italic" },
  { tag: [t.string, t.special(t.string)], color: "#7A2F12" },
  { tag: [t.regexp], color: "#7A2F12" },
  { tag: [t.number, t.bool, t.null], color: "#9C7A14" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#9C9484", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#324F37" },
  { tag: [t.className, t.typeName], color: "#324F37" },
  { tag: [t.propertyName], color: "#3A332B" },
  { tag: [t.variableName], color: "#171411" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "#5A5145" },
  { tag: [t.tagName], color: "#A8421B" },
  { tag: [t.attributeName], color: "#9C7A14" },
  { tag: [t.heading], color: "#171411", fontWeight: "600" },
  { tag: [t.link], color: "#A8421B", textDecoration: "underline" },
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
      paperTheme,
      syntaxHighlighting(paperHighlight),
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
