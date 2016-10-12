/**
 * XadillaX created at 2016-10-12 11:51:11 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const async = require("async");
const should = require("should");

const common = require("../util/common");
const Query = require("../../lib/query");
const Yukari = require("../../lib/yukari");

module.exports = function(model) {
    const toshihiko = model.parent;

    describe("👯 delete", function() {
        it("with single primary key", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource({ key1: 123 });

            async.waterfall([
                function(callback) {
                    const where = yukari.$model.where;
                    yukari.$model.where = function(w) {
                        const query = new Query(yukari.$model);
                        query.delete = function(callback) {
                            query.should.match({
                                _limit: [ 0, 1 ],
                                _where: { key1: 123 }
                            });
                            callback(new Error("query delete err"));
                        };
                        return query.where(w);
                    };
                    yukari.delete(function(err) {
                        err.message.should.equal("query delete err");
                        yukari.$model.where = where;
                        return callback();
                    });
                },

                function(callback) {
                    const where = yukari.$model.where;
                    yukari.$model.where = function(w) {
                        const query = new Query(yukari.$model);
                        query.delete = function(callback) {
                            query.should.match({
                                _limit: [ 0, 1 ],
                                _where: { key1: 123 }
                            });
                            callback();
                        };
                        return query.where(w);
                    };
                    yukari.delete(function(err) {
                        err.message.should.equal("unknown error.");
                        yukari.$model.where = where;
                        return callback();
                    });
                },

                function(callback) {
                    const where = yukari.$model.where;
                    yukari.$model.where = function(w) {
                        const query = new Query(yukari.$model);
                        query.delete = function(callback) {
                            query._limit.should.deepEqual([ 0, 1 ]);
                            query._where.should.deepEqual({ key1: 123 });
                            callback(undefined, { affectedRows: 1 }, "ok");
                        };
                        return query.where(w);
                    };
                    yukari.delete(function(err, res, extra) {
                        should.ifError(err);
                        res.should.equal(true);
                        extra.should.equal("ok");
                        yukari.$model.where = where;
                        return callback();
                    });
                }
            ], function() {
                done();
            });
        });

        it("with several primary keys", function(done) {
            const model = toshihiko.define("test1", common.COMMON_SCHEMA_MULTI_PRIMARY);
            const yukari = new Yukari(model, "query");
            const where = yukari.$model.where;
            yukari.fillRowFromSource({ key1: 123, key4: "234" });
            yukari.$model.where = function(w) {
                const query = new Query(yukari.$model);
                query.delete = function(callback) {
                    query._limit.should.deepEqual([ 0, 1 ]);
                    query._where.should.deepEqual({ key1: 123, key4: "234" });
                    callback(undefined, { affectedRows: 1 }, "ok");
                };
                return query.where(w);
            };
            yukari.delete(function(err, res, extra) {
                should.ifError(err);
                res.should.equal(true);
                extra.should.equal("ok");
                yukari.$model.where = where;
                return done();
            });
        });

        it("with no primary key", function(done) {
            const model = toshihiko.define("test1", common.COMMON_SCHEMA_NO_PRIMARY);
            const yukari = new Yukari(model, "query");
            const where = yukari.$model.where;
            const date = new Date();
            yukari.fillRowFromSource({
                key1: 123,
                key2: 1.5,
                key3: "{ foo: \"bar\" }",
                key4: "234",
                key5: date.toISOString(),
                key6: "1100101001"
            });
            yukari.$model.where = function(w) {
                const query = new Query(yukari.$model);
                query.delete = function(callback) {
                    query._limit.should.deepEqual([ 0, 1 ]);
                    query._where.should.deepEqual({
                        key1: 123,
                        key2: 1.5,
                        key3: { foo: "bar" },
                        key4: "234",
                        key5: date,
                        key6: {
                            dec: 809
                        }
                    });
                    callback(undefined, { affectedRows: 1 }, "ok");
                };
                return query.where(w);
            };
            yukari.delete(function(err, res, extra) {
                should.ifError(err);
                res.should.equal(true);
                extra.should.equal("ok");
                yukari.$model.where = where;
                return done();
            });
        });
    });
};
