# 缓存

Toshihiko 可以在数据库级或单个 Model 上挂载 Cache。核心包定义 Cache 合约，具体 Adapter 决定查询、回填和失效发生在哪些路径。

```typescript
const cache = new MemcachedCache('127.0.0.1:11211', { prefix: 'app:' });
const database = new Toshihiko('mysql', { cache, database: 'app' });

const CachedUser = database.define('users', userSchema);
const UncachedAudit = database.define('audit', auditSchema, { cache: false });
```

Model 默认继承数据库 Cache，可以传入另一个实例覆盖，也可以使用 `false` 或 `null` 禁用。

## Cache 合约

| 方法 | 用途 |
|---|---|
| `getData(database, table, keys)` | 读取一个或多个缓存行。 |
| `setData(database, table, key, data)` | 写入一行。 |
| `deleteData(database, table, key)` | 删除一个键。 |
| `deleteKeys(database, table, keys)` | 删除多个键。 |

批量读取必须保持输入顺序，并以 `null` 表示 miss。

## 读取与失效

`findById()` 先按主键条件读取 Cache；命中后恢复为查询 Yukari，miss 后继续访问 Adapter。`find({ noCache: true })` 只绕过本次缓存读取。

MySQL Adapter 在更新和删除之前使相关主键失效，并使用 Yukari 的原始定位条件处理主键变化。`findById()` 的缓存读取错误按 miss 处理，数据库和写入错误仍正常向上传播。

## Redis 与 Memcached

```typescript
const redis = new RedisCache('127.0.0.1:6379', { prefix: 'app:' });
const memcached = new MemcachedCache('127.0.0.1:11211', { prefix: 'app:' });
```

两者实现同一合约，但保留各自的客户端选项、批处理、事件和 key 格式。Memcached 可通过 `setCustomizeKeyFunc()` 兼容已有 key 布局。

参见[软件包](packages.md)和[编写扩展](extensions.md)。
