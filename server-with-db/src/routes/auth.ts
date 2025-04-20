import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaClient } from '../client';
import { authenticationStart, registrationStart, verifyAuthentication, verifyRegistration } from '../controllers/auth.controller';
import config from '../config/config';

const router = express.Router();

router.post('/register/start', registrationStart);
router.post('/register/finish', verifyRegistration);

router.post('/login/start', authenticationStart);
router.post('/login/finish', verifyAuthentication);

router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('token', token);
  if (!token) {
    console.error('No token provided');
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      console.error('User not found');
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    res.send({ user });
  } catch (error) {
    console.error(error);
    res.status(401).send({ error: 'Unauthorized' });
  }
});

export default router;