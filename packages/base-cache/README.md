# Toshihiko Base Cache

[![npm](https://img.shields.io/npm/v/@toshihiko/base-cache.svg)](https://www.npmjs.com/package/@toshihiko/base-cache)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/github/toshihikojs/Toshihiko/branch/v2/graph/badge.svg?flag=base-cache)](https://app.codecov.io/github/toshihikojs/Toshihiko)

The Promise-only, typed foundation for Toshihiko v2 cache implementations.

## Installation

```bash
npm install @toshihiko/base-cache toshihiko
```

Node.js 22 or newer is required.

## Implementing a Cache

Extend `Cache` and implement the four Toshihiko cache operations. The base class supplies the event emitter behavior used by the v1 Redis and Memcached implementations, but does not impose key generation, batching, or option handling.

```typescript
import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';

interface UserRow {
  id: number;
  name: string;
}

class MemoryCache extends Cache {
  async getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<Value[]> {
    return [];
  }

  async setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<void> {}

  async deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void> {}

  async deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void> {}
}
```

## License

MIT
