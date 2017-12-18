/**
 * XadillaX created at 2016-10-13 14:51:03 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const hack = require("../util/hack");
const Yukari = require("../../lib/yukari");

module.exports = function(model) {
    const date = new Date();
    const origData = {
        key1: 123,
        key2: 1.5,
        key3: "{ foo: \"bar\" }",
        key4: "234",
        key5: date.toISOString(),
        key6: "1100101001"
    };

    describe("👯 insert", function() {
        it("should get error in adapter insert", function(done) {
            const yukari = new Yukari(model, "new");
            yukari.buildNewRow(origData);
            hack.hackAsyncErr(yukari.$adapter, "insert");
            yukari.insert(function(err) {
                err.message.should.equal("insert predefinition 1");
                done();
            });
        });

        it("should get error in adapter validate", function(done) {
            const yukari = new Yukari(model, "new");
            yukari.buildNewRow(origData);
            hack.hackAsyncErr(yukari, "validateAll");
            yukari.insert(function(err) {
                err.message.should.equal("validateAll predefinition 1");
                done();
            });
        });

        it("should insert", function(done) {
            const row = { key1: 1, key2: 1.5, key3: { foo: "bar" }, key4: "234", key5: date, key6: { dec: 8 } };
            const yukari = new Yukari(model, "new");
            yukari.buildNewRow(row);
            const insert = yukari.$adapter.insert;
            yukari.$adapter.insert = function(_model, conn, data, callback) {
                yukari.$adapter.insert = insert;
                model.should.equal(_model);
                data.should.match([{
                    field: { name: "key1" },
                    value: 1
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
                    value: { dec: 8 }
                }]);
                const _row = { key1: 1, key2: 1.5, key3: { foo: "bar" }, key4: "234", key5: date, key6: { dec: 8 } };
                _row.$origData = {};
                return callback(undefined, row, "OK");
            };
            yukari.insert(function(err, _yukari, extra) {
                should.ifError(err);
                yukari.should.equal(_yukari);
                extra.should.equal("OK");
                yukari.toJSON().should.deepEqual(row);
                done();
            });
        });

        it("should get error when old", function(done) {
            const yukari = new Yukari(model, "query");
            yukari.insert(function(err) {
                err.message.should.equal("You must call this function via a new Yukari object.");
                done();
            });
        });
    });
};
