var should = require("should");
var T = require("../");
var async = require("async");
var toshihiko = new T.Toshihiko("myapp_test", "root", "", {
    cache : {
        name: "memcached",
        servers: [ "localhost:11211", "localhost:11212", "localhost:11213" ],
        options: { prefix: "siyuezhazha_" }
    }
});

var Model = null;
describe("yukari", function () {
    var yukari = null;
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

    before(function (done) {
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

        yukari = Model.build({
            key2    : 1.1,
            key3    : { "2": 2.1 },
            key4    : "哈哈"
        });
        yukari.insert().$promise().catch(done).finally(done);
    });

    beforeEach(function (done) {
        Model.findOne().$promise().then(function (data) {
            yukari = data;
        }).catch(done).finally(done);
    });

    after(function(done) {
        toshihiko.execute("DROP TABLE `test`;", done);
    });
    it("#insert",function (done){
        var yukari = Model.build({
            key2    : 2,
            key3    : { "2": 2 },
            key4    : "哈哈"
        });
        yukari.insert().$promise().then(function (data) {
            data.should.eql(yukari);
        }).catch(done).finally(done);
    });
    it("#update",function (done){
        yukari.key2 = 3;
        yukari.update().$promise().then(function (data) {
            data.should.eql(yukari);
        }).catch(done).finally(done);
    });
    it("#save",function (done){
        yukari.key2 = 3;
        yukari.save().$promise().then(function (data) {
            data.should.eql(yukari);
        }).catch(done).finally(done);
    });
    it("#delete",function (done){
        yukari.delete().$promise().then(function (data) {
            data.should.eql(1);
        }).catch(done).finally(done);
    });
});

