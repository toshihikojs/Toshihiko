var should = require("should");
var T = require("../");
var async = require('async');
var Memcached = T.Memcached;
var toshihiko = new T.Toshihiko("myapp_test", "root", "", {
    memcached   : new Memcached("localhost:11211",{ prefix: "siyuezhazha_"})
});

var Model = null;
describe("model", function () {
    before(function (done) {
        var sql = "CREATE TABLE `test` ("
            +"`id` int(11) unsigned NOT NULL AUTO_INCREMENT,"
            +"`key2` float NOT NULL,"
            +"`key3` varchar(200) NOT NULL DEFAULT '',"
            +"`key4` varchar(200) NOT NULL DEFAULT '',"
                +"PRIMARY KEY (`id`)"
            +") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
        toshihiko.execute(sql,done);
    });
    before(function () {
        Model = toshihiko.define('test', [
            { name: "key1", column: "id", primaryKey: true, type: T.Type.Integer },
            { name: "key2", type: T.Type.Float, defaultValue: 0.44, validators: [
                function(v) {
                    if(v > 100) return "`key4` can't be greater than 100";
                }]
            },
            { name: "key3", type: T.Type.Json, defaultValue: {} },
            { name: "key4", type: T.Type.String, defaultValue:"Ha!"}
        ]);
    });
    after(function(done) {
        toshihiko.execute("DROP TABLE `test`;", done);
    });
    describe("insert", function () {
        it("insert 100 row", function (done) {
            var arr = [];
            var i = 100;
            while(i--) arr.push(i);
            async.parallel(arr.map(function (it) {
                return function (cb) {
                    var yukari = Model.build({
                        key2    : it+0.1,
                        key3    : {"it":it%2},
                        key4    : "哈哈"+it%3
                    });
                    yukari.insert(function (err) {
                        should(err).equal(undefined);
                        cb(null,it)
                    })
                }
            }), function (err,data) {
                data.should.eql(arr);
                should(err).not.be.ok;
                done();
            });
            
        });
    });
    describe("query", function () {
        it("limit", function (done) {
            Model.limit("0,30").find(function (err,data) {
                should(err).not.be.ok;
                data.length.should.eql(30);
                done();
            },true);
        });
        it("count", function (done) {
            Model.count(function(err, count) {
                should(err).not.be.ok;
                count.should.eql(100);
                done();
            });
        });
        it("findOne", function (done) {
            Model.where({key1:1}).findOne(function (err,data) {
                should(err).not.be.ok;
                data.should.have.ownProperty('key1').eql(1);
                done()
            },true)
        });
        it("find", function (done) {
            Model.where({key1:{$gt:98}}).find(function (err,data) {
                should(err).not.be.ok;
                data.length.should.eql(2);
                data.forEach(function (it) {
                    it.should.have.keys("key2","key1","key3","key4");
                });
                done();
            },true);
        });
        it("order", function (done) {
            Model.orderBy("key1 desc").find(function (err,data) {
                should(err).not.be.ok;
                data.should.be.Array;
                data.forEach(function (it,i) {
                    if(i!== 100 - 1) it.should.hasOwnProperty("key1").above(data[i+1].key1);
                });
                done();
            },true);
        });
        it("findById", function (done) {
            Model.findById(3, function (err,data) {
                should(err).not.be.ok;
                data.should.hasOwnProperty("key1").eql(3);
                done();
            });
        });
    });
});