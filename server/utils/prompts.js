const LANGUAGE_MAP = {
  english_us: '',
  english_uk: '\n\nWrite in British English. Use UK spelling (colour, behaviour, realise, organise), UK idioms, and British cultural references where natural.',
  roman_urdu_karachi: '\n\nWrite in Roman Urdu using natural Karachi street-style Pakistani Urdu. Use words like "yaar", "bhai", "masla", "seedha baat", "dhamaal", "tou phir", "bata na", "kya scene hai". Avoid formal/literary Urdu. Make it sound like a real Karachiite talking.',
  roman_urdu_lahore: '\n\nWrite in Roman Urdu using natural Lahori Punjabi-influenced Urdu. Use words like "yaara", "ki gal", "dass", "sohna", "te phir", "wajib aa", "kurra". Make it sound like a real Lahori talking.',
  arabic_msa: '\n\nاكتب الرد بالكامل باللغة العربية الفصحى الحديثة. استخدم أسلوباً واضحاً ومهنياً.',
  arabic_gulf: '\n\nاكتب بالعربية الخليجية العامية. استخدم مفردات خليجية مثل "وايد" و"چذي" و"الله يعطيك العافية" والعبارات الإماراتية والكويتية والسعودية الدارجة.',
  spanish_latam: '\n\nEscribe en español latinoamericano neutro, fácil de entender en México, Colombia y toda Latinoamérica.',
  spanish_spain: '\n\nEscribe en español de España. Usa "vosotros" donde corresponda y expresiones del español peninsular.',
  french: '\n\nÉcris l\'intégralité de la réponse en français avec un style naturel et fluide.',
  german: '\n\nSchreibe die gesamte Antwort auf Deutsch mit einem natürlichen, professionellen Stil.',
  portuguese_brazil: '\n\nEscreva em português brasileiro com um tom natural e conversacional típico do Brasil.',
  hindi: '\n\nपूरा जवाब हिंदी में लिखें। सरल, स्पष्ट और प्रवाहमय भाषा का उपयोग करें।',
  turkish: '\n\nYanıtın tamamını Türkçe olarak yaz. Doğal ve akıcı bir dil kullan.',
  chinese_simplified: '\n\n请用简体中文写全部内容，使用自然流畅的现代汉语。',
  japanese: '\n\n全ての内容を日本語で書いてください。自然で読みやすい日本語を使用してください。',
  russian: '\n\nНапиши весь ответ на русском языке. Используй естественный, профессиональный стиль.',
  italian: '\n\nScrivi tutta la risposta in italiano con uno stile naturale e scorrevole.',
  dutch: '\n\nSchrijf de volledige reactie in het Nederlands met een natuurlijke, professionele stijl.',
  korean: '\n\n전체 내용을 한국어로 작성해 주세요. 자연스럽고 전문적인 한국어를 사용하세요.',
  bengali: '\n\nপুরো উত্তরটি বাংলায় লিখুন। সহজ, প্রবাহমান ও স্বাভাবিক বাংলা ব্যবহার করুন।',
  indonesian: '\n\nTulis seluruh respons dalam Bahasa Indonesia yang natural dan profesional.',
  persian: '\n\nمتن کامل را به فارسی روان و طبیعی بنویسید.',
  swahili: '\n\nAndika jibu lote kwa Kiswahili sanifu na rahisi kueleweka.',
};

const FORMAT_MAP = {
  paragraphs: 'Use clear paragraphs with varied sentence lengths — mix short punchy sentences with longer ones for rhythm.',
  bullets: 'Use bullet points with a brief intro sentence. Each bullet should be concise and specific.',
  headings: 'Use 2-3 short markdown-style headings (## Heading) to organise the content into clear sections, each with a tight paragraph underneath.',
};

const STYLE_RULES = `
Writing quality rules:
- Vary sentence length: short sentences for impact, longer ones for depth. Never stack more than 2 long sentences in a row.
- Use strong, specific nouns and active verbs — avoid stacking more than 2 adjectives on any noun.
- Avoid hollow superlatives (ultimate, unrivalled, extraordinary) — show value through concrete detail instead.
- Keep the tone consistent but not exhausting — build energy, then let it breathe.
- End with a clear, natural call to action (1 sentence) that feels like advice, not a shout.`;

export const buildPrompt = ({ type, prompt, tone = 'professional', length = 'medium', language = 'english_us', format = 'paragraphs' }) => {
  const lengths = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const wordCount = lengths[length] || lengths.medium;
  const langInstruction = LANGUAGE_MAP[language] ?? LANGUAGE_MAP['english_us'];
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
  return `Based on this content, generate SEO metadata AND 3 image search keywords. Return ONLY valid JSON with no markdown, no explanation:

Content snippet: "${snippet}"

Return exactly this JSON structure:
{"title":"SEO meta title under 60 characters","description":"Meta description under 155 characters","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5"],"imageKeywords":["keyword1","keyword2","keyword3"]}`;
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

export const buildPDFPrompt = (text) => {
  return `You are an expert study assistant. Analyze the following document and produce structured output.

DOCUMENT TEXT:
${text}

Produce output in this EXACT format:

## 📋 STUDY NOTES
[Key concepts, facts, and definitions as bullet points. Be concise and specific.]

## 📖 CHAPTER SUMMARIES
[A paragraph summary for each major section/chapter found in the document.]

## ❓ TEST YOURSELF
[10 questions that test understanding of the document. Mix multiple choice and open-ended. Provide answers in brackets after each question.]

Keep each section clearly labelled. Be thorough but concise.`;
};

export { LANGUAGE_MAP };
