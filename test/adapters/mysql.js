/**
 * XadillaX created at 2016-08-08 17:46:49 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const path = require("path");

const decache = require("decache");
const otrans = require("otrans");
const runSync = require("sync-runner");
const should = require("should");

const Adapter = require("../../lib/adapters/base");
const MySQLAdapter = require("../../lib/adapters/mysql");

describe("🐣 adapters/mysql", function() {
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
        describe(`${name} execute`, function() {
            const adapter = new MySQLAdapter({}, {
                username: "root",
                password: "",
                database: "toshihiko",
                charset: "utf8mb4_general_ci"
            });

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
                    otrans.toCamel(rows).should.deepEqual([ { tablesInToshihiko: "test" } ]);
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
    });
});
