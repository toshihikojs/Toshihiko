/**
 * XadillaX created at 2016-10-08 15:47:54 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const hack = require("./util/hack");
const Model = require("../lib/model");
const Query = require("../lib/query");
const Toshihiko = require("../lib/toshihiko");
const Yukari = require("../lib/yukari");

describe("🐣 model", function() {
    const toshihiko = new Toshihiko("base");
    const model = new Model("name", toshihiko, [ { name: "key1" } ]);

    describe("define", function() {
        it("should define with cache", function() {
            const model = new Model("name", toshihiko, [
                { name: "key1" }
            ], {
                cache: {
                    module: require("./util/cache")
                }
            });

            model.should.match({
                ai: null,
                primaryKeys: [],
                name: "name",
                schema: [{
                    name: "key1",
                    column: "key1",
                    primaryKey: false
                }],
                cache: {
                    foo: undefined,
                    bar: undefined
                }
            });
        });

        it("should define with parent's cache", function() {
            const toshihiko = new Toshihiko("base", {
                cache: {
                    module: require("./util/cache"),
                    foo: 1,
                    bar: 2
                }
            });
            const model = new Model("name", toshihiko, [
                { name: "key1" }
            ]);

            model.should.match({
                ai: null,
                primaryKeys: [],
                name: "name",
                schema: [{
                    name: "key1",
                    column: "key1",
                    primaryKey: false
                }],
                cache: {
                    foo: 1,
                    bar: 2
                }
            });
        });

        it("should define without", function() {
            const toshihiko = new Toshihiko("base", {
                cache: {
                    module: require("./util/cache"),
                    foo: 1,
                    bar: 2
                }
            });
            const model = new Model("name", toshihiko, [
                { name: "key1" }
            ]);

            model.should.match({
                ai: null,
                primaryKeys: [],
                name: "name",
                schema: [{
                    name: "key1",
                    column: "key1",
                    primaryKey: false
                }],
                cache: {
                    foo: 1,
                    bar: 2
                }
            });

            model.toshihiko.should.equal(toshihiko);
        });

        it("should have getters", function() {
            model._fields.should.equal(model.schema);
        });
    });

    it("should build", function() {
        const yukari = new Yukari(model, "new");
        yukari.buildNewRow({ key1: 0 });
        yukari.should.deepEqual(model.build({ key1: 0 }));
    });

    describe("queries", function() {
        function test(name, argu) {
            it(name, function() {
                const query = new Query(model);
                model[name].apply(model, argu).should.deepEqual(query[name].apply(query, argu));
            });
        }

        test("where", [{ foo: "bar" }]);
        test("fields", [ "key1" ]);
        test("field", [ "key1" ]);
        test("limit", [ 1, 2 ]);
        test("limit", [ 1 ]);
        test("order", [{ key1: 1 }]);
        test("orderBy", [{ key1: -1 }]);
        test("index", [ "idx" ]);

        it("count", function(done) {
            model.count(function(err) {
                err.message.should.equal("this adapter's count function is not implemented yet.");
                done();
            });
        });

        it("find", function(done) {
            model.find(function(err) {
                err.message.should.equal("this adapter's find function is not implemented yet.");
                done();
            }, true, true);
        });

        it("findById", function(done) {
            model.findById("123", function(err) {
                err.message.should.equal("you should pass a valid IDs object");
                done();
            }, true);
        });

        it("findOne", function(done) {
            model.findOne(function(err) {
                err.message.should.equal("this adapter's find function is not implemented yet.");
                done();
            }, true);
        });

        it("update", function(done) {
            model.update({ foo: "bar" }, function(err) {
                err.message.should.equal("this adapter's updateByQuery function is not implemented yet.");
                done();
            });
        });

        it("delete", function(done) {
            model.delete(function(err) {
                err.message.should.equal("this adapter's deleteByQuery function is not implemented yet.");
                done();
            });
        });

        it("execute", function(done) {
            model.execute(function(err) {
                err.message.should.equal("this adapter's execute function is not implemented yet.");
                done();
            });
        });
    });

    describe("convertColumnToName", function() {
        const model = new Model("name", toshihiko, require("./util/common.js").COMMON_SCHEMA);

        it("pass string parameter", function() {
            model.convertColumnToName("id").should.equal("key1");
        });

        it("pass array parameter", function() {
            model.convertColumnToName([ "id", "key2" ]).should.deepEqual([ "key1", "key2" ]);
        });

        it("pass object parameter", function() {
            model.convertColumnToName({
                id: 1,
                key2: 2
            }).should.deepEqual({
                key1: 1,
                key2: 2
            });
        });

        it("should return undefined", function() {
            should(model.convertColumnToName(1)).equal(undefined);
        });
    });

    describe("compatible", function() {
        const model1 = new Model("base", toshihiko, require("./util/common").COMMON_SCHEMA);
        const model2 = new Model("base", toshihiko, require("./util/common").COMMON_SCHEMA_NO_PRIMARY);
        const model3 = new Model("base", toshihiko, require("./util/common").COMMON_SCHEMA_MULTI_PRIMARY);

        describe("getPrimaryKeysName", function() {
            it("no primary key", function() {
                model2.getPrimaryKeysName().should.deepEqual([]);
            });

            it("single primary key", function() {
                model1.getPrimaryKeysName().should.deepEqual("key1");
            });

            it("multiple primary keys", function() {
                model3.getPrimaryKeysName().should.deepEqual([ "key1", "key4" ]);
            });
        });

        describe("getPrimaryKeysColumn", function() {
            it("no primary key", function() {
                model2.getPrimaryKeysColumn().should.deepEqual([]);
            });

            it("single primary key", function() {
                model1.getPrimaryKeysColumn().should.deepEqual("id");
            });

            it("multiple primary keys", function() {
                model3.getPrimaryKeysColumn().should.deepEqual([ "id", "key4" ]);
            });
        });
    });

    describe("transaction", function() {
        it("should begin transaction", function() {
            hack.hackAsyncReturn(model.parent.adapter, "beginTransaction", [ undefined, { foo: "bar" }]);
            model.beginTransaction(function(err, conn) {
                should.ifError(err);
                conn.should.deepEqual({ foo: "bar" });
            });
        });

        it("should commit", function() {
            hack.hackAsyncReturn(model.parent.adapter, "commit", [ undefined, { foo: "bar" }]);
            model.commit(function(err, conn) {
                should.ifError(err);
                conn.should.deepEqual({ foo: "bar" });
            });
        });

        it("should rollback", function() {
            hack.hackAsyncReturn(model.parent.adapter, "rollback", [ undefined, { foo: "bar" }]);
            model.rollback(function(err, conn) {
                should.ifError(err);
                conn.should.deepEqual({ foo: "bar" });
            });
        });
    });
});
