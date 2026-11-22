import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'roomkhoj-dev-only-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  storageProvider: (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  otp: {
    provider: (process.env.OTP_PROVIDER || '').toLowerCase(),
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
};

export function isCloudinaryConfigured() {
  return Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret &&
      !env.cloudinary.cloudName.startsWith('your_')
  );
}

export function isOtpConfigured() {
  if (env.otp.provider === 'twilio') {
    return Boolean(
      env.otp.twilioAccountSid && env.otp.twilioAuthToken && env.otp.twilioPhoneNumber
    );
  }
  return false;
}
