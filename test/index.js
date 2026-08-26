/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const should = require("should");
const Toshihiko = require("..");

describe("package exports", function() {
    it("should expose only runtime values declared by the entry point", function() {
        Object.keys(Toshihiko).sort().should.deepEqual([ "Adapter", "Escaper", "Toshihiko", "Type" ]);
        should(Toshihiko.Query).equal(undefined);
        should(Toshihiko.Model).equal(undefined);
        should(Toshihiko.Yukari).equal(undefined);
    });
});
