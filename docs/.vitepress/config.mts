import { defineConfig, type DefaultTheme } from 'vitepress';

const repository = 'https://github.com/toshihikojs/Toshihiko';

interface LocaleText {
  readonly applicationApi: string;
  readonly api: string;
  readonly apiGuide: string;
  readonly apiAdapter: string;
  readonly apiCache: string;
  readonly apiFieldTypes: string;
  readonly apiModel: string;
  readonly apiMysql: string;
  readonly apiQuery: string;
  readonly apiSqlUtils: string;
  readonly apiToshihiko: string;
  readonly apiYukari: string;
  readonly cache: string;
  readonly concepts: string;
  readonly development: string;
  readonly extensions: string;
  readonly extensionApi: string;
  readonly guide: string;
  readonly home: string;
  readonly migration: string;
  readonly model: string;
  readonly modelDefinition: string;
  readonly modelUsage: string;
  readonly packages: string;
  readonly querying: string;
  readonly rawSql: string;
  readonly start: string;
  readonly transactions: string;
  readonly typeReference: string;
  readonly types: string;
  readonly yukari: string;
}

const english: LocaleText = {
  applicationApi: 'Application API',
  api: 'API reference',
  apiGuide: 'Guides and examples',
  apiAdapter: 'Adapter',
  apiCache: 'Cache',
  apiFieldTypes: 'Field and Type',
  apiModel: 'Model',
  apiMysql: 'MySQL Adapter',
  apiQuery: 'Query',
  apiSqlUtils: 'SQL utilities',
  apiToshihiko: 'Toshihiko',
  apiYukari: 'Yukari',
  cache: 'Caching',
  concepts: 'Core concepts',
  development: 'Development and testing',
  extensions: 'Writing extensions',
  extensionApi: 'Extension API',
  guide: 'Guide',
  home: 'Home',
  migration: 'Migrating from v1',
  model: 'Models and data',
  modelDefinition: 'Defining models',
  modelUsage: 'Using models',
  packages: 'Packages',
  querying: 'Querying',
  rawSql: 'Raw SQL',
  start: 'Getting started',
  transactions: 'Transactions',
  typeReference: 'Type definitions',
  types: 'Field types',
  yukari: 'Yukari rows',
};

const chinese: LocaleText = {
  applicationApi: '应用 API',
  api: 'API 参考',
  apiGuide: '说明与示例',
  apiAdapter: 'Adapter',
  apiCache: 'Cache',
  apiFieldTypes: 'Field 与 Type',
  apiModel: 'Model',
  apiMysql: 'MySQL Adapter',
  apiQuery: 'Query',
  apiSqlUtils: 'SQL 工具',
  apiToshihiko: 'Toshihiko',
  apiYukari: 'Yukari',
  cache: '缓存',
  concepts: '核心概念',
  development: '开发与测试',
  extensions: '编写扩展',
  extensionApi: '扩展 API',
  guide: '指南',
  home: '首页',
  migration: '从 v1 升级',
  model: 'Model 与数据',
  modelDefinition: '定义 Model',
  modelUsage: '使用 Model',
  packages: '软件包',
  querying: '查询',
  rawSql: '原始 SQL',
  start: '快速开始',
  transactions: '事务',
  typeReference: '类型定义',
  types: '字段类型',
  yukari: 'Yukari 数据行',
};

const japanese: LocaleText = {
  applicationApi: 'アプリケーション API',
  api: 'API リファレンス',
  apiGuide: '説明と使用例',
  apiAdapter: 'Adapter',
  apiCache: 'Cache',
  apiFieldTypes: 'Field と Type',
  apiModel: 'Model',
  apiMysql: 'MySQL Adapter',
  apiQuery: 'Query',
  apiSqlUtils: 'SQL ユーティリティ',
  apiToshihiko: 'Toshihiko',
  apiYukari: 'Yukari',
  cache: 'キャッシュ',
  concepts: 'コアコンセプト',
  development: '開発とテスト',
  extensions: '拡張機能の作成',
  extensionApi: '拡張 API',
  guide: 'ガイド',
  home: 'ホーム',
  migration: 'v1 からの移行',
  model: 'Model とデータ',
  modelDefinition: 'Model の定義',
  modelUsage: 'Model の使用',
  packages: 'パッケージ',
  querying: 'クエリ',
  rawSql: 'Raw SQL',
  start: 'はじめに',
  transactions: 'トランザクション',
  typeReference: '型定義',
  types: 'フィールド型',
  yukari: 'Yukari 行',
};

function withPrefix(prefix: string, path: string): string {
  return prefix === '' ? path : `${prefix}${path}`;
}

function theme(prefix: string, text: LocaleText): DefaultTheme.Config {
  return {
    logo: '/logo.png',
    editLink: {
      pattern: `${repository}/edit/v2/docs/:path`,
      text: prefix === '/zh'
        ? '在 GitHub 上编辑此页'
        : prefix === '/ja'
          ? 'GitHub でこのページを編集'
          : 'Edit this page on GitHub',
    },
    footer: {
      copyright: 'Copyright © Toshihiko contributors',
      message: 'Released under the MIT License.',
    },
    nav: [
      { text: text.guide, link: withPrefix(prefix, '/getting-started') },
      {
        text: text.api,
        activeMatch: '^/(?:zh/|ja/)?api(?:/|$)|^/typedoc/',
        items: [
          { text: text.apiGuide, link: withPrefix(prefix, '/api') },
          { text: text.typeReference, link: '/typedoc/' },
        ],
      },
      { text: 'GitHub', link: repository },
    ],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    sidebar: [
      {
        text: text.guide,
        items: [
          { text: text.home, link: withPrefix(prefix, '/') },
          { text: text.start, link: withPrefix(prefix, '/getting-started') },
          { text: text.concepts, link: withPrefix(prefix, '/concepts') },
        ],
      },
      {
        text: text.model,
        items: [
          { text: text.modelDefinition, link: withPrefix(prefix, '/model/definition') },
          { text: text.modelUsage, link: withPrefix(prefix, '/model/usage') },
          { text: text.querying, link: withPrefix(prefix, '/querying') },
          { text: text.yukari, link: withPrefix(prefix, '/yukari') },
          { text: text.types, link: withPrefix(prefix, '/types') },
        ],
      },
      {
        text: prefix === '/zh' ? '进阶指南' : prefix === '/ja' ? '高度なガイド' : 'Advanced guides',
        items: [
          { text: text.transactions, link: withPrefix(prefix, '/transactions') },
          { text: text.rawSql, link: withPrefix(prefix, '/raw-sql') },
          { text: text.cache, link: withPrefix(prefix, '/caching') },
          { text: text.packages, link: withPrefix(prefix, '/packages') },
          { text: text.extensions, link: withPrefix(prefix, '/extensions') },
        ],
      },
      {
        text: text.applicationApi,
        items: [
          { text: text.api, link: withPrefix(prefix, '/api') },
          { text: text.apiToshihiko, link: withPrefix(prefix, '/api/toshihiko') },
          { text: text.apiModel, link: withPrefix(prefix, '/api/model') },
          { text: text.apiQuery, link: withPrefix(prefix, '/api/query') },
          { text: text.apiYukari, link: withPrefix(prefix, '/api/yukari') },
          { text: text.apiFieldTypes, link: withPrefix(prefix, '/api/field-types') },
          { text: text.typeReference, link: '/typedoc/' },
        ],
      },
      {
        text: text.extensionApi,
        items: [
          { text: text.apiAdapter, link: withPrefix(prefix, '/api/adapter') },
          { text: text.apiCache, link: withPrefix(prefix, '/api/cache') },
          { text: text.apiMysql, link: withPrefix(prefix, '/api/mysql') },
          { text: text.apiSqlUtils, link: withPrefix(prefix, '/api/sql-utils') },
        ],
      },
      {
        text: prefix === '/zh' ? '迁移与开发' : prefix === '/ja' ? '移行と開発' : 'Migration and development',
        items: [
          { text: text.migration, link: withPrefix(prefix, '/migration-v1') },
          { text: text.development, link: withPrefix(prefix, '/testing') },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repository }],
  };
}

export default defineConfig({
  base: '/Toshihiko/',
  cleanUrls: true,
  description: 'Yet another simple ORM for Node.js.',
  head: [['link', { href: '/Toshihiko/logo.png', rel: 'icon', type: 'image/png' }]],
  ignoreDeadLinks: [/^\/typedoc(?:\/|$)/],
  lastUpdated: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: theme('', english),
      title: 'Toshihiko',
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: theme('/zh', chinese),
      title: 'Toshihiko',
    },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja/',
      themeConfig: theme('/ja', japanese),
      title: 'Toshihiko',
    },
  },
  markdown: {
    theme: { dark: 'github-dark-default', light: 'github-light-default' },
  },
  sitemap: { hostname: 'https://toshihikojs.github.io/Toshihiko/' },
  srcExclude: ['**/README.md'],
});
