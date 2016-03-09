/**
 * XadillaX created at 2015-03-24 12:33:42
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved
 */
var should = require("should");

var T = require("../");

var toshihiko = new T.Toshihiko("myapp_test", "root", "", {
    cache : {
        name: "memcached",
        servers: [ "localhost:11211" ],
        options: { prefix: "**zhazha_" }
    }
});

var Model = null;
var Model2 = null;
var Model3 = null;
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
        var sql2 = "CREATE TABLE `test2` (" +
            "`id` int(11) unsigned NOT NULL AUTO_INCREMENT," +
            "`key2` float NOT NULL," +
            "`key3` varchar(200) NOT NULL DEFAULT ''," +
            "`key4` varchar(200) NOT NULL DEFAULT ''," +
            "`index` int(11) NOT NULL DEFAULT 1," +
            "PRIMARY KEY (`index`)," +
            "KEY(`id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
        var sql3 = "CREATE TABLE `test3` (" +
            "`id` int(11) unsigned NOT NULL," +
            "`key2` float NOT NULL," +
            "`key3` varchar(200) NOT NULL DEFAULT ''," +
            "`key4` varchar(200) NOT NULL DEFAULT ''," +
            "`index` int(11) NOT NULL DEFAULT 1," +
            "PRIMARY KEY (`index`, `id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
        toshihiko.execute(sql, function() {
            toshihiko.execute(sql2, function() {
                toshihiko.execute(sql3, done);
            });
        });
    });

    before(function () {
        Model = toshihiko.define("test", [
            { name: "key1", column: "id", primaryKey: true, type: T.Type.Integer, autoIncrement: true },
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

        Model2 = toshihiko.define("test2", [
            { name: "key1", column: "id", type: T.Type.Integer, autoIncrement: true },
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
            { name: "key5", column: "index", type: T.Type.Integer, primaryKey: true }
        ]);

        Model3 = toshihiko.define("test3", [
            { name: "key1", column: "id", type: T.Type.Integer },
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
            { name: "key5", column: "index", type: T.Type.Integer, primaryKey: true }
        ]);
    });

    after(function(done) {
        toshihiko.execute("DROP TABLE `test`;", function() {
            toshihiko.execute("DROP TABLE `test2`;", function() {
                toshihiko.execute("DROP TABLE `test3`;", done);
            });
        });
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

    describe("error", function() {
        it("should fix #34, Model.count 的时候，在 callback 函数里面 throw Error 会触发两次 callback", function(done) {
            var originalException = process.listeners("uncaughtException").pop();
            process.removeListener("uncaughtException", originalException);
            process.once("uncaughtException", function(err) {
                err.message.should.be.eql("0");
                process.on("uncaughtException", originalException);
                done();
            });

            var i = 0;
            Model.count(function() {
                throw new Error(i++);
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

    describe("CURD", function() {
        it("should fix #38, 非主键自增 Id 时，插入后会被认为主键", function(done) {
            var test = Model2.build({
                key2: 1,
                key3: 2,
                key4: 3,
                key5: 4
            });
            test.save(function(err, t) {
                should.ifError(err);
                should(t).not.be.empty();
                t.key5.should.be.eql(4);
                done();
            });
        });

        it("should fix #42, 没有任何自增键时往表里插入数据时，返回结果错误", function(done) {
            var test = Model3.build({ key1: 1, key2: 2, key3: 3, key4: 4, key5: 5 });
            test.save(function(err) {
                should.ifError(err);

                var test2 = Model3.build({ key1: 2, key2: 3, key3: 4, key4: 5, key5: 6 });
                test2.save(function(err, t) {
                    should.ifError(err);
                    should(t).not.be.empty();
                    t.key1.should.be.eql(2);
                    t.key5.should.be.eql(6);
                    done();
                });
            });
        });
    });
});
