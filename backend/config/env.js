const assertEnvironment = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const isProduction = ['production', 'staging'].includes(process.env.NODE_ENV);
  const weakSecrets = ['replace-with-a-long-random-secret', 'replace-with-a-long-random-secret-at-least-32-characters'];
  if (isProduction && (process.env.JWT_SECRET.length < 32 || weakSecrets.includes(process.env.JWT_SECRET))) {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters in production.');
  }
};

const getCorsOptions = () => {
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (!configuredOrigins.length) return {};

  return {
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
  };
};

module.exports = { assertEnvironment, getCorsOptions };
