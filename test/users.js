/**
 * XadillaX created at 2014-09-09 14:34
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var toshihiko = new Toshihiko("huaban", "root", "", {
    //showSql     : true
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
    //console.log(users);
});

var user = User.build({
    user_id : 12345,
    username: "blahblah",
    password: "e10adc3949ba59abbe56e057f20f883e",
    email   : "abc@def.ghi",
    urlname : "dsfakj",
    created_at: parseInt(Date.now() / 1000),
    avatar  : "\"http://img1.imgtn.bdimg.com/it/u=4036754899,2357663782&fm=21&gp=0.jpg\"",
    roles   : null,
    rating  : 8191
});

user.save(function(err, user, sql) {
    console.log(sql);
    user.userId = 12346;
    user.save(function(err, user, sql) {
        console.log(sql);
        console.log(err);

        user.delete(function(err, rowsEffected, sql) {
            console.log(err);
            console.log(sql);
            console.log(rowsEffected);
            console.log(user);
        });
    });
});
