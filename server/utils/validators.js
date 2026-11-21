import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  // Same password rule as registration: at least 6 characters.
  password: Joi.string().min(6).required(),
});

// Required detail fields per content type. A field with `alt` is satisfied
// by either key — e.g. an email needs an apply link OR a contact.
export const REQUIRED_FIELDS = {
  blog: [
    { key: 'topic', label: 'Topic' },
    { key: 'audience', label: 'Audience' },
  ],
  social: [
    { key: 'topic', label: 'Topic' },
    { key: 'audience', label: 'Audience' },
  ],
  email: [
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'location', label: 'Location' },
    { key: 'senderName', label: 'Sender name' },
    { key: 'applyLink', label: 'Apply link or contact', alt: 'contact' },
  ],
  ad: [
    { key: 'product', label: 'Product' },
    { key: 'audience', label: 'Audience' },
    { key: 'cta', label: 'Call to action (CTA)' },
  ],
  product: [
    { key: 'product', label: 'Product' },
    { key: 'audience', label: 'Audience' },
  ],
};

// Returns the labels of the required fields missing from `values` for `type`.
export const missingRequiredFields = (type, values = {}) => {
  const required = REQUIRED_FIELDS[type] || [];
  const hasValue = (key) => typeof values[key] === 'string' && values[key].trim().length > 0;
  const missing = [];
  for (const field of required) {
    if (field.alt) {
      if (!hasValue(field.key) && !hasValue(field.alt)) missing.push(field.label);
    } else if (!hasValue(field.key)) {
      missing.push(field.label);
    }
  }
  return missing;
};

const detailField = Joi.string().trim().max(500).allow('').optional();

export const generateSchema = Joi.object({
  type: Joi.string().valid('blog', 'social', 'email', 'ad', 'product').required(),
  prompt: Joi.string().min(10).max(1000).required(),
  tone: Joi.string().optional(),
  length: Joi.string().valid('short', 'medium', 'long').optional(),
  language: Joi.string().optional(),
  format: Joi.string().valid('paragraphs', 'bullets', 'headings').optional(),
  // Per-type required details, enforced by the custom check below.
  // They arrive as empty strings when the user leaves them blank.
  topic: detailField,
  audience: detailField,
  company: detailField,
  role: detailField,
  location: detailField,
  senderName: detailField,
  applyLink: detailField,
  contact: detailField,
  product: detailField,
  cta: detailField,
})
  .options({ stripUnknown: true })
  .custom((value, helpers) => {
    const missing = missingRequiredFields(value.type, value);
    if (missing.length) {
      return helpers.error('any.custom', { type: value.type, missing: missing.join(', ') });
    }
    return value;
  })
  .messages({ 'any.custom': 'Missing required fields for {{#type}} content: {{#missing}}' });

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  req.body = value;
  next();
};
