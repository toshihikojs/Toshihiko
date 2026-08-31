(() => {
  const guideByPage = {
    'index.html': 'api',
    'classes/_toshihiko_base-adapter.Adapter.html': 'api/adapter',
    'classes/_toshihiko_base-cache.Cache.html': 'api/cache',
    'classes/_toshihiko_memcached-cache.MemcachedCache.html': 'api/cache',
    'classes/_toshihiko_mysql-adapter.MySQLAdapter.html': 'api/mysql',
    'classes/_toshihiko_mysql-adapter.MySQLSqlBuilder.html': 'api/mysql',
    'classes/_toshihiko_redis-cache.RedisCache.html': 'api/cache',
    'classes/toshihiko.Toshihiko.html': 'api/toshihiko',
    'interfaces/toshihiko.Cache.html': 'api/cache',
    'interfaces/toshihiko.Field.html': 'api/field-types',
    'interfaces/toshihiko.Model.html': 'api/model',
    'interfaces/toshihiko.Query.html': 'api/query',
    'interfaces/toshihiko.Yukari.html': 'api/yukari',
    'modules/_toshihiko_sql-utils.html': 'api/sql-utils',
    'types/toshihiko.Adapter.html': 'api/adapter',
    'variables/toshihiko.Type.html': 'api/field-types',
  };

  const marker = '/typedoc/';
  const markerIndex = window.location.pathname.indexOf(marker);
  if (markerIndex < 0) return;

  const typeReferenceBase = window.location.pathname.slice(0, markerIndex + 1);
  const locale = typeReferenceBase.endsWith('/zh/')
    ? 'zh'
    : typeReferenceBase.endsWith('/ja/')
      ? 'ja'
      : 'en';
  const siteBase = locale === 'en'
    ? typeReferenceBase
    : typeReferenceBase.slice(0, -3);
  const page = window.location.pathname.slice(markerIndex + marker.length) || 'index.html';
  const pageSuffix = page === 'index.html' ? '' : page;
  const typeReferenceByLocale = {
    en: `${siteBase}typedoc/${pageSuffix}`,
    zh: `${siteBase}zh/typedoc/${pageSuffix}`,
    ja: `${siteBase}ja/typedoc/${pageSuffix}`,
  };
  const localeByLabel = {
    English: 'en',
    中文: 'zh',
    日本語: 'ja',
  };

  document.querySelectorAll('#tsd-toolbar-links a, #tsd-sidebar-links a').forEach((link) => {
    const targetLocale = localeByLabel[link.textContent?.trim()];
    if (targetLocale) link.href = typeReferenceByLocale[targetLocale];
  });

  const guide = guideByPage[page];
  const heading = document.querySelector('.col-content h1');
  if (!guide || !heading) return;

  const copy = {
    en: {
      label: 'Usage guides',
      title: 'Usage guide',
      description: 'Examples, behavior, and practical notes',
    },
    ja: {
      label: '利用ガイド',
      title: '利用ガイド',
      description: '使用例、動作、実践上の注意',
    },
    zh: {
      label: '使用指南',
      title: '使用指南',
      description: '示例、行为与实用说明',
    },
  }[locale];
  const bridge = document.createElement('nav');
  bridge.className = 'typedoc-guide-bridge';
  bridge.setAttribute('aria-label', copy.label);
  bridge.innerHTML = [
    '<span class="typedoc-guide-bridge__copy">',
    `<strong>${copy.title}</strong>`,
    `<span>${copy.description}</span>`,
    '</span>',
    '<span class="typedoc-guide-bridge__links">',
    `<a href="${siteBase}${guide}">English →</a>`,
    `<a href="${siteBase}zh/${guide}">中文 →</a>`,
    `<a href="${siteBase}ja/${guide}">日本語 →</a>`,
    '</span>',
  ].join('');

  heading.parentElement?.insertBefore(bridge, heading);
})();
