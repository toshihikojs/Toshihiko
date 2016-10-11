/**
 * XadillaX created at 2016-10-01 11:42:41 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const moment = require("moment");
const Mock = require("mockjs");

const common = require("../util/common");
const Toshihiko = require("../../lib/toshihiko");

module.exports = function(name, options) {
    describe(`${name} makeSql`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA); 

        after(function() {
            adapter.mysql.end();
        });

        describe("makeSql", function() {
            it("should call makeFind", function() {
                const _options = { foo: "bar", baz: "bbb" };
                const _options1 = { foo: "bar", baz: "bbb" };
                const _options2 = { foo: "bar", baz: "bbb", count: true };

                let called = 0;
                adapter.makeFind = function(_model, options) {
                    _model.should.equal(model);
                    options.should.equal(_options);
                    options.should.deepEqual(called > 1 ? _options2 : _options1);
                    called++;
                    return "OK!";
                };

                let sql;
                sql = adapter.makeSql("find", model, _options);
                sql.should.equal("OK!");
                called.should.equal(1);

                sql = adapter.makeSql("blahblah", model, _options);
                sql.should.equal("OK!");
                called.should.equal(2);

                sql = adapter.makeSql("count", model, _options);
                sql.should.equal("OK!");
                called.should.equal(3);
            });

            it("should call makeUpdate", function() {
                const _options = { foo: "bar", baz: "bbb" };
                const _options1 = { foo: "bar", baz: "bbb" };

                let called = 0;
                adapter.makeUpdate = function(_model, options) {
                    _model.should.equal(model);
                    options.should.equal(_options);
                    options.should.deepEqual(_options1);
                    called++;
                    return "UPDATE!";
                };

                let sql;
                sql = adapter.makeSql("update", model, _options);
                sql.should.equal("UPDATE!");
                called.should.equal(1);
            });

            it("should call makeDelete", function() {
                const _options = { foo: "bar", baz: "bbb" };
                const _options1 = { foo: "bar", baz: "bbb" };

                let called = 0;
                adapter.makeDelete = function(_model, options) {
                    _model.should.equal(model);
                    options.should.equal(_options);
                    options.should.deepEqual(_options1);
                    called++;
                    return "DELETE!";
                };

                let sql;
                sql = adapter.makeSql("delete", model, _options);
                sql.should.equal("DELETE!");
                called.should.equal(1);
            });
        });
    });

    describe(`${name} makeFieldWhere`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeFieldWhere(model, "key1", {
                $neq: 1
            }, "and");
            sql.should.equal("`id` != 1");

            sql = adapter.makeFieldWhere(model, "key2", {
                $eq: 1.2
            }, "and");
            sql.should.equal("`key2` = 1.2");

            sql = adapter.makeFieldWhere(model, "key2", {
                $in: [ 1.2, 1.3 ]
            }, "and");
            sql.should.equal("`key2` IN (1.2, 1.3)");

            sql = adapter.makeFieldWhere(model, "key2", {
                $neq: [ 1.2, 1.3 ]
            }, "and");
            sql.should.equal("(`key2` != 1.2 AND `key2` != 1.3)");

            sql = adapter.makeFieldWhere(model, "key2", {
                $or: { $gt: 10, $lt: 3, $in: [ 4, 5 ], $neq: [ 6, 8 ] }
            }, "and");
            sql.should.equal("(`key2` > 10 OR `key2` < 3 OR `key2` IN (4, 5) OR (`key2` != 6 AND `key2` != 8))");

            sql = adapter.makeFieldWhere(model, "key2", {
                $or: { $gt: 10, $lt: 3 },
                $neq: [ 1, 11, null ]
            }, "and");
            sql.should.equal("((`key2` > 10 OR `key2` < 3) AND (`key2` != 1 AND `key2` != 11 AND " +
                "`key2` IS NOT NULL))");

            sql = adapter.makeFieldWhere(model, "key2", {
                $or: { $gt: 10, $lt: 3, $eq: { $or: [ 4, 5, 6, null ], $and: [ 1, 2 ] } },
                $neq: [ 1, 11 ]
            }, "and");
            sql.should.equal("((`key2` > 10 OR `key2` < 3 OR ((`key2` = 1 AND `key2` = 2) AND (`key2` = 4 " +
                "OR `key2` = 5 OR `key2` = 6 OR `key2` IS NULL))) AND (`key2` != 1 AND `key2` != 11))");

            sql = adapter.makeFieldWhere(model, "key3", {
                $neq: [ { foo: "bar" }, { foo: "baz" }, [ { foo: "bar" } ] ]
            }, "and");
            sql.should.equal("(`key3` != (\"{\\\"foo\\\":\\\"bar\\\"}\") AND `key3` != " +
                "(\"{\\\"foo\\\":\\\"baz\\\"}\") AND `key3` != (\"[{\\\"foo\\\":\\\"bar\\\"}]\"))");

            sql = adapter.makeFieldWhere(model, "key3", {
                foo: "bar"
            }, "and");
            sql.should.equal("`key3` = \"{\\\"foo\\\":\\\"bar\\\"}\"");

            const date = new Date(0);
            const dateStr = moment(0).format("YYYY-MM-DD HH:mm:ss");
            sql = adapter.makeFieldWhere(model, "key5", date, "and");
            sql.should.equal("`key5` = \"" + dateStr + "\"");
        });

        it("should generate - 2", function() {
            let sql;

            sql = adapter.makeFieldWhere(model, "key1", {
                $gt: 1,
                $lt: -5,
                $eq: null
            }, "or");
            sql.should.equal("(`id` > 1 OR `id` < -5 OR `id` IS NULL)");

            sql = adapter.makeFieldWhere(model, "key1", 1, "and");
            sql.should.equal("`id` = 1");

            sql = adapter.makeFieldWhere(model, "key3", 1, "and");
            sql.should.equal("`key3` = \"1\"");

            sql = adapter.makeFieldWhere(model, "key3", null, "and");
            sql.should.equal("`key3` IS NULL");

            sql = adapter.makeFieldWhere(model, "key4", {
                $in: [ 1, 2, "bar" ]
            }, "and");
            sql.should.equal("`key4` IN (\"1\", \"2\", \"bar\")");

            sql = adapter.makeFieldWhere(model, "key6", { dec: 100 }, "and");
            sql.should.equal("`key6` = BIN(100)");
        });

        it("should generate - 3", function() {
            try {
                adapter.makeFieldWhere(model, "fsdaklj", 1, "or");
            } catch(e) {
                e.should.be.instanceof(Error);
                e.message.indexOf("no field named").should.above(-1);
            }
        });
    });

    describe(`${name} makeWhere`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeWhere(model, { key1: "1", key2: "2" });
            sql.should.equal("(`id` = 1 AND `key2` = 2)");

            sql = adapter.makeWhere(model, { key1: "1", key2: "2" }, "OR");
            sql.should.equal("(`id` = 1 OR `key2` = 2)");

            sql = adapter.makeWhere(model, { key1: "1", key2: "2", $or: {
                key3: 1,
                key4: "2"
            } }, "AND");
            sql.should.equal("(`id` = 1 AND `key2` = 2 AND (`key3` = \"1\" OR `key4` = \"2\"))");

            sql = adapter.makeWhere(model, { key1: "1", key2: "2", $or: [
                { key3: 1, key4: "2" },
                { $or: { key3: 2, key4: "3" } },
                { $and: { key3: 3, key4: "4" } }
            ], $and: [
                { $or: { key3: 1, key4: 2 } },
                { key1: 1 }
            ] }, "AND");
            sql.should.equal("(`id` = 1 AND `key2` = 2 AND ((`key3` = \"1\" AND `key4` = \"2\") OR ((`key3` = " +
                "\"2\" OR `key4` = \"3\")) OR ((`key3` = \"3\" AND `key4` = \"4\"))) AND " +
                "(((`key3` = \"1\" OR `key4` = \"2\")) AND (`id` = 1)))");
        });

        it("should generate - 2", function() {
            let sql;

            sql = adapter.makeWhere(model, [
                { key3: 1, key4: "2" },
                { $or: { key3: 2, key4: "3" } },
                { $and: { key3: 3, key4: "4" } }
            ], "AND");
            sql.should.equal("((`key3` = \"1\" AND `key4` = \"2\") AND ((`key3` = \"2\" OR `key4` = \"3\")) " +
                "AND ((`key3` = \"3\" AND `key4` = \"4\")))");
        });

        it("should generate - 3", function() {
            let sql;
            sql = adapter.makeWhere(model, {});
            sql.should.equal("()");

            try {
                sql = adapter.makeWhere(model, { key100: 100 });
            } catch(e) {
                return e.message.indexOf("key100").should.above(-1);
            }

            (1).should.equal(0);
        });
    });

    describe(`${name} makeArrayWhere`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeArrayWhere(model, [
                { key3: 1, key4: "2" },
                { $or: { key3: 2, key4: "3" } },
                { $and: { key3: 3, key4: "4" } }
            ], "AND");
            sql.should.equal("((`key3` = \"1\" AND `key4` = \"2\") AND ((`key3` = \"2\" OR `key4` = \"3\")) " +
                "AND ((`key3` = \"3\" AND `key4` = \"4\")))");

            sql = adapter.makeArrayWhere(model, [
                { key3: 1, key4: "2" },
                { $or: { key3: 2, key4: "3" } },
                { $and: { key3: 3, key4: "4" } }
            ], "OR");
            sql.should.equal("((`key3` = \"1\" AND `key4` = \"2\") OR ((`key3` = \"2\" OR `key4` = \"3\")) " +
                "OR ((`key3` = \"3\" AND `key4` = \"4\")))"); 
        });

        it("should generate - 2", function() {
            try {
                adapter.makeArrayWhere(model, {}, "AND");
            } catch(e) {
                e.message.should.equal("Non-array condition.");
                return;
            }

            (1).should.equal(2);
        });
    });

    describe(`${name} makeOrder`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeOrder(model, [ { key1: -1 } ]);
            sql.should.equal("`id` DESC");

            sql = adapter.makeOrder(model, []);
            sql.should.equal("");

            sql = adapter.makeOrder(model, [{
                key1: -1
            }, {
                key2: 1
            }, {
                key3: 2
            }, {
                key4: -1
            }, {
                key5: "123"
            }]);
            sql.should.equal("`id` DESC, `key2` ASC, `key3` ASC, `key4` DESC, `key5` ASC");
        });

        it("should generate - 2", function() {
            let sql;

            sql = adapter.makeOrder(model, [ {} ]);
            sql.should.equal("");

            try {
                sql = adapter.makeOrder(model, [ { id: -1 } ]);
            } catch(e) {
                e.message.indexOf("no field").should.above(-1);
            }
        });
    });

    describe(`${name} makeLimit`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeLimit(model, [ 12489, 4783 ]);
            sql.should.equal("12489, 4783");

            sql = adapter.makeLimit(model, [ 389 ]);
            sql.should.equal("389");

            sql = adapter.makeLimit(model, [ "4389", "98347" ]);
            sql.should.equal("4389, 98347");

            sql = adapter.makeLimit(model, [ "dsklj", "dsa" ]);
            sql.should.equal("0, 0");
        });
    });

    describe(`${name} makeIndex`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        after(function() {
            adapter.mysql.end();
        });

        it("should generate - 1", function() {
            let sql;

            sql = adapter.makeIndex(model, "idx");
            sql.should.equal("FORCE INDEX(`idx`)");

            sql = adapter.makeIndex(model);
            sql.should.equal("");
        });
    });

    describe(`${name} makeFind`, function() {
        const toshihiko = new Toshihiko("mysql", options);
        const adapter = toshihiko.adapter;
        const model = toshihiko.define("test", common.COMMON_SCHEMA);

        const $where = adapter.makeWhere;
        const $order = adapter.makeOrder;
        const $limit = adapter.makeLimit;
        const $index = adapter.makeIndex;

        before(function() {
            adapter.makeWhere = function() {
                arguments[0].should.equal(model);
                return JSON.stringify(arguments[1]);
            };

            adapter.makeOrder = function() {
                arguments[0].should.equal(model);
                return JSON.stringify(arguments[1]);
            };

            adapter.makeLimit = function() {
                arguments[0].should.equal(model);
                return JSON.stringify(arguments[1]);
            };

            adapter.makeIndex = function() {
                arguments[0].should.equal(model);
                return $index.apply(adapter, arguments);
            };
        });

        after(function() {
            adapter.makeWhere = $where;
            adapter.makeOrder = $order;
            adapter.makeLimit = $limit;

            adapter.mysql.end();
        });

        it("no options", function() {
            let sql;

            sql = adapter.makeFind(model);
            sql.should.equal("SELECT * FROM `test`");

            sql = adapter.makeFind(model, {});
            sql.should.equal("SELECT * FROM `test`");
        });

        it("call other functions", function() {
            let sql;
            const whereSchema = { "list|1-10": [{ "id|+1": 1 }] };

            const where1 = Mock.mock(whereSchema);
            sql = adapter.makeFind(model, { where: where1 });
            sql.should.equal(`SELECT * FROM \`test\` WHERE ${JSON.stringify(where1)}`);

            const order1 = [ Mock.mock(whereSchema) ];
            sql = adapter.makeFind(model, { order: order1 });
            sql.should.equal(`SELECT * FROM \`test\` ORDER BY ${JSON.stringify(order1)}`);

            const limit1 = [ Mock.mock(whereSchema) ];
            sql = adapter.makeFind(model, { limit: limit1 });
            sql.should.equal(`SELECT * FROM \`test\` LIMIT ${JSON.stringify(limit1)}`);

            const index1 = "idx";
            sql = adapter.makeFind(model, { index: index1 });
            sql.should.equal(`SELECT * FROM \`test\` FORCE INDEX(\`idx\`)`);

            sql = adapter.makeFind(model, {
                where: where1,
                order: order1,
                limit: limit1,
                index: index1
            });
            sql.should.equal(`SELECT * FROM \`test\` FORCE INDEX(\`idx\`) WHERE ${JSON.stringify(
                where1)} ORDER BY ${JSON.stringify(order1)} LIMIT ${JSON.stringify(limit1)}`);
        });

        it("use field", function() {
            let sql;
            sql = adapter.makeFind(model, { fields: model.schema.map(field => field.name) });
            sql.should.equal("SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test`");
        });

        it("should count", function() {
            let sql;
            sql = adapter.makeFind(model, { count: true, fields: model.schema.map(field => field.name) });
            sql.should.equal("SELECT COUNT(0) FROM `test`");
        });
    });
};
