/**
 * XadillaX created at 2014-09-09 14:34
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var toshihiko = new Toshihiko("huaban", "root", "", {
    showSql     : true
});

var User = toshihiko.define("users", [
    { name: "user_id", alias: "userId", type: Type.Integer, primaryKey: true },
    { name: "username", type: Type.String },
    { name: "password", type: Type.String },
    { name: "email", type: Type.String },
    { name: "urlname", type: Type.String },
    { name: "created_at", alias: "createdAt", type: Type.Integer },
    { name: "avatar", type: Type.Json },
    { name: "roles", type: Type.String },
    { name: "rating", type: Type.Integer }
]);

User.where({
    userId  : {
        $gt : 1
    },
    avatar  : {
        $like: "%\""
    }
}).orderBy({ userId: -1 }).find(function(err, users) {
    console.log(users);
});
