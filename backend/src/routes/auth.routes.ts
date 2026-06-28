import { Router } from 'express';
import { signupAdmin, login, refreshToken, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup-admin', signupAdmin);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
