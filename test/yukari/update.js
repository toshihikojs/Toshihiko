/**
 * XadillaX created at 2016-10-12 14:45:03 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const common = require("../util/common");
const hack = require("../util/hack");
const Model = require("../../lib/model");
const Yukari = require("../../lib/yukari");

module.exports = function(model) {
    const toshihiko = model.parent;
    const date = new Date();
    const origData = {
        key1: 123,
        key2: 1.5,
        key3: "{ foo: \"bar\" }",
        key4: "234",
        key5: date.toISOString(),
        key6: "1100101001"
    };

    describe("👯 update", function() {
        it("should get error in adapter update", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource(origData);
            yukari.key1 = 234;
            yukari.key4 = null;

            hack.hackAsyncErr(yukari.$adapter, "update");
            yukari.update(function(err) {
                err.message.should.equal("update predefinition 1");
                done();
            });
        });

        it("should get error in adapter validate", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource(origData);
            yukari.key1 = 234;
            yukari.key4 = null;

            hack.hackAsyncErr(yukari, "validateAll");
            yukari.update(function(err) {
                err.message.should.equal("validateAll predefinition 1");
                done();
            });
        });

        it("should update", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource(origData);
            yukari.key1 = 234;
            yukari.key4 = null;
            yukari.key6 = { dec: 23983489 };

            const update = yukari.$adapter.update;
            yukari.$adapter.update = function(_model, conn, pk, data, callback) {
                yukari.$adapter.update = update;
                model.should.equal(_model);
                pk.should.deepEqual({ key1: 123 });
                data.should.match([{
                    field: { name: "key1" },
                    value: 234
                }, {
                    field: { name: "key4" },
                    value: null
                }, {
                    field: { name: "key6" },
                    value: { dec: 23983489 }
                }]);
                return callback(undefined, "OK");
            };
            yukari.update(function(err, _yukari, extra) {
                should.ifError(err);
                yukari.should.equal(_yukari);
                extra.should.equal("OK");
                yukari.toJSON().should.deepEqual({
                    key1: 234,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: null,
                    key5: date,
                    key6: { dec: 23983489 }
                });
                done();
            });
        });

        it("should update when no update", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource(origData);
            const update = yukari.$adapter.update;
            yukari.$adapter.update = function(_model, conn, pk, data, callback) {
                yukari.$adapter.update = update;
                model.should.equal(_model);
                pk.should.deepEqual({ key1: 123 });
                data.should.match([{
                    field: { name: "key1" },
                    value: 123
                }, {
                    field: { name: "key2" },
                    value: 1.5
                }, {
                    field: { name: "key3" },
                    value: { foo: "bar" }
                }, {
                    field: { name: "key4" },
                    value: "234"
                }, {
                    field: { name: "key5" },
                    value: date
                }, {
                    field: { name: "key6" },
                    value: { dec: 809 }
                }]);
                return callback(undefined, "OK");
            };
            yukari.update(function(err, _yukari, extra) {
                should.ifError(err);
                yukari.should.equal(_yukari);
                extra.should.equal("OK");
                yukari.toJSON().should.deepEqual({
                    key1: 123,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: "234",
                    key5: date,
                    key6: { dec: 809 }
                });
                done();
            });
        });

        it("should update when no primary key", function(done) {
            const model = new Model("model", toshihiko, common.COMMON_SCHEMA_NO_PRIMARY);
            const yukari = new Yukari(model, "query");
            yukari.fillRowFromSource(origData);
            const update = yukari.$adapter.update;
            yukari.$adapter.update = function(_model, conn, pk, data, callback) {
                yukari.$adapter.update = update;
                model.should.equal(_model);
                pk.should.deepEqual({
                    key1: 123,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: "234",
                    key5: date,
                    key6: { dec: 809 }
                });
                data.should.match([{
                    field: { name: "key1" },
                    value: 123
                }, {
                    field: { name: "key2" },
                    value: 1.5
                }, {
                    field: { name: "key3" },
                    value: { foo: "bar" }
                }, {
                    field: { name: "key4" },
                    value: "234"
                }, {
                    field: { name: "key5" },
                    value: date
                }, {
                    field: { name: "key6" },
                    value: { dec: 809 }
                }]);
                return callback(undefined, "OK");
            };
            yukari.update(function(err, _yukari, extra) {
                should.ifError(err);
                yukari.should.equal(_yukari);
                extra.should.equal("OK");
                yukari.toJSON().should.deepEqual({
                    key1: 123,
                    key2: 1.5,
                    key3: { foo: "bar" },
                    key4: "234",
                    key5: date,
                    key6: { dec: 809 }
                });
                done();
            });
        });

        it("should get error when new", function(done) {
            const yukari = new Yukari(model, "new");
            yukari.update(function(err) {
                err.message.should.equal("You must call this function via an old Yukari object.");
                done();
            });
        });
    });
};
