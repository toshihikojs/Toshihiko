# Toshihiko

> Toshihiko v2 采用 Rush + PNPM monorepo。源码集中维护，但每个 npm package 仍保留独立的名称、版本和发布边界。

## Packages

| 目录 | npm package | 职责 |
|---|---|---|
| `packages/toshihiko` | `toshihiko` | ORM Core、Model、Query、Yukari 和字段类型 |
| `packages/base-adapter` | `@toshihiko/base-adapter` | Promise-only Adapter 基础契约 |
| `packages/mysql-adapter` | `@toshihiko/mysql-adapter` | 基于 `mysql2` Promise API 的 MySQL Adapter |
| `packages/sql-utils` | `@toshihiko/sql-utils` | SQL 名称映射与转义工具 |

## Development

项目要求 Node.js 22 或 24。Rush 会固定并管理仓库使用的 PNPM 版本。

```bash
rush update
rush build
rush test
```

真实 MySQL 集成测试通过 GitHub Actions 在 MySQL 5.7 和 MySQL 8.4 上运行，本地开发不需要安装 Docker。

## Versioning

Toshihiko v2 相关 package 使用独立版本号，并统一锁定 major 版本为 2。`@toshihiko/sql-utils` 保持独立的 1.x 版本线。一个 Adapter 的修复不会强制 Core 同时发布。

## License

MIT
