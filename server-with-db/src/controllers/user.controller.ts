
import { Request, Response, NextFunction } from "express"
import { prismaClient } from "../client";

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        name: true,
        username: true,
        PassKey: {
          select: {
            id: true,
            name: true,
            passkey_id: true,
            device_type: true,
            back_up: true,
          },
        },
      }
    });
    if (!user) {
      res.status(404).send({ error: 'User not found' });
      return;
    }
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};