import { ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { animationFrameProvider } from 'rxjs/internal/scheduler/animationFrameProvider';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET!;
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

export function encrypt(data: string) {
  try {
    const iv = crypto.randomBytes(12); // 12 bytes for GCM
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const token = Buffer.concat([iv, authTag, encrypted])
      .toString('base64')
      .replace(/\+/g, '-') // + → -
      .replace(/\//g, '_') // / → _
      .replace(/=/g, '');

    return token;
  } catch (error) {
    console.log(error);
  }
}

export function decrypt(token: string) {
  if (!token || token === 'null' || token === 'undefined') {
    throw new ForbiddenException('OTP is not valid');
  }

  const normalizedToken = token
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(token.length + ((4 - (token.length % 4)) % 4), '=');

  const raw = Buffer.from(normalizedToken, 'base64');

  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  const data = decrypted.toString();

  return data;
}
