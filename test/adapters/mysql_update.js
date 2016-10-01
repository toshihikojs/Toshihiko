/**
 * XadillaX created at 2016-09-23 16:01:19 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const common = require("../util/common");
const Query = require("../../lib/query");
const Toshihiko = require("../../lib/toshihiko");

module.exports = function(name, options) {
    describe(`${name} makeSet`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA); 

        after(function(done) {
            adapter.mysql.end(done);
        });

        it("should makeSet 1", function() {
            const sql = adapter.makeSet(model, {
                key1: 421,
                key2: 1.23,
                key3: { a: "123" },
                key4: "123"
            });
            sql.should.equal("`id` = 421, `key2` = 1.23, `key3` = '{\\\"a\\\":\\\"123\\\"}', `key4` = '123'");
        });

        it("should makeSet empty", function() {
            const sql = adapter.makeSet(model, {});
            sql.should.equal("");
        });

        it("should makeSet empty 2", function() {
            const sql = adapter.makeSet(model, { foo: "bar" });
            sql.should.equal("");
        });

        it("should makeSet with {{}}", function() {
            const sql = adapter.makeSet(model, {
                key1: "{{key2 + 123}}",
                key3: "{{CONCAT(\"{\\\"foo\\\":\\\"\", key1, key4, \"\\\"}\")}}",
                key4: "{{\"123,456\"}}"
            });
            sql.should.equal("`id` = key2 + 123, `key3` = CONCAT(\"{\\\"foo\\\":\\\"\", id, key4, \"\\\"}\"), " +
                "`key4` = \"123,456\"");
        });
    });

    describe(`${name} makeUpdate`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should makeUpdate 1", function() {
            const sql = adapter.makeUpdate(model, {
                update: {
                    key1: 421,
                    key2: 1.23,
                    key3: { a: "123" },
                    key4: "123"
                },
                where: {
                    key1: 123,
                    key4: "456"
                },
                index: "idx"
            });
            sql.should.equal("UPDATE `test` FORCE INDEX(`idx`) SET `id` = 421, `key2` = 1.23, " +
                "`key3` = '{\\\"a\\\":\\\"123\\\"}', `key4` = '123' WHERE (`id` = 123 AND `key4` = \"456\")");
        });

        it("should makeUpdate with no where", function() {
            const sql = adapter.makeUpdate(model, {
                update: { key1: 1 }
            });
            sql.should.equal("UPDATE `test` SET `id` = 1");
        });

        it("should throw error with no update", function() {
            try {
                adapter.makeUpdate(model, {
                    where: { key1: 123 }
                });
            } catch(e) {
                e.message.should.equal("no set data.");
            }
        });
    });

    describe(`${name} updateByQuery`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA, {
            cache: {
                name: "memcached",
                servers: [ "localhost:11211" ],
                options: { prefix: "updateByQuery_" }
            }
        });

        before(function(done) {
            const query = new Query(model);
            query.find(function(err) {
                should.ifError(err);
                model.cache.getData("__toshihiko__", "test1", [ { id: 1 } ], function(err, result) {
                    should.ifError(err);
                    result.should.match([{
                        id: 1,
                        key2: 0.5
                    }]);
                    done();
                });
            });
        });

        after(function(done) {
            adapter.mysql.end(done);
        });

        it("should do delete cache", function(done) {
            const $deleteKeys = model.cache.deleteKeys;
            const $execute = adapter.execute;
            let deleteKeysCalled = 0;
            let executeCalled = 0;

            model.cache.deleteKeys = function(database, name, keys, callback) {
                database.should.equal("__toshihiko__");
                name.should.equal("test1");
                keys.should.match([
                    { id: 2 },
                    { id: 1 }
                ]);
                model.cache.deleteKeys = $deleteKeys;
                deleteKeysCalled++;
                callback();
            };

            adapter.execute = function(sql, callback) {
                sql.should.equal("SELECT `id` FROM `test1` WHERE (`id` < 3) ORDER BY `id` DESC LIMIT 5");
                adapter.execute = $execute;
                executeCalled++;
                return $execute.call(adapter, sql, callback);
            };

            const query = new Query(model);
            query.where({ key1: { $lt: 3 } }).limit(5).order({ key1: -1 });
            query._updateData = { key1: "{{key1}}" };
            adapter.updateByQuery(query, function(err, result, sql) {
                should.ifError(err);
                result.should.match({
                    fieldCount: 0,
                    affectedRows: 2,
                    insertId: 0,
                    serverStatus: 2,
                    warningStatus: 0,
                    changedRows: 0
                });
                sql.should.equal("UPDATE `test1` SET `id` = id WHERE (`id` < 3) ORDER BY `id` DESC LIMIT 5");

                deleteKeysCalled.should.equal(1);
                executeCalled.should.equal(1);

                done();
            });
        });

        it("should really delete cache", function(done) {
            const query = new Query(model);
            query.where({ key1: 1 });
            query._updateData = { key6: { dec: 7599 } };
            adapter.updateByQuery(query, function(err, result, sql) {
                should.ifError(err);
                result.should.match({
                    changedRows: 1,
                    affectedRows: 1
                });
                sql.should.equal("UPDATE `test1` SET `key6` = BIN(7599) WHERE (`id` = 1)");

                model.cache.getData("__toshihiko__", "test1", [{ id: 1 }], function(err, data) {
                    should.ifError(err);
                    data.should.deepEqual([]);
                    adapter.execute("SELECT * FROM `test1` WHERE `id` = 1", function(err, result) {
                        should.ifError(err);
                        result.should.match([{
                            id: 1,
                            key6: "1110110101111"
                        }]);
                        done();
                    });
                });
            });
        });
    });
};
