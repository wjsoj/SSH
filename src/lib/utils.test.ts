import { describe, expect, it, vi } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const result = cn("foo", false && "bar", "baz");
      expect(result).toBe("foo baz");
    });

    it("should handle arrays", () => {
      const result = cn(["foo", "bar"], "baz");
      expect(result).toBe("foo bar baz");
    });

    it("should handle objects", () => {
      const result = cn({ foo: true, bar: false, baz: true });
      expect(result).toBe("foo baz");
    });

    it("should handle mixed inputs", () => {
      const result = cn("foo", { bar: true, baz: false }, ["qux"]);
      expect(result).toBe("foo bar qux");
    });
  });
});
