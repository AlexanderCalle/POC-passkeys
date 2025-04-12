import express from 'express';
import { prismaClient } from '../client';
import { registrationStart, verifyRegistration } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register/start', registrationStart);
router.post('/register/finish', verifyRegistration);

export default router;