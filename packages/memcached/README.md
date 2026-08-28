# Toshihiko Memcached Cache

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
