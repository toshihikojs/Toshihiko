/**
 * XadillaX created at 2016-10-19 11:16:24 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const common = require("../util/common");
const hack = require("../util/hack");
const Toshihiko = require("../../lib/toshihiko");
const Yukari = require("../../lib/yukari");

describe("🐣 yukari promise", function() {
    const toshihiko = new Toshihiko("base");
    const model = toshihiko.define("model", common.COMMON_SCHEMA);

    describe("insert", function() {
        it("should resolve", function() {
            const yukari = new Yukari(model, "new");
            hack.hackAsyncReturn(toshihiko.adapter, "insert", [ undefined, { key1: 1 }, "again" ]);
            return yukari.insert().should.eventually.match({ key1: 1 });
        });

        it("should reject 1", function() {
            const yukari = new Yukari(model, "query");
            return yukari.insert().should.be.rejectedWith("You must call this function via a new Yukari object.");
        });

        it("should reject 2", function() {
            const yukari = new Yukari(model, "new");
            hack.hackAsyncErr(toshihiko.adapter, "insert");
            return yukari.insert().should.be.rejectedWith("insert predefinition 1");
        });
    });

    describe("update ", function() {
        it("should resolve", function() {
            const yukari = new Yukari(model, "query");
            hack.hackAsyncReturn(toshihiko.adapter, "update", [ undefined, {}, "again" ]);
            return yukari.update().should.eventually.match({});
        });

        it("should reject 1", function() {
            const yukari = new Yukari(model, "new");
            return yukari.update().should.be.rejectedWith("You must call this function via an old Yukari object.");
        });

        it("should reject 2", function() {
            const yukari = new Yukari(model, "query");
            hack.hackAsyncErr(toshihiko.adapter, "update");
            return yukari.update().should.be.rejectedWith("update predefinition 1");
        });
    });
});
