# API reference

The API reference describes the public runtime objects, call signatures, return types, and extension contracts. Use the [guides](getting-started) for task-oriented explanations.

The pages below explain the public API with examples and usage guidance. When you need every exported symbol or an exact generic signature, use the <a href="/Toshihiko/typedoc/" target="_self">complete type index</a>, which is generated from the TypeScript source with an English interface.

## Runtime object map

```text
Toshihiko
└── Model returned by define()
    ├── Query returned by where(), fields(), limit(), order(), and conn()
    └── Yukari returned by build() or a query

Field ── compiles a schema entry and delegates value conversion to Type
```

## Core API

| Reference | What it covers |
|---|---|
| [Toshihiko](api/toshihiko) | Construction, database selection, `define()`, raw execution, and database metadata |
| [Model](api/model) | Schema metadata, custom methods, query entry points, transactions, and helper types |
| [Query](api/query) | Conditions, projection, ordering, limits, execution, overloads, and return types |
| [Yukari](api/yukari) | Row state, validation, persistence, serialization, and lifecycle errors |
| [Field and Type](api/field-types) | Schema entries, compiled fields, built-in types, validators, and custom field types |

## Extension API

These pages are for Adapter and Cache package authors. Applications using a
published Adapter do not need these contracts.

| Reference | Package |
|---|---|
| [Adapter](api/adapter) | `toshihiko` and `@toshihiko/base-adapter` |
| [Cache](api/cache) | `toshihiko`, `@toshihiko/base-cache`, Redis, and Memcached packages |
| [MySQL Adapter](api/mysql) | `@toshihiko/mysql-adapter` |
| [SQL utilities](api/sql-utils) | `@toshihiko/sql-utils` and the compatibility `Escaper` object |

## Reference conventions

- Signatures show the public TypeScript surface. Adapter-specific generics are replaced with descriptive names where that makes the contract easier to read.
- Methods return Promises whenever work can reach an Adapter or Cache.
- `readonly` in a return type describes the TypeScript contract. It does not freeze the runtime value.
- Compatibility aliases are identified explicitly. They remain supported but are not the primary spelling in examples.
- `Model` and `Query` methods that depend on an Adapter preserve that Adapter's connection and result types.

## Package entry points

| Package | Runtime exports |
|---|---|
| `toshihiko` | `Toshihiko`, `Type`, `Adapter`, `Escaper` |
| `@toshihiko/base-adapter` | `Adapter`, `extend` |
| `@toshihiko/base-cache` | `Cache` |
| `@toshihiko/mysql-adapter` | `MySQLAdapter`, `MySQLSqlBuilder` |
| `@toshihiko/redis-cache` | `RedisCache`, `create` |
| `@toshihiko/memcached-cache` | `MemcachedCache`, `create` |
| `@toshihiko/sql-utils` | `escape`, `escapeLike`, `sqlNameToColumn` |

All packages use CommonJS at runtime and publish TypeScript declarations.
