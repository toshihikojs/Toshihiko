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
            { name: "key4", type: T.Type.String, defaultValue:"Ha!"}
        ]);

        done();
    });

    describe("generate sql", function() {
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
});
