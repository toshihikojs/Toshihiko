/**
 * Toshihiko - Field Tests
 */

import { ToshihikoField } from "../src/field";
import Type from "../src/field_type";

describe("🐣 field", () => {
    describe("create", () => {
        it("should throw error", () => {
            expect(() => {
                new ToshihikoField({} as any);
            }).toThrow("no field name specified.");
        });

        it("should create json object", () => {
            const field = new ToshihikoField({
                name: "foo",
                column: "bar",
                type: Type.Json,
                primaryKey: true,
                autoIncrement: true,
            });

            expect(field.name).toBe("foo");
            expect(field.column).toBe("bar");
            expect(field.type).toEqual(Type.Json);
            expect(field.validators).toEqual([]);
            expect(field.allowNull).toBe(false);
            expect(field.primaryKey).toBe(true);
            expect(field.autoIncrement).toBe(true);
            expect(field.defaultValue).toEqual({});
        });

        it("should have some default options", () => {
            const field = new ToshihikoField({
                name: "foo",
            });

            expect(field.name).toBe("foo");
            expect(field.column).toBe("foo");
            expect(field.type).toEqual(Type.String);
            expect(field.validators).toEqual([]);
            expect(field.allowNull).toBe(false);
            expect(field.primaryKey).toBe(false);
            expect(field.autoIncrement).toBe(false);
            expect(field.defaultValue).toBe("");
        });

        it("should have validator(s)", () => {
            const v1 = function () {};
            const v2 = function () {};

            let field = new ToshihikoField({ name: "foo", validators: v1 });
            expect(field.validators[0]).toBe(v1);

            field = new ToshihikoField({ name: "foo", validators: [v2, v1] });
            expect(field.validators[0]).toBe(v2);
            expect(field.validators[1]).toBe(v1);
        });
    });

    describe("parse and restore", () => {
        it("👙 parse", () => {
            const field = new ToshihikoField({
                name: "foo",
                type: {
                    name: "custom",
                    parse: function (value: any) {
                        expect(value).toBe("foo");
                        return ["foo"];
                    },
                    restore: function () {},
                },
            });
            expect(field.parse("foo")).toEqual(["foo"]);
        });

        it("👙 restore", () => {
            const field = new ToshihikoField({
                name: "foo",
                type: {
                    name: "custom",
                    restore: function (value: any) {
                        expect(value).toBe("foo");
                        return ["foo"];
                    },
                    parse: function () {},
                },
            });
            expect(field.restore("foo")).toEqual(["foo"]);
        });
    });

    describe("needQuotes", () => {
        it("should return type needQuotes", () => {
            const field1 = new ToshihikoField({ name: "foo", type: Type.String });
            expect(field1.needQuotes).toBe(true);

            const field2 = new ToshihikoField({ name: "bar", type: Type.Integer });
            expect(field2.needQuotes).toBe(false);
        });
    });
});
