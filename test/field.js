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
            });
        });
    });
});
