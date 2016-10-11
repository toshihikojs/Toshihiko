/**
 * XadillaX created at 2016-10-01 11:48:17 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const async = require("async");
const should = require("should");

const common = require("../util/common");
const hack = require("../util/hack");
const Query = require("../../lib/query");
const Toshihiko = require("../../lib/toshihiko");

module.exports = function(name, options) {
    describe(`${name} findWithNoCache`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA);
    
        after(function() {
            adapter.mysql.end();
        });
    
        it("normal 1", function(done) {
            const query = new Query(model).fields("key1,key2,key3").order("key1 asc").limit(100);
    
            adapter.findWithNoCache(query.model, function(err, rows, extra) {
                should.ifError(err);
                extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `id` ASC LIMIT 100");
                rows.should.match([
                    { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 3, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 4, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                ]);
                done();
            }, adapter.queryToOptions(query, {}));
        });
    
        it("normal 2", function(done) {
            const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(100);
    
            adapter.findWithNoCache(query.model, function(err, rows, extra) {
                should.ifError(err);
                extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` ASC LIMIT 100");
                rows.should.match([
                    { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 3, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 4, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                ]);
                done();
            }, adapter.queryToOptions(query, {}));
        });
    
        describe("single", function() {
            it("no limit", function(done) {
                const query = new Query(model).fields("key1,key2,key3").order("key2 asc");
    
                adapter.findWithNoCache(query.model, function(err, rows, extra) {
                    should.ifError(err);
                    extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                        "ASC LIMIT 0, 1");
                    rows.should.match({ id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                    done();
                }, adapter.queryToOptions(query, { single: true }));
            });
    
            it("limit 10", function(done) {
                const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(10);
    
                adapter.findWithNoCache(query.model, function(err, rows, extra) {
                    should.ifError(err);
                    extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                        "ASC LIMIT 1");
                    rows.should.match({ id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                    done();
                }, adapter.queryToOptions(query, { single: true }));
            });
    
            it("limit 1, 100", function(done) {
                const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(1, 100);
    
                adapter.findWithNoCache(query.model, function(err, rows, extra) {
                    should.ifError(err);
                    extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                        "ASC LIMIT 1, 1");
                    rows.should.match({ id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                    done();
                }, adapter.queryToOptions(query, { single: true }));
            });
    
            it("limit 100, 100", function(done) {
                const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(100, 100);
    
                adapter.findWithNoCache(query.model, function(err, rows, extra) {
                    should.ifError(err);
                    extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                        "ASC LIMIT 100, 1");
                    should(rows).equal(null);
                    done();
                }, adapter.queryToOptions(query, { single: true }));
            });
        });
    });
    
    describe(`${name} findWithCache`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA, {
            cache: {
                name: "memcached",
                servers: [ "localhost:11211" ],
                options: { prefix: "findWithCache_" }
            }
        });
    
        after(function() {
            model.cache.memcached.flush(function() {
                adapter.mysql.end();
            });
        });
    
        it("normal 1", function(done) {
            const query = new Query(model).fields("key1,key2,key3,key5").order("key1 asc").limit(1);
            adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                should.ifError(err);
                extra.should.equal("SELECT `id`, `key2`, `key3`, `key5` FROM `test1` " +
                    "ORDER BY `id` ASC LIMIT 1");
                rows.should.match([
                    { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                ]);
                model.cache.memcached.get("findWithCache___toshihiko__:test1:1", function(err, res) {
                    should.ifError(err);
                    res.should.match({ id: 1,
                        key2: 0.5,
                        key3: "{\"foo\":\"bar\"}",
                        key4: null,
                        key5: rows[0].key5.toISOString(),
                        key6: "10101000"
                    });
    
                    model.cache.memcached.get("findWithCache___toshihiko__:test1:2", function(err, res) {
                        should.ifError(err);
                        should(res).equal(undefined);
                        done();
                    });
                });
            }, adapter.queryToOptions(query, {}));
        });
    
        it("normal 2", function(done) {
            const query = new Query(model).fields("key1,key2,key3,key5").order("key2 asc").limit(100);
    
            adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                should.ifError(err);
                extra.should.equal("SELECT `id`, `key2`, `key3`, `key5` FROM `test1` " +
                    "ORDER BY `key2` ASC LIMIT 100");
                rows.should.match([
                    { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 3, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                    { id: 4, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                ]);
    
                model.cache.memcached.get("findWithCache___toshihiko__:test1:2", function(err, res) {
                    should.ifError(err);
                    res.should.match({
                        key2: 0.5,
                        key3: "{\"foo\":\"bar\"}",
                        key4: "dummy primary",
                        key5: rows[1].key5.toISOString(),
                        key6: "100100010111010000000011011001",
                        id: 2
                    });
                    done();
                });
            }, adapter.queryToOptions(query, {}));
        });
    });

    describe(`${name} count`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA);
    
        after(function() {
            adapter.mysql.end();
        });
    
        it("should get", function(done) {
            const query = new Query(model).where({ key1: { $gte: 2 } });
            adapter.count(query, function(err, rows, extra) {
                should.ifError(err);
                extra.should.equal("SELECT COUNT(0) FROM `test1` WHERE (`id` >= 2)");
                rows.should.equal(3);
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


        it("findWithNoCache", function(done) {
            async.waterfall([
                function(callback) {
                    hack.hackSyncErr(adapter, "makeSql");
                    adapter.findWithNoCache(model, function(err) {
                        err.message.should.equal("makeSql predefinition 1");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(adapter, "execute");
                    adapter.findWithNoCache(model, function(err) {
                        err.message.should.equal("execute predefinition 1");
                        callback();
                    });
                }
            ], function(err) {
                should.ifError(err);
                done();
            }); 
        });

        it("findWithCache", function(done) {
            async.waterfall([
                function(callback) {
                    hack.hackSyncErr(adapter, "makeSql");
                    adapter.findWithCache(model.cache, model, function(err) {
                        err.message.should.equal("makeSql predefinition 1");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(adapter, "execute");
                    adapter.findWithCache(model.cache, model, function(err) {
                        err.message.should.equal("execute predefinition 1");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(adapter, "execute");
                    hack.hackSyncErr(adapter, "makeSql", 2);
                    adapter.findWithCache(model.cache, model, function(err) {
                        err.message.should.equal("makeSql predefinition 2");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(model.cache, "getData");
                    adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                        should.ifError(err);
                        rows.length.should.equal(4);
                        extra.should.equal("SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test1`");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(model.cache, "getData");
                    hack.hackSyncErr(adapter, "makeSql", 3);
                    adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                        err.message.should.equal("makeSql predefinition 3");
                        rows.length.should.equal(3);
                        extra.should.equal("SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test1`");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncErr(model.cache, "getData");
                    hack.hackAsyncErr(adapter, "execute", 2);
                    adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                        err.message.should.equal("execute predefinition 2");
                        rows.length.should.equal(3);
                        extra.should.equal("SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test1`");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackAsyncReturn(adapter, "execute", [ undefined, [] ], 2);
                    hack.hackAsyncErr(model.cache, "getData");
                    adapter.findWithCache(model.cache, model, function(err, rows, extra) {
                        should.ifError(err);
                        rows.length.should.equal(3);
                        extra.should.equal("SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test1`");
                        callback();
                    });
                },

                function(callback) {
                    hack.hackSyncErr(adapter, "makeSql", 2);
                    adapter.findWithCache(model.cache, model, function(err) {
                        err.message.should.equal("makeSql predefinition 2");
                        callback();
                    });
                }
            ], function(err) {
                should.ifError(err);
                done();
            }); 
        });
    });
};
