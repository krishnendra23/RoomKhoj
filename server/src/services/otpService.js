import crypto from 'crypto';
import { env, isOtpConfigured } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/**
 * Sends an SMS OTP through the configured provider (e.g. Twilio).
 * Never simulates OTP delivery when unconfigured.
 */
export async function sendMobileOtp(mobile, code) {
  if (!isOtpConfigured()) {
    throw new AppError(
      'Mobile OTP verification is not configured on this server. Configure OTP_PROVIDER and provider credentials in server/.env.',
      503
    );
  }

  if (env.otp.provider === 'twilio') {
    const auth = Buffer.from(`${env.otp.twilioAccountSid}:${env.otp.twilioAuthToken}`).toString(
      'base64'
    );
    const body = new URLSearchParams({
      To: `+91${mobile}`,
      From: env.otp.twilioPhoneNumber,
      Body: `Your RoomKhoj verification code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.otp.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(`Failed to dispatch OTP via Twilio: ${errText}`, 502);
    }

    return { delivered: true, provider: 'twilio' };
  }

  throw new AppError(`Unsupported OTP provider: ${env.otp.provider}`, 503);
}
