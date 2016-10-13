/**
 * XadillaX created at 2016-10-13 17:23:35 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _String = require("../../lib/field_type").String;

module.exports = function() {
    describe("🤑 string", function() {
        it("restore", function() {
            _String.restore().should.equal("");
            _String.restore(null).should.equal("");
            _String.restore({}).should.equal("[object Object]");
            _String.restore(1).should.equal("1");
        });

        it("parse", function() {
            _String.parse().should.equal("");
            _String.parse(null).should.equal("");
            _String.parse({}).should.equal("[object Object]");
            _String.parse(1).should.equal("1");
        });

        it("equal", function() {
            _String.equal("[object Object]", {}).should.equal(true);
            _String.equal("123", "123").should.equal(true);
            _String.equal("123", "234").should.equal(false);
            _String.equal(null, undefined).should.equal(false);
        });
    });
};
