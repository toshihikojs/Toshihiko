import { createHash } from 'node:crypto';
import { Renderer } from 'typedoc';
import zh from './locales/zh.mjs';

const locales = { zh };

function commentHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

function translateParts(parts, translations, missing) {
  for (const part of parts ?? []) {
    if (part.kind !== 'text') continue;
    const translated = translations.comments[part.text]
      ?? translations.commentHashes?.[commentHash(part.text)];
    if (translated !== undefined) {
      part.text = translated;
    } else if (translations.complete && /[A-Za-z]/.test(part.text)) {
      missing.add(part.text);
    }
  }
}

function translateComment(comment, translations, missing) {
  if (!comment) return;
  translateParts(comment.summary, translations, missing);
  for (const tag of comment.blockTags) translateParts(tag.content, translations, missing);
}

function translateGroups(reflection, translations) {
  for (const group of reflection.groups ?? []) {
    group.title = translations.groups[group.title] ?? group.title;
    for (const category of group.categories ?? []) {
      category.title = translations.groups[category.title] ?? category.title;
    }
  }
  for (const category of reflection.categories ?? []) {
    category.title = translations.groups[category.title] ?? category.title;
  }
}

export function load(app) {
  app.renderer.on(Renderer.EVENT_BEGIN, ({ project }) => {
    const translations = locales[app.options.getValue('lang')];
    if (!translations) return;

    const missing = new Set();
    translateParts(project.readme, translations, missing);
    for (const reflection of Object.values(project.reflections)) {
      translateComment(reflection.comment, translations, missing);
      translateGroups(reflection, translations);
    }
    if (missing.size > 0) {
      const details = [...missing].map((text) => JSON.stringify(text)).join('\n- ');
      throw new Error(`Missing TypeDoc comment translations:\n- ${details}`);
    }
  });
}
