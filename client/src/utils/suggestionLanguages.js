// Languages a translation can be suggested for — the 23 generation
// languages plus `urdu`, the blog-post language. Keep in sync with
// server/utils/suggestionValidation.js SUGGESTION_LANGUAGES and the
// glossary's `languages` (client/src/content/glossary.json).
export const SUGGESTION_LANGUAGES = [
  { value: 'english_us', label: 'English (US)' },
  { value: 'english_uk', label: 'English (UK)' },
  { value: 'urdu', label: 'Urdu' },
  { value: 'roman_urdu_karachi', label: 'Roman Urdu (Karachi)' },
  { value: 'roman_urdu_lahore', label: 'Roman Urdu (Lahore)' },
  { value: 'arabic_msa', label: 'Arabic (Modern Standard)' },
  { value: 'arabic_gulf', label: 'Arabic (Gulf)' },
  { value: 'spanish_latam', label: 'Spanish (Latin America)' },
  { value: 'spanish_spain', label: 'Spanish (Spain)' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'portuguese_brazil', label: 'Portuguese (Brazil)' },
  { value: 'italian', label: 'Italian' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'russian', label: 'Russian' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'chinese_simplified', label: 'Chinese (Simplified)' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'indonesian', label: 'Indonesian' },
  { value: 'persian', label: 'Persian (Farsi)' },
  { value: 'swahili', label: 'Swahili' },
];
