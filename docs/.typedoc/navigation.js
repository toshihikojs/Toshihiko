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

  const page = window.location.pathname.slice(markerIndex + marker.length) || 'index.html';
  const guide = guideByPage[page];
  const heading = document.querySelector('.col-content h1');
  if (!guide || !heading) return;

  const siteBase = window.location.pathname.slice(0, markerIndex + 1);
  const bridge = document.createElement('nav');
  bridge.className = 'typedoc-guide-bridge';
  bridge.setAttribute('aria-label', 'Usage guides');
  bridge.innerHTML = [
    '<span class="typedoc-guide-bridge__copy">',
    '<strong>Usage guide</strong>',
    '<span>Examples, behavior, and practical notes</span>',
    '</span>',
    '<span class="typedoc-guide-bridge__links">',
    `<a href="${siteBase}${guide}">English →</a>`,
    `<a href="${siteBase}zh/${guide}">中文 →</a>`,
    `<a href="${siteBase}ja/${guide}">日本語 →</a>`,
    '</span>',
  ].join('');

  heading.parentElement?.insertBefore(bridge, heading);
})();
