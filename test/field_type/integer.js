/**
 * XadillaX created at 2016-10-13 17:54:01 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const _Integer = require("../../lib/field_type").Integer;

module.exports = function() {
    describe("🤑 integer", function() {
        it("restore", function() {
            _Integer.restore("1.2A").should.equal(1);
            _Integer.restore(1.2).should.equal(1);
            _Integer.restore(100).should.equal(100);
        });

        it("parse", function() {
            _Integer.parse("1.2A").should.equal(1);
            _Integer.parse(1.2).should.equal(1);
            _Integer.parse(100).should.equal(100);
        });

        it("equal", function() {
            _Integer.equal(1.2, 1.2).should.equal(true);
            _Integer.equal("1.2", 1.2).should.equal(true);
            _Integer.equal(1.3, 1.2).should.equal(true);
            _Integer.equal("1.3", 1.2).should.equal(true);
            _Integer.equal("2", 1).should.equal(false);
            _Integer.equal(2, 1).should.equal(false);
        });
    });
};
