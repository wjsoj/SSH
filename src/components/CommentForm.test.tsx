import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentForm } from "./CommentForm";

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

  it("should render comment form with textarea", () => {
    render(<CommentForm skillId="test-skill-id" />);

    expect(screen.getByPlaceholderText("Share your thoughts about this skill...")).toBeDefined();
  });

  it("should show post comment button", () => {
    render(<CommentForm skillId="test-skill-id" />);

    expect(screen.getByText("Post Comment")).toBeDefined();
  });
});
