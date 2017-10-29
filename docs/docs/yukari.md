This chapter is for the record instance which is called `Yukari`.

> `Yukari` is a class that indicates a record.

## Build a New Yukari

If you want to insert a record to a model, you should create a record instance `Yukari` for it. It will be created via
a member function `.build()` of the model.

Assume you have a model like this:

```js
const Model = toshihiko.define("name", [
    { name: "column1", column: "column_1", type: toshihiko.Type.Integer, primaryKey: true }, // it's `AUTO_INCREMENT`
    { name: "column2", type: toshihiko.Type.Integer, primaryKey: true },
    { name: "column3", type: toshihiko.Type.Json, allowNull: true }
]);
```

You may create a record via `.build()` like this:

```js
const record = model.build({
    column2: 233,
    column3: null
});
```

## Yukari Object

After you've gotten a `Yukari` object, you can do something with it.

### Modify Column(s)

You may modify the columns value directly by assigning operation:

```js
record.column2 = 234;
record.column3 = { foo: "bar" };
```

### Insert

You may insert a row to database from a `Yukari` object created via `.build()`:

```js
const record = model.build({ ... });
record.insert(function(err, record) {
    console.log(err, record);
});
```

### Update

You may update a row to database from a `Yukari` object that queried via Toshihiko querying methods:

```js
model.where({ ... }).findOne(function(err, record) {
    // assume we got a certain record
    record.column2 = 234;
    record.update(function(err, record) {
        console.log(err, record);
    });
});
```

### Delete

If you want to delete a `Yukari` object from database, you may use `.delete()`:

```js
model.where({ ... }).findOne(function(err, record) {
    // assume we got a certain record
    record.delete(function(err) {
        console.log(err);
    });
});
```

### Save

This is a convenient function. If your `Yukari` object is created via `.build()`, this method equals to `.insert()`; otherwise, it equals to `.update()`:

```js
record.save(function(err, record) {
    console.log(err, record);
});
```

### To JSON

If you want to get a pure JSON object from a `Yukari` object, you may want `.toJSON()` function:

```js
const json = record.toJSON();
console.log(json);
```
