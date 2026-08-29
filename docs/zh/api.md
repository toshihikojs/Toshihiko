# API 参考

本页是 v2 公开 API 的索引。精确泛型和 Adapter 特定 overload 以构建后的 TypeScript 声明为准。

## 运行时导出

| 导出 | 说明 |
|---|---|
| `Toshihiko` | 数据库入口和 Model 工厂。 |
| `Type` | 内置 Field Type。 |
| `Adapter` | Base 与 MySQL Adapter 构造函数兼容入口。 |
| `Escaper` | `escape()` 和 `escapeLike()`。 |

## Toshihiko

主要成员：`adapter`、`cache`、`database`、`dialect`、`options`、`pool`、`define()`、`execute()`、`getAdapter()` 和静态 `createCache()`。

构造参数可以是 dialect 名、Adapter 构造函数或 Adapter 实例；选项类型来自所选 Adapter。

## Model

主要元数据包括 `name`、`parent`、`originalSchema`、`schema`、`primaryKeys`、`autoIncrementField`、名称映射、字段映射和 `cache`。

主要方法包括 `build()`、`where()`、`field()`、`fields()`、`limit()`、`index()`、`order()`、`orderBy()`、`conn()`、`find()`、`findOne()`、`findById()`、`count()`、`update()`、`delete()`、`execute()` 及事务方法。`methods` 中声明的方法会同时加入返回 Model 的类型和运行时对象。

## Query

配置方法 `where()`、`fields()`、`limit()`、`order()`、`index()` 和 `conn()` 修改并返回同一个 Query。执行方法包括 `find()`、`findOne()`、`findById()`、`count()`、`update()`、`delete()` 和 `execute()`。

## Yukari

主要状态包括 `$model`、`$schema`、`$source`、`$origData` 和 `$fromCache`。公开操作包括 `validateOne()`、`validateAll()`、`insert()`、`update()`、`delete()`、`save()` 与 `toJSON()`。Schema 字段会成为 Yukari 属性。

## 公开类型

常用类型包括 `Model`、`Query`、`Yukari`、`BuiltYukari`、`QueriedYukari`、`FieldType`、`FieldDefinition`、`SchemaDefinition`、`RowFromSchema`、`QueryWhere`、`QueryOrder`、`Adapter`、`AdapterConnection`、`Cache`、`CacheKey`、`InferModelRow` 和 `InferModelPrimaryKey`。

参见[定义 Model](model/definition.md)、[查询](querying.md)、[字段类型](types.md)与[编写扩展](extensions.md)。
