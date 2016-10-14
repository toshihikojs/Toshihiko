/**
 * XadillaX created at 2016-10-01 11:50:09 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const async = require("async");
const should = require("should");

const hack = require("../util/hack");
const common = require("../util/common");
const Toshihiko = require("../../lib/toshihiko");
const Yukari = require("../../lib/yukari");

module.exports = function(name, options) {
    describe(`${name} insert`, function() {
        describe("common schema", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test1", common.COMMON_SCHEMA);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, { key1: 1 });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key2: 0.5,
                    key3: { foo: "bar" },
                    key4: null,
                    key5: now,
                    key6: { dec: 168 },
                    $123: 1,
                    ok: function() {}
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 1,
                        key2: 0.5,
                        key3: { foo: "bar" },
                        key4: null,
                        key5: now,
                        key6: { dec: 168 }
                    });
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe("ai is not pk", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test1", common.COMMON_SCHEMA_AI_IS_NOT_PRIMARY);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, { key4: "dummy primary" });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key2: 0.5,
                    key3: { foo: "bar" },
                    key4: "dummy primary",
                    key5: now,
                    key6: { dec: 610074841 }
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 2,
                        key2: 0.5,
                        key3: { foo: "bar" },
                        key4: "dummy primary",
                        key5: now,
                        key6: { dec: 610074841 }
                    });
    
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe("multi-primary-keys", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test1", common.COMMON_SCHEMA_MULTI_PRIMARY);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, { key1: 3, key4: "dummy multi primary" });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key2: 0.5,
                    key3: { foo: "bar" },
                    key4: "dummy multi primary",
                    key5: now,
                    key6: { dec: 8644325 }
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 3,
                        key2: 0.5,
                        key3: { foo: "bar" },
                        key4: "dummy multi primary",
                        key5: now,
                        key6: { dec: 8644325 }
                    });
    
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe("no primary key", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test1", common.COMMON_SCHEMA_NO_PRIMARY);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, {
                    key1: 4,
                    key2: 0.5,
                    key3: { foo: "bar" },
                    key4: "dummy no primary",
                    key5: now,
                    key6: { dec: 8644325 }
                });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key2: 0.5,
                    key3: { foo: "bar" },
                    key4: "dummy no primary",
                    key5: now,
                    key6: { dec: 8644325 }
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 4,
                        key2: 0.5,
                        key3: { foo: "bar" },
                        key4: "dummy no primary",
                        key5: now,
                        key6: { dec: 8644325 }
                    });
    
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe("no ai key", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test2", common.NO_AI_SCHEMA);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, { key1: 1 });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key1: 1,
                    key2: 0.5,
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 1,
                        key2: 0.5
                    });
    
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe("no ai key with no primary key", function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test2", common.NO_AI_SCHEMA_WITH_NO_PRIMARY);
    
            after(function() {
                adapter.mysql.end();
            });
    
            it("should insert 1", function(done) {
                const now = new Date();
                now.setMilliseconds(0);
    
                const hacked = hack.whereOnce(model, { key1: 2, key2: 1 });
                adapter.insert(model, Yukari.extractAdapterData(model, {
                    key1: 2,
                    key2: 1,
                }), function(err, _row) {
                    should.ifError(err);
                    const row = require("../../util/common").extend({}, _row);
                    row.should.match({
                        key1: 2,
                        key2: 1
                    });
    
                    hacked.called.should.equal(1);
                    done();
                });
            });
        });
    
        describe(`${name} fail`, function() {
            const toshihiko = new Toshihiko("mysql", options);
            const adapter = toshihiko.adapter;
            const model = toshihiko.define("test1", common.COMMON_SCHEMA, {
                cache: {
                    name: "memcached",
                    servers: [ "localhost:11211" ],
                    options: { prefix: "fail_" }
                }
            });
        
            after(function() {
                model.cache.memcached.flush(function() {
                    adapter.mysql.end();
                });
            });

            it("deleteByQuery", function(done) {
                async.waterfall([
                    function(callback) {
                        hack.hackAsyncReturn(adapter, "execute", [ undefined ]);
                        adapter.insert(model, [{ field: model.schema[1], value: "123" }], function(err) {
                            err.message.should.equal("no row inserted.");
                            callback();
                        });
                    },

                    function(callback) {
                        const where = model.where;
                        model.where = function() {
                            const a = {};
                            hack.hackAsyncErr(a, "findOne");
                            return a;
                        };
                        hack.hackAsyncReturn(adapter, "execute", [ undefined, { insertId: 100 } ]);
                        adapter.insert(model, [{ field: model.schema[1], value: "123" }], function(err) {
                            model.where = where;
                            err.message.should.equal("findOne predefinition 1");
                            callback();
                        });
                    },

                    function(callback) {
                        const where = model.where;
                        model.where = function() {
                            const a = {};
                            hack.hackAsyncReturn(a, "findOne", [ undefined, null ]);
                            return a;
                        };
                        hack.hackAsyncReturn(adapter, "execute", [ undefined, { insertId: 100 } ]);
                        adapter.insert(model, [{ field: model.schema[1], value: "123" }], function(err) {
                            model.where = where;
                            err.message.should.equal("insert successfully but failed to read the record.");
                            callback();
                        });
                    }
                ], function(err) {
                    should.ifError(err);
                    done();
                });
            });
        });
    });
};
