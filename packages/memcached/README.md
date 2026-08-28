# Toshihiko Memcached Cache

[![npm](https://img.shields.io/npm/v/@toshihiko/memcached-cache.svg)](https://www.npmjs.com/package/@toshihiko/memcached-cache)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Repository coverage](https://coveralls.io/repos/github/toshihikojs/Toshihiko/badge.svg?branch=v2)](https://coveralls.io/github/toshihikojs/Toshihiko?branch=v2)

Promise-only Memcached support for Toshihiko v2. It preserves the v1 key generation, batched reads, connection events, and custom key function.

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
