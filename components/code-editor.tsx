"use client";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { useMemo } from "react";

export function CodeEditor({
  value, language, onChange, height = "400px",
}: {
  value: string;
  language: "python" | "javascript";
  onChange: (next: string) => void;
  height?: string;
}) {
  const extensions = useMemo<Extension[]>(
    () => [language === "python" ? python() : javascript({ jsx: false, typescript: false })],
    [language],
  );
  return (
    <CodeMirror
      value={value}
      height={height}
      theme="light"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ lineNumbers: true, foldGutter: true, history: true, autocompletion: false }}
      className="border border-gray-200 dark:border-gray-800 rounded"
    />
  );
}
