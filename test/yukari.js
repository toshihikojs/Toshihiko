require("should");
var T = require("../");
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
        yukari.insert().$promise.catch(done).finally(done);
    });

    beforeEach(function (done) {
        Model.findOne().$promise.then(function (data) {
            yukari = data;
            done();
        }).catch(done);
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
        yukari.insert().$promise.then(function (data) {
            data.should.eql(yukari);
            done();
        }).catch(done);
    });
    it("#update",function (done){
        yukari.key2 = 3;
        yukari.update().$promise.then(function (data) {
            data.should.eql(yukari);
            done();
        }).catch(done);
    });
    it("#save",function (done){
        yukari.key2 = 4;
        yukari.save().$promise.then(function (data) {
            data.should.eql(yukari);
            done();
        }).catch(done);
    });
    it("#delete",function (done){
        yukari.delete().$promise.then(function (data) {
            data.should.eql(1);
            done();
        }).catch(done);
    });
   
    it("#toJSON", function() {
        var SecondModel = toshihiko.define("x", [
            { name: "date", type: T.Type.Datetime }
        ]);

        var youkari = SecondModel.build({
            date: new Date("2015-09-16T17:10:45.754+08:00")
        });

        youkari.toJSON().should.be.eql({
            date: new Date("2015-09-16T17:10:45.754+08:00").format("{yyyy}-{MM}-{dd}T{HH}:{mm}:{ss}.{fff}{isotz}")
        });
    });
});
