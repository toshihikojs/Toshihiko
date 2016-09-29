/**
 * XadillaX created at 2016-09-28 10:29:26 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const common = require("../util/common");
const Query = require("../../lib/query");
const Toshihiko = require("../../lib/toshihiko");
const Yukari = require("../../lib/yukari");

module.exports = function(name, options) {
    describe(`${name} makeDelete`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA); 

        after(function(done) {
            adapter.mysql.end(done);
        });

        it("should makeDelete 1", function() {
            const sql = adapter.makeDelete(model, {
                where: {
                    key1: 421,
                    key2: 1.23,
                    key3: { a: "123" },
                    key4: "123"
                }
            });
            sql.should.equal("DELETE FROM `test1` WHERE (`id` = 421 AND `key2` = 1.23 AND `key3` = " +
                "\"{\\\"a\\\":\\\"123\\\"}\" AND `key4` = \"123\")");
        });

        it("should makeDelete 2", function() {
            const sql = adapter.makeDelete(model, {
                where: { key1: 1 },
                order: [ { key2: -1 } ]
            });
            sql.should.equal("DELETE FROM `test1` WHERE (`id` = 1) ORDER BY `key2` DESC");
        });

        it("should makeDelete 3", function() {
            const sql = adapter.makeDelete(model, {
                where: { key1: 1 },
                order: [ { key2: -1 } ],
                limit: [ 0, 1 ]
            });
            sql.should.equal("DELETE FROM `test1` WHERE (`id` = 1) ORDER BY `key2` DESC LIMIT 0, 1");
        });

        it("should makeDelete 4", function() {
            const sql = adapter.makeDelete(model, {});
            sql.should.equal("DELETE FROM `test1`"); 
        });
    });

    describe(`${name} deleteByQuery`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test1", common.COMMON_SCHEMA, {
            cache: {
                name: "memcached",
                servers: [ "localhost:11211" ],
                options: { prefix: "updateByQuery_" }
            }
        });

        let id = 4;
        beforeEach(function(done) {
            id++;
            const yukari = new Yukari(model, "new");
            yukari.buildNewRow({ key4: "tobedeleted", key5: new Date() });
            yukari.insert(function(err) {
                should.ifError(err);
                const query = new Query(model);
                query.find(function(err) {
                    should.ifError(err);
                    model.cache.getData("__toshihiko__", "test1", [ { id: id } ], function(err, result) {
                        should.ifError(err);
                        result.should.match([{
                            id: id,
                            key4: "tobedeleted"
                        }]);
                        done();
                    });
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
                    { id: 5 }
                ]);
                model.cache.deleteKeys = $deleteKeys;
                deleteKeysCalled++;
                callback();
            };

            adapter.execute = function(sql, callback) {
                sql.should.equal("SELECT `id` FROM `test1` WHERE (`key4` = \"tobedeleted\") " +
                    "ORDER BY `id` DESC LIMIT 5");
                adapter.execute = $execute;
                executeCalled++;
                return $execute.call(adapter, sql, callback);
            };

            const query = new Query(model);
            query.where({ key4: "tobedeleted" }).limit(5).order({ key1: -1 });
            adapter.deleteByQuery(query, function(err, result, sql) {
                should.ifError(err);
                result.should.match({
                    fieldCount: 0,
                    affectedRows: 1,
                    insertId: 0,
                    serverStatus: 34,
                    warningStatus: 0
                });
                sql.should.equal("DELETE FROM `test1` WHERE (`key4` = \"tobedeleted\") ORDER BY `id` DESC LIMIT 5");

                deleteKeysCalled.should.equal(1);
                executeCalled.should.equal(1);

                done();
            });
        });

        it("should really delete cache", function(done) {
            const query = new Query(model);
            query.where({ key4: "tobedeleted" });
            adapter.deleteByQuery(query, function(err, result, sql) {
                should.ifError(err);
                result.should.match({
                    affectedRows: 1
                });
                sql.should.equal("DELETE FROM `test1` WHERE (`key4` = \"tobedeleted\")");

                model.cache.getData("__toshihiko__", "test1", [{ id: 6 }], function(err, data) {
                    should.ifError(err);
                    data.should.deepEqual([]);
                    adapter.execute("SELECT * FROM `test1` WHERE `id` = 6", function(err, result) {
                        should.ifError(err);
                        result.should.match([]);
                        done();
                    });
                });
            });
        });
    });
};
