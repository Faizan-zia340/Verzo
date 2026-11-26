# Content Glossary

One approved translation per term, per language. This file exists so a word
choice decided once (e.g. `topic` → موضوع, `audience` → قارئین in the Urdu
blog cleanup, PR #24) never has to be guessed again.

## Files

- `glossary.json` — the data. `version`, `languages`, `terms`.
- `glossary.test.js` — validation. Run with `node --test client/src/content/glossary.test.js`.

## How to use it

Before writing or generating content in a language, check the term here and
use the approved translation. If the term is not in the glossary yet, add it
(see below) — do not invent a translation on the spot.

## Structure

```json
{
  "topic": {
    "note": "Blog/article topic",
    "translations": { "urdu": "موضوع", "hindi": "विषय", "french": null }
  }
}
```

- Term keys are English, lowercase except proper nouns (`Pricing page`,
  `AI content generator`, `RTL`).
- `note` explains the context the translation was chosen for (e.g. `audience`
  means blog *readers*, not listeners — that is why Urdu is قارئین, not سامعین).
- `translations` has an entry for **every** language key. Value is either a
  string (approved translation) or `null`.
- **`null` means TODO — translation not yet decided. Never guess.** A wrong
  entry is worse than an empty one. Leave it `null` until someone who knows
  the language decides it.

## Language keys

24 keys: the 23 generation languages from `Generator.jsx` (`english_us`,
`english_uk`, `roman_urdu_karachi`, `roman_urdu_lahore`, `arabic_msa`,
`arabic_gulf`, `spanish_latam`, `spanish_spain`, `french`, `german`,
`portuguese_brazil`, `italian`, `dutch`, `russian`, `hindi`,
`chinese_simplified`, `japanese`, `korean`, `bengali`, `turkish`,
`indonesian`, `persian`, `swahili`) plus `urdu` (Urdu script — the blog
language; it has no generation equivalent because Penlix generates Roman
Urdu, not Urdu script).

Blog `language` frontmatter maps onto these keys: `english` → `english_us`,
`urdu` → `urdu`, `roman-urdu` → `roman_urdu_karachi`.

## How to add a term

1. Add the English key with a `note` (context matters — the same English
   word can translate differently in different contexts).
2. Fill in translations you are **sure** about. Everything else stays `null`.
3. Run the test (`node --test client/src/content/glossary.test.js`) and
   `npm run build` in `client/` before committing.

## Seed status (2026-11-25, PR #25)

32 terms. Seeded per language:

| Language | Seeded | Source |
| --- | --- | --- |
| English (US/UK) | 32/32 | the term itself |
| Urdu | 32/32 | decided in PR #24 (Urdu post cleanup) |
| Roman Urdu (Karachi/Lahore) | 25/32 | verified by grep in the published Roman Urdu posts (term used as-is) |
| Spanish, French, German, Hindi | 17/32 | 15 core terms + `transliteration` + borrowed `prompt` |
| Arabic, Portuguese, Italian, Dutch, Russian, Chinese, Japanese, Korean, Bengali, Turkish, Indonesian | 16/32 | 15 core terms + `transliteration` |
| Persian, Swahili | 15/32 | 15 core terms |

The 15 core terms seeded everywhere else: `topic`, `angle`, `dialect`,
`example`, `free`, `step`, `language`, `draft`, `publish`, `test`, `tone`,
`generate`, `output`, `audience`, `search`. Everything else is `null`
until decided — notably the product terms (`credit(s)`, `signup`,
`Pricing page`, `paid plans`, `live test`, `known bug`, `rank`, `RTL`,
`label`, `steps`, `dialects`, `generator`, `AI content generator`).
