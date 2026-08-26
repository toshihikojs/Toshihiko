# Toshihiko Base Adapter

[![CI](https://github.com/toshihikojs/base-adapter/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/base-adapter/actions/workflows/ci.yml)

The Promise-only, typed foundation for Toshihiko v2 database adapters.

## Installation

```bash
npm install @toshihiko/base-adapter toshihiko
```

Node.js 22 or newer is required.

## Implementing an Adapter

Pass only the Adapter's public options type to the base class. Concrete method signatures remain the single source of truth for database-specific queries, connections, and results. Every inherited operation returns a native Promise. Operations that are not overridden reject with `AdapterNotImplementedError`.

```typescript
import {
  Adapter,
  type AdapterFindOptions,
  type AdapterQuery,
  type AdapterRow,
} from '@toshihiko/base-adapter';

interface MyModel {
  readonly name: string;
}

interface MyAdapterOptions {
  readonly database: string;
}

class MyAdapter extends Adapter<MyAdapterOptions> {
  override async find(
    query: AdapterQuery<MyModel>,
    options?: AdapterFindOptions,
  ): Promise<readonly AdapterRow[] | AdapterRow | null> {
    return options?.single ? null : [];
  }

  override getDBName(): string {
    return this.options.database;
  }
}
```

The adapter constructor can then be passed directly to Toshihiko:

```typescript
import { Toshihiko } from 'toshihiko';

const toshihiko = new Toshihiko(MyAdapter, { database: 'app' });
```

## Merging Options

`extend` deep-merges plain own properties without mutating either input. Arrays and dates are cloned, and prototype-pollution keys are ignored.

```typescript
import { extend } from '@toshihiko/base-adapter';

const defaults = { host: 'localhost', pool: { size: 10 } };
const options = { pool: { size: 20 } };

const merged = extend(defaults, options);
// { host: 'localhost', pool: { size: 20 } }
```

## Contributing

Feel free to submit issues and pull requests to improve this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
