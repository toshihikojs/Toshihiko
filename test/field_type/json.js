/**
 * XadillaX created at 2016-10-13 17:57:32 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const should = require("should");

const Json = require("../../lib/field_type").Json;

module.exports = function() {
    describe("🤑 json", function() {
        it("restore", function() {
            Json.restore({}).should.equal("{}");
            Json.restore({ foo: "bar" }).should.equal("{\"foo\":\"bar\"}");
            Json.restore(null).should.equal("null");
            Json.restore("a").should.equal("\"a\"");
        });

        it("parse", function() {
            Json.parse("{}").should.deepEqual({});
            should(Json.parse("null")).deepEqual(null);
            Json.parse("\"a\"").should.equal("a");
            Json.parse("{\"foo\":\"bar\"}").should.deepEqual({ foo: "bar" });
            Json.parse("{foo:1}").should.deepEqual({ foo: 1 });
            Json.parse("{foo:1").should.deepEqual({});
        });

        it("equal", function() {
            Json.equal("{}", null).should.equal(false);
            Json.equal({ foo: 1 }, { foo: 1 }).should.equal(true);
            Json.equal({ foo: undefined }, {}).should.equal(true);
            Json.equal("1", "1").should.equal(true);

            const a = {};
            a.a = a;
            Json.equal(a, {}).should.equal(false);
        });
    });
};
