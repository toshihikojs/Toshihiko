---
layout: home

hero:
  name: Toshihiko
  text: Yet another simple ORM for Node.js.
  image:
    src: /logo.png
    alt: Toshihiko
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Core concepts
      link: /concepts

features:
  - title: Schema-derived types
    details: Fields, primary keys, query conditions, Yukari rows, and JSON output derive from one model definition.
  - title: Model API
    details: define(), where(), find(), findById(), build(), and save() form the Model–Query–Yukari workflow.
  - title: Native Promise APIs
    details: Queries, adapters, caches, validators, writes, and transactions use native Promises.
---

## A first model

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});

const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String },
], {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
  },
});

const user = User.build({ name: 'Alice' });
await user.insert();

const found = await User.findByName('Alice');
```

The schema is both runtime mapping and TypeScript input. Toshihiko infers field
values, primary keys, query conditions, row properties, and custom Model
methods without a separately maintained row interface.

::: warning Project status
Toshihiko v2 is under active development. Current packages use prerelease
versions and require Node.js 22 or newer.
:::

## Choose a path

- [Getting started](getting-started.md) builds a complete MySQL CRUD flow.
- [Core concepts](concepts.md) explains Toshihiko, Model, Query, Yukari, Adapter, and Cache.
- [Model definition](model/definition.md) covers fields, primary keys, validators, defaults, and custom methods.
- [Querying](querying.md) documents conditions, ordering, projections, limits, and result forms.
- [Migrating from v1](migration-v1.md) maps existing Toshihiko applications to the v2 packages and Promise API.
- [API reference](api.md) lists the public classes, methods, and helper types.

## About the name

Toshihiko is a character from [Touhou Warring States Nights](https://tieba.baidu.com/p/1386358409),
a collaborative Touhou fan work. The name has been part of the project since
its first release in 2014.
