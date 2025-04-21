import crypto from 'crypto';
import config from '../config/config';

export const hashFromOtp = (otp: string) => {
  return crypto
    .createHmac('sha256', config.hashSecret)
    .update(otp)
    .digest('hex');
}

export const verifyHash = (recievedHash: string, storedHash: string) => {
  return crypto.timingSafeEqual(
    Buffer.from(recievedHash),
    Buffer.from(storedHash),
  )
}