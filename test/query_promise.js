/**
 * XadillaX created at 2016-10-18 17:25:18 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const hack = require("./util/hack");
const Query = require("../lib/query");
const Toshihiko = require("../lib/toshihiko");

describe("query promise", function() {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", [ { name: "key1", primaryKey: true } ]);

    describe("count", function() {
        it("should resolve", function() {
            const query = new Query(model);
            hack.hackAsyncReturn(query.adapter, "count", [ undefined, 10, "again" ]);
            return query.count().should.eventually.deepEqual(10);
        });

        it("should reject", function() {
            const query = new Query(model);
            hack.hackAsyncErr(query.adapter, "count");
            return query.count().should.be.rejectedWith("count predefinition 1");
        });
    });

    describe("find", function() {
        it("should resolve", function() {
            const query = new Query(model);
            hack.hackAsyncReturn(query.adapter, "find", [ undefined, [ "ok" ], "again" ]);
            return query.find(true).should.eventually.deepEqual([{}]);
        });

        it("should reject", function() {
            const query = new Query(model);
            hack.hackAsyncErr(query.adapter, "find");
            return query.find().should.be.rejectedWith("find predefinition 1");
        });
    });

    describe("update", function() {
        it("should resolve", function() {
            const query = new Query(model);
            hack.hackAsyncReturn(query.adapter, "updateByQuery", [ undefined, {}, "again" ]);
            return query.update({ key1: 1 }).should.eventually.deepEqual({});
        });

        it("should reject", function() {
            const query = new Query(model);
            hack.hackAsyncErr(query.adapter, "updateByQuery");
            return query.update({ key1: 1 }).should.be.rejectedWith("updateByQuery predefinition 1");
        });
    });

    describe("delete", function() {
        it("should resolve", function() {
            const query = new Query(model);
            hack.hackAsyncReturn(query.adapter, "deleteByQuery", [ undefined, "ok", "again" ]);
            return query.delete().should.eventually.equal("ok");
        });

        it("should reject", function() {
            const query = new Query(model);
            hack.hackAsyncErr(query.adapter, "deleteByQuery");
            return query.delete().should.be.rejectedWith("deleteByQuery predefinition 1");
        });
    });

    describe("execute", function() {
        it("should resolve", function() {
            const query = new Query(model);
            hack.hackAsyncReturn(query.adapter, "execute", [ undefined, "eeeee", "again" ]);
            return query.execute().should.eventually.equal("eeeee");
        });

        it("should reject", function() {
            const query = new Query(model);
            hack.hackAsyncErr(query.adapter, "execute");
            return query.execute(function(err) {
                err.message.should.equal("execute predefinition 1");
            }).should.be.rejectedWith("execute predefinition 1");
        });
    });
});
