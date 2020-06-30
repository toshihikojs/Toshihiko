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

## Customize Type

If you think the built-in types not match your situation, you can customize type by yourself.

Here's a template of a type definition:

```js
const YourType = {
    name: "TypeName",
    needQuotes: true,
    parse: function(orig) {},
    restore: function(parsed) {},
    equal: function(a, b) {},
    defaultValue: val
};
```

And then you can use `YourType` in modal definition:

```js
const Model = toshihiko.define("name", [
    { ..., type: YourType, ... }
]);
```

### Properties

#### `name`

It's the name of your type.

#### `needQuotes`

It defines that whether your type should be wrapped in quotes while generating SQL.

eg. If your type's SQL is like this:

```sql
... WHERE foo = 1 ...
```

Then `foo`'s `needQuotes` is `false`, and if your type's SQL is like this:

```sql
... WHERE foo = "foo|bar|baz" ...
```

Then `foo`'s `needQuotes` is `true`.

#### `parse`

This is a function that parse original data from MySQL to your type.

For an example, assume your column is `TEXT`, and you use it as format `"foo|bar|baz|…"` (split by `'|'`). You can write a customize type to split this string into an array in JavaScript:

```js
YourType.parse = function(orig) {
    return orig.split("|");
};
```

The result will be that:

+ You store `"foo|bar|baz"` in your MySQL;
+ You get `[ "foo", "bar", "baz" ]` in you `Yukari` object.

#### `restore`

This is an inverse function of `parse`. You should restore your JavaScript object to SQL type.

For an example again, you should restore `[ "foo", "bar", "baz" ]` back to `"foo|bar|baz"`:

```js
YourType.restore = function(parsed) {
    return parsed.join("|");
};
```

#### `equal`

This function should return whether the first parameter equals to second parameter.

> Be careful that `[ "foo", "bar", "baz" ]` is `!==` to another `[ "foo", "bar", "baz" ]` in JavaScript because they are not the same pointer. So we should do this judgement in another way.

Eg.

```js
YourType.equal = function(a, b) {
    if(a.length !== b.length) return false;
    for(let i = 0; i < a.length; i++) {
        if(a[i] !== b[i]) return false;
    }
  
    return true;
};
```

### Example

Assume you have a demand like this:

> Column `industry` is a string that formatted like `"BIG_INDUSTRY,SMALL_INDUSTRY"` (eg. `"internet,financial"`). And you want this column be an object like `{ big: "BIG_INDUSTRY", small: "SMALL_INDUSTRY" }` in your `Yukari` object.

Define an type object first:

```js
const Industry = {};
Industry.name = "Industry";
Industry.needQuotes = true;
```

Next we should implement the `parse` function:

```js
Industry.parse = function(orig) {
    if(!orig) return { big: "", small: "" };
    const temp = orig.split(",");
    return {
        big: temp[0] || "",
        small: temp[1] || ""
    };
};
```

And then we should implement the `restore` function:

```js
Industry.restore = function(parsed) {
    if(!parsed) return ",";
    return (parsed.big || "") + "," + (parsed.small || "");
};
```

`equal` and `defaultValue`:

```js
Industry.equal = function(a, b) {
    return (a.big === b.big && a.small === b.small);
};
Industry.defaultValue = "internet,financial";
```

#### Usage

After you've finished your type definition, you can define your model:

```js
const Model = toshihiko.define("info", [
    { name: "industry", type: Industry, ... }
]);
```

When you build your `Yukari` object and do insert, the SQL will like this:

```js
Model.build({ industry: { big: "foo", small: "bar" } }).save(...);
                                                             
//< INSERT INTO `info`(`industry`) VALUES("foo,bar");
```

When you do some query:

```js
Model.where(...).findOne(function(err, info) {
    console.log(info.industry); //< { big: "foo", small: "bar" }
});
```