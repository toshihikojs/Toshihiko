/**
 * XadillaX created at 2015-09-06 13:56:52 With ♥
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved.
 */
require("should");
var T = require("../");
var toshihiko = new T.Toshihiko("test", "root", "", {});

var Model = null;
describe("query object", function () {
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
            { name: "key4", type: T.Type.String, defaultValue:"Ha!", allowNull: true }
        ]);

        done();
    });

    describe("generate sql", function() {
        it("should generate a query that support NULL", function() {
            var sql = Model.where({
                key1: {
                    $or: {
                        $eq: null,
                        $neq: null
                    }
                },
                key2: null,
                key4: {
                    $neq: null
                }
            }).makeSQL("find");

            var answer = "SELECT `id`, `key2`, `key3`, `key4` FROM `test` WHERE (((`id` IS NULL OR `id` IS NOT NULL)) AND `key2` IS NULL AND (`key4` IS NOT NULL))";
            answer.should.be.eql(sql);
        });

        it("should generate a query include IN and LIKE", function() {
            var sql = Model.where({
                key4: {
                    $or: {
                        $in: [ "1", "2", "3" ],
                        $like: "%132%"
                    }
                },
                key1: { $in: [ 1, 2, 3 ] }
            }).makeSQL("find");

            var answer = "SELECT `id`, `key2`, `key3`, `key4` FROM `test` WHERE (((`key4` IN (\"1\", \"2\", \"3\") OR `key4` LIKE \"%132%\")) AND (`id` IN (1, 2, 3)))";

            answer.should.be.eql(sql);
        });

        it("should generate a query from the order of the array", function() {
            var sql = Model.where([
                { key2: { $gt: 0.1 } },
                { key4: "Ha!" },
                { key3: {} },
                { key1: 666 }
            ]).makeSQL("find");

            var answer = "SELECT `id`, `key2`, `key3`, `key4` FROM `test` WHERE (((`key2` > 0.1)) AND (`key4` = \"Ha!\") AND (`key3` = \"{}\") AND (`id` = 666))";

            answer.should.be.eql(sql);
        });

        it("should generate a query the mixed type condition", function() {
            var sql = Model.where({
                key2: { $gt: 0.1 },
                key4: "Ha!",
                $or: [
                    { key3: {} },
                    { key1: 666 }
                ]
            }).makeSQL("find");

            var answer = "SELECT `id`, `key2`, `key3`, `key4` FROM `test` WHERE ((`key2` > 0.1) AND `key4` = \"Ha!\" AND ((`key3` = \"{}\") OR (`id` = 666)))";

            answer.should.be.eql(sql);
        });
    });

    it("should generate a query without error (feime posts)", function() {
        var Model = toshihiko.define("posts", [
            { name: "postId", type: T.Type.Integer, primaryKey: true },
            { name: "userId", type: T.Type.Integer },
            { name: "sex", type: T.Type.String, defaultValue: "female" },
            { name: "area", type: T.Type.String },
            { name: "smallIndustry", type: T.Type.String },
            { name: "bigIndustry", type: T.Type.String },
            { name: "content", type: T.Type.String },
            { name: "imageId", type: T.Type.Integer, allowNull: true },
            { name: "status", type: T.Type.Integer },
            { name: "postedAt", type: T.Type.Integer },
            { name: "endedAt", type: T.Type.Integer },
            { name: "extra", type: T.Type.Json },
            { name: "ups", type: T.Type.Integer },
            { name: "downs", type: T.Type.Integer },
            { name: "top", type: T.Type.Integer, defaultValue: 0 },
            { name: "replies", type: T.Type.Integer, defaultValue: 0 }
        ]);

        var condition = { "$or": [
            { status: 32, bigIndustry: "", smallIndustry: "" },
            { status: 32, bigIndustry: "民航特业", smallIndustry: "" },
            { status: {
                $neq: [ 2, 4 ]
            }, bigIndustry: "民航特业", smallIndustry: "空管" }
        ]};

        var sql = Model.where(condition).makeSQL("find");
        var answer = "SELECT `postId`, `userId`, `sex`, `area`, `smallIndustry`, `bigIndustry`, `content`, `imageId`, " +
            "`status`, `postedAt`, `endedAt`, `extra`, `ups`, `downs`, `top`, `replies` FROM `posts` WHERE (((" +
            "`status` = 32 AND `bigIndustry` = \"\" AND `smallIndustry` = \"\") OR (`status` = 32 AND `bigIndustry` = " +
            "\"民航特业\" AND `smallIndustry` = \"\") OR ((`status` != 2 AND `status` != 4) AND `bigIndustry` = " +
            "\"民航特业\" AND `smallIndustry` = \"空管\")))";

        answer.should.be.eql(sql);
    });
});
