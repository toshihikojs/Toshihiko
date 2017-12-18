/**
 * XadillaX created at 2016-08-08 17:29:52 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

require("should");

const Adapter = require("../../lib/adapters/base");

describe("🐣 adapters/base", function() {
    const adapter = new Adapter({}, {});

    describe("create", function() {
        it("should create a base adapter", function() {
            const par = {};
            const options = { foo: "bar" };
            const adapter = new Adapter(par, options);

            adapter.parent.should.be.eql(par);

            adapter.options.should.deepEqual(options);
            adapter.options.should.not.equal(options);
        });
    });

    describe("execute", function() {
        it("should be async", function(done) {
            let flag = false;
            let ok = false;

            adapter.execute({}, function() {
                flag = true;
                if(ok) done();
            });

            flag.should.equal(false);
            ok = true;
        });
    });

    describe("not implemented", function() {
        function test(name, callbackPos) {
            it(`${name}: should get error`, function(done) {
                const argu = [];
                for(let i = 0; i < callbackPos; i++) argu.push(null);
                argu.push(function(err) {
                    err.should.be.instanceof(Error);
                    err.message.indexOf("not implemented").should.above(0);
                    done();
                });
                adapter[name].apply(adapter, argu);
            });
        }

        test("find", 1);
        test("count", 1);
        test("updateByQuery", 1);
        test("deleteByQuery", 1);
        test("insert", 3);
        test("update", 4);
        test("beginTransaction", 0);
        test("rollback", 1);
        test("commit", 1);
        test("execute", 100);
    });
});
