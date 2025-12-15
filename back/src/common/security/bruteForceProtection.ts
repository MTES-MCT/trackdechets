import { redisClient, generateKey } from "../redis";
import { addSeconds } from "date-fns";
import { TooManyRequestsError } from "../errors";

/**
 * Configuration options for brute force protection
 */
export interface BruteForceConfig {
  /** Maximum number of failed attempts allowed */
  maxAttempts: number;
  /** Base lockout time in seconds for the first lockout */
  baseLockoutSeconds: number;
  /** Multiplier for increasing lockout time on repeated failures */
  lockoutMultiplier: number;
  /** Maximum lockout time in seconds */
  maxLockoutSeconds: number;
  /** Time window in seconds for attempt counting */
  attemptWindowSeconds: number;
}

/**
 * Default configuration for brute force protection
 */
export const DEFAULT_BRUTE_FORCE_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  baseLockoutSeconds: 5,
  lockoutMultiplier: 2,
  maxLockoutSeconds: 300, // 5 minutes
  attemptWindowSeconds: 900 // 15 minutes
};

/**
 * Security code brute force protection configuration
 * More restrictive than default
 */
export const SECURITY_CODE_BRUTE_FORCE_CONFIG: BruteForceConfig = {
  maxAttempts: 3,
  baseLockoutSeconds: 10,
  lockoutMultiplier: 3,
  maxLockoutSeconds: 1800, // 30 minutes
  attemptWindowSeconds: 1800 // 30 minutes
};

/**
 * Brute force protection status
 */
export interface BruteForceStatus {
  isBlocked: boolean;
  remainingAttempts?: number;
  blockedUntil?: Date;
  nextRetryAllowed?: Date;
}

/**
 * Generate Redis keys for brute force protection
 */
function generateBruteForceKeys(identifier: string, action: string) {
  const baseKey = generateKey("brute_force", `${action}:${identifier}`);
  return {
    attemptsKey: `${baseKey}:attempts`,
    lockoutKey: `${baseKey}:lockout`,
    firstAttemptKey: `${baseKey}:first_attempt`
  };
}

/**
 * Generic brute force protection service
 */
export class BruteForceProtectionService {
  private config: BruteForceConfig;

  constructor(config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG) {
    this.config = config;
  }

  /**
   * Check if an identifier is currently blocked for a specific action
   */
  async isBlocked(
    identifier: string,
    action: string
  ): Promise<BruteForceStatus> {
    const { lockoutKey, attemptsKey } = generateBruteForceKeys(
      identifier,
      action
    );

    // Check if currently locked out
    const lockoutData = await redisClient.get(lockoutKey);
    if (lockoutData) {
      const lockoutInfo = JSON.parse(lockoutData) as { until: number };
      const blockedUntil = new Date(lockoutInfo.until);

      if (blockedUntil > new Date()) {
        return {
          isBlocked: true,
          blockedUntil,
          nextRetryAllowed: blockedUntil
        };
      }

      // Lockout expired, clean up
      await redisClient.del(lockoutKey);
    }

    // Check current attempts within the window
    const attempts = await redisClient.get(attemptsKey);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    return {
      isBlocked: false,
      remainingAttempts: Math.max(0, this.config.maxAttempts - currentAttempts)
    };
  }

  /**
   * Record a failed attempt and potentially trigger lockout
   */
  async recordFailedAttempt(
    identifier: string,
    action: string
  ): Promise<BruteForceStatus> {
    const { attemptsKey, firstAttemptKey } = generateBruteForceKeys(
      identifier,
      action
    );

    // Check if already locked out
    const currentStatus = await this.isBlocked(identifier, action);
    if (currentStatus.isBlocked) {
      return currentStatus;
    }

    // Record the attempt timestamp for the window
    const pipeline = redisClient.pipeline();

    // Increment attempts counter
    pipeline.incr(attemptsKey);

    // Set expiration for attempts counter if this is the first attempt in the window
    const attempts = await redisClient.get(attemptsKey);
    if (!attempts || parseInt(attempts, 10) === 0) {
      pipeline.expire(attemptsKey, this.config.attemptWindowSeconds);
      pipeline.set(
        firstAttemptKey,
        Date.now(),
        "EX",
        this.config.attemptWindowSeconds
      );
    }

    const results = await pipeline.exec();
    const newAttemptCount = results[0][1] as number;

    // Check if we should trigger lockout
    if (newAttemptCount >= this.config.maxAttempts) {
      return await this.triggerLockout(identifier, action, newAttemptCount);
    }

    return {
      isBlocked: false,
      remainingAttempts: this.config.maxAttempts - newAttemptCount
    };
  }

  /**
   * Trigger a lockout for repeated failures
   */
  private async triggerLockout(
    identifier: string,
    action: string,
    totalAttempts: number
  ): Promise<BruteForceStatus> {
    const { lockoutKey, attemptsKey } = generateBruteForceKeys(
      identifier,
      action
    );

    // Calculate lockout duration based on number of failed attempts
    const lockoutFactor = Math.max(
      1,
      totalAttempts - this.config.maxAttempts + 1
    );
    const lockoutDuration = Math.min(
      this.config.baseLockoutSeconds *
        Math.pow(this.config.lockoutMultiplier, lockoutFactor - 1),
      this.config.maxLockoutSeconds
    );

    const blockedUntil = addSeconds(new Date(), lockoutDuration);

    // Store lockout information
    const lockoutInfo = {
      until: blockedUntil.getTime(),
      attempts: totalAttempts,
      duration: lockoutDuration
    };

    await redisClient.setex(
      lockoutKey,
      lockoutDuration,
      JSON.stringify(lockoutInfo)
    );

    // Clean up attempts counter since we're now in lockout
    await redisClient.del(attemptsKey);

    return {
      isBlocked: true,
      blockedUntil,
      nextRetryAllowed: blockedUntil
    };
  }

  /**
   * Reset all failed attempts for an identifier and action (e.g., after successful attempt)
   */
  async resetAttempts(identifier: string, action: string): Promise<void> {
    const { attemptsKey, lockoutKey, firstAttemptKey } = generateBruteForceKeys(
      identifier,
      action
    );

    await redisClient.del(attemptsKey, lockoutKey, firstAttemptKey);
  }

  /**
   * Get detailed status for an identifier and action
   */
  async getDetailedStatus(
    identifier: string,
    action: string
  ): Promise<
    BruteForceStatus & {
      currentAttempts: number;
      windowStartedAt?: Date;
    }
  > {
    const status = await this.isBlocked(identifier, action);
    const { attemptsKey, firstAttemptKey } = generateBruteForceKeys(
      identifier,
      action
    );

    const attempts = await redisClient.get(attemptsKey);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    const firstAttemptTime = await redisClient.get(firstAttemptKey);
    const windowStartedAt = firstAttemptTime
      ? new Date(parseInt(firstAttemptTime, 10))
      : undefined;

    return {
      ...status,
      currentAttempts,
      windowStartedAt
    };
  }
}

/**
 * Default instance for security code protection
 */
export const securityCodeBruteForceProtection = new BruteForceProtectionService(
  SECURITY_CODE_BRUTE_FORCE_CONFIG
);

/**
 * Helper function to protect a security code validation
 */
export async function protectSecurityCodeValidation<T>(
  identifier: string,
  validationFn: () => Promise<T>,
  options: {
    action?: string;
    service?: BruteForceProtectionService;
  } = {}
): Promise<T> {
  const {
    action = "security_code_validation",
    service = securityCodeBruteForceProtection
  } = options;

  // Check if currently blocked
  const status = await service.isBlocked(identifier, action);
  if (status.isBlocked) {
    const lockoutSeconds = Math.ceil(
      (status.blockedUntil!.getTime() - Date.now()) / 1000
    );
    throw new TooManyRequestsError(
      `Trop de tentatives de validation du code de sécurité. Compte bloqué pendant ${lockoutSeconds} secondes.`
    );
  }

  // CRITICAL SECURITY: Record the attempt BEFORE running validation
  // This ensures that even during rate limiting, we don't reveal if the code is correct
  const preAttemptStatus = await service.recordFailedAttempt(
    identifier,
    action
  );

  // If this attempt would trigger a lockout, block immediately without validation
  if (preAttemptStatus.isBlocked) {
    const lockoutSeconds = Math.ceil(
      (preAttemptStatus.blockedUntil!.getTime() - Date.now()) / 1000
    );
    throw new TooManyRequestsError(
      `Trop de tentatives de validation du code de sécurité. Compte bloqué pendant ${lockoutSeconds} secondes.`
    );
  }

  try {
    // Only attempt validation if we're not rate limited
    const result = await validationFn();

    // Success - reset attempts (this removes the pre-recorded failed attempt)
    await service.resetAttempts(identifier, action);

    return result;
  } catch (error) {
    // Validation failed - the failed attempt was already recorded above
    // Just enhance the error message with remaining attempts info
    if (
      preAttemptStatus.remainingAttempts !== undefined &&
      preAttemptStatus.remainingAttempts > 0
    ) {
      const originalMessage = error.message || "Validation échouée";
      error.message = `${originalMessage} (${preAttemptStatus.remainingAttempts} tentative(s) restante(s))`;
    }

    throw error;
  }
}
