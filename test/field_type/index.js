/**
 * XadillaX created at 2016-10-13 16:26:19 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const TYPE = require("../../lib/field_type");

describe("field type", function() {
    it("equal function", function() {
        TYPE.$equal(1, 2).should.equal(false);
        TYPE.$equal(1, 1).should.equal(true);
        TYPE.$equal({}, {}).should.equal(false);
        TYPE.$equal(global, global).should.equal(true);
    });

    require("./boolean")();
    require("./datetime")();
    require("./float")();
    require("./integer")();
    require("./json")();
    require("./string")();
});
