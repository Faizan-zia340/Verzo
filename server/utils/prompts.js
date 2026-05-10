const LANGUAGE_MAP = {
  english: '',
  roman_urdu: '\n\nIMPORTANT: Write the ENTIRE response in Roman Urdu (Urdu words spelled in English/Latin letters). Do not use pure English sentences except for proper nouns.',
  arabic: '\n\nمهم: اكتب الرد بالكامل باللغة العربية الفصحى.',
};

const FORMAT_MAP = {
  paragraphs: 'Use clear paragraphs with varied sentence lengths — mix short punchy sentences with longer ones for rhythm.',
  bullets: 'Use bullet points with a brief intro sentence. Each bullet should be concise and specific.',
  headings: 'Use 2-3 short markdown-style headings (## Heading) to organise the content into sections with a paragraph under each.',
};

const STYLE_RULES = `
Writing quality rules:
- Vary sentence length: short sentences for impact, longer ones for depth. Never stack more than 2 long sentences in a row.
- Use strong, specific nouns and active verbs — avoid stacking more than 2 adjectives on any noun.
- Avoid hollow superlatives (ultimate, unrivalled, extraordinary) — show value through concrete detail instead.
- Keep the tone consistent but not exhausting — build energy, then let it breathe.
- End with a clear, natural call to action (1 sentence) that feels like advice, not a shout.`;

export const buildPrompt = ({ type, prompt, tone = 'professional', length = 'medium', language = 'english', format = 'paragraphs' }) => {
  const lengths = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const wordCount = lengths[length] || lengths.medium;
  const langInstruction = LANGUAGE_MAP[language] || '';
  const formatInstruction = FORMAT_MAP[format] || FORMAT_MAP.paragraphs;

  const templates = {
    blog: `Write a ${tone} blog post about: "${prompt}".
Length: approximately ${wordCount}.
Structure: engaging opening hook, well-organised body, strong conclusion.
${formatInstruction}
${STYLE_RULES}`,

    social: `Write a ${tone} social media post about: "${prompt}".
Length: short and punchy — no more than 5 lines.
Start with a hook in the first line that makes someone stop scrolling.
Use emojis only if they add meaning (max 3).
End with a question or CTA to drive engagement.
${STYLE_RULES}`,

    email: `Write a ${tone} email about: "${prompt}".
Length: approximately ${wordCount}.
Include: subject line, greeting, body (2-3 short paragraphs), and a clear one-line CTA before the sign-off.
${formatInstruction}
${STYLE_RULES}`,

    ad: `Write a ${tone} advertisement for: "${prompt}".
Length: approximately ${wordCount}.
Structure: punchy headline (1 sentence), 2-3 sentences on the key benefit (not features), then a direct CTA.
${formatInstruction}
${STYLE_RULES}`,

    product: `Write a ${tone} product description for: "${prompt}".
Length: approximately ${wordCount}.
Lead with the primary benefit, not the product name. Ground claims in specifics.
${formatInstruction}
${STYLE_RULES}`,
  };

  return (templates[type] || templates.blog) + langInstruction;
};

export const buildSEOPrompt = (content) => {
  const snippet = content.slice(0, 800);
  return `Based on this content, generate SEO metadata. Return ONLY valid JSON with no markdown, no explanation:

Content snippet: "${snippet}"

Return exactly this JSON structure:
{"title":"SEO meta title under 60 characters","description":"Meta description under 155 characters","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5"]}`;
};

export const buildTunePrompt = (text, action) => {
  const instructions = {
    shorten: 'Rewrite the following text to be shorter and more concise. Keep the core message but cut unnecessary words and any redundant phrases. Return only the rewritten text:',
    engaging: 'Rewrite the following text to be more engaging. Improve the opening hook, vary sentence lengths, and make the ending stronger. Do not add excessive hype or stack adjectives. Return only the rewritten text:',
    professional: 'Rewrite the following text with a polished, professional tone. Maintain the meaning but elevate the language and tighten the structure. Return only the rewritten text:',
    reduce_hype: 'Rewrite the following text to reduce over-the-top language. Replace hollow superlatives and stacked adjectives with specific, concrete details. Keep the energy but make it feel authentic, not exhausting. Return only the rewritten text:',
  };
  return `${instructions[action]}\n\n${text}`;
};
