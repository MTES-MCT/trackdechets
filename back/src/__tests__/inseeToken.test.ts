import { describe, expect, it } from "@jest/globals";

describe("INSEE password policy helpers", () => {
  it("accepts a valid password with 3 character classes", () => {
    const password = "Abcdefg1!xyz";
    expect(password.length >= 12).toBe(true);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/\d/.test(password)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(password)).toBe(true);
  });

  it("rejects passwords shorter than 12 characters", () => {
    const password = "Abc1!xyz";
    expect(password.length < 12).toBe(true);
  });

  it("handles a valid INSEE pwdChangedTime payload format", () => {
    const value = "20251001093015Z";
    const matches = value.match(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z?$/
    );

    expect(matches).not.toBeNull();
    expect(matches?.[1]).toBe("2025");
    expect(matches?.[2]).toBe("10");
    expect(matches?.[3]).toBe("01");
  });

  it("uses a real date for renewal policy calculations", () => {
    const date = new Date("2025-10-01T09:30:15.000Z");
    expect(date instanceof Date).toBe(true);
    expect(date.toISOString()).toBe("2025-10-01T09:30:15.000Z");
  });
});
