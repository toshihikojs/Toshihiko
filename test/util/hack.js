/**
 * XadillaX created at 2016-08-31 15:39:25 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

require("should");

exports.whereOnce = function(parent, assume) {
    const $where = parent.where.bind(parent);
    const called = { called: 0 };

    parent.where = function(where) {
        where.should.deepEqual(assume);
        parent.where = $where;
        called.called++;
        return $where(where);
    };

    return called;
};
