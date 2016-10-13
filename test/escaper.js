/**
 * XadillaX created at 2016-10-13 18:07:46 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

require("should");

const Escaper = require("../util/escaper");

describe("escaper", function() {
    it("🤓 escape", function() {
        Escaper.escape("\n'\"\t\0\r\b\x1a\\").should.equal("\\n\\'\\\"\\t\\0\\r\\b\\Z\\\\");
    });

    it("🤓 escapeLike", function() {
        Escaper.escapeLike("def%_abc").should.equal("def\\%\\_abc");
    });
});
