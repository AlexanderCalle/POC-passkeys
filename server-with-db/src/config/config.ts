import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  replyingPartyId: string;
  relyingPartyName: string;
  origin: string;
  jwtSecret: string;
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
  jwtSecret: process.env.JWT_SECRET || 'secret',
  session: {
    secret: process.env.SESSION_SECRET || 'secret',
  },
};

export default config;