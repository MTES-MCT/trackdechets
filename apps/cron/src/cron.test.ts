import { validateOnbardingCronSchedule } from "./main";

jest.mock("back", () => ({
  initSentry: jest.fn()
}));

jest.mock("./commands/appendix1.helpers", () => ({
  cleanUnusedAppendix1ProducerBsdds: jest.fn(() => Promise.resolve())
}));

describe("validateOnbardingCronSchedule", () => {
  it("should throw error when invalid quartz expression", () => {
    expect(() => validateOnbardingCronSchedule("80 8 * * *")).toThrow(
      "Invalid CRON expression : 80 8 * * *"
    );
  });

  it("should throw an error if valid CRON expression but not set to run once every day", () => {
    // At 00:00 on day-of-month 1.
    const everyFistOfMonthAtMidnight = "* * 1 * *";
    expect(() =>
      validateOnbardingCronSchedule(everyFistOfMonthAtMidnight)
    ).toThrow(
      "CRON expression should be set to run once every day : {m} {h} * * *"
    );
  });

  it("should return true for valid expression", () => {
    expect(validateOnbardingCronSchedule("8 8 * * *")).toEqual(true);
    expect(validateOnbardingCronSchedule("08 08 * * *")).toEqual(true);
  });
});
