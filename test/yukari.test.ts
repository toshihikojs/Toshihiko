/**
 * Toshihiko - Yukari class tests
 */

import { COMMON_SCHEMA, COMMON_SCHEMA_NO_PRIMARY, COMMON_SCHEMA_MULTI_PRIMARY } from "./util/common";
import { hackAsyncReturn, hackAsyncErr, hackSyncReturn } from "./util/hack";
import { Toshihiko } from "../src/toshihiko";
import { ToshihikoModel } from "../src/model";
import { ToshihikoQuery } from "../src/query";
import { Yukari } from "../src/yukari";

describe("yukari", () => {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", COMMON_SCHEMA);

    describe("initialize", () => {
        it("create", () => {
            const yukari = new Yukari(model, "new");
            expect(yukari.$model).toEqual(model);
            expect(yukari.$toshihiko).toEqual(toshihiko);
            expect(yukari.$schema).toEqual(model.schema);
            expect(yukari.$origData).toEqual({});
            expect(yukari.$source).toEqual("new");
            expect(yukari.$dbName).toEqual("");
            expect(yukari.$tableName).toEqual("model");
            expect(yukari.$cache).toBeNull();
            expect(yukari.$fromCache).toEqual(false);
            expect(yukari.$adapter).toEqual(toshihiko.adapter);
        });

        describe("fillRowFromSource", () => {
            it("row in original name", () => {
                const yukari = new Yukari(model, "query");
                expect(yukari.$source).toEqual("query");
                yukari.fillRowFromSource({ id: 123 }, true);
                expect(yukari).toEqual(expect.objectContaining({ key1: 123 }));
                expect(yukari.$origData).toEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 123,
                    },
                });
                expect(yukari.$fromCache).toEqual(false);
            });

            it("row not in original name", () => {
                const yukari = new Yukari(model, "query");
                expect(yukari.$source).toEqual("query");
                yukari.fillRowFromSource({ key1: 234, key99: 345 });
                expect(yukari).toEqual(expect.objectContaining({ key1: 234 }));
                expect(yukari.$origData).toEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 234,
                    },
                });
                expect(yukari.$fromCache).toEqual(false);
            });

            it("should sign from cache", () => {
                const yukari = new Yukari(model, "query");
                expect(yukari.$source).toEqual("query");
                yukari.fillRowFromSource({ key1: 456, $fromCache: true });
                expect(yukari).toEqual(expect.objectContaining({ key1: 456 }));
                expect(yukari.$origData).toEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 456,
                    },
                });
                expect(yukari.$fromCache).toEqual(true);
            });
        });

        describe("buildNewRow", () => {
            it("row in original name", () => {
                const yukari = new Yukari(model, "new");
                expect(yukari.$source).toEqual("new");
                yukari.buildNewRow({ id: 123 }, true);
                expect(yukari).toEqual(expect.objectContaining({ key1: 123 }));
                expect(yukari.$origData).toEqual({});
                expect(yukari.$fromCache).toEqual(false);
            });

            it("row not in original name", () => {
                const yukari = new Yukari(model, "new");
                expect(yukari.$source).toEqual("new");
                yukari.buildNewRow({ key1: 234, key2: 345, $fromCache: true });
                expect(yukari).toEqual(expect.objectContaining({ key1: 234 }));
                expect(yukari.$origData).toEqual({});
                expect(yukari.$fromCache).toEqual(true);
            });
        });
    });

    describe("functional", () => {
        describe("fieldIndex", () => {
            it("should get when new", () => {
                const yukari = new Yukari(model, "new");
                expect(yukari.fieldIndex("key2")).toEqual(1);
            });

            it("shouldn't get when new", () => {
                const yukari = new Yukari(model, "new");
                expect(yukari.fieldIndex("kkk")).toEqual(-1);
            });

            it("should get when query", () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });
                expect(yukari.fieldIndex("key1")).toEqual(0);
            });

            it("shouldn't get when query", () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });
                expect(yukari.fieldIndex("kkk")).toEqual(-1);
            });
        });

        describe("validateOne", () => {
            it("should validate several functions", (done) => {
                const yukari = new Yukari(model, "new");

                // Test valid value
                yukari.validateOne("key2", 50, function (err: any) {
                    expect(err).toBeUndefined();

                    // Test value too small
                    yukari.validateOne("key2", -150, function (err: any) {
                        expect(err.message).toEqual("`key2` can't be smaller than -100");

                        // Test value too big
                        yukari.validateOne("key2", 150, function (err: any) {
                            expect(err.message).toEqual("`key2` can't be greater than 100");

                            // Test no such field
                            yukari.validateOne("key100", 100, function (err: any) {
                                expect(err.message).toEqual("No such field key100");

                                // Test null not allowed
                                yukari.validateOne("key1", null, function (err: any) {
                                    expect(err.message).toEqual("Field key1 can't be null.");
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            it("should validate one function", (done) => {
                const yukari = new Yukari(model, "new");
                yukari.validateOne("key6", { dec: -150 }, function (err: any) {
                    expect(err.message).toEqual("`key6` can't be smaller than -100");
                    done();
                });
            });
        });

        describe("validateAll", () => {
            it("should correct", (done) => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow({
                    key2: 50,
                    key6: { dec: 50 },
                });
                yukari.$foo = "bar";
                yukari.validateAll(function (err: any) {
                    expect(err).toBeFalsy();
                    done();
                });
            });

            it("should incorrect - too small", (done) => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow({ key2: -150, key6: { dec: 50 } });
                yukari.validateAll(function (err: any) {
                    expect(err.message).toEqual("`key2` can't be smaller than -100");
                    done();
                });
            });

            it("should incorrect - too big", (done) => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow({ key2: 150, key6: { dec: 50 } });
                yukari.validateAll(function (err: any) {
                    expect(err.message).toEqual("`key2` can't be greater than 100");
                    done();
                });
            });

            it("should incorrect - key6", (done) => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow({ key2: -50, key6: { dec: -150 } });
                yukari.validateAll(function (err: any) {
                    expect(err.message).toEqual("`key6` can't be smaller than -100");
                    done();
                });
            });
        });

        describe("insert", () => {
            const date = new Date();
            const origData = {
                key1: 123,
                key2: 1.5,
                key3: '{"foo":"bar"}',
                key4: "234",
                key5: date.toISOString(),
                key6: "1100101001",
            };

            it("should get error in adapter insert", async () => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow(origData);
                hackAsyncErr(yukari.$adapter, "insert");
                try {
                    await yukari.insert();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("insert predefinition 1");
                }
            });

            it("should get error in adapter validate", async () => {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow(origData);
                hackAsyncErr(yukari, "validateAll");
                try {
                    await yukari.insert();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("validateAll predefinition 1");
                }
            });

            it("should insert", (done) => {
                const row = { key1: 1, key2: 1.5, key3: { foo: "bar" }, key4: "234", key5: date, key6: { dec: 8 } };
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow(row);
                const insert = yukari.$adapter.insert;
                yukari.$adapter.insert = function (_model: any, conn: any, data: any, callback: any) {
                    yukari.$adapter.insert = insert;
                    expect(model).toEqual(_model);
                    expect(data).toEqual([
                        expect.objectContaining({ field: expect.objectContaining({ name: "key1" }), value: 1 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key2" }), value: 1.5 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key3" }), value: { foo: "bar" } }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key4" }), value: "234" }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key5" }), value: date }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key6" }), value: { dec: 8 } }),
                    ]);
                    const _row = { key1: 1, key2: 1.5, key3: { foo: "bar" }, key4: "234", key5: date, key6: { dec: 8 } };
                    (_row as any).$origData = {};
                    return callback(undefined, row, "OK");
                };
                yukari.insert(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(yukari).toEqual(_yukari);
                    expect(extra).toEqual("OK");
                    expect(yukari.toJSON()).toEqual(row);
                    done();
                });
            });

            it("should get error when old", async () => {
                const yukari = new Yukari(model, "query");
                await expect(yukari.insert()).rejects.toThrow("You must call this function via a new Yukari object.");
            });
        });

        describe("update", () => {
            const date = new Date();
            const origData = {
                key1: 123,
                key2: 1.5,
                key3: '{"foo":"bar"}',
                key4: "234",
                key5: date.toISOString(),
                key6: "1100101001",
            };

            it("should get error in adapter update", async () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                yukari.key1 = 234;
                yukari.key4 = null;

                hackAsyncErr(yukari.$adapter, "update");
                try {
                    await yukari.update();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("update predefinition 1");
                }
            });

            it("should get error in adapter validate", async () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                yukari.key1 = 234;
                yukari.key4 = null;

                hackAsyncErr(yukari, "validateAll");
                try {
                    await yukari.update();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("validateAll predefinition 1");
                }
            });

            it("should update", (done) => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                yukari.key1 = 234;
                yukari.key4 = null;
                yukari.key6 = { dec: 23983489 };

                const update = yukari.$adapter.update;
                yukari.$adapter.update = function (_model: any, conn: any, pk: any, data: any, callback: any) {
                    yukari.$adapter.update = update;
                    expect(model).toEqual(_model);
                    expect(pk).toEqual({ key1: 123 });
                    expect(data).toEqual([
                        expect.objectContaining({ field: expect.objectContaining({ name: "key1" }), value: 234 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key4" }), value: null }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key6" }), value: { dec: 23983489 } }),
                    ]);
                    return callback(undefined, "OK");
                };
                yukari.update(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(yukari).toEqual(_yukari);
                    expect(extra).toEqual("OK");
                    expect(yukari.toJSON()).toEqual({
                        key1: 234,
                        key2: 1.5,
                        key3: { foo: "bar" },
                        key4: null,
                        key5: date,
                        key6: { dec: 23983489 },
                    });
                    done();
                });
            });

            it("should update when no update", (done) => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                const update = yukari.$adapter.update;
                yukari.$adapter.update = function (_model: any, conn: any, pk: any, data: any, callback: any) {
                    yukari.$adapter.update = update;
                    expect(model).toEqual(_model);
                    expect(pk).toEqual({ key1: 123 });
                    expect(data).toEqual([
                        expect.objectContaining({ field: expect.objectContaining({ name: "key1" }), value: 123 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key2" }), value: 1.5 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key3" }), value: { foo: "bar" } }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key4" }), value: "234" }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key5" }), value: date }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key6" }), value: { dec: 809 } }),
                    ]);
                    return callback(undefined, "OK");
                };
                yukari.update(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(yukari).toEqual(_yukari);
                    expect(extra).toEqual("OK");
                    expect(yukari.toJSON()).toEqual({
                        key1: 123,
                        key2: 1.5,
                        key3: { foo: "bar" },
                        key4: "234",
                        key5: date,
                        key6: { dec: 809 },
                    });
                    done();
                });
            });

            it("should update when no primary key", (done) => {
                const model = new ToshihikoModel("model", toshihiko, COMMON_SCHEMA_NO_PRIMARY);
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                const update = yukari.$adapter.update;
                yukari.$adapter.update = function (_model: any, conn: any, pk: any, data: any, callback: any) {
                    yukari.$adapter.update = update;
                    expect(model).toEqual(_model);
                    expect(pk).toEqual({
                        key1: 123,
                        key2: 1.5,
                        key3: { foo: "bar" },
                        key4: "234",
                        key5: date,
                        key6: { dec: 809 },
                    });
                    expect(data).toEqual([
                        expect.objectContaining({ field: expect.objectContaining({ name: "key1" }), value: 123 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key2" }), value: 1.5 }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key3" }), value: { foo: "bar" } }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key4" }), value: "234" }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key5" }), value: date }),
                        expect.objectContaining({ field: expect.objectContaining({ name: "key6" }), value: { dec: 809 } }),
                    ]);
                    return callback(undefined, "OK");
                };
                yukari.update(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(yukari).toEqual(_yukari);
                    expect(extra).toEqual("OK");
                    expect(yukari.toJSON()).toEqual({
                        key1: 123,
                        key2: 1.5,
                        key3: { foo: "bar" },
                        key4: "234",
                        key5: date,
                        key6: { dec: 809 },
                    });
                    done();
                });
            });

            it("should get error when new", async () => {
                const yukari = new Yukari(model, "new");
                await expect(yukari.update()).rejects.toThrow("You must call this function via an old Yukari object.");
            });
        });

        describe("delete", () => {
            it("should get error", async () => {
                const yukari = new Yukari(model, "new");
                await expect(yukari.delete()).rejects.toThrow("You can't call this function via a new Yukari object.");
            });

            it("with single primary key - error", async () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });

                const where = yukari.$model.where;
                yukari.$model.where = function (w: any) {
                    const query = new ToshihikoQuery(yukari.$model);
                    (query as any).delete = function (callback: any) {
                        expect(query._limit).toEqual([0, 1]);
                        expect(query._where).toEqual({ key1: 123 });
                        callback(new Error("query delete err"));
                        return Promise.resolve();
                    };
                    return query.where(w);
                };
                try {
                    await yukari.delete();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("query delete err");
                } finally {
                    yukari.$model.where = where;
                }
            });

            it("with single primary key - unknown error", async () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });

                const where = yukari.$model.where;
                yukari.$model.where = function (w: any) {
                    const query = new ToshihikoQuery(yukari.$model);
                    (query as any).delete = function (callback: any) {
                        expect(query._limit).toEqual([0, 1]);
                        expect(query._where).toEqual({ key1: 123 });
                        callback();
                        return Promise.resolve();
                    };
                    return query.where(w);
                };
                try {
                    await yukari.delete();
                    fail("should have thrown");
                } catch (err: any) {
                    expect(err.message).toEqual("unknown error.");
                } finally {
                    yukari.$model.where = where;
                }
            });

            it("with single primary key - success", (done) => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });

                const where = yukari.$model.where;
                yukari.$model.where = function (w: any) {
                    const query = new ToshihikoQuery(yukari.$model);
                    (query as any).delete = function (callback: any) {
                        expect(query._limit).toEqual([0, 1]);
                        expect(query._where).toEqual({ key1: 123 });
                        callback(undefined, { affectedRows: 1 }, "ok");
                        return Promise.resolve();
                    };
                    return query.where(w);
                };
                yukari.delete(function (err: any, res: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(res).toEqual(true);
                    expect(extra).toEqual("ok");
                    yukari.$model.where = where;
                    done();
                });
            });

            it("with several primary keys", (done) => {
                const model = toshihiko.define("test1", COMMON_SCHEMA_MULTI_PRIMARY);
                const yukari = new Yukari(model, "query");
                const where = yukari.$model.where;
                yukari.fillRowFromSource({ key1: 123, key4: "234" });
                yukari.$model.where = function (w: any) {
                    const query = new ToshihikoQuery(yukari.$model);
                    (query as any).delete = function (callback: any) {
                        expect(query._limit).toEqual([0, 1]);
                        expect(query._where).toEqual({ key1: 123, key4: "234" });
                        callback(undefined, { affectedRows: 1 }, "ok");
                        return Promise.resolve();
                    };
                    return query.where(w);
                };
                yukari.delete(function (err: any, res: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(res).toEqual(true);
                    expect(extra).toEqual("ok");
                    yukari.$model.where = where;
                    done();
                });
            });

            it("with no primary key", (done) => {
                const model = toshihiko.define("test1", COMMON_SCHEMA_NO_PRIMARY);
                const yukari = new Yukari(model, "query");
                const where = yukari.$model.where;
                const date = new Date();
                yukari.fillRowFromSource({
                    key1: 123,
                    key2: 1.5,
                    key3: '{"foo":"bar"}',
                    key4: "234",
                    key5: date.toISOString(),
                    key6: "1100101001",
                });
                yukari.$model.where = function (w: any) {
                    const query = new ToshihikoQuery(yukari.$model);
                    (query as any).delete = function (callback: any) {
                        expect(query._limit).toEqual([0, 1]);
                        expect(query._where).toEqual({
                            key1: 123,
                            key2: 1.5,
                            key3: { foo: "bar" },
                            key4: "234",
                            key5: date,
                            key6: { dec: 809 },
                        });
                        callback(undefined, { affectedRows: 1 }, "ok");
                        return Promise.resolve();
                    };
                    return query.where(w);
                };
                yukari.delete(function (err: any, res: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(res).toEqual(true);
                    expect(extra).toEqual("ok");
                    yukari.$model.where = where;
                    done();
                });
            });
        });

        describe("save", () => {
            it("should insert", (done) => {
                const yukari = new Yukari(model, "new");
                hackAsyncReturn(yukari, "insert", [undefined, "insert", "ok"]);
                yukari.save(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(_yukari).toEqual("insert");
                    expect(extra).toEqual("ok");
                    done();
                });
            });

            it("should update", (done) => {
                const yukari = new Yukari(model, "query");
                hackAsyncReturn(yukari, "update", [undefined, "update", "ok~"]);
                yukari.save(function (err: any, _yukari: any, extra: any) {
                    expect(err).toBeUndefined();
                    expect(_yukari).toEqual("update");
                    expect(extra).toEqual("ok~");
                    done();
                });
            });
        });

        describe("toJSON", () => {
            const date = new Date();
            const origData = {
                key1: 123,
                key2: 1.5,
                key3: '{"foo":"bar"}',
                key4: "234",
                key5: date.toISOString(),
                key6: "1100101001",
            };

            it("should to JSON (new)", () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                yukari.key1 = 234;
                hackSyncReturn(yukari.$schema[5].type, "toJSON", "OKOKOK");
                expect(yukari.toJSON()).toEqual({
                    key1: 234,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: "234",
                    key5: date,
                    key6: "OKOKOK",
                });
            });

            it("should to JSON (old)", () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                yukari.key1 = 234;
                hackSyncReturn(yukari.$schema[5].type, "toJSON", "OKOKOK");
                expect(yukari.toJSON(true)).toEqual({
                    key1: 123,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: "234",
                    key5: date,
                    key6: "OKOKOK",
                });
            });
        });

        describe("extractAdapterData", () => {
            const date = new Date();
            const origData = {
                key1: 123,
                key2: 1.5,
                key3: '{"foo":"bar"}',
                key4: "234",
                key5: date.toISOString(),
                key6: "1100101001",
            };

            it("should get extracted data", () => {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource(origData);
                expect(Yukari.extractAdapterData(model, yukari)).toEqual([
                    { field: model.schema[0], value: 123 },
                    { field: model.schema[1], value: 1.5 },
                    { field: model.schema[2], value: { foo: "bar" } },
                    { field: model.schema[3], value: "234" },
                    { field: model.schema[4], value: date },
                    { field: model.schema[5], value: { dec: 809 } },
                ]);
            });
        });
    });
});
