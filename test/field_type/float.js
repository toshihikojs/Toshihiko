/**
 * XadillaX created at 2016-10-13 17:50:24 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const _Float = require("../../lib/field_type").Float;

module.exports = function() {
    describe("🤑 float", function() {
        it("restore", function() {
            _Float.restore("1.2A").should.equal(1.2);
            _Float.restore(1.2).should.equal(1.2);
        });

        it("parse", function() {
            _Float.parse("1.2A").should.equal(1.2);
            _Float.parse(1.2).should.equal(1.2);
        });

        it("equal", function() {
            _Float.equal(1.2, 1.2).should.equal(true);
            _Float.equal("1.2", 1.2).should.equal(true);
            _Float.equal(1.3, 1.2).should.equal(false);
            _Float.equal("1.3", 1.2).should.equal(false);
        });
    });
};
