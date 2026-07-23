/**
 * Toshihiko - Common Utilities Tests
 */

import { getParamNames, promisify, extend } from "../src/util/common";

describe("🐣 common", () => {
    describe("👙 getParamNames", () => {
        it("should recognize no argument", () => {
            let func: Function;
            func = function () {};
            expect(getParamNames(func)).toEqual([]);

            func = (function () {
                return function () {};
            })();
            expect(getParamNames(func)).toEqual([]);

            func = function () {
                console.log("function(argu) {}");
            };
            expect(getParamNames(func)).toEqual([]);

            func = eval("(function (     \n    \n      \n  \t) {         })");
            expect(getParamNames(func)).toEqual([]);
        });

        it("should recognize arguments", () => {
            let func: Function;
            func = function (foo: any, bar: any) {};
            expect(getParamNames(func)).toEqual(["foo", "bar"]);

            func = function (_asdf: any, 囍: any, _: any, λ: any) {};
            expect(getParamNames(func)).toEqual(["_asdf", "囍", "_", "λ"]);

            func = eval("(function 洗(   as   \n , sadf, /** sadf, */ 我, _  \n      \n  \t) {  //\n this.a = 1;       })");
            expect(getParamNames(func)).toEqual(["as", "sadf", "我", "_"]);
        });
    });

    describe("👙 promisify", () => {
        it("should get promise's callback 1", async () => {
            const callback = promisify(function (err: Error) {
                expect(err.message).toBe("123");
            });

            callback(new Error("123"));

            await expect(callback.promise).rejects.toThrow("123");
        });

        it("should get promise's callback 2", async () => {
            const callback = promisify(function (err: any, ok: number) {
                expect(ok).toBe(123);
            });

            callback(undefined, 123);

            await expect(callback.promise).resolves.toBe(123);
        });

        it("should have $promise", async () => {
            const callback = promisify();
            expect(callback.promise).toBe((callback.promise as any).$promise);

            callback(undefined, "ok");
            await expect(callback.promise).resolves.toBe("ok");
        });
    });

    describe("👙 extend", () => {
        it("should extend object with defaults", () => {
            const result = extend({ a: 1, b: 2 }, { b: 3, c: 4 });
            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        it("should deep extend nested objects", () => {
            const result = extend(
                { a: { x: 1, y: 2 } },
                { a: { y: 3, z: 4 } }
            );
            expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } });
        });

        it("should handle undefined defaults", () => {
            const result = extend(undefined, { a: 1 });
            expect(result).toEqual({ a: 1 });
        });
    });
});
