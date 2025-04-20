import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) {
    res.status (401).send({ error: 'Unauthorized' });
    return;
  }  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if(!decoded) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(401).send({ error: 'Unauthorized' });
  }
}