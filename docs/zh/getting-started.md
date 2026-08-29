# 快速开始

本页从一张已有的 MySQL 表开始，完成连接、定义 Model、插入、查询、更新和删除。

## 环境要求

Toshihiko v2 需要 Node.js 22 或更高版本。当前软件包位于 `2.0.0-alpha` 预发布版本线。

## 安装

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

MySQL Adapter 使用 `mysql2` Promise Pool。安装 scoped Adapter 后，可以使用 `mysql` dialect 名称。

## 准备数据库表

Toshihiko 不创建表。请使用应用现有的 Schema 或迁移工具：

```sql
CREATE TABLE `users` (
  `user_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `birthday` DATETIME NULL,
  PRIMARY KEY (`user_id`)
);
```

## 创建连接

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  port: 3306,
  username: 'root',
});
```

也可以直接注入 Adapter 构造函数：

```typescript
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

## 定义 Model

```typescript
const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
]);
```

`name` 是代码属性，`column` 是数据库列名。Schema 会同步生成 TypeScript 类型。

## 插入并查询

```typescript
const user = User.build({
  name: 'Alice',
  birthday: null,
});

await user.insert();

const found = await User.findById(user.id);
console.log(found?.name);
```

`insert()` 会先验证字段，再由 Adapter 写入，并将自增 ID 等返回值写回同一个对象。

```typescript
const users = await User
  .where({ id: { $gte: 1 }, name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(20)
  .find();
```

## 更新并删除

查询得到的 Yukari 保存原始值，可以使用原始主键定位记录：

```typescript
const found = await User.findById(1);

if (found) {
  found.name = 'Updated Alice';
  await found.save();
  await found.delete();
}
```

由 `build()` 创建的 Yukari 在插入后仍保持新行语义。更新或删除前请重新查询。

## 返回普通对象

```typescript
const rows = await User.where({ name: 'Alice' }).find(true);
const row = await User.findById(1, true);
```

布尔参数启用 JSON 转换；例如 `Date` 会通过 Field Type 转换为字符串。

## 下一步

- [核心概念](concepts.md)
- [定义 Model](model/definition.md)
- [查询](querying.md)
