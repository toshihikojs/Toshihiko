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

  const navigationCopy = {
    en: {
      guide: 'Guide',
      api: 'API reference',
      apiGuide: 'API guide',
      typeReference: 'Type reference',
      language: 'Change language',
      theme: 'Switch color theme',
      github: 'GitHub',
    },
    ja: {
      guide: 'ガイド',
      api: 'API リファレンス',
      apiGuide: 'API の説明',
      typeReference: '型リファレンス',
      language: '言語を変更',
      theme: 'カラーテーマを切り替え',
      github: 'GitHub',
    },
    zh: {
      guide: '指南',
      api: 'API 参考',
      apiGuide: 'API 说明',
      typeReference: '类型定义',
      language: '切换语言',
      theme: '切换颜色主题',
      github: 'GitHub',
    },
  }[locale];
  const toolbar = document.querySelector('.tsd-toolbar-contents');
  const toolbarLinks = document.querySelector('#tsd-toolbar-links');
  const search = document.querySelector('#tsd-search-trigger');

  if (toolbar && toolbarLinks && search) {
    const navigation = document.createElement('nav');
    navigation.className = 'typedoc-site-nav';
    navigation.setAttribute('aria-label', 'Main Navigation');
    navigation.innerHTML = [
      `<a class="typedoc-site-nav__link" href="${typeReferenceBase}getting-started">${navigationCopy.guide}</a>`,
      '<details class="typedoc-site-nav__menu typedoc-site-nav__menu--current">',
      `<summary>${navigationCopy.api}<span class="typedoc-site-nav__caret" aria-hidden="true"></span></summary>`,
      '<span class="typedoc-site-nav__popover">',
      `<a href="${typeReferenceBase}api">${navigationCopy.apiGuide}</a>`,
      `<a aria-current="page" href="${typeReferenceByLocale[locale]}">${navigationCopy.typeReference}</a>`,
      '</span>',
      '</details>',
      `<a class="typedoc-site-nav__link typedoc-site-nav__github-text" href="https://github.com/toshihikojs/Toshihiko">${navigationCopy.github}<span aria-hidden="true"> ↗</span></a>`,
      '<details class="typedoc-site-nav__menu typedoc-site-nav__language">',
      `<summary aria-label="${navigationCopy.language}">`,
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h9M9.5 4v3c0 4.1-2.2 7.5-5.5 9.5M7 11.5c1.5 2.3 3.5 4.1 6 5.2M14 20l4-9 4 9M15.5 17h5"/></svg>',
      '<span class="typedoc-site-nav__caret" aria-hidden="true"></span>',
      '</summary>',
      '<span class="typedoc-site-nav__popover typedoc-site-nav__language-menu">',
      `<a${locale === 'en' ? ' aria-current="page"' : ''} href="${typeReferenceByLocale.en}">English</a>`,
      `<a${locale === 'zh' ? ' aria-current="page"' : ''} href="${typeReferenceByLocale.zh}">中文</a>`,
      `<a${locale === 'ja' ? ' aria-current="page"' : ''} href="${typeReferenceByLocale.ja}">日本語</a>`,
      '</span>',
      '</details>',
      `<button class="typedoc-theme-switch" type="button" role="switch" aria-label="${navigationCopy.theme}">`,
      '<span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.25"/><path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg></span>',
      '</button>',
      `<a class="typedoc-site-nav__github-icon" href="https://github.com/toshihikojs/Toshihiko" aria-label="${navigationCopy.github}">`,
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.3-2.2-.3-4.6-1.1-4.6-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.6.7.7 1 1.6 1 2.6 0 3.7-2.3 4.5-4.6 4.7.4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z"/></svg>',
      '</a>',
    ].join('');
    toolbar.insertBefore(navigation, search);
    document.body.classList.add('typedoc-nav-enhanced');

    const themeSwitch = navigation.querySelector('.typedoc-theme-switch');
    const themeSelect = document.querySelector('#tsd-theme');
    const updateThemeSwitch = () => {
      const setting = document.documentElement.dataset.theme || 'os';
      const dark = setting === 'dark' || (
        setting === 'os' && window.matchMedia('(prefers-color-scheme: dark)').matches
      );
      themeSwitch?.setAttribute('aria-checked', String(dark));
    };
    themeSwitch?.addEventListener('click', () => {
      const dark = themeSwitch.getAttribute('aria-checked') === 'true';
      const next = dark ? 'light' : 'dark';
      if (themeSelect) {
        themeSelect.value = next;
        themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        localStorage.setItem('tsd-theme', next);
        document.documentElement.dataset.theme = next;
      }
      updateThemeSwitch();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeSwitch);
    updateThemeSwitch();

    document.addEventListener('click', (event) => {
      for (const menu of navigation.querySelectorAll('details[open]')) {
        if (!menu.contains(event.target)) menu.removeAttribute('open');
      }
    });
  }

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
