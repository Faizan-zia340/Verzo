import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCRIPT_GROUPS, scriptOf, resolveFont, fontStack, googleFontsUrl,
} from './fonts.js';

const ALL_23 = [
  'english_us', 'english_uk', 'roman_urdu_karachi', 'roman_urdu_lahore',
  'arabic_msa', 'arabic_gulf', 'spanish_latam', 'spanish_spain', 'french',
  'german', 'portuguese_brazil', 'italian', 'dutch', 'russian', 'hindi',
  'chinese_simplified', 'japanese', 'korean', 'bengali', 'turkish',
  'indonesian', 'persian', 'swahili',
];

test('every script group lists exactly 5 unique fonts', () => {
  for (const [key, group] of Object.entries(SCRIPT_GROUPS)) {
    assert.equal(group.fonts.length, 5, `${key} should list 5 fonts`);
    assert.equal(new Set(group.fonts).size, 5, `${key} fonts must be unique`);
    if (group.defaultFont) assert.ok(group.fonts.includes(group.defaultFont), `${key} default must be in its list`);
  }
});

test('all 23 generation languages map to a script group', () => {
  assert.equal(ALL_23.length, 23);
  for (const lang of ALL_23) assert.ok(SCRIPT_GROUPS[scriptOf(lang)], `${lang} has no script group`);
});

test('blog post languages map to a script group', () => {
  assert.equal(scriptOf('urdu'), 'arabic');
  assert.equal(scriptOf('roman-urdu'), 'latin');
  assert.equal(scriptOf('english'), 'latin');
});

test('Urdu defaults to Noto Nastaliq Urdu, Latin to the system stack', () => {
  assert.equal(resolveFont('arabic'), 'Noto Nastaliq Urdu');
  assert.equal(resolveFont('latin'), null);
});

test('font stack falls back gracefully', () => {
  assert.match(fontStack('arabic', 'Noto Nastaliq Urdu'), /Noto Nastaliq Urdu/);
  assert.equal(fontStack('latin', null), SCRIPT_GROUPS.latin.fallback);
});

test('Google Fonts URL is well-formed', () => {
  assert.equal(
    googleFontsUrl('Noto Nastaliq Urdu'),
    'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap',
  );
});
