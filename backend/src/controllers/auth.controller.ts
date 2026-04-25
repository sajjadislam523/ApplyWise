import { Request, Response } from 'express';
import User from '../models/User.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { sendWelcomeEmail } from '../utils/email';

// ─── POST /api/auth/register ───────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'Name, email and password are required', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists', 409);
  }

  // Password is hashed in the pre-save hook on the model
  const user = await User.create({ name, email, password });

  const accessToken  = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email });

  // Persist refresh token hash in DB (rotate on every refresh)
  await User.findByIdAndUpdate(user.id, { refreshToken });

  // Fire-and-forget — email failure never blocks the registration response
  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error('[Auth] Welcome email failed:', err)
  );

  return sendSuccess(
    res,
    { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken },
    'Account created successfully',
    201
  );
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  // Explicitly select password — it's excluded by default in the model
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    // Generic message — never reveal whether email exists
    return sendError(res, 'Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const accessToken  = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email });

  await User.findByIdAndUpdate(user.id, { refreshToken });

  return sendSuccess(res, {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return sendError(res, 'Refresh token required', 400);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  // Verify the token matches what's stored — prevents token reuse after logout
  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    return sendError(res, 'Refresh token revoked', 401);
  }

  const newAccessToken  = signAccessToken({ id: user.id, email: user.email });
  const newRefreshToken = signRefreshToken({ id: user.id, email: user.email });

  await User.findByIdAndUpdate(user.id, { refreshToken: newRefreshToken });

  return sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    // Invalidate the stored token — prevents further refreshes
    await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
  }
  return sendSuccess(res, null, 'Logged out successfully');
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { id: user.id, name: user.name, email: user.email });
});
