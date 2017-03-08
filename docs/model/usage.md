We assume we have a model difination:

```javascript
const Model = toshihiko.define("name", [
    // ...
]);
```

## Chain Call

Most of native functions in a model are chained.

eg.

```javascript
Model.where(CONDITION).order(ORDER).limit(LIMIT).find(CALLBACK);
Model.where(CONDITION).order(ORDER).limit(LIMIT).findOne(CALLBACK);
```

> **NOTICE:** It will return a `Query` instance after the first call in Model.
>
> `Model.where(CONDITION)` will return a Query instance with `CONDITION`. And all of the later calls in the chain are
> exactly call on that `Query` instance. `...order(ORDER)` returns the previous `Query` instance returned by
> `Model.where(CONDITION)`.

## Query

### where - Set the SELECT / UPDATE / DELETE condition

```javascript
// WHERE a = 1 AND b > 1 AND C = "123" AND (e = 2 OR f = 3)
Model.where({
    a: 1,
    b: {
        $gt: 1
    },
    c: "123",
    $or: {
        e: 2,
        f: 3
    }
});
```

Querying format for `where` should refer [here](../querying#where).

### order / orderBy - Set the query order

```javascript
// ORDER BY a ASC, b DESC
Model.orderBy({ a: 1, b: -1 });
```

Querying format for `order` should refer [here](../querying#order).

### field / fields - Set the query field(s)

```javascript
// SELECT a
Model.fields("a");

// SELECT a, b
Model.fields("a,b");

// SELECT a, b, c
Model.fields([ "a", "b", "c" ]);
```

### limit - Set the query limit

```javascript
// LIMIT 1, 5
Model.limit([ 1, 5 ]);
```

### index - Force use index

```javascript
// FORCE INDEX(`a`)
Model.index("a");
```

## Action

### find - Find a list of records

```javascript
// Callback
Model.where().limit().find(function(err, records, extra) {
    console.log(err, records, extra);

    // `records` will be an array if no error
});

// Promise
Model.where().limit().find().then(function(records) {
    // ...
}).error(function(err) {
    // ...
});
```

Here's three parameters in callback function:

+ `err`: the error object if there is;
+ `records`: the array of matched items;
+ `extra`: some extra value in this query. eg. it will be the related SQL sentence when using MySQL adapter.

But if you're using `Promise`, **NO EXTRA!** So `Promise` is **NOT** recommend.

### findOne - Find the first record

```javascript
// Callback
Model.where().limit().findOne(function(err, record, extra) {
    console.log(err, record, extra);

    // `record` will be a Yukari object if no error
    // and it will be null if no record found
});

// Promise
Model.where().limit().findOne().then(function(record) {
    // ...
}).error(function(err) {
    // ...
});
```

> The second part of `LIMIT` query will be ignored because it would only query for a single record.

### count - Count for the query

```javascript
// Callback
Model.where().limit().count(function(err, count, extra) {
    console.log(err, count, extra);

    // `count` is the result if no error
});

// Promise
Model.where().limit().count().then(function(count) {
    // ...
}).error(function(err) {
    // ...
});
```

### update - Update a crowd of records

```javascript
// SET a = 1, b = b + 1

// Callback
Model.where().limit().update({
    a: 1,
    b: "{{b + 1}}"
}, function(err, result, extra) {
    console.log(err, result, extra);

    // `result` will be the update result
    // if using MySQL, it will contain something like `effectedRows`
});

// Promise
Model.where().limit().update({
    a: 1,
    b: "{{b + 1}}"
}).then().error();
```

### delete - Delete a crowd of records

```javascript
// Callback
Model.where().limit().delete(function(err, result, extra) {
    console.log(err, result, extra);

    // `result` will be the update result
});

// Promise
Model.where().limit().delete().then().error();
```

## Action With No Query

### execute - Execute a certain command

For an example, if you're using MySQL, it would execute a certain SQL sentence.

```javascript
// SQL string format reference at https://github.com/mysqljs/sqlstring

// Callback
Model.execute("SELECT * FROM table WHERE a = ?", [ "1" ], function(err, result) {
    console.log(err, result);

    // if you're using MySQL,
    // the result will be the result after calling `mysql`'s `query`
});

// Promise
Model.execute("").then().error();
```

### findById - Find a certain record via primary key(s)

It will ignore or other query conditions and you only can call it via `Model` instances.

```javascript
// Single primary key
Model.findById(1, function(err, record) {
    console.log(err, record);
});

// Multiple primary keys
Model.findById({ key1: 1, key2: 2 }, function(err, record) {
    console.log(err, record);
});

// Promise
Model.findById(1).then().error();
```
