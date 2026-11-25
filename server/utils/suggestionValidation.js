// Pure helpers for translation suggestions — no DB, no HTTP, so they are
// unit-testable. Keep this list in sync with the glossary's `languages`
// (client/src/content/glossary.json) and Generator.jsx LANGUAGES: the 23
// generation languages plus `urdu`, the blog-post language.
export const SUGGESTION_LANGUAGES = [
  'english_us', 'english_uk', 'urdu',
  'roman_urdu_karachi', 'roman_urdu_lahore',
  'arabic_msa', 'arabic_gulf', 'persian',
  'spanish_latam', 'spanish_spain', 'french', 'german',
  'portuguese_brazil', 'italian', 'dutch', 'russian',
  'hindi', 'chinese_simplified', 'japanese', 'korean',
  'bengali', 'turkish', 'indonesian', 'swahili',
];

// Returns an error message string, or null when the input is valid.
export function validateSuggestionInput(body = {}) {
  const word = typeof body.word === 'string' ? body.word.trim() : '';
  if (!word) return 'word is required';
  if (word.length > 50) return 'word must be 50 characters or fewer';
  if (!SUGGESTION_LANGUAGES.includes(body.language)) return 'language is not supported';
  const translation = typeof body.suggestedTranslation === 'string' ? body.suggestedTranslation.trim() : '';
  if (!translation) return 'suggestedTranslation is required';
  if (translation.length > 100) return 'suggestedTranslation must be 100 characters or fewer';
  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') return 'note must be text';
  if (typeof body.note === 'string' && body.note.trim().length > 300) return 'note must be 300 characters or fewer';
  return null;
}

// Approve/reject guard: only a pending suggestion can be decided.
// Returns { status, message } to send, or null when deciding is allowed.
export function canDecideSuggestion(suggestion) {
  if (!suggestion) return { status: 404, message: 'Suggestion not found' };
  if (suggestion.status !== 'pending') {
    return { status: 409, message: `Suggestion already ${suggestion.status}` };
  }
  return null;
}

// Exact JSON fragment an admin copies into glossary.json under `terms`.
// If the term already exists, only the `"language": "translation"` line
// goes inside its `translations` object. Valid JSON by construction.
export function glossarySnippet({ word, language, suggestedTranslation }) {
  return {
    term: word,
    language,
    translation: suggestedTranslation,
    snippet: JSON.stringify({ [word]: { translations: { [language]: suggestedTranslation } } }, null, 2),
    hint: 'If the term already exists in glossary.json, add only the "language": "translation" line inside its translations object.',
  };
}
