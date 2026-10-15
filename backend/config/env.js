const assertEnvironment = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.VERCEL) {
      console.warn(`[Vercel Serverless Warning] ${msg}. Configure these in Vercel Project Settings -> Environment Variables.`);
      return;
    }
    throw new Error(msg);
  }

  const isProduction = ['production', 'staging'].includes(process.env.NODE_ENV);
  const weakSecrets = ['replace-with-a-long-random-secret', 'replace-with-a-long-random-secret-at-least-32-characters'];
  if (isProduction && (process.env.JWT_SECRET.length < 32 || weakSecrets.includes(process.env.JWT_SECRET))) {
    const msg = 'JWT_SECRET must be a unique random value of at least 32 characters in production.';
    if (process.env.VERCEL) {
      console.warn(`[Vercel Serverless Warning] ${msg}`);
      return;
    }
    throw new Error(msg);
  }
};

const getCorsOptions = () => {
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (!configuredOrigins.length) return {};

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (configuredOrigins.includes(cleanOrigin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
  };
};

module.exports = { assertEnvironment, getCorsOptions };
