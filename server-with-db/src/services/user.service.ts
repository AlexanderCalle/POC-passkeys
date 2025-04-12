import { User } from '@prisma/client';
import { prismaClient as prisma } from '../client';

export const getUser = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  return user;
};

export const createUser = async (username: string) => {
  const user = await prisma.user.create({
    data: {
      username,
    },
  });
  return user;
};

export const updateUser = async (id: number, data: User) => {
  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      ...data,
      devices: data.devices === null ? undefined : data.devices,
    },
  });
  return user;
};