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
  if (!token) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    res.send({ user });
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized' });
  }
});

export default router;