# API 参考

API 参考按使用者分为两层。业务代码从应用 API 开始；只有编写数据库或缓存扩展时，才需要扩展 API。

以下页面按使用场景解释公开 API，并提供参数说明和示例。需要查找全部导出符号或精确的泛型签名时，可以打开由 TypeScript 源码生成的[完整类型索引](/typedoc/)。

## 应用 API

```text
Toshihiko
└── define() 返回 Model
    ├── where() 等方法返回 Query
    └── build() 或查询返回 Yukari
```

| 页面 | 内容 |
|---|---|
| [Toshihiko](api/toshihiko) | 初始化数据库、`define()`、原始执行与数据库信息 |
| [Model](api/model) | Schema 元数据、自定义方法、查询入口和事务 |
| [Query](api/query) | 条件、字段、排序、限制、读取与批量写入 |
| [Yukari](api/yukari) | 数据行、校验、持久化和序列化 |
| [Field 与 Type](api/field-types) | Schema 定义、内置类型、校验器与自定义类型 |

## 扩展 API

以下页面面向 Adapter 与 Cache 开发者。使用现成 Adapter 的应用不需要接触这些契约。

| 页面 | 软件包 |
|---|---|
| [Adapter](api/adapter) | `toshihiko`、`@toshihiko/base-adapter` |
| [Cache](api/cache) | Cache 契约、基础类、Redis 与 Memcached |
| [MySQL Adapter](api/mysql) | `@toshihiko/mysql-adapter` |
| [SQL 工具](api/sql-utils) | `@toshihiko/sql-utils` |

## 阅读约定

- 签名描述公开的 TypeScript 接口。
- 可能访问数据库或缓存的方法都返回 Promise。
- `readonly` 是类型契约，不表示运行时冻结。
- 兼容别名会单独标出；示例优先使用主要写法。
