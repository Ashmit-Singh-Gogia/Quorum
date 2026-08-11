import { loginController, signup, getMe } from './auth.controller.js'
import { authenticate } from './auth.middleware.js';
import { Router } from 'express'
const router = Router();

router.post('/signup', signup);
router.post('/login', loginController)
router.get('/me', authenticate, getMe)

export default router;