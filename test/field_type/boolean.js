/**
 * XadillaX created at 2016-10-13 17:23:46 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _Boolean = require("../../lib/field_type").Boolean;

module.exports = function() {
    describe("🤑 boolean", function() {
        it("restore", function() {
            _Boolean.restore(true).should.equal(1);
            _Boolean.restore(false).should.equal(0);
        });

        it("parse", function() {
            _Boolean.parse().should.equal(false);
            _Boolean.parse(null).should.equal(false);
            _Boolean.parse(1).should.equal(true);
            _Boolean.parse(0).should.equal(false);
            _Boolean.parse("").should.equal(false);
            _Boolean.parse(-100).should.equal(true);
            _Boolean.parse(true).should.equal(true);
            _Boolean.parse(false).should.equal(false);
        });

        it("equal", function() {
            _Boolean.equal(0, 0).should.equal(true);
            _Boolean.equal(10, 1).should.equal(true);
            _Boolean.equal(true, 1).should.equal(true);
            _Boolean.equal(false, 1).should.equal(false);
        });
    });
};
