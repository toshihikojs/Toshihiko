<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

interface ReferenceLink {
  readonly href: string;
  readonly label: string;
}

const references: Readonly<Record<string, readonly ReferenceLink[]>> = {
  'api.md': [
    { href: '/typedoc/', label: 'All exports' },
  ],
  'api/adapter.md': [
    { href: '/typedoc/types/toshihiko.Adapter.html', label: 'Adapter contract' },
    { href: '/typedoc/classes/_toshihiko_base-adapter.Adapter.html', label: 'Base Adapter' },
  ],
  'api/cache.md': [
    { href: '/typedoc/interfaces/toshihiko.Cache.html', label: 'Cache contract' },
    { href: '/typedoc/classes/_toshihiko_base-cache.Cache.html', label: 'Base Cache' },
    { href: '/typedoc/classes/_toshihiko_redis-cache.RedisCache.html', label: 'RedisCache' },
    { href: '/typedoc/classes/_toshihiko_memcached-cache.MemcachedCache.html', label: 'MemcachedCache' },
  ],
  'api/field-types.md': [
    { href: '/typedoc/interfaces/toshihiko.Field.html', label: 'Field' },
    { href: '/typedoc/variables/toshihiko.Type.html', label: 'Type' },
  ],
  'api/model.md': [
    { href: '/typedoc/interfaces/toshihiko.Model.html', label: 'Model' },
  ],
  'api/mysql.md': [
    { href: '/typedoc/classes/_toshihiko_mysql-adapter.MySQLAdapter.html', label: 'MySQLAdapter' },
    { href: '/typedoc/classes/_toshihiko_mysql-adapter.MySQLSqlBuilder.html', label: 'MySQLSqlBuilder' },
  ],
  'api/query.md': [
    { href: '/typedoc/interfaces/toshihiko.Query.html', label: 'Query' },
  ],
  'api/sql-utils.md': [
    { href: '/typedoc/modules/_toshihiko_sql-utils.html', label: '@toshihiko/sql-utils' },
  ],
  'api/toshihiko.md': [
    { href: '/typedoc/classes/toshihiko.Toshihiko.html', label: 'Toshihiko' },
  ],
  'api/yukari.md': [
    { href: '/typedoc/interfaces/toshihiko.Yukari.html', label: 'Yukari' },
  ],
};

const copy = {
  en: { label: 'Type definitions', open: 'Open generated reference' },
  ja: { label: '型定義', open: '生成されたリファレンスを開く' },
  zh: { label: '类型定义', open: '查看生成的类型参考' },
} as const;

const { page } = useData();

const locale = computed<keyof typeof copy>(() => {
  if (page.value.relativePath.startsWith('zh/')) return 'zh';
  if (page.value.relativePath.startsWith('ja/')) return 'ja';
  return 'en';
});

const pageKey = computed(() => page.value.relativePath.replace(/^(?:zh|ja)\//, ''));
const links = computed(() => references[pageKey.value] ?? []);
const text = computed(() => copy[locale.value]);
</script>

<template>
  <nav
    v-if="links.length > 0"
    class="api-reference-bridge"
    :aria-label="text.label"
  >
    <span class="api-reference-bridge__copy">
      <strong>{{ text.label }}</strong>
      <span>{{ text.open }}</span>
    </span>
    <span class="api-reference-bridge__links">
      <a
        v-for="link in links"
        :key="link.href"
        :href="withBase(link.href)"
        target="_self"
      >
        {{ link.label }}<span aria-hidden="true"> →</span>
      </a>
    </span>
  </nav>
</template>
