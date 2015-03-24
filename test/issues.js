/**
 * XadillaX created at 2015-03-24 12:33:42
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
require("should");
var T = require("../");
var toshihiko = new T.Toshihiko("myapp_test", "root", "", {
    cache : {
        name: "memcached",
        servers: [ "localhost:11211" ],
        options: { prefix: "**zhazha_" }
    }
});

var Model = null;
describe("issues", function () {
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

    describe("transform", function () {
        it("should fix #17, 转义是导致存储对象错误", function (done) {
            Model.build({
                key2: 1.0,
                key3: "<?xml />",
                key4: "###"
            }).save(function(err, res) {
                (err instanceof Error).should.be.eql(false);
                res.key3 = "<?html />";
                res.save(function(err, res, sql) {
                    sql.indexOf("<?html />").should.be.above(0);
                    (err instanceof Error).should.be.eql(false);

                    done();
                });
            });
        });
    });
});

