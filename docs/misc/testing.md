# Testing Baseline

> [!IMPORTANT]
> Local tests do not require Docker, MySQL, Redis, or Memcached. GitHub Actions owns service-container startup and runs the integration suite against pinned service versions.

## Local Checks

Install the locked dependency tree without running legacy lifecycle hooks:

```console
$ npm ci --ignore-scripts
```

Run the unit and TypeScript declaration tests:

```console
$ npm test
```

Run the remaining static checks when preparing a change:

```console
$ npm run lint
$ npm run validate
```

## GitHub Actions Integration

The `CI` workflow runs on every push to `master`, every pull request, and manual dispatch. Its integration jobs use GitHub Actions service containers; contributors do not need to install Docker locally.

| Service | Pinned image | Coverage |
|---------|--------------|----------|
| MySQL | `mysql:5.7.44` | Both `mysql` and `mysql2` drivers, SQL generation, reads, writes, transactions, and cache invalidation |
| Redis | `redis:7.2.5-alpine` | Published `toshihiko-redis@0.0.8` key, hit, miss, and delete behavior |
| Memcached | `memcached:1.6.29-alpine` | Published `toshihiko-memcached` key, hit, miss, delete, and ORM cache behavior |

The supported Node.js baseline is Node.js 22 and 24. The unit and integration jobs run against both versions.

## Frozen Cache Differences

The legacy cache plugins share method names but not identical result semantics. The integration suite intentionally records these differences before the 2.x contract is introduced.

| Request | Memcached 1.x | Redis 0.0.8 |
|---------|---------------|-------------|
| `[missing, hit]` | `[hit]` | `[null, hit]` |
| `[deleted]` | `[]` | `[null]` |
| Compound key fields | Sorted and abbreviated | Object enumeration order and full field names |

Changing one of these expectations requires an explicit compatibility decision. It must not happen as an incidental part of the TypeScript rewrite.

## External Boundary

Aliyun OCS is not emulated in GitHub Actions. Its authentication and server behavior require a real external service. The workflow therefore makes no automated claim about OCS; its existing source behavior remains a separately documented external boundary.
