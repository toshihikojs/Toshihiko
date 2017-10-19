This chapter will be used in querying.

## Key name

The key name in querying should be `name` defined in Model.

eg.

```javascript
toshihiko.define("model", [
    { name: "bar", column: "baz", ... },
    { column: "foo", ... }
]);
```

You should use `foo` and `bar` while querying instead of using `foo` and `baz` which `baz` indicates the real column
name in collection / table and `bar` is the logic name in your project code.

## Where

This will be useful in `Model.where` or `Query.where`.

### Basic Querying

The basic querying is the "equal" querying. The format will be:

```
key: value
```

For an example:

```javascript
{
    a: 1,
    b: 2
}
```

means `a = 1 AND b = 2`.

### Advanced Comparation

The format will be:

```
key: {
    COMMAND: value
}
```

The command is listed below:

+ `$eq` / `===`: equality;
+ `$neq` / `!==`: not equality;
+ `$lt` / `<`: less than;
+ `$gt` / `>`: greater than;
+ `$lte` / `<=`: less than or equality;
+ `$gte` / `>=`: greater than or equality;
+ `$like`: like;
+ `$in`: in an array.

```javascript
{
    a: { $eq: 1 },
    b: { "!==": 2 },
    c: { $lt: 3 },
    d: { ">": 4 },
    e: { $lte: 5 },
    f: { ">=": 6 },
    g: { $like: "%hello" },
    h: { $in: [ 1, 2, 3, 4 ] }
}
```

### Logic Combination

This section will tell you how to use `OR` and `AND`.

All querys without specified logic are default to `AND`.

```javascript
{
    a: 1,
    b: 2
}
```

querying above will be translate to something like `a = 1 AND b = 2`.

You could add logic combination when necessary. The format will be:

```javascript
LOGIC: [ several_logics ]

// or

LOGIC: { several_logics }

// or nested

LOGIC: [ { LOGIC: ... }, ... ]
```

And `LOGIC` can be one of `$or` and `$and`.

Here's some examples:

```javascript
{
    $or: {
        a: 1,
        b: 2
    }
}

{
    $or: {
        a: { $or: [ 1, 2 ] },
        b: 2
    }
}

{
    $and: {
        $or: [
            { a: 1, b: 2 },
            { a: 2, b: 1 },
            { a: { $gt: 3 }, b: { $lt: 5 } },
            { a: { $or: { $gt: 100, $lt: -100 } }, b: { $gt: -100, $lt: 100 } }
        ],
        foo: 1
    }
}
```

## Ordering

This will be useful in `Model.order` / `Model.orderBy` or `Query.order` / `Query.orderBy`.

### Order String

If you're passing a string, the format should like:

```javascript
"KEY1, KEY2 asc, KEY3 desc, ..."
```

One or several key(s) and optional order sign splited with comma.

### Order Object

If you're passing an object, the format should like:

```javascript
{
    KEY1: 1,
    KEY2: -1,
    KEY3: "asc",
    KEY4: "DESC"
}
```

> `1` indicates `"asc"` while `-1` indicates `"desc"`.

### Order Array

If you're passing an array, the format should like:

```javascript
[ "KEY1", "KEY2 asc", { KEY3: 1 }, { KEY4: -1 } ]
```

Each key should be one element of the array, and each of their format may reference above.

## Field

This will be useful in `Model.field` / `Model.fields` or `Query.field` / `Query.fields`.

### Field String

If you're passing a string, the format should like:

```javascript
"KEY1, KEY2, ..."
```

One or several key(s) splited with comma.

### Field Array

If you're passing an array, the format should like:

```javascript
[ "KEY1", "KEY2", ... ]
```

Each key per element in the array.

## Limit / Pagination

This will be useful in `Model.limit` or `Query.limit`.

### Limit String

If you're passing a string, the format should like:

```javascript
"1, 2"

// or

"1"
```

Assume you're using MySQL, the first string will be translated to `LIMIT 1, 2` and the second one will be translate
to `LIMIT 1`.

### Limit Array

If you're passing an array, the format should like:

```javascript
[ 1, 2 ]

// or

[ 1 ]
```

Assume you're using MySQL again, the first string will be translated to `LIMIT 1, 2` and the second one will be translate
to `LIMIT 1` again.

### Limit Number

If you're passing a single number or two numbers like:

```javascript
.limit(1, 2);
.limit(1);
```

Assume you're using MySQL again and again, the first string will be translated to `LIMIT 1, 2` and the second one will
be translate to `LIMIT 1` again and again.

## Index

This will be useful in `Model.index`.

The only argument you should pass is a single index key name **(NOT A COLUMN NAME)**.

eg. If you've created an index key named `this_is_an_index` and you want to forcely use this index while querying, you
only need to pass the key name `this_is_an_index` into `.index()`.

## Crowd Update

This will be useful in `Model.update(data, callback)`.

The `data` should be an object and format like:

```javascript
{
    KEY1: SPECIFIED_VALUE,
    KEY2: ROW_COMMAND
}
```

### Specified Value

You only need to consider the value of the key-value pair is a specified value.

eg.

```javascript
{
    a: 1,
    b: "2"
}
```

`a` will be updated to 1 and `b` will be updated to "2".

### Raw Command

String wrapped with `{{` / `}}` will be considered as a raw command. Substring inside of `{{` / `}}` is the raw command.

eg.

```javascript
{
    a: "{{a + 1}}",
    b: "{{BIT_COUNT(a ^ 1)}}"
}
```

Assume you're using MySQL, `data` above will be translate to `SET a = a + 1, b = BIT_COUNT(a ^ 1)`.
