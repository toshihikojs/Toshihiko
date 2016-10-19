/**
 * XadillaX created at 2016-08-09 10:32:04 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

require("should");

const common = require("../util/common");

describe("🐣 common", function() {
    describe("👙 getParamNames", function() {
        it("should recognize no argument", function() {
            let func;
            func = (function() {});
            common.getParamNames(func).should.deepEqual([]);
            func = (function() { return function() {}; })();
            common.getParamNames(func).should.deepEqual([]);
            func = function() { console.log("function(argu) {}"); };
            common.getParamNames(func).should.deepEqual([]);
            eval("func = function (     \n    \n      \n  \t) {         }"); // jshint ignore: line
            common.getParamNames(func).should.deepEqual([]);
        });

        it("should recognize arguments", function() {
            let func;
            func = function(foo, bar) {}; // jshint ignore: line
            common.getParamNames(func).should.deepEqual([ "foo", "bar" ]);
            func = (function(_asdf, 囍, _, λ) {}) ;// jshint ignore: line
            common.getParamNames(func).should.deepEqual([ "_asdf", "囍", "_", "λ" ]);
            eval("func = function 洗(   as   \n , sadf, /** sadf, */ 我, _  \n      \n  \t) {  //\n this.a = 1;       }"); // jshint ignore: line
            common.getParamNames(func).should.deepEqual([ "as", "sadf", "我", "_" ]);
        });
    });

    describe("👙 promisify", function() {
        it("should get promise's callback 1", function() {
            const callback = common.promisify(function(err) {
                err.message.should.equal("123");
            });

            callback(new Error("123"));

            return callback.promise.should.be.rejectedWith("123");
        });

        it("should get promise's callback 2", function() {
            const callback = common.promisify(function(err, ok) {
                ok.should.equal(123);
            });

            callback(undefined, 123);

            return callback.promise.should.eventually.equal(123);
        });

        it("should have $promise", function() {
            const callback = common.promisify();
            callback.promise.should.equal(callback.promise.$promise);

            callback(undefined, "ok");
            return callback.promise.should.eventually.equal("ok");
        });
    });
});
