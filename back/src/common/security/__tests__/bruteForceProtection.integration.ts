import { resetDatabase } from "../../../../integration-tests/helper";
import { redisClient } from "../../redis";
import {
  BruteForceProtectionService,
  DEFAULT_BRUTE_FORCE_CONFIG,
  SECURITY_CODE_BRUTE_FORCE_CONFIG,
  securityCodeBruteForceProtection,
  protectSecurityCodeValidation
} from "../bruteForceProtection";
import { TooManyRequestsError } from "../../errors";

describe("BruteForceProtectionService", () => {
  let service: BruteForceProtectionService;
  const testIdentifier = "test-company-123";
  const testAction = "test-action";

  beforeEach(async () => {
    await resetDatabase();
    await redisClient.flushdb(); // Clean Redis cache
    service = new BruteForceProtectionService(DEFAULT_BRUTE_FORCE_CONFIG);
  });

  afterAll(async () => {
    await redisClient.flushdb();
  });

  describe("isBlocked", () => {
    it("should return not blocked for first check", async () => {
      const status = await service.isBlocked(testIdentifier, testAction);

      expect(status.isBlocked).toBe(false);
      expect(status.remainingAttempts).toBe(
        DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts
      );
    });

    it("should return blocked status when locked out", async () => {
      // Record enough failed attempts to trigger lockout
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        await service.recordFailedAttempt(testIdentifier, testAction);
      }

      const status = await service.isBlocked(testIdentifier, testAction);

      expect(status.isBlocked).toBe(true);
      expect(status.blockedUntil).toBeDefined();
      expect(status.blockedUntil).toBeInstanceOf(Date);
      expect(status.blockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("recordFailedAttempt", () => {
    it("should track failed attempts correctly", async () => {
      // First attempt
      const status1 = await service.recordFailedAttempt(
        testIdentifier,
        testAction
      );
      expect(status1.isBlocked).toBe(false);
      expect(status1.remainingAttempts).toBe(
        DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts - 1
      );

      // Second attempt
      const status2 = await service.recordFailedAttempt(
        testIdentifier,
        testAction
      );
      expect(status2.isBlocked).toBe(false);
      expect(status2.remainingAttempts).toBe(
        DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts - 2
      );
    });

    it("should trigger lockout after max attempts", async () => {
      let lastStatus;

      // Record max attempts
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        lastStatus = await service.recordFailedAttempt(
          testIdentifier,
          testAction
        );
      }

      expect(lastStatus!.isBlocked).toBe(true);
      expect(lastStatus!.blockedUntil).toBeDefined();
    });

    it("should not record additional attempts when already blocked", async () => {
      // Trigger lockout
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        await service.recordFailedAttempt(testIdentifier, testAction);
      }

      const initialStatus = await service.isBlocked(testIdentifier, testAction);

      // Try to record another attempt
      const newStatus = await service.recordFailedAttempt(
        testIdentifier,
        testAction
      );

      expect(newStatus.isBlocked).toBe(true);
      expect(newStatus.blockedUntil?.getTime()).toBe(
        initialStatus.blockedUntil?.getTime()
      );
    });
  });

  describe("resetAttempts", () => {
    it("should clear failed attempts", async () => {
      // Record some failed attempts
      await service.recordFailedAttempt(testIdentifier, testAction);
      await service.recordFailedAttempt(testIdentifier, testAction);

      // Reset attempts
      await service.resetAttempts(testIdentifier, testAction);

      // Check that attempts were reset
      const status = await service.isBlocked(testIdentifier, testAction);
      expect(status.isBlocked).toBe(false);
      expect(status.remainingAttempts).toBe(
        DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts
      );
    });

    it("should clear lockout", async () => {
      // Trigger lockout
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        await service.recordFailedAttempt(testIdentifier, testAction);
      }

      // Verify locked
      const lockedStatus = await service.isBlocked(testIdentifier, testAction);
      expect(lockedStatus.isBlocked).toBe(true);

      // Reset attempts
      await service.resetAttempts(testIdentifier, testAction);

      // Verify unlocked
      const unlockedStatus = await service.isBlocked(
        testIdentifier,
        testAction
      );
      expect(unlockedStatus.isBlocked).toBe(false);
    });
  });

  describe("getDetailedStatus", () => {
    it("should provide detailed status information", async () => {
      // Record some attempts
      await service.recordFailedAttempt(testIdentifier, testAction);

      const detailedStatus = await service.getDetailedStatus(
        testIdentifier,
        testAction
      );

      expect(detailedStatus.isBlocked).toBe(false);
      expect(detailedStatus.currentAttempts).toBe(1);
      expect(detailedStatus.windowStartedAt).toBeDefined();
      expect(detailedStatus.remainingAttempts).toBe(
        DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts - 1
      );
    });
  });

  describe("lockout timing", () => {
    it("should respect lockout multiplier configuration", async () => {
      const customConfig = {
        ...DEFAULT_BRUTE_FORCE_CONFIG,
        baseLockoutSeconds: 1,
        lockoutMultiplier: 2,
        attemptWindowSeconds: 60
      };
      const customService = new BruteForceProtectionService(customConfig);

      // Trigger lockout
      for (let i = 0; i < customConfig.maxAttempts; i++) {
        await customService.recordFailedAttempt(testIdentifier, testAction);
      }

      const lockoutStatus = await customService.isBlocked(
        testIdentifier,
        testAction
      );
      expect(lockoutStatus.isBlocked).toBe(true);
      expect(lockoutStatus.blockedUntil).toBeDefined();

      // Verify lockout duration is at least the base duration
      const lockoutDuration =
        lockoutStatus.blockedUntil!.getTime() - Date.now();
      expect(lockoutDuration).toBeGreaterThan(500); // Should be at least base duration minus some buffer
      expect(lockoutDuration).toBeLessThan(5000); // Should be reasonable
    });
  });

  describe("different identifiers and actions", () => {
    it("should track different identifiers separately", async () => {
      const identifier1 = "company-1";
      const identifier2 = "company-2";

      // Block identifier1
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        await service.recordFailedAttempt(identifier1, testAction);
      }

      const status1 = await service.isBlocked(identifier1, testAction);
      const status2 = await service.isBlocked(identifier2, testAction);

      expect(status1.isBlocked).toBe(true);
      expect(status2.isBlocked).toBe(false);
    });

    it("should track different actions separately", async () => {
      const action1 = "action-1";
      const action2 = "action-2";

      // Block for action1
      for (let i = 0; i < DEFAULT_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        await service.recordFailedAttempt(testIdentifier, action1);
      }

      const status1 = await service.isBlocked(testIdentifier, action1);
      const status2 = await service.isBlocked(testIdentifier, action2);

      expect(status1.isBlocked).toBe(true);
      expect(status2.isBlocked).toBe(false);
    });
  });
});

describe("Security Code Brute Force Protection", () => {
  const testSiret = "12345678901234";

  beforeEach(async () => {
    await resetDatabase();
    await redisClient.flushdb();
  });

  afterAll(async () => {
    await redisClient.flushdb();
  });

  describe("protectSecurityCodeValidation", () => {
    it("should allow successful validation and reset attempts", async () => {
      const mockValidation = jest.fn(async () => {
        return "success";
      });

      const result = await protectSecurityCodeValidation(
        testSiret,
        mockValidation
      );

      expect(result).toBe("success");
      expect(mockValidation).toHaveBeenCalledTimes(1);

      // Verify attempts were reset
      const status = await securityCodeBruteForceProtection.getDetailedStatus(
        testSiret,
        "security_code_validation"
      );
      expect(status.currentAttempts).toBe(0);
    });

    it("should record failed attempts and provide attempt info", async () => {
      const mockValidation = jest.fn(async () => {
        throw new Error("Invalid security code");
      });

      // First failed attempt
      try {
        await protectSecurityCodeValidation(testSiret, mockValidation);
      } catch (error) {
        expect(error.message).toContain("Invalid security code");
        expect(error.message).toContain("2 tentative(s) restante(s)");
      }

      // Second failed attempt
      try {
        await protectSecurityCodeValidation(testSiret, mockValidation);
      } catch (error) {
        expect(error.message).toContain("Invalid security code");
        expect(error.message).toContain("1 tentative(s) restante(s)");
      }

      expect(mockValidation).toHaveBeenCalledTimes(2);
    });

    it("should block after max attempts", async () => {
      const mockValidation = jest.fn(async () => {
        throw new Error("Invalid security code");
      });

      // Exhaust all attempts
      for (let i = 0; i < SECURITY_CODE_BRUTE_FORCE_CONFIG.maxAttempts; i++) {
        try {
          await protectSecurityCodeValidation(testSiret, mockValidation);
        } catch (error) {
          if (i === SECURITY_CODE_BRUTE_FORCE_CONFIG.maxAttempts - 1) {
            expect(error.message).toContain(
              "Trop de tentatives de validation du code de sécurité"
            );
            expect(error.message).toContain("bloqué pendant");
            expect(error).toBeInstanceOf(TooManyRequestsError);
          }
        }
      }

      // Next attempt should be blocked immediately
      try {
        await protectSecurityCodeValidation(testSiret, mockValidation);
        fail("Should have thrown TooManyRequestsError");
      } catch (error) {
        expect(error).toBeInstanceOf(TooManyRequestsError);
        expect(error.message).toContain(
          "Trop de tentatives de validation du code de sécurité"
        );
        expect(error.message).toContain("bloqué pendant");
      }
    });

    it("should use custom action and service", async () => {
      const customService = new BruteForceProtectionService({
        maxAttempts: 2,
        baseLockoutSeconds: 1,
        lockoutMultiplier: 1,
        maxLockoutSeconds: 60,
        attemptWindowSeconds: 300
      });

      const mockValidation = jest.fn(async () => {
        throw new Error("Test error");
      });

      // Should be blocked after 2 attempts instead of 3
      for (let i = 0; i < 2; i++) {
        try {
          await protectSecurityCodeValidation(testSiret, mockValidation, {
            action: "custom_action",
            service: customService
          });
        } catch (error) {
          if (i === 1) {
            expect(error).toBeInstanceOf(TooManyRequestsError);
          }
        }
      }

      // The validation function is only called once because the second
      // attempt triggers lockout before validation
      expect(mockValidation).toHaveBeenCalledTimes(1);
    });
  });
});
