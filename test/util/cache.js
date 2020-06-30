/**
 * XadillaX created at 2016-08-11 15:13:15 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const Cache = function(foo, bar) {
    this.foo = foo;
    this.bar = bar;
};

module.exports = {
    create: (foo, bar) => new Cache(foo, bar),
    Cache: Cache
};
