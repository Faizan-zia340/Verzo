const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

const OPTIONAL = [
  'CLIENT_URL',
  // Forgot-password email sending is disabled when these are not set.
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'UNSPLASH_ACCESS_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'JWT_EXPIRES_IN',
  'PORT',
];

export const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  const missingOptional = OPTIONAL.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error('\n FATAL: Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nSet these in the Secrets panel before starting the server.\n');
    process.exit(1);
  }

  if (missingOptional.length) {
    console.warn(`Optional env vars not set (related features disabled): ${missingOptional.join(', ')}`);
  }
};

export default validateEnv;
