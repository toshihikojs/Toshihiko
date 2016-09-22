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

describe("🐣 query", function() {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", []);

    it("should create instance", function() {
        const query = new Query(model);

        query.field.should.equal(query.fields);
        query.orderBy.should.equal(query.order);

        query._fields.should.deepEqual([]);
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
    });
});
