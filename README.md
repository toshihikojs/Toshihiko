# Toshihiko

A simple ORM for node.js in Huaban.

## Installation

```sh
$ npm install toshihiko
```

## Document

### Initialize

You should create a `Toshihiko` object to connect to MySQL:

```javascript
var Toshihiko = require("toshihiko").Toshihiko;
var toshihiko = new Toshihiko(database, username, password, options);
```

***Options*** can include these things:

+ `host`: hostname or IP of MySQL. Defaults to `localhost`.
+ `port`: port of MySQL. Defaults to `3306`.
+ `memcached`: if you want to memcached support, let it be an `Memcached` object which will be mentioned below. Defaults
  to undefined.
+ etc... (All options in module [mysql](https://www.npmjs.org/package/mysql#pool-options) will be OK)

### Define a Model

Define a model schema:

```javascript
var Model = toshihiko.define(tableName, [
    { name: "key1", alias: "keyOne", primaryKey: true, type: Toshihiko.Type.Integer },
    { name: "key2", type: Toshihiko.Type.String, defaultValue: "Ha~" },
    { name: "key3", type: Toshihiko.Type.Json, defaultValue: [] },
    { name: "key4", validators: [
        function(v) {
            if(v > 100) return "`key4` can't be greater than 100";
        },
        function(v) {
            // blahblah...
        }
    ] }
]);
```

You can add extra model functions by yourself:

```javascript
Model.sayHello = function() {
    this.find(function(err, rows) {
        console.log(err);
        console.log(rows);
    });
};
```
