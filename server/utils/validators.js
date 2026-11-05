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

export const generateSchema = Joi.object({
  type: Joi.string().valid('blog', 'social', 'email', 'ad', 'product').required(),
  prompt: Joi.string().min(10).max(1000).required(),
  tone: Joi.string().optional(),
  length: Joi.string().valid('short', 'medium', 'long').optional(),
  language: Joi.string().optional(),
  format: Joi.string().valid('paragraphs', 'bullets', 'headings').optional(),
}).options({ stripUnknown: true });

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  req.body = value;
  next();
};
