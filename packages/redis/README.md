# Toshihiko Redis Cache

Promise-only Redis cache support for Toshihiko v2. It preserves the v1 key format and cache result behavior while using the current `ioredis` Promise API.

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

`getData()`, `setData()`, `deleteData()`, and `deleteKeys()` return native Promises. Cache misses retain the positional `null` values returned by the v1 Redis implementation.

## License

MIT
