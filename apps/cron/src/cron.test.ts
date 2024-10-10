import { validateDailyCronSchedule } from "./main";

jest.mock("back", () => ({
  initSentry: jest.fn()
}));

jest.mock("./commands/appendix1.helpers", () => ({
  cleanUnusedAppendix1ProducerBsdds: jest.fn(() => Promise.resolve())
}));

describe("validateDailyCronSchedule", () => {
  it("should throw error when invalid quartz expression", () => {
    expect(() => validateDailyCronSchedule("80 8 * * *")).toThrow(
      "Invalid CRON expression : 80 8 * * *"
    );
  });

  it("should throw an error if valid CRON expression but not set to run once every day", () => {
    // At 00:00 on day-of-month 1.
    const everyFistOfMonthAtMidnight = "* * 1 * *";
    expect(() => validateDailyCronSchedule(everyFistOfMonthAtMidnight)).toThrow(
      "CRON expression should be set to run once every day : {m} {h} * * *"
    );
  });

  it("should return true for valid expression", () => {
    expect(validateDailyCronSchedule("8 8 * * *")).toEqual(true);
    expect(validateDailyCronSchedule("08 08 * * *")).toEqual(true);
  });
});
