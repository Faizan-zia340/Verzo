import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const glossary = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'glossary.json'), 'utf8'),
);

const ALL_23 = [
  'english_us', 'english_uk', 'roman_urdu_karachi', 'roman_urdu_lahore',
  'arabic_msa', 'arabic_gulf', 'spanish_latam', 'spanish_spain', 'french',
  'german', 'portuguese_brazil', 'italian', 'dutch', 'russian', 'hindi',
  'chinese_simplified', 'japanese', 'korean', 'bengali', 'turkish',
  'indonesian', 'persian', 'swahili',
];
const LANG_KEYS = [...ALL_23, 'urdu'];

test('glossary has all 23 generation languages plus urdu', () => {
  assert.equal(ALL_23.length, 23);
  assert.deepEqual(Object.keys(glossary.languages).sort(), [...LANG_KEYS].sort());
});

test('every term has a note and all 24 language keys', () => {
  assert.ok(Object.keys(glossary.terms).length > 0, 'glossary must not be empty');
  for (const [term, entry] of Object.entries(glossary.terms)) {
    assert.equal(typeof entry.note, 'string', `${term} needs a note`);
    assert.ok(entry.note.length > 0, `${term} note must not be empty`);
    assert.deepEqual(
      Object.keys(entry.translations).sort(),
      [...LANG_KEYS].sort(),
      `${term} must carry every language key`,
    );
  }
});

test('every translation is a non-empty string or null (never guess)', () => {
  for (const [term, entry] of Object.entries(glossary.terms)) {
    for (const [lang, value] of Object.entries(entry.translations)) {
      assert.ok(
        value === null || (typeof value === 'string' && value.length > 0),
        `${term} / ${lang} must be a non-empty string or null`,
      );
    }
  }
});

test('Urdu is fully seeded (PR #24 decisions)', () => {
  for (const [term, entry] of Object.entries(glossary.terms)) {
    assert.equal(
      typeof entry.translations.urdu, 'string',
      `${term} is missing its decided Urdu translation`,
    );
  }
});

test('English is the term itself', () => {
  for (const [term, entry] of Object.entries(glossary.terms)) {
    assert.equal(entry.translations.english_us, term);
    assert.equal(entry.translations.english_uk, term);
  }
});

test('seed coverage report (informational)', () => {
  for (const lang of LANG_KEYS) {
    const seeded = Object.values(glossary.terms)
      .filter((entry) => entry.translations[lang] !== null).length;
    console.log(`  ${lang}: ${seeded}/${Object.keys(glossary.terms).length}`);
  }
});
