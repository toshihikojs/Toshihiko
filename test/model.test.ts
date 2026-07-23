/**
 * Toshihiko - Model class tests
 */

import { hackAsyncReturn } from "./util/hack";
import { COMMON_SCHEMA, COMMON_SCHEMA_NO_PRIMARY, COMMON_SCHEMA_MULTI_PRIMARY } from "./util/common";
import { ToshihikoModel } from "../src/model";
import { ToshihikoQuery } from "../src/query";
import { Toshihiko } from "../src/toshihiko";
import { Yukari } from "../src/yukari";

describe("model", () => {
    const toshihiko = new Toshihiko("base");
    const model = new ToshihikoModel("name", toshihiko, [{ name: "key1" }]);

    describe("define", () => {
        it("should define with cache", () => {
            const model = new ToshihikoModel("name", toshihiko, [{ name: "key1" }], {
                cache: {
                    module: require("./util/cache"),
                },
            });

            expect(model.ai).toBeNull();
            expect(model.primaryKeys).toEqual([]);
            expect(model.name).toEqual("name");
            expect(model.schema).toEqual([
                expect.objectContaining({
                    name: "key1",
                    column: "key1",
                    primaryKey: false,
                }),
            ]);
            expect(model.cache).toEqual({
                foo: undefined,
                bar: undefined,
            });
        });

        it("should define with parent's cache", () => {
            const toshihiko = new Toshihiko("base", {
                cache: {
                    module: require("./util/cache"),
                    foo: 1,
                    bar: 2,
                },
            });
            const model = new ToshihikoModel("name", toshihiko, [{ name: "key1" }]);

            expect(model.ai).toBeNull();
            expect(model.primaryKeys).toEqual([]);
            expect(model.name).toEqual("name");
            expect(model.schema).toEqual([
                expect.objectContaining({
                    name: "key1",
                    column: "key1",
                    primaryKey: false,
                }),
            ]);
            expect(model.cache).toEqual({
                foo: 1,
                bar: 2,
            });
        });

        it("should define without", () => {
            const toshihiko = new Toshihiko("base", {
                cache: {
                    module: require("./util/cache"),
                    foo: 1,
                    bar: 2,
                },
            });
            const model = new ToshihikoModel("name", toshihiko, [{ name: "key1" }]);

            expect(model.ai).toBeNull();
            expect(model.primaryKeys).toEqual([]);
            expect(model.name).toEqual("name");
            expect(model.schema).toEqual([
                expect.objectContaining({
                    name: "key1",
                    column: "key1",
                    primaryKey: false,
                }),
            ]);
            expect(model.cache).toEqual({
                foo: 1,
                bar: 2,
            });

            expect(model.toshihiko).toEqual(toshihiko);
        });

        it("should have getters", () => {
            expect(model._fields).toEqual(model.schema);
        });
    });

    it("should build", () => {
        const yukari = new Yukari(model, "new");
        yukari.buildNewRow({ key1: 0 });
        const built = model.build({ key1: 0 });
        expect(built.key1).toEqual(yukari.key1);
        expect(built.$source).toEqual(yukari.$source);
    });

    describe("queries", () => {
        function test(name: string, argu: any[]) {
            it(name, () => {
                const query = new ToshihikoQuery(model);
                const modelResult = (model as any)[name].apply(model, argu);
                const queryResult = (query as any)[name].apply(query, argu);
                // Compare specific properties to avoid circular reference issues
                expect(modelResult._where).toEqual(queryResult._where);
                expect(modelResult._fields).toEqual(queryResult._fields);
                expect(modelResult._limit).toEqual(queryResult._limit);
                expect(modelResult._order).toEqual(queryResult._order);
                expect(modelResult._index).toEqual(queryResult._index);
            });
        }

        test("where", [{ foo: "bar" }]);
        test("fields", ["key1"]);
        test("field", ["key1"]);
        test("limit", [1, 2]);
        test("limit", [1]);
        test("order", [{ key1: 1 }]);
        test("orderBy", [{ key1: -1 }]);
        test("index", ["idx"]);

        it("count", (done) => {
            model.count(function (err: any) {
                expect(err.message).toEqual("this adapter's count function is not implemented yet.");
                done();
            }).catch(() => {}); // Catch the promise rejection
        });

        it("find", (done) => {
            model.find(function (err: any) {
                expect(err.message).toEqual("this adapter's find function is not implemented yet.");
                done();
            }, true, true as any).catch(() => {}); // Catch the promise rejection
        });

        it("findById", (done) => {
            model.findById("123", function (err: any) {
                expect(err.message).toEqual("you should pass a valid IDs object");
                done();
            }, true).catch(() => {}); // Catch the promise rejection
        });

        it("findOne", (done) => {
            model.findOne(function (err: any) {
                expect(err.message).toEqual("this adapter's find function is not implemented yet.");
                done();
            }, true).catch(() => {}); // Catch the promise rejection
        });

        it("update", (done) => {
            model.update({ foo: "bar" }, function (err: any) {
                expect(err.message).toEqual("this adapter's updateByQuery function is not implemented yet.");
                done();
            }).catch(() => {}); // Catch the promise rejection
        });

        it("delete", (done) => {
            model.delete(function (err: any) {
                expect(err.message).toEqual("this adapter's deleteByQuery function is not implemented yet.");
                done();
            }).catch(() => {}); // Catch the promise rejection
        });

        it("execute", (done) => {
            model.execute(function (err: any) {
                expect(err.message).toEqual("this adapter's execute function is not implemented yet.");
                done();
            }).catch(() => {}); // Catch the promise rejection
        });
    });

    describe("convertColumnToName", () => {
        const model = new ToshihikoModel("name", toshihiko, COMMON_SCHEMA);

        it("pass string parameter", () => {
            expect(model.convertColumnToName("id")).toEqual("key1");
        });

        it("pass array parameter", () => {
            expect(model.convertColumnToName(["id", "key2"])).toEqual(["key1", "key2"]);
        });

        it("pass object parameter", () => {
            expect(model.convertColumnToName({ id: 1, key2: 2 })).toEqual({ key1: 1, key2: 2 });
        });

        it("should return undefined", () => {
            expect(model.convertColumnToName(1 as any)).toBeUndefined();
        });
    });

    describe("compatible", () => {
        const model1 = new ToshihikoModel("base", toshihiko, COMMON_SCHEMA);
        const model2 = new ToshihikoModel("base", toshihiko, COMMON_SCHEMA_NO_PRIMARY);
        const model3 = new ToshihikoModel("base", toshihiko, COMMON_SCHEMA_MULTI_PRIMARY);

        describe("getPrimaryKeysName", () => {
            it("no primary key", () => {
                expect(model2.getPrimaryKeysName()).toEqual([]);
            });

            it("single primary key", () => {
                expect(model1.getPrimaryKeysName()).toEqual("key1");
            });

            it("multiple primary keys", () => {
                expect(model3.getPrimaryKeysName()).toEqual(["key1", "key4"]);
            });
        });

        describe("getPrimaryKeysColumn", () => {
            it("no primary key", () => {
                expect(model2.getPrimaryKeysColumn()).toEqual([]);
            });

            it("single primary key", () => {
                expect(model1.getPrimaryKeysColumn()).toEqual("id");
            });

            it("multiple primary keys", () => {
                expect(model3.getPrimaryKeysColumn()).toEqual(["id", "key4"]);
            });
        });
    });

    describe("transaction", () => {
        it("should begin transaction", (done) => {
            hackAsyncReturn(model.parent.adapter, "beginTransaction", [undefined, { foo: "bar" }]);
            model.beginTransaction(function (err: any, conn: any) {
                expect(err).toBeUndefined();
                expect(conn).toEqual({ foo: "bar" });
                done();
            });
        });

        it("should commit", (done) => {
            hackAsyncReturn(model.parent.adapter, "commit", [undefined, { foo: "bar" }]);
            model.commit({}, function (err: any, conn: any) {
                expect(err).toBeUndefined();
                expect(conn).toEqual({ foo: "bar" });
                done();
            });
        });

        it("should rollback", (done) => {
            hackAsyncReturn(model.parent.adapter, "rollback", [undefined, { foo: "bar" }]);
            model.rollback({}, function (err: any, conn: any) {
                expect(err).toBeUndefined();
                expect(conn).toEqual({ foo: "bar" });
                done();
            });
        });
    });
});
