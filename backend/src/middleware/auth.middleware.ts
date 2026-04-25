import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Not authorised — no token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error: unknown) {
    // Distinguish between expired vs invalid for better client UX
    const message =
      error instanceof Error && error.name === 'TokenExpiredError'
        ? 'Token expired — please refresh'
        : 'Not authorised — invalid token';
    sendError(res, message, 401);
  }
};
