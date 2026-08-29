# 软件包

Monorepo 中的每个软件包都有独立的公开 API 和发布边界。

| 软件包 | 用途 |
|---|---|
| `toshihiko` | Model、Query、Yukari、Field Type 与公共合约。 |
| `@toshihiko/mysql-adapter` | 基于 `mysql2` Promise Pool 的 MySQL Adapter。 |
| `@toshihiko/base-adapter` | 编写 Adapter 的基类与工具。 |
| `@toshihiko/redis-cache` | 基于 `ioredis` 的 Redis Cache。 |
| `@toshihiko/memcached-cache` | Memcached Cache。 |
| `@toshihiko/base-cache` | 带事件能力的 Cache 基类。 |
| `@toshihiko/sql-utils` | SQL 名称映射和转义工具。 |

## 核心与 MySQL

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

MySQL Adapter 负责连接池、绑定值、SQL 生成、插入回读、事务、缓存联动和 SQL 日志；CI 覆盖 MySQL 5.7 与 8.4。安装后可以使用 `new Toshihiko('mysql', options)`，也可以注入 `MySQLAdapter`。

## Cache 软件包

```bash
npm install @toshihiko/redis-cache
# 或
npm install @toshihiko/memcached-cache
```

Base 软件包主要面向扩展作者，普通应用通常只需要核心、一个具体 Adapter，以及可选的一个具体 Cache。

## SQL Utils

`@toshihiko/sql-utils` 导出 `sqlNameToColumn()`、`escape()` 与 `escapeLike()`。驱动支持绑定参数时，应优先使用绑定参数而不是手动转义。
