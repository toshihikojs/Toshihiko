/**
 * XadillaX created at 2016-08-08 17:46:49 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const path = require("path");

const async = require("async");
const chalk = require("chalk");
const decache = require("decache");
const otrans = require("otrans");
const runSync = require("sync-runner");
const should = require("should");

const Adapter = require("../../lib/adapters/base");
const common = require("../util/common");
const MySQLAdapter = require("../../lib/adapters/mysql");

describe("🐣 adapters/mysql", function() {
    const _write = process.stdout.write;
    let _last;
    process.stdout.write = function() {
        _last = arguments[0];
        _write.apply(process.stdout, arguments);
    };

    const correctOptions = {
        username: "root",
        password: "",
        database: "__toshihiko__",
        charset: "utf8mb4_general_ci",
        showSql: function(sql) {
            const temp = _last
                .replace("\u001b[32m", "")
                .replace("\u001b[0m", "")
                .replace("\u001b[90m", "");
            let i = 0;
            sql = chalk.gray(`>> sql: ${sql}`);
            while(temp[i] === " ") {
                sql = ` ${sql}`;
                i++;
            }

            if(temp[i] !== ">") {
                sql = `  ${sql}`;
            }

            console.log(sql);
        }
    };

    before(function(done) {
        const adapter = new MySQLAdapter({}, Object.assign({}, correctOptions, {
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

        it("with frozen options", function(done) {
            const options = {};
            Object.defineProperties(options, {
                package: { value: "mysql", enumerable: true },
                username: { value: "username", enumerable: true },
                password: { value: "password", enumerable: true },
                foo: { value: "b", enumerable: true }
            });
            const adapter = new MySQLAdapter({}, options);

            adapter.options.should.deepEqual({
                host: "localhost",
                port: 3306,
                package: "mysql",
                foo: "b"
            });
            options.should.deepEqual({ package: "mysql", username: "username", password: "password", foo: "b" });
            adapter.mysql.end(done);
        });
    });

    [ "mysql", "mysql2" ].forEach(name => {
        describe(name, function() {
            before(function(done) {
                const options = require("../../util/common").extend({}, correctOptions);
                options.package = name;
                const adapter = new MySQLAdapter({}, options);

                const Pool = require(name === "mysql" ? "mysql/lib/Pool" : "mysql2/lib/pool");
                adapter.mysql.should.be.instanceof(Pool);

                adapter.execute("DROP TABLE IF EXISTS `test1`, `test2`;", function(err) {
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

                it("should execute via a certain conn", function(done) {
                    adapter.execute({
                        query: function() {
                            return arguments[arguments.length - 1](undefined, "hello");
                        }
                    }, "drop table", function(err, ret) {
                        should.ifError(err);
                        ret.should.equal("hello");
                        done();
                    });
                });
            });

            describe(`${name} transaction`, function() {
                const adapter = new MySQLAdapter({}, correctOptions);
                let conn;

                before(function(done) {
                    adapter.execute("create table test(id int(11) not null)", function(err) {
                        should.ifError(err);
                        done();
                    });
                });

                after(function(done) {
                    adapter.execute("drop table test", function(err) {
                        should.ifError(err);
                        adapter.mysql.end();
                        done();
                    });
                });

                it("should beginTransaction", function(done) {
                    adapter.beginTransaction(function(err, _conn) {
                        should.ifError(err);
                        _conn.constructor.name.should.equal("PoolConnection");
                        conn = _conn;
                        done();
                    });
                });

                it("should not insert things", function(done) {
                    async.eachLimit([ 1, 2, 3, 4, 5 ], 5, function(num, callback) {
                        adapter.execute(conn, "INSERT INTO test(id) VALUES(?)", num, function(err) {
                            should.ifError(err);
                            callback();
                        });
                    }, function() {
                        adapter.execute("SELECT COUNT(0) FROM test", function(err, ret) {
                            ret[0]["COUNT(0)"].should.be.equal(0);
                            done();
                        });
                    });
                });

                it("should commit", function(done) {
                    adapter.commit(conn, function(err) {
                        should.ifError(err);
                        adapter.execute("SELECT COUNT(0) FROM test", function(err, ret) {
                            ret[0]["COUNT(0)"].should.be.equal(5);
                            done();
                        });
                    });
                });

                it("should rollback", function(done) {
                    adapter.beginTransaction(function(err, conn) {
                        should.ifError(err);
                        async.eachLimit([ 10, 20, 30, 40, 50 ], 5, function(num, callback) {
                            adapter.execute(conn, "INSERT INTO test(id) VALUES(?)", num, function(err) {
                                should.ifError(err);
                                callback();
                            });
                        }, function() {
                            adapter.rollback(conn, function(err) {
                                should.ifError(err);
                                adapter.execute("SELECT COUNT(0) FROM test", function(err, ret) {
                                    ret[0]["COUNT(0)"].should.be.equal(5);
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            describe("show sql", function() {
                it("should use a certain logger", function(done) {
                    let logged = false;
                    const adapter = new MySQLAdapter({}, Object.assign({}, correctOptions, {
                        database: "mysql",
                        showSql: function(sql) {
                            sql.should.equal("HELLO WORLD");
                            logged = true;
                        }
                    }));
                    adapter.execute("HELLO WORLD", function(err) {
                        err.message.indexOf("HELLO WORLD").should.not.equal(-1);
                        if(logged) done();
                    });
                }); 
            });

            require("./mysql_insert")(name, correctOptions);
            require("./mysql_make")(name, correctOptions);
            require("./mysql_find")(name, correctOptions);
            require("./mysql_update")(name, correctOptions);
            require("./mysql_delete")(name, correctOptions);
        });
    });
});
