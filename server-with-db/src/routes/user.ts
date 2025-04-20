import express from 'express';
import { getUser } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/me/:id', authMiddleware, getUser);

export default router;