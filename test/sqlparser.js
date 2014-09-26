/**
 * XadillaX created at 2014-09-25 13:18
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var moment = require("moment");
var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var Memcached = require("../lib/memcached");
var randomer = require("chinese-random-skill");
var toshihiko = new Toshihiko("huaban", "root", "", {
    showSql     : true,
    memcached   : new Memcached("127.0.0.1:11211")
});

var model = toshihiko.define("user_tokens", [
    { name: "token",        type: Type.String,  column: "token", primaryKey: true },
    { name: "userId",       type: Type.Integer, column: "user_id" },
    { name: "ip",           type: Type.String,  column: "ip" },
    { name: "createdAt",    type: Type.Integer, column: "created_at" },
    { name: "expiredAt",    type: Type.Integer, column: "expired_at" },
    { name: "type",         type: Type.String,  column: "token_type" },
    { name: "data",         type: Type.String,  column: "data" }
]);

var query = model.where({
    userId: 1
});
query.updateData = {
    userId      : "{{CONCAT('userId', userId)}}",
    createdAt   : "{{`createdAt` + expiredAt}}"
};
console.log(query.makeSQL("update"));

var res1 = model.where({
    userId: 1
}).findOne();
res1.success(function(row, sql) {
    console.log(sql);
    console.log(row.toJSON());

    row.data = randomer.generate();
    row.createdAt = moment().unix();
    row.expiredAt = row.createdAt + 10000;
    console.log(row.$fromMemcached);

    row.update(function(err, row) {
        console.log(row.toJSON());
    });
});
