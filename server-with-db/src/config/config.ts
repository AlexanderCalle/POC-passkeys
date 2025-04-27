import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  replyingPartyId: string;
  relyingPartyName: string;
  origin: string;
  jwtSecret: string;
  hashSecret: string;
  redis: {
    url: string;
    token: string;
    protocol: string;
  };
  mail: {
    user: string;
    pass: string;
  }
  session: {
    secret: string;
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  replyingPartyId: process.env.REPLYING_PARTY_ID || 'localhost',
  relyingPartyName: process.env.REPLYING_PARTY_NAME || 'webauthn-app',
  origin: process.env.ORIGIN || 'http://localhost:3000',
  hashSecret: process.env.HASH_SECRET || 'secret',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    token: process.env.REDIS_TOKEN || 'token',
    protocol: process.env.REDIS_PROTOCOL || 'redis',
  },
  mail: {
    user: process.env.EMAIL_USER || 'user',
    pass: process.env.EMAIL_PASSWORD || 'pass',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'secret',
  },
};

export default config;