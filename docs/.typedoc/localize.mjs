import { Renderer } from 'typedoc';

const localeTags = new Set(['@zh', '@ja']);
const generatedCategoryNames = {
  zh: { 'Advanced types': '高级类型' },
  ja: { 'Advanced types': '高度な型' },
};

function textOf(parts) {
  return (parts ?? []).map((part) => part.text).join('');
}

function cloneParts(parts) {
  return parts.map((part) => ({ ...part }));
}

function hasProse(parts) {
  return (parts ?? []).some((part) => part.kind === 'text' && /\S/.test(part.text));
}

function localizedFollowers(tags, start) {
  const localized = new Map();
  let next = start;
  while (next < tags.length && localeTags.has(tags[next].tag)) {
    localized.set(tags[next].tag, tags[next].content);
    next += 1;
  }
  return { localized, next };
}

function parameterTargets(reflection) {
  return [
    ...(reflection.parameters ?? []),
    ...(reflection.typeParameters ?? []),
  ];
}

function parameterTagTarget(tag, targets) {
  if (!localeTags.has(tag.tag)) return null;
  const match = textOf(tag.content).match(/^([^\s]+)\s+-\s*/);
  if (!match) return null;
  const target = targets.find((candidate) => candidate.name === match[1]);
  return target ? { match, target } : null;
}

function stripParameterName(content, prefixLength) {
  const result = cloneParts(content);
  let remaining = prefixLength;
  for (const part of result) {
    if (remaining === 0) break;
    const removed = Math.min(remaining, part.text.length);
    part.text = part.text.slice(removed);
    remaining -= removed;
  }
  return result.filter((part) => part.text.length > 0);
}

function remember(catalog, localeTag, source, localized) {
  if (!hasProse(source)) return;
  const locale = localeTag.slice(1);
  const translations = catalog.get(locale) ?? new Map();
  translations.set(textOf(source), cloneParts(localized));
  catalog.set(locale, translations);
}

function collectTranslations(reflection, catalog) {
  const comment = reflection.comment;
  if (!comment) return;
  const targets = parameterTargets(reflection);
  const tags = [];
  for (const tag of comment.blockTags ?? []) {
    const parameter = parameterTagTarget(tag, targets);
    if (!parameter) {
      tags.push(tag);
      continue;
    }
    remember(
      catalog,
      tag.tag,
      parameter.target.comment?.summary,
      stripParameterName(tag.content, parameter.match[0].length),
    );
  }

  let index = 0;
  const summaryTranslations = localizedFollowers(tags, 0);
  for (const [localeTag, localized] of summaryTranslations.localized) {
    remember(catalog, localeTag, comment.summary, localized);
  }
  index = summaryTranslations.next;

  while (index < tags.length) {
    const tag = tags[index];
    if (localeTags.has(tag.tag)) {
      index += 1;
      continue;
    }
    const followers = localizedFollowers(tags, index + 1);
    for (const [localeTag, localized] of followers.localized) {
      remember(catalog, localeTag, tag.content, localized);
    }
    index = followers.next;
  }
}

function extractParameterTranslations(reflection) {
  const tags = reflection.comment?.blockTags;
  const targets = parameterTargets(reflection);
  if (!tags || targets.length === 0) return new Map();

  const names = new Map(targets.map((target) => [target.name, target]));
  const translations = new Map();
  reflection.comment.blockTags = tags.filter((tag) => {
    if (!localeTags.has(tag.tag)) return true;
    const match = textOf(tag.content).match(/^([^\s]+)\s+-\s*/);
    const target = match && names.get(match[1]);
    if (!target) return true;

    const content = stripParameterName(tag.content, match[0].length);
    const byLocale = translations.get(target) ?? new Map();
    byLocale.set(tag.tag, content);
    translations.set(target, byLocale);
    return false;
  });
  return translations;
}

function localizedParts(source, direct, locale, catalog, allowCatalog) {
  return direct.get(`@${locale}`)
    ?? (allowCatalog ? catalog.get(locale)?.get(textOf(source)) : undefined);
}

function localizeParameterComments(
  reflection,
  locale,
  catalog,
  handled,
  missing,
  allowCatalog,
) {
  const translations = extractParameterTranslations(reflection);
  for (const target of parameterTargets(reflection)) {
    const summary = target.comment?.summary;
    if (!hasProse(summary)) continue;
    handled.add(target.comment);
    if (locale === 'en') continue;

    const localized = localizedParts(
      summary,
      translations.get(target) ?? new Map(),
      locale,
      catalog,
      allowCatalog,
    );
    if (localized) target.comment.summary = localized;
    else missing.add(`${reflection.getFullName()}: parameter ${target.name}`);
  }
}

function collectCategoryTranslations(comment, categories) {
  const tags = comment?.blockTags ?? [];
  for (let index = 0; index < tags.length; index += 1) {
    if (tags[index].tag !== '@category') continue;
    const source = textOf(tags[index].content);
    const { localized } = localizedFollowers(tags, index + 1);
    for (const [tag, content] of localized) {
      const locale = tag.slice(1);
      const byLocale = categories.get(locale) ?? new Map();
      byLocale.set(source, textOf(content));
      categories.set(locale, byLocale);
    }
  }
}

function localizeComment(reflection, locale, catalog, handled, missing) {
  const comment = reflection.comment;
  if (!comment) return;
  if (handled.has(comment)) return;

  const allowCatalog = !(comment.blockTags ?? []).some((tag) => localeTags.has(tag.tag));
  localizeParameterComments(
    reflection,
    locale,
    catalog,
    handled,
    missing,
    allowCatalog,
  );
  const tags = comment.blockTags ?? [];
  const output = [];
  let index = 0;

  const summaryTranslations = localizedFollowers(tags, 0);
  if (locale !== 'en' && hasProse(comment.summary)) {
    const localized = localizedParts(
      comment.summary,
      summaryTranslations.localized,
      locale,
      catalog,
      allowCatalog,
    );
    if (localized) comment.summary = localized;
    else missing.add(`${reflection.getFullName()}: summary`);
  }
  index = summaryTranslations.next;

  while (index < tags.length) {
    const tag = tags[index];
    if (localeTags.has(tag.tag)) {
      index += 1;
      continue;
    }

    const followers = localizedFollowers(tags, index + 1);
    if (locale !== 'en' && hasProse(tag.content)) {
      const localized = localizedParts(
        tag.content,
        followers.localized,
        locale,
        catalog,
        allowCatalog,
      );
      if (localized) tag.content = localized;
      else if (tag.tag !== '@example') missing.add(`${reflection.getFullName()}: ${tag.tag}`);
    }
    output.push(tag);
    index = followers.next;
  }
  comment.blockTags = output;
}

function localizeGroups(reflection, locale, categories) {
  const names = new Map([
    ...Object.entries(generatedCategoryNames[locale] ?? {}),
    ...(categories.get(locale) ?? new Map()),
  ]);
  for (const group of reflection.groups ?? []) {
    group.title = names.get(group.title) ?? group.title;
    for (const category of group.categories ?? []) {
      category.title = names.get(category.title) ?? category.title;
    }
  }
  for (const category of reflection.categories ?? []) {
    category.title = names.get(category.title) ?? category.title;
  }
}

export function load(app) {
  const blockTags = app.options.getValue('blockTags');
  app.options.setValue('blockTags', [...new Set([...blockTags, ...localeTags])]);

  app.renderer.on(Renderer.EVENT_BEGIN, ({ project }) => {
    const locale = app.options.getValue('lang');
    const categories = new Map();
    const catalog = new Map();
    for (const reflection of Object.values(project.reflections)) {
      collectCategoryTranslations(reflection.comment, categories);
      collectTranslations(reflection, catalog);
    }

    const missing = new Set();
    const handled = new WeakSet();
    for (const reflection of Object.values(project.reflections)) {
      localizeComment(reflection, locale, catalog, handled, missing);
      localizeGroups(reflection, locale, categories);
    }

    if (missing.size > 0) {
      const details = [...missing].sort().join('\n- ');
      throw new Error(`Missing @${locale} TypeDoc translations:\n- ${details}`);
    }
  });
}
