# Toshihiko Memcached Cache

[![npm](https://img.shields.io/npm/v/@toshihiko/memcached-cache.svg)](https://www.npmjs.com/package/@toshihiko/memcached-cache)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/github/toshihikojs/Toshihiko/branch/v2/graph/badge.svg?flag=memcached-cache)](https://app.codecov.io/github/toshihikojs/Toshihiko/tree/v2)

Promise-only Memcached support for Toshihiko v2, with stable key generation, batched reads, connection events, and custom key functions.

## Installation

```bash
npm install toshihiko @toshihiko/mysql-adapter @toshihiko/memcached-cache
```

## Usage

```typescript
import { MemcachedCache } from '@toshihiko/memcached-cache';
import { MySQLAdapter } from '@toshihiko/mysql-adapter';
import { Toshihiko } from 'toshihiko';

const cache = new MemcachedCache('127.0.0.1:11211', {
  prefix: 'app:',
});

const database = new Toshihiko(MySQLAdapter, {
  cache,
  database: 'app',
});
```

All cache operations return native Promises. `failure` and `reconnecting` events from the underlying client are forwarded by the cache instance.

Custom key generation remains available through `setCustomizeKeyFunc()` or the `customizeKey` constructor option.

## License

MIT
