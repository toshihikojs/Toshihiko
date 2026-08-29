# Yukari instances

A Yukari is a row object tied to a Model. The name is intentional: in the
character setting behind the project name, Toshihiko is a *bunshin*, or
manifested instance, of Yakumo Yukari. A record is likewise represented as a
concrete object instance in Toshihiko, so the API calls it `Yukari`.

Each Yukari contains mapped field properties and remembers whether it was
built locally, loaded by a query, or deleted. See [Core concepts](concepts.md#where-the-names-come-from)
for the full naming background.

## Build a new Yukari

```typescript
const user = User.build({
  name: 'Alice',
  birthday: null,
});
```

Known input fields and schema defaults are available with their inferred types. Fields that were not supplied and have no default remain optional on that built value.

## Insert

```typescript
await user.insert();
```

`insert()` validates every present field, restores values through their field types, writes through the Adapter, and copies returned database values onto the same object.

Insertion does not turn a new Yukari into a queried Yukari. Query the persisted row before calling `update()` or `delete()`.

## Update

```typescript
const found = await User.findById(1);

if (found) {
  found.name = 'Updated Alice';
  await found.update();
}
```

A queried Yukari stores an original snapshot. `update()` compares current values with that snapshot and uses the original primary key as its locator. After a successful update, the snapshot is refreshed.

## Delete

```typescript
const found = await User.findById(1);
if (found) await found.delete();
```

Deletion also uses the original primary key. A deleted Yukari should not be reused for later writes.

## Save

`save()` follows the row source:

```typescript
await User.build({ name: 'Alice' }).save(); // insert

const found = await User.findById(1);
if (found) {
  found.name = 'Bob';
  await found.save(); // update
}
```

## Validation

```typescript
await user.validateOne('name', user.name);
await user.validateAll();
```

Validation permits `null` only when the field declares `allowNull: true`. A validator may return a message synchronously or through a Promise; non-empty messages become errors.

## JSON conversion

```typescript
const current = user.toJSON();
const original = user.toJSON(true);
```

The default form serializes current field values. Passing `true` serializes the original snapshot of a queried row. Field types control conversions such as `Date` to an ISO-style string.
