/**
 * Toshihiko - Query class tests
 */

import { DUMMY_CONN } from "./util/common";
import { ToshihikoQuery } from "../src/query";
import { Toshihiko } from "../src/toshihiko";
import { Yukari } from "../src/yukari";

describe("query", () => {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", [{ name: "key1", primaryKey: true }]);

    it("should create instance", () => {
        const query = new ToshihikoQuery(model);

        expect(query.field).toEqual(query.fields);
        expect(query.orderBy).toEqual(query.order);

        expect(query._fields).toEqual(["key1"]);
        expect(query._limit).toEqual([]);
        expect(query._order).toEqual([]);
        expect(query._updateData).toEqual({});
        expect(query._where).toEqual({});

        expect(query.toshihiko).toEqual(toshihiko);
        expect(query.adapter).toEqual(toshihiko.adapter);
        expect(query.model).toEqual(model);
        expect(query.cache).toBeNull();
    });

    describe("where", () => {
        it("should call where correctly", () => {
            const query = new ToshihikoQuery(model);
            const cond = {};
            const res = query.where(cond);

            expect(res).toEqual(query);
            expect(res._where).toEqual(cond);
        });

        it("should get an error", () => {
            const query = new ToshihikoQuery(model);

            expect(() => {
                query.where(1 as any);
            }).toThrow();
        });
    });

    describe("fields", () => {
        const query = new ToshihikoQuery(model);

        it("pass string", () => {
            let ret;

            ret = query.fields("a,b,foo");
            expect(ret).toEqual(query);
            expect(ret._fields).toEqual(["a", "b", "foo"]);

            ret = query.fields("a, b      ,    foo, , ");
            expect(ret).toEqual(query);
            expect(ret._fields).toEqual(["a", "b", "foo"]);
        });

        it("pass array", () => {
            let ret;

            ret = query.fields(["a", "b", "foo"]);
            expect(ret).toEqual(query);
            expect(ret._fields).toEqual(["a", "b", "foo"]);
        });

        it("should get an error", () => {
            expect(() => {
                query.fields(1 as any);
            }).toThrow();
        });
    });

    describe("limit", () => {
        const query = new ToshihikoQuery(model);

        it("pass string", () => {
            let ret;

            ret = query.limit("1,2");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit("   1,2    ,3,");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit("1,dsaflkj");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 0]);

            ret = query.limit("1");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1]);

            ret = query.limit("");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([]);

            ret = query.limit("dfa");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([0]);
        });

        it("pass array", () => {
            let ret;

            ret = query.limit(["1", 2]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit([1, 2, "3"]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit([1, "dsafklj"]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 0]);

            ret = query.limit([1]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1]);

            ret = query.limit([]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([]);

            ret = query.limit(["dfs"]);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([0]);
        });

        it("pass number", () => {
            let ret;

            ret = query.limit(123);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([123]);

            ret = query.limit(-1);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([-1]);
        });

        it("pass two arguments", () => {
            let ret;

            ret = query.limit("1" as any, 2);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit(1 as any, 2);
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 2]);

            ret = query.limit(1 as any, "dsafklj");
            expect(ret).toEqual(query);
            expect(ret._limit).toEqual([1, 0]);
        });

        it("should got an error", () => {
            expect(() => {
                query.limit(true as any);
            }).toThrow();
        });
    });

    describe("conn", () => {
        const query = new ToshihikoQuery(model);

        it("set conn", () => {
            query.conn(DUMMY_CONN);
            expect(query._conn).toEqual(DUMMY_CONN);
        });
    });

    describe("order", () => {
        const query = new ToshihikoQuery(model);

        it("pass string", () => {
            let ret;

            ret = query.order("   foo, bar aSc    , baz     desc");
            expect(ret).toEqual(query);
            expect(ret._order).toEqual([{ foo: 1 }, { bar: 1 }, { baz: -1 }]);

            ret = query.order("  ");
            expect(ret).toEqual(query);
            expect(ret._order).toEqual([]);
        });

        it("pass array", () => {
            let ret;

            ret = query.order(["foo", "bar DeSC", { baz: "aSc" }, { ooo: -1 }]);
            expect(ret).toEqual(query);
            expect(ret._order).toEqual([{ foo: 1 }, { bar: -1 }, { baz: 1 }, { ooo: -1 }]);
        });

        it("pass object", () => {
            let ret;

            ret = query.order({
                foo: 1,
                bar: "DesC",
                baz: "aSc",
                ooo: -1,
            });
            expect(ret).toEqual(query);
            expect(ret._order).toEqual([{ foo: 1 }, { bar: -1 }, { baz: 1 }, { ooo: -1 }]);
        });
    });

    describe("index", () => {
        const query = new ToshihikoQuery(model);

        it("should pass index", () => {
            let ret;
            const obj = "idx" as any;
            ret = query.index(obj);
            expect(ret).toEqual(query);
            expect(ret._index).toEqual(obj);
        });
    });

    describe("find", () => {
        const query = new ToshihikoQuery(model);

        it("should pass right parameters", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any, options: any) {
                expect(query).toEqual(_query);
                expect(options).toEqual({
                    single: false,
                    noCache: false,
                });
                toshihiko.adapter.find = find;
                process.nextTick(callback);
            };
            query.find(function () {
                done();
            });
        });

        it("should get yukari", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any) {
                return callback(undefined, [{ key1: "13" }]);
            };
            query.find(function (err: any, rows: any) {
                expect(err).toBeUndefined();
                toshihiko.adapter.find = find;
                expect(rows.length).toEqual(1);
                const row = rows[0];
                expect(row).toBeInstanceOf(Yukari);
                expect(row.key1).toEqual("13");
                done();
            });
        });

        it("should get JSON", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any) {
                return callback(undefined, [{ key1: "13" }]);
            };
            query.find(function (err: any, rows: any) {
                expect(err).toBeUndefined();
                toshihiko.adapter.find = find;
                expect(rows.length).toEqual(1);
                const row = rows[0];
                expect(row).not.toBeInstanceOf(Yukari);
                expect(row).toEqual({ key1: "13" });
                done();
            }, true);
        });

        it("should get single", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any) {
                return callback(undefined, { key1: "13" });
            };
            query.find(function (err: any, row: any) {
                expect(err).toBeUndefined();
                toshihiko.adapter.find = find;
                expect(row).not.toBeInstanceOf(Yukari);
                expect(row).toEqual({ key1: "13" });
                done();
            }, true, { single: true });
        });

        it("with no callback", async () => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any, options: any) {
                toshihiko.adapter.find = find;
                return callback(undefined, options.single ? { key1: "13" } : [{ key1: "13" }]);
            };
            const result = await query.find(undefined, undefined, { single: true });
            expect(result).toBeInstanceOf(Yukari);
            expect(result.key1).toEqual("13");
        });
    });

    describe("findOne", () => {
        const query = new ToshihikoQuery(model);

        it("should get Yukari", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any) {
                return callback(undefined, { key1: "13" });
            };
            query.findOne(function (err: any, row: any) {
                expect(err).toBeUndefined();
                toshihiko.adapter.find = find;
                expect(row).toBeInstanceOf(Yukari);
                expect(row).toEqual(expect.objectContaining({ key1: "13" }));
                done();
            });
        });

        it("should get JSON", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (_query: any, callback: any) {
                return callback(undefined, { key1: "13" });
            };
            query.findOne(function (err: any, row: any) {
                expect(err).toBeUndefined();
                toshihiko.adapter.find = find;
                expect(row).not.toBeInstanceOf(Yukari);
                expect(row).toEqual({ key1: "13" });
                done();
            }, true);
        });
    });

    describe("findById", () => {
        it("should get with cache", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function () {};

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true },
            ], {
                cache: {
                    getData: function (database: string, table: string, id: any, callback: any) {
                        expect(database).toEqual("");
                        expect(table).toEqual("model");
                        expect(id).toEqual({ key2: "1", key3: "2" });
                        callback(undefined, [{ key1: "3", key2: "1", key3: "2" }]);
                    },
                    setData: function () {},
                    deleteData: function () {},
                    deleteKeys: function () {},
                },
            });
            new ToshihikoQuery(model).findById({ key2: "1", key3: "2" }, function (err: any, yukari: any) {
                expect(err).toBeUndefined();
                expect(yukari).toBeInstanceOf(Yukari);
                expect(yukari).toEqual(expect.objectContaining({ key1: "3", key2: "1", key3: "2" }));
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("should get without cache because of fallback", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (query: any, callback: any, options: any) {
                expect(options.single).toEqual(true);
                expect(options.noCache).toEqual(false);
                expect(query._fields).toEqual(["key1", "key2", "key3"]);
                expect(query._where).toEqual({ key2: "1", key3: "2" });
                return callback(undefined, { key1: "3", key2: "1", key3: "2" });
            };

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true },
            ], {
                cache: {
                    getData: function (database: string, table: string, id: any, callback: any) {
                        callback(new Error("err"));
                    },
                    setData: function () {},
                    deleteData: function () {},
                    deleteKeys: function () {},
                },
            });
            new ToshihikoQuery(model).findById({ key2: "1", key3: "2" }, function (err: any, yukari: any) {
                expect(err).toBeUndefined();
                expect(yukari).toBeInstanceOf(Yukari);
                expect(yukari).toEqual(expect.objectContaining({ key1: "3", key2: "1", key3: "2" }));
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("should get without cache", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (query: any, callback: any, options: any) {
                expect(options.single).toEqual(true);
                expect(options.noCache).toEqual(false);
                expect(query._fields).toEqual(["key1", "key2", "key3"]);
                expect(query._where).toEqual({ key2: "1", key3: "2" });
                return callback(undefined, { key1: "3", key2: "1", key3: "2" });
            };

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true },
            ]);
            new ToshihikoQuery(model).findById({ key2: "1", key3: "2" }, function (err: any, yukari: any) {
                expect(err).toBeUndefined();
                expect(yukari).toBeInstanceOf(Yukari);
                expect(yukari).toEqual(expect.objectContaining({ key1: "3", key2: "1", key3: "2" }));
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("single id", (done) => {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function (query: any, callback: any, options: any) {
                expect(options.single).toEqual(true);
                expect(options.noCache).toEqual(false);
                expect(query._fields).toEqual(["key1"]);
                expect(query._where).toEqual({ key1: "1" });
                return callback(undefined, { key1: "1" });
            };
            new ToshihikoQuery(model).findById("1", function (err: any, yukari: any) {
                expect(err).toBeUndefined();
                expect(yukari).toBeInstanceOf(Yukari);
                expect(yukari).toEqual(expect.objectContaining({ key1: "1" }));
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("invalid Ids object", async () => {
            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true },
            ]);
            await expect(new ToshihikoQuery(model).findById("1")).rejects.toThrow("you should pass a valid IDs object");
        });
    });

    describe("count", () => {
        const query = new ToshihikoQuery(model);

        it("should call count", (done) => {
            const count = toshihiko.adapter.count;
            toshihiko.adapter.count = function (_query: any, callback: any) {
                expect(_query).toEqual(query);
                callback(undefined, 1, {});
            };
            query.count(function (err: any, result: any, extra: any) {
                expect(err).toBeUndefined();
                expect(result).toEqual(1);
                expect(extra).toEqual({});
                toshihiko.adapter.count = count;
                done();
            });
        });
    });

    describe("update", () => {
        const query = new ToshihikoQuery(model);

        it("should update", (done) => {
            const updateByQuery = toshihiko.adapter.updateByQuery;
            toshihiko.adapter.updateByQuery = function (_query: any, callback: any) {
                expect(_query).toEqual(query);
                expect(query._updateData).toEqual({ key1: "2" });
                callback(undefined, {}, "EXTRA");
            };
            query.where({ key1: "1" }).update({ key1: "2" }, function (err: any, result: any, extra: any) {
                expect(err).toBeUndefined();
                expect(result).toEqual({});
                expect(extra).toEqual("EXTRA");
                toshihiko.adapter.updateByQuery = updateByQuery;
                done();
            });
        });
    });

    describe("delete", () => {
        const query = new ToshihikoQuery(model);

        it("should delete", (done) => {
            const deleteByQuery = toshihiko.adapter.deleteByQuery;
            toshihiko.adapter.deleteByQuery = function (_query: any, callback: any) {
                expect(_query).toEqual(query);
                callback(undefined, {}, "EXTRA");
            };
            query.where({ key1: "1" }).delete(function (err: any, result: any, extra: any) {
                expect(err).toBeUndefined();
                expect(result).toEqual({});
                expect(extra).toEqual("EXTRA");
                toshihiko.adapter.deleteByQuery = deleteByQuery;
                done();
            });
        });
    });

    describe("execute", () => {
        const query = new ToshihikoQuery(model);

        it("should execute", (done) => {
            const execute = toshihiko.adapter.execute;
            toshihiko.adapter.execute = function (conn: any, sql: any, callback: any) {
                expect(sql).toEqual("OJOJOJ");
                callback(undefined, { foo: "bar" }, "EXTRA");
            };
            query.execute("OJOJOJ", function (err: any, result: any, extra: any) {
                expect(err).toBeUndefined();
                expect(result).toEqual({ foo: "bar" });
                expect(extra).toEqual("EXTRA");
                toshihiko.adapter.execute = execute;
                done();
            });
        });
    });
});
