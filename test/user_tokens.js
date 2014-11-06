/**
 * XadillaX created at 2014-09-09 10:31
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var toshihiko = new Toshihiko("huaban", "root", "", {
    showSql     : true
});

var model = toshihiko.define("user_tokens", [
    { name: "token", primaryKey: true, type: Type.String },
    { name: "user_id", type: Type.Integer },
    { name: "ip", type: Type.String },
    { name: "created_at", type: Type.Integer },
    { name: "expired_at", type: Type.Integer },
    { name: "token_type", type: Type.String },
    { name: "data", type: Type.String }
]);

model.where({
    token   : "213",
    $or     : {
        ip  : {
            $or     : {
                $eq  : [ "127.0.0.1", "localhost" ]
            }
        },
        created_at: {
            $gt     : 12345,
            $lt     : 54321
        }
    }
}).orderBy([ "token ASC", "user_id DESC" ]).limit([1, 5]).find(function(err, rows) {
    console.log(err);
    console.log(rows);
});

