# Toshihiko

[![Toshihiko](http://img.shields.io/npm/v/toshihiko.svg)](https://www.npmjs.org/package/toshihiko)
[![Toshihiko](http://img.shields.io/npm/dm/toshihiko.svg)](https://www.npmjs.org/package/toshihiko)
[![Build Status](https://travis-ci.org/XadillaX/Toshihiko.svg?branch=develop)](https://travis-ci.org/XadillaX/Toshihiko)
[![Coverage Status](https://img.shields.io/coveralls/XadillaX/Toshihiko/develop.svg)](https://coveralls.io/r/XadillaX/Toshihiko?branch=develop)
[![Code Quality](https://img.shields.io/codacy/7c707792fa4f4f0ba8937dfb5d394bc3.svg?style=flat)](https://www.codacy.com/public/i_2/Toshihiko/dashboard)
[![License](https://img.shields.io/npm/l/toshihiko.svg?style=flat)](https://www.npmjs.org/package/toshihiko)
[![Dependency Status](https://david-dm.org/XadillaX/Toshihiko.svg)](https://david-dm.org/XadillaX/Toshihiko)

[![Join the chat at https://gitter.im/XadillaX/Toshihiko](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/XadillaX/Toshihiko?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Star at GitHub](https://img.shields.io/github/stars/XadillaX/toshihiko.svg?style=social&label=Star)](https://github.com/xadillax/toshihiko)

[![NPM](https://nodei.co/npm/toshihiko.png?downloads=true&downloadRank=true)](https://nodei.co/npm/toshihiko/) [![NPM](https://nodei.co/npm-dl/toshihiko.png?months=6&height=3)](https://nodei.co/npm/toshihiko/)

A simple ORM for node.js in [Huaban](http://huaban.com/), [Souche](http://www.souche.com/) and Sohu with :heart:. For performance, this ORM does not provide operations like ~~`in`~~, `group by`, `join` and so on. (for some reason, we have to support `in` operation)

## Installation

```sh
$ npm install toshihiko
```

## Document

### Initialize

You should create a `Toshihiko` object to connect to MySQL:

```javascript
var T = require("toshihiko");
var toshihiko = new T.Toshihiko(database, username, password, options);
```

***Options*** can include these things:

+ `host`: hostname or IP of MySQL. Defaults to `localhost`.
+ `port`: port of MySQL. Defaults to `3306`.
+ `cache`: if you want to cache support, let it be an cache layer object or cache layer configuration which will be mentioned below. Defaults to undefined.
+ etc... (All options in module [mysql](https://www.npmjs.org/package/mysql#pool-options) will be OK)

#### Cache

Toshihiko now is using new cache layer! You can choose your cache layer by your self!

Pass an object to `cache` of options like:

```javascript
var toshihiko = new T.Toshihiko(database, username, password, {
    cache: YOUR_CACHE_LAYER
});
```

The `YOUR_CACHE_LAYER` may be an instance of Toshihiko cache layer object like [toshihiko-memcacehd](https://github.com/XadillaX/Toshihiko-Memcached) (you can implement a cache layer by yourself).

What's more, `YOUR_CACHE_LAYER` may be a configuration object which should include `name` or `path`.

For an example,

```javascript
var toshihiko = new T.Toshihiko(database, username, password, {
    cache: {
        name: "memcached",
        servers: "...",
        options: {}
    }
});
```

will search for package `toshihiko-memcached` and pass `servers`, `options` to create a `toshihiko-memcached` object. By default, Toshihiko support memcached as cache layer by using package [toshihiko-memcacehd](https://github.com/XadillaX/Toshihiko-Memcached).

You can get the cache object in Toshihiko by getting the variable:

```javascript
var cache = toshihiko.cache;
```

### Define a Model

Define a model schema:

```javascript
var Model = toshihiko.define(tableName, [
    { name: "key1", column: "key_one", primaryKey: true, type: Toshihiko.Type.Integer, autoIncrement: true },
    { name: "key2", type: Toshihiko.Type.String, defaultValue: "Ha~" },
    { name: "key3", type: Toshihiko.Type.Json, defaultValue: [] },
    { name: "key4", validators: [
        function(v) {
            if(v > 100) return "`key4` can't be greater than 100";
        },
        function(v) {
            // blahblah...
        }
    ] },
    { name: "key5", type: Toshihiko.Type.String, allowNull: true }
], options);
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

> `options` is optional. You can specify `cache` here if you haven't defined it in `Toshihiko`. Otherwise, you can let
> it be `null` when you don't want to use `cache` in this `Model` but you had specify it in `Toshihiko`.

> **Important Note:** `autoIncrement` is optional. But if you specify a non-primary key as auto increment, you **must**
> mark it as `autoIncrement`! (For further reading please go [#38](https://github.com/XadillaX/Toshihiko/issues/38)
> and [#39](https://github.com/XadillaX/Toshihiko/pull/39))

### Query & Update

Toshihiko uses chain operations. Eg:

```javascript
Model.where(condition).limit(limit).orderBy(order).find(callback);
Model.where(condition).limit(limit).delete(callback);
Model.findById(primaryKeysId, callback);
Model.where(condition).update(data, callback);
```

#### where

`condition` is an JSON object with keys:

+ A field name
+ `$and`
+ `$or`

**or `condition` can be an array that includes object mentioned above.** (New feature since v0.4.1)

##### Field Name

###### Value

For field name, the value can be a certain value. Eg:

```javascript
{
    key1: 1
}
```

###### Operators

The value can be a JSON object with comparison operators `$eq` / `===`, `$neq` / `!==`, `$gt(e)` / `>(=)`, `$lt(e)` / `<(=)`, `$like`, `$in`.

Eg:

```javascript
{
    keys1: {
        $neq: value,
        $in: [ value ]
    }
}
```

> `value` can be a certain value or an array with logic `AND`.
>
> Eg. `$neq: 5` or `$neq: [ 5, 2 ]`.

###### Logic

You can use logic symbols as well:

```javascript
{
    keys1: {
        $or: {
            $eq: 1,
            $neq: 2
        }
    }
}
```

> **Notice**: you can define `logic` and `operators` with many many levels.

##### `$and` And `$or`

You can use these two logic with many many levels.

```javascript
{
    $or: {
        $or: { $or: ... },
    }
}
```

And the last level can be like that:

```javascript
{
    $and: {
        KEY: { REFER TO ABOVE `Field Name` }
    }
}
```

#### limit

For examples:

```javascript
foo.limit("1");         ///< skip 1
foo.limit("0,30");      ///< skip 0, limit 30
foo.limit([ 0, 30 ]);   ///< skip 0, limit 30
foo.limit([ 1 ]);       ///< skip 1
foo.limit({ skip: 0, limit: 1 });   ///< skip 0, limit 1
foo.limit({ skip: 1 }); ///< skip 1
foo.limit({ limit: 1 });///< limit 1
```

#### orderBy

For examples:

```javascript
foo.orderBy("key1 asc");
foo.orderBy([ "key1 asc", "key2 desc" ]);
foo.orderBy({ key1: "asc", key2: "desc", key3: 1, key4: -1 });
```

#### count

Count the records with a certain condition:

```javascript
foo.where(condition).count(function(err, count) {});
```

#### find

With the conditions, limit and orders to find all records:

```javascript
foo.where(condition).find(function(err, rows) {
    //...
}, withJson);
```

> **Notice**: the parameter `withJson` is an optional parameter. If it's true, elements in `rows` are JSON objects. Otherwise,
> they are all `Yukari` objects.

#### findOne

It's similar with `find`, but it will just find only one record.

```javascript
foo.where(condition).findOne(function(err, row) {
    //...
}, withJson);
```

> **Notice**: `withJson` is the same as above.

#### findById

```javascript
foo.findById(primaryKeysId, function(err, bar) {
}, withJson);
```

> `primaryKeysId` can be a string or an object.
>
> When there're several primary keys in one table, this value may be like:
>
> ```javascript
> {
>     key1: 1,
>     key2: 2,
> }
> ```
>
> If there's only one primary key, you can just pass a string, number or some other base type value.

For examples:

```javascript
foo.findById({ key1: 1, key2: 2 }, callback);
foo.findById(1, callback);
```

#### update

```javascript
foo.where(condition).update(data, function(err, result) {});
```

`data` is an object that includes your changed data. Eg:

```javascript
{
    key1: 12,
    key2: "123",
    key3: "{{key3 + 1}}"
}
```

String with `{{...}}` will be parsed as SQL statement. For example, you can let it be ```{{CONCAT(`key3`, ".suffix")}}```
or any others statement you want to use.

> **Notice**: `result` is something like:
>
> ```javascript
> { fieldCount: 0,
>   affectedRows: 1,
>   insertId: 0,
>   serverStatus: 2,
>   warningCount: 0,
>   message: '(Rows matched: 1  Changed: 1  Warnings: 0',
>   protocol41: true,
>   changedRows: 1 }
> ```

#### delete

```javascript
foo.where(condition).delete(function(err, result) { /** ... */ });
```

#### ┏ (゜ω゜)=☞ Promise-Liked

For `find`, `findOne`, `findById`, `update` and `delete`, you can use it without callback function.

Whether you used callback function or not, these function will return a `ResultPromisor` object. You can use it like:

##### ResultPromisor::success

```javascript
var Q = foo.find();
Q.success(function(result) { /** ... */ });
```

##### ResultPromisor::error

```javascript
var Q = foo.find();
Q.error(function(err) { /** ... */ });
```

##### ResultPromisor::finished

```javascript
var Q = foo.find();
Q.finished(function(err, result) { /** ... */ });
```

##### True Promise Object

You may use `$promise` to get a `BlueBird` promise object after querying.

```javascript
foo.find().$promise.then(callback).catch(callback);
```

### Yukari Object

Yukari object is the data entity object.

`rows` in `Model.find(function(err, rows) {})` is an array with Yukari objects unless you use `withJson` parameter.

Also, you can get a new Yukari object by calling `Model.build()`.

We assume all Yukari(s) below are created from `Model.find()` except `Model.build()`.

#### Model.build()

You can pass a JSON object to this function to generate a new Yukari object:

```javascript
Model.build({
    key1    : 1,
    key2    : 2,
    key3    : "3"
});
```

#### Yukari::toJSON()

Transform Yukari object to a simple original JSON object:

```javascript
var json = yukari.toJSON();
console.log(json);
```

#### Yukari::insert()

If your Yukari object is created from `Model.build()`, you should use this function to insert data to database.

```javascript
var yukari = Model.build({ ... });
yukari.insert(function(err, yukari) {
    //...
});
```

#### Yukari::update()

Change this Yukari data to database.

```javascript
yukari.update(function(err, yukari) {
    //...
});
```

> **Notice**: `"{{..}}"` operation is not supported here.

#### Yukari::updateByJson()

You can pass through a JSON object to update yukari object.

```javascript
var object = { id: 1, key: 2 };
yukari.updateByJson(object, function(err, yukari) {
    // this is the same as:
    //
    //   yukari.id = 1;
    //   yukari.key = 2;
    //   yukari.update(function() {});
});
```

#### Yukari::save()

If it's a new Yukari object, it will call `insert`. Otherwise, it will call `update`.

```javascript
yukari.save(function(err, yukari) {
    //...
});
```

#### Yukari::delete()

Delete this record from database.

```javascript
yukari.delete(function(err, affectedRows) {});
```

### Custom Field Type

There're 4 kind of types in Toshihiko as default.

+ Type.Float
+ Type.Integer
+ Type.Json
+ Type.String

You can code a custom field type by yourself.

Here's the template:

```javascript
var Type = {};
Type.name = "type";
Type.needQuotes = false;    ///< Is this type need quotes in SQL statement?
Type.restore = function(v) {
    // v is a parsed value,
    // you should transform
    // it to the type that
    // SQL can recognize
    return v;
};
Type.parse = function(v) {
    // v is a original value,
    // you should parse it
    // into your own type
    return v;
};
Type.defaultValue = 0.1;    ///< Default value
```

You can refers to [lib/fieldType/json.js](lib/field_type/json.js) to get more information.

## Contribute

You're welcome to make pull requests!

Thanks to:

+ [@luicfer](https://github.com/luicfer)
+ [@mapleincode](https://github.com/mapleincode)

「雖然我覺得不怎麼可能有人會關注我」
