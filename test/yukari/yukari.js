/**
 * XadillaX created at 2016-10-11 15:29:11 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const async = require("async");
const should = require("should");

const common = require("../util/common");
const Toshihiko = require("../../lib/toshihiko");
const Yukari = require("../../lib/yukari");

describe("🐣 yukari", function() {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", common.COMMON_SCHEMA);

    describe("🔪 initialize", function() {
        it("create", function() {
            const yukari = new Yukari(model, "new");
            yukari.$model.should.equal(model);
            yukari.$toshihiko.should.equal(toshihiko);
            yukari.$schema.should.equal(model.schema);
            yukari.$origData.should.deepEqual({});
            yukari.$source.should.equal("new");
            yukari.$dbName.should.equal("");
            yukari.$tableName.should.equal("model");
            should(yukari.$cache).equal(null);
            yukari.$fromCache.should.equal(false);
            yukari.$adapter.should.equal(toshihiko.adapter);
        });

        describe("fillRowFromSource", function() {
            it("row in original name", function() {
                const yukari = new Yukari(model, "query");
                yukari.$source.should.equal("query");
                yukari.fillRowFromSource({ id: 123 }, true);
                yukari.should.match({ key1: 123 });
                yukari.$origData.should.deepEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 123
                    }
                });
                yukari.$fromCache.should.equal(false);
            });

            it("row not in original name", function() {
                const yukari = new Yukari(model, "query");
                yukari.$source.should.equal("query");
                yukari.fillRowFromSource({ key1: 234, key99: 345 });
                yukari.should.match({ key1: 234 });
                yukari.$origData.should.deepEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 234
                    }
                });
                yukari.$fromCache.should.equal(false);
            });

            it("should sign from cache", function() {
                const yukari = new Yukari(model, "query");
                yukari.$source.should.equal("query");
                yukari.fillRowFromSource({ key1: 456, $fromCache: true });
                yukari.should.match({ key1: 456 });
                yukari.$origData.should.deepEqual({
                    key1: {
                        fieldIdx: 0,
                        data: 456
                    }
                });
                yukari.$fromCache.should.equal(true);
            });
        });

        describe("buildNewRow", function() {
            it("row in original name", function() {
                const yukari = new Yukari(model, "new");
                yukari.$source.should.equal("new");
                yukari.buildNewRow({ id: 123 }, true);
                yukari.should.match({ key1: 123 });
                yukari.$origData.should.deepEqual({});
                yukari.$fromCache.should.equal(false);
            });

            it("row not in original name", function() {
                const yukari = new Yukari(model, "new");
                yukari.$source.should.equal("new");
                yukari.buildNewRow({ key1: 234, key2: 345 });
                yukari.should.match({ key1: 234 });
                yukari.$origData.should.deepEqual({});
                yukari.$fromCache.should.equal(false);
            });
        });
    });

    describe("functional", function() {
        describe("👯 fieldIndex", function() {
            it("should get when new", function() {
                const yukari = new Yukari(model, "new");
                yukari.fieldIndex("key2").should.equal(1);
            });

            it("shouldn't get when new", function() {
                const yukari = new Yukari(model, "new");
                yukari.fieldIndex("kkk").should.equal(-1);
            });

            it("should get when query", function() {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });
                yukari.fieldIndex("key1").should.equal(0);
            });

            it("shouldn't get when query", function() {
                const yukari = new Yukari(model, "query");
                yukari.fillRowFromSource({ key1: 123 });
                yukari.fieldIndex("kkk").should.equal(-1);
            });
        });

        describe("👯 validateOne", function() {
            it("should validate several functions", function(done) {
                async.waterfall([
                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.validateOne("key2", 50, function(err) {
                            should.ifError(err);
                            callback();
                        });
                    },

                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.validateOne("key2", -150, function(err) {
                            err.message.should.equal("`key2` can't be smaller than -100");
                            callback();
                        });
                    },

                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.validateOne("key2", 150, function(err) {
                            err.message.should.equal("`key2` can't be greater than 100");
                            callback();
                        });
                    }
                ], function(err) {
                    should.ifError(err);
                    done();
                }); 
            });

            it("should validate one function", function(done) {
                const yukari = new Yukari(model, "new");
                yukari.validateOne("key6", { dec: -150 }, function(err) {
                    err.message.should.equal("`key6` can't be smaller than -100");
                    done();
                });
            });
        });

        describe("👯 validateAll", function() {
            it("should correct", function(done) {
                const yukari = new Yukari(model, "new");
                yukari.buildNewRow({
                    key2: 50,
                    key6: { dec: 50 }
                });
                yukari.validateAll(function(err) {
                    should.ifError(err);
                    done();
                });
            });

            it("should incorrect", function(done) {
                async.waterfall([
                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.buildNewRow({ key2: -150, key6: { dec: 50 } });
                        yukari.validateAll(function(err) {
                            err.message.should.equal("`key2` can't be smaller than -100");
                            callback();
                        });
                    },

                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.buildNewRow({ key2: 150, key6: { dec: 50 } });
                        yukari.validateAll(function(err) {
                            err.message.should.equal("`key2` can't be greater than 100");
                            callback();
                        });
                    },

                    function(callback) {
                        const yukari = new Yukari(model, "new");
                        yukari.buildNewRow({ key2: -50, key6: { dec: -150 } });
                        yukari.validateAll(function(err) {
                            err.message.should.equal("`key6` can't be smaller than -100");
                            callback();
                        });
                    }
                ], function(err) {
                    should.ifError(err);
                    done();
                });
            });
        });

        require("./delete")(model);
    });
});
