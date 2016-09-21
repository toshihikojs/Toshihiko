/**
 * XadillaX created at 2016-08-08 17:46:49 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const path = require("path");

const cu = require("config.util");
const decache = require("decache");
const Mock = require("mockjs");
const moment = require("moment");
const otrans = require("otrans");
const runSync = require("sync-runner");
const should = require("should");

const Adapter = require("../../lib/adapters/base");
const common = require("../util/common");
const hack = require("../util/hack");
const MySQLAdapter = require("../../lib/adapters/mysql");
const Query = require("../../lib/query");
const Toshihiko = require("../../lib/toshihiko");

describe("🐣 adapters/mysql", function() {
    const correctOptions = {
        username: "root",
        password: "",
        database: "__toshihiko__",
        charset: "utf8mb4_general_ci"
    };

    before(function(done) {
        const adapter = new MySQLAdapter({}, cu.extendDeep({}, correctOptions, {
            database: "mysql"
        }));
        adapter.execute("CREATE DATABASE IF NOT EXISTS `__toshihiko__`;", function(err) {
            should.ifError(err);

            adapter.mysql.end(function() {
                const adapter = new MySQLAdapter({}, correctOptions);
                adapter.execute(common.COMMON_SCHEMA_SQL, function(err) {
                    should.ifError(err);
                    adapter.mysql.end(done);
                });
            });
        });
    });

    after(function(done) {
        // const adapter = new MySQLAdapter({}, correctOptions);
        // adapter.execute("DROP DATABASE IF EXISTS `__toshihiko__`;", function(err) {
        //     should.ifError(err);
        //     adapter.mysql.end(done);
        // });
        done();
    });

    describe("create", function() {
        it("should be instanceof Adapter", function(done) {
            const par = {};
            const options = {};
            const adapter = new MySQLAdapter(par, options);

            adapter.should.be.instanceof(Adapter);
            adapter.mysql.end(done);
        });

        it("should have correct position of username, database, password", function(done) {
            const par = {};
            const options = {
                username: "username",
                password: "pwd",
                database: "test",

                host: "127.0.0.1"
            };
            const adapter = new MySQLAdapter(par, options);

            adapter.username.should.equal(options.username);
            adapter.database.should.equal(options.database);
            adapter.options.host.should.equal(options.host);
            adapter.options.port.should.equal(3306);
            adapter.mysql.config.connectionConfig.password.should.equal(options.password);

            should.not.exists(adapter.options.username);
            should.not.exists(adapter.options.password);
            should.not.exists(adapter.options.database);

            adapter.mysql.end(done);
        });

        it("should hijack parent's pool to be compatible", function(done) {
            const par = {};
            const adapter = new MySQLAdapter(par);
            par.pool.should.equal(adapter.mysql);
            par.pool.end(done);
        });

        describe("should use mysql2", function() {
            it("when default", function(done) {
                const Pool = require("mysql2/lib/pool");
                const adapter = new MySQLAdapter({}, {});

                adapter.mysql.should.be.instanceof(Pool);
                adapter.mysql.end(done);
            });

            it("when use config", function(done) {
                const Pool = require("mysql2/lib/pool");
                const options = { package: "mysql2" };
                const adapter = new MySQLAdapter({}, options);

                adapter.mysql.should.be.instanceof(Pool);
                adapter.mysql.end(done);
            });
        });

        describe("should use mysql", function() {
            it("when default with no mysql2", function(done) {
                decache("mysql2");
                decache("../../lib/adapters/mysql");
                const MySQLAdapter_ = require("../../lib/adapters/mysql");
                runSync("mv node_modules/mysql2 node_modules/mysql2.bak", path.resolve(__dirname, "../../"));

                const adapter = new MySQLAdapter_({}, {});
                runSync("mv node_modules/mysql2.bak node_modules/mysql2", path.resolve(__dirname, "../../"));

                const Pool = require("mysql/lib/Pool");
                adapter.mysql.should.be.instanceof(Pool);
                adapter.mysql.end(done);
            });

            it("when use config", function(done) {
                const Pool = require("mysql/lib/Pool");
                const options = { package: "mysql" };
                const adapter = new MySQLAdapter({}, options);

                adapter.mysql.should.be.instanceof(Pool);
                adapter.mysql.end(done);
            });
        });
    });

    [ "mysql", "mysql2" ].forEach(name => {
        describe(name, function() {
            before(function(done) {
                const options = cu.extendDeep({}, correctOptions);
                options.package = name;
                const adapter = new MySQLAdapter({}, options);
                adapter.execute("DROP TABLE IF EXISTS `test1`;", function(err) {
                    should.ifError(err);
                    adapter.execute("DROP TABLE IF EXISTS `test2`;", function(err) {
                        should.ifError(err);
                        adapter.execute(common.COMMON_SCHEMA_SQL, function(err) {
                            should.ifError(err);
                            adapter.execute(common.NO_AI_SCHEMA_SQL, function(err) {
                                should.ifError(err);
                                adapter.mysql.end(done);
                            });
                        });
                    });
                });
            });

            describe(`${name} execute`, function() {
                const adapter = new MySQLAdapter({}, correctOptions);

                after(function() {
                    adapter.mysql.end();
                });

                it("should execute `create table`", function(done) {
                    adapter.execute("create table ??(id int(?) not null)", [ "test", 11 ], function(err, rows) {
                        should.ifError(err);
                        rows.serverStatus.should.equal(2);
                        done();
                    });
                });

                it("should execute `show tables`", function(done) {
                    adapter.execute("show tables;", function(err, rows) {
                        should.ifError(err);
                        otrans.toCamel(rows).should.deepEqual([
                            { tablesInToshihiko: "test" },
                            { tablesInToshihiko: "test1" },
                            { tablesInToshihiko: "test2" }
                        ]);
                        done();
                    });
                });

                it("should execute `drop table`", function(done) {
                    adapter.execute("drop table test", [], function(err, rows) {
                        should.ifError(err);
                        rows.serverStatus.should.equal(2);
                        done();
                    });
                });
            });

            describe(`${name} insert`, function() {
                describe("common schema", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test1", common.COMMON_SCHEMA);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, { key1: 1 });
                        adapter.insert(model, {
                            key2: 0.5,
                            key3: { foo: "bar" },
                            key4: null,
                            key5: now,
                            key6: { dec: 168 },
                            $123: 1,
                            ok: function() {}
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 1,
                                key2: 0.5,
                                key3: { foo: "bar" },
                                key4: null,
                                key5: now,
                                key6: { dec: 168 }
                            });
                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });

                describe("ai is not pk", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test1", common.COMMON_SCHEMA_AI_IS_NOT_PRIMARY);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, { key4: "dummy primary" });
                        adapter.insert(model, {
                            key2: 0.5,
                            key3: { foo: "bar" },
                            key4: "dummy primary",
                            key5: now,
                            key6: { dec: 610074841 }
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 2,
                                key2: 0.5,
                                key3: { foo: "bar" },
                                key4: "dummy primary",
                                key5: now,
                                key6: { dec: 610074841 }
                            });

                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });

                describe("multi-primary-keys", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test1", common.COMMON_SCHEMA_MULTI_PRIMARY);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, { key1: 3, key4: "dummy multi primary" });
                        adapter.insert(model, {
                            key2: 0.5,
                            key3: { foo: "bar" },
                            key4: "dummy multi primary",
                            key5: now,
                            key6: { dec: 8644325 }
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 3,
                                key2: 0.5,
                                key3: { foo: "bar" },
                                key4: "dummy multi primary",
                                key5: now,
                                key6: { dec: 8644325 }
                            });

                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });

                describe("no primary key", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test1", common.COMMON_SCHEMA_NO_PRIMARY);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, {
                            key1: 4,
                            key2: 0.5,
                            key3: { foo: "bar" },
                            key4: "dummy no primary",
                            key5: now,
                            key6: { dec: 8644325 }
                        });
                        adapter.insert(model, {
                            key2: 0.5,
                            key3: { foo: "bar" },
                            key4: "dummy no primary",
                            key5: now,
                            key6: { dec: 8644325 }
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 4,
                                key2: 0.5,
                                key3: { foo: "bar" },
                                key4: "dummy no primary",
                                key5: now,
                                key6: { dec: 8644325 }
                            });

                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });

                describe("no ai key", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test2", common.NO_AI_SCHEMA);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, { key1: 1 });
                        adapter.insert(model, {
                            key1: 1,
                            key2: 0.5,
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 1,
                                key2: 0.5
                            });

                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });

                describe("no ai key with no primary key", function() {
                    const toshihiko = new Toshihiko("mysql", correctOptions);
                    const adapter = toshihiko.adapter;
                    const model = toshihiko.define("test2", common.NO_AI_SCHEMA_WITH_NO_PRIMARY);

                    after(function() {
                        adapter.mysql.end();
                    });

                    it("should insert 1", function(done) {
                        const now = new Date();
                        now.setMilliseconds(0);

                        const hacked = hack.whereOnce(model, { key1: 2, key2: 1 });
                        adapter.insert(model, {
                            key1: 2,
                            key2: 1,
                        }, function(err, _row) {
                            should.ifError(err);
                            const row = cu.extendDeep({}, _row);
                            row.should.match({
                                key1: 2,
                                key2: 1
                            });

                            hacked.called.should.equal(1);
                            done();
                        });
                    });
                });
            });

            describe(`${name} makeSql`, function() {
                const toshihiko = new Toshihiko("mysql", correctOptions);
                const adapter = toshihiko.adapter;
                const model = toshihiko.define("test", common.COMMON_SCHEMA); 

                after(function() {
                    adapter.mysql.end();
                });

                describe("should generate find sql", function() {
                    const _options = { foo: "bar", baz: "bbb" };
                    const _options1 = { foo: "bar", baz: "bbb" };

                    let called = 0;
                    adapter.makeFind = function(_model, options) {
                        _model.should.equal(model);
                        options.should.equal(_options);
                        options.should.deepEqual(_options1);
                        called++;
                        return "OK!";
                    };

                    it("should call makeFind", function() {
                        let sql;

                        sql = adapter.makeSql("find", model, _options);
                        sql.should.equal("OK!");
                        called.should.equal(1);

                        sql = adapter.makeSql("blahblah", model, _options);
                        sql.should.equal("OK!");
                        called.should.equal(2);
                    });
                });
            });

            describe(`${name} makeFieldWhere`, function() {
                const toshihiko = new Toshihiko("mysql", correctOptions);
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
                const toshihiko = new Toshihiko("mysql", correctOptions);
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
            });

            describe(`${name} makeArrayWhere`, function() {
                const toshihiko = new Toshihiko("mysql", correctOptions);
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
                const toshihiko = new Toshihiko("mysql", correctOptions);
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
                const toshihiko = new Toshihiko("mysql", correctOptions);
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

            describe(`${name} makeFind`, function() {
                const toshihiko = new Toshihiko("mysql", correctOptions);
                const adapter = toshihiko.adapter;
                const model = toshihiko.define("test", common.COMMON_SCHEMA);

                const $where = adapter.makeWhere;
                const $order = adapter.makeOrder;
                const $limit = adapter.makeLimit;

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

                    sql = adapter.makeFind(model, {
                        where: where1,
                        order: order1,
                        limit: limit1
                    });
                    sql.should.equal(`SELECT * FROM \`test\` WHERE ${JSON.stringify(
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

            describe(`${name} findWithNoCache`, function() {
                const toshihiko = new Toshihiko("mysql", correctOptions);
                const adapter = toshihiko.adapter;
                const model = toshihiko.define("test1", common.COMMON_SCHEMA);

                after(function() {
                    adapter.mysql.end();
                });

                it("normal 1", function(done) {
                    const query = new Query(model).fields("key1,key2,key3").order("key1 asc").limit(100);

                    adapter.findWithNoCache(query.model, function(err, rows, extra) {
                        should.ifError(err);
                        extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `id` ASC LIMIT 100");
                        rows.should.match([
                            { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 3, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 4, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                        ]);
                        done();
                    }, adapter.queryToOptions(query, {}));
                });

                it("normal 2", function(done) {
                    const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(100);

                    adapter.findWithNoCache(query.model, function(err, rows, extra) {
                        should.ifError(err);
                        extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` ASC LIMIT 100");
                        rows.should.match([
                            { id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 3, key2: 0.5, key3: "{\"foo\":\"bar\"}" },
                            { id: 4, key2: 0.5, key3: "{\"foo\":\"bar\"}" }
                        ]);
                        done();
                    }, adapter.queryToOptions(query, {}));
                });

                describe("single", function() {
                    it("no limit", function(done) {
                        const query = new Query(model).fields("key1,key2,key3").order("key2 asc");

                        adapter.findWithNoCache(query.model, function(err, rows, extra) {
                            should.ifError(err);
                            extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                                "ASC LIMIT 0, 1");
                            rows.should.match({ id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                            done();
                        }, adapter.queryToOptions(query, { single: true }));
                    });

                    it("limit 10", function(done) {
                        const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(10);

                        adapter.findWithNoCache(query.model, function(err, rows, extra) {
                            should.ifError(err);
                            extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                                "ASC LIMIT 1");
                            rows.should.match({ id: 1, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                            done();
                        }, adapter.queryToOptions(query, { single: true }));
                    });

                    it("limit 1, 100", function(done) {
                        const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(1, 100);

                        adapter.findWithNoCache(query.model, function(err, rows, extra) {
                            should.ifError(err);
                            extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                                "ASC LIMIT 1, 1");
                            rows.should.match({ id: 2, key2: 0.5, key3: "{\"foo\":\"bar\"}" });
                            done();
                        }, adapter.queryToOptions(query, { single: true }));
                    });

                    it("limit 100, 100", function(done) {
                        const query = new Query(model).fields("key1,key2,key3").order("key2 asc").limit(100, 100);

                        adapter.findWithNoCache(query.model, function(err, rows, extra) {
                            should.ifError(err);
                            extra.should.equal("SELECT `id`, `key2`, `key3` FROM `test1` ORDER BY `key2` " +
                                "ASC LIMIT 100, 1");
                            should(rows).equal(null);
                            done();
                        }, adapter.queryToOptions(query, { single: true }));
                    });
                });
            });
        });
    });
});
