import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Rate limit auth routes — 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts — please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Requesting a link sends an email, so it is capped hard — an unthrottled
// endpoint here is a way to spam somebody's inbox.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many reset requests — please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Submitting the new password sends nothing, and the token already carries 256
// bits of entropy, so this limit is only general abuse protection. It must stay
// loose enough that mistyping the confirmation field a few times does not lock
// someone out for an hour while holding a valid link.
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts — please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/refresh',  refreshAccessToken);
router.post('/logout',   logout);
router.get('/me',        protect, getMe);

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password',  resetPasswordLimiter,  resetPassword);

export default router;
