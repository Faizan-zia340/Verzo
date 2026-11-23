import { getPurpose } from '../config/contentTypes.js';

const LANGUAGE_MAP = {
  english_us: '\n\nWrite the entire response in American English. Use US spelling (color, behavior, realize, organize) and natural American phrasing.',
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

// Short display name per language value — used for the language anchor at
// the TOP of every prompt so the model sees the required output language
// before any other instruction (a trailing instruction alone is too weak
// and the model drifts, e.g. English requests coming back in Roman Urdu).
const LANGUAGE_NAMES = {
  english_us: 'American English',
  english_uk: 'British English',
  roman_urdu_karachi: 'Roman Urdu (Karachi street style)',
  roman_urdu_lahore: 'Roman Urdu (Lahori style)',
  arabic_msa: 'Modern Standard Arabic',
  arabic_gulf: 'Gulf Arabic dialect',
  spanish_latam: 'Latin American Spanish',
  spanish_spain: 'Spanish (Spain)',
  french: 'French',
  german: 'German',
  portuguese_brazil: 'Brazilian Portuguese',
  hindi: 'Hindi (Devanagari script)',
  turkish: 'Turkish',
  chinese_simplified: 'Simplified Chinese',
  japanese: 'Japanese',
  russian: 'Russian',
  italian: 'Italian',
  dutch: 'Dutch',
  korean: 'Korean',
  bengali: 'Bengali',
  indonesian: 'Bahasa Indonesia',
  persian: 'Persian (Farsi)',
  swahili: 'Swahili',
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

// Human-style rules: the output should read like a person wrote it, not a
// template. Applied to every buildPrompt() alongside STYLE_RULES.
const HUMAN_STYLE_RULES = `
Human writing style (write like a person, not a template):
- Vary sentence length on purpose — a 4-word sentence, then a longer one. Never let three sentences in a row start the same way or run the same length.
- Use concrete details from the user's input (names, places, numbers, dates) instead of vague claims. If a detail was not provided, leave it out — never invent one.
- Prefer active voice. One strong verb beats three adjectives.
- No stacked adjectives (never "amazing, incredible, wonderful"), no generic openers ("In today's world...", "Are you looking for...?") and no generic closers ("In conclusion...", "So what are you waiting for?").
- Do not end with a closing paragraph that just repeats the body. End on one concrete next step or one memorable line.`;

// Strict output rules appended to every buildPrompt() so the model never
// returns unfinished content (e.g. emails with "[Your Name]" left in).
// Strengthened after a live cold-outreach email came back with
// "[Warehouse Manager Name]" in the greeting and an invented "up to 25%":
// the model must never emit a bracketed slot at all, and must never invent
// a number — if a detail is missing it uses a generic greeting or omits
// the line instead.
const QUALITY_RULES = `
Output quality rules (strict — never break these):
- NEVER emit a placeholder of any kind: no [Your Name], [Company], [Name], [Recipient Name], [Warehouse Manager Name], no {{name}}, no <insert>. A bracketed slot is never acceptable — not even in a greeting or a subject line.
- If the recipient's name was not provided, greet with "Hi there," — never invent a name and never leave a bracketed name in the greeting. If a company, role, date or other detail was not provided, omit that line or use generic wording — never invent it.
- Never invent numbers: no percentages, prices, statistics or counts that were not provided in the input. If a figure was not provided, leave it out — do not make one up. Use only the numbers that appear in the provided details below.
- Use only the details provided below. Never invent facts, links, salaries, deadlines, names or contact details.
- Do not open with a rhetorical question or filler opener ("Looking for... right?", "In today's fast-paced world...").
- Avoid generic buzzwords and filler phrases (passionate, game-changer, cutting-edge, seamless, delve, unlock your potential). Be specific and concrete.`;

// How each tone should sound. The requested tone wins over the purpose's
// default tone — the default is only used as a fallback in the purpose block.
const TONE_GUIDANCE = {
  friendly: 'Warm and conversational, like a helpful neighbour. Short sentences, plain words.',
  formal: 'Polite and professional. Full sentences, no slang, no contractions where a formal register fits.',
  persuasive: 'Confident and benefit-led. Lead with what the reader gains, then the proof, then one clear ask.',
  urgent: 'Direct and time-aware. Short sentences, clear deadline or scarcity where the user provided one — never invent urgency.',
  empathetic: 'Kind and understanding. Acknowledge the reader\'s situation first, then help — no corporate coldness.',
  professional: 'Polished and business-like. Clear, precise, no slang.',
  casual: 'Relaxed and informal. Everyday words, contractions welcome.',
};

const READING_LEVEL_GUIDANCE = {
  simple: 'Write at a simple reading level: short words, short sentences, one idea per sentence. A 12-year-old should follow it easily.',
  standard: 'Write at a standard reading level: everyday vocabulary, mixed sentence lengths, clear structure.',
  professional: 'Write at a professional reading level: precise vocabulary and longer, well-built sentences where the topic needs them — but stay clear, never dense.',
};

const DETAILS_LABELS = {
  topic: 'Topic',
  audience: 'Audience',
  company: 'Company',
  role: 'Role',
  location: 'Location',
  senderName: 'Sender name',
  applyLink: 'Apply link',
  contact: 'Contact',
  product: 'Product',
  cta: 'Call to action',
  recipient: 'Recipient',
  deadline: 'Deadline',
  skills: 'Key skills',
};

// Email category instructions — each subtype gets its own structure so a
// cold outreach email does not read like a newsletter.
const EMAIL_SUBTYPES = {
  general: 'Structure: subject line, greeting, body (2-3 short paragraphs), and a clear one-line CTA before the sign-off.',
  cold_outreach: 'This is a COLD OUTREACH email to someone who does not know the sender. Structure: short personalised subject line, one-line opener that shows you know their business, value proposition in 2 sentences, and a soft low-pressure CTA to book a short call. Keep it under 150 words.',
  follow_up: 'This is a FOLLOW-UP email to someone who has not replied yet. Structure: subject line referencing the earlier message, brief polite reminder of the original ask in 1-2 sentences, one new reason to reply (a result, a deadline, or a helpful resource), and a simple CTA. Keep it short.',
  newsletter: 'This is a NEWSLETTER email to subscribers. Structure: friendly subject line, warm greeting, 2-3 short sections with a clear heading each, and a CTA to read more or reply. Conversational, not salesy.',
  welcome: 'This is a WELCOME email to a new subscriber or customer. Structure: warm subject line, friendly greeting, what they can expect next (2-3 short points), and one clear first step. Warm and encouraging.',
  apology: 'This is an APOLOGY email. Structure: sincere subject line, direct apology in the first sentence (no excuses), a brief honest explanation, what is being done to fix it, and a concrete make-good offer. Honest, human, no corporate filler.',
  job_application: 'This is a JOB APPLICATION email. Structure: subject line with the role and the sender name, greeting, 2 short paragraphs (why this role, why the sender fits — grounded only in the details provided), and a CTA to review the attached resume. Include the apply link or contact exactly as provided.',
  thank_you: 'This is a THANK-YOU email. Structure: warm subject line, sincere thanks in the first sentence, one specific thing being thanked for, and a brief forward-looking line. Short and genuine.',
  meeting_request: 'This is a MEETING REQUEST email. Structure: clear subject line stating the purpose, 2-3 sentences on why the meeting matters and what will be covered, and a CTA proposing times or asking for availability. Concise and respectful of their time.',
};

// Social style instructions — a captions request returns short captions,
// not a full post.
const SOCIAL_SUBTYPES = {
  post: '',
  captions: 'Return 3 short caption options, each on its own line, numbered 1-3. Each caption is 1-2 lines max. Add 3-5 relevant hashtags at the end of each caption. Keep them distinct in angle (one funny, one bold, one minimal).',
};

// Formats the per-type details the user provided so the model uses exactly
// those values (and nothing invented) in the output.
const formatDetails = (details = {}) => {
  const lines = Object.entries(DETAILS_LABELS)
    .filter(([key]) => typeof details[key] === 'string' && details[key].trim())
    .map(([key, label]) => `- ${label}: ${details[key].trim()}`);
  return lines.length
    ? `\n\nProvided details (use exactly these — do not invent others):\n${lines.join('\n')}`
    : '';
};

// Purpose block: structure outline + two human-written few-shot examples
// from server/config/contentTypes.js, injected so the model follows the
// shape of a real piece in that purpose instead of a generic template.
const formatPurpose = (type, purpose) => {
  const config = purpose ? getPurpose(type, purpose) : null;
  if (!config) return '';
  const examples = config.examples.map((ex, i) => `Example ${i + 1} (human-written, follow its rhythm and concreteness, do not copy its content):\n"${ex}"`).join('\n\n');
  return `\n\nPurpose: ${config.label} (${type}).
Follow this structure: ${config.structure}
Default tone for this purpose: ${config.defaultTone}. Target length: about ${config.lengthRange.min}–${config.lengthRange.max} words.
${examples}`;
};

const formatWritingSample = (sample) => {
  const text = typeof sample === 'string' ? sample.trim().slice(0, 1500) : '';
  if (!text) return '';
  return `\n\nWriting sample — match this voice only (sentence length, vocabulary, punctuation habits, level of formality). Do NOT copy its words, topic or content:\n"${text}"`;
};

export const buildPrompt = ({ type, prompt, tone = 'professional', length = 'medium', language = 'english_us', format = 'paragraphs', details = {}, purpose = '', readingLevel = 'standard', writingSample = '', subtype = '' }) => {
  const lengths = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const wordCount = lengths[length] || lengths.medium;
  const langInstruction = LANGUAGE_MAP[language] ?? LANGUAGE_MAP['english_us'];
  const formatInstruction = FORMAT_MAP[format] || FORMAT_MAP.paragraphs;
  const purposeConfig = purpose ? getPurpose(type, purpose) : null;
  // The requested tone wins; the purpose default tone is shown in the
  // purpose block as a fallback guide.
  const toneInstruction = TONE_GUIDANCE[tone] ? `\nTone: ${tone} — ${TONE_GUIDANCE[tone]}` : '';
  const readingInstruction = READING_LEVEL_GUIDANCE[readingLevel] ? `\n${READING_LEVEL_GUIDANCE[readingLevel]}` : '';
  const purposeBlock = formatPurpose(type, purpose);
  // A purpose's own length range is more specific than short/medium/long.
  const lengthInstruction = purposeConfig
    ? `Length: about ${purposeConfig.lengthRange.min}–${purposeConfig.lengthRange.max} words.`
    : `Length: approximately ${wordCount}.`;
  // Language anchor at the TOP of the prompt — the model must see the
  // required output language before anything else. Repeated at the end.
  const langName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES['english_us'];
  const langAnchor = `OUTPUT LANGUAGE — CRITICAL: Write the ENTIRE response in ${langName}. Do not write in any other language, do not mix languages, and do not translate the prompt itself. If the user's prompt is written in a different language than ${langName}, understand it, but still answer fully in ${langName}.\n\n`;

  const emailStructure = EMAIL_SUBTYPES[subtype || details.subtype] || EMAIL_SUBTYPES.general;
  const socialExtra = SOCIAL_SUBTYPES[subtype || details.subtype] || '';

  const templates = {
    blog: `Write a ${tone} blog post about: "${prompt}".
${lengthInstruction}
Structure: engaging opening hook, well-organised body, strong conclusion.
${formatInstruction}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    social: `Write a ${tone} social media post about: "${prompt}".
Length: short and punchy — no more than 5 lines.
Start with a hook in the first line that makes someone stop scrolling.
Use emojis only if they add meaning (max 3).
End with a question or CTA to drive engagement.
${socialExtra}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    email: `Write a ${tone} email about: "${prompt}".
${lengthInstruction}
Include: subject line, greeting (by name only if the recipient name was provided, otherwise start with 'Hi there,'), body (2-3 short paragraphs), and a clear one-line CTA before the sign-off.
${emailStructure}
${formatInstruction}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    ad: `Write a ${tone} advertisement for: "${prompt}".
${lengthInstruction}
Structure: punchy headline (1 sentence), 2-3 sentences on the key benefit (not features), then a direct CTA.
${formatInstruction}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    product: `Write a ${tone} product description for: "${prompt}".
${lengthInstruction}
Lead with the primary benefit, not the product name. Ground claims in specifics.
${formatInstruction}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    cover_letter: `Write a ${tone} cover letter for the job described below.
Job / prompt: "${prompt}".
${lengthInstruction}
Structure: subject line or header with the role, greeting, opening paragraph (why this role), middle paragraph (why the sender fits — use ONLY the key skills and details provided, never invent experience), closing paragraph with a CTA to schedule an interview, and a professional sign-off with the sender name.
${formatInstruction}
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    resume_summary: `Write a ${tone} professional summary for a resume, based on: "${prompt}".
Length: 3-5 sentences (about 60-90 words).
Structure: one strong opening line stating the role and years of focus (only if provided), then the key skills and what the person delivers, ending with the kind of role they are seeking. First person, confident, no filler.
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,

    linkedin: `Write a ${tone} LinkedIn post about: "${prompt}".
Length: short and punchy — no more than 8 lines.
Start with a hook in the first line that makes someone stop scrolling.
Use short paragraphs with line breaks for readability. Professional but human — no corporate filler.
End with a question or CTA to drive comments, and add 3-5 relevant hashtags on the last line.
${STYLE_RULES}
${HUMAN_STYLE_RULES}`,
  };

  return langAnchor + (templates[type] || templates.blog)
    + purposeBlock
    + toneInstruction
    + readingInstruction
    + formatWritingSample(writingSample)
    + formatDetails(details)
    + QUALITY_RULES
    + langInstruction;
};

// Pass-2 editor prompt: polish a draft, don't rewrite it. Only removes
// robotic phrasing, repeated sentence patterns and filler — every fact,
// name, number, link and date in the draft must survive unchanged.
export const buildEditorPrompt = (text, { type, purpose = '' } = {}) => {
  const purposeConfig = purpose ? getPurpose(type, purpose) : null;
  const purposeNote = purposeConfig
    ? `\nThis is a ${purposeConfig.label} (${type}). Keep its structure: ${purposeConfig.structure}`
    : '';
  return `You are a careful human editor. Edit the draft below and return ONLY the edited text — no explanation, no extra lines.

Rules:
- Remove robotic phrasing, repeated sentence patterns (never let three sentences in a row start the same way) and filler words.
- Remove any bracketed placeholder already in the draft (e.g. [Name], [Company]): replace a placeholder greeting with "Hi there," and delete any other bracketed slot — never leave one in the edited text.
- Do not add any new number, percentage, price or statistic. If the draft states a figure, keep it exactly as written — never round it, inflate it or replace it.
- Vary sentence length. Keep active voice. Do not add stacked adjectives or generic openers/closers.
- Preserve EVERY fact, name, number, date, link, price and deadline exactly as written. Do not add, remove or change any fact.
- Do not add a closing paragraph that repeats the body. Keep the same length (within 10%).
- Never insert placeholders such as [Your Name] or {{name}}.${purposeNote}

Draft to edit:
${text}`;
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

export { LANGUAGE_MAP, LANGUAGE_NAMES, EMAIL_SUBTYPES, SOCIAL_SUBTYPES };
