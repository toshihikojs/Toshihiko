/**
 * XadillaX created at 2016-10-13 17:35:29 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const moment = require("moment");
const should = require("should");

const Datetime = require("../../lib/field_type").Datetime;

module.exports = function() {
    describe("🤑 datetime", function() {
        const date = new Date(2016, 9, 13, 17, 37, 0, 0);

        it("restore", function() {
            Datetime.restore(date).should.equal("2016-10-13 17:37:00");
            Datetime.restore("2016-10-13 17:37:00").should.equal("2016-10-13 17:37:00");
            Datetime.restore(moment(date)).should.equal("2016-10-13 17:37:00");
        });

        it("parse", function() {
            Datetime.parse("2016-10-13 17:37:00").should.deepEqual(date);
        });

        it("equal", function() {
            Datetime.equal(date, "2016-10-13 17:37:00");
            Datetime.equal(date, moment("2016-10-13 17:37:00"));
        });

        it("toJSON", function() {
            const str = moment(date).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            Datetime.toJSON(date).should.equal(str);
            Datetime.toJSON(moment(date)).should.equal(str);
            Datetime.toJSON("2016-10-13 17:37:00").should.equal(str);
            should(Datetime.toJSON(null)).equal(null);
        });
    });
};
