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
