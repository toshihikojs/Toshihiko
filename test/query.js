/**
 * XadillaX created at 2016-08-11 16:34:12 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const Query = require("../lib/query");
const Toshihiko = require("../lib/toshihiko");
const Yukari = require("../lib/yukari");

describe("🐣 query", function() {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", [ { name: "key1", primaryKey: true } ]);

    it("should create instance", function() {
        const query = new Query(model);

        query.field.should.equal(query.fields);
        query.orderBy.should.equal(query.order);

        query._fields.should.deepEqual([ "key1" ]);
        query._limit.should.deepEqual([]);
        query._order.should.deepEqual([]);
        query._updateData.should.deepEqual({});
        query._where.should.deepEqual({});

        query.toshihiko.should.equal(toshihiko);
        query.adapter.should.equal(toshihiko.adapter);
        query.model.should.equal(model);
        should(query.cache).equal(null);
    });

    describe("👙 where", function() {
        it("should call where correctly", function() {
            const query = new Query(model);
            let cond = {};
            let res = query.where(cond);

            res.should.equal(query);
            res._where.should.equal(cond);
        });

        it("should get an error", function(done) {
            const query = new Query(model);

            try {
                query.where(1);
            } catch(e) {
                e.should.be.instanceof(Error);
                done();
            }
        });
    });

    describe("👙 fields", function() {
        const query = new Query(model);
        it("pass string", function() {
            let ret;

            ret = query.fields("a,b,foo");
            ret.should.equal(query);
            ret._fields.should.deepEqual([ "a", "b", "foo" ]);

            ret = query.fields("a, b      ,    foo, , ");
            ret.should.equal(query);
            ret._fields.should.deepEqual([ "a", "b", "foo" ]);
        });

        it("pass array", function() {
            let ret;

            ret = query.fields([ "a", "b", "foo" ]);
            ret.should.equal(query);
            ret._fields.should.deepEqual([ "a", "b", "foo" ]);
        });

        it("should get an error", function(done) {
            try {
                query.fields(1);
            } catch(e) {
                e.should.be.instanceof(Error);
                done();
            }
        });
    });

    describe("👙 limit", function() {
        const query = new Query(model);

        it("pass string", function() {
            let ret;

            ret = query.limit("1,2");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit("   1,2    ,3,");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit("1,dsaflkj");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 0 ]);

            ret = query.limit("1");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1 ]);

            ret = query.limit("");
            ret.should.equal(query);
            ret._limit.should.deepEqual([]);

            ret = query.limit("dfa");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 0 ]);
        });

        it("pass array", function() {
            let ret;

            ret = query.limit([ "1", 2 ]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit([ 1, 2, "3" ]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit([ 1, "dsafklj" ]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 0 ]);

            ret = query.limit([ 1 ]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1 ]);

            ret = query.limit([]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([]);

            ret = query.limit([ "dfs" ]);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 0 ]);
        });

        it("pass number", function() {
            let ret;

            ret = query.limit(123);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 123 ]);

            ret = query.limit(-1);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ -1 ]);
        });

        it("pass two arguments", function() {
            let ret;

            ret = query.limit("1", 2);
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit(1, 2, "3");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 2 ]);

            ret = query.limit(1, "dsafklj");
            ret.should.equal(query);
            ret._limit.should.deepEqual([ 1, 0 ]);
        });

        it("should got an error", function(done) {
            try {
                query.limit(true);
            } catch(e) {
                e.should.be.instanceof(Error);
                done();
            }
        });
    });

    describe("👙 order", function() {
        const query = new Query(model);

        it("pass string", function() {
            let ret;

            ret = query.order("   foo, bar aSc    , baz     desc");
            ret.should.equal(query);
            ret._order.should.deepEqual([
                { foo: 1 },
                { bar: 1 },
                { baz: -1 }
            ]);

            ret = query.order("  ");
            ret.should.equal(query);
            ret._order.should.deepEqual([]);
        });

        it("pass array", function() {
            let ret;

            ret = query.order([ "foo", "bar DeSc", { baz: "aSc" }, { ooo: -1 } ]);
            ret.should.equal(query);
            ret._order.should.deepEqual([
                { foo: 1 },
                { bar: -1 },
                { baz: 1 },
                { ooo: -1 }
            ]);
        });

        it("pass object", function() {
            let ret;

            ret = query.order({
                foo: 1,
                bar: "DesC",
                baz: "aSc",
                ooo: -1
            });
            ret.should.equal(query);
            ret._order.should.deepEqual([
                { foo: 1 },
                { bar: -1 },
                { baz: 1 },
                { ooo: -1 }
            ]);
        });
    });

    describe("👙 index", function() {
        const query = new Query(model);

        it("should pass index", function() {
            let ret;
            const obj = {};
            ret = query.index(obj);
            ret.should.equal(query);
            ret._index.should.equal(obj);
        });
    });

    describe("👙 find", function() {
        const query = new Query(model);

        it("should pass right parameters", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback, options) {
                query.should.equal(_query);
                options.should.deepEqual({
                    single: false,
                    noCache: false
                });
                toshihiko.adapter.find = find;
                process.nextTick(callback);
            };
            query.find(function() {
                done();
            });
        });

        it("should get yukari", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback) {
                return callback(undefined, [ { key1: "13" } ]);
            };
            query.find(function(err, rows) {
                should.ifError(err);
                toshihiko.adapter.find = find;
                rows.length.should.equal(1);
                const row = rows[0];
                row.should.be.instanceof(Yukari);
                row.key1.should.equal("13");
                done();
            });
        });

        it("should get JSON", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback) {
                return callback(undefined, [ { key1: "13" } ]);
            };
            query.find(function(err, rows) {
                should.ifError(err);
                toshihiko.adapter.find = find;
                rows.length.should.equal(1);
                const row = rows[0];
                row.should.not.be.instanceof(Yukari);
                row.should.match({ key1: "13" });
                done();
            }, true);
        });

        it("should get single", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback) {
                return callback(undefined, { key1: "13" });
            };
            query.find(function(err, row) {
                should.ifError(err);
                toshihiko.adapter.find = find;
                row.should.not.be.instanceof(Yukari);
                row.should.match({ key1: "13" });
                done();
            }, true, { single: true });
        });
    });

    describe("👙 findOne", function() {
        const query = new Query(model);

        it("should get Yukari", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback) {
                return callback(undefined, { key1: "13" });
            };
            query.findOne(function(err, row) {
                should.ifError(err);
                toshihiko.adapter.find = find;
                row.should.be.instanceof(Yukari);
                row.should.match({ key1: "13" });
                done();
            });
        });

        it("should get JSON", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(_query, callback) {
                return callback(undefined, { key1: "13" });
            };
            query.findOne(function(err, row) {
                should.ifError(err);
                toshihiko.adapter.find = find;
                row.should.not.be.instanceof(Yukari);
                row.should.match({ key1: "13" });
                done();
            }, true);
        });
    });

    describe("👙 findById", function() {
        it("should get with cache", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function() {};

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true }
            ], {
                cache: {
                    getData: function(database, table, id, callback) {
                        database.should.equal("");
                        table.should.equal("model");
                        id.should.deepEqual({ key2: "1", key3: "2" });
                        callback(undefined, [ { key1: "3", key2: "1", key3: "2" } ]);
                    },
                    setData: function() {},
                    deleteData: function() {},
                    deleteKeys: function() {}
                }
            });
            (new Query(model)).findById({ key2: "1", key3: "2" }, function(err, yukari) {
                should.ifError(err);
                yukari.should.be.instanceof(Yukari);
                yukari.should.match({ key1: "3", key2: "1", key3: "2" });
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("should get without cache because of fallback", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(query, callback, options) {
                options.single.should.equal(true);
                options.noCache.should.equal(false);
                query._fields.should.deepEqual([ "key1", "key2", "key3" ]);
                query._where.should.deepEqual({ key2: "1", key3: "2" });
                return callback(undefined, { key1: "3", key2: "1", key3: "2" });
            };

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true }
            ], {
                cache: {
                    getData: function(database, table, id, callback) {
                        callback(new Error("err"));
                    },
                    setData: function() {},
                    deleteData: function() {},
                    deleteKeys: function() {}
                }
            });
            (new Query(model)).findById({ key2: "1", key3: "2" }, function(err, yukari) {
                should.ifError(err);
                yukari.should.be.instanceof(Yukari);
                yukari.should.match({ key1: "3", key2: "1", key3: "2" });
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("should get without cache", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(query, callback, options) {
                options.single.should.equal(true);
                options.noCache.should.equal(false);
                query._fields.should.deepEqual([ "key1", "key2", "key3" ]);
                query._where.should.deepEqual({ key2: "1", key3: "2" });
                return callback(undefined, { key1: "3", key2: "1", key3: "2" });
            };

            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true }
            ]);
            (new Query(model)).findById({ key2: "1", key3: "2" }, function(err, yukari) {
                should.ifError(err);
                yukari.should.be.instanceof(Yukari);
                yukari.should.match({ key1: "3", key2: "1", key3: "2" });
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("single id", function(done) {
            const find = toshihiko.adapter.find;
            toshihiko.adapter.find = function(query, callback, options) {
                options.single.should.equal(true);
                options.noCache.should.equal(false);
                query._fields.should.deepEqual([ "key1" ]);
                query._where.should.deepEqual({ key1: "1" });
                return callback(undefined, { key1: "1" });
            };
            (new Query(model)).findById("1", function(err, yukari) {
                should.ifError(err);
                yukari.should.be.instanceof(Yukari);
                yukari.should.match({ key1: "1" });
                toshihiko.adapter.find = find;
                done();
            });
        });

        it("invalid Ids object", function(done) {
            const model = toshihiko.define("model", [
                { name: "key1" },
                { name: "key2", primaryKey: true },
                { name: "key3", primaryKey: true }
            ]);
            (new Query(model)).findById("1", function(err) {
                err.message.should.equal("you should pass a valid IDs object");
                done();
            });
        });
    });

    describe("👙 count", function() {
        const query = new Query(model);

        it("should call count", function(done) {
            const count = toshihiko.adapter.count;
            toshihiko.adapter.count = function(_query, callback) {
                _query.should.equal(query);
                callback(undefined, 1, {});
            };
            query.count(function(err, result, extra) {
                should.ifError(err);
                result.should.equal(1);
                extra.should.deepEqual({});
                toshihiko.adapter.count = count;
                done();
            });
        });
    });

    describe("👙 update", function() {
        const query = new Query(model);

        it("should update", function(done) {
            const updateByQuery = toshihiko.adapter.updateByQuery;
            toshihiko.adapter.updateByQuery = function(_query, callback) {
                _query.should.equal(query);
                query._updateData.should.deepEqual({ key1: "2" });
                callback(undefined, {}, "EXTRA");
            };
            query.where({ key1: "1" }).update({ key1: "2" }, function(err, result, extra) {
                should.ifError(err);
                result.should.deepEqual({});
                extra.should.equal("EXTRA");
                toshihiko.adapter.updateByQuery = updateByQuery;
                done();
            });
        });
    });

    describe("👙 delete", function() {
        const query = new Query(model);

        it("should delete", function(done) {
            const deleteByQuery = toshihiko.adapter.deleteByQuery;
            toshihiko.adapter.deleteByQuery = function(_query, callback) {
                _query.should.equal(query);
                callback(undefined, {}, "EXTRA");
            };
            query.where({ key1: "1" }).delete(function(err, result, extra) {
                should.ifError(err);
                result.should.deepEqual({});
                extra.should.equal("EXTRA");
                toshihiko.adapter.deleteByQuery = deleteByQuery;
                done();
            });
        });
    });
});
