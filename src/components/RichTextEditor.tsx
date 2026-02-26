"use client";

import { Extension, InputRule } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { BlockMath, InlineMath, migrateMathStrings } from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewProps,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { Bold, Code, Italic, Link2, List, ListOrdered, Sigma, SquareCode } from "lucide-react";
import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

const blockMathFenceKey = new PluginKey("blockMathFence");

// Detects the pattern:
//   paragraph: "$$"
//   paragraph(s): <latex content>
//   paragraph: "$$"
// and collapses them into a blockMath node when the closing $$ line is entered.
const BlockMathFence = Extension.create({
  name: "blockMathFence",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: blockMathFenceKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== "Enter") return false;
            const { state } = view;
            const { $from } = state.selection;
            const currentNode = $from.parent;
            if (currentNode.type.name !== "paragraph") return false;
            const currentText = currentNode.textContent.trim();
            if (currentText !== "$$") return false;

            // Walk backwards to find the opening $$
            const currentPos = $from.before($from.depth);
            const doc = state.doc;
            let openPos = -1;
            const latexLines: string[] = [];

            doc.nodesBetween(0, currentPos, (node, pos) => {
              if (node.type.name !== "paragraph") return;
              const text = node.textContent.trim();
              if (text === "$$" && pos < currentPos) {
                openPos = pos;
                latexLines.length = 0; // reset, keep last opening $$
              } else if (openPos !== -1 && pos > openPos && pos < currentPos) {
                latexLines.push(node.textContent);
              }
            });

            if (openPos === -1 || latexLines.length === 0) return false;

            const latex = latexLines.join("\n").trim();
            if (!latex) return false;

            const blockMathType = state.schema.nodes.blockMath;
            if (!blockMathType) return false;

            // Replace from opening $$ node to end of closing $$ node
            const openNode = doc.nodeAt(openPos);
            if (!openNode) return false;
            const from = openPos;
            const to = currentPos + currentNode.nodeSize;

            const tr = state.tr.replaceWith(from, to, blockMathType.create({ latex }));
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

const LANGUAGES = [
  "plaintext",
  "bash",
  "c",
  "cpp",
  "css",
  "diff",
  "go",
  "graphql",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "markdown",
  "python",
  "ruby",
  "rust",
  "shell",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
];

function CodeBlockComponent({ node, updateAttributes }: ReactNodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "plaintext";
  // Normalize language name to match our list (e.g. "c++" → "cpp")
  const normalizedLang = LANGUAGES.includes(language) ? language : "plaintext";
  return (
    <NodeViewWrapper className="relative my-4">
      <div className="flex items-center rounded-t-md border border-b-0 bg-muted px-3 py-1.5">
        <select
          contentEditable={false}
          value={normalizedLang}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="bg-transparent text-xs text-muted-foreground focus:outline-none cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <pre className="rounded-b-md border border-t-0 bg-muted overflow-x-auto p-4 !m-0">
        <code className="font-mono text-sm leading-relaxed">
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}

const MAX_CHARS = 2000;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Share your insights...",
  disabled = false,
}: RichTextEditorProps) {
  const isMigratingRef = useRef(false);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        code: { HTMLAttributes: { class: "rounded bg-muted px-1 py-0.5 font-mono text-sm" } },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
        defaultLanguage: "plaintext",
        HTMLAttributes: { class: "not-prose" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 hover:text-primary/80",
        },
      }),
      Markdown,
      // $...$ → inline math (single dollar)
      InlineMath.extend({
        addInputRules() {
          return [
            new InputRule({
              find: /(^|[^$])\$([^$\n]+?)\$(?!\$)/,
              handler: ({ state, range, match }) => {
                const latex = match[2];
                const { tr } = state;
                tr.replaceWith(range.from, range.to, this.type.create({ latex }));
              },
            }),
          ];
        },
      }).configure({
        katexOptions: { throwOnError: false },
        onClick: (node, pos) => {
          const editor = editorRef.current;
          if (!editor) return;
          // Expand to editable text — user closes with $ to re-render
          editor
            .chain()
            .setNodeSelection(pos)
            .deleteSelection()
            .insertContent(`$${node.attrs.latex}`)
            .run();
        },
      }),
      BlockMathFence,
      // $$...$$ → block math via fence syntax (no input rule needed)
      BlockMath.configure({
        katexOptions: { throwOnError: false },
        onClick: (node, pos) => {
          const editor = editorRef.current;
          if (!editor) return;
          // Expand to editable fence — user closes with $$ + Enter to re-render
          editor
            .chain()
            .setNodeSelection(pos)
            .deleteSelection()
            .insertContent([
              { type: "paragraph", content: [{ type: "text", text: "$$" }] },
              { type: "paragraph", content: [{ type: "text", text: node.attrs.latex }] },
            ])
            .run();
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: MAX_CHARS }),
    ],
    content: value,
    editable: !disabled,
    onCreate({ editor }) {
      // Migrate $...$ text in initial content only
      if (editor.state.doc.textContent.includes("$")) {
        migrateMathStrings(editor);
      }
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[100px] px-4 py-3 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none",
      },
      handleKeyDown(view, event) {
        if (event.key !== "Enter") return false;
        const { state } = view;
        const { $from } = state.selection;
        if ($from.parent.type.name !== "paragraph") return false;
        const text = $from.parent.textContent.trim();
        const match = text.match(/^```([a-zA-Z0-9+#.-]*)$/);
        if (!match) return false;
        const raw = match[1].toLowerCase();
        const language = LANGUAGES.includes(raw) ? raw : "plaintext";
        const codeBlockType = state.schema.nodes.codeBlock;
        if (!codeBlockType) return false;
        const from = $from.before($from.depth);
        const to = from + $from.parent.nodeSize;
        const tr = state.tr.replaceWith(from, to, codeBlockType.create({ language }));
        view.dispatch(tr);
        return true;
      },
    },
    immediatelyRender: false,
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    if (value === "" && !editor.isEmpty) editor.commands.clearContent();
  }, [value, editor]);

  // Insert markdown snippets directly — no dialogs needed
  const insertLink = () => {
    editor
      ?.chain()
      .focus()
      .insertContent("[link text](https://)", { contentType: "markdown" })
      .run();
  };

  const insertCodeBlock = () => {
    editor
      ?.chain()
      .focus()
      .insertContent("\n```plaintext\n\n```\n", { contentType: "markdown" })
      .run();
  };

  const insertInlineMath = () => {
    editor?.chain().focus().insertInlineMath({ latex: "E = mc^2" }).run();
  };

  const insertBlockMath = () => {
    editor?.chain().focus().insertBlockMath({ latex: "\\frac{a}{b}" }).run();
  };

  const chars = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div
      className={cn(
        "rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring transition-shadow",
        disabled && "opacity-60 pointer-events-none",
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap">
        <Toggle
          size="sm"
          pressed={editor?.isActive("bold")}
          onPressedChange={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive("italic")}
          onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive("code")}
          onPressedChange={() => editor?.chain().focus().toggleCode().run()}
          aria-label="Inline code"
        >
          <Code className="h-3.5 w-3.5" />
        </Toggle>
        <div className="w-px h-4 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor?.isActive("bulletList")}
          onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive("orderedList")}
          onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Toggle>
        <div className="w-px h-4 bg-border mx-1" />
        <Toggle size="sm" pressed={false} onPressedChange={insertLink} aria-label="Insert link">
          <Link2 className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive("codeBlock")}
          onPressedChange={insertCodeBlock}
          aria-label="Code block"
        >
          <SquareCode className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={insertInlineMath}
          aria-label="Inline math"
        >
          <Sigma className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={insertBlockMath}
          aria-label="Block math"
          className="font-serif text-sm"
        >
          ∑
        </Toggle>
      </div>

      <EditorContent editor={editor} />

      <div className="px-4 py-1.5 border-t flex justify-end">
        <span
          className={cn(
            "text-xs tabular-nums text-muted-foreground",
            chars >= MAX_CHARS && "text-destructive",
          )}
        >
          {chars}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
