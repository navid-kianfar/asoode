import { createHash } from 'crypto';
import type { CaptchaPayload } from '@asoode/shared';

const MIN_FORM_TIME_MS = 2000; // 2 seconds minimum

/**
 * Validates the three-layer captcha:
 * 1. Honeypot must be empty
 * 2. Form must have been loaded at least 2 seconds ago
 * 3. Proof-of-work hash must start with N leading zeros
 */
export function validateCaptcha(
  captcha: CaptchaPayload | undefined,
  expectedPrefix: string | null,
  expectedDifficulty: number,
): { valid: boolean; reason?: string } {
  // If no captcha payload, allow through (graceful degradation)
  if (!captcha) {
    return { valid: true };
  }

  // Layer 1: Honeypot — must be empty (hard reject if filled)
  if (captcha.honeypot) {
    return { valid: false, reason: 'CAPTCHA_HONEYPOT' };
  }

  // Layer 2: Timing — form must have been loaded for at least MIN_FORM_TIME_MS
  if (captcha.formLoadedAt) {
    const elapsed = Date.now() - captcha.formLoadedAt;
    if (elapsed < MIN_FORM_TIME_MS) {
      return { valid: false, reason: 'CAPTCHA_TOO_FAST' };
    }
  }

  // Layer 3: Proof-of-work — only validate if both prefix and nonce are provided
  if (captcha.powPrefix && captcha.powNonce) {
    if (expectedPrefix && captcha.powPrefix !== expectedPrefix) {
      return { valid: false, reason: 'CAPTCHA_POW_INVALID_PREFIX' };
    }

    const hash = createHash('sha256')
      .update(captcha.powPrefix + captcha.powNonce)
      .digest('hex');

    const requiredPrefix = '0'.repeat(expectedDifficulty);
    if (!hash.startsWith(requiredPrefix)) {
      return { valid: false, reason: 'CAPTCHA_POW_INVALID' };
    }
  }

  return { valid: true };
}

/**
 * Generates a random prefix for proof-of-work challenges.
 */
export function generateChallengePrefix(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .slice(0, 16);
}
