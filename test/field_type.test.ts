/**
 * Toshihiko - Field Type Tests
 */

import Type from "../src/field_type";

describe("🐣 field_type", () => {
    describe("👙 String", () => {
        it("should parse correctly", () => {
            expect(Type.String.parse("foo")).toBe("foo");
            expect(Type.String.parse(123)).toBe("123");
            expect(Type.String.parse(null)).toBe("");
            expect(Type.String.parse(undefined)).toBe("");
        });

        it("should restore correctly", () => {
            expect(Type.String.restore("foo")).toBe("foo");
            expect(Type.String.restore(123)).toBe("123");
            expect(Type.String.restore(null)).toBe("");
            expect(Type.String.restore(undefined)).toBe("");
        });

        it("should check equality", () => {
            expect(Type.String.equal!("foo", "foo")).toBe(true);
            expect(Type.String.equal!("foo", "bar")).toBe(false);
            expect(Type.String.equal!(123, "123")).toBe(true);
        });

        it("should have correct properties", () => {
            expect(Type.String.name).toBe("String");
            expect(Type.String.needQuotes).toBe(true);
            expect(Type.String.defaultValue).toBe("");
        });
    });

    describe("👙 Integer", () => {
        it("should parse correctly", () => {
            expect(Type.Integer.parse("123")).toBe(123);
            expect(Type.Integer.parse(456)).toBe(456);
            expect(Type.Integer.parse("789abc")).toBe(789);
        });

        it("should restore correctly", () => {
            expect(Type.Integer.restore("123")).toBe(123);
            expect(Type.Integer.restore(456)).toBe(456);
        });

        it("should check equality", () => {
            expect(Type.Integer.equal!("123", 123)).toBe(true);
            expect(Type.Integer.equal!(123, 456)).toBe(false);
        });

        it("should have correct properties", () => {
            expect(Type.Integer.name).toBe("Integer");
            expect(Type.Integer.needQuotes).toBe(false);
            expect(Type.Integer.defaultValue).toBe(0);
        });
    });

    describe("👙 Float", () => {
        it("should parse correctly", () => {
            expect(Type.Float.parse("123.45")).toBe(123.45);
            expect(Type.Float.parse(456.78)).toBe(456.78);
        });

        it("should restore correctly", () => {
            expect(Type.Float.restore("123.45")).toBe(123.45);
            expect(Type.Float.restore(456.78)).toBe(456.78);
        });

        it("should check equality", () => {
            expect(Type.Float.equal!("123.45", 123.45)).toBe(true);
            expect(Type.Float.equal!(123.45, 456.78)).toBe(false);
        });

        it("should have correct properties", () => {
            expect(Type.Float.name).toBe("Float");
            expect(Type.Float.needQuotes).toBe(false);
            expect(Type.Float.defaultValue).toBe(0.0);
        });
    });

    describe("👙 Boolean", () => {
        it("should parse correctly", () => {
            expect(Type.Boolean.parse(1)).toBe(true);
            expect(Type.Boolean.parse(0)).toBe(false);
            expect(Type.Boolean.parse("1")).toBe(true);
        });

        it("should restore correctly", () => {
            expect(Type.Boolean.restore(true)).toBe(1);
            expect(Type.Boolean.restore(false)).toBe(0);
        });

        it("should check equality", () => {
            expect(Type.Boolean.equal!(1, true)).toBe(true);
            expect(Type.Boolean.equal!(0, false)).toBe(true);
            expect(Type.Boolean.equal!(1, 0)).toBe(false);
        });

        it("should have correct properties", () => {
            expect(Type.Boolean.name).toBe("_Boolean");
            expect(Type.Boolean.needQuotes).toBe(false);
        });
    });

    describe("👙 Json", () => {
        it("should parse correctly", () => {
            expect(Type.Json.parse('{"foo":"bar"}')).toEqual({ foo: "bar" });
            expect(Type.Json.parse("invalid")).toEqual({});
        });

        it("should restore correctly", () => {
            expect(Type.Json.restore({ foo: "bar" })).toBe('{"foo":"bar"}');
        });

        it("should check equality", () => {
            expect(Type.Json.equal!({ foo: "bar" }, { foo: "bar" })).toBe(true);
            expect(Type.Json.equal!({ foo: "bar" }, { foo: "baz" })).toBe(false);
        });

        it("should have correct properties", () => {
            expect(Type.Json.name).toBe("Json");
            expect(Type.Json.needQuotes).toBe(true);
            expect(Type.Json.defaultValue).toEqual({});
        });
    });

    describe("👙 Datetime", () => {
        it("should parse correctly", () => {
            const date = Type.Datetime.parse("2020-01-01 12:00:00");
            expect(date).toBeInstanceOf(Date);
        });

        it("should restore correctly", () => {
            const date = new Date("2020-01-01T12:00:00Z");
            const restored = Type.Datetime.restore(date);
            expect(restored).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it("should check equality", () => {
            const date1 = new Date("2020-01-01T12:00:00Z");
            const date2 = new Date("2020-01-01T12:00:00Z");
            const date3 = new Date("2020-01-02T12:00:00Z");
            expect(Type.Datetime.equal!(date1, date2)).toBe(true);
            expect(Type.Datetime.equal!(date1, date3)).toBe(false);
        });

        it("should convert to JSON", () => {
            const date = new Date("2020-01-01T12:00:00Z");
            const json = Type.Datetime.toJSON!(date);
            expect(json).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
            expect(Type.Datetime.toJSON!(null)).toBe(null);
        });

        it("should have correct properties", () => {
            expect(Type.Datetime.name).toBe("Datetime");
            expect(Type.Datetime.needQuotes).toBe(true);
        });
    });

    describe("👙 $equal", () => {
        it("should check strict equality", () => {
            expect(Type.$equal(1, 1)).toBe(true);
            expect(Type.$equal("1", 1)).toBe(false);
            expect(Type.$equal({}, {})).toBe(false);
        });
    });
});
