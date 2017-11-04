When we define a model, we should specify each column a type:

```js
const Model = toshihiko.define("name", [
    { ..., type: T.Type.Integer, ... }
]);
```

This chapter will introduce column types.

## Built-in Types

There're several built-in types in Toshihiko's `Type` Object:

```js
const T = require("toshihiko");
T.Type; //< Built-in types

T.Type.Integer; //< Integer
T.Type.String; //< String
...
```

You can get 6 types in `Type` object:

+ `Type.Boolean`: the column will be converted to boolean value. `TINYINT` is recommended in MySQL for this type;
+ `Type.Datetime`: the column will be converted to a `Date` object in JavaScript. `DATETIME` is recommended in MySQL for this type;
+ `Type.Float`: the column will be converted to a float number in JavaScript. `FLOAT`, `DOUBLE`, `DECIMAL`, etc. are recommended in MySQL for this type;
+ `Type.Integer`: the column will be converted to a integer number in JavaScript. Any `*INT` type is recommended in MySQL for this type;
+ `Type.Json`: the column will be converted to a JSON object in JavaScript. Some long string types (eg. `TEXT` or `LONGTEXT`) are recommended in MySQL for this type;
+ `Type.String`: the column will be converted to a JavaScript string. Any string type (eg. `CHAR`, `VARCHAR`, `TEXT`, etc.) are recommended in MySQL for this type.