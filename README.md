# Toshihiko

[![Toshihiko](http://img.shields.io/npm/v/toshihiko.svg)](https://www.npmjs.org/package/toshihiko) [![Toshihiko](http://img.shields.io/npm/dm/toshihiko.svg)](https://www.npmjs.org/package/toshihiko) [![Build Status](https://travis-ci.org/XadillaX/Toshihiko.svg?branch=develop)](https://travis-ci.org/XadillaX/Toshihiko) [![Coverage Status](https://img.shields.io/coveralls/XadillaX/Toshihiko/develop.svg)](https://coveralls.io/r/XadillaX/Toshihiko?branch=develop)

A simple ORM for node.js in Huaban with :heart:. For performance, this ORM does not provide operations like `in`, `group by`, `join`
and so on.

[![Toshihiko](https://nodei.co/npm/toshihiko.png?downloads=true&downloadRank=true)](https://www.npmjs.org/package/toshihiko) [![Toshihiko](https://nodei.co/npm-dl/toshihiko.png?months=6&height=3)](https://nodei.co/npm-dl/toshihiko.png?months=6&height=3)

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
+ `memcached`: if you want to memcached support, let it be an `Memcached` object which will be mentioned below. Defaults
  to undefined.
+ etc... (All options in module [mysql](https://www.npmjs.org/package/mysql#pool-options) will be OK)

#### Memcached

If you want to have memcached supported, you should create a `Memcached` object and then put it into options:

```javascript
var Memcached = T.Memcached;
var toshihiko = new T.Toshihiko(database, username, password, {
    memcached   : new Memcached(servers, options);
});
```

> **Notice:** the `servers` and `options` parameters can be referenced at https://www.npmjs.org/package/memcached#setting-up-the-client.
>
> And what's more, you can give a `prefix` in `options` to let your memcached for this Toshihiko has a certain prefix.
>
> Eg.
>
> ```javascript
> new Memcached(servers, { prefix: "tshk_", ... });
> ```
>

##### Customize Key Generate Function

A new feature for memcached is that you can custom your memcached key generate function now!

You may pass the function at the very beginning:

```javascript
new Memcached(servers, { custormizeKey: function(db, table, keys) { return ...; } });
```

Another way is you can pass throw the function below:

```javascript
memcached.setCustomizeKeyFunc(function(db, table, keys) { return ...; });
```

You should pay attention to `db`, `table` and `keys` which stand for database name, table name, primary keys with their value.

> `keys` maybe a single value (when `typeof keys !== "object"`); it maybe an object contains key-value pairs `key name -> value`.
>
> Eg.
>
> ```json
> { userId: 12, boardId: 12 }
> ```

So here's an example customize function:

```javascript
function(db, table, keys) {
    var base = this.prefix + db + "_" + table;
    if(typeof keys !== "object") return base + ":" + keys;

    for(var key in keys) {
        base += ":";
        base += key;
        base += keys[key];
    }

    return base;
}
```

### Define a Model

Define a model schema:

```javascript
var Model = toshihiko.define(tableName, [
    { name: "key1", column: "key_one", primaryKey: true, type: Toshihiko.Type.Integer },
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

> `options` is optional. You can specify `Memcached` here if you haven't defined it in `Toshihiko`. Otherwise, you can let
> it be `null` when you don't want to use `Memcached` in this `Model` but you had specify it in `Toshihiko`.

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

##### Field Name

###### Value

For field name, the value can be a certain value. Eg:

```javascript
{
    key1: 1
}
```

###### Operators

The value can be a JSON object with comparison operators `$eq` / `===`, `$neq` / `!==`, `$gt(e)` / `>(=)`, `$lt(e)` / `<(=)`, `$like`.

Eg:

```javascript
{
    keys1: {
        $neq: value
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

You can refers to [lib/fieldType/json.js](lib/fieldType/json.js) to get more information.

## Contribute

You're welcome to pull requests!

Thanks to:

+ [@luicfer](https://github.com/luicfer)

「雖然我覺得不怎麼可能有人會關注我」
