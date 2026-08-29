# API 参考

本页列出公开的运行时对象、方法签名、返回类型和扩展契约。指南负责讲解完整流程；需要查某个成员时，可以直接在本页定位。

## 软件包入口

| 软件包 | 运行时导出 | 用途 |
|---|---|---|
| `toshihiko` | `Toshihiko`、`Type`、`Adapter`、`Escaper` | Model、Query 与 Yukari 核心 API |
| `@toshihiko/mysql-adapter` | `MySQLAdapter`、`MySQLSqlBuilder` | MySQL 执行和 SQL 生成 |
| `@toshihiko/base-adapter` | `Adapter`、`extend` | 编写 Adapter 时使用的基类 |
| `@toshihiko/base-cache` | `Cache` | 编写 Cache 时使用的基类 |
| `@toshihiko/redis-cache` | `RedisCache`、`create` | Redis Cache 实现 |
| `@toshihiko/memcached-cache` | `MemcachedCache`、`create` | Memcached Cache 实现 |
| `@toshihiko/sql-utils` | `escape`、`escapeLike`、`sqlNameToColumn` | SQL 字符串兼容工具 |

所有软件包在运行时使用 CommonJS，并提供 TypeScript 声明。

## `Toshihiko`

`Toshihiko` 持有一个 Adapter，并创建与之绑定的 Model。

### 构造函数

```typescript
new Toshihiko(adapter, options?)
```

`adapter` 支持三种形式：

| 形式 | 示例 | 行为 |
|---|---|---|
| 方言名 | `new Toshihiko('mysql', options)` | 加载 `@toshihiko/mysql-adapter` |
| Adapter 构造函数 | `new Toshihiko(MySQLAdapter, options)` | 使用 Toshihiko 实例和选项创建 Adapter |
| Adapter 实例 | `new Toshihiko(adapter)` | 直接使用传入的实例 |

传入构造函数时，其选项类型会决定 `options` 是否必填，以及可以填写哪些属性。

### 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `adapter` | 所选 Adapter 类型 | 具体的 Adapter 实例 |
| `cache` | `Cache \| null \| undefined` | 通过 Adapter 选项配置的数据库级 Cache |
| `database` | `string` | `adapter.getDBName()` 的返回值 |
| `dialect` | `string \| null` | 方言名或 Adapter 构造函数名 |
| `options` | 所选选项类型 | 构造选项 |
| `pool` | 由 Adapter 决定 | `MySQLAdapter` 等 Adapter 暴露的连接池 |

### `define()`

```typescript
database.define(name, schema, options?)
```

创建一个 Model。返回类型会保留字面量表名、Schema 字段名、字段值类型、可空性、主键和自定义方法。

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});
```

普通数组字面量会保留字段级推断，不需要追加 `as const`。使用方法简写声明函数时，`this` 会被推断为 Model 与同一个 `methods` 对象内全部方法的交集。函数也会在运行时复制到 Model 对象上。

| 选项 | 类型 | 说明 |
|---|---|---|
| `cache` | `CacheSource \| false \| null` | 覆盖、禁用或清空数据库级 Cache |
| `methods` | 方法对象 | 添加带上下文 `this` 的业务 Model 方法 |

### 其他方法

| 签名 | 返回值 | 说明 |
|---|---|---|
| `getAdapter()` | 具体 Adapter | 保留所选 Adapter 类型 |
| `execute(...args)` | Adapter 执行结果 | 将原始执行请求转发给 Adapter |
| `Toshihiko.createCache(source)` | `Cache \| null` | 规范化 Cache 实例或模块式配置 |

## `Model`

Model 是 `define()` 返回的静态表 API，同时继承 `EventEmitter2`。

### 元数据

| 属性 | 说明 |
|---|---|
| `name` | 字面量表名或集合名 |
| `parent`、`toshihiko` | 所属 Toshihiko 实例 |
| `options` | Model 定义选项 |
| `originalSchema` | 原始 Schema 定义 |
| `schema`、`_fields` | 编译后的 `Field`；`_fields` 是兼容别名 |
| `primaryKeys` | 编译后的主键 Field |
| `autoIncrementField`、`ai` | 自增 Field 或 `null`；`ai` 是兼容别名 |
| `nameToColumn`、`columnToName` | 逻辑名与存储列名映射 |
| `fieldNamesMap`、`fieldColumnsMap` | Field 查找映射 |
| `cache` | Model 最终使用的 Cache，未配置时为 `null` |

### 创建数据行

```typescript
Model.build(fields)
```

返回新的 `BuiltYukari`。输入键只能来自 Schema。输入本身是 Partial，因为数据库默认值和自增值可以缺省。调用方传入的字段以及具有默认值的字段，在返回类型上是已知字段；其余字段仍然可选。

### 创建 Query

以下方法每次都会创建新的 Query：

| 签名 | 说明 |
|---|---|
| `where(condition)` | 设置带类型的查询条件 |
| `field(fields)`、`fields(fields)` | 选择逗号分隔字符串或字段名数组 |
| `limit(count)` | 限制结果数量 |
| `limit(offset, count)` | 设置偏移和结果数量 |
| `index(name)` | 设置由 Adapter 解释的索引提示 |
| `order(order)`、`orderBy(order)` | 设置排序 |
| `conn(connection)` | 绑定 Adapter 连接或 `null` |

### 查询与写入快捷方法

这些方法会创建 Query 并立即执行：

| 签名 | 返回值 |
|---|---|
| `find(...)` | 由重载决定的 Yukari 数组、单个 Yukari、JSON 数据或 `null` |
| `findOne(toJSON?)` | 单个 Yukari、JSON 数据或 `null` |
| `findById(id, toJSON?)` | 主键对应的数据或 `null` |
| `count()` | `Promise<number>` |
| `update(data)` | Adapter 写入结果 |
| `delete()` | Adapter 删除结果 |
| `execute(...args)` | Adapter 原始执行结果 |

直接调用 Model 的 `update()` 或 `delete()` 会创建没有条件的 Query。只想修改部分数据时，应先调用 `where()`。

### 事务与名称映射

| 签名 | 说明 |
|---|---|
| `beginTransaction()` | 让 Adapter 创建事务连接 |
| `commit(connection)` | 提交 Adapter 事务 |
| `rollback(connection)` | 回滚 Adapter 事务 |
| `convertColumnToName(value)` | 将列名字符串、字符串数组或对象转换为逻辑字段名 |
| `getPrimaryKeysName()` | 返回单个主键名、多个主键名或空数组 |
| `getPrimaryKeysColumn()` | 返回单个主键列、多个主键列或空数组 |

## `Query`

Query 构建方法会修改并返回同一个 Query 实例。需要保留之前的配置时，应重新从 Model 开始一条链。

### Query 状态

| 属性 | 说明 |
|---|---|
| `model` | 来源 Model |
| `toshihiko` | 所属 Toshihiko 实例 |
| `adapter` | 创建 Query 时捕获的 Adapter |
| `cache` | 创建 Query 时捕获的 Model Cache |
| `_conn` | 已绑定连接或 `null` |
| `_fields`、`_where`、`_limit`、`_order`、`_index` | 交给 Adapter 的已编译查询状态 |

以下划线开头的属性用于 Adapter 兼容。业务代码应使用 Query 构建方法。

### 查询条件

`where()` 接受 Schema 字段名，并支持递归使用 `$and` 与 `$or`。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

字段运算符会跟随字段值类型：

| 运算符 | 含义 |
|---|---|
| `$eq`、`===` | 等于 |
| `$neq`、`!==` | 不等于 |
| `$gt`、`>` | 大于 |
| `$gte`、`>=` | 大于等于 |
| `$lt`、`<` | 小于 |
| `$lte`、`<=` | 小于等于 |
| `$between` | 包含端点的两值范围 |
| `$in` | 匹配数组中的任意值 |
| `$like` | 由 Adapter 解释的模式匹配 |
| `$and`、`$or` | 组合同一字段的多个值 |

### 排序与数量

```typescript
query.orderBy({ createdAt: 'desc' });
query.order('createdAt DESC, id ASC');
query.limit(20);
query.limit(40, 20);
```

排序方向接受 `'asc'`、`'ASC'`、`'desc'`、`'DESC'` 或数字。字符串和数组形式用于兼容；对象形式能得到最好的字段名检查。

### 读取数据

```typescript
find()
find(options)
find(toJSON, options?)
find(options, toJSON)
```

| 选项 | 默认值 | 效果 |
|---|---:|---|
| `single` | `false` | 返回单条数据或 `null`，而不是数组 |
| `noCache` | `false` | 绕过已配置的 Cache |
| `toJSON` 参数 | `false` | 返回序列化普通对象，而不是 Yukari |

`findOne(toJSON?)` 是单条查询的快捷方法。`findById(id, toJSON?)` 会构造主键条件；配置 Cache 时也会读取 Cache。复合主键需要传入包含各主键字段的对象。

### 执行操作

| 签名 | 返回值 |
|---|---|
| `count()` | `Promise<number>` |
| `update(data)` | Adapter 写入结果 |
| `delete()` | Adapter 删除结果 |
| `execute(...args)` | 使用已绑定连接执行后的 Adapter 结果 |

## `Yukari`

Yukari 是数据行对象。Schema 映射出来的字段会成为实例上的可枚举属性。

### 状态

| 属性 | 说明 |
|---|---|
| `$model`、`$toshihiko`、`$adapter` | 捕获的执行上下文 |
| `$schema` | 编译后的 Model Schema |
| `$source` | `'new'`、`'query'` 或 `'delete'` |
| `$origData` | 查询得到的原值快照 |
| `$dbName`、`$tableName` | 存储位置 |
| `$cache` | 最终使用的 Cache |
| `$fromCache` | 数据是否来自 Cache |

### 方法

| 签名 | 返回值 | 规则 |
|---|---|---|
| `validateOne(name, value)` | `Promise<void>` | 执行指定字段的 validators |
| `validateAll()` | `Promise<void>` | 校验实例上的映射字段 |
| `insert(connection?)` | `Promise<this>` | 只能用于新的 Yukari |
| `update(connection?)` | `Promise<this>` | 不能用于新的 Yukari，并使用原值定位数据 |
| `delete(connection?)` | `Promise<true>` | 不能用于新的 Yukari，并将来源标记为已删除 |
| `save(connection?)` | `Promise<this>` | 新数据执行插入，查询数据执行更新 |
| `toJSON(useOriginalData?)` | 序列化后的 Partial 数据行 | 使用每个 Field Type 的 `toJSON()` 转换 |

`insert()` 完成后，同一个对象仍然表示刚刚构建的新数据。调用 `update()` 或 `delete()` 前，应重新查询这条数据。

## Schema 与 `Field`

### 字段定义

| 属性 | 默认值 | 效果 |
|---|---:|---|
| `name` | 必填 | 业务属性名 |
| `column` | `name` | 存储列名 |
| `type` | `Type.String` | 解析、还原、相等判断和 JSON 行为 |
| `allowNull` | `false` | 将 `null` 加入字段值类型 |
| `primaryKey` | `false` | 将字段加入主键查找 |
| `autoIncrement` | `false` | 标记由存储层生成的值 |
| `defaultValue` | Field Type 默认值 | `build()` 使用的默认值 |
| `validators` | `[]` | 一个 validator 或 validator 数组 |

Validator 成功时不返回内容，失败时返回非空错误信息，也可以返回 Promise。执行 validator 时，`this` 指向 Model。

### 编译后的 `Field`

| 成员 | 说明 |
|---|---|
| `parse(storageValue)` | 将存储数据转换为业务值 |
| `restore(value)` | 将业务值转换为存储值 |
| `equal(left, right)` | 为变更追踪比较两个值 |
| `toJSON(value)` | 将值转换为 JSON 输出 |
| `defaultValue`、`needQuotes` | 解析后的 Field Type 元数据 |

### 内置 `Type`

| Type | 业务值 | 存储与 JSON 行为 |
|---|---|---|
| `Type.String` | `string` | 使用 `String()` 规范化 |
| `Type.Boolean` | `boolean` | 还原为 `0` 或 `1` |
| `Type.Integer` | `number` | 使用 `parseInt()` |
| `Type.Float` | `number` | 使用 `parseFloat()` |
| `Type.Json` | `JsonValue` | 解析并序列化 JSON |
| `Type.Datetime` | `Date` | 还原为 MySQL 风格时间文本，并序列化为 ISO 风格文本 |

自定义 `FieldType<Value, StorageValue, JsonValue>` 必须实现 `parse()` 和 `restore()`。根据需要补充 `equal()`、`toJSON()`、`defaultValue` 与 `needQuotes`。

## Cache 契约

```typescript
interface Cache {
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<void | boolean | 'OK' | null>;

  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void | boolean | number>;

  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void | readonly number[]>;
}
```

`CacheKey` 接受基本类型键、表示复合键的对象，以及由实现解释为表级键的 `null` 或 `undefined`。

`@toshihiko/base-cache` 导出严格对应此契约的抽象 `Cache` 类。Redis 和 Memcached 软件包分别导出具体类与 `create(servers, options?)` 工厂。参见[缓存](caching)和[编写扩展](extensions)。

## Adapter 契约

`@toshihiko/base-adapter` 导出 `Adapter` 基类。具体实现需要提供：

| 方法 | 职责 |
|---|---|
| `find(query, options?)` | 读取一条或多条存储数据 |
| `count(query)` | 统计匹配数量 |
| `updateByQuery(query)` | 更新匹配数据 |
| `deleteByQuery(query)` | 删除匹配数据 |
| `insert(model, connection, data)` | 插入数据，并返回由 Yukari 接收的数据 |
| `update(model, connection, primaryKey, data)` | 更新一个 Yukari |
| `execute(...args)` | 执行 Adapter 特定的原始命令 |
| `getDBName()` | 返回 Cache 使用的数据库命名空间 |
| `beginTransaction()`、`commit()`、`rollback()` | 事务生命周期 |

基类方法会异步拒绝并报告尚未实现。Adapter 泛型参数依次描述选项、Model、连接、Field、值和 Query 边界。

## MySQL Adapter

```typescript
import {
  MySQLAdapter,
  type MySQLAdapterOptions,
  type MySQLConnection,
  type MySQLMutationResult,
  type MySQLQueryResult,
} from '@toshihiko/mysql-adapter';
```

`MySQLAdapterOptions` 继承 `mysql2` 连接池选项，并增加：

| 选项 | 说明 |
|---|---|
| `database` | 数据库名 |
| `user`、`username` | MySQL 用户名；`username` 是兼容写法 |
| `password` | MySQL 密码 |
| `pool` | 已有的 `mysql2/promise` Pool |
| `showSql` | 传 `true` 输出到控制台，或传入接收 SQL 字符串的函数 |
| `package` | 兼容用软件包名 |

```typescript
await database.execute(sql, values);
await database.execute(connection, sql, values);
await User.conn(connection).execute(sql, values);
```

前两种形式使用 `Toshihiko.execute()`，第三种使用 `Query.execute()`。软件包还导出 `MySQLSqlBuilder`，以及 Adapter 所需的 Model、Query、Field、statement、连接池、连接和结果类型。

## SQL 工具

`Escaper.escape()` 和 `Escaper.escapeLike()` 是兼容入口，对应 `@toshihiko/sql-utils` 中的同名函数。

| 函数 | 说明 |
|---|---|
| `escape(value)` | 转义字符串中的引号、控制字符和反斜杠 |
| `escapeLike(value)` | 转义 `%` 与 `_` 通配符 |
| `sqlNameToColumn(sql, map)` | 替换 SQL 片段中的逻辑字段名，同时保留引号内字符串与 SQL 关键字 |

用户可控的值应优先使用 Adapter 参数绑定。转义工具不能替代预处理语句。

## 类型工具

核心软件包导出的类型可以分为以下几组：

| 分类 | 常用导出 |
|---|---|
| Model 推断 | `InferModelRow`、`InferModelPrimaryKey`、`BuildInput`、`BuiltRowFromSchema` |
| 数据行对象 | `Yukari`、`BuiltYukari`、`QueriedYukari`、`YukariSource` |
| Schema | `FieldDefinition`、`FieldType`、`SchemaDefinition`、`RowFromSchema`、`JsonRowFromSchema`、`PrimaryKeyNames` |
| Query | `Query`、`QueryWhere`、`QueryFieldOperators`、`QueryOrder`、`QueryFindOptions`、`FindByIdInput` |
| Adapter | `Adapter`、`AdapterConstructor`、`AdapterConnection`、`AdapterData`、`AdapterQuery`，以及执行和写入结果辅助类型 |
| Cache | `Cache`、`CacheKey`、`CacheSource`、`CacheOptions` 和 Cache 结果类型 |

```typescript
type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```

代码一旦跨过 Adapter 的连接、选项或结果边界，应优先使用具体 Adapter 软件包导出的类型。
