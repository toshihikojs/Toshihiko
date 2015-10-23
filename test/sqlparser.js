/**
 * XadillaX created at 2015-10-23 10:51:54 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
require("should");
var parser = require("../util/sqlparser");

describe("Some SQL Parser", function() {
    describe("sql name to column", function() {
        it("should be SELECT a FROM b WHERE c = d", function() {
            var sql = "SELECT aa FROM b WHERE cc = dd";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
                dd: "d"
            });
            answer.should.be.eql("SELECT a FROM b WHERE c = d");
        });

        it("should be SELECT `a` FROM b WHERE c = \"d\" AND `d` = e", function() {
            var sql = "SELECT `aa` FROM b WHERE cc = \"d\" AND `dd` = ee";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
                dd: "d",
                ee: "e"
            });
            answer.should.be.eql("SELECT `a` FROM b WHERE c = \"d\" AND `d` = e");
        });

        it("should be SELECT `a` AS k FROM b WHERE c = \"d\" AND `d` + `e` = e + 1", function() {
            var sql = "SELECT `aa` AS k FROM b WHERE cc = \"d\" AND `dd` + `ee` = ee + 1";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
                dd: "d",
                ee: "e"
            });
            answer.should.be.eql("SELECT `a` AS k FROM b WHERE c = \"d\" AND `d` + `e` = e + 1");
        });

        it("should be SELECT `a` AS k FROM b WHERE c = \"d\" AND `d` + `e` = e + `f`", function() {
            var sql = "SELECT `aa` AS k FROM b WHERE cc = \"d\" AND `dd` + `ee` = ee + `f_f`";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
                dd: "d",
                ee: "e",
                f_f: "f"
            });
            answer.should.be.eql("SELECT `a` AS k FROM b WHERE c = \"d\" AND `d` + `e` = e + `f`");
        });

        it("should be SELECT a FROM b WHERE (`c` = \"b\\\"\" AND `d` = `e`) AND `f`", function() {
            var sql = "SELECT aa FROM b WHERE (`cc` = \"b\\\"\" AND `dd` = `ee`) AND `ff`";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
                dd: "d",
                ee: "e",
                ff: "f"
            });
            answer.should.be.eql("SELECT a FROM b WHERE (`c` = \"b\\\"\" AND `d` = `e`) AND `f`");
        });

        it("should be SELECT a FROM b WHERE `c` = \"b\\\"", function() {
            var sql = "SELECT aa FROM b WHERE `cc` = \"b\\\"";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c",
            });
            answer.should.be.eql("SELECT a FROM b WHERE `c` = \"b\\\"");
        });

        it("should be SELECT a FROM b WHERE `c", function() {
            var sql = "SELECT aa FROM b WHERE `c";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c"
            });
            answer.should.be.eql("SELECT a FROM b WHERE `c");
        });

        it("should be SELECT a FROM b WHERE c\"1\"", function() {
            var sql = "SELECT aa FROM b WHERE cc\"1\"";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                cc: "c"
            });
            answer.should.be.eql("SELECT a FROM b WHERE c\"1\"");
        });

        it("should be SELECT a, d FROM b WHERE `c`", function() {
            var sql = "SELECT aa, dd FROM b WHERE `c`";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                dd: "d"
            });
            answer.should.be.eql("SELECT a, d FROM b WHERE `c`");
        });

        it("should be SELECT a FROM b WHERE calc(`d`) = `e`", function() {
            var sql = "SELECT aa FROM b WHERE calc(`dd`) = `ee`";
            var answer = parser.sqlNameToColumn(sql, {
                aa: "a",
                dd: "d",
                ee: "e"
            });
            answer.should.be.eql("SELECT a FROM b WHERE calc(`d`) = `e`");
        });

    });
});
