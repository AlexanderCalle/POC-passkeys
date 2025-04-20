import express from 'express';
import { getUser } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me/:id', authMiddleware, getUser);

export default router;