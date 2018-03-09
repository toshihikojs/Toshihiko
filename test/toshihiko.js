/**
 * XadillaX created at 2016-08-09 10:05:39 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const path = require("path");

const hack = require("./util/hack");
const Toshihiko = require("../lib/toshihiko");

describe("🐣 toshihiko", function() {
    describe("create", function() {
        it("should create with base adapter", function() {
            const options = { foo: 1 };
            const toshihiko = new Toshihiko("base", options);
            toshihiko.options.should.equal(options);
            toshihiko.adapter.should.be.instanceof(require("../lib/adapters/base"));
        });

        it("should create with base adapter using module", function() {
            const options = { foo: 1, showSql: true };
            const toshihiko = new Toshihiko(require("../lib/adapters/base"), options);
            toshihiko.options.should.equal(options);
            toshihiko.adapter.should.be.instanceof(require("../lib/adapters/base"));
        });
    });

    describe("execute", function() {
        it("should call adapter's execute", function(done) {
            const options = {};
            const Adapter = function(toshihiko, _options) {
                this.toshihiko = toshihiko;
                _options.should.equal(options);
            };

            Adapter.prototype.execute = function(foo, bar) {
                foo.should.equal("fooooo");
                bar.should.equal("barrrr");
                done();
            };
            const toshihiko = new Toshihiko(Adapter, options);
            toshihiko.adapter.toshihiko.should.equal(toshihiko);
            toshihiko.execute("fooooo", "barrrr");
        });

        describe("promise", function() {
            const toshihiko = new Toshihiko("base");

            it("should resolve", function() {
                hack.hackAsyncReturn(toshihiko.adapter, "execute", [ undefined, [ "ok" ], "again" ]);
                return toshihiko.execute(1, 2, 3).should.eventually.deepEqual([ "ok" ]);
            });

            it("should reject", function() {
                hack.hackAsyncErr(toshihiko.adapter, "execute");
                return toshihiko.execute(4, function(err) {
                    err.message.should.equal("execute predefinition 1");
                }).should.be.rejectedWith("execute predefinition 1");
            });
        });
    });

    describe("define", function() {
        const Cache = require("./util/cache").Cache;
        const toshihiko = new Toshihiko("base");

        it("should define a model", function() {
            const model = toshihiko.define("name", [ { name: "foo" } ], { cache: { module: require("./util/cache") } });
            model.name.should.equal("name");
            model.schema.should.be.instanceof(Array);
            model.schema.length.should.equal(1);
            model.cache.should.be.instanceof(Cache);
            model.parent.should.equal(toshihiko);
        });
    });

    describe("👙 createCache", function() {
        const Cache = require("./util/cache").Cache;

        it("pass cache instance", function() {
            const cache = {
                deleteData: function() {},
                deleteKeys: function() {},
                setData: function() {},
                getData: function() {}
            };

            Toshihiko.createCache(cache).should.equal(cache);
        });

        it("pass cache path", function() {
            const param = { path: path.resolve(__dirname, "./util/cache"), bar: "barrrr", foo: "fooooo" };
            const cache = Toshihiko.createCache(param);
            cache.should.be.instanceof(Cache);
            cache.foo.should.equal("fooooo");
            cache.bar.should.equal("barrrr");
        });

        it("pass cache create", function() {
            const param = { module: require("./util/cache"), bar: "barrrr", foo: "fooooo" };
            const cache = Toshihiko.createCache(param);
            cache.should.be.instanceof(Cache);
            cache.foo.should.equal("fooooo");
            cache.bar.should.equal("barrrr");
        });

        it("pass cache name", function() {
            const param = { name: "memcached", servers: [], options: {} };
            const cache = Toshihiko.createCache(param);
            cache.should.be.instanceof(require("toshihiko-memcached/lib/memcached"));
            cache.servers.should.equal(param.servers);
            cache.options.should.equal(param.options);
        });
    });
});
