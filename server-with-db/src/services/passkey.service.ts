
import { PassKey, User } from '@prisma/client';
import { prismaClient as prisma } from '../client';

export const getUserPaskeys = async (user: User | null | undefined) => {
  if (!user) return null;
  const passKeys = await prisma.passKey.findMany({
    where: {
      user_id: user.id,
    },
  });
  return passKeys;
};

export const createPasskey = async (passkey: {
  passkey_id: string;
  public_key: Buffer;
  user_id: number;
  name: string;
  webauthnUser_id: string;
  counter: bigint;
  device_type: string;
  back_up: boolean;
}) => {
  const passKey = await prisma.passKey.create({
    data: passkey,
  });
  return passKey;
};