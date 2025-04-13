import express from 'express';
import { prismaClient } from '../client';
import { authenticationStart, registrationStart, verifyAuthentication, verifyRegistration } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register/start', registrationStart);
router.post('/register/finish', verifyRegistration);

router.post('/login/start', authenticationStart);
router.post('/login/finish', verifyAuthentication);

export default router;