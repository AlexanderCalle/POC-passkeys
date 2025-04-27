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

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

export const createUser = async (username: string, email: string, name?: string) => {
  // TODO: add try catch for the unique constraints
  const user = await prisma.user.create({
    data: {
      username,
      name,
      email,
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
    },
  });
  return user;
};