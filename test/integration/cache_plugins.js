/**
 * Baseline tests for the cache plugins documented by Toshihiko 1.x.
 */
"use strict";

const async = require("async");

const Memcached = require("toshihiko-memcached");
const Redis = require("toshihiko-redis");

const DATABASE = "baseline";
const TABLE = "records";
const PREFIX = "__toshihiko_baseline__";
const FIRST = { id: 1, name: "first" };
const SECOND = { id: 2, name: "second" };

function defineCacheBaseline(options) {
    describe(`${options.name} cache baseline`, function() {
        let cache;

        before(function() {
            cache = options.create();
        });

        after(function() {
            options.close(cache);
        });

        it("should preserve its legacy compound key format", function() {
            cache._getKey(DATABASE, TABLE, {
                siteId: 1,
                userId: 2
            }).should.equal(options.compoundKey);
        });

        it("should preserve round-trip, miss, and delete behavior", function(done) {
            async.series([
                function(next) {
                    cache.setData(DATABASE, TABLE, 1, FIRST, next);
                },
                function(next) {
                    cache.setData(DATABASE, TABLE, 2, SECOND, next);
                },
                function(next) {
                    cache.getData(DATABASE, TABLE, [ 1, 2 ], function(err, rows) {
                        if(err) return next(err);
                        rows.should.deepEqual([ FIRST, SECOND ]);
                        next();
                    });
                },
                function(next) {
                    cache.getData(DATABASE, TABLE, [ 999, 2 ], function(err, rows) {
                        if(err) return next(err);
                        rows.should.deepEqual(options.missWithHit);
                        next();
                    });
                },
                function(next) {
                    cache.deleteData(DATABASE, TABLE, 1, function(err) {
                        next(err);
                    });
                },
                function(next) {
                    cache.getData(DATABASE, TABLE, [ 1 ], function(err, rows) {
                        if(err) return next(err);
                        rows.should.deepEqual(options.deletedResult);
                        next();
                    });
                },
                function(next) {
                    cache.deleteKeys(DATABASE, TABLE, [ 2 ], function(err) {
                        next(err);
                    });
                },
                function(next) {
                    cache.getData(DATABASE, TABLE, [ 2 ], function(err, rows) {
                        if(err) return next(err);
                        rows.should.deepEqual(options.deletedResult);
                        next();
                    });
                }
            ], done);
        });
    });
}

defineCacheBaseline({
    name: "Memcached",
    create: function() {
        return Memcached.create("127.0.0.1:11211", { prefix: PREFIX });
    },
    close: function(cache) {
        cache.memcached.end();
    },
    compoundKey: `${PREFIX}${DATABASE}:${TABLE}:s1:u2`,
    missWithHit: [ SECOND ],
    deletedResult: []
});

defineCacheBaseline({
    name: "Redis",
    create: function() {
        return Redis.create("127.0.0.1:6379", { prefix: PREFIX });
    },
    close: function(cache) {
        cache.redis.disconnect();
    },
    compoundKey: `${PREFIX}${DATABASE}_${TABLE}:siteId1:userId2`,
    missWithHit: [ null, SECOND ],
    deletedResult: [ null ]
});
