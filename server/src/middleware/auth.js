import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Strict JWT authentication middleware.
 * Always re-fetches user from DB so suspended accounts and role changes take effect immediately.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError('Session expired or invalid token. Please log in again.', 401);
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new AppError('Account no longer exists.', 401);
    }
    if (user.accountStatus === 'suspended') {
      throw new AppError('Your account has been suspended. Contact RoomKhoj support.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication for public endpoints (e.g., property detail showing saved favourite status).
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (user && user.accountStatus === 'active') {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens on public endpoints
  }
  return next();
}

/**
 * Role-based authorization middleware. Never trusts frontend role claims.
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
}
