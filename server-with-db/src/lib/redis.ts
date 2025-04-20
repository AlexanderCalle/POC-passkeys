import { Redis } from '@upstash/redis';
import config from '../config/config'

export const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});