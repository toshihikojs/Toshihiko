# Testing

## Local checks

Install the Rush version declared by the repository, then install the workspace:

```bash
npm install --global @microsoft/rush@5.172.1
rush update
```

Run the normal verification sequence:

```bash
rush check
rush build
rush typecheck
rush test
```

These tests use package entry points and local test doubles. They do not require Docker or external services.

## Package coverage

Every package owns a `test:coverage` script and writes its report to `coverage/lcov.info`:

```bash
rush test:coverage
```

GitHub Actions uploads the seven reports as separate Codecov components. The coverage badge in each package README points to its matching component rather than the repository-wide aggregate.

The CI job prefixes each LCOV source path with its package directory before upload. This prevents identically named files such as `src/index.ts` from different packages from being merged into one Codecov file.

## Service-backed integration

GitHub Actions runs integration tests against MySQL 5.7 and 8.4, Redis, and Memcached. If compatible services are already available locally, run:

```bash
MYSQL_DATABASE=toshihiko_test \
MYSQL_HOST=127.0.0.1 \
MYSQL_PASSWORD=toshihiko \
MYSQL_PORT=3306 \
MYSQL_USER=root \
REDIS_HOST=127.0.0.1 \
REDIS_PORT=6379 \
MEMCACHED_HOST=127.0.0.1 \
MEMCACHED_PORT=11211 \
rush test:integration
```

Unit coverage and service integration prove different things. A package badge describes the code exercised by its coverage command; it does not claim that a local MySQL, Redis, or Memcached service was used.
