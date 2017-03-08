## Definition

To define mapping between a model and a table, use the `define` method.

```javascript
toshihiko.define("name", [
    { name: "column1", column: "column_1", type: T.Type.String, primaryKey: true, default: "1" },
    { name: "column2", type: T.Type.Integer, primaryKey: true },
    { name: "column3", type: T.Type.Json, allowNull: true },
    ...
]);
```

In each column, you may see some definition:

+ **name**: column name in code logic, recommanded to be in lower camel case;
+ **column**: real column name in your data source; if not existing, it will be as same as **name**;
+ **type**: column type;
+ **primaryKey**: if it's primary key; toshihiko supports multiple primary keys;
+ **default**: default value;
+ **allowNull**: if it's allowed to be null;
+ **validators**: a function or an array of functions to indicate validator(s);
+ **etc.** Reference to [Toshihiko API](#).

And the third parameter of `toshihiko.define` is optional, indicates for `options`. You can define something like local cache options here.

## Validators

Define an validator like this:

```javascript
toshihiko.define("name", [{
    name: "column",
    type: T.Type.String,

    // let this column must be `"abc"`
    validators: function(value) {
        if(value !== "abc") {
            return "This column must be `abc`.";
        }
    }
}]);
```

Or with callback function:

```javascript
toshihiko.define("name", [{
    name: "column",
    type: T.Type.String,

    // let this column must be `"abc"`
    validators: function(value, callback) {
        if(value !== "abc") {
            return callback(new Error("This column must be `abc`."));
        }
        return callback();
    }
}]);
```

And if you want to define several validators for one column, you may use an array:

```javascript
function validator1(...) {
    // ...
}

function validator2(...) {
    // ...
}

toshihiko.define("name", [{
    name: "column",
    type: T.Type.String,
    validators: [ validator1, validator2 ]
}]);
```

## Data Types

Below are some of the datatypes supported by Toshihiko. For a full and updated list, see [Data Types](#).

```javascript
T.Type.Boolean      // recommend to mapping TINYINT
T.Type.Datetime     // recommend to mapping DATETIME
T.Type.Float        // recommend to mapping DECIMAL / DOUBLE / FLOAT / etc.
T.Type.Integer      // recommend to mapping TINYINT / INT / etc.
T.Type.Json         // recommend to mapping TEXT / LONGTEXT / etc.
T.Type.String       // recommend to mapping TEXT / LONGTEXT / CHAR() / VARCHAR() / etc.
```

And what's more, you can define your own data type. See [Define a Data Type](#).

## Define Properties

You can add some properties to your model object. Just assign it.

```javascript
const Model = toshihiko.define(...);

Model.foo = "bar";
Model.baz = "baa";

// ...
```

## Define Methods

You can add some methods to your model object. Just assign it.

```javascript
const Model = toshihiko.define(...);

Model.getListByPage = function(page, limit, callback) {
    return this.limit([ page, limit ]).find(callback);
};
```

## Cache

The 3rd parameter of `toshihiko.define` may contain a cache option.

For an example, if you use [Toshihiko-Memcached](https://github.com/XadillaX/Toshihiko-Memcached) you should install it
first.

```bash
$ npm install --save toshihiko-memcached
```

And you may configure it at the 3rd parameter.

```javascript
toshihiko.define("...", [
    ...
], {
    cache: {
        name: "memcached",
        servers: [ "localhost:11211" ],
        options: {
            prefix: "_"
        }
    }
});
```

> **NOTICE:** If you have defined the cache in [Toshihiko](../getting-started#setting-up-a-connection) before, cache
> defined in model will override the previous configuration in this model. What's more, if you define cache as `null`
> in model, cache in this model will never be used.
