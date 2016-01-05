/**
 * XadillaX created at 2015-03-24 12:33:42
 *
 * Copyright (c) 2015 Souche.com, all rights
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
            "`index` int(11) NOT NULL DEFAULT 1," +
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
            { name: "key4", type: T.Type.String, defaultValue:"Ha!"},
            { name: "key5", column: "index", type: T.Type.Integer }
        ]);
    });

    after(function(done) {
        toshihiko.execute("DROP TABLE `test`;", done);
    });

    describe("transform", function () {
        it("should fix #17, 转义是导致存储对象错误", function(done) {
            Model.build({
                key2: 1.0,
                key3: "<?xml />",
                key4: "###",
                key5: 1
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

        it("should fix #18, 列名为关键字时 `order by` 的 SQL 生成错误", function(done) {
            Model.orderBy({ key5: 1 }).find(function(err, res) {
                (err instanceof Error).should.be.eql(false);
                res.length.should.be.eql(1);
                res[0].key5.should.be.eql(1);
                done();
            });
        });
    });

    describe("generate", function() {
        it("should fix #32, 逻辑运算 AND 或者 OR 的时候有 NULL 时发生的 Bug", function(done) {
            var sql = Model.where({ key1: { $neq: [ 0, null ] } }).makeSQL("find");
            sql.should.be.eql("SELECT `id`, `key2`, `key3`, `key4`, `index` FROM `test` WHERE ((`id` != 0 AND `id` IS NOT NULL))");

            sql = Model.where({ key1: null }).makeSQL("find");
            sql.should.be.eql("SELECT `id`, `key2`, `key3`, `key4`, `index` FROM `test` WHERE (`id` IS NULL)");

            sql = Model.where({ key1: { $neq: null } }).makeSQL("find");
            sql.should.be.eql("SELECT `id`, `key2`, `key3`, `key4`, `index` FROM `test` WHERE ((`id` IS NOT NULL))");

            done();
        });
    });
});
