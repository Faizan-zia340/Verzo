export const buildPrompt = ({ type, prompt, tone = 'professional', length = 'medium' }) => {
  const lengths = { short: '100-150 words', medium: '200-300 words', long: '400-600 words' };
  const wordCount = lengths[length] || lengths.medium;

  const templates = {
    blog: `Write a ${tone} blog post about: "${prompt}". Length: ${wordCount}.`,
    social: `Write a ${tone} social media post about: "${prompt}". Keep it engaging and concise.`,
    email: `Write a ${tone} email about: "${prompt}". Length: ${wordCount}.`,
    ad: `Write a compelling ${tone} advertisement for: "${prompt}". Make it persuasive and concise.`,
    product: `Write a ${tone} product description for: "${prompt}". Length: ${wordCount}.`,
  };

  return templates[type] || templates.blog;
};
