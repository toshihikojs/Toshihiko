<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

interface ReferenceLink {
  readonly href: string;
  readonly label: string | Readonly<Record<Locale, string>>;
}

type Locale = 'en' | 'ja' | 'zh';

const references: Readonly<Record<string, readonly ReferenceLink[]>> = {
  'api.md': [
    {
      href: '/typedoc/',
      label: { en: 'All exports', ja: 'すべての export', zh: '全部导出' },
    },
  ],
  'api/adapter.md': [
    {
      href: '/typedoc/types/toshihiko.Adapter.html',
      label: { en: 'Adapter contract', ja: 'Adapter コントラクト', zh: 'Adapter 契约' },
    },
    {
      href: '/typedoc/classes/_toshihiko_base-adapter.Adapter.html',
      label: { en: 'Base Adapter', ja: 'Adapter 基底クラス', zh: 'Adapter 基类' },
    },
  ],
  'api/cache.md': [
    {
      href: '/typedoc/interfaces/toshihiko.Cache.html',
      label: { en: 'Cache contract', ja: 'Cache コントラクト', zh: 'Cache 契约' },
    },
    {
      href: '/typedoc/classes/_toshihiko_base-cache.Cache.html',
      label: { en: 'Base Cache', ja: 'Cache 基底クラス', zh: 'Cache 基类' },
    },
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

const locale = computed<Locale>(() => {
  if (page.value.relativePath.startsWith('zh/')) return 'zh';
  if (page.value.relativePath.startsWith('ja/')) return 'ja';
  return 'en';
});

const pageKey = computed(() => page.value.relativePath.replace(/^(?:zh|ja)\//, ''));
const links = computed(() => references[pageKey.value] ?? []);
const text = computed(() => copy[locale.value]);
const typeReferencePrefix = computed(() => (
  locale.value === 'en' ? '/typedoc' : `/${locale.value}/typedoc`
));

function hrefFor(link: ReferenceLink): string {
  return withBase(link.href.replace('/typedoc', typeReferencePrefix.value));
}

function labelFor(link: ReferenceLink): string {
  return typeof link.label === 'string' ? link.label : link.label[locale.value];
}
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
        :href="hrefFor(link)"
        target="_self"
      >
        {{ labelFor(link) }}<span aria-hidden="true"> →</span>
      </a>
    </span>
  </nav>
</template>
