/**
 * XadillaX created at 2015-09-06 13:56:52 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
var should = require("should");

var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/field_type");

var toshihiko = new Toshihiko("test", "root", "");

describe("toshihiko", function() {
    before(function(done) {
        var toshihiko = new Toshihiko("", "root", "");
        toshihiko.execute("CREATE DATABASE IF NOT EXISTS `test` DEFAULT CHARSET utf8 COLLATE utf8_general_ci;", done);
    });

    after(function(done) {
        toshihiko.execute("DROP DATABASE `test`;", done);
    });

    describe("#execute", function() {
        it("crete table", function(done) {
            var sql = "CREATE TABLE IF NOT EXISTS `test_ddl` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `ls` int(11) NOT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
            toshihiko.execute(sql, function(err) {
                should(err).equal(null);
                done();
            });
        });
        it("insert", function(done) {
            var sql = "insert into test_ddl values(0,1)";
            toshihiko.execute(sql, function(err) {
                should(err).equal(null);
                done();
            });
        });
        it("select rows", function(done) {
            var sql = "select * from test_ddl";
            toshihiko.execute(sql, function(err, data) {
                should(err).equal(null);
                data.should.be.an.instanceOf(Array);
                data.should.have.length(1);
                data.should.eql([{
                    id: 1,
                    ls: 1
                }]);
                done();
            });
        });
        it("delete table", function(done) {
            var sql = "drop table test_ddl";
            toshihiko.execute(sql, function(err) {
                should(err).equal(null);
                done();
            });
        });
    });
    describe("#definde", function() {
        it("should return model object", function() {
            var test = toshihiko.define("test", [
                {
                    name: "key1",
                    column: "key_one",
                    primaryKey: true,
                    type: Type.Integer
                },
                {
                    name: "key2",
                    type: Type.String,
                    defaultValue: "Ha~"
                },
                {
                    name: "key3",
                    type: Type.Json,
                    defaultValue: []
                },
                {
                    name: "key4",
                    validators: [
                        function(v) {
                            if (v > 100) return "`key4` can't be greater than 100";
                        }
                    ]
                }
            ]);
            return test.should.be.ok;
        });

    });
});

