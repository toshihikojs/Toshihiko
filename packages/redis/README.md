# Toshihiko Redis Cache

[![npm](https://img.shields.io/npm/v/@toshihiko/redis-cache.svg)](https://www.npmjs.com/package/@toshihiko/redis-cache)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/github/toshihikojs/Toshihiko/branch/master/graph/badge.svg?flag=redis-cache)](https://app.codecov.io/github/toshihikojs/Toshihiko/tree/master)

Promise-only Redis cache support for Toshihiko v2, using the `ioredis` Promise API with stable key generation and positional batch results.

## Installation

```bash
npm install toshihiko @toshihiko/redis-cache
```

## Usage

Create the cache and use the Toshihiko cache contract directly:

```typescript
import { RedisCache } from '@toshihiko/redis-cache';

const cache = new RedisCache('127.0.0.1:6379', {
  prefix: 'app:',
});

await cache.setData('app', 'users', 1, { id: 1, name: 'Alice' });
const users = await cache.getData('app', 'users', [1, 2]);
```

`getData()`, `setData()`, `deleteData()`, and `deleteKeys()` return native Promises. Batch cache misses preserve their input positions with `null` values.

## License

MIT
