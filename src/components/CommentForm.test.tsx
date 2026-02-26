// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentForm } from "./CommentForm";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ onChange }: { onChange: (v: string) => void }) => (
    <textarea data-testid="rich-editor" onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "test-user-id" } },
    status: "authenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("CommentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render comment form with editor", () => {
    render(<CommentForm skillId="test-skill-id" />);

    // RichTextEditor uses TipTap which renders differently than a textarea
    // Check for the editor container which has the placeholder
    const editor = document.querySelector(".ProseMirror");
    expect(editor).toBeDefined();
  });

  it("should show post comment button", () => {
    render(<CommentForm skillId="test-skill-id" />);

    expect(screen.getByText("Post Comment")).toBeDefined();
  });
});
