import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUGGESTION_LANGUAGES,
  validateSuggestionInput,
  canDecideSuggestion,
  glossarySnippet,
} from '../utils/suggestionValidation.js';

const valid = {
  word: 'topic',
  language: 'urdu',
  suggestedTranslation: 'موضوع',
  note: 'Blog readers',
};

describe('SUGGESTION_LANGUAGES', () => {
  it('covers the 23 generation languages plus the blog language urdu', () => {
    assert.equal(SUGGESTION_LANGUAGES.length, 24);
    assert.equal(new Set(SUGGESTION_LANGUAGES).size, 24);
    for (const key of [
      'english_us', 'english_uk',
      'roman_urdu_karachi', 'roman_urdu_lahore',
      'arabic_msa', 'arabic_gulf', 'persian',
      'spanish_latam', 'spanish_spain', 'french', 'german',
      'portuguese_brazil', 'italian', 'dutch', 'russian',
      'hindi', 'chinese_simplified', 'japanese', 'korean',
      'bengali', 'turkish', 'indonesian', 'swahili',
      'urdu',
    ]) assert.ok(SUGGESTION_LANGUAGES.includes(key), `missing ${key}`);
  });
});

describe('validateSuggestionInput', () => {
  it('accepts a valid suggestion (null)', () => {
    assert.equal(validateSuggestionInput(valid), null);
  });

  it('accepts input without the optional note', () => {
    const { note, ...rest } = valid;
    assert.equal(validateSuggestionInput(rest), null);
  });

  it('rejects a missing word (400)', () => {
    assert.match(validateSuggestionInput({ ...valid, word: '  ' }), /word is required/);
    assert.match(validateSuggestionInput({ ...valid, word: undefined }), /word is required/);
  });

  it('rejects a word over 50 characters (400)', () => {
    assert.match(validateSuggestionInput({ ...valid, word: 'x'.repeat(51) }), /50 characters or fewer/);
  });

  it('rejects an unsupported language (400)', () => {
    assert.match(validateSuggestionInput({ ...valid, language: 'klingon' }), /language is not supported/);
    assert.match(validateSuggestionInput({ ...valid, language: undefined }), /language is not supported/);
  });

  it('rejects a missing translation (400)', () => {
    assert.match(
      validateSuggestionInput({ ...valid, suggestedTranslation: '' }),
      /suggestedTranslation is required/,
    );
  });

  it('rejects a translation over 100 characters (400)', () => {
    assert.match(
      validateSuggestionInput({ ...valid, suggestedTranslation: 'x'.repeat(101) }),
      /100 characters or fewer/,
    );
  });

  it('rejects a note over 300 characters (400)', () => {
    assert.match(validateSuggestionInput({ ...valid, note: 'x'.repeat(301) }), /300 characters or fewer/);
  });
});

describe('canDecideSuggestion', () => {
  it('allows deciding a pending suggestion (null)', () => {
    assert.equal(canDecideSuggestion({ status: 'pending' }), null);
  });

  it('returns 404 when the suggestion does not exist', () => {
    const block = canDecideSuggestion(null);
    assert.equal(block.status, 404);
    assert.match(block.message, /not found/i);
  });

  it('returns 409 when the suggestion was already decided', () => {
    for (const status of ['approved', 'rejected']) {
      const block = canDecideSuggestion({ status });
      assert.equal(block.status, 409);
      assert.match(block.message, new RegExp(status));
    }
  });
});

describe('glossarySnippet', () => {
  it('returns a parseable JSON fragment with the term, language and translation', () => {
    const out = glossarySnippet(valid);
    assert.equal(out.term, 'topic');
    assert.equal(out.language, 'urdu');
    assert.equal(out.translation, 'موضوع');
    const parsed = JSON.parse(out.snippet);
    assert.equal(parsed.topic.translations.urdu, 'موضوع');
    assert.match(out.hint, /already exists/i);
  });

  it('escapes quotes in the translation (round-trip safe)', () => {
    const out = glossarySnippet({ ...valid, suggestedTranslation: 'say "hi" now' });
    assert.equal(JSON.parse(out.snippet).topic.translations.urdu, 'say "hi" now');
  });
});
