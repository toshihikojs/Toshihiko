/**
 * XadillaX created at 2014-09-18 18:27
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var Memcached = require("../lib/memcached");
var randomer = require("chinese-random-skill");
var toshihiko = new Toshihiko("huaban", "root", "", {
    showSql     : true,
    memcached   : new Memcached("127.0.0.1:11211", { prefix: "xxoo_" })
});

var Pin = toshihiko.define("pins", [
    { name: "pin_id", type: Type.Integer, primaryKey: true },
    { name: "user_id", type: Type.Integer },
    { name: "board_id", type: Type.Integer },
    { name: "file_id", type: Type.Integer },
    { name: "raw_text", type: Type.String },
    { name: "file", type: Type.Json },
    { name: "source", type: Type.String },
    { name: "link", type: Type.String }
]);

Pin.where({ pin_id: 235 }).findOne(function(err, pin) {
    pin.raw_text = randomer.generate();
    pin.save(function(err, pin) {
        Pin.find(function(err, result) {
            //console.log(result);

            Pin.find(function(err, pins) {
                console.log(pins);
            }, true);
        });
    });
});

