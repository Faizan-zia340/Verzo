const LANGUAGE_MAP = {
  english: '',
  roman_urdu: '\n\nIMPORTANT: Write the ENTIRE response in Roman Urdu (Urdu words spelled in English/Latin letters). Do not use pure English sentences except for proper nouns.',
  arabic: '\n\nمهم: اكتب الرد بالكامل باللغة العربية الفصحى.',
};

export const buildPrompt = ({ type, prompt, tone = 'professional', length = 'medium', language = 'english' }) => {
  const lengths = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const wordCount = lengths[length] || lengths.medium;
  const langInstruction = LANGUAGE_MAP[language] || '';

  const templates = {
    blog: `Write a ${tone} blog post about: "${prompt}". Length: approximately ${wordCount}. Make it human-sounding, engaging, and well-structured with a clear intro, body, and conclusion.`,
    social: `Write a ${tone} social media post about: "${prompt}". Keep it engaging, concise, and include relevant hooks. Use emojis if appropriate.`,
    email: `Write a ${tone} email about: "${prompt}". Length: approximately ${wordCount}. Include a subject line, greeting, body, and professional sign-off.`,
    ad: `Write a compelling ${tone} advertisement for: "${prompt}". Make it persuasive with a strong headline, key benefits, and a clear call to action.`,
    product: `Write a ${tone} product description for: "${prompt}". Length: approximately ${wordCount}. Highlight features, benefits, and include a persuasive closing.`,
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
    shorten: 'Rewrite the following text to be shorter and more concise. Keep the core message but cut unnecessary words. Return only the rewritten text:',
    engaging: 'Rewrite the following text to be more engaging, dynamic, and captivating. Add energy and make it compelling. Return only the rewritten text:',
    professional: 'Rewrite the following text with a polished, professional, and formal tone. Maintain the meaning but elevate the language. Return only the rewritten text:',
  };
  return `${instructions[action]}\n\n${text}`;
};
