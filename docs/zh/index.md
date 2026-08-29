---
layout: home

hero:
  name: Toshihiko
  text: 另一个简单的 Node.js ORM。
  image:
    src: /logo.png
    alt: Toshihiko
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/getting-started
    - theme: alt
      text: 核心概念
      link: /zh/concepts

features:
  - title: 从 Schema 推导类型
    details: 字段、主键、查询条件、Yukari 数据行和 JSON 输出均来自同一份 Model 定义。
  - title: Model API
    details: define()、where()、find()、findById()、build() 和 save() 组成 Model、Query、Yukari 的操作链路。
  - title: 原生 Promise API
    details: 查询、Adapter、Cache、Validator、写入与事务均使用原生 Promise。
---

## 第一个 Model

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

Schema 同时承担运行时映射和 TypeScript 类型输入。字段值、主键、查询条件、数据行属性以及自定义 Model 方法都不需要额外维护一份接口。

::: warning 项目状态
Toshihiko v2 仍在开发中。当前软件包属于预发布版本，需要 Node.js 22 或更高版本。
:::

## 选择阅读路径

- [快速开始](getting-started.md)：完成一条 MySQL CRUD 链路。
- [核心概念](concepts.md)：理解 Toshihiko、Model、Query、Yukari、Adapter 和 Cache。
- [定义 Model](model/definition.md)：字段、主键、默认值、Validator 和自定义方法。
- [查询](querying.md)：条件、排序、字段选择、限制与返回形式。
- [从 v1 升级](migration-v1.md)：将现有 Toshihiko 应用迁移到 v2。
- [API 参考](api.md)：查看公开类、方法和辅助类型。
