/**
 * XadillaX created at 2015-10-23 11:02:46 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
require("should");
var escaper = require("../lib/escaper");

describe("Escaper", function() {
    describe("escape", function() {
        it("should not escape", function() {
            escaper.escape(1).should.be.eql(1);
        });

        it("should escape", function() {
            escaper.escape("\n'\"\t\r\b\x1a\\\0")
                .should.be.eql("\\n\\'\\\"\\t\\r\\b\\Z\\\\\\0");
        });
    });

    describe("escapeLike", function() {
        it("should escape", function() {
            escaper.escapeLike("foo_bar % baz")
                .should.be.eql("foo\\_bar \\% baz");
        });
    });
});
