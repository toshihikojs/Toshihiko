/**
 * Toshihiko - Escaper Tests
 */

import { escape, escapeLike } from "../src/util/escaper";

describe("🐣 escaper", () => {
    describe("👙 escape", () => {
        it("should return non-string as is", () => {
            expect(escape(123)).toBe(123);
            expect(escape(null)).toBe(null);
            expect(escape(undefined)).toBe(undefined);
        });

        it("should escape special characters", () => {
            expect(escape("hello\nworld")).toBe("hello\\nworld");
            expect(escape("it's")).toBe("it\\'s");
            expect(escape('say "hi"')).toBe('say \\"hi\\"');
            expect(escape("tab\there")).toBe("tab\\there");
            expect(escape("null\0char")).toBe("null\\0char");
            expect(escape("carriage\rreturn")).toBe("carriage\\rreturn");
            expect(escape("back\bspace")).toBe("back\\bspace");
            expect(escape("back\\slash")).toBe("back\\\\slash");
        });

        it("should escape multiple special characters", () => {
            expect(escape("line1\nline2\ttab")).toBe("line1\\nline2\\ttab");
        });
    });

    describe("👙 escapeLike", () => {
        it("should escape underscore", () => {
            expect(escapeLike("foo_bar")).toBe("foo\\_bar");
        });

        it("should escape percent", () => {
            expect(escapeLike("100%")).toBe("100\\%");
        });

        it("should escape both", () => {
            expect(escapeLike("50%_off")).toBe("50\\%\\_off");
        });

        it("should not escape other characters", () => {
            expect(escapeLike("hello world")).toBe("hello world");
        });
    });
});
