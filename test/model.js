var should = require("should");
var T = require("../");
var async = require("async");
var Memcached = T.Memcached;
var toshihiko = new T.Toshihiko("myapp_test", "root", "", {
    memcached: new Memcached(
        [ "localhost:11211", "localhost:11213", "localhost:11212" ],
        { prefix: "siyuezhazha_" })
});

var Model = null;
describe("model", function () {
    before(function (done) {
        var sql = "CREATE TABLE `test` (" +
            "`id` int(11) unsigned NOT NULL AUTO_INCREMENT," +
            "`key2` float NOT NULL," +
            "`key3` varchar(200) NOT NULL DEFAULT ''," +
            "`key4` varchar(200) NOT NULL DEFAULT ''," +
            "PRIMARY KEY (`id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";

        toshihiko.execute(sql, done);
    });

    before(function () {
        Model = toshihiko.define("test", [
            { name: "key1", column: "id", primaryKey: true, type: T.Type.Integer },
            {
                name: "key2",
                type: T.Type.Float, 
                defaultValue: 0.44, 
                validators: [
                    function(v) {
                        if(v > 100) return "`key2` can't be greater than 100";
                    }
                ]
            },
            { name: "key3", type: T.Type.Json, defaultValue: {} },
            { name: "key4", type: T.Type.String, defaultValue:"Ha!"}
        ]);
    });

    after(function(done) {
        toshihiko.execute("DROP TABLE `test`;", done);
    });

    describe("insert", function () {
        it("insert 10 row", function (done) {
            var arr = [];
            var i = 10;
            while(i--) arr.push(i);
            async.parallel(arr.map(function (it) {
                return function(cb) {
                    var yukari = Model.build({
                        key2    : it + 0.1,
                        key3    : { it: it % 2 },
                        key4    : "哈哈" + it % 3
                    });

                    yukari.insert(function (err) {
                        should(err).equal(undefined);
                        cb(null, it);
                    });
                };
            }), function(err,data) {
                data.should.eql(arr);
                should(err).not.be.ok;
                done();
            });
        });
    });

    describe("query", function () {
        it("limit", function(done) {
            Model.limit("0,5").find(function(err, data) {
                should(err).not.be.ok;
                data.length.should.eql(5);
                done();
            },true);
        });

        it("count", function(done) {
            Model.count(function(err, count) {
                should(err).not.be.ok;
                count.should.eql(10);
                done();
            });
        });

        it("findOne", function(done) {
            Model.where({ key1: 1 }).findOne(function(err, data) {
                should(err).not.be.ok;
                data.should.have.ownProperty('key1').eql(1);
                done();
            },true);
        });

        it("find", function(done) {
            Model.where({ key1: { $gt: 8 }}).find(function(err, data) {
                should(err).not.be.ok;
                data.length.should.eql(2);
                data.forEach(function (it) {
                    it.should.have.keys("key2", "key1", "key3", "key4");
                });
                done();
            },true);
        });

        it("order", function(done) {
            Model.orderBy("key1 desc").find(function(err, data) {
                should(err).not.be.ok;
                data.should.be.Array;
                data.forEach(function(it, i) {
                    if(i !== 10 - 1) it.should.hasOwnProperty("key1").above(data[i + 1].key1);
                    it.$fromMemcached.should.be.true;
                });
                done();
            });
        });

        it("findById", function(done) {
            Model.findById(3, function(err, data) {
                should(err).not.be.ok;
                data.should.hasOwnProperty("key1").eql(3);
                done();
            });
        });
    });

    describe("update", function() {
        it("update", function(done) {
            var nData = {
                key2    : 1,
                key3    : { it: 1 },
                key4    : "new data"
            };

            Model.where({ key1: 1 }).update(nData, function(err, data) {
                should(err).not.be.ok;
                data.affectedRows.should.be.eql(1);

                Model.findById(1, function(err, data) {
                    should(err).not.be.ok;
                    data.key3.should.be.eql({ it: 1 });
                    done();
                });
            });
        });
    });

    describe("delete", function() {
        it("delete", function(done) {
            Model.where({ key1: 1 }).delete(function(err/**,data*/) {
                should(err).not.be.ok;
                done();
            }, true);
        });
    });
});

