/**
 * Toshihiko - Toshihiko main class tests
 */

import path from "path";

import { hackAsyncReturn, hackAsyncErr } from "./util/hack";
import { Toshihiko } from "../src/toshihiko";
import { BaseAdapter } from "../src/adapters/base";
import { Cache } from "./util/cache";

describe("toshihiko", () => {
    describe("create", () => {
        it("should create with base adapter", () => {
            const options = { foo: 1 };
            const toshihiko = new Toshihiko("base", options);
            expect(toshihiko.options).toEqual(options);
            expect(toshihiko.adapter).toBeInstanceOf(BaseAdapter);
        });

        it("should create with base adapter using module", () => {
            const options = { foo: 1, showSql: true };
            const toshihiko = new Toshihiko(BaseAdapter, options);
            expect(toshihiko.options).toEqual(options);
            expect(toshihiko.adapter).toBeInstanceOf(BaseAdapter);
        });
    });

    describe("execute", () => {
        it("should call adapter's execute", (done) => {
            const options = {};
            const Adapter = function (this: any, toshihiko: any, _options: any) {
                this.toshihiko = toshihiko;
                expect(_options).toEqual(options);
            };

            Adapter.prototype.execute = function (foo: string, bar: string) {
                expect(foo).toEqual("fooooo");
                expect(bar).toEqual("barrrr");
                done();
            };
            const toshihiko = new Toshihiko(Adapter as any, options);
            expect((toshihiko.adapter as any).toshihiko).toEqual(toshihiko);
            toshihiko.execute("fooooo", "barrrr");
        });

        describe("promise", () => {
            const toshihiko = new Toshihiko("base");

            it("should resolve", async () => {
                hackAsyncReturn(toshihiko.adapter, "execute", [undefined, ["ok"], "again"]);
                const result = await toshihiko.execute(1, 2, 3);
                expect(result).toEqual(["ok"]);
            });

            it("should reject", async () => {
                hackAsyncErr(toshihiko.adapter, "execute");
                await expect(toshihiko.execute(4, function (err: any) {
                    expect(err.message).toEqual("execute predefinition 1");
                })).rejects.toThrow("execute predefinition 1");
            });
        });
    });

    describe("define", () => {
        const toshihiko = new Toshihiko("base");

        it("should define a model", () => {
            const model = toshihiko.define("name", [{ name: "foo" }], { cache: { module: require("./util/cache") } });
            expect(model.name).toEqual("name");
            expect(model.schema).toBeInstanceOf(Array);
            expect(model.schema.length).toEqual(1);
            expect(model.cache).toBeInstanceOf(Cache);
            expect(model.parent).toEqual(toshihiko);
        });
    });

    describe("createCache", () => {
        it("pass cache instance", () => {
            const cache = {
                deleteData: function () {},
                deleteKeys: function () {},
                setData: function () {},
                getData: function () {},
            };

            expect(Toshihiko.createCache(cache)).toEqual(cache);
        });

        it("pass cache path", () => {
            const param = { path: path.resolve(__dirname, "./util/cache"), bar: "barrrr", foo: "fooooo" };
            const cache = Toshihiko.createCache(param) as any;
            expect(cache).toBeInstanceOf(Cache);
            expect(cache.foo).toEqual("fooooo");
            expect(cache.bar).toEqual("barrrr");
        });

        it("pass cache create", () => {
            const param = { module: require("./util/cache"), bar: "barrrr", foo: "fooooo" };
            const cache = Toshihiko.createCache(param) as any;
            expect(cache).toBeInstanceOf(Cache);
            expect(cache.foo).toEqual("fooooo");
            expect(cache.bar).toEqual("barrrr");
        });
    });
});
