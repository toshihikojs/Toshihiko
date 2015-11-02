/**
 * XadillaX created at 2015-03-24 12:33:42
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved
 */
var field = require("../lib/fieldType");
require("should");

describe("Field",function () {
    describe("float type", function () {
        var float = field.Float;
        describe("#restore", function () {
            it("arg float", function () {
                (float.restore(1.14412)).should.equal(1.14412);
                (float.restore(-1.1)).should.equal(-1.1);
            });
            it("arg string", function () {
                (float.restore("1.441")).should.equal(1.441);
                (float.restore("-1.1")).should.equal(-1.1);
            });
        });
        describe("#parse", function () {
            it("arg float", function () {
                (float.parse(1.14412)).should.equal(1.14412);
                (float.parse(-1.1)).should.equal(-1.1);
            });
            it("arg string", function () {
                (float.parse("1.441")).should.equal(1.441);
                (float.parse("-1.1")).should.equal(-1.1);
            });
        });
        describe("#equal", function () {
            it("should return true", function () {
                (float.equal("123.1", 123.1)).should.be.true;
                (float.equal(123.1, 123.1)).should.be.true;
                (float.equal(0, 0)).should.be.true;
                (float.equal("-1", -1)).should.be.true;
                (float.equal(-1.1, -1.1)).should.be.true;
            });
            it("should return false", function () {
                (float.equal("123.1", 123.11)).should.not.be.true;
                (float.equal(123.1, 123.11)).should.not.be.true;
                (float.equal(0, 0.111)).should.not.be.true;
                (float.equal("-1", -1.1)).should.not.be.true;
                (float.equal(-1.1, -1.11)).should.not.be.true;
                (float.equal(-1.1, NaN)).should.not.be.true;
            });
        });
    });

    describe("Boolean type", function () {
        var _Boolean = field.Boolean;
        describe("#restore", function () {
            it("arg Integer", function () {
                (_Boolean.restore(1)).should.equal(1);
                (_Boolean.restore(-1)).should.equal(1);
            });
            it("arg Float", function () {
                (_Boolean.restore(1.1)).should.equal(1);
                (_Boolean.restore(-1.1)).should.equal(1);
            });
            it("arg string", function () {
                (_Boolean.restore("1.441")).should.equal(1);
                (_Boolean.restore("-1.1")).should.equal(1);
                (_Boolean.restore("-1")).should.equal(1);
                (_Boolean.restore("1")).should.equal(1);
            });
            it("arg boolean", function() {
                (_Boolean.restore(true)).should.equal(1);
                (_Boolean.restore(false)).should.equal(0);
            });
        });
        describe("#parse", function () {
            it("arg Integer", function () {
                (_Boolean.parse(1)).should.equal(true);
                (_Boolean.parse(-1)).should.equal(true);
                (_Boolean.parse(0)).should.equal(false);
            });
            it("arg Float", function () {
                (_Boolean.parse(1.1)).should.equal(true);
                (_Boolean.parse(-1.1)).should.equal(true);
            });
            it("arg string", function () {
                (_Boolean.parse("1.441")).should.equal(true);
                (_Boolean.parse("-1.1")).should.equal(true);
                (_Boolean.parse("-1")).should.equal(true);
            });
        });
        describe("#equal", function () {
            it("should return true", function () {
                (_Boolean.equal("123.1", 123)).should.be.true;
                (_Boolean.equal(123.1, 123)).should.be.true;
                (_Boolean.equal(0, 0)).should.be.true;
                (_Boolean.equal("-1", -1)).should.be.true;
                (_Boolean.equal(-1.1, -1)).should.be.true;
            });
            it("should return false", function () {
                (_Boolean.equal("124.1", false)).should.not.be.true;
                (_Boolean.equal(124.1, "")).should.not.be.true;
                (_Boolean.equal(3, 0)).should.not.be.true;
                (_Boolean.equal(true, false)).should.not.be.true;
                (_Boolean.equal(true, 0)).should.not.be.true;
            });
        });
    });

    describe("Integer type", function () {
        var Integer = field.Integer;
        describe("#restore", function () {
            it("arg Integer", function () {
                (Integer.restore(1)).should.equal(1);
                (Integer.restore(-1)).should.equal(-1);
            });
            it("arg Float", function () {
                (Integer.restore(1.1)).should.equal(1);
                (Integer.restore(-1.1)).should.equal(-1);
            });
            it("arg string", function () {
                (Integer.restore("1.441")).should.equal(1);
                (Integer.restore("-1.1")).should.equal(-1);
                (Integer.restore("-1")).should.equal(-1);
                (Integer.restore("1")).should.equal(1);
            });
        });
        describe("#parse", function () {
            it("arg Integer", function () {
                (Integer.parse(1)).should.equal(1);
                (Integer.parse(-1)).should.equal(-1);
            });
            it("arg Float", function () {
                (Integer.parse(1.1)).should.equal(1);
                (Integer.parse(-1.1)).should.equal(-1);
            });
            it("arg string", function () {
                (Integer.parse("1.441")).should.equal(1);
                (Integer.parse("-1.1")).should.equal(-1);
                (Integer.parse("-1")).should.equal(-1);
            });
        });
        describe("#equal", function () {
            it("should return true", function () {
                (Integer.equal("123.1", 123)).should.be.true;
                (Integer.equal(123.1, 123)).should.be.true;
                (Integer.equal(0, 0)).should.be.true;
                (Integer.equal("-1", -1)).should.be.true;
                (Integer.equal(-1.1, -1)).should.be.true;
            });
            it("should return false", function () {
                (Integer.equal("124.1", 123.1)).should.not.be.true;
                (Integer.equal(124.1, 123.1)).should.not.be.true;
                (Integer.equal(3, 0.111)).should.not.be.true;
                (Integer.equal("-2", -1.1)).should.not.be.true;
                (Integer.equal(-2.1, -1)).should.not.be.true;
                (Integer.equal(-2.1, NaN)).should.not.be.true;
            });
        });
    });
    describe("String tpye", function () {
        var String = field.String;
        describe("#restore", function () {
            it("should return \"\"", function () {
                String.restore().should.eql("");
                String.restore("").should.eql("");
                String.restore(null).should.eql("");
                String.restore(undefined).should.eql("");
            });
            it("should return as String", function () {
                String.restore(123).should.eql("123");
                String.restore("x123").should.eql("x123");
                String.restore(123.1).should.eql("123.1");
                String.restore(" ").should.eql(" ");
            });
        });
        describe("#parse", function () {
            it("should return \"\"", function () {
                String.parse().should.eql("");
                String.parse("").should.eql("");
                String.parse(null).should.eql("");
                String.parse(undefined).should.eql("");
            });
            it("should return as String", function () {
                String.parse(123).should.eql("123");
                String.parse("x123").should.eql("x123");
                String.parse(123.1).should.eql("123.1");
                String.parse(" ").should.eql(" ");
            });
        });
        describe("#equal", function () {
            it("should return true" , function () {
                String.equal(123,"123").should.be.true;
                String.equal("123","123").should.be.true;
                String.equal("123",123).should.be.true;
            });
            it("should return false", function () {
                String.equal("123",null).should.be.false;
                String.equal("123",undefined).should.be.false;
                String.equal(NaN,"123").should.be.false;
                String.equal("123","1234").should.be.false;
            });
        });

        describe("#zero", function() {
            it("should be \"0\"", function() {
                String.restore(0).should.be.eql("0");
                String.parse(0).should.be.eql("0");
            });
        });
    });
    describe("Json type", function () {
        var json  = field.Json;
        describe("#restore", function () {
            it("Json to String", function () {
                json.restore({a:1}).should.eql("{\"a\":1}");
            });
        });
        describe("#parse", function () {
            it("return {}", function () {
                json.parse("{\"a\":").should.eql({});
            });
            it("String to Json", function () {
                json.parse("{\"a\":1}").should.eql({a:1});
            });
        });
        describe("#equal", function () {
            it("return true", function () {
                json.equal({a:1},{a:1}).should.be.true;
            });
            it("return false", function () {
                json.equal({a:"1"},{a:1}).should.be.false;
                json.equal("{xxx",{a:1}).should.be.false;
            });
        });
    });
});
