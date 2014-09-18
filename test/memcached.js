/**
 * XadillaX created at 2014-09-18 18:27
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var Memcached = require("../lib/memcached");
var toshihiko = new Toshihiko("huaban", "root", "", {
    showSql     : true,
    memcached   : new Memcached("127.0.0.1:11211")
});

toshihiko.options.memcached.getData("huaban", "boards", [ { user_id: 123, password: "dslfkjasdlfkj" }, 234 ]);
