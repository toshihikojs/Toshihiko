/**
 * XadillaX created at 2016-10-08 15:47:54 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const Model = require("../lib/model");
const Query = require("../lib/query");
const Toshihiko = require("../lib/toshihiko");

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
});
