import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { isOtpConfigured } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';
import { generateOtpCode, hashOtp, sendMobileOtp } from '../services/otpService.js';

const BCRYPT_ROUNDS = 12;

export const register = asyncHandler(async (req, res) => {
  const { name, mobile, password, role, isDirectOwnerDeclared } = req.body;

  // Extra defense-in-depth: never allow admin role via public registration
  const safeRole = role === 'owner' ? 'owner' : 'seeker';

  const existing = await User.findOne({ mobile });
  if (existing) {
    throw new AppError('An account with this mobile number already exists. Please log in.', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    name,
    mobile,
    passwordHash,
    role: safeRole,
    phoneVerified: false,
    accountStatus: 'active',
    isDirectOwnerDeclared: safeRole === 'owner' ? Boolean(isDirectOwnerDeclared) : false,
  });

  const token = signToken(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: {
      token,
      user: user.toSafeObject(),
      otpEnabled: isOtpConfigured(),
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { mobile, password } = req.body;

  const user = await User.findOne({ mobile }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid mobile number or password', 401);
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError(
      'This account has been suspended by RoomKhoj moderation. Please contact support.',
      403
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid mobile number or password', 401);
  }

  const token = signToken(user);

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: {
      token,
      user: user.toSafeObject(),
      otpEnabled: isOtpConfigured(),
    },
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    data: {
      user: req.user.toSafeObject(),
      otpEnabled: isOtpConfigured(),
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, upgradeToOwner, isDirectOwnerDeclared } = req.body;

  if (name) {
    req.user.name = name;
  }

  if (upgradeToOwner && req.user.role === 'seeker') {
    if (!isDirectOwnerDeclared) {
      throw new AppError(
        'You must confirm you are a direct property owner and not a broker or agent.',
        400
      );
    }
    req.user.role = 'owner';
    req.user.isDirectOwnerDeclared = true;
  }

  await req.user.save();

  return sendSuccess(res, {
    message: 'Profile updated successfully',
    data: {
      user: req.user.toSafeObject(),
      otpEnabled: isOtpConfigured(),
    },
  });
});

export const sendOtp = asyncHandler(async (req, res) => {
  if (req.user.phoneVerified) {
    return sendSuccess(res, {
      message: 'Mobile number is already verified',
      data: { phoneVerified: true },
    });
  }

  const code = generateOtpCode();
  await sendMobileOtp(req.user.mobile, code);

  await User.findByIdAndUpdate(req.user._id, {
    otpHash: hashOtp(code),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  return sendSuccess(res, {
    message: 'Verification OTP sent to your registered mobile number',
    data: { expiresInSeconds: 600 },
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  if (!isOtpConfigured()) {
    throw new AppError('Mobile OTP verification is not configured on this server.', 503);
  }

  const { otp } = req.body;
  const user = await User.findById(req.user._id).select('+otpHash +otpExpiresAt');

  if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new AppError('OTP has expired or was not requested. Request a new code.', 400);
  }

  if (hashOtp(otp) !== user.otpHash) {
    throw new AppError('Invalid verification code. Please check and try again.', 400);
  }

  user.phoneVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return sendSuccess(res, {
    message: 'Mobile number verified successfully',
    data: { user: user.toSafeObject() },
  });
});
