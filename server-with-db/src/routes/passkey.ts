import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { deletePasskey, recoverStart, recoverVerify, startRegister, updatePasskey, verifyRegistration } from '../controllers/passkeys.controller';

const router = express.Router();

router.put('/:id', authMiddleware, updatePasskey);
router.delete('/:id', authMiddleware, deletePasskey);

router.post('/new', authMiddleware, startRegister);
router.post('/new/finish', authMiddleware, verifyRegistration);

router.post('/recover/start', recoverStart);
router.post('/recover/finish', recoverVerify);

export default router;