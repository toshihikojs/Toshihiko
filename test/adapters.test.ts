/**
 * Toshihiko - Adapters tests
 */

import { BaseAdapter } from "../src/adapters/base";

describe("adapters/base", () => {
    const adapter = new BaseAdapter({}, {});

    describe("create", () => {
        it("should create a base adapter", () => {
            const par = {};
            const options = { foo: "bar" };
            const adapter = new BaseAdapter(par, options);

            expect(adapter.parent).toEqual(par);
            expect(adapter.options).toEqual(options);
            expect(adapter.options).not.toBe(options);
        });
    });

    describe("execute", () => {
        it("should be async", (done) => {
            let flag = false;
            let ok = false;

            adapter.execute({}, function () {
                flag = true;
                if (ok) done();
            });

            expect(flag).toEqual(false);
            ok = true;
        });
    });

    describe("not implemented", () => {
        function test(name: string, callbackPos: number) {
            it(`${name}: should get error`, (done) => {
                const argu: any[] = [];
                for (let i = 0; i < callbackPos; i++) argu.push(null);
                argu.push(function (err: any) {
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message.indexOf("not implemented")).toBeGreaterThan(0);
                    done();
                });
                (adapter as any)[name].apply(adapter, argu);
            });
        }

        test("find", 1);
        test("count", 1);
        test("updateByQuery", 1);
        test("deleteByQuery", 1);
        test("insert", 3);
        test("update", 4);
        test("beginTransaction", 0);
        test("rollback", 1);
        test("commit", 1);
        test("execute", 100);
    });
});
