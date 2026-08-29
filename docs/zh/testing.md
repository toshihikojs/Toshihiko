# 开发与测试

## 本地验证

```bash
npm install --global @microsoft/rush@5.172.1
rush update
rush check
rush build
rush typecheck
rush test
```

普通单元测试和 package entry 测试不需要 Docker 或外部服务。

## 覆盖率

```bash
rush test:coverage
```

每个软件包生成自己的 `coverage/lcov.info`，CI 以独立 Codecov flag 上传，避免不同包中同名源码文件被错误合并。覆盖率只能证明相应命令执行到的代码，不表示使用了真实 MySQL、Redis 或 Memcached。

## 服务集成

CI 在 MySQL 5.7、MySQL 8.4、Redis 和 Memcached 上运行集成测试。本机已有兼容服务时，可设置 `MYSQL_*`、`REDIS_*`、`MEMCACHED_*` 环境变量并执行：

```bash
rush test:integration
```

公开行为改动应同时更新类型测试、运行回归和 package consumer。发布相关改动还需要 Rush change file。
