# 编写扩展

Toshihiko 为数据库 Adapter 和 Cache 暴露了类型化合约。可复用扩展应基于 Base 软件包；应用内部的小型实现也可以直接实现核心接口。

## 编写 Adapter

```typescript
import {
  Adapter,
  type AdapterFindOptions,
  type AdapterQuery,
  type AdapterRow,
} from '@toshihiko/base-adapter';

interface ExampleOptions {
  readonly database: string;
}

class ExampleAdapter extends Adapter<ExampleOptions> {
  override async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<readonly AdapterRow[] | AdapterRow | null> {
    const rows = await runDatabaseQuery(query);
    return options?.single ? rows[0] ?? null : rows;
  }

  override getDBName(): string {
    return this.options.database;
  }
}
```

```typescript
const database = new Toshihiko(ExampleAdapter, { database: 'app' });
```

Toshihiko 使用 `(toshihiko, options)` 调用构造函数。Adapter 可以实现 `find`、`count`、`insert`、`update`、`updateByQuery`、`deleteByQuery`、`execute` 和事务方法；未覆盖的 Base 方法会以未实现错误失败。

泛型可以分别声明 Model、Connection、Field、Value、Query 和操作返回值。`define()` 会验证核心 Model 与 Query 是否满足这些合约。

## 编写 Cache

```typescript
class MemoryCache extends Cache {
  async getData<Value extends object>(database, table, keys) {
    return readValues<Value>(database, table, keys);
  }

  async setData<Value extends object>(database, table, key, data) {
    writeValue(database, table, key, data);
  }

  async deleteData(database, table, key) {
    deleteValue(database, table, key);
  }

  async deleteKeys(database, table, keys) {
    for (const key of keys) deleteValue(database, table, key);
  }
}
```

Base Cache 提供事件能力，不规定 key、序列化、批处理、过期或客户端构造。`getData()` 必须保持 key 顺序，并以 `null` 表示 miss。

## 测试扩展

扩展至少需要类型测试、成功与异常单元测试、真实服务集成测试，以及通过构建后 package entry 的消费者编译测试。源码内部通过并不能证明发布声明和 CommonJS 入口正确。
